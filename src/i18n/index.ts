export type Lang = 'en' | 'am';

const STRINGS: Record<string, { en: string; am: string }> = {
  'app.title': { en: 'GoPlay', am: 'ጎፕሌይ' },
  'hub.play': { en: 'Play EthioRunner', am: 'ኢትዮሯጭ ይጫወቱ' },
  'hub.coins': { en: 'Coins', am: 'ሳንቲም' },
  'hub.signIn': { en: 'Sign in', am: 'ይግቡ' },
  'hub.signOut': { en: 'Sign out', am: 'ይውጡ' },
  'hub.tournaments': { en: 'Tournaments', am: 'ውድድሮች' },
  'hub.season': { en: 'Season board', am: 'የወቅት ሰንጠረዥ' },
  'hub.leaderboard': { en: 'Leaderboard', am: 'ሰንጠረዥ' },
  'hub.buyCoins': { en: 'Buy coins', am: 'ሳንቲም ግዙ' },
  'hub.wallet': { en: 'Wallet', am: 'ቦርሳ' },
  'hub.level': { en: 'Level', am: 'ደረጃ' },
  'hub.xp': { en: 'XP', am: 'XP' },
  'hub.daily': { en: 'Daily', am: 'ዕለታዊ' },
  'hub.weekly': { en: 'Weekly', am: 'ሳምንታዊ' },
  'hub.monthly': { en: 'Monthly', am: 'ወርሃዊ' },
  'hub.enter': { en: 'Enter', am: 'ይግቡ' },
  'hub.attempts': { en: 'attempts', am: 'ሙከራዎች' },
  'hub.prize': { en: 'Prize pool', am: 'ሽልማት' },
  'hub.yourRank': { en: 'Your rank', am: 'ደረጃዎ' },
  'hub.unranked': { en: 'Not ranked yet', am: 'ገና አልተሰፈረም' },
  'hub.admin': { en: 'Admin', am: 'አስተዳዳሪ' },
  'play.score': { en: 'Score', am: 'ነጥብ' },
  'play.coins': { en: 'Run coins', am: 'ሳንቲም' },
  'play.best': { en: 'Best', am: 'ምርጥ' },
  'play.play': { en: 'Play', am: 'ይጫወቱ' },
  'play.paused': { en: 'Paused', am: 'ቆሟል' },
  'play.resume': { en: 'Resume', am: 'Continue' },
  'play.restart': { en: 'Play again', am: 'እንደገና' },
  'play.gameOver': { en: 'Game over', am: 'ጨዋታ አልቋል' },
  'play.newBest': { en: 'New session best!', am: 'አዲስ ምርጥ!' },
  'play.skins': { en: 'Runners', am: 'ሯጮች' },
  'play.selected': { en: 'Selected', am: 'ተመርጧል' },
  'play.select': { en: 'Select', am: 'ምረጥ' },
  'play.enter': { en: 'Enter tournament', am: 'ውድድር ይግቡ' },
  'play.attempts': { en: 'attempts', am: 'ሙከራ' },
  'play.attemptsLeft': { en: 'Attempts left', am: 'ቀሩ' },
  'play.needCoins': { en: 'Need more coins', am: 'ሳንቲም ያስፈልጋል' },
  'play.signIn': { en: 'Sign in to save progress', am: 'ለመቀጠል ይግቡ' },
  'play.needLevel': { en: 'Reach level', am: 'ደረጃ ይድሱ' },
  'play.rankedRun': { en: 'Ranked run — best RP counts', am: 'ደረጃ የሚቆጠር ሩጫ' },
  'play.practiceRun': { en: 'Practice — XP only (3/day cap)', am: 'ልምምድ — XP ብቻ' },
  'play.rank': { en: 'Rank', am: 'ደረጃ' },
  'play.level': { en: 'Level', am: 'ደረጃ' },
  'play.notRanked': { en: 'Practice run — enter tournament to rank', am: 'ልምምድ — ለደረጃ ይግቡ' },
  'play.leaderboard': { en: 'Leaderboard', am: 'ሰንጠረዥ' },
  'play.noBoard': { en: 'No scores yet', am: 'እስካሁን የለም' },
  'play.noTourney': { en: 'No live tournament', am: 'ውድድር የለም' },
  'play.offline': { en: 'Connect Supabase to play online', am: 'ኦንላይን ለመጫወት ያገናኙ' },
  'play.error': { en: 'Something went wrong', am: 'ስህተት' },
  'play.you': { en: 'You', am: 'እርስዎ' },
  'play.controls': { en: 'Swipe or arrow keys · jump ▲ slide ▼', am: 'ሸብልል/ቀስት · ዝለል ▲ ተንሸራትት ▼' },
  'play.start': { en: 'Tap Play to start', am: 'ለመጀመር Play' },
  'play.howto': { en: 'How to play', am: 'እንዴት' },
  'play.gotit': { en: 'Got it', am: 'እሺ' },
  'play.ftueLane': { en: 'Swipe or arrows to change lane', am: 'መንገድ ለመቀየር' },
  'play.ftueJump': { en: 'Swipe up / ▲ to jump', am: 'ለመዝለል ▲' },
  'play.ftueSlide': { en: 'Swipe down / ▼ to slide', am: 'ለመንሸራትት ▼' },
  'play.ftueRank': { en: 'Enter a tournament — best RP ranks on the board', am: 'ውድድር ይግቡ — RP ይቆጠራል' },
};

const STORAGE_KEY = 'goplay.lang';
let lang: Lang = (localStorage.getItem(STORAGE_KEY) as Lang | null) ?? 'en';

export function getLang(): Lang { return lang; }
export function setLang(next: Lang): void {
  lang = next;
  localStorage.setItem(STORAGE_KEY, next);
  applyTranslations();
}

export function t(key: string): string {
  return STRINGS[key]?.[lang] ?? STRINGS[key]?.en ?? key;
}

export function applyTranslations(): void {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = t(key);
  });
}
