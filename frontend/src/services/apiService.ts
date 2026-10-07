/**
 * GoPlay - Real Backend & Database API Client
 * Connects frontend directly to Fastify REST API and PostgreSQL database on port 3302.
 */

import { UserProfile, LeaderboardEntry, Tournament } from '../types';

const API_BASE = '/api';

export interface BackendGame {
  gameId: string;
  title: string;
  category: string;
  isFree: boolean;
  requiresCoins: boolean;
  coinCost: number;
  maxScore: number;
  maxScorePerSec: number;
}

export interface TournamentLeaderboardItem {
  rank: number;
  maskedMsisdn: string;
  displayName: string;
  score: number;
  prizeETB: number;
  prizeText: string;
  submittedAt: string;
}

class ApiService {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('goplay_access_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('goplay_access_token', token);
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('goplay_access_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('goplay_access_token');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };

      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      if (!res.ok) {
        console.warn(`[ApiService] Request to ${endpoint} failed with status: ${res.status}`);
        return null;
      }

      return (await res.json()) as T;
    } catch (err) {
      console.warn(`[ApiService] Network error on ${endpoint}:`, err);
      return null;
    }
  }

  /**
   * Authenticate via Telebirr Game Center and load real PostgreSQL UserProfile
   */
  async loginWithTelebirr(phoneNumber?: string, token?: string): Promise<UserProfile | null> {
    const res = await this.request<{
      success: boolean;
      profile: UserProfile;
      tokens?: { accessToken: string; refreshToken: string };
    }>('/auth/telebirr-login', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, token }),
    });

    if (res?.success && res.profile) {
      if (res.tokens?.accessToken) {
        this.setToken(res.tokens.accessToken);
      }
      return res.profile;
    }

    return null;
  }

  /**
   * Fetch current authenticated profile from PostgreSQL
   */
  async getProfile(): Promise<UserProfile | null> {
    const res = await this.request<{ success: boolean; profile: UserProfile }>('/auth/me');
    if (res?.success && res.profile) {
      return res.profile;
    }
    return this.request<UserProfile>('/profile');
  }

  /**
   * Fetch 12-game catalog from PostgreSQL
   */
  async getGamesCatalog(): Promise<BackendGame[] | null> {
    const res = await this.request<{ success: boolean; games: BackendGame[] }>('/game/catalog');
    return res?.games || null;
  }

  /**
   * Fetch live tournaments directly from PostgreSQL tournaments table
   */
  async getTournaments(): Promise<Tournament[] | null> {
    return this.request<Tournament[]>('/tournaments');
  }

  /**
   * Check player daily challenge attempt status
   */
  async getDailyStatus(): Promise<{
    hasActiveDaily: boolean;
    hasAttemptedToday: boolean;
    attempt?: { id: string; score: number; created_at: string } | null;
    activeTournament?: { id: string; title: string; game_id: string; prize_pool_etb: number } | null;
  } | null> {
    return this.request('/tournaments/daily-status');
  }

  /**
   * Fetch live tournament leaderboard from PostgreSQL
   */
  async getTournamentLeaderboard(tournamentId: string): Promise<TournamentLeaderboardItem[] | null> {
    const res = await this.request<{ tournamentId: string; leaderboard: TournamentLeaderboardItem[] }>(
      `/tournaments/${tournamentId}/leaderboard`
    );
    return res?.leaderboard || null;
  }

  /**
   * Enter a tournament (deducts 2 coins atomically in PostgreSQL)
   */
  async enterTournament(tournamentId: string): Promise<{ success: boolean; message: string; remainingCoins?: number; attemptsLeft?: number } | null> {
    return this.request<{ success: boolean; message: string; remainingCoins?: number; attemptsLeft?: number }>(
      `/tournaments/${tournamentId}/enter`,
      {
        method: 'POST',
      }
    );
  }

  /**
   * Fetch game all-time leaderboard from PostgreSQL high_scores
   */
  async getGameLeaderboard(gameId: string): Promise<LeaderboardEntry[] | null> {
    const res = await this.request<{ gameId: string; entries: LeaderboardEntry[] }>(`/game/leaderboard/${gameId}`);
    return res?.entries || null;
  }

  /**
   * Start authoritative game session at match launch
   */
  async startSession(
    gameId: string,
    tournamentId?: string
  ): Promise<{ success: boolean; sessionId?: string; sessionToken?: string; message?: string } | null> {
    const res = await this.request<{
      success: boolean;
      sessionId: string;
      sessionToken: string;
      message?: string;
    }>('/game/session/start', {
      method: 'POST',
      body: JSON.stringify({ gameId, tournamentId }),
    });

    if (res?.success && res.sessionId && res.sessionToken) {
      return { success: true, sessionId: res.sessionId, sessionToken: res.sessionToken };
    }
    return { success: false, message: res?.message || 'Failed to initialize secure game run.' };
  }

  /**
   * Submit authoritative game score with anti-cheat round token
   */
  async submitScore(
    gameId: string,
    rawScore: number,
    durationSeconds: number,
    tournamentId?: string,
    activeSession?: { sessionId: string; token: string },
    telemetry?: any
  ): Promise<{ success: boolean; verified?: boolean; score?: number; rank?: number; message?: string; updatedProfile?: UserProfile } | null> {
    let sId = activeSession?.sessionId;
    let sTok = activeSession?.token;

    // Fallback if no active session was passed
    if (!sId || !sTok) {
      const sessionRes = await this.request<{ token: string; sessionId: string }>('/game/session/start', {
        method: 'POST',
        body: JSON.stringify({ gameId, tournamentId }),
      });
      sId = sessionRes?.sessionId;
      sTok = sessionRes?.token;
    }

    if (!sId || !sTok) {
      console.error('[ApiService] Failed to obtain authoritative game session token from server');
      return null;
    }

    // Submit validated score with server token and session ID
    const submitRes = await this.request<{ success: boolean; verified: boolean; score: number; rank?: number; reason?: string }>(
      '/game/session/submit',
      {
        method: 'POST',
        body: JSON.stringify({
          sessionId: sId,
          token: sTok,
          gameId,
          score: rawScore,
          tournamentId,
          telemetry,
        }),
      }
    );

    // Refresh profile balance if tournament or high score changed
    const freshProfile = await this.getProfile();

    return {
      success: submitRes?.success || false,
      verified: submitRes?.verified,
      score: submitRes?.score,
      rank: submitRes?.rank,
      message: submitRes?.reason,
      updatedProfile: freshProfile || undefined,
    };
  }

  /**
   * Purchase GoPlay Coins via Telebirr (10 coins for 10 ETB, 25 for 25 ETB, 50 for 50 ETB)
   */
  async buyCoins(packageId: 'COIN_PACK_10' | 'COIN_PACK_25' | 'COIN_PACK_50' = 'COIN_PACK_10'): Promise<{ success: boolean; checkoutUrl?: string; message?: string }> {
    const res = await this.request<{
      status: string;
      checkoutUrl?: string;
      message: string;
    }>('/payments/process', {
      method: 'POST',
      body: JSON.stringify({
        packageId,
        itemType: 'COIN_PACK',
      }),
    });

    return {
      success: res?.status === 'SUCCESS' || res?.status === 'PENDING',
      checkoutUrl: res?.checkoutUrl,
      message: res?.message,
    };
  }

  /**
   * Activate VIP Subscription via Telebirr
   */
  async activateSubscription(plan: 'daily' | 'weekly' | 'monthly'): Promise<{ success: boolean; checkoutUrl?: string; message?: string }> {
    const res = await this.request<{
      status: string;
      checkoutUrl?: string;
      message: string;
    }>('/payments/process', {
      method: 'POST',
      body: JSON.stringify({
        itemType: 'VIP_SUBSCRIPTION',
        plan,
      }),
    });

    return {
      success: res?.status === 'SUCCESS' || res?.status === 'PENDING',
      checkoutUrl: res?.checkoutUrl,
      message: res?.message,
    };
  }

  /**
   * Fetch immutable wallet ledger
   */
  async getWalletLedger() {
    return this.request<any[]>('/payments/ledger');
  }
}

export const apiService = new ApiService();
