// the last trades on the main pair: buys are jobs, sells are cops (GeckoTerminal)
const { cfg, pairs, get, env, B58, send } = require("./_lib");
const f = v => { const x = Number(v); return isFinite(x) ? x : null; };
module.exports = async (req, res) => {
  const { mint } = cfg();
  if (!mint) return send(res, 200, { live: false }, 60);
  try {
    const ps = await pairs(mint);
    if (!ps.length) return send(res, 200, { live: true, t: Date.now(), rows: [] }, 15);
    const j = await get((env("GT_BASE") || "https://api.geckoterminal.com/api/v2") + "/networks/solana/pools/" + ps[0].pairAddress + "/trades", { headers: { accept: "application/json;version=20230302" } });
    const rows = ((j && j.data) || []).map(d => d && d.attributes).filter(Boolean).map(a => {
      const k = a.kind === "buy" ? "buy" : a.kind === "sell" ? "sell" : null, t = Date.parse(a.block_timestamp);
      return { k, usd: f(a.volume_in_usd), amt: f(k === "buy" ? a.to_token_amount : a.from_token_amount), w: B58.test(a.tx_from_address || "") ? a.tx_from_address : null,
        t: isFinite(t) ? t : null, tx: /^[1-9A-HJ-NP-Za-km-z]{60,100}$/.test(a.tx_hash || "") ? a.tx_hash : null };
    }).filter(r => r.k && r.t && r.tx && r.usd != null).sort((a, b) => b.t - a.t).slice(0, 60);
    send(res, 200, { live: true, t: Date.now(), rows }, 10);
  } catch (e) { send(res, 502, { live: true, error: "jobs unavailable" }); }
};
