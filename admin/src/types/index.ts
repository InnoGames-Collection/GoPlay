export type AdminRole = 
  | 'SUPER_ADMIN' 
  | 'TOURNAMENT_OPERATOR' 
  | 'FINANCIAL_AUDITOR' 
  | 'SUPPORT_AGENT'
  | 'OPERATIONS_ADMIN'
  | 'REPORTING_ADMIN';

export interface AdminUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: AdminRole;
  department?: string;
  active: boolean;
  lastLogin?: string;
  createdAt?: string;
}

export type ChallengeStatus = 'NOT_CONFIGURED' | 'OPEN' | 'PAUSED' | 'CLOSED';
export type CompetitionStatus = 'NOT_STARTED' | 'ACTIVE' | 'PAUSED' | 'CLOSED' | 'FINALIZED';

export interface PrizeRankRule {
  rank: number;
  label: string;
  prizeAmountBirr: number;
  prizeCoins?: number;
  prizeType: 'AIRTIME' | 'TELEBIRR_CASH' | 'MERCHANDISE' | 'COINS';
  description: string;
}

export interface Tournament {
  id: string;
  title: string;
  gameId: string;
  gameTitle?: string;
  gameCategory?: string;
  periodLabel?: string;
  startDate: string;
  endDate: string;
  prizePoolEtb: number;
  prizePoolCoins?: number;
  status: CompetitionStatus;
  participantsCount: number;
  totalEntries?: number;
  topScore: number;
  prizeRules?: PrizeRankRule[];
  finalizedAt?: string;
  finalizedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TournamentLeaderboardEntry {
  userId: string;
  displayName: string;
  maskedMsisdn: string;
  fullMsisdn?: string;
  score: number;
  rank: number;
  submittedAt: string;
  prizeAssignedBirr?: number;
  eligibleForPrize?: boolean;
}

export interface DailyChallenge {
  id: string;
  date: string;
  status: ChallengeStatus;
  title: string;
  gameId: string;
  gameTitle?: string;
  startTime: string;
  endTime: string;
  entryFeeCoins: number;
  targetScore: number;
  prizePoolBirr: number;
  prizeRules: PrizeRankRule[];
  eligibilityNotes: string;
  participantsCount: number;
  completedCount: number;
  topScore: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DailyChallengeParticipant {
  id: string;
  challengeId: string;
  playerId: string;
  maskedMsisdn: string;
  displayName: string;
  score: number;
  rank: number;
  completed: boolean;
  eligibleForPrize: boolean;
  prizeAssignedBirr: number;
  submittedAt: string;
}

export interface GameItem {
  gameId: string;
  title: string;
  category: 'ARCADE' | 'SPORTS' | 'PUZZLE' | 'ACTION' | 'STRATEGY' | string;
  provider: string;
  isEnabled: boolean;
  isFree: boolean;
  requiresCoins: boolean;
  entryFeeCoins: number;
  maxScorePerSec: number;
  maxScore: number;
  minDurationSec: number;
  sessionsCount?: number;
  thumbnailUrl?: string;
}

export interface Player {
  id: string;
  userId: string;
  displayName: string;
  msisdn: string;
  maskedMsisdn: string;
  phone?: string;
  accountStatus: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  isBanned: boolean;
  banReason?: string;
  subscriptionStatus: 'ACTIVE' | 'INACTIVE' | 'CANCELLED';
  plan: string;
  coins: number;
  energy: number;
  registeredAt: string;
  lastActivity: string;
  tournamentsEntered?: number;
  totalPrizesWonBirr: number;
  telecomCircle: 'ADDIS_ABABA' | 'OROMIA' | 'AMHARA' | 'TIGRAY' | 'SIDAMA' | 'OTHER';
}

export interface SubscriptionRecord {
  id: string;
  userId: string;
  displayName: string;
  maskedMsisdn: string;
  plan: string;
  status: 'ACTIVE' | 'INACTIVE' | 'CANCELLED';
  isActive: boolean;
  coins: number;
  energy: number;
  activatedAt: string;
  expiresAt: string;
  isBanned: boolean;
  banReason?: string;
}

export interface PaymentOrder {
  id: string;
  method: 'TELEBIRR' | 'AIRTIME';
  amountEtb: number;
  itemType: string;
  itemTitle: string;
  coins: number;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  providerRef: string | null;
  displayName: string;
  maskedMsisdn: string;
  createdAt: string;
  paidAt: string | null;
}

export interface TournamentPayout {
  id: string;
  tournamentId: string;
  tournamentTitle: string;
  rank: number;
  prizeEtb: number;
  prizeCoins: number;
  status: 'SETTLED' | 'PENDING' | 'FAILED';
  telebirrB2cRef: string | null;
  idempotencyKey: string;
  displayName: string;
  maskedMsisdn: string;
  settledAt: string | null;
  createdAt: string;
  errorMessage: string | null;
}

export interface FlaggedSession {
  sessionId: string;
  gameId: string;
  gameTitle: string;
  userId: string;
  displayName: string;
  maskedMsisdn: string;
  isBanned: boolean;
  score: number;
  serverDurationSec: number;
  maxVelocity: number;
  clientTelemetry?: any;
  tournamentId?: string;
  startedAt: string;
  completedAt: string;
}

export interface ServiceSettings {
  serviceName: string;
  shortcode: string;
  subscriptionInstruction: string;
  dailySubscriptionPriceBirr: number;
  dailyChallengeEnabled: boolean;
  weeklyCompetitionEnabled: boolean;
  autoFinalizeWinners: boolean;
  telebirrDisbursementEnabled: boolean;
  antiCheatSensitivity: 'STRICT' | 'STANDARD' | 'LENIENT';
  maxVelocityThreshold: number;
  supportContact: string;
  serviceNoticeBanner: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  adminId: string;
  adminName: string;
  adminRole?: AdminRole;
  action: string;
  entityType: string;
  entityId: string;
  oldValue: any;
  newValue: any;
  ipAddress?: string;
  reason?: string;
}

export interface DashboardStats {
  mode: 'PRODUCTION';
  kpis: {
    activeSubscribers: number;
    totalPlayers: number;
    activeTournaments: number;
    fraudIncidentsBlocked: number;
    portalRevenueEtb: number;
    totalCoinsCirculating: number;
  };
  activeTournament?: Tournament | null;
  dailyChallenge?: DailyChallenge | null;
  recentActivity: AuditLogEntry[];
}
