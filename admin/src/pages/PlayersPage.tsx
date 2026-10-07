import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Eye,
  EyeOff,
  Shield,
  RotateCcw,
  CheckCircle,
  AlertOctagon,
  FileSpreadsheet,
  Coins,
  Phone,
  RefreshCw,
  Ban,
  ArrowRight,
} from 'lucide-react';
import { Player, AdminRole } from '../types';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import { ConfirmModal } from '../components/ConfirmModal';

interface PlayersPageProps {
  currentRole: AdminRole;
}

export const PlayersPage: React.FC<PlayersPageProps> = ({ currentRole }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected player for drawer
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Unmasked MSISDN cache
  const [unmaskedMap, setUnmaskedMap] = useState<Record<string, string>>({});

  // Coin Adjustment Modal
  const [isCoinModalOpen, setIsCoinModalOpen] = useState(false);
  const [coinDelta, setCoinDelta] = useState<number>(50);
  const [coinReason, setCoinReason] = useState('');

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

  const canEdit = currentRole === 'SUPER_ADMIN' || currentRole === 'SUPPORT_AGENT' || currentRole === 'OPERATIONS_ADMIN';
  const canUnmask = currentRole === 'SUPER_ADMIN' || currentRole === 'FINANCIAL_AUDITOR';
  const canAdjustCoins = currentRole === 'SUPER_ADMIN' || currentRole === 'FINANCIAL_AUDITOR';

  const loadPlayers = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await api.getPlayers(search, statusFilter);
      setPlayers(list);
    } catch (err: any) {
      setError(err.message || 'Failed to load player directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadPlayers();
  };

  const handleUnmask = async (player: Player) => {
    if (!canUnmask) {
      alert('Only Super Admin or Financial Auditor is authorized to view unmasked subscriber MSISDNs.');
      return;
    }

    const reason = prompt('Auditor Compliance Check: Enter operational reason to access raw MSISDN:');
    if (!reason || reason.trim().length < 4) {
      alert('A valid reason (minimum 4 characters) is required for compliance logging.');
      return;
    }

    try {
      const rawPhone = await api.unmaskSubscriberPhone(player.id, reason);
      setUnmaskedMap((prev) => ({ ...prev, [player.id]: rawPhone }));
    } catch (err: any) {
      alert(err.message || 'Failed to unmask MSISDN');
    }
  };

  const handleToggleBan = (player: Player) => {
    if (!canEdit) {
      alert('Your role does not allow banning accounts.');
      return;
    }

    const nextBan = !player.isBanned;
    setConfirmState({
      isOpen: true,
      title: nextBan ? 'Ban Subscriber Account' : 'Revoke Account Ban',
      actionName: `${nextBan ? 'Suspend' : 'Reinstate'} player ${player.maskedMsisdn}`,
      currentValue: player.isBanned ? 'BANNED' : 'ACTIVE',
      newValue: nextBan ? 'BANNED' : 'ACTIVE',
      danger: nextBan,
      warningNote: nextBan
        ? 'Banning this player will immediately terminate all active game sessions in Redis and block future tournament submissions.'
        : undefined,
      actionFn: async (reason: string) => {
        await api.togglePlayerBan(player.id, nextBan, reason);
        await loadPlayers();
      },
    });
  };

  const handleAdjustCoinsSubmit = async () => {
    if (!selectedPlayer || !coinReason.trim()) {
      alert('Please enter a valid operational reason.');
      return;
    }

    try {
      await api.adjustPlayerCoins(selectedPlayer.id, Number(coinDelta), coinReason.trim());
      setIsCoinModalOpen(false);
      setCoinReason('');
      await loadPlayers();
      if (selectedPlayer) {
        setSelectedPlayer((prev) => prev ? { ...prev, coins: prev.coins + Number(coinDelta) } : null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to adjust coins');
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Users className="w-5 h-5 text-sky-600" />
            <span>Ethio Telecom Players & Subscribers Directory</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Subscriber directory with strict MSISDN masking, automated fraud bans, and coin balance adjustments.
          </p>
        </div>

        <button
          onClick={loadPlayers}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
          title="Reload Players"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <form onSubmit={handleSearchSubmit} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search phone or username..."
              className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg outline-none w-64 font-mono text-xs text-slate-800"
            />
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {['ALL', 'ACTIVE', 'INACTIVE', 'BANNED'].map((st) => (
              <button
                type="button"
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
        >
          Apply Filter
        </button>
      </form>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Players Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Gamer Profile</th>
                <th className="py-3 px-4">Ethio Telecom MSISDN</th>
                <th className="py-3 px-4">Shortcode 9898 Plan</th>
                <th className="py-3 px-4">GoPlay Coins</th>
                <th className="py-3 px-4">Energy</th>
                <th className="py-3 px-4">Account State</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading player directory...
                  </td>
                </tr>
              ) : players.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No players matching the selected query.
                  </td>
                </tr>
              ) : (
                players.map((p) => {
                  const unmasked = unmaskedMap[p.id];
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setSelectedPlayer(p)}
                          className="font-bold text-blue-700 hover:underline text-left cursor-pointer"
                        >
                          {p.displayName || 'Telebirr Player'}
                        </button>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ID: {p.id.substring(0, 8)}...
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <div className="flex items-center space-x-1.5">
                          <span className={unmasked ? 'text-emerald-700 font-bold' : 'text-slate-800'}>
                            {unmasked || p.maskedMsisdn}
                          </span>
                          {canUnmask && !unmasked && (
                            <button
                              onClick={() => handleUnmask(p)}
                              title="Audit Unmask Phone"
                              className="text-slate-400 hover:text-blue-600 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 uppercase text-[11px]">
                          {p.plan || 'Daily 2 ETB'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-700">
                        {p.coins.toLocaleString()} 🪙
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        ⚡ {p.energy ?? 100}
                      </td>
                      <td className="py-3 px-4">
                        <Badge status={p.isBanned ? 'BANNED' : p.accountStatus} size="sm" />
                      </td>
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                        {p.lastActivity ? new Date(p.lastActivity).toLocaleDateString() : 'Today'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {canAdjustCoins && (
                            <button
                              onClick={() => {
                                setSelectedPlayer(p);
                                setIsCoinModalOpen(true);
                              }}
                              title="Adjust Coins"
                              className="p-1.5 text-amber-600 hover:bg-amber-50 border border-slate-200 rounded-lg cursor-pointer"
                            >
                              <Coins className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canEdit && (
                            <button
                              onClick={() => handleToggleBan(p)}
                              title={p.isBanned ? 'Revoke Ban' : 'Ban Account'}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                p.isBanned
                                  ? 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                                  : 'text-rose-600 border-rose-200 hover:bg-rose-50'
                              }`}
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Coins Modal */}
      {isCoinModalOpen && selectedPlayer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Coins className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Adjust Coins: {selectedPlayer.displayName}
                </h3>
              </div>
              <button
                onClick={() => setIsCoinModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono">
                Current Balance: <strong>{selectedPlayer.coins.toLocaleString()} Coins</strong>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold uppercase mb-1">
                  Coin Adjustment Delta (+ or -)
                </label>
                <input
                  type="number"
                  value={coinDelta}
                  onChange={(e) => setCoinDelta(parseInt(e.target.value, 10) || 0)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono text-sm"
                />
                <span className="text-[11px] text-slate-400">e.g. +100 for tournament topup or -50 for dispute rollback.</span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold uppercase mb-1">
                  Audit Justification Reason <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={coinReason}
                  onChange={(e) => setCoinReason(e.target.value)}
                  placeholder="e.g. Compensation for tournament disconnection on shortcode 9898."
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2">
              <button
                onClick={() => setIsCoinModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjustCoinsSubmit}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-semibold cursor-pointer hover:bg-amber-700"
              >
                Confirm Balance Adjustment
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
