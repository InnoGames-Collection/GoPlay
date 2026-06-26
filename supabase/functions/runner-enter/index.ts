// @ts-nocheck — GoPlay EthioRunner: pay entry fee, bank attempts.
// Deploy: supabase functions deploy runner-enter

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'content-type': 'application/json' } });

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: u } = await userClient.auth.getUser();
  const user = u.user;
  if (!user) return json({ error: 'not signed in' }, 401);

  let body: { tournamentId?: string } = {};
  try { body = await req.json(); } catch { /* empty body ok */ }

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  await admin.rpc('ensure_runner_tournaments');

  let tourQuery = admin
    .from('runner_tournaments')
    .select('id, entry_fee_coins, attempts, ends_at, state, min_level, period')
    .eq('state', 'live')
    .gt('ends_at', new Date().toISOString());

  if (body.tournamentId) tourQuery = tourQuery.eq('id', body.tournamentId);
  else tourQuery = tourQuery.order('ends_at', { ascending: true }).limit(1);

  const { data: tour } = await tourQuery.maybeSingle();
  if (!tour) return json({ error: 'no tournament' }, 404);
  if (new Date(tour.ends_at).getTime() <= Date.now()) {
    return json({ error: 'tournament closed' }, 409);
  }

  const { data: xpRow } = await admin.from('runner_xp').select('xp').eq('user_id', user.id).maybeSingle();
  const level = 1 + Math.floor(Math.sqrt(Math.max(0, Number(xpRow?.xp ?? 0)) / 100));
  if (level < Number(tour.min_level)) {
    return json({ error: 'level too low', minLevel: tour.min_level, level }, 403);
  }

  const fee = Number(tour.entry_fee_coins);
  const attempts = Number(tour.attempts);

  let coins = 0;
  if (fee > 0) {
    const { data: bal, error } = await admin.rpc('apply_coins', {
      p_user: user.id, p_delta: -fee, p_reason: 'runner_entry', p_ref: tour.id,
    });
    if (error) return json({ error: 'insufficient coins' }, 402);
    coins = Number(bal);
  } else {
    const { data: prof } = await admin.from('profiles').select('coins').eq('id', user.id).maybeSingle();
    coins = Number(prof?.coins ?? 0);
  }

  const { data: existing } = await admin
    .from('runner_entries')
    .select('attempts_purchased, attempts_used, fee_paid')
    .eq('user_id', user.id).eq('tournament_id', tour.id).maybeSingle();
  const purchased = Number(existing?.attempts_purchased ?? 0) + attempts;
  const used = Number(existing?.attempts_used ?? 0);

  await admin.from('runner_entries').upsert({
    user_id: user.id, tournament_id: tour.id,
    attempts_purchased: purchased, attempts_used: used,
    fee_paid: Number(existing?.fee_paid ?? 0) + fee,
  });

  return json({
    tournamentId: tour.id,
    period: tour.period,
    coins,
    attemptsPurchased: purchased,
    attemptsUsed: used,
    attemptsLeft: purchased - used,
    feePaid: fee,
  });
});
