// the crew: every wallet holding at least the floor. ?wallet= looks one up.
const { cfg, B58, send } = require("./_lib");
const { crew } = require("./_crew");
module.exports = async (req, res) => {
  const c = cfg(); if (!c.mint) return send(res, 200, { live: false }, 60);
  const q = new URL(req.url, "http://x").searchParams.get("wallet");
  if (q != null && !B58.test(q)) return send(res, 400, { error: "that is not a solana address" });
  try {
    const r = await crew();
    const out = { live: true, t: r.t, min: r.min, holders: r.holders, count: r.count, crewHeld: r.crewHeld, top: r.members.slice(0, 25) };
    if (q) { const i = r.members.findIndex(m => m.w === q), h = r.all.find(m => m.w === q);
      out.me = { w: q, rank: i >= 0 ? i + 1 : null, crew: i >= 0, amt: h ? h.amt : 0, share: i >= 0 && r.crewHeld ? h.amt / r.crewHeld : 0 }; }
    send(res, 200, out, q ? 30 : 60);
  } catch (e) { send(res, 502, { live: true, error: "crew unavailable" }); }
};
