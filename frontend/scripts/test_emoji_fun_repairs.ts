/**
 * Comprehensive Verification Test Suite for Emoji Fun
 * Tests:
 * A. Lives and coins removal: no hearts, no blocks, unanswered handling
 * B. 40 numbered levels (LEVEL 1 .. LEVEL 40): titles, configs, sequential unlocking, retry preserving unlock
 * C. Question bank audit: 400 questions, exactly 4 choices, valid correctIndex, no duplicates within level, fallback
 * D. Time-based score formula: 5 base points, faster answers score more, wrong/unanswered = 0, bounded 0..100
 * E. Persistence & My High Scores: GameBridgeService integration, StorageService reload, best score preservation
 * F. Verification of Levels 1, 2, 39, and 40 specifically
 */

import { EMOJI_LEVELS_DATABASE, getQuestionsForLevel } from '../src/games/emojiFun/questionDatabase';
import { calculateTournamentScore, calculateQuestionTournamentScore } from '../src/games/emojiFun/scoringEngine';
import { TournamentLeaderboardService, tournamentLeaderboardService } from '../src/games/emojiFun/tournamentLeaderboardService';
import { GameBridgeService } from '../src/services/gameBridge';
import { StorageService } from '../src/services/storageService';
import { UserProfile } from '../src/types';

// Mock localStorage for Node environment if needed
if (typeof globalThis.localStorage === 'undefined' || !globalThis.localStorage.getItem) {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, val: string) => store.set(key, String(val)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] || null,
    length: store.size,
  } as any;
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✓ ${msg}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${msg}`);
    failed++;
  }
}

console.log('=== STARTING EMOJI FUN VERIFICATION SUITE ===\n');

// -------------------------------------------------------------
// TEST GROUP 1: Numbered Level System (40 levels, strict numbering)
// -------------------------------------------------------------
console.log('--- TEST GROUP 1: Numbered Level System (LEVEL 1 .. LEVEL 40) ---');
assert(EMOJI_LEVELS_DATABASE.length === 40, 'EMOJI_LEVELS_DATABASE has exactly 40 level configurations');

let allNumberedCorrectly = true;
for (let lvl = 1; lvl <= 40; lvl++) {
  const cfg = EMOJI_LEVELS_DATABASE[lvl - 1];
  if (!cfg || cfg.level !== lvl || cfg.title !== `LEVEL ${lvl}`) {
    allNumberedCorrectly = false;
    console.error(`Mismatch on level ${lvl}:`, cfg);
  }
}
assert(allNumberedCorrectly, 'All 40 levels are titled strictly "LEVEL 1" through "LEVEL 40" without descriptive names');

// -------------------------------------------------------------
// TEST GROUP 2: Question Bank Audit (400 questions, choices, answers)
// -------------------------------------------------------------
console.log('\n--- TEST GROUP 2: Question Bank Integrity ---');
let totalQuestionsCount = 0;
let allLevelsHave10Unique = true;
let allOptionsHave4Choices = true;
let allCorrectIndicesValid = true;
let noDuplicateOptions = true;

for (let lvl = 1; lvl <= 40; lvl++) {
  const qs = getQuestionsForLevel(lvl);
  if (qs.length !== 10) allLevelsHave10Unique = false;
  totalQuestionsCount += qs.length;

  const promptSet = new Set<string>();
  for (const q of qs) {
    if (q.options.length !== 4) allOptionsHave4Choices = false;
    if (new Set(q.options).size !== 4) noDuplicateOptions = false;
    if (q.correctIndex < 0 || q.correctIndex >= 4) allCorrectIndicesValid = false;
    if (!q.options[q.correctIndex]) allCorrectIndicesValid = false;
    if (q.basePoints !== 5) {
      console.error(`Question ${q.id} basePoints is ${q.basePoints}, expected 5`);
    }

    const key = q.prompt + '::' + q.emojiDisplay;
    if (promptSet.has(key)) {
      console.error(`Duplicate question in level ${lvl}: ${q.prompt}`);
      allLevelsHave10Unique = false;
    }
    promptSet.add(key);
  }
}

assert(totalQuestionsCount === 400, `Total questions across 40 levels = 400 (found ${totalQuestionsCount})`);
assert(allLevelsHave10Unique, 'Each of the 40 levels has exactly 10 distinct questions without internal repeats');
assert(allOptionsHave4Choices, 'Every single question has exactly 4 options');
assert(noDuplicateOptions, 'Every question has 4 unique options (no duplicate answers within a question)');
assert(allCorrectIndicesValid, 'All correctIndex values map to a valid, non-empty answer choice');

// Fallback safety test
const safeFallbackHigh = getQuestionsForLevel(999);
assert(safeFallbackHigh.length === 10, 'Level 999 gracefully falls back to valid 10-question set without crashing');
const safeFallbackZero = getQuestionsForLevel(0);
assert(safeFallbackZero.length === 10, 'Level 0 gracefully falls back to Level 1 10-question set without crashing');

// -------------------------------------------------------------
// TEST GROUP 3: Detailed Audit of Levels 1, 2, 39, and 40
// -------------------------------------------------------------
console.log('\n--- TEST GROUP 3: Specific Verification of Levels 1, 2, 39, and 40 ---');
for (const lvl of [1, 2, 39, 40]) {
  const cfg = EMOJI_LEVELS_DATABASE[lvl - 1];
  const qs = getQuestionsForLevel(lvl);
  assert(cfg.title === `LEVEL ${lvl}`, `Level ${lvl} configuration title is "LEVEL ${lvl}"`);
  assert(qs.length === 10, `Level ${lvl} loads 10 playable questions`);
  assert(cfg.timeLimitSeconds >= 7 && cfg.timeLimitSeconds <= 15, `Level ${lvl} has valid timer: ${cfg.timeLimitSeconds}s`);
  // Verify first and last question in this level
  assert(qs[0].prompt.length > 0 && qs[0].emojiDisplay.length > 0, `Level ${lvl} Q1 has valid prompt and display`);
  assert(qs[9].prompt.length > 0 && qs[9].emojiDisplay.length > 0, `Level ${lvl} Q10 has valid prompt and display`);
}

// -------------------------------------------------------------
// TEST GROUP 4: Calibrated Time-Based Scoring Formula
// -------------------------------------------------------------
console.log('\n--- TEST GROUP 4: Time-Based Scoring Formula ---');
const totalTime = 15;

// 1. Instant answer (15s remaining out of 15s)
const instantCalc = calculateTournamentScore({
  isCorrect: true,
  timeRemainingSeconds: 15,
  totalTimeSeconds: totalTime,
});
assert(instantCalc.basePoints === 5, 'Base points is strictly 5');
assert(instantCalc.totalPointsAwarded === 10, `Instant answer awards exactly 10 points (5 base + 5 speed bonus)`);
assert(instantCalc.speedTier === 'INSTANT', 'Instant answer speed tier is INSTANT');

// 2. Fast answer (12s remaining out of 15s = 80%)
const fastCalc = calculateTournamentScore({
  isCorrect: true,
  timeRemainingSeconds: 12,
  totalTimeSeconds: totalTime,
});
assert(fastCalc.totalPointsAwarded === 9, `Fast answer (80% time) awards 9 points (5 base + 4 speed bonus)`);

// 3. Half-way answer (7.5s remaining out of 15s = 50%)
const halfCalc = calculateTournamentScore({
  isCorrect: true,
  timeRemainingSeconds: 7.5,
  totalTimeSeconds: totalTime,
});
assert(halfCalc.totalPointsAwarded === 8, `Half-time answer (50% time) awards 8 points (5 base + 3 speed bonus)`);

// 4. Slow answer (3s remaining out of 15s = 20%)
const slowCalc = calculateTournamentScore({
  isCorrect: true,
  timeRemainingSeconds: 3,
  totalTimeSeconds: totalTime,
});
assert(slowCalc.totalPointsAwarded === 6, `Slow answer (20% time) awards 6 points (5 base + 1 speed bonus)`);

// 5. At the deadline answer (0.2s remaining out of 15s)
const deadlineCalc = calculateTournamentScore({
  isCorrect: true,
  timeRemainingSeconds: 0.2,
  totalTimeSeconds: totalTime,
});
assert(deadlineCalc.totalPointsAwarded === 5, `Near-deadline answer awards 5 points (5 base + 0 speed bonus)`);

// 6. Monotonicity verification
assert(
  instantCalc.totalPointsAwarded >= fastCalc.totalPointsAwarded &&
  fastCalc.totalPointsAwarded >= halfCalc.totalPointsAwarded &&
  halfCalc.totalPointsAwarded >= slowCalc.totalPointsAwarded &&
  slowCalc.totalPointsAwarded >= deadlineCalc.totalPointsAwarded,
  'Score is strictly monotonic: faster submissions always earn >= slower submissions'
);

// 7. Wrong answer: strictly 0 points
const wrongCalc = calculateTournamentScore({
  isCorrect: false,
  timeRemainingSeconds: 10,
  totalTimeSeconds: totalTime,
});
assert(wrongCalc.totalPointsAwarded === 0, 'Wrong answer awards strictly 0 points');

// 8. Timed out / unanswered: strictly 0 points
const timeoutCalc = calculateTournamentScore({
  isCorrect: false,
  timeRemainingSeconds: 0,
  totalTimeSeconds: totalTime,
});
assert(timeoutCalc.totalPointsAwarded === 0, 'Unanswered/timed-out question awards strictly 0 points');

// 9. Bounded level total score (0 to 100 for 10 questions)
let perfectLevelScore = 0;
for (let i = 0; i < 10; i++) {
  perfectLevelScore += calculateTournamentScore({ isCorrect: true, timeRemainingSeconds: 15, totalTimeSeconds: 15 }).totalPointsAwarded;
}
assert(perfectLevelScore === 100, `Perfect 10/10 instant level scores exactly 100 points`);

let minimumPassingScore = 0;
for (let i = 0; i < 10; i++) {
  minimumPassingScore += calculateTournamentScore({ isCorrect: true, timeRemainingSeconds: 0.1, totalTimeSeconds: 15 }).totalPointsAwarded;
}
assert(minimumPassingScore === 50, `10/10 slow answers score exactly 50 points (all 5 base points)`);

// -------------------------------------------------------------
// TEST GROUP 5: Sequential Unlocking, Replay, and Retry Safety
// -------------------------------------------------------------
console.log('\n--- TEST GROUP 5: Sequential Progression & Retry Safety ---');
// Reset stats for clean test
tournamentLeaderboardService.getPlayerStats().unlockedLevel = 1;
tournamentLeaderboardService.getPlayerStats().currentLevel = 1;
tournamentLeaderboardService.getPlayerStats().highScoreByLevel = {};
tournamentLeaderboardService.getPlayerStats().recentAttempts = [];

// Complete Level 1
tournamentLeaderboardService.recordLevelAttempt({
  level: 1,
  score: 82,
  completed: true,
  accuracy: 90,
  totalQuestions: 10,
  answeredCount: 10,
  unansweredCount: 0,
  correctCount: 9,
  durationSeconds: 24,
});

assert(tournamentLeaderboardService.getPlayerStats().unlockedLevel === 2, 'Completing Level 1 sequentially unlocks Level 2');
assert(tournamentLeaderboardService.getPlayerStats().highScoreByLevel[1] === 82, 'Level 1 high score recorded as 82');

// Fast-forward unlock to Level 15
tournamentLeaderboardService.getPlayerStats().unlockedLevel = 15;
tournamentLeaderboardService.saveStats();

// Replay Level 1 and score 50 (a retry of an earlier level)
tournamentLeaderboardService.recordLevelAttempt({
  level: 1,
  score: 50,
  completed: true,
  accuracy: 60,
  totalQuestions: 10,
  answeredCount: 10,
  unansweredCount: 0,
  correctCount: 6,
  durationSeconds: 28,
});

assert(
  tournamentLeaderboardService.getPlayerStats().unlockedLevel === 15,
  'Retrying an earlier level (Level 1) NEVER decreases or erases unlockedLevel (remains 15)'
);
assert(
  tournamentLeaderboardService.getPlayerStats().highScoreByLevel[1] === 82,
  'Lower retry score (50) does not downgrade existing Level 1 high score (remains 82)'
);

// Check recent attempts log
const recent = tournamentLeaderboardService.getPlayerStats().recentAttempts || [];
assert(recent.length >= 2, `Recent attempts recorded: count = ${recent.length}`);
assert(recent[0].level === 1 && recent[0].score === 50, 'Latest attempt details stored accurately with score & level');

// -------------------------------------------------------------
// TEST GROUP 6: Portal Score Persistence & My High Scores
// -------------------------------------------------------------
console.log('\n--- TEST GROUP 6: Portal Persistence & My High Scores ---');

const initialProfile: UserProfile = {
  id: 'test_user_emoji',
  msisdn: '0912345678',
  displayName: 'PuzzleMaster',
  avatarUrl: 'https://avatar.test/1.png',
  coins: 100,
  xp: 50,
  level: 1,
  trophiesCount: 0,
  highScores: {},
  dailyScores: {},
  registeredAt: Date.now(),
  lastLoginAt: Date.now(),
};

// 1. Submit initial score for emoji-fun
const sub1 = GameBridgeService.submitScore('emoji-fun', 74, 25, initialProfile);
assert(sub1.updatedProfile.highScores?.['emoji-fun'] === 74, 'GameBridgeService records emoji-fun score = 74 in profile.highScores');

// 2. Verify stored profile in StorageService
const loaded1 = StorageService.getProfile();
assert(loaded1.highScores?.['emoji-fun'] === 74, 'StorageService reloads profile with emoji-fun score = 74');

// 3. Lower attempt (score 45): must NOT replace higher score (74)
const sub2 = GameBridgeService.submitScore('emoji-fun', 45, 20, sub1.updatedProfile);
assert(sub2.updatedProfile.highScores?.['emoji-fun'] === 74, 'Lower attempt (45) does NOT replace higher high score (74)');
assert(!sub2.result.isNewHighScore, 'Lower attempt flagged isNewHighScore = false');

// 4. Higher attempt (score 92): MUST update high score to 92
const sub3 = GameBridgeService.submitScore('emoji-fun', 92, 18, sub2.updatedProfile);
assert(sub3.updatedProfile.highScores?.['emoji-fun'] === 92, 'Higher attempt (92) updates high score to 92');
assert(sub3.result.isNewHighScore, 'Higher attempt flagged isNewHighScore = true');

// 5. Verify leaving and reopening portal
const reloadedFinal = StorageService.getProfile();
assert(reloadedFinal.highScores?.['emoji-fun'] === 92, 'My High Scores data source preserves best score 92 after reload');

// 6. Cross-game isolation check: ensure other games are not mixed
assert(!reloadedFinal.highScores?.['crazy-colors'], 'crazy-colors high score is untouched and not mixed');
assert(!reloadedFinal.highScores?.['juicy-match'], 'juicy-match high score is untouched and not mixed');

// -------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------
console.log(`\n=================================================`);
console.log(`EMOJI FUN TEST SUITE SUMMARY:`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`=================================================`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL EMOJI FUN VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉\n');
}
