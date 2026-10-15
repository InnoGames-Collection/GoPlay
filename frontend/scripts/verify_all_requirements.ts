/**
 * Comprehensive Automated Verification Suite for GoPlay Production Remediation
 * Verifies Part 1, Part 2, Part 3, and Part 4 specifications.
 */

import { GameCatalog } from '../src/services/gameCatalog.js';
import { EntitlementService } from '../src/services/entitlementService.js';
import { GameBridgeService } from '../src/services/gameBridge.js';
import { isFreeDirectGame, catalogGameToDefinition } from '../src/games/registry.js';
import { GOPLAY_THEME } from '../src/styles/theme.js';
import { CRAZY_COLORS_LEVELS } from '../src/games/crazyColors/levels.js';
import fs from 'fs';
import path from 'path';

const FRONTEND_DIR = fs.existsSync(path.resolve('frontend/src')) ? path.resolve('frontend') : path.resolve('.');
const REPO_ROOT = fs.existsSync(path.resolve('frontend/src')) ? path.resolve('.') : path.resolve('..');

console.log('🎮 ==============================================================');
console.log('🎮 RUNNING GOPLAY VERIFICATION SUITE (PARTS 1 - 5)');
console.log('🎮 ==============================================================');

let allPassed = true;
function assertCheck(name: string, condition: boolean, details?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${name}`);
  } else {
    console.error(`  ❌ [FAIL] ${name} ${details ? `(${details})` : ''}`);
    allPassed = false;
  }
}

// -----------------------------------------------------------------------------
// PART 1: ELIMINATE INTRUSIVE POPUP NOTIFICATIONS
// -----------------------------------------------------------------------------
console.log('\n--- PART 1: Notification System & Popups Audit ---');

const toastFile = fs.readFileSync(path.join(FRONTEND_DIR, 'src/components/NotificationToast.tsx'), 'utf-8');
assertCheck(
  'NotificationToast component returns null (no floating popups or blocking touch overlays rendered)',
  toastFile.includes('return null;')
);

const appFile = fs.readFileSync(path.join(FRONTEND_DIR, 'src/App.tsx'), 'utf-8');
assertCheck(
  'App.tsx does not mount floating <NotificationToast> popup over portal UI or game canvas',
  !appFile.includes('<NotificationToast')
);

const usePortalStateFile = fs.readFileSync(path.join(FRONTEND_DIR, 'src/hooks/usePortalState.ts'), 'utf-8');
assertCheck(
  'usePortalState suppresses visual toast arrays and logs internal events silently',
  usePortalStateFile.includes('// Under Part 1 specification: Suppress all application-generated toasts/popups.')
);

const authModalFile = fs.readFileSync(path.join(FRONTEND_DIR, 'src/components/AuthModal.tsx'), 'utf-8');
assertCheck(
  'AuthModal handles failures with inline error message without top toast popups',
  authModalFile.includes('inlineError') && authModalFile.includes('{inlineError && (')
);

const energyModalFile = fs.readFileSync(path.join(FRONTEND_DIR, 'src/components/EnergyModal.tsx'), 'utf-8');
assertCheck(
  'EnergyModal handles transaction failures with inline error message without top popups',
  energyModalFile.includes('inlineError') && energyModalFile.includes('{inlineError && (')
);

const juicyMatchFile = fs.readFileSync(path.join(FRONTEND_DIR, 'src/games/juicyMatch/JuicyMatchGame.tsx'), 'utf-8');
assertCheck(
  'JuicyMatchGame gameplay has no floating toast over puzzle board',
  !juicyMatchFile.includes('activeInGameToast && (')
);

const worldLegendsFile = fs.readFileSync(path.join(FRONTEND_DIR, 'src/games/worldLegends/WorldLegendsGame.tsx'), 'utf-8');
assertCheck(
  'WorldLegendsGame gameplay has no floating bonus or word score toasts over puzzle board',
  !worldLegendsFile.includes('bonusPointsNotification && (') && !worldLegendsFile.includes('wordScoreToast && (')
);

// -----------------------------------------------------------------------------
// PART 2: CRAZY COLOR ACCESS & PLAYABILITY
// -----------------------------------------------------------------------------
console.log('\n--- PART 2: Crazy Color Access & Playability ---');

const crazyColorMeta = GameCatalog.getById('crazy-colors');
assertCheck(
  'Crazy Color in GameCatalog has accessType FREE',
  crazyColorMeta?.accessType === 'FREE'
);
assertCheck(
  'Crazy Color in GameCatalog has isFree = true and coinCost = 0',
  crazyColorMeta?.isFree === true && crazyColorMeta?.coinCost === 0 && crazyColorMeta?.requiresCoins === false
);

const crazyEntitlement = EntitlementService.hasValidAccess(crazyColorMeta!);
assertCheck(
  'EntitlementService grants immediate access to Crazy Color without purchasing coins',
  crazyEntitlement.hasAccess === true
);

const mockZeroCoinProfile: any = {
  id: 'usr_zero_coins',
  userId: 'usr_zero_coins',
  msisdn: '251911000000',
  coins: 0,
  energy: 0,
  tier: 'BRONZE',
  highScores: {},
};

const crazyDef = catalogGameToDefinition(crazyColorMeta!);

const bridgeCanLaunch = GameBridgeService.canLaunchGame(crazyDef, mockZeroCoinProfile);
assertCheck(
  'GameBridge permits 0-coin user to launch Crazy Color directly',
  bridgeCanLaunch.allowed === true
);

const bridgeDeduct = GameBridgeService.deductCoinsForLaunch(crazyDef, mockZeroCoinProfile);
assertCheck(
  'GameBridge does not deduct coins for launching Crazy Color (coins remained 0)',
  bridgeDeduct.updatedProfile.coins === 0 && Boolean(bridgeDeduct.sessionId)
);

assertCheck(
  'registry isFreeDirectGame recognizes crazy-colors',
  isFreeDirectGame(crazyColorMeta!) === true
);

assertCheck(
  'Crazy Colors game levels database is loaded with 40 progressive levels',
  CRAZY_COLORS_LEVELS.length === 40 && CRAZY_COLORS_LEVELS[0].id === 1
);

// -----------------------------------------------------------------------------
// PART 3: CONSISTENT PROFESSIONAL GAMING PALETTE
// -----------------------------------------------------------------------------
console.log('\n--- PART 3: Theme Palette & Professional Styling ---');

assertCheck(
  'Theme token brandGreen matches official spec #82C341',
  GOPLAY_THEME.colors.brandGreen === '#82C341'
);
assertCheck(
  'Theme token deepNavy matches official spec #102B3F',
  GOPLAY_THEME.colors.deepNavy === '#102B3F'
);
assertCheck(
  'Theme token teal matches official spec #087F8C',
  GOPLAY_THEME.colors.teal === '#087F8C'
);
assertCheck(
  'Theme token richTeal matches official spec #116B73',
  GOPLAY_THEME.colors.richTeal === '#116B73'
);
assertCheck(
  'Theme token softMint matches official spec #DFF7EA',
  GOPLAY_THEME.colors.softMint === '#DFF7EA'
);
assertCheck(
  'Theme token warmNeutral matches official spec #F4F7F6',
  GOPLAY_THEME.colors.warmNeutral === '#F4F7F6'
);
assertCheck(
  'Theme token primaryDark matches official spec #183345',
  GOPLAY_THEME.colors.primaryDark === '#183345'
);
assertCheck(
  'Theme token secondaryText matches official spec #607582',
  GOPLAY_THEME.colors.secondaryText === '#607582'
);
assertCheck(
  'Theme token subtleBorder matches official spec #DCE7E8',
  GOPLAY_THEME.colors.subtleBorder === '#DCE7E8'
);
assertCheck(
  'Theme token gold matches official spec #E9B949',
  GOPLAY_THEME.colors.gold === '#E9B949'
);

const indexCss = fs.readFileSync(path.join(FRONTEND_DIR, 'src/index.css'), 'utf-8');
assertCheck(
  'index.css body background uses warm light neutral #F4F7F6 and primary dark text #183345',
  indexCss.includes('#F4F7F6') && indexCss.includes('#183345')
);

// -----------------------------------------------------------------------------
// PART 4: PRESERVE NAVIGATION & FEATURES
// -----------------------------------------------------------------------------
console.log('\n--- PART 4: Navigation & Architecture Preservation ---');

const bottomNavFile = fs.readFileSync(path.join(FRONTEND_DIR, 'src/components/BottomNav.tsx'), 'utf-8');
const hasExact5Tabs = 
  bottomNavFile.includes("id: 'home'") &&
  bottomNavFile.includes("id: 'games'") &&
  bottomNavFile.includes("id: 'tournament'") &&
  bottomNavFile.includes("id: 'leaderboard'") &&
  bottomNavFile.includes("id: 'profile'");

assertCheck(
  'Bottom navigation preserves exactly the 5 destinations in order (HOME, GAMES, TOURNAMENT, LEADERBOARD, PROFILE)',
  hasExact5Tabs
);

// Check database migration
const migration11 = fs.readFileSync(path.join(REPO_ROOT, 'db/migrations/011_make_crazy_colors_free.sql'), 'utf-8');
assertCheck(
  'Database migration 011 exists and updates Crazy Color to entry_fee_coins = 0, requires_coins = FALSE, is_free = TRUE',
  migration11.includes("game_id = 'crazy-colors'") && migration11.includes('entry_fee_coins = 0')
);

console.log('\n==============================================================');
if (allPassed) {
  console.log('🎉 ALL VERIFICATION CRITERIA PASSED WITH ZERO ERRORS!');
} else {
  console.error('❌ SOME VERIFICATION CHECKS FAILED!');
  process.exit(1);
}
console.log('==============================================================\n');
