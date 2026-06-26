import '../styles/base.css';
import { isConfigured, supabase } from '../platform/supabase';
import { currentUser } from '../platform/auth';

const app = document.getElementById('app')!;

async function boot(): Promise<void> {
  if (!isConfigured()) {
    app.innerHTML = '<p>Set VITE_SUPABASE_* in .env</p>';
    return;
  }
  await currentUser();
  const me = (await supabase().auth.getUser()).data.user?.id;
  if (!me) {
    app.innerHTML = '<p>Sign in required. <a href="../">Back to hub</a></p>';
    return;
  }
  const { data: prof } = await supabase().from('profiles').select('role').eq('id', me).maybeSingle();
  if (prof?.role !== 'admin') {
    app.innerHTML = '<p>Admin access only. <a href="../">Back</a></p>';
    return;
  }

  app.innerHTML = `
    <header class="admin-head"><h1>GoPlay Admin</h1><a href="../">← Hub</a></header>
    <section id="tourAdmin"><h2>Runner tournaments</h2><div id="tourRows">…</div></section>
    <section><h2>Actions</h2>
      <button id="ensureBtn" class="btn">Ensure windows</button>
      <button id="settleBtn" class="btn">Settle due</button>
    </section>`;

  await loadTournaments();

  document.getElementById('ensureBtn')!.addEventListener('click', async () => {
    await supabase().rpc('ensure_runner_tournaments');
    await loadTournaments();
  });
  document.getElementById('settleBtn')!.addEventListener('click', async () => {
    await supabase().rpc('settle_due_runner_tournaments');
    await loadTournaments();
  });
}

async function loadTournaments(): Promise<void> {
  const { data } = await supabase()
    .from('runner_tournaments')
    .select('id, period, state, entry_fee_coins, attempts, prize_pool_coins, starts_at, ends_at')
    .order('starts_at', { ascending: false }).limit(20);
  const host = document.getElementById('tourRows')!;
  host.innerHTML = (data ?? []).map((t) => `
    <article class="admin-row">
      <strong>${t.id}</strong> · ${t.period} · ${t.state}<br/>
      Fee ${t.entry_fee_coins} · ${t.attempts} attempts · Pool ${t.prize_pool_coins} 🪙
      <br/><small>${t.starts_at} → ${t.ends_at}</small>
    </article>`).join('') || '<p>No tournaments</p>';
}

void boot();
