const { cfg, send } = require("./_lib");
module.exports = (req, res) => { const c = cfg(); send(res, 200, { mint: c.mint, safehouse: c.safehouse, min: c.min, every: c.every }, 60); };
