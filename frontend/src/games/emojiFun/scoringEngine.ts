/**
 * Emoji Fun — Scoring Engine
 *
 * Implements calibrated time-based scoring:
 * - Exactly 5 base points per correct answer
 * - Time-based speed bonus: up to 5 additional points based on remaining time fraction
 *   (r = timeRemainingSeconds / totalTimeSeconds)
 *   speedBonus = Math.round(5 * r)
 *   Total correct answer score: 5 to 10 points
 * - Wrong and unanswered questions earn strictly 0 points
 * - Scores are completely bounded: 0 to 100 points per 10-question level attempt
 */

import { TournamentScoreCalculation, QuestionDifficulty } from './types';

export function calculateTournamentScore(params: {
  isCorrect: boolean;
  basePoints?: number;
  timeRemainingSeconds: number;
  totalTimeSeconds: number;
  currentCombo?: number;
  hintsUsedOnQuestion?: number;
  difficulty?: QuestionDifficulty;
}): TournamentScoreCalculation {
  const {
    isCorrect,
    timeRemainingSeconds,
    totalTimeSeconds,
    currentCombo = 0,
    hintsUsedOnQuestion = 0,
  } = params;

  const basePoints = 5;
  const safeTotalTime = Math.max(1, totalTimeSeconds);
  const elapsed = Math.max(0, Math.round((safeTotalTime - timeRemainingSeconds) * 10) / 10);

  if (!isCorrect) {
    return {
      basePoints,
      responseSeconds: elapsed,
      timeLimitSeconds: safeTotalTime,
      speedTier: 'TIMEOUT',
      speedBonusPercent: 0,
      comboCount: 0,
      comboMultiplier: 1.0,
      hintsUsedOnQuestion,
      hintPenaltyMultiplier: 1.0,
      isPerfect: false,
      perfectBonusPoints: 0,
      totalPointsAwarded: 0,
    };
  }

  // Fraction of time remaining on the timer in [0, 1]
  const fractionRemaining = Math.max(0, Math.min(1, timeRemainingSeconds / safeTotalTime));

  // Time-based bonus: 0 to 5 points
  const speedBonusPoints = Math.round(5 * fractionRemaining);
  const totalPointsAwarded = basePoints + speedBonusPoints; // 5 to 10 points

  // Speed tier categorization
  let speedTier: 'INSTANT' | 'FAST' | 'NORMAL' | 'SLOW' | 'TIMEOUT' = 'NORMAL';
  if (fractionRemaining >= 0.75) {
    speedTier = 'INSTANT';
  } else if (fractionRemaining >= 0.50) {
    speedTier = 'FAST';
  } else if (fractionRemaining >= 0.25) {
    speedTier = 'NORMAL';
  } else if (fractionRemaining > 0) {
    speedTier = 'SLOW';
  } else {
    speedTier = 'TIMEOUT';
  }

  const speedBonusPercent = Math.round(fractionRemaining * 100);
  const isPerfect = fractionRemaining >= 0.75 && hintsUsedOnQuestion === 0;

  return {
    basePoints,
    responseSeconds: elapsed,
    timeLimitSeconds: safeTotalTime,
    speedTier,
    speedBonusPercent,
    comboCount: currentCombo + 1,
    comboMultiplier: 1.0,
    hintsUsedOnQuestion,
    hintPenaltyMultiplier: 1.0,
    isPerfect,
    perfectBonusPoints: speedBonusPoints,
    totalPointsAwarded,
  };
}

export function calculateQuestionTournamentScore(params: {
  question: { basePoints?: number; timeLimitSeconds: number; difficulty?: QuestionDifficulty };
  timeRemainingSeconds: number;
  comboCount?: number;
  hintsUsedOnThisQuestion?: number;
  levelMultiplier?: number;
}): TournamentScoreCalculation {
  return calculateTournamentScore({
    isCorrect: true,
    basePoints: 5,
    timeRemainingSeconds: params.timeRemainingSeconds,
    totalTimeSeconds: params.question.timeLimitSeconds,
    currentCombo: Math.max(0, (params.comboCount || 1) - 1),
    hintsUsedOnQuestion: params.hintsUsedOnThisQuestion || 0,
    difficulty: params.question.difficulty || 'EASY',
  });
}
