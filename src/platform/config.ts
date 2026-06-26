import { isConfigured, supabase } from './supabase';
import { isSignedIn } from './auth';

export interface CoinPackage {
  id: string;
  coins: number;
  bonus: number;
  priceEtb: number;
  popular?: boolean;
}

export interface AppConfig {
  coinPackages: CoinPackage[];
  paymentMethods: { telebirr: boolean; topup: boolean };
  maintenance: boolean;
}

export const DEFAULT_CONFIG: AppConfig = {
  coinPackages: [
    { id: 'starter', coins: 50, bonus: 0, priceEtb: 5 },
    { id: 'popular', coins: 220, bonus: 20, priceEtb: 20, popular: true },
    { id: 'value', coins: 600, bonus: 120, priceEtb: 50 },
    { id: 'pro', coins: 1300, bonus: 390, priceEtb: 100 },
  ],
  paymentMethods: { telebirr: true, topup: true },
  maintenance: false,
};

export function economyNeedsAuth(): boolean {
  return isConfigured() && !isSignedIn();
}

export async function loadConfig(): Promise<AppConfig> {
  if (!isConfigured()) return DEFAULT_CONFIG;
  const { data, error } = await supabase().from('app_config').select('value').eq('key', 'app').maybeSingle();
  if (error) return DEFAULT_CONFIG;
  const remote = (data?.value ?? {}) as Partial<AppConfig>;
  return { ...DEFAULT_CONFIG, ...remote };
}

export function packageById(packages: CoinPackage[], id: string): CoinPackage | undefined {
  return packages.find((p) => p.id === id);
}
