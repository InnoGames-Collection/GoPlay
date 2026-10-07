import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  Play,
  Pause,
  StopCircle,
  Settings2,
  Award,
  Users,
  Trophy,
  CheckCircle2,
  AlertCircle,
  Edit,
  Coins,
  RefreshCw,
} from 'lucide-react';
import { DailyChallenge, DailyChallengeParticipant, PrizeRankRule, AdminRole } from '../types';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import { ConfirmModal } from '../components/ConfirmModal';

interface DailyChallengePageProps {
  currentRole: AdminRole;
}

export const DailyChallengePage: React.FC<DailyChallengePageProps> = ({ currentRole }) => {
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<DailyChallenge | null>(null);
  const [participants, setParticipants] = useState<DailyChallengeParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit / Config Modal state
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formTitle, setFormTitle] = useState('Daily Rapid High-Score Challenge');
  const [formGameId, setFormGameId] = useState('neon-dunk');
  const [formEntryFeeCoins, setFormEntryFeeCoins] = useState(10);
  const [formTargetScore, setFormTargetScore] = useState(2500);
  const [formPrizePoolBirr, setFormPrizePoolBirr] = useState(500);

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

  const loadChallenges = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await api.getDailyChallenges();
      setChallenges(list);
      if (list.length > 0) {
        const target = selectedChallenge ? list.find((c) => c.id === selectedChallenge.id) || list[0] : list[0];
        setSelectedChallenge(target);
        const details = await api.getDailyChallengeDetails(target.id);
        setParticipants(details.participants || []);
      } else {
        setSelectedChallenge(null);
        setParticipants([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load daily challenges');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChallenges();
  }, []);

  const handleSelectChallenge = async (ch: DailyChallenge) => {
    setSelectedChallenge(ch);
    try {
      const details = await api.getDailyChallengeDetails(ch.id);
      setParticipants(details.participants || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load participants');
    }
  };

  const handleToggleStatus = (targetStatus: DailyChallenge['status']) => {
    if (!selectedChallenge || !canEdit) return;

    setConfirmState({
      isOpen: true,
      title: 'Update Daily Challenge Operational Status',
      actionName: `Set status of "${selectedChallenge.title}" to ${targetStatus}`,
      currentValue: selectedChallenge.status,
      newValue: targetStatus,
      danger: targetStatus === 'CLOSED',
      warningNote:
        targetStatus === 'CLOSED'
          ? 'Closing the challenge freezes player submissions and moves scores to final review.'
          : undefined,
      actionFn: async (reason: string) => {
        await api.updateDailyChallengeStatus(selectedChallenge.id, targetStatus, reason);
        await loadChallenges();
      },
    });
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            <span>Daily Challenges & Rapid Tournaments</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure daily rapid high-score competitions, target score hurdles, coin entry fees, and subscriber prize eligibility.
          </p>
        </div>

        <button
          onClick={loadChallenges}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 self-start sm:self-auto cursor-pointer"
          title="Reload Challenges"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Main Grid: Challenge Selector (Left) & Active Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Challenges List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Daily Challenge Schedule</span>
            <span className="font-mono text-slate-400">({challenges.length})</span>
          </div>

          <div className="space-y-3">
            {challenges.map((ch) => {
              const isSelected = selectedChallenge?.id === ch.id;
              return (
                <div
                  key={ch.id}
                  onClick={() => handleSelectChallenge(ch)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/50 border-blue-500 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-sm text-slate-900">{ch.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center space-x-2">
                        <span className="font-medium text-slate-700">{ch.gameTitle || 'Neon Dunk'}</span>
                        <span>•</span>
                        <span className="font-mono">{ch.date}</span>
                      </div>
                    </div>
                    <Badge status={ch.status} size="sm" />
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Entry Fee</div>
                      <div className="font-bold text-amber-600 font-mono mt-0.5">
                        {ch.entryFeeCoins} Coins
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Target Score</div>
                      <div className="font-bold text-slate-800 font-mono mt-0.5">
                        {ch.targetScore?.toLocaleString() || '1,000'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Prize Pool</div>
                      <div className="font-bold text-emerald-700 font-mono mt-0.5">
                        {ch.prizePoolBirr} ETB
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Challenge Details & Participants */}
        <div className="lg:col-span-7 space-y-4">
          {selectedChallenge ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Header & Controls */}
              <div className="p-6 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-base text-slate-900">
                      {selectedChallenge.title}
                    </h3>
                    <Badge status={selectedChallenge.status} size="sm" />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Date: <strong className="font-mono text-slate-800">{selectedChallenge.date}</strong> • Target: <strong className="text-slate-800">{selectedChallenge.targetScore} pts</strong> • Prize Pool: <strong className="text-emerald-700">{selectedChallenge.prizePoolBirr} ETB</strong>
                  </div>
                </div>

                {canEdit && (
                  <div className="flex items-center space-x-2">
                    {selectedChallenge.status !== 'OPEN' && (
                      <button
                        onClick={() => handleToggleStatus('OPEN')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Open Challenge</span>
                      </button>
                    )}
                    {selectedChallenge.status === 'OPEN' && (
                      <button
                        onClick={() => handleToggleStatus('PAUSED')}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause</span>
                      </button>
                    )}
                    {selectedChallenge.status !== 'CLOSED' && (
                      <button
                        onClick={() => handleToggleStatus('CLOSED')}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer"
                      >
                        <StopCircle className="w-3.5 h-3.5" />
                        <span>Close</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Participants Leaderboard */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-3 text-xs">
                  <div className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                    Today's Contenders
                  </div>
                  <span className="text-slate-400 font-mono">
                    {participants.length} participants
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-3">Rank</th>
                        <th className="py-2.5 px-3">Player / MSISDN</th>
                        <th className="py-2.5 px-3">Score</th>
                        <th className="py-2.5 px-3">Completed Target</th>
                        <th className="py-2.5 px-3">Prize (ETB)</th>
                        <th className="py-2.5 px-3">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {participants.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            No contenders recorded for this daily challenge yet.
                          </td>
                        </tr>
                      ) : (
                        participants.map((p) => (
                          <tr key={p.playerId} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 font-mono font-bold">
                              #{p.rank}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-slate-900">{p.displayName}</div>
                              <div className="font-mono text-[10px] text-slate-400">{p.maskedMsisdn}</div>
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                              {p.score.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3">
                              <Badge status={p.completed ? 'QUALIFIED' : 'ACTIVE'} size="sm" />
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                              {p.prizeAssignedBirr ? `${p.prizeAssignedBirr} ETB` : '-'}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400">
                              {p.submittedAt ? new Date(p.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
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
              Select a daily challenge to inspect live participants and prize rules.
            </div>
          )}
        </div>
      </div>

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
