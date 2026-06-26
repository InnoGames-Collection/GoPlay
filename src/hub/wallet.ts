import { getLang } from '../i18n';
import { onAuthChange, currentUser } from '../platform/auth';
import { openSignIn } from './signin';
import { fetchBalance } from '../platform/wallet';
import { loadConfig, economyNeedsAuth, type CoinPackage, type AppConfig } from '../platform/config';
import { startCheckout, pollOrder, SignInRequiredError, type PayMethod } from '../platform/payments';

const STR = {
  en: {
    buy: 'Buy coins', store: 'Coin store', coins: 'coins', bonus: 'bonus', popular: 'Best value',
    payNow: 'Pay', processing: 'Processing…', success: 'Coins added!', failed: 'Payment failed',
    close: 'Close', sandbox: 'Demo — no real charge', signIn: 'Sign in',
  },
  am: {
    buy: 'ሳንቲም ይግዙ', store: 'መደብር', coins: 'ሳንቲሞች', bonus: 'ጉርሻ', popular: 'ምርጥ',
    payNow: 'ይክፈሉ', processing: 'በመከናወን…', success: 'ተጨመረ!', failed: 'አልተሳካም',
    close: 'ዝጋ', sandbox: 'ማሳያ', signIn: 'ግባ',
  },
};
const tr = (k: keyof typeof STR.en): string => (STR[getLang()] ?? STR.en)[k];

let cfg: AppConfig = { coinPackages: [], paymentMethods: { telebirr: true, topup: true }, maintenance: false };

export function openStore(): void {
  if (economyNeedsAuth()) { openSignIn(); return; }
  const m = shell(`<h2>${tr('store')}</h2><div class="pkg-grid" id="pkgGrid"></div>`);
  const grid = m.querySelector('#pkgGrid')!;
  for (const pkg of cfg.coinPackages) {
    const btn = document.createElement('button');
    btn.className = `pkg-card${pkg.popular ? ' popular' : ''}`;
    btn.innerHTML = `<strong>${pkg.coins + pkg.bonus}</strong> ${tr('coins')}
      ${pkg.bonus ? `<span class="bonus">+${pkg.bonus}</span>` : ''}
      <span class="price">${pkg.priceEtb} ETB</span>`;
    btn.addEventListener('click', () => void checkout(pkg, m));
    grid.appendChild(btn);
  }
}

async function checkout(pkg: CoinPackage, modal: HTMLElement): Promise<void> {
  const card = modal.querySelector('.wallet-card')!;
  card.innerHTML = `<p>${tr('processing')}</p>`;
  try {
    const method: PayMethod = cfg.paymentMethods.telebirr ? 'telebirr' : 'topup';
    const { order, sandbox } = await startCheckout(pkg, method);
    if (order.redirectUrl) {
      location.href = order.redirectUrl;
      return;
    }
    const final = await pollOrder(order.id);
    if (final.status === 'paid') {
      card.innerHTML = `<p>✅ ${tr('success')} +${final.coins} 🪙</p>
        <button class="btn primary">${tr('close')}</button>`;
      card.querySelector('button')!.addEventListener('click', () => modal.remove());
      await fetchBalance();
    } else {
      card.innerHTML = `<p>${tr('failed')}</p><button class="btn">${tr('close')}</button>`;
      card.querySelector('button')!.addEventListener('click', () => modal.remove());
    }
    if (sandbox) card.insertAdjacentHTML('afterbegin', `<p class="sandbox-note">${tr('sandbox')}</p>`);
  } catch (e) {
    if (e instanceof SignInRequiredError) { modal.remove(); openSignIn(); return; }
    card.innerHTML = `<p>${tr('failed')}</p><button class="btn">${tr('close')}</button>`;
    card.querySelector('button')!.addEventListener('click', () => modal.remove());
  }
}

function shell(inner: string): HTMLElement {
  document.querySelector('.wallet-modal')?.remove();
  const m = document.createElement('div');
  m.className = 'wallet-modal';
  m.innerHTML = `<div class="wallet-scrim"></div><div class="wallet-card">${inner}</div>`;
  document.body.appendChild(m);
  m.querySelector('.wallet-scrim')!.addEventListener('click', () => m.remove());
  return m;
}

export async function mountWallet(): Promise<void> {
  onAuthChange(() => void fetchBalance());
  await currentUser();
  cfg = await loadConfig();
  const params = new URLSearchParams(location.search);
  const orderId = params.get('order');
  if (orderId) {
    params.delete('order');
    history.replaceState(null, '', location.pathname);
    try {
      await pollOrder(orderId);
      await fetchBalance();
    } catch { /* ignore */ }
  }
}
