/**
 * GameON Tele - Game-Specific Leaderboard Engine
 * Connected directly to PostgreSQL high_scores and profiles tables.
 */

import { UserProfile } from '../types';
import { GameCatalog, CatalogGame } from './gameCatalog';
import { apiService } from './apiService';

export interface GameLeaderboardEntry {
  rank: number;
  playerMasked: string;
  playerName: string;
  score: number;
  rewardText?: string;
  isCurrentUser?: boolean;
}

export interface GameLeaderboardResult {
  game: CatalogGame;
  entries: GameLeaderboardEntry[];
  userRank: number;
  userScore: number;
  totalParticipants: number;
}

export const maskPhone = (phone?: string): string => {
  const digits = (phone || '0911428890').replace(/\D/g, '');
  if (digits.length >= 9) {
    const start = digits.slice(0, 3);
    const end = digits.slice(-3);
    return `${start}*****${end}`;
  }
  return '091*****890';
};

export interface UserGameStats {
  matchesPlayed: number;
  bestScore: number;
  bestLevel: number;
  totalPlaytimeSeconds: number;
  lastPlayedTimestamp: number;
}

// Live cache from PostgreSQL
const liveGameCache: Record<string, GameLeaderboardEntry[]> = {};

export const GameLeaderboardService = {
  getGamesWithLeaderboards(): CatalogGame[] {
    return GameCatalog.getAll().filter((g) => g.leaderboardEnabled);
  },

  getUserStats(gameId: string, profile?: UserProfile): UserGameStats {
    let localSaved: Partial<UserGameStats> = {};
    try {
      const raw = localStorage.getItem(`teleplay_stats_${gameId}`);
      if (raw) localSaved = JSON.parse(raw);
    } catch {}

    const profileScore = profile?.highScores?.[gameId] || 0;
    const bestScore = Math.max(localSaved.bestScore || 0, profileScore);
    const matchesPlayed = Math.max(localSaved.matchesPlayed || (bestScore > 0 ? 1 : 0), 0);
    const bestLevel = Math.max(localSaved.bestLevel || 1, 1);
    const totalPlaytimeSeconds = localSaved.totalPlaytimeSeconds || (matchesPlayed * 90);
    const lastPlayedTimestamp = localSaved.lastPlayedTimestamp || Date.now();

    return {
      matchesPlayed,
      bestScore,
      bestLevel,
      totalPlaytimeSeconds,
      lastPlayedTimestamp,
    };
  },

  recordScore(gameId: string, score: number, playerName?: string, level?: number): { isNewBest: boolean; bestScore: number } {
    if (typeof window === 'undefined') return { isNewBest: false, bestScore: score };
    try {
      const currentStats = this.getUserStats(gameId);
      const isNewBest = score > currentStats.bestScore;
      const updatedBest = Math.max(currentStats.bestScore, score);
      const updatedLevel = Math.max(currentStats.bestLevel, level || 1);
      
      const newStats: UserGameStats = {
        matchesPlayed: currentStats.matchesPlayed + 1,
        bestScore: updatedBest,
        bestLevel: updatedLevel,
        totalPlaytimeSeconds: currentStats.totalPlaytimeSeconds + 60,
        lastPlayedTimestamp: Date.now(),
      };

      localStorage.setItem(`teleplay_stats_${gameId}`, JSON.stringify(newStats));
      localStorage.setItem(`teleplay_lb_${gameId}`, updatedBest.toString());

      return { isNewBest, bestScore: updatedBest };
    } catch {
      return { isNewBest: false, bestScore: score };
    }
  },

  /**
   * Fetch live all-time high scores from PostgreSQL
   */
  async refreshLiveGameLeaderboard(gameId: string): Promise<GameLeaderboardEntry[]> {
    const res = await apiService.getGameLeaderboard(gameId);
    if (res && Array.isArray(res)) {
      liveGameCache[gameId] = res.map((item, idx) => ({
        rank: item.rank || (idx + 1),
        playerMasked: item.playerMasked || '091*****989',
        playerName: item.displayName || 'Player',
        score: item.score,
        rewardText: idx === 0 ? '500 Coins' : idx === 1 ? '300 Coins' : idx === 2 ? '200 Coins' : undefined,
      }));
    }
    return liveGameCache[gameId] || [];
  },

  getLeaderboardForGame(gameId: string, profile?: UserProfile): GameLeaderboardResult | null {
    const game = GameCatalog.getById(gameId);
    if (!game || !game.leaderboardEnabled) {
      return null;
    }

    const stats = this.getUserStats(gameId, profile);
    const userScore = stats.bestScore;

    // Use live database entries if available
    let entries: GameLeaderboardEntry[] = (liveGameCache[gameId] || []).map((e) => ({
      ...e,
      isCurrentUser: Boolean(
        profile && (
          e.playerName === profile.displayName ||
          (profile.phoneNumber && e.playerMasked.includes(profile.phoneNumber.slice(-3)))
        )
      ),
    }));

    // If user has a score and not yet in entries, calculate user rank
    let userRank = entries.findIndex((e) => e.isCurrentUser) + 1;
    if (userRank === 0 && userScore > 0) {
      userRank = entries.filter((e) => e.score > userScore).length + 1;
      if (userRank <= 10) {
        entries.push({
          rank: userRank,
          playerMasked: maskPhone(profile?.phoneNumber),
          playerName: profile?.displayName || 'You',
          score: userScore,
          rewardText: userRank <= 3 ? `${500 - (userRank - 1) * 150} Coins` : undefined,
          isCurrentUser: true,
        });
        entries.sort((a, b) => b.score - a.score);
        entries = entries.slice(0, 10).map((e, idx) => ({ ...e, rank: idx + 1 }));
      }
    }

    return {
      game,
      entries,
      userRank: userRank > 0 ? userRank : (userScore > 0 ? 11 : 0),
      userScore,
      totalParticipants: Math.max(entries.length, userScore > 0 ? 1 : 0),
    };
  },
};
