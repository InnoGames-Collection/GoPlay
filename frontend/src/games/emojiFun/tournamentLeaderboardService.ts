/**
 * Emoji Fun — Tournament Leaderboard & Persistent Stats Service
 */

import { TournamentLeaderboardEntry, PlayerStats, EmojiAttemptRecord } from './types';
import { GameLeaderboardService } from '../../services/gameLeaderboardService';

const STORAGE_KEY_STATS = 'emojifun_player_stats_v1';

export const DEFAULT_PLAYER_STATS: PlayerStats = {
  totalTournamentScore: 0,
  currentLevel: 1,
  unlockedLevel: 1,
  totalQuestionsAnswered: 0,
  totalCorrect: 0,
  perfectCount: 0,
  bestCombo: 0,
  hintsUsed: 0,
  coins: 50,
  availableHints: 5,
  lives: 3,
  starsByLevel: {},
  highScoreByLevel: {},
  recentAttempts: [],
};

export class TournamentLeaderboardService {
  public static loadPlayerStats(): PlayerStats {
    try {
      const data = localStorage.getItem(STORAGE_KEY_STATS);
      if (data) {
        const parsed = JSON.parse(data);
        const safeCoins = Number.isFinite(parsed.coins) ? parsed.coins : DEFAULT_PLAYER_STATS.coins;
        const safeScore = Number.isFinite(parsed.totalTournamentScore) ? parsed.totalTournamentScore : 0;
        const safeLevel = Number.isFinite(parsed.unlockedLevel) && parsed.unlockedLevel >= 1 ? parsed.unlockedLevel : 1;
        const safeHints = Number.isFinite(parsed.availableHints) ? parsed.availableHints : DEFAULT_PLAYER_STATS.availableHints;
        const safeLives = Number.isFinite(parsed.lives) ? parsed.lives : DEFAULT_PLAYER_STATS.lives;
        const safeCombo = Number.isFinite(parsed.bestCombo) ? parsed.bestCombo : 0;

        return {
          ...DEFAULT_PLAYER_STATS,
          ...parsed,
          coins: safeCoins,
          totalTournamentScore: safeScore,
          unlockedLevel: safeLevel,
          availableHints: safeHints,
          lives: safeLives,
          bestCombo: safeCombo,
          starsByLevel: parsed.starsByLevel || {},
          highScoreByLevel: parsed.highScoreByLevel || {},
          recentAttempts: Array.isArray(parsed.recentAttempts) ? parsed.recentAttempts : [],
        };
      }
    } catch {
      // Fallback
    }
    return { ...DEFAULT_PLAYER_STATS };
  }

  public static savePlayerStats(stats: PlayerStats) {
    try {
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
    } catch {
      // Fallback
    }
  }

  public static getLeaderboard(playerName: string = 'You', playerStats?: PlayerStats): {
    entries: TournamentLeaderboardEntry[];
    userRank: number;
    userScore: number;
    nextPlayerScore: number | null;
    pointsToNextRank: number;
  } {
    const stats = playerStats || this.loadPlayerStats();
    const userScore = stats.totalTournamentScore;
    const userLevel = stats.unlockedLevel;
    const userBestCombo = stats.bestCombo;
    const userAccuracy =
      stats.totalQuestionsAnswered > 0
        ? Math.round((stats.totalCorrect / stats.totalQuestionsAnswered) * 100)
        : 100;

    // Fetch live entries from unified PostgreSQL leaderboard engine
    const liveResult = GameLeaderboardService.getLeaderboardForGame('emoji-fun');
    const competitors: Omit<TournamentLeaderboardEntry, 'rank'>[] = (liveResult?.entries || [])
      .filter((e) => !e.isCurrentUser)
      .map((e, idx) => ({
        id: `pg_entry_${idx + 1}`,
        name: e.playerName || e.playerMasked,
        avatarEmoji: '⚡',
        score: e.score,
        level: Math.max(1, Math.round(e.score / 200)),
        bestCombo: Math.max(1, Math.round(e.score / 500)),
        accuracy: 90,
      }));

    // Insert current player
    const playerEntry: Omit<TournamentLeaderboardEntry, 'rank'> = {
      id: 'current_user',
      name: `${playerName} (You)`,
      avatarEmoji: '😎',
      score: userScore,
      level: userLevel,
      bestCombo: userBestCombo,
      accuracy: userAccuracy,
      isCurrentUser: true,
    };

    const allEntries = [...competitors, playerEntry].sort((a, b) => b.score - a.score);

    // Assign ranks
    const ranked: TournamentLeaderboardEntry[] = allEntries.map((e, index) => ({
      ...e,
      rank: index + 1,
    }));

    const userIndex = ranked.findIndex((r) => r.isCurrentUser);
    const userRank = userIndex >= 0 ? userIndex + 1 : ranked.length;

    let nextPlayerScore: number | null = null;
    let pointsToNextRank = 0;

    if (userIndex > 0) {
      nextPlayerScore = ranked[userIndex - 1].score;
      pointsToNextRank = Math.max(10, nextPlayerScore - userScore + 10);
    }

    return {
      entries: ranked,
      userRank,
      userScore,
      nextPlayerScore,
      pointsToNextRank,
    };
  }
}

class TournamentLeaderboardManager {
  private stats: PlayerStats;

  constructor() {
    this.stats = TournamentLeaderboardService.loadPlayerStats();
  }

  public getPlayerStats(): PlayerStats {
    return this.stats;
  }

  public saveStats() {
    TournamentLeaderboardService.savePlayerStats(this.stats);
  }

  public recordLevelAttempt(attempt: {
    level: number;
    score: number;
    completed: boolean;
    accuracy: number;
    totalQuestions: number;
    answeredCount: number;
    unansweredCount: number;
    correctCount: number;
    durationSeconds: number;
  }) {
    const safeScore = Number.isFinite(attempt.score) ? Math.max(0, Math.round(attempt.score)) : 0;
    const safeLevel = Math.max(1, Math.min(40, attempt.level));

    this.stats.totalTournamentScore = (this.stats.totalTournamentScore || 0) + safeScore;
    this.stats.totalQuestionsAnswered = (this.stats.totalQuestionsAnswered || 0) + attempt.answeredCount;
    this.stats.totalCorrect = (this.stats.totalCorrect || 0) + attempt.correctCount;

    // Record high score for this level (never decreases)
    this.stats.highScoreByLevel[safeLevel] = Math.max(
      this.stats.highScoreByLevel[safeLevel] || 0,
      safeScore
    );

    // Sequential unlocking: a completed level unlocks the next level
    // Retrying an earlier level must NEVER erase or decrement unlocked levels!
    if (attempt.completed && safeLevel >= (this.stats.unlockedLevel || 1) && (this.stats.unlockedLevel || 1) < 40) {
      this.stats.unlockedLevel = safeLevel + 1;
    }
    this.stats.currentLevel = Math.max(this.stats.unlockedLevel || 1, safeLevel);

    // Record attempt details
    const record: EmojiAttemptRecord = {
      score: safeScore,
      level: safeLevel,
      completed: attempt.completed,
      timestamp: new Date().toISOString(),
      totalQuestions: attempt.totalQuestions,
      answeredCount: attempt.answeredCount,
      unansweredCount: attempt.unansweredCount,
      correctCount: attempt.correctCount,
      durationSeconds: attempt.durationSeconds,
    };
    if (!Array.isArray(this.stats.recentAttempts)) {
      this.stats.recentAttempts = [];
    }
    this.stats.recentAttempts.unshift(record);
    if (this.stats.recentAttempts.length > 50) {
      this.stats.recentAttempts = this.stats.recentAttempts.slice(0, 50);
    }

    this.saveStats();
  }

  public recordLevelCompletion(
    level: number,
    levelScore: number,
    accuracy: number,
    bestCombo: number,
    coinsWon: number = 0
  ) {
    this.recordLevelAttempt({
      level,
      score: levelScore,
      completed: true,
      accuracy,
      totalQuestions: 10,
      answeredCount: 10,
      unansweredCount: 0,
      correctCount: Math.round((accuracy / 100) * 10),
      durationSeconds: 30,
    });
  }

  public useHint(): boolean {
    if (this.stats.availableHints <= 0) {
      // Auto-replenish free hints - never block players with coin purchases
      this.stats.availableHints = 5;
    }
    this.stats.availableHints -= 1;
    this.stats.hintsUsed = (this.stats.hintsUsed || 0) + 1;
    this.saveStats();
    return true;
  }

  public addHints(count: number, costCoins: number = 0) {
    const safeCount = Number.isFinite(count) ? count : 3;
    const currentHints = Number.isFinite(this.stats.availableHints) ? this.stats.availableHints : 5;
    this.stats.availableHints = currentHints + safeCount;
    this.saveStats();
  }

  public addCoins(delta: number) {
    const safeDelta = Number.isFinite(delta) ? delta : 0;
    const currentCoins = Number.isFinite(this.stats.coins) ? this.stats.coins : 50;
    this.stats.coins = Math.max(0, currentCoins + safeDelta);
    this.saveStats();
  }

  public getLeaderboard(): TournamentLeaderboardEntry[] {
    return TournamentLeaderboardService.getLeaderboard('You', this.stats).entries;
  }

  public getLeaderboardPreview() {
    const data = TournamentLeaderboardService.getLeaderboard('You', this.stats);
    return {
      entries: data.entries,
      userRank: data.userRank,
      userScore: data.userScore,
      nextPlayerScore: data.nextPlayerScore,
      pointsToNextRank: data.pointsToNextRank,
    };
  }
}

export const tournamentLeaderboardService = new TournamentLeaderboardManager();

