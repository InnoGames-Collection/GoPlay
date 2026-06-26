// GoPlay EthioRunner — unified tournament API. Every read hits the server live.

import { isConfigured, supabase } from './supabase';
import { currentUser } from './auth';

export const GAME_ID = 'ethiorunner';

export type TournamentPeriod = 'daily' | 'weekly' | 'monthly';

export interface Tournament {
  id: string;
  period: TournamentPeriod;
  titleEn: string;
  titleAm: string;
  entryFeeCoins: number;
  attempts: number;
  minLevel: number;
  startsAt: number;
  endsAt: number;
  state: string;
}

export interface TournamentEntry {
  attemptsPurchased: number;
  attemptsUsed: number;
  attemptsLeft: number;
}

export interface PlayerXp {
  xp: number;
  xpSeason: number;
  level: number;
}

export interface SubmitResult {
  award: number;
  xp: number;
  xpSeason: number;
  level: number;
  rp: number;
  ranked: boolean;
  bestRp: number;
  bestRaw: number;
  rank: number;
  total: number;
  attemptsLeft: number;
  tournamentId: string | null;
  p95: number;
}

export interface LeaderRow {
  rank: number;
  name: string;
  score: number;
  rawScore: number;
  isPlayer: boolean;
}

export interface SeasonRow {
  rank: number;
  name: string;
  seasonScore: number;
  tourneys: number;
  isPlayer: boolean;
}

export function levelForXp(xp: number): number {
  return 1 + Math.floor(Math.sqrt(Math.max(0, xp) / 100));
}

export class InsufficientCoinsError extends Error {
  constructor() { super('insufficient coins'); this.name = 'InsufficientCoinsError'; }
}

export class SignInRequiredError extends Error {
  constructor() { super('sign-in required'); this.name = 'SignInRequiredError'; }
}

export class LevelTooLowError extends Error {
  minLevel: number;
  level: number;
  constructor(minLevel: number, level: number) {
    super('level too low');
    this.name = 'LevelTooLowError';
    this.minLevel = minLevel;
    this.level = level;
  }
}

function mapTournament(r: Record<string, unknown>): Tournament {
  return {
    id: String(r.id),
    period: r.period as TournamentPeriod,
    titleEn: String(r.title_en),
    titleAm: String(r.title_am),
    entryFeeCoins: Number(r.entry_fee_coins),
    attempts: Number(r.attempts),
    minLevel: Number(r.min_level ?? 1),
    startsAt: new Date(r.starts_at as string).getTime(),
    endsAt: new Date(r.ends_at as string).getTime(),
    state: String(r.state),
  };
}

/** Live tournaments (daily, weekly, monthly). Ensures windows exist server-side. */
export async function fetchTournaments(): Promise<Tournament[]> {
  if (!isConfigured()) return [];
  await supabase().rpc('ensure_runner_tournaments');
  const now = new Date().toISOString();
  const { data, error } = await supabase()
    .from('runner_tournaments')
    .select('id, period, title_en, title_am, entry_fee_coins, attempts, min_level, starts_at, ends_at, state')
    .eq('state', 'live').lte('starts_at', now).gt('ends_at', now)
    .order('ends_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapTournament);
}

export async function fetchMyEntry(tournamentId: string): Promise<TournamentEntry | null> {
  if (!isConfigured()) return null;
  const me = (await supabase().auth.getUser()).data.user?.id;
  if (!me) return null;
  const { data, error } = await supabase()
    .from('runner_entries')
    .select('attempts_purchased, attempts_used')
    .eq('user_id', me).eq('tournament_id', tournamentId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const purchased = Number(data.attempts_purchased);
  const used = Number(data.attempts_used);
  return { attemptsPurchased: purchased, attemptsUsed: used, attemptsLeft: Math.max(0, purchased - used) };
}

export async function fetchMyXp(): Promise<PlayerXp> {
  if (!isConfigured()) return { xp: 0, xpSeason: 0, level: 1 };
  const me = (await supabase().auth.getUser()).data.user?.id;
  if (!me) return { xp: 0, xpSeason: 0, level: 1 };
  const { data, error } = await supabase().from('runner_xp').select('xp, xp_season').eq('user_id', me).maybeSingle();
  if (error) throw error;
  const xp = Number(data?.xp ?? 0);
  return { xp, xpSeason: Number(data?.xp_season ?? 0), level: levelForXp(xp) };
}

export async function fetchLeaderboard(tournamentId: string, limit = 10): Promise<LeaderRow[]> {
  if (!isConfigured()) return [];
  const me = (await supabase().auth.getUser()).data.user?.id;
  const { data, error } = await supabase()
    .from('runner_leaderboard')
    .select('rank, name, score, raw_score, user_id')
    .eq('tournament_id', tournamentId)
    .order('rank', { ascending: true }).limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    rank: Number(r.rank), name: String(r.name ?? 'Player'),
    score: Number(r.score), rawScore: Number(r.raw_score ?? 0),
    isPlayer: r.user_id === me,
  }));
}

export async function fetchSeasonLeaderboard(limit = 10): Promise<SeasonRow[]> {
  if (!isConfigured()) return [];
  const me = (await supabase().auth.getUser()).data.user?.id;
  const { data, error } = await supabase()
    .from('runner_season_leaderboard')
    .select('rank, name, season_score, tourneys, user_id')
    .order('rank', { ascending: true }).limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    rank: Number(r.rank), name: String(r.name ?? 'Player'),
    seasonScore: Number(r.season_score), tourneys: Number(r.tourneys),
    isPlayer: r.user_id === me,
  }));
}

export async function enterTournament(tournamentId: string): Promise<TournamentEntry & { coins: number }> {
  await currentUser();
  const { data, error } = await supabase().functions.invoke('runner-enter', {
    body: { tournamentId },
  });
  if (error) {
    const ctx = (error as { context?: { status?: number; json?: () => Promise<unknown> } }).context;
    const status = ctx?.status;
    if (status === 402) throw new InsufficientCoinsError();
    if (status === 401) throw new SignInRequiredError();
    if (status === 403 && ctx?.json) {
      const body = await ctx.json() as { minLevel?: number; level?: number };
      throw new LevelTooLowError(body.minLevel ?? 1, body.level ?? 1);
    }
    throw error;
  }
  const d = data as Record<string, number | string>;
  return {
    attemptsPurchased: Number(d.attemptsPurchased),
    attemptsUsed: Number(d.attemptsUsed),
    attemptsLeft: Number(d.attemptsLeft),
    coins: Number(d.coins),
  };
}

export async function startRound(): Promise<string> {
  await currentUser();
  const { data, error } = await supabase().functions.invoke('start-round', {
    body: { gameId: GAME_ID },
  });
  if (error) throw error;
  return String((data as { token?: string })?.token ?? '');
}

export async function submitRun(
  score: number, timeMs: number, token: string, tournamentId?: string,
): Promise<SubmitResult> {
  if (!isConfigured()) throw new Error('not configured');
  await currentUser();
  const { data, error } = await supabase().functions.invoke('runner-submit', {
    body: {
      score: Math.max(0, Math.floor(score)),
      timeMs: Math.max(0, Math.floor(timeMs)),
      token,
      tournamentId,
    },
  });
  if (error) {
    const status = (error as { context?: { status?: number } }).context?.status;
    if (status === 401) throw new SignInRequiredError();
    throw error;
  }
  const d = data as Record<string, unknown>;
  return {
    award: Number(d.award), xp: Number(d.xp), xpSeason: Number(d.xpSeason),
    level: Number(d.level), rp: Number(d.rp), ranked: Boolean(d.ranked),
    bestRp: Number(d.bestRp), bestRaw: Number(d.bestRaw),
    rank: Number(d.rank), total: Number(d.total),
    attemptsLeft: Number(d.attemptsLeft),
    tournamentId: d.tournamentId ? String(d.tournamentId) : null,
    p95: Number(d.p95),
  };
}

export async function fetchSkins(): Promise<string> {
  if (!isConfigured()) return 'boy';
  const me = (await supabase().auth.getUser()).data.user?.id;
  if (!me) return 'boy';
  const { data, error } = await supabase().from('profiles').select('skins').eq('id', me).maybeSingle();
  if (error) throw error;
  const skins = (data?.skins ?? {}) as Record<string, string>;
  return skins[GAME_ID] ?? 'boy';
}

export async function setSkin(skinId: string): Promise<void> {
  await currentUser();
  const me = (await supabase().auth.getUser()).data.user?.id;
  if (!me) throw new SignInRequiredError();
  const { data } = await supabase().from('profiles').select('skins').eq('id', me).maybeSingle();
  const skins = { ...((data?.skins ?? {}) as Record<string, string>), [GAME_ID]: skinId };
  const { error } = await supabase().from('profiles').update({ skins }).eq('id', me);
  if (error) throw error;
}

export async function fetchP95(): Promise<number> {
  if (!isConfigured()) return 1500;
  const { data, error } = await supabase().from('runner_p95').select('p95_score').eq('game_id', GAME_ID).maybeSingle();
  if (error) throw error;
  return Number(data?.p95_score ?? 1500);
}
