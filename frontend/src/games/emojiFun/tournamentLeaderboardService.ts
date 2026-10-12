/**
 * Emoji Fun — Tournament Leaderboard & Persistent Stats Service
 */

import { TournamentLeaderboardEntry, PlayerStats } from './types';
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
  availableHints: 3,
  lives: 3,
  starsByLevel: {},
  highScoreByLevel: {},
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

  public recordLevelCompletion(
    level: number,
    levelScore: number,
    accuracy: number,
    bestCombo: number,
    coinsWon: number = 10
  ) {
    const safeScore = Number.isFinite(levelScore) ? levelScore : 0;
    const safeCoins = Number.isFinite(coinsWon) ? coinsWon : 10;
    const currentScore = Number.isFinite(this.stats.totalTournamentScore) ? this.stats.totalTournamentScore : 0;
    const currentCoins = Number.isFinite(this.stats.coins) ? this.stats.coins : 50;

    this.stats.totalTournamentScore = currentScore + safeScore;
    this.stats.coins = currentCoins + safeCoins;
    this.stats.highScoreByLevel[level] = Math.max(
      this.stats.highScoreByLevel[level] || 0,
      safeScore
    );
    this.stats.bestCombo = Math.max(
      this.stats.bestCombo || 0,
      Number.isFinite(bestCombo) ? bestCombo : 0
    );

    if (level >= this.stats.unlockedLevel && this.stats.unlockedLevel < 40) {
      this.stats.unlockedLevel = level + 1;
    }
    this.stats.currentLevel = Math.min(40, level + 1);

    this.saveStats();
  }

  public useHint(): boolean {
    if (this.stats.availableHints > 0) {
      this.stats.availableHints -= 1;
      this.stats.hintsUsed += 1;
      this.saveStats();
      return true;
    }
    return false;
  }

  public addHints(count: number, costCoins: number) {
    const safeCount = Number.isFinite(count) ? count : 3;
    const safeCost = Number.isFinite(costCoins) ? costCoins : 0;
    const currentHints = Number.isFinite(this.stats.availableHints) ? this.stats.availableHints : 3;
    const currentCoins = Number.isFinite(this.stats.coins) ? this.stats.coins : 50;

    this.stats.availableHints = currentHints + safeCount;
    this.stats.coins = Math.max(0, currentCoins - safeCost);
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

