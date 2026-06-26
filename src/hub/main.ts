import '../styles/base.css';
import './hub.css';
import { applyTranslations, getLang, setLang, t } from '../i18n';
import { registerPwa } from '../engine/pwa';
import { isConfigured } from '../platform/supabase';
import { currentUser, onAuthChange, authAvailable } from '../platform/auth';
import { mountSignIn } from './signin';
import { mountWallet, openStore } from './wallet';
import {
  fetchTournaments, fetchLeaderboard, fetchSeasonLeaderboard, fetchMyXp, fetchMyEntry,
  type Tournament, type LeaderRow, type SeasonRow,
} from '../platform/tournament';
import { fetchBalance } from '../platform/wallet';

registerPwa();

const $ = <T extends HTMLElement>(sel: string): T => document.querySelector<T>(sel)!;
const esc = (s: string): string => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

let tourneys: Tournament[] = [];
let featured: Tournament | null = null;

async function refreshAll(): Promise<void> {
  if (!isConfigured()) {
    $('#featured').innerHTML = `<p class="muted">${t('play.offline')}</p>`;
    $('#tourneyList').innerHTML = '';
    return;
  }
  try {
    const [t, xp, coins] = await Promise.all([fetchTournaments(), fetchMyXp(), fetchBalance()]);
    tourneys = t;
    featured = t[0] ?? null;
    renderFeatured(xp, coins);
    renderTourneyList();
    renderSeason();
    renderBalances(xp, coins);
  } catch {
    $('#featured').innerHTML = `<p class="muted">${t('play.error')}</p>`;
  }
}

function renderBalances(xp: { level: number; xp: number }, coins: number): void {
  $('#topBalances').innerHTML = `
    <span class="bal-chip">Lv <strong>${xp.level}</strong></span>
    <span class="bal-chip">⭐ <strong>${xp.xp.toLocaleString()}</strong></span>
    <span class="bal-chip">🪙 <strong id="coinBal">${coins.toLocaleString()}</strong></span>
    <button id="buyBtn" class="btn sm primary">${t('hub.buyCoins')}</button>`;
  $('#buyBtn')?.addEventListener('click', () => openStore());
}

function renderFeatured(xp: { level: number }, coins: number): void {
  const host = $('#featured');
  if (!featured) { host.innerHTML = `<p class="muted">${t('play.noTourney')}</p>`; return; }
  const title = getLang() === 'am' ? featured.titleAm : featured.titleEn;
  host.innerHTML = `
    <article class="featured-card">
      <div class="fc-info">
        <span class="fc-badge">🏆 ${esc(title)}</span>
        <h2>EthioRunner</h2>
        <p class="fc-meta">${featured.entryFeeCoins} 🪙 · ${featured.attempts} ${t('hub.attempts')} · Lv ${featured.minLevel}+</p>
        <p class="fc-bal">🪙 ${coins.toLocaleString()} · Lv ${xp.level}</p>
        <a class="btn primary" href="play/">▶ ${t('hub.play')}</a>
      </div>
      <div class="fc-board">
        <div class="fc-board-head">${t('hub.leaderboard')}</div>
        <ol class="leader-list" id="featBoard"><li class="muted-small">…</li></ol>
      </div>
    </article>`;
  void fetchLeaderboard(featured.id, 5).then((board) => {
    const list = $('#featBoard');
    if (!list) return;
    list.innerHTML = board.length
      ? board.map((r) => rowHtml(r)).join('')
      : `<li class="muted-small">${t('play.noBoard')}</li>`;
  }).catch(() => {});
}

function rowHtml(r: LeaderRow): string {
  return `<li class="leader-row${r.isPlayer ? ' me' : ''}">
    <span class="lr-rank">${r.rank}</span>
    <span class="lr-name">${esc(r.isPlayer ? t('play.you') : r.name)}</span>
    <span class="lr-score">${r.score.toFixed(1)} RP</span>
  </li>`;
}

function renderTourneyList(): void {
  const host = $('#tourneyList');
  if (!tourneys.length) { host.innerHTML = ''; return; }
  host.innerHTML = tourneys.map((tour) => {
    const title = getLang() === 'am' ? tour.titleAm : tour.titleEn;
    const period = t(`hub.${tour.period}`);
    return `<article class="tour-card" data-id="${tour.id}">
      <div class="tc-top"><span class="tc-period">${esc(period)}</span><span class="tc-fee">${tour.entryFeeCoins} 🪙</span></div>
      <h3>${esc(title)}</h3>
      <p class="tc-meta">${tour.attempts} ${t('hub.attempts')} · Lv ${tour.minLevel}+</p>
      <div class="tc-board" id="board-${tour.id}">…</div>
      <a class="btn" href="play/">${t('hub.enter')}</a>
    </article>`;
  }).join('');

  for (const tour of tourneys) {
    void fetchLeaderboard(tour.id, 3).then((board) => {
      const el = document.querySelector(`#board-${tour.id}`);
      if (el) el.innerHTML = board.length
        ? `<ol class="leader-list compact">${board.map(rowHtml).join('')}</ol>`
        : `<p class="muted-small">${t('play.noBoard')}</p>`;
    }).catch(() => {});
    void fetchMyEntry(tour.id).then((e) => {
      if (e && e.attemptsLeft > 0) {
        const card = document.querySelector(`.tour-card[data-id="${tour.id}"] .tc-meta`);
        if (card) card.textContent += ` · 🎟️ ${e.attemptsLeft}`;
      }
    }).catch(() => {});
  }
}

function seasonRowHtml(r: SeasonRow): string {
  return `<li class="leader-row${r.isPlayer ? ' me' : ''}">
    <span class="lr-rank">${r.rank}</span>
    <span class="lr-name">${esc(r.isPlayer ? t('play.you') : r.name)}</span>
    <span class="lr-score">${r.seasonScore.toFixed(1)} · ${r.tourneys}🏆</span>
  </li>`;
}

function renderSeason(): void {
  void fetchSeasonLeaderboard(10).then((board) => {
    $('#seasonBoard').innerHTML = board.length
      ? `<ol class="leader-list">${board.map(seasonRowHtml).join('')}</ol>`
      : `<p class="muted-small">${t('play.noBoard')}</p>`;
  }).catch(() => {
    $('#seasonBoard').innerHTML = `<p class="muted-small">${t('play.error')}</p>`;
  });
}

document.getElementById('langEn')?.addEventListener('click', () => setLang('en'));
document.getElementById('langAm')?.addEventListener('click', () => setLang('am'));

applyTranslations();
if (authAvailable()) mountSignIn();
void mountWallet();
onAuthChange(() => void refreshAll());
void currentUser().then(() => refreshAll());
