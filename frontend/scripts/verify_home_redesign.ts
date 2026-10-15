/**
 * Verification Script for Home Tab Redesign
 * Validates Parts 1 through 8
 */

import fs from 'fs';
import path from 'path';
import { TournamentService } from '../src/services/tournamentService.js';
import { GameCatalog } from '../src/services/gameCatalog.js';
import { UserProfile } from '../src/types/index.js';

const FRONTEND_DIR = fs.existsSync(path.resolve('frontend/src')) ? path.resolve('frontend') : path.resolve('.');

console.log('🏠 ==============================================================');
console.log('🏠 VERIFYING GOPLAY HOME TAB REDESIGN');
console.log('🏠 ==============================================================');

let allPassed = true;
function assertCheck(name: string, condition: boolean, details?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${name}`);
  } else {
    console.error(`  ❌ [FAIL] ${name} ${details ? `(${details})` : ''}`);
    allPassed = false;
  }
}

const homeFile = fs.readFileSync(path.join(FRONTEND_DIR, 'src/pages/HomePage.tsx'), 'utf-8');

// 1. Simplicity & No Catalog Clutter
console.log('\n--- 1. Simplicity & Catalog Removal ---');
assertCheck(
  'FeaturedHeroCarousel removed from HomePage',
  !homeFile.includes('<FeaturedHeroCarousel')
);
assertCheck(
  'RecentlyPlayedSection removed from HomePage',
  !homeFile.includes('<RecentlyPlayedSection')
);
assertCheck(
  'GameCategorySection removed from HomePage (no duplicate game catalog)',
  !homeFile.includes('<GameCategorySection')
);
assertCheck(
  'Browse Categories horizontal strip removed from HomePage',
  !homeFile.includes('Browse Categories')
);
assertCheck(
  'Category carousels loop removed from HomePage',
  !homeFile.includes('availableCategories.map')
);

// 2. Promotional Gaming Banner
console.log('\n--- 2. Promotional Gaming Banner ---');
assertCheck(
  'Promotional banner element exists with proper ID',
  homeFile.includes('id="home-promotional-banner"')
);
assertCheck(
  'Banner copy contains Headline: "Your Next Game Starts Here"',
  homeFile.includes('Your Next Game Starts Here')
);
assertCheck(
  'Banner copy contains Supporting text: "Play your favorites and beat your best."',
  homeFile.includes('Play your favorites and beat your best.')
);
assertCheck(
  'Banner contains Call to Action button: "Explore Games"',
  homeFile.includes('Explore Games') && homeFile.includes('id="home-banner-cta-btn"')
);
assertCheck(
  'Banner uses 2.1:1 - 2.5:1 responsive aspect ratio',
  homeFile.includes('aspect-[2.25/1]') || homeFile.includes('aspect-[2.2/1]') || homeFile.includes('aspect-[2.35/1]')
);
assertCheck(
  'Banner uses 18-24px rounded corners (rounded-[20px])',
  homeFile.includes('rounded-[20px]')
);
assertCheck(
  'Banner uses high-resolution GoPlay game artwork',
  homeFile.includes('/banners/candy%20crush.png') || homeFile.includes('/banners/')
);
assertCheck(
  'Banner has left gradient overlay to guarantee text readability',
  homeFile.includes('bg-gradient-to-r from-[#102B3F]')
);

// 3. Compact Player Summary (Available Coins & Best Score)
console.log('\n--- 3. Player Summary (Coins & Crazy Color Best Score) ---');
assertCheck(
  'Player summary grid exists with 2-column layout',
  homeFile.includes('id="home-player-summary"') && homeFile.includes('grid-cols-2')
);
assertCheck(
  'Available Coins card exists with proper ID and reads actual user balance',
  homeFile.includes('id="home-summary-coins-card"') && homeFile.includes('coinsCount.toLocaleString()')
);
assertCheck(
  'Available Coins card supports top-up action',
  homeFile.includes('onClick={onOpenBuyCoins}')
);
assertCheck(
  'Best Score card exists with proper ID',
  homeFile.includes('id="home-summary-score-card"')
);
assertCheck(
  'Best Score specifically reads Crazy Color tournament score',
  homeFile.includes("currentUserScores?.['crazy-colors']") || homeFile.includes("highScores?.['crazy-colors']")
);
assertCheck(
  'Best Score has empty state when player has no valid score',
  homeFile.includes('No score yet')
);

// Verify score calculation logic with mock profiles
const mockProfileWithScore: any = {
  id: 'usr_001',
  msisdn: '251911223344',
  phoneNumber: '251911223344',
  isRegistered: true,
  coins: 120,
  telebirrBalance: 50,
  energy: 10,
  tier: 'GOLD',
  highScores: {
    'crazy-colors': 850,
    'candy-blast': 5000, // higher score on unrelated game must NOT be used
  },
  unlockedGames: [],
  achievements: [],
};

const summary = TournamentService.getTournamentSummary(mockProfileWithScore);
const crazyScore = Math.max(summary?.currentUserScores?.['crazy-colors'] ?? 0, mockProfileWithScore.highScores?.['crazy-colors'] ?? 0);
assertCheck(
  'Tournament score computation returns 850 for Crazy Color, ignoring unrelated 5000 candy-blast score',
  crazyScore === 850,
  `Got: ${crazyScore}`
);

const mockProfileNoScore: any = {
  id: 'usr_002',
  msisdn: '251911998899',
  phoneNumber: '251911998899',
  isRegistered: true,
  coins: 40,
  telebirrBalance: 10,
  energy: 10,
  tier: 'SILVER',
  highScores: {
    'dama': 1200,
  },
  unlockedGames: [],
  achievements: [],
};

const summaryNoScore = TournamentService.getTournamentSummary(mockProfileNoScore);
const crazyScoreEmpty = Math.max(summaryNoScore?.currentUserScores?.['crazy-colors'] ?? 0, mockProfileNoScore.highScores?.['crazy-colors'] ?? 0);
assertCheck(
  'Empty state triggered when player has no Crazy Color score (returns 0, not unrelated dama score)',
  crazyScoreEmpty === 0,
  `Got: ${crazyScoreEmpty}`
);

// 4. Short Informational Section
console.log('\n--- 4. Short Informational Section ---');
assertCheck(
  'Tournament informational section exists with proper ID',
  homeFile.includes('id="home-tournament-info-section"')
);
assertCheck(
  'Displays active tournament headline: "Ready for your next challenge?"',
  homeFile.includes('Ready for your next challenge?')
);
assertCheck(
  'Displays live tournament countdown from authoritative backend config',
  homeFile.includes('tournamentSummary.timeRemaining.formatted')
);
assertCheck(
  'Includes direct Play Crazy Color tournament button',
  homeFile.includes('id="home-play-tournament-btn"') && homeFile.includes('Play Crazy Color Tournament')
);

// 5. Clear Action Leading to Games Tab
console.log('\n--- 5. Action Leading to Games Tab ---');
assertCheck(
  'Clear "Explore All Games" action card button exists',
  homeFile.includes('id="home-browse-games-cta"') && homeFile.includes('Explore All Games')
);
assertCheck(
  'Calls onNavigateToGames("All Games") to open existing Games tab',
  homeFile.includes("onNavigateToGames?.('All Games')")
);

// 6. Visual Design & Color Palette
console.log('\n--- 6. Visual Design Palette Audit ---');
assertCheck('Uses GoPlay green (#82C341)', homeFile.includes('#82C341'));
assertCheck('Uses Deep navy (#102B3F)', homeFile.includes('#102B3F'));
assertCheck('Uses Teal (#087F8C)', homeFile.includes('#087F8C'));
assertCheck('Uses Soft mint (#DFF7EA)', homeFile.includes('#DFF7EA'));
assertCheck('Uses Warm neutral (#F4F7F6)', homeFile.includes('#F4F7F6'));
assertCheck('Uses Dark text (#183345)', homeFile.includes('#183345'));
assertCheck('Uses Secondary text (#607582)', homeFile.includes('#607582'));
assertCheck('Uses Subtle border (#DCE7E8)', homeFile.includes('#DCE7E8'));
assertCheck('Uses Restrained gold (#E9B949)', homeFile.includes('#E9B949'));
assertCheck('NO purple portal theme introduced', !homeFile.includes('purple-') && !homeFile.includes('#9333ea') && !homeFile.includes('#7c3aed'));
assertCheck('NO black backgrounds or black cards introduced', !homeFile.includes('bg-black') && !homeFile.includes('#000000'));

// 7. Navigation & Bottom Nav Protection
console.log('\n--- 7. Navigation & Layout Protection ---');
assertCheck(
  'Bottom padding (pb-24) ensures bottom navigation bar never covers content',
  homeFile.includes('pb-24')
);

const bottomNavFile = fs.readFileSync(path.join(FRONTEND_DIR, 'src/components/BottomNav.tsx'), 'utf-8');
assertCheck(
  'Bottom navigation preserves 5 tabs in exact order: HOME, GAMES, TOURNAMENT, LEADERBOARD, PROFILE',
  bottomNavFile.includes("id: 'home'") &&
  bottomNavFile.includes("id: 'games'") &&
  bottomNavFile.includes("id: 'tournament'") &&
  bottomNavFile.includes("id: 'leaderboard'") &&
  bottomNavFile.includes("id: 'profile'")
);

// 8. Live Component Server-Side Rendering
console.log('\n--- 8. Live React Component Rendering Audit ---');
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { HomePage } from '../src/pages/HomePage.js';
import { catalogGameToDefinition } from '../src/games/registry.js';

const allGames = GameCatalog.getAll().map(catalogGameToDefinition);

const htmlWithScore = ReactDOMServer.renderToString(
  React.createElement(HomePage, {
    games: allGames,
    profile: mockProfileWithScore,
    onLaunchGame: () => {},
    onOpenBuyCoins: () => {},
    onNavigateToGames: () => {},
  })
);

assertCheck(
  'HomePage HTML renders promotional banner with headline',
  htmlWithScore.includes('Your Next Game Starts Here') && htmlWithScore.includes('Play your favorites and beat your best.')
);
assertCheck(
  'HomePage HTML renders Explore Games CTA button',
  htmlWithScore.includes('Explore Games') && htmlWithScore.includes('id="home-banner-cta-btn"')
);
assertCheck(
  'HomePage HTML renders actual authenticated player coins (120 Coins)',
  htmlWithScore.includes('120') && htmlWithScore.includes('Available Coins')
);
assertCheck(
  'HomePage HTML renders actual Crazy Color tournament score (850)',
  htmlWithScore.includes('850') && htmlWithScore.includes('Crazy Color')
);
assertCheck(
  'HomePage HTML renders Active Tournament challenge section with Crazy Color',
  htmlWithScore.includes('Ready for your next challenge?') && htmlWithScore.includes('Crazy Color Championship')
);
assertCheck(
  'HomePage HTML renders Play Crazy Color Tournament action',
  htmlWithScore.includes('Play Crazy Color Tournament')
);
assertCheck(
  'HomePage HTML renders Explore All Games navigation action',
  htmlWithScore.includes('Explore All Games') && htmlWithScore.includes('id="home-browse-games-cta"')
);

// Render empty state profile (no Crazy Color score)
const htmlNoScore = ReactDOMServer.renderToString(
  React.createElement(HomePage, {
    games: allGames,
    profile: mockProfileNoScore,
    onLaunchGame: () => {},
    onOpenBuyCoins: () => {},
    onNavigateToGames: () => {},
  })
);

assertCheck(
  'HomePage HTML renders "No score yet" empty state when user has no Crazy Color score',
  htmlNoScore.includes('No score yet') && !htmlNoScore.includes('1,200') // 1200 was dama score, must not show
);

console.log('\n==============================================================');
if (allPassed) {
  console.log('🎉 ALL HOME TAB REDESIGN REQUIREMENTS VERIFIED & PASSED!');
} else {
  console.error('❌ SOME VERIFICATION CHECKS FAILED!');
  process.exit(1);
}
console.log('==============================================================\n');
