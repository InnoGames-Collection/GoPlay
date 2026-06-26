import { isConfigured, supabase } from './supabase';

export interface AuthUser {
  id: string;
  phone: string;
  name: string;
}

export function authAvailable(): boolean {
  return isConfigured();
}

export function devOtpEcho(): boolean {
  return isConfigured() && import.meta.env.VITE_DEV_OTP_ECHO === 'true';
}

export async function fetchDevOtp(phone: string): Promise<string | null> {
  if (!devOtpEcho()) return null;
  const p = normalizePhone(phone);
  for (let i = 0; i < 8; i++) {
    try {
      const { data } = await supabase()
        .from('dev_otps').select('code').eq('phone', p).maybeSingle();
      if (data?.code) return String(data.code);
    } catch { return null; }
    await new Promise((r) => setTimeout(r, 600));
  }
  return null;
}

export function isSignedIn(): boolean {
  return cachedUser !== null;
}

let cachedUser: AuthUser | null = null;

export function normalizePhone(input: string): string {
  let s = input.replace(/[^\d+]/g, '');
  if (s.startsWith('0')) s = '+251' + s.slice(1);
  else if (!s.startsWith('+')) s = '+' + s;
  return s;
}

export class AuthTimeoutError extends Error {
  constructor() { super('auth request timed out'); this.name = 'AuthTimeoutError'; }
}

function withTimeout<T>(p: Promise<T>, ms = 15_000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new AuthTimeoutError()), ms);
    p.then((v) => { clearTimeout(id); resolve(v); }, (e) => { clearTimeout(id); reject(e); });
  });
}

export async function requestOtp(phone: string): Promise<void> {
  const { error } = await withTimeout(supabase().auth.signInWithOtp({ phone: normalizePhone(phone) }));
  if (error) throw error;
}

export async function verifyOtp(phone: string, code: string): Promise<AuthUser> {
  const { data, error } = await withTimeout(supabase().auth.verifyOtp({
    phone: normalizePhone(phone), token: code.trim(), type: 'sms',
  }));
  if (error) throw error;
  const u = data.user!;
  return { id: u.id, phone: u.phone ?? '', name: (u.user_metadata?.name as string) ?? '' };
}

export async function currentUser(): Promise<AuthUser | null> {
  if (!isConfigured()) return null;
  const { data } = await supabase().auth.getUser();
  const u = data.user;
  cachedUser = u ? { id: u.id, phone: u.phone ?? '', name: (u.user_metadata?.name as string) ?? '' } : null;
  return cachedUser;
}

export async function setDisplayName(name: string): Promise<void> {
  const { error } = await supabase().auth.updateUser({ data: { name: name.trim().slice(0, 24) } });
  if (error) throw error;
  await supabase().from('profiles').update({ name: name.trim().slice(0, 24) }).eq('id', (await currentUser())!.id);
}

export async function signOut(): Promise<void> {
  if (isConfigured()) await supabase().auth.signOut();
  cachedUser = null;
}

export function onAuthChange(fn: (user: AuthUser | null) => void): () => void {
  if (!isConfigured()) return () => {};
  const { data } = supabase().auth.onAuthStateChange((_e, session) => {
    const u = session?.user;
    cachedUser = u ? { id: u.id, phone: u.phone ?? '', name: (u.user_metadata?.name as string) ?? '' } : null;
    fn(cachedUser);
  });
  return () => data.subscription.unsubscribe();
}
