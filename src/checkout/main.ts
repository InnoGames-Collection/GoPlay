// Demo TeleBirr checkout — calls payment-callback like production.

import { getLang } from '../i18n';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const q = new URLSearchParams(location.search);
const ref = q.get('ref') ?? '';
const orderId = q.get('order') ?? '';
const amount = q.get('amount') ?? '0';
const coins = q.get('coins') ?? '0';
const returnUrl = decodeURIComponent(q.get('return') ?? '');

const STR = {
  en: { pay: 'Pay', cancel: 'Cancel', processing: 'Processing…', demo: 'Demo — no real charge', err: 'Payment failed' },
  am: { pay: 'ይክፈሉ', cancel: 'ይቅር', processing: '…', demo: 'ማሳያ', err: 'አልተሳካም' },
};
const t = (k: keyof typeof STR.en): string => (STR[getLang()] ?? STR.en)[k];

function backTo(extra: string): void {
  const sep = returnUrl.includes('?') ? '&' : '?';
  location.href = `${returnUrl}${sep}order=${encodeURIComponent(orderId)}&${extra}`;
}

async function notify(status: 'success' | 'failed'): Promise<Response> {
  return fetch(`${url}/functions/v1/payment-callback`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', apikey: anon ?? '', authorization: `Bearer ${anon ?? ''}` },
    body: JSON.stringify({ providerRef: ref, orderId, status }),
  });
}

const app = document.querySelector<HTMLElement>('#app')!;
if (!url || !anon || !ref || !returnUrl) {
  app.innerHTML = '<p>Invalid checkout link.</p>';
} else {
  app.innerHTML = `<div style="font-family:system-ui;padding:24px;text-align:center">
    <h2>telebirr demo</h2>
    <p>ETB ${Number(amount).toLocaleString()} → ${coins} 🪙</p>
    <button id="pay">${t('pay')}</button>
    <button id="cancel">${t('cancel')}</button>
    <p><small>${t('demo')}</small></p>
  </div>`;
  app.querySelector('#pay')!.addEventListener('click', async () => {
    const res = await notify('success');
    if (res.ok) backTo('paid=1');
    else app.querySelector('p')!.textContent = t('err');
  });
  app.querySelector('#cancel')!.addEventListener('click', () => void notify('failed').finally(() => backTo('cancel=1')));
}
