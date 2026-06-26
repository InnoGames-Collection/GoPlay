// Coin wallet — always read fresh from server (no cache).

import { isConfigured, supabase } from './supabase';

export async function fetchBalance(): Promise<number> {
  if (!isConfigured()) return 0;
  const sb = supabase();
  const me = (await sb.auth.getUser()).data.user?.id;
  if (!me) return 0;
  const { data, error } = await sb.from('profiles').select('coins').eq('id', me).maybeSingle();
  if (error) throw error;
  return Number(data?.coins ?? 0);
}

export interface LedgerEntry {
  id: string;
  delta: number;
  reason: string;
  ref: string;
  balanceAfter: number;
  createdAt: number;
}

export async function fetchLedger(limit = 20): Promise<LedgerEntry[]> {
  if (!isConfigured()) return [];
  const sb = supabase();
  const me = (await sb.auth.getUser()).data.user?.id;
  if (!me) return [];
  const { data, error } = await sb
    .from('wallet_ledger')
    .select('id, delta, reason, ref, balance_after, created_at')
    .eq('user_id', me).order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: String(r.id), delta: Number(r.delta), reason: String(r.reason),
    ref: String(r.ref ?? ''), balanceAfter: Number(r.balance_after),
    createdAt: new Date(r.created_at as string).getTime(),
  }));
}
