// GoPlay — Supabase client. Server is required; no offline economy.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

export function isConfigured(): boolean {
  return Boolean(url && anonKey);
}

export function supabase(): SupabaseClient {
  if (!client) {
    if (!isConfigured()) throw new Error('Supabase not configured (set VITE_SUPABASE_* in .env)');
    client = createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return client;
}
