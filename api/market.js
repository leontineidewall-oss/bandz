// price, market cap and the heat (last hour's buys vs sells) from DexScreener
const { cfg, pairs, heat, send } = require("./_lib");
const n = v => (typeof v === "number" && isFinite(v) ? v : v != null && v !== "" && isFinite(+v) ? +v : null);
module.exports = async (req, res) => {
  const { mint } = cfg();
  if (!mint) return send(res, 200, { live: false }, 60);
  try {
    const ps = await pairs(mint);
    if (!ps.length) return send(res, 200, { live: true, t: Date.now(), pair: null }, 20);
    const p = ps[0], h1 = (p.txns || {}).h1 || {}, h24 = (p.txns || {}).h24 || {};
    const b = n(h1.buys) || 0, s = n(h1.sells) || 0, price = n(p.priceUsd), native = n(p.priceNative);
    send(res, 200, { live: true, t: Date.now(), pair: {
      addr: p.pairAddress, dex: p.dexId || null,
      url: typeof p.url === "string" && /^https:\/\/dexscreener\.com\//.test(p.url) ? p.url : null,
      price, mcap: n(p.marketCap != null ? p.marketCap : p.fdv), vol: n((p.volume || {}).h24), liq: n((p.liquidity || {}).usd),
      chg: n((p.priceChange || {}).h24), chg1: n((p.priceChange || {}).h1),
      sol: price && native && (p.quoteToken || {}).symbol === "SOL" ? price / native : null,
      h1: { buys: b, sells: s }, h24: { buys: n(h24.buys) || 0, sells: n(h24.sells) || 0 }, heat: heat(b, s),
    } }, 15);
  } catch (e) { send(res, 502, { live: true, error: "market unavailable" }); }
};
