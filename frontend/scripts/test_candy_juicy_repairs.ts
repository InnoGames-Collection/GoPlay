/**
 * Candy Juicy (Juicy Match) Verification Suite
 * Verifies level difficulty, scoring calibration, exhausted moves, and game-end states.
 */

import { ALL_40_LEVELS, getLevelConfig } from '../src/games/juicyMatch/levelBank';
import {
  createInitialBoard,
  hasLegalMoves,
  reshuffleMovableFruits,
  findMatches,
  calculateMatchScore,
  SCORING,
  createRng,
} from '../src/games/juicyMatch/matchLogic';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`  ✅ [PASS] ${message}`);
}

console.log('🍬 ==============================================================');
console.log('🍬 CANDY JUICY: VERIFYING REPAIRS & INTEGRITY');
console.log('🍬 ==============================================================\n');

// -------------------------------------------------------------
// TEST 1: LEVEL 2 IMPOSSIBLE PROGRESSION ROOT CAUSE & FIX
// -------------------------------------------------------------
console.log('--- TEST 1: Level 2 Progression & Geometry Verification ---');
const lvl2 = getLevelConfig(2);
assert(lvl2.level === 2, 'Level 2 configuration loads correctly');
assert(lvl2.moves === 22, 'Level 2 has calibrated moves: 22');

const grid2 = createInitialBoard(lvl2);
let lvl2CratesPlaced = 0;
let lvl2JuicePlaced = 0;

for (let y = 0; y < lvl2.gridHeight; y++) {
  for (let x = 0; x < lvl2.gridWidth; x++) {
    const c = grid2[y][x];
    if (c.valid) {
      if (c.blocker === 'crate_1') lvl2CratesPlaced++;
      if (c.underlay !== 'none') lvl2JuicePlaced++;
    }
  }
}

const crateObjective = lvl2.objectives.find((o) => o.type === 'break_crates');
const bananaObjective = lvl2.objectives.find((o) => o.type === 'collect_fruit' && o.fruitType === 'banana');

assert(crateObjective !== undefined, 'Level 2 contains break_crates objective');
assert(crateObjective!.target === 5, 'Level 2 break_crates target is 5');
assert(lvl2CratesPlaced === 5, `Level 2 board has exactly 5 crates placed on valid cells (actual: ${lvl2CratesPlaced})`);
assert(crateObjective!.target <= lvl2CratesPlaced, 'Level 2 crate target is 100% achievable (target <= placed crates)');
assert(bananaObjective !== undefined, 'Level 2 contains banana collection objective');
assert(bananaObjective!.target <= 18, `Level 2 banana target is balanced (actual: ${bananaObjective!.target})`);
assert(hasLegalMoves(grid2, lvl2.availableFruits), 'Level 2 initial board has at least 1 legal move');

// -------------------------------------------------------------
// TEST 2: ALL 40 LEVELS INTEGRITY & IMPOSSIBLE-BOARD PREVENTION
// -------------------------------------------------------------
console.log('\n--- TEST 2: All 40 Levels Objective & Legal Move Audit ---');
let totalLevelsTested = 0;

for (const lvl of ALL_40_LEVELS) {
  totalLevelsTested++;
  const board = createInitialBoard(lvl);
  assert(board.length === lvl.gridHeight, `Level ${lvl.level} grid height matches config`);
  assert(board[0].length === lvl.gridWidth, `Level ${lvl.level} grid width matches config`);

  let crates = 0;
  let chests = 0;
  let juice = 0;

  for (let y = 0; y < lvl.gridHeight; y++) {
    for (let x = 0; x < lvl.gridWidth; x++) {
      const c = board[y][x];
      if (c.valid) {
        if (c.blocker?.startsWith('crate')) crates++;
        if (c.blocker === 'chest') chests++;
        if (c.underlay !== 'none') juice++;
      }
    }
  }

  for (const obj of lvl.objectives) {
    if (obj.type === 'break_crates') {
      assert(obj.target <= crates, `Level ${lvl.level} crates target (${obj.target}) <= placed crates (${crates})`);
    } else if (obj.type === 'open_chests') {
      assert(obj.target <= chests, `Level ${lvl.level} chests target (${obj.target}) <= placed chests (${chests})`);
    } else if (obj.type === 'clear_juice') {
      assert(obj.target <= juice, `Level ${lvl.level} juice target (${obj.target}) <= placed juice (${juice})`);
    }
  }

  const hasMoves = hasLegalMoves(board, lvl.availableFruits);
  assert(hasMoves, `Level ${lvl.level} has legal moves on generated board`);
}

assert(totalLevelsTested === 40, 'All 40 levels were audited without discrepancies');

// -------------------------------------------------------------
// TEST 3: REPRODUCIBLE DETERMINISTIC LEVEL SEEDING
// -------------------------------------------------------------
console.log('\n--- TEST 3: Deterministic Test Seeds ---');
const seedA = 987654;
const boardA1 = createInitialBoard(getLevelConfig(1), seedA);
const boardA2 = createInitialBoard(getLevelConfig(1), seedA);

let identical = true;
for (let y = 0; y < boardA1.length; y++) {
  for (let x = 0; x < boardA1[0].length; x++) {
    if (boardA1[y][x].fruit?.type !== boardA2[y][x].fruit?.type) {
      identical = false;
      break;
    }
  }
}
assert(identical, 'Same seed generates 100% identical board configurations');

// -------------------------------------------------------------
// TEST 4: SCORING CALIBRATION & TRANSPARENCY
// -------------------------------------------------------------
console.log('\n--- TEST 4: Scoring Calibration (Scores in the Hundreds) ---');
const match3Score = calculateMatchScore(3, 1, 0);
assert(match3Score === 15, `3-fruit base match scores 15 pts (actual: ${match3Score})`);

const match4Score = calculateMatchScore(4, 1, 1);
assert(match4Score === 35, `4-fruit match (with striped creation) scores 35 pts (actual: ${match4Score})`);

const match5Score = calculateMatchScore(5, 1, 1);
assert(match5Score === 50, `5-fruit match (with rainbow creation) scores 50 pts (actual: ${match5Score})`);

const cascade2Score = calculateMatchScore(3, 2, 0);
assert(cascade2Score === 25, `Cascade wave 2 adds 10 bonus pts (actual: ${cascade2Score})`);

const cascade3Score = calculateMatchScore(3, 3, 0);
assert(cascade3Score === 35, `Cascade wave 3 adds 20 bonus pts (actual: ${cascade3Score})`);

// Simulate a realistic full 20-move playthrough
let simulatedScore = 0;
for (let m = 0; m < 20; m++) {
  simulatedScore += calculateMatchScore(3, 1, 0); // 15
  if (m % 3 === 0) {
    simulatedScore += calculateMatchScore(3, 2, 0); // 25 (cascade)
    simulatedScore += SCORING.BLOCKER_CLEARED; // 5
  }
  if (m % 7 === 0) {
    simulatedScore += calculateMatchScore(4, 1, 1); // 35 (special candy)
  }
}
console.log(`  📊 Simulated 20-move ordinary game score: ${simulatedScore} pts`);
assert(simulatedScore >= 400 && simulatedScore <= 800, 'Ordinary game score lands primarily in the hundreds (300-800)');

// Verify star thresholds are calibrated in the hundreds
for (const lvl of [1, 2, 3, 5, 10, 20, 30, 40]) {
  const cfg = getLevelConfig(lvl);
  const [s1, s2, s3] = cfg.starThresholds;
  assert(s1 >= 250 && s1 <= 600, `Level ${lvl} 1-star threshold (${s1}) is calibrated in hundreds`);
  assert(s2 >= 400 && s2 <= 850, `Level ${lvl} 2-star threshold (${s2}) is calibrated in hundreds`);
  assert(s3 >= 600 && s3 <= 1100, `Level ${lvl} 3-star threshold (${s3}) is calibrated in hundreds`);
}

// -------------------------------------------------------------
// TEST 5: SAFE RESHUFFLE & FAILURE BEHAVIOR
// -------------------------------------------------------------
console.log('\n--- TEST 5: Safe Reshuffle & Move Exhaustion Behavior ---');
const testGrid = createInitialBoard(getLevelConfig(1), 12345);
const reshuffled = reshuffleMovableFruits(testGrid, getLevelConfig(1).availableFruits, 54321);
assert(reshuffled, 'Reshuffle succeeds on playable board');
assert(hasLegalMoves(testGrid, getLevelConfig(1).availableFruits), 'Reshuffled board has guaranteed legal moves');
assert(findMatches(testGrid).matchedCells.length === 0, 'Reshuffled board has no immediate matches before swap');

// Verify reshuffle returns false when impossible (e.g. fewer than 3 fruits)
const tinyGrid = createInitialBoard(getLevelConfig(1), 12345);
for (let y = 0; y < tinyGrid.length; y++) {
  for (let x = 0; x < tinyGrid[0].length; x++) {
    tinyGrid[y][x].fruit = null; // empty board
  }
}
const impossibleReshuffle = reshuffleMovableFruits(tinyGrid, getLevelConfig(1).availableFruits);
assert(!impossibleReshuffle, 'Reshuffle safely reports false when board cannot be matched');

console.log('\n==============================================================');
console.log('🎉 ALL CANDY JUICY REPAIR VERIFICATIONS PASSED 100%!');
console.log('==============================================================');
