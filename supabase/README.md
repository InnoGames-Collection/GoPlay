# GoPlay backend (Supabase)

## 1. Create project & keys

Copy `.env.example` → `.env` and set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.

## 2. Apply schema

SQL Editor → paste and run [`schema.sql`](schema.sql).

This creates profiles, wallet, payments, and the full **runner_*** tournament economy (daily/weekly/monthly, RP, season board, p95 normalization).

## 3. Deploy edge functions

From `Games/GoPlay`:

```bash
supabase link --project-ref YOUR_REF
supabase functions deploy runner-enter
supabase functions deploy runner-submit
supabase functions deploy start-round
supabase functions deploy buy-coins
supabase functions deploy payment-callback --no-verify-jwt
supabase functions deploy send-sms
supabase functions deploy admin-action
```

## 4. Admin

After first sign-in:

```sql
update public.profiles set role = 'admin' where id = 'YOUR-USER-UUID';
```

## 5. Optional cron

Run [`migrations/20260626100000_runner_cron.sql`](migrations/20260626100000_runner_cron.sql) for daily settlement (requires pg_cron extension).

## 6. Anti-cheat (recommended)

```bash
supabase secrets set ROUND_SIGNING_SECRET=your-long-random-secret
```

With the secret set, `start-round` issues tokens at run start and `runner-submit` requires them.
