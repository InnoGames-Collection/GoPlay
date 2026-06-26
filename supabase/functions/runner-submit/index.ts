// @ts-nocheck — GoPlay EthioRunner score gate: XP + RP ranking.
// Deploy: supabase functions deploy runner-submit

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GAME_ID = 'ethiorunner';
const MAX_SCORE = 1_000_000;
const BASE_XP = 10;
const DIFFICULTY = 2.0; // Hard
const PRACTICE_CAP = 3;
const MIN_SUBMIT_MS = 2000;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'content-type': 'application/json' } });

function b64urlDecode(s: string): string { return atob(s.replace(/-/g, '+').replace(/_/g, '/')); }
function b64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function hmac(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return b64url(new Uint8Array(mac));
}
async function verifyAndBurnToken(admin, token: string, uid: string, gid: string, secret: string): Promise<boolean> {
  if (!token || !token.includes('.')) return false;
  const [payload, sig] = token.split('.');
  if (sig !== (await hmac(payload, secret))) return false;
  let p: { uid?: string; gid?: string; iat?: number; jti?: string };
  try { p = JSON.parse(b64urlDecode(payload)); } catch { return false; }
  if (p.uid !== uid || p.gid !== gid) return false;
  if (typeof p.iat !== 'number' || Date.now() - p.iat > 15 * 60 * 1000) return false;
  if (!p.jti) return false;
  const { error } = await admin.from('used_nonces').insert({ jti: p.jti, user_id: uid });
  return !error;
}

const levelFor = (xp: number): number => 1 + Math.floor(Math.sqrt(Math.max(0, xp) / 100));

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

  let body: { score?: number; timeMs?: number; token?: string; tournamentId?: string };
  try { body = await req.json(); } catch { return json({ error: 'bad json' }, 400); }
  const score = Number(body.score);
  const timeMs = Number(body.timeMs ?? 0);
  if (!Number.isInteger(score) || score < 0) return json({ error: 'invalid score' }, 400);
  if (score > MAX_SCORE) return json({ error: 'score out of range' }, 422);
  if (timeMs > 0 && timeMs < MIN_SUBMIT_MS) return json({ error: 'run too short' }, 422);

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const secret = Deno.env.get('ROUND_SIGNING_SECRET');
  if (secret) {
    const ok = await verifyAndBurnToken(admin, String(body.token ?? ''), user.id, GAME_ID, secret);
    if (!ok) return json({ error: 'invalid round token' }, 403);
  }

  // Sample for rolling p95.
  await admin.from('runner_score_samples').insert({ raw_score: score });
  const { data: p95Row } = await admin.from('runner_p95').select('p95_score, sample_count').eq('game_id', GAME_ID).maybeSingle();
  let p95 = Number(p95Row?.p95_score ?? 1500);
  if (Number(p95Row?.sample_count ?? 0) % 25 === 0) {
    const { data: newP95 } = await admin.rpc('recalc_runner_p95');
    if (newP95) p95 = Number(newP95);
  }
  const rp = Math.min(100, Math.round((score / Math.max(100, p95)) * 100 * 100) / 100);

  // Practice XP (capped 3/day when not ranked).
  let xpAward = 0;
  const today = new Date().toISOString().slice(0, 10);
  const { data: practice } = await admin
    .from('runner_practice_daily').select('sessions')
    .eq('user_id', user.id).eq('day', today).maybeSingle();
  const sessions = Number(practice?.sessions ?? 0);

  let ranked = false, bestRp = 0, bestRaw = 0, rank = 0, total = 0, attemptsLeft = 0;
  let tournamentId = body.tournamentId ?? null;

  if (!tournamentId) {
    const { data: tid } = await admin.rpc('active_runner_tournament', { p_period: null });
    tournamentId = tid ? String(tid) : null;
  }

  if (tournamentId) {
    const { data: entry } = await admin
      .from('runner_entries')
      .select('attempts_purchased, attempts_used')
      .eq('user_id', user.id).eq('tournament_id', tournamentId).maybeSingle();
    if (entry && Number(entry.attempts_used) < Number(entry.attempts_purchased)) {
      await admin.from('runner_entries')
        .update({ attempts_used: Number(entry.attempts_used) + 1 })
        .eq('user_id', user.id).eq('tournament_id', tournamentId);
      attemptsLeft = Number(entry.attempts_purchased) - Number(entry.attempts_used) - 1;

      const now = new Date().toISOString();
      const { data: prev } = await admin
        .from('runner_scores').select('best_raw, best_rp, best_at, plays')
        .eq('user_id', user.id).eq('tournament_id', tournamentId).maybeSingle();
      const prevRp = Number(prev?.best_rp ?? 0);
      if (rp > prevRp || (rp === prevRp && score > Number(prev?.best_raw ?? 0))) {
        bestRp = rp; bestRaw = score;
        await admin.from('runner_scores').upsert({
          user_id: user.id, tournament_id: tournamentId,
          best_raw: score, best_rp: rp, best_at: now,
          plays: Number(prev?.plays ?? 0) + 1, updated_at: now,
        });
      } else {
        bestRp = prevRp; bestRaw = Number(prev?.best_raw ?? 0);
        await admin.from('runner_scores').upsert({
          user_id: user.id, tournament_id: tournamentId,
          best_raw: prev?.best_raw ?? 0, best_rp: prevRp, best_at: prev?.best_at,
          plays: Number(prev?.plays ?? 0) + 1, updated_at: now,
        });
      }

      const { data: board } = await admin
        .from('runner_leaderboard').select('user_id, rank').eq('tournament_id', tournamentId);
      total = board?.length ?? 1;
      rank = board?.find((r) => r.user_id === user.id)?.rank ?? total;
      ranked = true;
      xpAward = Math.round(BASE_XP * DIFFICULTY * Math.min(1, rp / 100));
    } else if (entry) {
      attemptsLeft = Math.max(0, Number(entry.attempts_purchased) - Number(entry.attempts_used));
    }
  }

  if (!ranked && sessions < PRACTICE_CAP) {
    xpAward = Math.round(BASE_XP * DIFFICULTY * Math.min(1, score / p95));
    await admin.from('runner_practice_daily').upsert({
      user_id: user.id, day: today, sessions: sessions + 1,
    });
  }

  if (xpAward > 0) await admin.rpc('runner_apply_xp', { p_user: user.id, p_delta: xpAward });
  const { data: xpRow } = await admin.from('runner_xp').select('xp, xp_season').eq('user_id', user.id).maybeSingle();
  const xp = Number(xpRow?.xp ?? xpAward);
  const xpSeason = Number(xpRow?.xp_season ?? xpAward);

  return json({
    award: xpAward, xp, xpSeason, level: levelFor(xp), rp, ranked,
    bestRp, bestRaw, rank, total, attemptsLeft, tournamentId, p95,
  });
});
