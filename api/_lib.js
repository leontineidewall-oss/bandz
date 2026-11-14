const B58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const env = k => (process.env[k] || "").trim();
const num = (v, d, lo, hi) => { const n = Number(v); return isFinite(n) && n >= lo && n <= hi ? n : d; };
const cfg = () => {
  const mint = env("BANDZ_MINT"), safe = env("SAFEHOUSE_WALLET") || env("FEE_WALLET");
  return {
    mint: B58.test(mint) ? mint : null,
    safehouse: B58.test(safe) ? safe : null,
    min: num(env("BANDZ_MIN") || 100000, 100000, 1, 1e12),
    every: num(env("PAYDAY_HOURS") || 6, 6, 1, 168),
    exclude: env("EXCLUDE").split(/[\s,]+/).filter(x => B58.test(x)),
  };
};
const rpcUrl = () => env("RPC_URL") || "https://api.mainnet-beta.solana.com";
async function get(url, opt = {}, ms = 9000) {
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), ms);
  try {
    const r = await fetch(url, { redirect: "follow", ...opt, signal: ac.signal, headers: { "user-agent": "bandz-site/1.0", accept: "application/json", ...(opt.headers || {}) } });
    if (!r.ok) { const e = new Error("upstream " + r.status); e.status = r.status; throw e; }
    return await r.json();
  } finally { clearTimeout(t); }
}
async function rpc(method, params, ms = 12000) {
  for (let i = 0; i < 3; i++) {
    try {
      const j = await get(rpcUrl(), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) }, ms);
      if (j.error) throw new Error("rpc " + (j.error.code || ""));
      return j.result;
    } catch (e) { if (i === 2) throw e; await new Promise(r => setTimeout(r, 250 * (i + 1))); }
  }
}
async function pool(items, n, fn) {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); } }));
  return out;
}
// heat: 0-5 stars from the last hour's buys and sells
function heat(b, s) {
  b = Number(b) || 0; s = Number(s) || 0; const t = b + s;
  if (t < 6) return 0;
  const r = s / t;
  return r < 0.45 ? 0 : r < 0.52 ? 1 : r < 0.58 ? 2 : r < 0.64 ? 3 : r < 0.7 ? 4 : 5;
}
// pairs for the mint, biggest first (DexScreener)
async function pairs(mint) {
  const j = await get((env("DEX_BASE") || "https://api.dexscreener.com") + "/token-pairs/v1/solana/" + mint);
  const ps = (Array.isArray(j) ? j : []).filter(p => p && p.baseToken && p.baseToken.address === mint && B58.test(p.pairAddress || ""));
  ps.sort((a, b) => ((b.liquidity || {}).usd || 0) - ((a.liquidity || {}).usd || 0) || ((b.volume || {}).h24 || 0) - ((a.volume || {}).h24 || 0));
  return ps;
}
function send(res, code, body, age = 15) {
  res.statusCode = code;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", code === 200 && age > 0 ? "public, s-maxage=" + age + ", stale-while-revalidate=" + age * 3 : "no-store");
  res.end(JSON.stringify(body));
}
module.exports = { B58, env, cfg, rpc, get, pool, heat, pairs, send };
