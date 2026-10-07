import React, { useState, useEffect } from 'react';
import {
  Award,
  Search,
  Plus,
  CheckCircle,
  Clock,
  Shield,
  FileSpreadsheet,
  AlertCircle,
  RefreshCw,
  Coins,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { TournamentPayout, AdminRole } from '../types';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import { ConfirmModal } from '../components/ConfirmModal';

interface PrizesPageProps {
  currentRole: AdminRole;
}

export const PrizesPage: React.FC<PrizesPageProps> = ({ currentRole }) => {
  const [payouts, setPayouts] = useState<TournamentPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Manual override modal
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);
  const [overrideMsisdn, setOverrideMsisdn] = useState('');
  const [overrideAmountEtb, setOverrideAmountEtb] = useState<number>(500);
  const [overrideCoins, setOverrideCoins] = useState<number>(100);
  const [overrideReason, setOverrideReason] = useState('');

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

  const canEdit = currentRole === 'SUPER_ADMIN' || currentRole === 'FINANCIAL_AUDITOR';

  const loadPayouts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getPayouts();
      setPayouts(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load payout settlements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayouts();
  }, []);

  const handleRetryDisbursement = (payout: TournamentPayout) => {
    setConfirmState({
      isOpen: true,
      title: 'Retry Telebirr B2C Payout Disbursement',
      actionName: `Trigger Telebirr B2C disbursement of ${payout.prizeEtb} ETB for ${payout.maskedMsisdn}`,
      currentValue: payout.status,
      newValue: 'SETTLED',
      warningNote: 'Disbursement will be transmitted via Telebirr API with idempotency lock.',
      actionFn: async (reason: string) => {
        await api.retryPayout(payout.id, reason);
        await loadPayouts();
      },
    });
  };

  const handleCreateOverride = async () => {
    if (!overrideMsisdn.trim() || !overrideReason.trim()) {
      alert('Please fill in recipient MSISDN and audit justification.');
      return;
    }
    try {
      await api.createPrizeOverride({
        msisdn: overrideMsisdn.trim(),
        prizeEtb: Number(overrideAmountEtb),
        prizeCoins: Number(overrideCoins),
        reason: overrideReason.trim(),
      });
      setIsOverrideOpen(false);
      setOverrideMsisdn('');
      setOverrideReason('');
      await loadPayouts();
    } catch (err: any) {
      alert(err.message || 'Failed to record manual prize disbursement');
    }
  };

  const filteredPayouts = payouts.filter((p) => {
    const matchesSearch =
      !search ||
      p.displayName.toLowerCase().includes(search.toLowerCase()) ||
      p.maskedMsisdn.includes(search) ||
      (p.telebirrB2cRef && p.telebirrB2cRef.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || p.status.toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  const totalDisbursed = payouts
    .filter((p) => p.status === 'SETTLED')
    .reduce((sum, p) => sum + p.prizeEtb, 0);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Award className="w-5 h-5 text-emerald-600" />
            <span>Prizes & Telebirr B2C Disbursements</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable settlement ledger of national tournament prizes, automated Telebirr B2C transfers, and dispute overrides.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {canEdit && (
            <button
              onClick={() => setIsOverrideOpen(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Special Prize Override</span>
            </button>
          )}
          <button
            onClick={loadPayouts}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
            title="Reload Disbursements"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold uppercase text-slate-400">Total Settled via Telebirr</div>
          <div className="text-xl font-bold text-emerald-700 font-mono mt-1">
            {totalDisbursed.toLocaleString()} ETB
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold uppercase text-slate-400">Disbursed Recipients</div>
          <div className="text-xl font-bold text-slate-900 font-mono mt-1">
            {payouts.filter((p) => p.status === 'SETTLED').length} Winners
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold uppercase text-slate-400">Pending / Retry Required</div>
          <div className="text-xl font-bold text-amber-600 font-mono mt-1">
            {payouts.filter((p) => p.status !== 'SETTLED').length} Payouts
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search MSISDN, player, ref..."
              className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg outline-none w-64 font-mono text-xs text-slate-800"
            />
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {['ALL', 'SETTLED', 'PENDING', 'FAILED'].map((st) => (
              <button
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

        <div className="text-xs text-slate-500 font-mono">
          Showing <strong>{filteredPayouts.length}</strong> disbursements
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Payouts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Tournament Title</th>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Player & Masked Phone</th>
                <th className="py-3 px-4">Prize ETB</th>
                <th className="py-3 px-4">Coins Reward</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Telebirr Ref</th>
                <th className="py-3 px-4">Settled At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading prize disbursement ledger...
                  </td>
                </tr>
              ) : filteredPayouts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No disbursement records found.
                  </td>
                </tr>
              ) : (
                filteredPayouts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {p.tournamentTitle}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">
                      {p.rank === 1 ? '🥇 1st' : p.rank === 2 ? '🥈 2nd' : p.rank === 3 ? '🥉 3rd' : `#${p.rank}`}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{p.displayName}</div>
                      <div className="font-mono text-[10px] text-slate-400">{p.maskedMsisdn}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                      {p.prizeEtb.toLocaleString()} ETB
                    </td>
                    <td className="py-3 px-4 font-mono text-amber-600 font-semibold">
                      +{p.prizeCoins} 🪙
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={p.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-500">
                      {p.telebirrB2cRef || (
                        <span className="text-slate-400 italic">Pending Transfer</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                      {p.settledAt ? new Date(p.settledAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {p.status !== 'SETTLED' && canEdit && (
                        <button
                          onClick={() => handleRetryDisbursement(p)}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          Retry B2C
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

      {/* Special Prize Override Modal */}
      {isOverrideOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Special Prize Override / Recognition
                </h3>
              </div>
              <button
                onClick={() => setIsOverrideOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold uppercase mb-1">
                  Recipient MSISDN (Ethio Telecom)
                </label>
                <input
                  type="text"
                  value={overrideMsisdn}
                  onChange={(e) => setOverrideMsisdn(e.target.value)}
                  placeholder="0911428890"
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold uppercase mb-1">
                  Prize Amount (ETB via Telebirr)
                </label>
                <input
                  type="number"
                  min="0"
                  value={overrideAmountEtb}
                  onChange={(e) => setOverrideAmountEtb(parseInt(e.target.value, 10) || 0)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold uppercase mb-1">
                  GoPlay Bonus Coins
                </label>
                <input
                  type="number"
                  min="0"
                  value={overrideCoins}
                  onChange={(e) => setOverrideCoins(parseInt(e.target.value, 10) || 0)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold uppercase mb-1">
                  Audit Justification Note <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g., Telecom promotional winner / dispute resolution compensation."
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2">
              <button
                onClick={() => setIsOverrideOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOverride}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold cursor-pointer hover:bg-emerald-700 shadow-xs"
              >
                Execute Disbursement
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
