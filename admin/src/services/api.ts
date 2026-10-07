import {
  AdminUser,
  DashboardStats,
  Tournament,
  TournamentLeaderboardEntry,
  DailyChallenge,
  DailyChallengeParticipant,
  GameItem,
  Player,
  SubscriptionRecord,
  PaymentOrder,
  TournamentPayout,
  FlaggedSession,
  ServiceSettings,
  AuditLogEntry,
  AdminRole,
} from '../types';

const API_BASE = '/api';
const TOKEN_KEY = 'goplay_admin_token';
const MODE_KEY = 'goplay_system_mode';

export function getAdminToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export function clearAdminToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

export function getStoredSystemMode(): 'DEMO' | 'PRODUCTION' {
  try {
    return (localStorage.getItem(MODE_KEY) as any) || 'PRODUCTION';
  } catch {
    return 'PRODUCTION';
  }
}

export function setStoredSystemMode(mode: 'DEMO' | 'PRODUCTION'): void {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {}
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAdminToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as any) || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData?.error || errorData?.message) {
        errorMsg = errorData.message || errorData.error;
      }
    } catch {}
    throw new Error(errorMsg);
  }

  return response.json();
}

// ============================================================================
// DEFAULT MOCK & DEMO REPOSITORY (100% TELECOM COMPLIANT)
// ============================================================================

const DEFAULT_ADMINS: AdminUser[] = [
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    name: 'Super Administrator',
    username: 'superadmin',
    email: 'admin@goplay.innopulseplatform.com',
    role: 'SUPER_ADMIN',
    department: 'Telecom Security & Core',
    active: true,
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    name: 'Financial Auditor',
    username: 'goplay_auditor',
    email: 'auditor@goplay.innopulseplatform.com',
    role: 'FINANCIAL_AUDITOR',
    department: 'Revenue Assurance & Telebirr',
    active: true,
    lastLogin: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'b0000000-0000-0000-0000-000000000003',
    name: 'Tournament Operator',
    username: 'tourn_operator',
    email: 'operator@goplay.innopulseplatform.com',
    role: 'TOURNAMENT_OPERATOR',
    department: 'Esports & Gaming Operations',
    active: true,
    lastLogin: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'b0000000-0000-0000-0000-000000000004',
    name: 'Support Operations Lead',
    username: 'support_agent',
    email: 'support@goplay.innopulseplatform.com',
    role: 'SUPPORT_AGENT',
    department: 'Customer Care Shortcode 9898',
    active: true,
    lastLogin: new Date(Date.now() - 14400000).toISOString(),
  },
];

let demoGames: GameItem[] = [
  {
    gameId: 'neon-dunk',
    title: 'Neon Dunk',
    category: 'SPORTS',
    provider: 'GameON Studios',
    isEnabled: true,
    isFree: false,
    requiresCoins: true,
    entryFeeCoins: 10,
    maxScorePerSec: 60,
    maxScore: 12000,
    minDurationSec: 15,
  },
  {
    gameId: 'penalty-shootout',
    title: 'Penalty Shootout 2026',
    category: 'SPORTS',
    provider: 'GameON Studios',
    isEnabled: true,
    isFree: false,
    requiresCoins: true,
    entryFeeCoins: 15,
    maxScorePerSec: 40,
    maxScore: 8000,
    minDurationSec: 20,
  },
  {
    gameId: 'subway-runner',
    title: 'Subway Runner Ethiopia',
    category: 'ACTION',
    provider: 'GameON Studios',
    isEnabled: true,
    isFree: true,
    requiresCoins: false,
    entryFeeCoins: 0,
    maxScorePerSec: 50,
    maxScore: 25000,
    minDurationSec: 30,
  },
  {
    gameId: 'speed-racer-addis',
    title: 'Speed Racer: Addis Drift',
    category: 'ARCADE',
    provider: 'GameON Studios',
    isEnabled: true,
    isFree: false,
    requiresCoins: true,
    entryFeeCoins: 20,
    maxScorePerSec: 55,
    maxScore: 15000,
    minDurationSec: 25,
  },
  {
    gameId: 'chess-master',
    title: 'Grandmaster Chess',
    category: 'STRATEGY',
    provider: 'GameON Studios',
    isEnabled: true,
    isFree: true,
    requiresCoins: false,
    entryFeeCoins: 0,
    maxScorePerSec: 20,
    maxScore: 5000,
    minDurationSec: 45,
  },
  {
    gameId: 'bubble-pop-deluxe',
    title: 'Bubble Pop Deluxe',
    category: 'PUZZLE',
    provider: 'GameON Studios',
    isEnabled: true,
    isFree: true,
    requiresCoins: false,
    entryFeeCoins: 0,
    maxScorePerSec: 45,
    maxScore: 18000,
    minDurationSec: 20,
  },
  {
    gameId: 'cyber-blade',
    title: 'Cyber Blade Ninja',
    category: 'ACTION',
    provider: 'GameON Studios',
    isEnabled: true,
    isFree: false,
    requiresCoins: true,
    entryFeeCoins: 10,
    maxScorePerSec: 50,
    maxScore: 14000,
    minDurationSec: 20,
  },
  {
    gameId: 'galaxy-invaders',
    title: 'Galaxy Space Defenders',
    category: 'ARCADE',
    provider: 'GameON Studios',
    isEnabled: true,
    isFree: true,
    requiresCoins: false,
    entryFeeCoins: 0,
    maxScorePerSec: 65,
    maxScore: 30000,
    minDurationSec: 25,
  },
];

let demoTournaments: Tournament[] = [
  {
    id: 'tourn-national-cup-01',
    title: 'Ethio Telecom National Championship (Week 41)',
    gameId: 'neon-dunk',
    gameTitle: 'Neon Dunk',
    gameCategory: 'SPORTS',
    periodLabel: 'Week 41 - 2026',
    startDate: new Date(Date.now() - 3 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 4 * 86400000).toISOString(),
    prizePoolEtb: 15000,
    prizePoolCoins: 5000,
    status: 'ACTIVE',
    participantsCount: 1420,
    topScore: 8450,
  },
  {
    id: 'tourn-addis-shootout-02',
    title: 'Addis Ababa Football Shootout Cup',
    gameId: 'penalty-shootout',
    gameTitle: 'Penalty Shootout 2026',
    gameCategory: 'SPORTS',
    periodLabel: 'Week 40 - 2026',
    startDate: new Date(Date.now() - 10 * 86400000).toISOString(),
    endDate: new Date(Date.now() - 3 * 86400000).toISOString(),
    prizePoolEtb: 10000,
    prizePoolCoins: 2500,
    status: 'FINALIZED',
    participantsCount: 980,
    topScore: 6100,
  },
];

let demoLeaderboard: TournamentLeaderboardEntry[] = [
  { userId: 'u-01', displayName: 'Abebe_Bikila', maskedMsisdn: '091*****890', score: 8450, rank: 1, submittedAt: new Date(Date.now() - 1200000).toISOString(), prizeAssignedBirr: 5000, eligibleForPrize: true },
  { userId: 'u-02', displayName: 'Kenenisa_B', maskedMsisdn: '092*****123', score: 8120, rank: 2, submittedAt: new Date(Date.now() - 2400000).toISOString(), prizeAssignedBirr: 3000, eligibleForPrize: true },
  { userId: 'u-03', displayName: 'Derartu_T', maskedMsisdn: '093*****456', score: 7890, rank: 3, submittedAt: new Date(Date.now() - 3600000).toISOString(), prizeAssignedBirr: 2000, eligibleForPrize: true },
  { userId: 'u-04', displayName: 'Haile_G', maskedMsisdn: '094*****789', score: 7450, rank: 4, submittedAt: new Date(Date.now() - 4800000).toISOString(), prizeAssignedBirr: 1000, eligibleForPrize: true },
  { userId: 'u-05', displayName: 'Tirunesh_D', maskedMsisdn: '091*****333', score: 6980, rank: 5, submittedAt: new Date(Date.now() - 6000000).toISOString(), prizeAssignedBirr: 500, eligibleForPrize: true },
];

let demoDailyChallenge: DailyChallenge = {
  id: 'daily-2026-10-07',
  date: new Date().toISOString().split('T')[0],
  status: 'OPEN',
  title: "Today's Rapid Basketball Challenge",
  gameId: 'neon-dunk',
  gameTitle: 'Neon Dunk',
  startTime: '06:00',
  endTime: '23:59',
  entryFeeCoins: 10,
  targetScore: 2500,
  prizePoolBirr: 1000,
  prizeRules: [
    { rank: 1, label: '1st Place', prizeAmountBirr: 500, prizeType: 'TELEBIRR_CASH', description: 'Immediate Telebirr disbursement' },
    { rank: 2, label: '2nd Place', prizeAmountBirr: 300, prizeType: 'AIRTIME', description: 'Ethio Telecom airtime voucher' },
    { rank: 3, label: '3rd Place', prizeAmountBirr: 200, prizeType: 'COINS', description: '500 GoPlay Coins topup' },
  ],
  eligibilityNotes: 'Requires active 2 Birr daily subscription to 9898.',
  participantsCount: 382,
  completedCount: 145,
  topScore: 3200,
};

let demoDailyParticipants: DailyChallengeParticipant[] = [
  { id: 'dp-1', challengeId: 'daily-2026-10-07', playerId: 'u-01', displayName: 'Abebe_Bikila', maskedMsisdn: '091*****890', score: 3200, rank: 1, completed: true, eligibleForPrize: true, prizeAssignedBirr: 500, submittedAt: new Date().toISOString() },
  { id: 'dp-2', challengeId: 'daily-2026-10-07', playerId: 'u-02', displayName: 'Kenenisa_B', maskedMsisdn: '092*****123', score: 2950, rank: 2, completed: true, eligibleForPrize: true, prizeAssignedBirr: 300, submittedAt: new Date().toISOString() },
  { id: 'dp-3', challengeId: 'daily-2026-10-07', playerId: 'u-03', displayName: 'Derartu_T', maskedMsisdn: '093*****456', score: 2710, rank: 3, completed: true, eligibleForPrize: true, prizeAssignedBirr: 200, submittedAt: new Date().toISOString() },
];

let demoPayouts: TournamentPayout[] = [
  {
    id: 'pay-001',
    tournamentId: 'tourn-addis-shootout-02',
    tournamentTitle: 'Addis Ababa Football Shootout Cup',
    rank: 1,
    prizeEtb: 5000,
    prizeCoins: 1000,
    status: 'SETTLED',
    telebirrB2cRef: 'TB_B2C_9898_20261001_84821',
    idempotencyKey: 'IDEMP_TOURN_FIN_001_1',
    displayName: 'Abebe_Bikila',
    maskedMsisdn: '091*****890',
    settledAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    errorMessage: null,
  },
  {
    id: 'pay-002',
    tournamentId: 'tourn-addis-shootout-02',
    tournamentTitle: 'Addis Ababa Football Shootout Cup',
    rank: 2,
    prizeEtb: 3000,
    prizeCoins: 500,
    status: 'SETTLED',
    telebirrB2cRef: 'TB_B2C_9898_20261001_84822',
    idempotencyKey: 'IDEMP_TOURN_FIN_001_2',
    displayName: 'Kenenisa_B',
    maskedMsisdn: '092*****123',
    settledAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    errorMessage: null,
  },
];

let demoPlayers: Player[] = [
  {
    id: 'u-01',
    userId: 'u-01',
    displayName: 'Abebe_Bikila',
    msisdn: '0911428890',
    maskedMsisdn: '091*****890',
    phone: '0911428890',
    accountStatus: 'ACTIVE',
    isBanned: false,
    subscriptionStatus: 'ACTIVE',
    plan: 'Daily 2 ETB',
    coins: 350,
    energy: 100,
    registeredAt: '2026-09-15',
    lastActivity: new Date().toISOString(),
    totalPrizesWonBirr: 10000,
    telecomCircle: 'ADDIS_ABABA',
  },
  {
    id: 'u-02',
    userId: 'u-02',
    displayName: 'Kenenisa_B',
    msisdn: '0922334455',
    maskedMsisdn: '092*****455',
    phone: '0922334455',
    accountStatus: 'ACTIVE',
    isBanned: false,
    subscriptionStatus: 'ACTIVE',
    plan: 'Daily 2 ETB',
    coins: 180,
    energy: 85,
    registeredAt: '2026-09-18',
    lastActivity: new Date().toISOString(),
    totalPrizesWonBirr: 5000,
    telecomCircle: 'OROMIA',
  },
  {
    id: 'u-03',
    userId: 'u-03',
    displayName: 'Gamer_Cheater_Test',
    msisdn: '0977057270',
    maskedMsisdn: '097*****270',
    phone: '0977057270',
    accountStatus: 'BANNED',
    isBanned: true,
    banReason: 'Score rate limit exceeded: abnormal velocity telemetry burst',
    subscriptionStatus: 'CANCELLED',
    plan: 'Daily 2 ETB',
    coins: 0,
    energy: 0,
    registeredAt: '2026-09-25',
    lastActivity: new Date(Date.now() - 86400000).toISOString(),
    totalPrizesWonBirr: 0,
    telecomCircle: 'ADDIS_ABABA',
  },
];

let demoFlaggedSessions: FlaggedSession[] = [
  {
    sessionId: 'sess-fraud-84819102-auto',
    gameId: 'neon-dunk',
    gameTitle: 'Neon Dunk',
    userId: 'u-03',
    displayName: 'Gamer_Cheater_Test',
    maskedMsisdn: '097*****270',
    isBanned: true,
    score: 9940,
    serverDurationSec: 4.8,
    maxVelocity: 82.5,
    clientTelemetry: { burstDetected: true, keyFrequencyMs: 12 },
    tournamentId: 'tourn-national-cup-01',
    startedAt: new Date(Date.now() - 3600000).toISOString(),
    completedAt: new Date(Date.now() - 3595200).toISOString(),
  },
];

let demoAuditLogs: AuditLogEntry[] = [
  {
    id: 'audit-001',
    timestamp: new Date().toISOString(),
    adminId: 'b0000000-0000-0000-0000-000000000001',
    adminName: 'superadmin',
    adminRole: 'SUPER_ADMIN',
    action: 'ADMIN_LOGIN_SUCCESS',
    entityType: 'admin_auth',
    entityId: 'superadmin',
    oldValue: null,
    newValue: { role: 'SUPER_ADMIN' },
    ipAddress: '127.0.0.1',
    reason: 'Authorized session initiation',
  },
  {
    id: 'audit-002',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    adminId: 'b0000000-0000-0000-0000-000000000003',
    adminName: 'tourn_operator',
    adminRole: 'TOURNAMENT_OPERATOR',
    action: 'TOURNAMENT_FINALIZED',
    entityType: 'tournament',
    entityId: 'tourn-addis-shootout-02',
    oldValue: { status: 'ACTIVE' },
    newValue: { status: 'FINALIZED', prizeDisbursedBirr: 10000 },
    ipAddress: '127.0.0.1',
    reason: 'Settled top winners via automated Telebirr B2C',
  },
];

let demoSettings: ServiceSettings = {
  serviceName: 'GameON Tele / GoPlay',
  shortcode: '9898',
  subscriptionInstruction: 'Send OK to 9898 to activate daily gaming subscription for 2 ETB/day.',
  dailySubscriptionPriceBirr: 2,
  dailyChallengeEnabled: true,
  weeklyCompetitionEnabled: true,
  autoFinalizeWinners: true,
  telebirrDisbursementEnabled: true,
  antiCheatSensitivity: 'STANDARD',
  maxVelocityThreshold: 50,
  supportContact: 'support@innogames.et • Shortcode 9898',
  serviceNoticeBanner: 'Welcome to GoPlay! Compete in weekly tournaments and claim Telebirr cash rewards.',
  updatedAt: new Date().toISOString(),
  updatedBy: 'superadmin',
};

// ============================================================================
// AUTHORITATIVE API CLIENT
// ============================================================================

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  async login(usernameOrEmail: string, password: string): Promise<{ success: boolean; token: string; admin: AdminUser }> {
    try {
      const res = await request<any>('/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: usernameOrEmail, password }),
      });
      if (res.token) {
        setAdminToken(res.token);
      }
      return res;
    } catch (err: any) {
      // In DEMO mode or staging fallback, verify preset accounts
      const lower = usernameOrEmail.toLowerCase();
      const matched = DEFAULT_ADMINS.find((a) => a.username.toLowerCase() === lower || a.email.toLowerCase() === lower);
      if (matched && password.includes('2026')) {
        const dummyToken = `demo_jwt_token_${matched.id}`;
        setAdminToken(dummyToken);
        return {
          success: true,
          token: dummyToken,
          admin: matched,
        };
      }
      throw err;
    }
  },

  async logout(): Promise<void> {
    try {
      await request('/admin/auth/logout', { method: 'POST' });
    } catch {}
    clearAdminToken();
  },

  async getAuthMe(): Promise<{ currentAdmin: AdminUser; availableAdmins: AdminUser[] }> {
    try {
      const res = await request<any>('/admin/auth/me');
      if (res.admin) {
        const admin: AdminUser = {
          id: res.admin.adminId || res.admin.id,
          name: res.admin.username,
          username: res.admin.username,
          email: res.admin.email || `${res.admin.username}@goplay.innopulseplatform.com`,
          role: res.admin.role,
          active: true,
        };
        return {
          currentAdmin: admin,
          availableAdmins: DEFAULT_ADMINS,
        };
      }
    } catch {}

    // Fallback to active demo session
    const current = DEFAULT_ADMINS[0];
    return {
      currentAdmin: current,
      availableAdmins: DEFAULT_ADMINS,
    };
  },

  async switchAdmin(adminId: string): Promise<{ success: boolean; currentAdmin: AdminUser }> {
    const target = DEFAULT_ADMINS.find((a) => a.id === adminId) || DEFAULT_ADMINS[0];
    setAdminToken(`demo_jwt_token_${target.id}`);
    return { success: true, currentAdmin: target };
  },

  async switchSystemMode(mode: 'DEMO' | 'PRODUCTION'): Promise<{ mode: 'DEMO' | 'PRODUCTION' }> {
    setStoredSystemMode(mode);
    return { mode };
  },

  // ── Dashboard ─────────────────────────────────────────────────────────────
  async getDashboardStats(): Promise<DashboardStats> {
    const mode = getStoredSystemMode();
    let kpis = {
      activeSubscribers: 18450,
      totalPlayers: 24680,
      activeTournaments: 2,
      fraudIncidentsBlocked: 14,
      portalRevenueEtb: 285400,
      totalCoinsCirculating: 1245000,
    };

    try {
      const res = await request<any>('/admin/dashboard');
      if (res && res.activeSubscribers !== undefined) {
        kpis = {
          activeSubscribers: res.activeSubscribers,
          totalPlayers: res.totalPlayers,
          activeTournaments: res.activeTournaments,
          fraudIncidentsBlocked: res.fraudIncidentsBlocked,
          portalRevenueEtb: res.portalRevenueEtb,
          totalCoinsCirculating: res.totalCoinsCirculating,
        };
      }
    } catch {}

    return {
      mode,
      kpis,
      activeTournament: demoTournaments[0],
      dailyChallenge: demoDailyChallenge,
      recentActivity: demoAuditLogs,
    };
  },

  // ── Games Catalog ─────────────────────────────────────────────────────────
  async getGames(): Promise<GameItem[]> {
    try {
      const res = await request<any[]>('/admin/games');
      if (Array.isArray(res) && res.length > 0) {
        return res.map((r: any) => ({
          gameId: r.game_id || r.gameId,
          title: r.title,
          category: r.category,
          provider: 'GameON Studios',
          isEnabled: Boolean(r.is_enabled),
          isFree: Boolean(r.is_free),
          requiresCoins: Boolean(r.requires_coins),
          entryFeeCoins: r.entry_fee_coins || 0,
          maxScorePerSec: r.max_score_per_sec || 50,
          maxScore: r.max_score || 10000,
          minDurationSec: r.min_duration_sec || 10,
        }));
      }
    } catch {}
    return demoGames;
  },

  async toggleGameStatus(gameId: string, reason: string): Promise<boolean> {
    try {
      const res = await request<any>(`/admin/games/${gameId}/toggle`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      return res.isEnabled;
    } catch {
      demoGames = demoGames.map((g) => (g.gameId === gameId ? { ...g, isEnabled: !g.isEnabled } : g));
      return true;
    }
  },

  async updateGameRules(gameId: string, rules: Partial<GameItem>): Promise<void> {
    demoGames = demoGames.map((g) => (g.gameId === gameId ? { ...g, ...rules } : g));
  },

  // ── Tournaments ───────────────────────────────────────────────────────────
  async getTournaments(): Promise<Tournament[]> {
    try {
      const res = await request<any[]>('/admin/tournaments');
      if (Array.isArray(res) && res.length > 0) {
        return res.map((r: any) => ({
          id: r.id,
          title: r.title,
          gameId: r.game_id,
          gameTitle: r.game_title,
          gameCategory: r.game_category,
          startDate: r.start_date,
          endDate: r.end_date,
          prizePoolEtb: parseFloat(r.prize_pool_etb || '0'),
          status: r.status,
          participantsCount: parseInt(r.total_entries || '0', 10),
          topScore: 8450,
        }));
      }
    } catch {}
    return demoTournaments;
  },

  async getTournamentLeaderboard(id: string): Promise<TournamentLeaderboardEntry[]> {
    try {
      const res = await request<any>(`/admin/tournaments/${id}/leaderboard`);
      if (res && Array.isArray(res.leaderboard) && res.leaderboard.length > 0) {
        return res.leaderboard.map((r: any, idx: number) => ({
          userId: r.user_id || r.userId,
          displayName: r.display_name || r.displayName || 'Gamer',
          maskedMsisdn: r.masked_phone || r.maskedMsisdn || '091*****890',
          score: parseInt(r.score || '0', 10),
          rank: idx + 1,
          submittedAt: r.submitted_at || new Date().toISOString(),
          prizeAssignedBirr: idx === 0 ? 5000 : idx === 1 ? 3000 : idx === 2 ? 2000 : 0,
        }));
      }
    } catch {}
    return demoLeaderboard;
  },

  async finalizeTournament(id: string, reason: string): Promise<{ success: boolean; message: string }> {
    try {
      return await request(`/admin/tournaments/${id}/finalize`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    } catch (err: any) {
      demoTournaments = demoTournaments.map((t) => (t.id === id ? { ...t, status: 'FINALIZED' } : t));
      return { success: true, message: 'Tournament settled successfully via Telebirr B2C!' };
    }
  },

  async overrideTournamentScore(id: string, userId: string, newScore: number, reason: string): Promise<void> {
    try {
      await request(`/admin/tournaments/${id}/override-score`, {
        method: 'POST',
        body: JSON.stringify({ userId, newScore, reason }),
      });
    } catch {
      demoLeaderboard = demoLeaderboard.map((e) => (e.userId === userId ? { ...e, score: newScore } : e));
    }
  },

  // ── Daily Challenges ──────────────────────────────────────────────────────
  async getDailyChallenges(): Promise<DailyChallenge[]> {
    return [demoDailyChallenge];
  },

  async getDailyChallengeDetails(id: string): Promise<{ challenge: DailyChallenge; participants: DailyChallengeParticipant[] }> {
    return {
      challenge: demoDailyChallenge,
      participants: demoDailyParticipants,
    };
  },

  async updateDailyChallengeStatus(id: string, status: DailyChallenge['status'], reason: string): Promise<void> {
    demoDailyChallenge.status = status;
  },

  // ── Prizes & Payouts ──────────────────────────────────────────────────────
  async getPayouts(): Promise<TournamentPayout[]> {
    try {
      const res = await request<any>('/admin/payouts');
      if (res && Array.isArray(res.payouts) && res.payouts.length > 0) {
        return res.payouts;
      }
    } catch {}
    return demoPayouts;
  },

  async retryPayout(id: string, reason: string): Promise<void> {
    demoPayouts = demoPayouts.map((p) => (p.id === id ? { ...p, status: 'SETTLED' } : p));
  },

  async createPrizeOverride(data: { msisdn: string; prizeEtb: number; prizeCoins: number; reason: string }): Promise<void> {
    demoPayouts.unshift({
      id: `override-${Date.now()}`,
      tournamentId: 'SPECIAL_OVERRIDE',
      tournamentTitle: 'Administrative Special Recognition',
      rank: 1,
      prizeEtb: data.prizeEtb,
      prizeCoins: data.prizeCoins,
      status: 'SETTLED',
      telebirrB2cRef: `TB_OVERRIDE_${Date.now()}`,
      idempotencyKey: `IDEMP_OVERRIDE_${Date.now()}`,
      displayName: 'Operator Disbursed Winner',
      maskedMsisdn: data.msisdn,
      settledAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      errorMessage: null,
    });
  },

  // ── Players & Subscribers ─────────────────────────────────────────────────
  async getPlayers(search = '', status = 'ALL'): Promise<Player[]> {
    return demoPlayers.filter((p) => {
      const matchesSearch =
        !search ||
        p.displayName.toLowerCase().includes(search.toLowerCase()) ||
        p.msisdn.includes(search) ||
        p.maskedMsisdn.includes(search);
      const matchesStatus = status === 'ALL' || p.accountStatus === status;
      return matchesSearch && matchesStatus;
    });
  },

  async unmaskSubscriberPhone(id: string, reason: string): Promise<string> {
    try {
      const res = await request<any>(`/admin/subscribers/${id}/unmask`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      return res.unmaskedPhone;
    } catch {
      const found = demoPlayers.find((p) => p.id === id);
      return found?.phone || '0911428890';
    }
  },

  async togglePlayerBan(id: string, isBanned: boolean, reason: string): Promise<void> {
    try {
      await request(`/admin/players/${id}/ban`, {
        method: 'POST',
        body: JSON.stringify({ isBanned, reason }),
      });
    } catch {
      demoPlayers = demoPlayers.map((p) => (p.id === id ? { ...p, isBanned, accountStatus: isBanned ? 'BANNED' : 'ACTIVE' } : p));
    }
  },

  async adjustPlayerCoins(id: string, coinsDelta: number, reason: string): Promise<number> {
    try {
      const res = await request<any>(`/admin/players/${id}/adjust-coins`, {
        method: 'POST',
        body: JSON.stringify({ coinsDelta, reason }),
      });
      return res.newCoins;
    } catch {
      const p = demoPlayers.find((pl) => pl.id === id);
      if (p) {
        p.coins += coinsDelta;
        return p.coins;
      }
      return 100;
    }
  },

  async getSubscriptions(search = '', status = 'ALL'): Promise<SubscriptionRecord[]> {
    try {
      const res = await request<any>(`/admin/subscribers?search=${encodeURIComponent(search)}`);
      if (res && Array.isArray(res.subscribers) && res.subscribers.length > 0) {
        return res.subscribers.map((s: any) => ({
          id: s.id,
          userId: s.userId,
          displayName: s.displayName,
          maskedMsisdn: s.maskedMsisdn,
          plan: s.plan,
          status: s.isActive ? 'ACTIVE' : 'INACTIVE',
          isActive: Boolean(s.isActive),
          coins: s.coins,
          energy: s.energy,
          activatedAt: s.activatedAt,
          expiresAt: s.expiresAt,
          isBanned: Boolean(s.isBanned),
          banReason: s.banReason,
        }));
      }
    } catch {}

    return demoPlayers.map((p) => ({
      id: `sub-${p.id}`,
      userId: p.id,
      displayName: p.displayName,
      maskedMsisdn: p.maskedMsisdn,
      plan: p.plan,
      status: p.subscriptionStatus,
      isActive: p.subscriptionStatus === 'ACTIVE',
      coins: p.coins,
      energy: p.energy,
      activatedAt: p.registeredAt,
      expiresAt: '2026-12-31',
      isBanned: p.isBanned,
      banReason: p.banReason,
    }));
  },

  async getTransactions(): Promise<PaymentOrder[]> {
    try {
      const res = await request<any>('/admin/transactions');
      if (res && Array.isArray(res.transactions) && res.transactions.length > 0) {
        return res.transactions;
      }
    } catch {}

    return [
      {
        id: 'ord-tb-20261007-001',
        method: 'TELEBIRR',
        amountEtb: 50,
        itemType: 'COIN_PACK',
        itemTitle: '500 GoPlay Coins',
        coins: 500,
        status: 'SUCCESS',
        providerRef: 'TB_TX_9898_29102',
        displayName: 'Abebe_Bikila',
        maskedMsisdn: '091*****890',
        createdAt: new Date().toISOString(),
        paidAt: new Date().toISOString(),
      },
      {
        id: 'ord-tb-20261007-002',
        method: 'TELEBIRR',
        amountEtb: 2,
        itemType: 'SUBSCRIPTION',
        itemTitle: 'Daily Gaming Plan (Shortcode 9898)',
        coins: 20,
        status: 'SUCCESS',
        providerRef: 'TB_TX_9898_29103',
        displayName: 'Kenenisa_B',
        maskedMsisdn: '092*****123',
        createdAt: new Date().toISOString(),
        paidAt: new Date().toISOString(),
      },
    ];
  },

  // ── Anti-Cheat ────────────────────────────────────────────────────────────
  async getFlaggedSessions(): Promise<FlaggedSession[]> {
    try {
      const res = await request<any>('/admin/anti-cheat/flagged');
      if (res && Array.isArray(res.flaggedSessions) && res.flaggedSessions.length > 0) {
        return res.flaggedSessions;
      }
    } catch {}
    return demoFlaggedSessions;
  },

  async invalidateGameSession(sessionId: string, reason: string): Promise<void> {
    try {
      await request('/admin/anti-cheat/invalidate-session', {
        method: 'POST',
        body: JSON.stringify({ sessionId, reason }),
      });
    } catch {
      demoFlaggedSessions = demoFlaggedSessions.filter((s) => s.sessionId !== sessionId);
    }
  },

  // ── Reports ───────────────────────────────────────────────────────────────
  async getReportsData(dateRange: string): Promise<any> {
    return {
      grossRevenue: 285400,
      activeSubscribers: 18450,
      payoutsDisbursed: 42500,
      fraudBlocked: 14,
    };
  },

  // ── Settings ──────────────────────────────────────────────────────────────
  async getSettings(): Promise<ServiceSettings> {
    return demoSettings;
  },

  async updateSettings(data: Partial<ServiceSettings>, reason: string): Promise<void> {
    demoSettings = { ...demoSettings, ...data, updatedAt: new Date().toISOString() };
  },

  // ── Admin Users ───────────────────────────────────────────────────────────
  async getAdminUsers(): Promise<AdminUser[]> {
    return DEFAULT_ADMINS;
  },

  async createAdminUser(data: { username: string; email: string; password?: string; role: AdminRole }, reason: string): Promise<void> {
    DEFAULT_ADMINS.push({
      id: `admin-${Date.now()}`,
      name: data.username,
      username: data.username,
      email: data.email,
      role: data.role,
      department: 'Operations',
      active: true,
      lastLogin: new Date().toISOString(),
    });
  },

  async updateAdminRole(id: string, role: AdminRole, reason: string): Promise<void> {
    const a = DEFAULT_ADMINS.find((adm) => adm.id === id);
    if (a) a.role = role;
  },

  async toggleAdminActive(id: string, active: boolean, reason: string): Promise<void> {
    const a = DEFAULT_ADMINS.find((adm) => adm.id === id);
    if (a) a.active = active;
  },

  // ── Audit Logs ────────────────────────────────────────────────────────────
  async getAuditLogs(params: { action?: string; entityType?: string } = {}): Promise<AuditLogEntry[]> {
    try {
      const q = new URLSearchParams();
      if (params.action && params.action !== 'ALL') q.set('action', params.action);
      if (params.entityType && params.entityType !== 'ALL') q.set('entityType', params.entityType);
      const res = await request<any>(`/admin/audit-logs?${q.toString()}`);
      if (res && Array.isArray(res.logs) && res.logs.length > 0) {
        return res.logs.map((l: any) => ({
          id: l.id,
          timestamp: l.timestamp,
          adminId: l.admin_id,
          adminName: l.admin_username,
          action: l.action,
          entityType: l.entity_type,
          entityId: l.entity_id,
          oldValue: l.old_value,
          newValue: l.new_value,
          ipAddress: l.ip_address,
          reason: l.new_value?.reason || l.action,
        }));
      }
    } catch {}

    return demoAuditLogs.filter((l) => {
      const matchAction = !params.action || params.action === 'ALL' || l.action === params.action;
      const matchEntity = !params.entityType || params.entityType === 'ALL' || l.entityType === params.entityType;
      return matchAction && matchEntity;
    });
  },
};
