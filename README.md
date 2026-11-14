# bandz

buys drop bandz. sells bring cops.

Live at https://bandzsol.vercel.app

Static page (index.html) plus Vercel functions in api/. No database and no keys on the server: everything is read from public data, and payday is signed by the safehouse wallet in the browser.

## Environment (Vercel, Settings, Environment Variables)

| name | what |
|---|---|
| BANDZ_MINT | the $BANDZ contract address |
| SAFEHOUSE_WALLET | the wallet that collects the creator fees and pays the crew |
| RPC_URL | a Solana RPC that allows getProgramAccounts (Helius, Triton, QuickNode) |
| BANDZ_MIN | optional, the crew floor in bandz (default 100000) |
| PAYDAY_HOURS | optional, minimum hours between paydays (default 6) |
| EXCLUDE | optional, comma-separated wallets that never count as crew |

## Rules

- heat = last hour's buys vs sells on the main pair (DexScreener). under 6 trades = 0 stars.
- 0 stars: payday is open. 5 stars: lockdown.
- payday = safehouse balance minus 0.02 sol, split by bag size across every wallet holding the floor (top 180, dust under 0.001 sol dropped). Pools, bonding curves, any off-curve address and the safehouse never count.
- Claim the pump.fun creator fees into the safehouse before payday.

## Payday

Open the site, connect the safehouse wallet (Phantom) under crew. When heat is 0 stars the "pay the crew" button sends the payroll in batches of 18 transfers; you sign each one. "payroll .csv" downloads the same list for any multisender.

## Routes

- /api/config: mint, safehouse, floor, payday hours
- /api/market: price, market cap, volume, heat
- /api/jobs: the last trades (GeckoTerminal)
- /api/crew (?wallet=): every wallet over the floor, or one wallet's bag and rank
- /api/payroll: who gets what if payday ran now
- /api/vault: safehouse balance and its last 30 transactions
- /api/blockhash: for signing payday
