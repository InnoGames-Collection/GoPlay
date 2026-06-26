# GoPlay — EthioRunner

Standalone, server-authoritative tournament game extracted from InnoArcade. One game, one economy, one backend — no dual tournament systems.

## What's included

- **EthioRunner** endless runner (3-lane, biomes, power-ups)
- **Unified tournament stack** — daily / weekly / monthly windows, RP-normalized leaderboard, season board
- **Coin wallet** — buy-coins + payment-callback (sandbox TeleBirr demo)
- **Phone OTP auth** — Supabase Auth
- **Admin** — runner tournament visibility, ensure windows, settle due
- **Mechanics** — see [`proposed game mechanics.md`](proposed%20game%20mechanics.md)

## Architecture fixes (vs InnoArcade split)

| Issue | GoPlay approach |
|-------|-----------------|
| Dual tournament systems | Single `runner_*` stack everywhere (hub + play + admin) |
| Silent API failures | Errors surfaced in UI toasts / messages |
| Anti-cheat token at submit | `startRound()` called when run **starts** |
| Stale wallet cache | `fetchBalance()` always hits server |
| Missing runner schema | Full schema in `supabase/schema.sql` |
| RP / season / daily-weekly-monthly | Implemented per mechanics doc |

## Quick start

```bash
cd Games/GoPlay
npm install
cp .env.example .env   # add VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm run dev
```

### Backend setup

1. Supabase project → SQL Editor → run [`supabase/schema.sql`](supabase/schema.sql)
2. Deploy edge functions: `runner-enter`, `runner-submit`, `start-round`, `buy-coins`, `payment-callback`, `send-sms`, `admin-action`
3. Make yourself admin: `update profiles set role = 'admin' where id = 'YOUR-UUID';`
4. Optional: apply [`supabase/migrations/20260626100000_runner_cron.sql`](supabase/migrations/20260626100000_runner_cron.sql) for daily settlement cron

## Project structure

```
GoPlay/
├── index.html          Hub (tournaments, season, wallet)
├── play/index.html     EthioRunner game
├── admin/index.html    Operator console
├── src/
│   ├── platform/       Server-only API (tournament.ts, wallet.ts, auth.ts)
│   ├── game/           Runner engine + art
│   ├── play/           Game UI wiring
│   └── hub/            Landing + store
└── supabase/           Schema + edge functions
```

## Tournament flow

1. Hub or in-game panel shows live **daily / weekly / monthly** windows
2. Player pays entry fee → `runner-enter` banks attempts
3. On **Play**, `start-round` issues anti-cheat token
4. On game over, `runner-submit` awards XP (practice, 3/day cap) or consumes attempt + records **RP** (normalized score)
5. Leaderboard ranks by RP; tie-break by earliest best timestamp
6. Season board = average best RP across ≥3 tournaments

## Build

```bash
npm run build
npm run preview
```

Deploy the `dist/` folder to any static host; point env vars at your Supabase project at build time.
