// who gets what if payday ran now: the safehouse balance, split by bag size across the crew
const { cfg, rpc, send } = require("./_lib");
const { crew, split } = require("./_crew");
const RESERVE = 0.02, PER_TX = 18;
module.exports = async (req, res) => {
  const c = cfg(); if (!c.mint || !c.safehouse) return send(res, 200, { live: false }, 30);
  try {
    const [r, bal] = await Promise.all([crew(), rpc("getBalance", [c.safehouse, { commitment: "confirmed" }])]);
    const sol = ((bal && typeof bal.value === "number") ? bal.value : 0) / 1e9;
    let pot = Math.max(0, sol - RESERVE), list = split(r.members, pot);
    const fees = Math.ceil(list.length / PER_TX) * 0.00001; pot = Math.max(0, pot - fees); list = split(r.members, pot);
    send(res, 200, { live: true, t: Date.now(), safehouse: c.safehouse, balance: sol, reserve: RESERVE, pot, perTx: PER_TX, count: list.length, list }, 0);
  } catch (e) { send(res, 502, { live: true, error: "payroll unavailable" }); }
};
