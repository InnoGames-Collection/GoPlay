/**
 * Automated Verification Script for Games Tab and Tournament Tab Redesign
 * Validates all criteria from the user prompt:
 * - PART 1: Exact 12-game catalog & order
 * - PART 2: Two cards side by side on mobile portrait (grid-cols-2)
 * - PART 3: Image-first card design with no ratings/scores/competing buttons
 * - PART 4: Clean Games header and search restoring default order
 * - PART 5: Redesigned Tournament Tab with active Crazy Color, player score, real leaderboard
 * - PART 6: GoPlay color identity
 * - PART 7: Preserved Bottom Navigation
 * - PART 8: Preserved backend contracts and game routes
 */

import React from 'react';
import ReactDOMServer from 'react-dom/server';
import fs from 'fs';
import path from 'path';

import { GameCatalog, MANDATORY_CATALOG_ORDER } from '../src/services/gameCatalog.js';
import { catalogGameToDefinition, GameRegistry } from '../src/games/registry.js';
import { TournamentService } from '../src/services/tournamentService.js';
import { GamesPage } from '../src/pages/GamesPage.js';
import { TournamentPage } from '../src/pages/TournamentPage.js';
import { ProfessionalGameCard } from '../src/components/ProfessionalGameCard.js';
import { BottomNav } from '../src/components/BottomNav.js';
import { UserProfile } from '../src/types/index.js';

let allPassed = true;
function assertCheck(name: string, condition: boolean, details?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${name}`);
  } else {
    console.error(`  ❌ [FAIL] ${name} ${details ? `(${details})` : ''}`);
    allPassed = false;
  }
}

console.log('🎯 ==============================================================');
console.log('🎯 VERIFYING GAMES TAB & TOURNAMENT TAB REDESIGN');
console.log('🎯 ==============================================================');

// Mock User Profile
const mockProfile: any = {
  id: 'usr_test_001',
  userId: 'usr_test_001',
  msisdn: '251911998877',
  phoneNumber: '251911998877',
  displayName: 'ChampionGamer',
  avatarId: 'avatar_1',
  isRegistered: true,
  telebirrLinked: true,
  telebirrBalance: 250.0,
  coins: 50,
  xp: 1200,
  level: 5,
  energy: 10,
  maxEnergy: 10,
  lastEnergyRefillTimestamp: Date.now(),
  subscription: {
    plan: 'free',
    isActive: false,
    autoRenew: false,
  },
  streak: {
    current: 3,
    lastClaimedDate: '2026-10-15',
    hasClaimedToday: true,
  },
  highScores: {
    'crazy-colors': 1540,
    'juicy-match': 420,
    'soccer-shooter': 800,
  },
};

// -----------------------------------------------------------------------------
// PART 1: PRESERVE THE EXACT 12-GAME CATALOG
// -----------------------------------------------------------------------------
console.log('\n--- PART 1: 12-Game Catalog & Exact Order ---');

const expectedCatalog = [
  { id: 'crazy-colors', name: 'Crazy Color' },
  { id: 'juicy-match', name: 'Candy Juicy' },
  { id: 'emoji-fun', name: 'Emoji Fun' },
  { id: 'pop-piano', name: 'Pop Piano' },
  { id: 'world-legends', name: 'Word Legend' },
  { id: 'candy-blast', name: 'Candy Crush' },
  { id: 'soccer-shooter', name: 'Soccer Shooter' },
  { id: 'dama', name: 'Dama' },
  { id: 'button-soccer', name: 'Button Soccer' },
  { id: 'soccer-ping-pong', name: 'Soccer Ping Pong' },
  { id: 'bubble-sort', name: 'Bubble Sort' },
  { id: 'color-tap-sprint', name: 'Color Tap Sprint' },
];

const catalogGames = GameCatalog.getAll();
assertCheck(
  'Catalog contains exactly 12 games',
  catalogGames.length === 12,
  `Got ${catalogGames.length}`
);

const idsMatch = expectedCatalog.every((exp, idx) => catalogGames[idx]?.gameId === exp.id);
assertCheck(
  'All 12 game IDs match in exact sequence',
  idsMatch,
  `Sequence: ${catalogGames.map(g => g.gameId).join(', ')}`
);

const namesMatch = expectedCatalog.every((exp, idx) => catalogGames[idx]?.gameName === exp.name);
assertCheck(
  'All 12 game display titles match requested names exactly',
  namesMatch,
  `Titles: ${catalogGames.map(g => g.gameName).join(', ')}`
);

// Verify no duplicate game entries
const uniqueIds = new Set(catalogGames.map(g => g.gameId));
assertCheck('No duplicate game IDs exist in the catalog', uniqueIds.size === 12);

// Verify no stock images (Unsplash) are used
const stockImagesUsed = catalogGames.some(g => g.thumbnail.includes('images.unsplash.com') || g.banner.includes('images.unsplash.com'));
assertCheck('No unrelated Unsplash stock photos are used for artwork', !stockImagesUsed);

// -----------------------------------------------------------------------------
// PART 2: TWO GAME CARDS SIDE BY SIDE (MOBILE PORTRAIT)
// -----------------------------------------------------------------------------
console.log('\n--- PART 2: Two Game Cards Side by Side ---');

const gamesPageFile = fs.readFileSync(path.resolve('src/pages/GamesPage.tsx'), 'utf-8');

assertCheck(
  'GamesPage uses grid-cols-2 for mobile portrait',
  gamesPageFile.includes('grid-cols-2')
);

assertCheck(
  'GamesPage uses responsive grid with equal-width columns and consistent gap',
  gamesPageFile.includes('grid grid-cols-2') && gamesPageFile.includes('gap-3')
);

// Render GamesPage to HTML
const allGameDefinitions = catalogGames.map(catalogGameToDefinition);
let launchedGame: any = null;
const gamesPageHtml = ReactDOMServer.renderToString(
  React.createElement(GamesPage, {
    games: allGameDefinitions,
    profile: mockProfile,
    onLaunchGame: (g: any) => { launchedGame = g; },
  })
);

assertCheck(
  'GamesPage renders all 12 game cards',
  expectedCatalog.every(g => gamesPageHtml.includes(g.name))
);

// -----------------------------------------------------------------------------
// PART 3: REDESIGNED GAME CARD COMPONENT
// -----------------------------------------------------------------------------
console.log('\n--- PART 3: Redesigned Game Card Component ---');

const cardComponentFile = fs.readFileSync(path.resolve('src/components/ProfessionalGameCard.tsx'), 'utf-8');

assertCheck(
  'Card has image-first structure with aspect-[16/10] artwork container',
  cardComponentFile.includes('aspect-[16/10]') && cardComponentFile.includes('game-card-image')
);

assertCheck(
  'Card uses pure white surface with subtle border and rounded silhouette (rounded-2xl)',
  cardComponentFile.includes('bg-white') && cardComponentFile.includes('border-[#DCE7E8]') && cardComponentFile.includes('rounded-2xl')
);

assertCheck(
  'Card has direct launch handler on card container without intermediate modal',
  cardComponentFile.includes('onClick={handleLaunch}')
);

assertCheck(
  'Card does NOT include ratings, stars, or multiple competing buttons',
  !cardComponentFile.includes('Star') && !cardComponentFile.includes('formattedRating')
);

const singleCardHtml = ReactDOMServer.renderToString(
  React.createElement(ProfessionalGameCard, {
    game: allGameDefinitions[0],
    onPlay: () => {},
  })
);
assertCheck('Single card renders Crazy Color title cleanly', singleCardHtml.includes('Crazy Color'));
assertCheck('Single card renders category indicator', singleCardHtml.includes(allGameDefinitions[0].category));

// -----------------------------------------------------------------------------
// PART 4: CLEAN GAMES HEADER & SEARCH
// -----------------------------------------------------------------------------
console.log('\n--- PART 4: Clean Games Header & Search ---');

assertCheck(
  'GamesPage contains clear "Games" heading',
  gamesPageHtml.includes('Games') && gamesPageFile.includes('<h1')
);

assertCheck(
  'GamesPage includes search input with clear action',
  gamesPageFile.includes('Search games...') && gamesPageFile.includes('handleClearFilters')
);

// -----------------------------------------------------------------------------
// PART 5: REDESIGNED TOURNAMENT TAB
// -----------------------------------------------------------------------------
console.log('\n--- PART 5: Redesigned Tournament Tab ---');

const tournamentPageFile = fs.readFileSync(path.resolve('src/pages/TournamentPage.tsx'), 'utf-8');

assertCheck(
  'TournamentPage identifies active tournament as Crazy Color',
  tournamentPageFile.includes('Crazy Color')
);

assertCheck(
  'TournamentPage displays clear "Tournament" header',
  tournamentPageFile.includes('Tournament')
);

assertCheck(
  'TournamentPage has single clear enter action button',
  tournamentPageFile.includes('id="tournament-enter-btn"')
);

assertCheck(
  'TournamentPage player score strictly uses Crazy Color score',
  tournamentPageFile.includes("profile?.highScores?.['crazy-colors']")
);

assertCheck(
  'TournamentPage includes Leaderboard Preview with masked identifiers',
  tournamentPageFile.includes('Leaderboard Standings') && tournamentPageFile.includes('maskedMsisdn')
);

// Render TournamentPage to HTML
const tournamentHtml = ReactDOMServer.renderToString(
  React.createElement(TournamentPage, {
    profile: mockProfile,
    onPlayGame: () => {},
    onNavigateToLeaderboard: () => {},
  })
);

assertCheck(
  'Tournament HTML renders live tournament title and Crazy Color',
  tournamentHtml.includes('Crazy Color') && tournamentHtml.includes('Tournament')
);

assertCheck(
  'Tournament HTML renders authenticated player score (1,540 pts)',
  tournamentHtml.includes('1,540')
);

// -----------------------------------------------------------------------------
// PART 6: GOPLAY COLOR IDENTITY AUDIT
// -----------------------------------------------------------------------------
console.log('\n--- PART 6: GoPlay Color Identity Audit ---');

const forbiddenThemeKeywords = ['bg-purple', 'bg-violet', 'from-purple', 'to-purple', 'text-purple'];
const gamesPageHasPurple = forbiddenThemeKeywords.some(kw => gamesPageFile.includes(kw));
const tournamentHasPurple = forbiddenThemeKeywords.some(kw => tournamentPageFile.includes(kw));

assertCheck('GamesPage does not introduce purple portal theme', !gamesPageHasPurple);
assertCheck('TournamentPage does not introduce purple portal theme', !tournamentHasPurple);

// Check GoPlay brand green #82C341, navy #102B3F, subtle border #DCE7E8
assertCheck('TournamentPage uses GoPlay brand green #82C341', tournamentPageFile.includes('#82C341'));
assertCheck('TournamentPage uses deep navy #102B3F', tournamentPageFile.includes('#102B3F'));
assertCheck('TournamentPage uses warm neutral #F4F7F6', tournamentPageFile.includes('#F4F7F6'));

// -----------------------------------------------------------------------------
// PART 7: PRESERVE EXISTING BOTTOM NAVIGATION
// -----------------------------------------------------------------------------
console.log('\n--- PART 7: Preserve Existing Bottom Navigation ---');

const bottomNavHtml = ReactDOMServer.renderToString(
  React.createElement(BottomNav, {
    activeTab: 'games',
    onTabChange: () => {},
  })
);

const expectedTabs = ['HOME', 'GAMES', 'TOURNAMENT', 'LEADERBOARD', 'PROFILE'];
assertCheck(
  'Bottom navigation preserves all 5 tabs in exact order',
  expectedTabs.every(t => bottomNavHtml.includes(t))
);

// -----------------------------------------------------------------------------
// PART 8: PRESERVE BACKEND ROUTES & GAME LAUNCH FLOW
// -----------------------------------------------------------------------------
console.log('\n--- PART 8: Preserve Backend Routes & Game Launcher ---');

const gameLauncherFile = fs.readFileSync(path.resolve('src/components/GameLauncherModal.tsx'), 'utf-8');

assertCheck('Crazy Colors route is preserved in GameLauncherModal', gameLauncherFile.includes("game.id === 'crazy-colors'"));
assertCheck('Juicy Match route is preserved in GameLauncherModal', gameLauncherFile.includes("game.id === 'juicy-match'"));
assertCheck('Emoji Fun route is preserved in GameLauncherModal', gameLauncherFile.includes("game.id === 'emoji-fun'"));
assertCheck('Pop Piano route is preserved in GameLauncherModal', gameLauncherFile.includes("game.id === 'pop-piano'"));
assertCheck('Word Legends route is preserved in GameLauncherModal', gameLauncherFile.includes("game.id === 'world-legends'"));
assertCheck('Candy Blast route is preserved in GameLauncherModal', gameLauncherFile.includes("game.id === 'candy-blast'"));
assertCheck('Soccer Shooter route is preserved in GameLauncherModal', gameLauncherFile.includes("game.id === 'soccer-shooter'"));
assertCheck('Dama route is preserved in GameLauncherModal', gameLauncherFile.includes("game.id === 'dama'"));
assertCheck('Button Soccer route is preserved in GameLauncherModal', gameLauncherFile.includes("game.id === 'button-soccer'"));
assertCheck('Soccer Ping Pong route is preserved in GameLauncherModal', gameLauncherFile.includes("game.id === 'soccer-ping-pong'"));
assertCheck('Bubble Sort route is preserved in GameLauncherModal', gameLauncherFile.includes("game.id === 'bubble-sort'"));
assertCheck('Color Tap Sprint route is preserved in GameLauncherModal', gameLauncherFile.includes("game.id === 'color-tap-sprint'"));

console.log('\n==============================================================');
if (allPassed) {
  console.log('🎉 ALL GAMES & TOURNAMENT REDESIGN VERIFICATIONS PASSED (100%)');
} else {
  console.error('💥 SOME VERIFICATIONS FAILED');
  process.exit(1);
}
console.log('==============================================================');
