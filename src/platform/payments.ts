import { supabase } from './supabase';
import { currentUser } from './auth';
import { economyNeedsAuth, type CoinPackage } from './config';
import { SignInRequiredError } from './tournament';

export { SignInRequiredError };

export type PayMethod = 'telebirr' | 'topup';
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'expired';

export interface Order {
  id: string;
  packageId: string;
  coins: number;
  amountEtb: number;
  method: PayMethod;
  status: OrderStatus;
  createdAt: number;
  redirectUrl?: string;
}

export async function startCheckout(
  pkg: CoinPackage, method: PayMethod,
): Promise<{ order: Order; sandbox: boolean }> {
  await currentUser();
  if (economyNeedsAuth()) throw new SignInRequiredError();
  const dir = location.pathname.replace(/[^/]*$/, '');
  const appBase = location.origin + dir;
  const returnUrl = location.origin + location.pathname;
  const { data, error } = await supabase().functions.invoke('buy-coins', {
    body: { packageId: pkg.id, method, appBase, returnUrl },
  });
  if (error) throw error;
  return { order: data.order as Order, sandbox: Boolean(data.sandbox) };
}

export async function pollOrder(orderId: string): Promise<Order> {
  for (let i = 0; i < 30; i++) {
    const { data, error } = await supabase()
      .from('payment_orders')
      .select('id, package_id, coins, amount_etb, method, status, created_at')
      .eq('id', orderId).maybeSingle();
    if (error) throw error;
    if (data) {
      const order = mapOrder(data);
      if (order.status !== 'pending') return order;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('payment timed out');
}

function mapOrder(r: Record<string, unknown>): Order {
  return {
    id: String(r.id), packageId: String(r.package_id),
    coins: Number(r.coins), amountEtb: Number(r.amount_etb),
    method: r.method as PayMethod, status: r.status as OrderStatus,
    createdAt: new Date(r.created_at as string).getTime(),
  };
}
