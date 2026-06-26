import '../styles/base.css';
import '../game/style.css';
import { applyTranslations, getLang, t } from '../i18n';
import { GameLoop } from '../engine/loop';
import { Input } from '../engine/input';
import { Viewport } from '../engine/viewport';
import { AssetStore } from '../engine/assets';
import { Preloader } from '../ui/preloader';
import { SettingsPanel } from '../ui/settingsPanel';
import { registerPwa } from '../engine/pwa';
import { sfx } from '../engine/audio';
import { isConfigured } from '../platform/supabase';
import {
  fetchTournaments, fetchMyEntry, fetchMyXp, enterTournament, startRound, submitRun,
  fetchLeaderboard, fetchSkins, setSkin,
  InsufficientCoinsError, SignInRequiredError, LevelTooLowError,
  type Tournament, type TournamentEntry, type LeaderRow, type SubmitResult, type PlayerXp,
} from '../platform/tournament';
import { fetchBalance } from '../platform/wallet';
import { EthioRunner, W, H, SKINS, type GameState } from '../game/game';
import { sheetDefs } from '../game/art';

const $ = <T extends HTMLElement>(sel: string): T => document.querySelector<T>(sel)!;

registerPwa();
void boot();

async function boot(): Promise<void> {
  const pre = new Preloader('EthioRunner');
  const assets = new AssetStore();
  await assets.load(sheetDefs(), (p) => pre.set(p));
  pre.done();
  run(assets);
}

function run(assets: AssetStore): void {
  const canvas = $('#game') as unknown as HTMLCanvasElement;
  const vp = new Viewport(canvas, W, H);
  const ctx = vp.ctx;
  const game = new EthioRunner(assets);
  const settingsPanel = new SettingsPanel();

  let tourneys: Tournament[] = [];
  let selectedTourney: Tournament | null = null;
  let myEntry: TournamentEntry | null = null;
  let myXp: PlayerXp = { xp: 0, xpSeason: 0, level: 1 };
  let walletCoins = 0;
  let roundToken = '';

  const scoreVal = $('#scoreVal');
  const coinsVal = $('#coinsVal');
  const biomeVal = $('#biomeVal');
  const powerChips = $('#powerChips');
  let chipSig = '';

  const overlays: Record<string, HTMLElement> = {
    menu: $('#menuOverlay'),
    paused: $('#pauseOverlay'),
    over: $('#overOverlay'),
  };

  function showOverlay(state: GameState): void {
    for (const [k, el] of Object.entries(overlays)) el.classList.toggle('hidden', k !== state);
  }

  game.onStateChange = (s) => {
    showOverlay(s);
    if (s === 'over' || s === 'menu') void refreshHub();
  };

  game.onGameOver = (score, coins, record, durationMs) => {
    $('#finalScore').textContent = String(score);
    $('#finalCoins').textContent = String(coins);
    $('#finalBest').textContent = String(game.best);
    $('#newBest').classList.toggle('hidden', !record);
    void submitRunResult(score, durationMs);
  };

  const input = new Input(document.body);
  input.onAction((a) => {
    if (a === 'pause') {
      if (game.state === 'playing') game.pause();
      else if (game.state === 'paused') game.resume();
      return;
    }
    game.handleAction(a);
  });

  let ftueSeen = false;
  async function beginPlay(): Promise<void> {
    if (!ftueSeen) { $('#ftue').classList.remove('hidden'); return; }
    if (isConfigured()) {
      try {
        roundToken = await startRound();
      } catch (e) {
        showToast(e instanceof SignInRequiredError ? t('play.signIn') : t('play.error'));
        return;
      }
    }
    game.start();
  }

  $('#startBtn').addEventListener('click', () => void beginPlay());
  $('#ftueBtn').addEventListener('click', () => {
    ftueSeen = true;
    $('#ftue').classList.add('hidden');
    void beginPlay();
  });
  $('#againBtn').addEventListener('click', () => void beginPlay());
  $('#restartBtn').addEventListener('click', () => void beginPlay());
  $('#resumeBtn').addEventListener('click', () => game.resume());
  $('#pauseBtn').addEventListener('click', () => {
    if (game.state === 'playing') game.pause();
    else if (game.state === 'paused') game.resume();
  });
  $('#settingsBtn').addEventListener('click', () => settingsPanel.toggle());

  const muteBtn = $('#muteBtn');
  muteBtn.textContent = sfx.muted ? '🔇' : '🔊';
  muteBtn.addEventListener('click', () => { muteBtn.textContent = sfx.toggleMute() ? '🔇' : '🔊'; });
  document.addEventListener('visibilitychange', () => { if (document.hidden) game.pause(); });

  let selectedSkin = 'boy';
  function thumbFor(id: string): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = c.height = 72;
    const tctx = c.getContext('2d')!;
    const w = 72 * 0.72;
    assets.draw(tctx, `${id}_stand`, 0, (72 - w) / 2, 2, w, 68);
    return c;
  }

  function buildShop(): void {
    const row = $('#skinRow');
    row.innerHTML = '';
    for (const skin of SKINS) {
      const isSel = selectedSkin === skin.id;
      const chip = document.createElement('div');
      chip.className = `skin-chip${isSel ? ' is-selected' : ''}`;
      chip.appendChild(thumbFor(skin.id));
      const name = document.createElement('div');
      name.className = 'skin-name';
      name.textContent = getLang() === 'am' ? skin.nameAm : skin.nameEn;
      chip.appendChild(name);
      const action = document.createElement('div');
      action.className = 'skin-action';
      action.textContent = isSel ? t('play.selected') : t('play.select');
      chip.appendChild(action);
      chip.addEventListener('click', () => {
        if (isSel) return;
        selectedSkin = skin.id;
        game.setSkin(skin.id);
        void setSkin(skin.id).catch(() => showToast(t('play.error')));
        sfx.click();
        buildShop();
      });
      row.appendChild(chip);
    }
  }

  void fetchSkins().then((sk) => {
    selectedSkin = sk;
    game.setSkin(selectedSkin);
    buildShop();
  }).catch(() => buildShop());

  let toastT = 0;
  function showToast(msg: string): void {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(toastT);
    toastT = window.setTimeout(() => el.classList.add('hidden'), 2800);
  }

  function updateHud(): void {
    scoreVal.textContent = String(game.score);
    coinsVal.textContent = String(game.coins);
    biomeVal.textContent = game.biomeName;
    const chips: string[] = [];
    if (game.magnetT > 0) chips.push(`<span class="chip magnet">🧲 ${game.magnetT.toFixed(0)}</span>`);
    if (game.shield) chips.push(`<span class="chip shield">🛡️</span>`);
    if (game.multT > 0) chips.push(`<span class="chip mult">2× ${game.multT.toFixed(0)}</span>`);
    const sig = chips.join('');
    if (sig !== chipSig) { powerChips.innerHTML = sig; chipSig = sig; }
  }

  const escHtml = (s: string): string =>
    s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
  const medal = (rank: number): string => ['🥇', '🥈', '🥉'][rank - 1] ?? `${rank}`;

  function boardHtml(rows: LeaderRow[]): string {
    if (!rows.length) return `<p class="rb-empty">${t('play.noBoard')}</p>`;
    return rows.map((r) => `
      <div class="rb-row${r.isPlayer ? ' me' : ''}">
        <span class="rb-rank">${medal(r.rank)}</span>
        <span class="rb-name">${escHtml(r.isPlayer ? t('play.you') : r.name)}</span>
        <span class="rb-score">${r.score.toFixed(1)} RP</span>
      </div>`).join('');
  }

  async function refreshHub(): Promise<void> {
    const host = $('#runnerHub');
    if (!isConfigured()) {
      host.innerHTML = `<p class="rb-empty">${t('play.offline')}</p>`;
      return;
    }
    try {
      [tourneys, myXp, walletCoins] = await Promise.all([
        fetchTournaments(), fetchMyXp(), fetchBalance(),
      ]);
      if (!selectedTourney && tourneys.length) selectedTourney = tourneys[0];
      if (selectedTourney) myEntry = await fetchMyEntry(selectedTourney.id);
      renderHub();
    } catch {
      host.innerHTML = `<p class="rb-empty">${t('play.error')}</p>`;
    }
  }

  function renderHub(): void {
    const host = $('#runnerHub');
    if (!tourneys.length) {
      host.innerHTML = `<p class="rb-empty">${t('play.noTourney')}</p>`;
      return;
    }

    const tabs = tourneys.map((tour) => {
      const sel = selectedTourney?.id === tour.id;
      const label = getLang() === 'am' ? tour.titleAm : tour.titleEn;
      return `<button class="tour-tab${sel ? ' active' : ''}" data-id="${tour.id}">${escHtml(label)}</button>`;
    }).join('');

    const selTour = selectedTourney!;
    const left = myEntry?.attemptsLeft ?? 0;
    const canEnter = left <= 0;
    const status = left > 0
      ? `<span class="rt-attempts">🎟️ ${t('play.attemptsLeft')}: <strong>${left}</strong></span>`
      : `<span class="rt-fee">${selTour.entryFeeCoins} 🪙 → ${selTour.attempts} ${t('play.attempts')}</span>`;
    const enterBtn = canEnter
      ? `<button id="enterBtn" class="btn rt-enter">${t('play.enter')} · ${selTour.entryFeeCoins} 🪙</button>`
      : '';
    const modeHint = left > 0
      ? `<p class="rt-ranked">🏆 ${t('play.rankedRun')}</p>`
      : `<p class="rt-practice">⭐ ${t('play.practiceRun')}</p>`;

    host.innerHTML = `
      <div class="rt-head">
        <span class="rt-xp">Lv ${myXp.level} · ${myXp.xp.toLocaleString()} XP</span>
        <span class="rt-coins">${walletCoins.toLocaleString()} 🪙</span>
      </div>
      <div class="tour-tabs">${tabs}</div>
      <div class="rt-status">${status}${enterBtn}</div>
      ${modeHint}
      <div class="runner-board" id="boardLive"><span class="rb-empty">…</span></div>`;

    host.querySelectorAll('.tour-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedTourney = tourneys.find((x) => x.id === (btn as HTMLElement).dataset.id) ?? null;
        void refreshHub();
      });
    });
    $('#enterBtn')?.addEventListener('click', () => void onEnter());
    void loadBoard();
  }

  async function loadBoard(): Promise<void> {
    if (!selectedTourney) return;
    const el = $('#boardLive');
    if (!el) return;
    try {
      el.innerHTML = boardHtml(await fetchLeaderboard(selectedTourney.id, 5));
    } catch {
      el.innerHTML = `<p class="rb-empty">${t('play.error')}</p>`;
    }
  }

  async function onEnter(): Promise<void> {
    if (!selectedTourney) return;
    const b = document.querySelector<HTMLButtonElement>('#enterBtn');
    if (b) b.disabled = true;
    try {
      const res = await enterTournament(selectedTourney.id);
      myEntry = res;
      walletCoins = res.coins;
      showToast(`🎟️ ${t('play.attemptsLeft')}: ${res.attemptsLeft}`);
      await refreshHub();
    } catch (e) {
      if (e instanceof InsufficientCoinsError) showToast(`🪙 ${t('play.needCoins')}`);
      else if (e instanceof SignInRequiredError) showToast(t('play.signIn'));
      else if (e instanceof LevelTooLowError) showToast(`${t('play.needLevel')} ${e.minLevel}`);
      else showToast(t('play.error'));
      if (b) b.disabled = false;
    }
  }

  async function submitRunResult(score: number, durationMs: number): Promise<void> {
    const reward = $('#runReward');
    const boardOver = $('#runnerBoardOver');
    if (!isConfigured()) { reward.innerHTML = ''; boardOver.innerHTML = ''; return; }
    reward.innerHTML = `<span class="rr-pending">…</span>`;
    let res: SubmitResult;
    try {
      res = await submitRun(score, durationMs, roundToken, selectedTourney?.id);
    } catch (e) {
      reward.innerHTML = `<span class="rr-note">${e instanceof SignInRequiredError ? t('play.signIn') : t('play.error')}</span>`;
      return;
    }
    const rankLine = res.ranked
      ? `<span class="rr-stat"><b>${t('play.rank')}</b> #${res.rank}/${res.total} · ${res.rp.toFixed(1)} RP</span>`
      : `<span class="rr-note">${t('play.notRanked')}</span>`;
    reward.innerHTML = `
      <span class="rr-stat xp">+${res.award} XP</span>
      <span class="rr-stat"><b>${t('play.level')}</b> ${res.level}</span>
      ${rankLine}`;
    if (selectedTourney) {
      try {
        boardOver.innerHTML = boardHtml(await fetchLeaderboard(selectedTourney.id, 5));
      } catch { boardOver.innerHTML = ''; }
    }
    roundToken = '';
    void refreshHub();
  }

  applyTranslations();
  buildShop();
  void refreshHub();
  showOverlay('menu');

  const loop = new GameLoop(
    (dt) => game.update(dt),
    () => { vp.beginFrame(); game.render(ctx); updateHud(); },
  );
  loop.start();
}
