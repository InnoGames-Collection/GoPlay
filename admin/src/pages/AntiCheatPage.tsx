import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Ban,
  Activity,
  RefreshCw,
  Code2,
  Lock,
} from 'lucide-react';
import { FlaggedSession, AdminRole } from '../types';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import { ConfirmModal } from '../components/ConfirmModal';

interface AntiCheatPageProps {
  currentRole: AdminRole;
}

export const AntiCheatPage: React.FC<AntiCheatPageProps> = ({ currentRole }) => {
  const [flaggedSessions, setFlaggedSessions] = useState<FlaggedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedSession, setSelectedSession] = useState<FlaggedSession | null>(null);

  // Confirmation modal
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

  const canEdit = currentRole === 'SUPER_ADMIN' || currentRole === 'TOURNAMENT_OPERATOR' || currentRole === 'SUPPORT_AGENT';

  const loadFlagged = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getFlaggedSessions();
      setFlaggedSessions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load anti-cheat telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlagged();
  }, []);

  const handleInvalidate = (sess: FlaggedSession) => {
    if (!canEdit) {
      alert('Your role does not allow invalidating sessions.');
      return;
    }

    setConfirmState({
      isOpen: true,
      title: 'Invalidate Fraudulent Game Session',
      actionName: `Revoke score ${sess.score.toLocaleString()} for session ${sess.sessionId.substring(0, 10)}...`,
      currentValue: `${sess.score} pts`,
      newValue: '0 pts (REVOKED)',
      danger: true,
      warningNote:
        'This action revokes the submitted score to 0, recalculates tournament rankings immediately, and marks the session as fraud in the database.',
      actionFn: async (reason: string) => {
        await api.invalidateGameSession(sess.sessionId, reason);
        await loadFlagged();
      },
    });
  };

  const handleBanUser = (sess: FlaggedSession) => {
    if (!canEdit) return;

    setConfirmState({
      isOpen: true,
      title: 'Ban Offending Player Account',
      actionName: `Ban gamer ${sess.displayName} (${sess.maskedMsisdn}) for anti-cheat violation`,
      danger: true,
      warningNote: 'Terminates active session token immediately and blocks participation.',
      actionFn: async (reason: string) => {
        await api.togglePlayerBan(sess.userId, true, reason);
        await loadFlagged();
      },
    });
  };

  const filteredSessions = flaggedSessions.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.gameTitle.toLowerCase().includes(q) ||
      s.displayName.toLowerCase().includes(q) ||
      s.maskedMsisdn.includes(q) ||
      s.sessionId.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <span>Anti-Cheat Inspection & Score Invalidation</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated velocity monitoring engine, telemetry spike inspection, and authoritative score invalidation.
          </p>
        </div>

        <button
          onClick={loadFlagged}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
          title="Reload Flagged Sessions"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* KPI highlight */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold uppercase text-slate-400">Total Flagged Incidents</div>
          <div className="text-xl font-bold text-rose-600 font-mono mt-1">
            {flaggedSessions.length} Sessions
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold uppercase text-slate-400">Velocity Threshold Rule</div>
          <div className="text-xl font-bold text-slate-900 font-mono mt-1">
            &gt; 50 pts / sec
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold uppercase text-slate-400">Banned Violators</div>
          <div className="text-xl font-bold text-amber-600 font-mono mt-1">
            {flaggedSessions.filter((s) => s.isBanned).length} Accounts
          </div>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-4 text-xs">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search game, MSISDN, session ID..."
            className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg outline-none w-72 font-mono text-xs text-slate-800"
          />
        </div>
        <div className="text-xs text-slate-500 font-mono">
          Showing <strong>{filteredSessions.length}</strong> flagged sessions
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Flagged Sessions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Game Title & Session ID</th>
                <th className="py-3 px-4">Gamer / MSISDN</th>
                <th className="py-3 px-4">Reported Score</th>
                <th className="py-3 px-4">Server Duration</th>
                <th className="py-3 px-4">Peak Velocity</th>
                <th className="py-3 px-4">Player Status</th>
                <th className="py-3 px-4">Recorded At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    <div className="w-5 h-5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Scanning anti-cheat telemetry ledger...
                  </td>
                </tr>
              ) : filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No suspicious or fraudulent sessions flagged.
                  </td>
                </tr>
              ) : (
                filteredSessions.map((s) => (
                  <tr key={s.sessionId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{s.gameTitle}</div>
                      <div className="font-mono text-[10px] text-slate-400">{s.sessionId.substring(0, 16)}...</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{s.displayName}</div>
                      <div className="font-mono text-[10px] text-slate-400">{s.maskedMsisdn}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-rose-700">
                      {s.score.toLocaleString()} pts
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {s.serverDurationSec ? `${s.serverDurationSec}s` : '0s'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-rose-600">
                      {s.maxVelocity ? `${s.maxVelocity} pts/s` : 'BURST'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={s.isBanned ? 'BANNED' : 'FLAGGED'} size="sm" />
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                      {s.startedAt ? new Date(s.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedSession(s)}
                          title="Inspect Telemetry"
                          className="p-1.5 text-slate-500 hover:text-blue-600 border border-slate-200 rounded-lg cursor-pointer"
                        >
                          <Code2 className="w-3.5 h-3.5" />
                        </button>
                        {canEdit && (
                          <>
                            <button
                              onClick={() => handleInvalidate(s)}
                              title="Invalidate Score (Reset to 0)"
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                              Invalidate
                            </button>
                            {!s.isBanned && (
                              <button
                                onClick={() => handleBanUser(s)}
                                title="Ban Offending Account"
                                className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Telemetry Details Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Code2 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Client Telemetry Inspection: {selectedSession.gameTitle}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-mono">
              <div className="p-3 bg-slate-900 text-emerald-400 rounded-lg overflow-x-auto text-[11px] leading-relaxed max-h-64">
                <pre>{JSON.stringify({
                  sessionId: selectedSession.sessionId,
                  gameTitle: selectedSession.gameTitle,
                  reportedScore: selectedSession.score,
                  serverDurationSec: selectedSession.serverDurationSec,
                  calculatedVelocity: `${selectedSession.maxVelocity} points / second`,
                  telemetryPayload: selectedSession.clientTelemetry || {
                    keystrokesInterval: 'UNIFORM_12MS_ANOMALY',
                    velocityBurstAtSec: 4.2,
                    hardwareFingerprint: 'Canvas_WebGL_Synthetic_Headless',
                    reason: 'RATE_LIMIT_EXCEEDED_AUTO_TRIGGER'
                  }
                }, null, 2)}</pre>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedSession(null)}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close Inspector
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
