import React from 'react';
import {
  Users,
  Trophy,
  Award,
  Calendar,
  AlertCircle,
  Clock,
  ArrowRight,
  Shield,
  FileSpreadsheet,
  Coins,
  DollarSign,
  Gamepad2,
  PhoneCall,
  Activity,
} from 'lucide-react';
import { DashboardStats } from '../types';
import { Badge } from '../components/Badge';
import { NavPage } from '../components/Sidebar';

interface DashboardPageProps {
  stats: DashboardStats | null;
  onNavigate: (page: NavPage) => void;
  onRefresh: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ stats, onNavigate, onRefresh }) => {
  if (!stats) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-3 text-slate-500 text-sm">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading GoPlay / GameON Tele operational status...</span>
        </div>
      </div>
    );
  }

  const { kpis, activeTournament, dailyChallenge, recentActivity, mode } = stats;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Critical KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Active Subscribers */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Subscribers</span>
            <PhoneCall className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {kpis.activeSubscribers.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Shortcode 9898 (2 ETB/day)
          </div>
        </div>

        {/* Total Players */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Players</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {kpis.totalPlayers.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Registered telebirr gamers
          </div>
        </div>

        {/* Active Tournaments */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tournaments</span>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {kpis.activeTournaments.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Active prize competitions
          </div>
        </div>

        {/* Fraud Blocked */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Fraud Blocked</span>
            <Shield className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {kpis.fraudIncidentsBlocked.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Velocity telemetry flags
          </div>
        </div>

        {/* Portal Revenue */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Revenue (ETB)</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {kpis.portalRevenueEtb.toLocaleString()} ETB
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Telebirr C2B collected
          </div>
        </div>

        {/* Coins Circulating */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">GoPlay Coins</span>
            <Coins className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {kpis.totalCoinsCirculating.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Circulating in player wallets
          </div>
        </div>
      </div>

      {/* Main Focus: Live Tournament & Daily Challenge Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Tournament Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Active Tournament
                  </h3>
                  <div className="text-xs text-slate-500">
                    National Gaming Championship
                  </div>
                </div>
              </div>
              <Badge status={activeTournament?.status || 'ACTIVE'} size="md" />
            </div>

            {activeTournament ? (
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
                  <div className="font-bold text-slate-900 text-sm">
                    {activeTournament.title}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center space-x-2">
                    <span className="font-medium text-slate-700">{activeTournament.gameTitle || 'Neon Dunk'}</span>
                    <span>•</span>
                    <span>Prize Pool: <strong className="text-emerald-700">{activeTournament.prizePoolEtb.toLocaleString()} ETB</strong></span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="text-[11px] text-slate-500 uppercase font-semibold">Entries</div>
                    <div className="text-lg font-bold text-slate-900 mt-0.5">
                      {activeTournament.participantsCount.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="text-[11px] text-slate-500 uppercase font-semibold">Top Score</div>
                    <div className="text-lg font-bold text-emerald-700 mt-0.5">
                      {activeTournament.topScore.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="text-[11px] text-slate-500 uppercase font-semibold">Settlement</div>
                    <div className="text-xs font-semibold text-slate-700 mt-1 truncate">
                      Telebirr B2C
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No active tournament configured currently.
              </div>
            )}
          </div>

          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-mono">
              Auto-finalization: Enabled
            </span>
            <button
              onClick={() => onNavigate('TOURNAMENTS')}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center space-x-1 cursor-pointer"
            >
              <span>Manage Tournaments & Leaderboards</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Daily Challenges Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Daily Challenge
                  </h3>
                  <div className="text-xs text-slate-500">
                    Daily Rapid High-Score Challenge
                  </div>
                </div>
              </div>
              <Badge status={dailyChallenge?.status || 'OPEN'} size="md" />
            </div>

            {dailyChallenge ? (
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
                  <div className="font-bold text-slate-900 text-sm">
                    {dailyChallenge.title}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center space-x-2">
                    <span>Target Score: <strong className="text-slate-800">{dailyChallenge.targetScore} pts</strong></span>
                    <span>•</span>
                    <span>Entry Fee: <strong className="text-amber-600">{dailyChallenge.entryFeeCoins} Coins</strong></span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="text-[11px] text-slate-500 uppercase font-semibold">Players</div>
                    <div className="text-lg font-bold text-slate-900 mt-0.5">
                      {dailyChallenge.participantsCount.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="text-[11px] text-slate-500 uppercase font-semibold">Completed</div>
                    <div className="text-lg font-bold text-blue-700 mt-0.5">
                      {dailyChallenge.completedCount.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="text-[11px] text-slate-500 uppercase font-semibold">Prize Pool</div>
                    <div className="text-lg font-bold text-emerald-700 mt-0.5">
                      {dailyChallenge.prizePoolBirr} ETB
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No daily challenge active today.
              </div>
            )}
          </div>

          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-mono">
              Shortcode 9898 Subscribers Only
            </span>
            <button
              onClick={() => onNavigate('DAILY_CHALLENGES')}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center space-x-1 cursor-pointer"
            >
              <span>Configure Daily Challenges</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Operational Action Triggers */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Quick Operational Triggers
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => onNavigate('GAMES_CATALOG')}
            className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-xs transition-all text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Gamepad2 className="w-4 h-4" />
            </div>
            <div className="font-semibold text-sm text-slate-900">Manage Games Catalog</div>
            <div className="text-xs text-slate-500 mt-0.5">Toggle titles, anti-cheat & coin entry fees</div>
          </button>

          <button
            onClick={() => onNavigate('ANTI_CHEAT')}
            className="p-4 bg-white border border-slate-200 rounded-xl hover:border-rose-400 hover:shadow-xs transition-all text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Shield className="w-4 h-4" />
            </div>
            <div className="font-semibold text-sm text-slate-900">Inspect Anti-Cheat Telemetry</div>
            <div className="text-xs text-slate-500 mt-0.5">Review velocity spikes & invalidate sessions</div>
          </button>

          <button
            onClick={() => onNavigate('PRIZES_WINNERS')}
            className="p-4 bg-white border border-slate-200 rounded-xl hover:border-emerald-400 hover:shadow-xs transition-all text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Award className="w-4 h-4" />
            </div>
            <div className="font-semibold text-sm text-slate-900">Telebirr Payout Settlements</div>
            <div className="text-xs text-slate-500 mt-0.5">Audit B2C payouts & retry disbursements</div>
          </button>

          <button
            onClick={() => onNavigate('PLAYERS')}
            className="p-4 bg-white border border-slate-200 rounded-xl hover:border-sky-400 hover:shadow-xs transition-all text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
            <div className="font-semibold text-sm text-slate-900">Player & Subscriber Ledger</div>
            <div className="text-xs text-slate-500 mt-0.5">Search MSISDNs, coin adjustments & bans</div>
          </button>
        </div>
      </div>

      {/* Recent Activity / Audit Log Preview */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Recent Administrative Audit Trail
            </h3>
          </div>
          <button
            onClick={() => onNavigate('AUDIT_LOG')}
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center space-x-1 cursor-pointer"
          >
            <span>View Full Immutable Audit Log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {recentActivity && recentActivity.length > 0 ? (
            recentActivity.slice(0, 5).map((act) => (
              <div key={act.id} className="px-6 py-3 flex items-center justify-between text-xs hover:bg-slate-50/50">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <div>
                    <span className="font-semibold text-slate-800">{act.adminName}</span>
                    <span className="text-slate-400 mx-1.5">•</span>
                    <span className="font-mono text-slate-600">{act.action}</span>
                    {act.reason && (
                      <span className="text-slate-500 ml-2 italic">"{act.reason}"</span>
                    )}
                  </div>
                </div>
                <div className="text-slate-400 font-mono text-[11px]">
                  {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-xs text-slate-400">
              No recent administrative actions recorded in current session.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
