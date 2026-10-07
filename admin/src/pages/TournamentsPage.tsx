import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Play,
  Pause,
  StopCircle,
  Award,
  CheckCircle,
  Lock,
  Edit3,
  AlertTriangle,
  Eye,
  Settings2,
  RefreshCw,
  Plus,
  Coins,
} from 'lucide-react';
import { Tournament, TournamentLeaderboardEntry, PrizeRankRule, AdminRole } from '../types';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import { ConfirmModal } from '../components/ConfirmModal';

interface TournamentsPageProps {
  currentRole: AdminRole;
}

export const TournamentsPage: React.FC<TournamentsPageProps> = ({ currentRole }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTourn, setSelectedTourn] = useState<Tournament | null>(null);
  const [leaderboard, setLeaderboard] = useState<TournamentLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Score override modal
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideTarget, setOverrideTarget] = useState<TournamentLeaderboardEntry | null>(null);
  const [overrideScore, setOverrideScore] = useState<number>(0);
  const [overrideReason, setOverrideReason] = useState('');

  // Confirmation modal state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    actionName: string;
    currentValue?: string;
    newValue?: string;
    warningNote?: string;
    danger?: boolean;
    actionFn: (reason: string) => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    actionName: '',
    actionFn: async () => {},
  });

  const canEdit = currentRole === 'SUPER_ADMIN' || currentRole === 'TOURNAMENT_OPERATOR' || currentRole === 'OPERATIONS_ADMIN';
  const isSuperAdmin = currentRole === 'SUPER_ADMIN';

  const loadTournaments = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await api.getTournaments();
      setTournaments(list);
      if (list.length > 0) {
        const target = selectedTourn ? list.find((t) => t.id === selectedTourn.id) || list[0] : list[0];
        setSelectedTourn(target);
        const lb = await api.getTournamentLeaderboard(target.id);
        setLeaderboard(lb);
      } else {
        setSelectedTourn(null);
        setLeaderboard([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTournaments();
  }, []);

  const handleSelectTournament = async (t: Tournament) => {
    setSelectedTourn(t);
    try {
      const lb = await api.getTournamentLeaderboard(t.id);
      setLeaderboard(lb);
    } catch (err: any) {
      setError(err.message || 'Failed to load tournament leaderboard');
    }
  };

  const handleFinalize = (t: Tournament) => {
    if (!canEdit) {
      alert('Your role does not permit finalizing tournaments.');
      return;
    }

    setConfirmState({
      isOpen: true,
      title: 'Finalize Tournament & Execute Prize Settlements',
      actionName: `Finalize "${t.title}" and disburse ${t.prizePoolEtb.toLocaleString()} ETB via Telebirr B2C`,
      currentValue: t.status,
      newValue: 'FINALIZED',
      danger: true,
      warningNote:
        'This action is irreversible. It initiates automated Telebirr B2C prize distribution to top leaderboard winners, locks scores, and records compliance entries in the immutable ledger.',
      actionFn: async (reason: string) => {
        const res = await api.finalizeTournament(t.id, reason);
        alert(res.message || 'Tournament settled successfully!');
        await loadTournaments();
      },
    });
  };

  const handleOpenOverride = (entry: TournamentLeaderboardEntry) => {
    if (!canEdit) {
      alert('Only authorized operators may override scores.');
      return;
    }
    setOverrideTarget(entry);
    setOverrideScore(entry.score);
    setOverrideReason('');
    setIsOverrideModalOpen(true);
  };

  const handleSaveOverride = async () => {
    if (!selectedTourn || !overrideTarget) return;
    if (!overrideReason.trim() || overrideReason.trim().length < 4) {
      alert('An operational reason is required for score overrides.');
      return;
    }

    try {
      await api.overrideTournamentScore(selectedTourn.id, overrideTarget.userId, Number(overrideScore), overrideReason);
      setIsOverrideModalOpen(false);
      const lb = await api.getTournamentLeaderboard(selectedTourn.id);
      setLeaderboard(lb);
    } catch (err: any) {
      alert(err.message || 'Failed to override score');
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span>Tournaments & Competitions Control Plane</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage weekly championships, review verified player leaderboards, and execute automated Telebirr B2C prize settlements.
          </p>
        </div>

        <button
          onClick={loadTournaments}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 self-start sm:self-auto cursor-pointer"
          title="Reload Tournaments"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Main Grid: Tournaments List (Left) & Active Leaderboard (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tournaments selector */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Championship Events</span>
            <span className="font-mono text-slate-400">({tournaments.length})</span>
          </div>

          <div className="space-y-3">
            {tournaments.map((t) => {
              const isSelected = selectedTourn?.id === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => handleSelectTournament(t)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/50 border-blue-500 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-sm text-slate-900">{t.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center space-x-1.5">
                        <span className="font-medium text-slate-700">{t.gameTitle || 'GoPlay Game'}</span>
                        <span>•</span>
                        <span className="font-mono">{t.startDate ? new Date(t.startDate).toLocaleDateString() : 'Active'}</span>
                      </div>
                    </div>
                    <Badge status={t.status} size="sm" />
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Prize Pool</div>
                      <div className="font-bold text-emerald-700 font-mono mt-0.5">
                        {t.prizePoolEtb.toLocaleString()} ETB
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Entries</div>
                      <div className="font-bold text-slate-800 font-mono mt-0.5">
                        {t.participantsCount?.toLocaleString() || '0'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Top Score</div>
                      <div className="font-bold text-amber-600 font-mono mt-0.5">
                        {t.topScore?.toLocaleString() || '0'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Leaderboard Inspector & Settlement Actions */}
        <div className="lg:col-span-7 space-y-4">
          {selectedTourn ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Header & Controls */}
              <div className="p-6 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-base text-slate-900">
                      {selectedTourn.title}
                    </h3>
                    <Badge status={selectedTourn.status} size="sm" />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Featured Game: <strong className="text-slate-800">{selectedTourn.gameTitle || 'Neon Dunk'}</strong> • Prize Pool: <strong className="text-emerald-700">{selectedTourn.prizePoolEtb.toLocaleString()} ETB</strong>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {selectedTourn.status === 'ACTIVE' && canEdit && (
                    <button
                      onClick={() => handleFinalize(selectedTourn)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-xs cursor-pointer"
                    >
                      <Award className="w-4 h-4" />
                      <span>Finalize & Disburse</span>
                    </button>
                  )}
                  {selectedTourn.status === 'FINALIZED' && (
                    <span className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold font-mono">
                      Settled via Telebirr
                    </span>
                  )}
                </div>
              </div>

              {/* Leaderboard Table */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-3 text-xs">
                  <div className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                    Verified Leaderboard Standings
                  </div>
                  <span className="text-slate-400 font-mono">
                    {leaderboard.length} ranked contenders
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-3">Rank</th>
                        <th className="py-2.5 px-3">Player / MSISDN</th>
                        <th className="py-2.5 px-3">Verified Score</th>
                        <th className="py-2.5 px-3">Projected Prize</th>
                        <th className="py-2.5 px-3">Timestamp</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {leaderboard.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            No tournament entries recorded yet.
                          </td>
                        </tr>
                      ) : (
                        leaderboard.map((entry) => (
                          <tr key={entry.userId} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 font-mono font-bold">
                              {entry.rank === 1 ? '🥇 1' : entry.rank === 2 ? '🥈 2' : entry.rank === 3 ? '🥉 3' : `#${entry.rank}`}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-slate-900">{entry.displayName || 'Gamer'}</div>
                              <div className="font-mono text-[10px] text-slate-400">{entry.maskedMsisdn}</div>
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                              {entry.score.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-emerald-700 font-bold">
                              {entry.prizeAssignedBirr ? `${entry.prizeAssignedBirr.toLocaleString()} ETB` : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-400 font-mono text-[10px]">
                              {entry.submittedAt ? new Date(entry.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {canEdit && (
                                <button
                                  onClick={() => handleOpenOverride(entry)}
                                  title="Manual Score Override"
                                  className="p-1 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
              Select a tournament from the left panel to inspect leaderboards and finalize prizes.
            </div>
          )}
        </div>
      </div>

      {/* Override Score Modal */}
      {isOverrideModalOpen && overrideTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Manual Leaderboard Score Override
                </h3>
              </div>
              <button
                onClick={() => setIsOverrideModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono space-y-1">
                <div>Player: <strong>{overrideTarget.displayName}</strong></div>
                <div>MSISDN: <strong>{overrideTarget.maskedMsisdn}</strong></div>
                <div>Current Score: <strong>{overrideTarget.score.toLocaleString()}</strong></div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold uppercase mb-1">
                  Adjusted Score
                </label>
                <input
                  type="number"
                  value={overrideScore}
                  onChange={(e) => setOverrideScore(parseInt(e.target.value, 10) || 0)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold uppercase mb-1">
                  Justification / Operational Note <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g., Validated network timeout during final round; adjusted score per audit log."
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2">
              <button
                onClick={() => setIsOverrideModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOverride}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold cursor-pointer hover:bg-blue-700"
              >
                Confirm Score Override
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmState.actionFn}
        title={confirmState.title}
        actionName={confirmState.actionName}
        currentValue={confirmState.currentValue}
        newValue={confirmState.newValue}
        warningNote={confirmState.warningNote}
        danger={confirmState.danger}
      />
    </div>
  );
};
