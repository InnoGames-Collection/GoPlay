/**
 * GameON Tele - Official Weekly Tournament Service
 * Connected directly to PostgreSQL tournament_entries and tournaments tables.
 */

import { UserProfile } from '../types/index';
import { GameCatalog, CatalogGame } from './gameCatalog';
import { GameLeaderboardService } from './gameLeaderboardService';
import { apiService, TournamentLeaderboardItem } from './apiService';

export interface TournamentPrize {
  rank: number;
  rankLabel: string;
  rewardText: string;
  etbAmount?: number;
  coinsAmount?: number;
}

export interface WeeklyTournamentConfig {
  id: string;
  title: string;
  subtitle: string;
  frequency: 'weekly';
  sponsor: string;
  selectedGameIds: string[];
  startDate: string;
  endDate: string;
  prizes: TournamentPrize[];
}

export interface OverallTournamentEntry {
  rank: number;
  playerId: string;
  playerName: string;
  playerMasked: string;
  bestScore: number;
  bestGameId: string;
  bestGameTitle: string;
  achievementTimestamp: number;
  rewardText?: string;
  isCurrentUser?: boolean;
  gameScores: Record<string, number>;
}

export interface TournamentSummaryData {
  config: WeeklyTournamentConfig;
  participatingGames: CatalogGame[];
  topEntries: OverallTournamentEntry[];
  currentUserBestScore: number;
  currentUserBestGame: CatalogGame | null;
  currentUserRank: number;
  currentUserScores: Record<string, number>;
  totalParticipants: number;
  timeRemaining: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    formatted: string;
  };
}

export const DEFAULT_WEEKLY_TOURNAMENT: WeeklyTournamentConfig = {
  id: 'tourn_crazy_colors_01',
  title: 'Crazy Color Championship',
  subtitle: 'Weekly Cash Tournament • 2 Coins Entry',
  frequency: 'weekly',
  sponsor: 'telebirr & EthioTelecom',
  selectedGameIds: ['crazy-colors'],
  startDate: 'Monday, 00:00 EAT',
  endDate: 'Sunday, 23:59 EAT',
  prizes: [
    { rank: 1, rankLabel: '1st Place', rewardText: '10,000 ETB Cash + 500 Coins', etbAmount: 10000, coinsAmount: 500 },
    { rank: 2, rankLabel: '2nd Place', rewardText: '6,000 ETB Cash + 300 Coins', etbAmount: 6000, coinsAmount: 300 },
    { rank: 3, rankLabel: '3rd Place', rewardText: '3,000 ETB Cash + 200 Coins', etbAmount: 3000, coinsAmount: 200 },
    { rank: 4, rankLabel: '4th - 5th Place', rewardText: '1,000 ETB Cash + 100 Coins', etbAmount: 1000, coinsAmount: 100 },
    { rank: 6, rankLabel: '6th - 10th Place', rewardText: '800 ETB Cash + 50 Coins', etbAmount: 800, coinsAmount: 50 },
  ],
};

const maskPhoneNumber = (phone?: string): string => {
  const digits = (phone || '0911000000').replace(/\D/g, '');
  if (digits.length >= 9) {
    const start = digits.slice(0, 3);
    const end = digits.slice(-3);
    return `${start}*****${end}`;
  }
  return '091*****890';
};

// Cached live entries from database
let cachedLiveEntries: TournamentLeaderboardItem[] = [];

export const TournamentService = {
  getActiveConfig(): WeeklyTournamentConfig {
    return DEFAULT_WEEKLY_TOURNAMENT;
  },

  getActiveTournamentGameIds(): string[] {
    return this.getActiveConfig().selectedGameIds;
  },

  getActiveTournamentGames(): CatalogGame[] {
    const ids = this.getActiveTournamentGameIds();
    return ids
      .map((id) => GameCatalog.getById(id))
      .filter((g): g is CatalogGame => Boolean(g));
  },

  getTimeRemaining(): { days: number; hours: number; minutes: number; seconds: number; formatted: string } {
    const now = new Date();
    const currentDay = now.getUTCDay();
    const daysUntilSunday = (7 - currentDay) % 7;
    const endOfWeek = new Date(now);
    endOfWeek.setUTCDate(now.getUTCDate() + daysUntilSunday);
    endOfWeek.setUTCHours(23, 59, 59, 999);

    const diffMs = Math.max(0, endOfWeek.getTime() - now.getTime());
    const totalSeconds = Math.floor(diffMs / 1000);

    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const formatted = `${days}d ${hours}h ${minutes}m left`;
    return { days, hours, minutes, seconds, formatted };
  },

  getUserScoreForGame(gameId: string, profile?: UserProfile): number {
    return profile?.highScores?.[gameId] || 0;
  },

  /**
   * Asynchronously fetch real live tournament leaderboard from PostgreSQL
   */
  async refreshLiveLeaderboard(tournamentId: string = 'tourn_crazy_colors_01'): Promise<TournamentLeaderboardItem[]> {
    const live = await apiService.getTournamentLeaderboard(tournamentId);
    if (live && Array.isArray(live)) {
      cachedLiveEntries = live;
    }
    return cachedLiveEntries;
  },

  /**
   * Retrieves full tournament summary, ranking table, and current user standing
   */
  getTournamentSummary(profile?: UserProfile, liveData?: TournamentLeaderboardItem[]): TournamentSummaryData {
    const config = this.getActiveConfig();
    const participatingGames = this.getActiveTournamentGames();
    const gameMap = new Map<string, CatalogGame>(participatingGames.map((g) => [g.gameId, g]));

    const currentUserScores: Record<string, number> = {};
    let currentUserBestScore = 0;
    let currentUserBestGameId = '';

    participatingGames.forEach((game) => {
      const score = this.getUserScoreForGame(game.gameId, profile);
      currentUserScores[game.gameId] = score;
      if (score > currentUserBestScore) {
        currentUserBestScore = score;
        currentUserBestGameId = game.gameId;
      }
    });

    const currentUserBestGame: CatalogGame | null = currentUserBestGameId
      ? gameMap.get(currentUserBestGameId) || null
      : null;

    const sourceEntries = liveData && liveData.length > 0 ? liveData : cachedLiveEntries;

    const topEntries: OverallTournamentEntry[] = sourceEntries.map((item) => {
      const isCurrent = Boolean(
        profile && (
          item.displayName === profile.displayName ||
          (profile.phoneNumber && item.maskedMsisdn.includes(profile.phoneNumber.slice(-3)))
        )
      );

      return {
        rank: item.rank,
        playerId: `player_${item.rank}`,
        playerName: item.displayName || 'Gamer',
        playerMasked: item.maskedMsisdn || '091*****890',
        bestScore: item.score,
        bestGameId: 'crazy-colors',
        bestGameTitle: 'Crazy Color',
        achievementTimestamp: item.submittedAt ? new Date(item.submittedAt).getTime() : Date.now(),
        rewardText: item.prizeText || (item.rank === 1 ? '10,000 ETB' : item.rank === 2 ? '6,000 ETB' : '3,000 ETB'),
        isCurrentUser: isCurrent,
        gameScores: { 'crazy-colors': item.score },
      };
    });

    const currentEntry = topEntries.find((e) => e.isCurrentUser);
    const currentUserRank = currentEntry ? currentEntry.rank : (currentUserBestScore > 0 ? 11 : 0);

    return {
      config,
      participatingGames,
      topEntries,
      currentUserBestScore,
      currentUserBestGame,
      currentUserRank,
      currentUserScores,
      totalParticipants: Math.max(topEntries.length, 1),
      timeRemaining: this.getTimeRemaining(),
    };
  },
};
