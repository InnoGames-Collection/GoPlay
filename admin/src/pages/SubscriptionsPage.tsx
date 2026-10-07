import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  Search,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  Radio,
  RefreshCw,
  CreditCard,
  DollarSign,
  Coins,
} from 'lucide-react';
import { SubscriptionRecord, PaymentOrder, AdminRole } from '../types';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import { ConfirmModal } from '../components/ConfirmModal';

interface SubscriptionsPageProps {
  currentRole: AdminRole;
}

export const SubscriptionsPage: React.FC<SubscriptionsPageProps> = ({ currentRole }) => {
  const [activeTab, setActiveTab] = useState<'SUBSCRIPTIONS' | 'TRANSACTIONS'>('SUBSCRIPTIONS');
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [transactions, setTransactions] = useState<PaymentOrder[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canEdit = currentRole === 'SUPER_ADMIN' || currentRole === 'SUPPORT_AGENT' || currentRole === 'OPERATIONS_ADMIN';

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (activeTab === 'SUBSCRIPTIONS') {
        const subs = await api.getSubscriptions(search, statusFilter);
        setSubscriptions(subs);
      } else {
        const txs = await api.getTransactions();
        setTransactions(txs);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load billing ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <PhoneCall className="w-5 h-5 text-emerald-600" />
            <span>Ethio Telecom Subscriptions & Telebirr Billing (Shortcode 9898)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational monitoring and administration of recurring 2 Birr / day subscriber billing states and instant coin purchases.
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
          title="Reload Billing Ledger"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('SUBSCRIPTIONS')}
          className={`px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'SUBSCRIPTIONS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          <span>Active Subscribers ({subscriptions.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('TRANSACTIONS')}
          className={`px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'TRANSACTIONS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Telebirr Payment Orders ({transactions.length})</span>
        </button>
      </div>

      {/* Search / Filter toolbar */}
      <form onSubmit={handleSearchSubmit} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search MSISDN, order ID, player..."
              className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg outline-none w-64 font-mono text-xs text-slate-800"
            />
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {['ALL', 'ACTIVE', 'INACTIVE'].map((st) => (
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
          Filter Records
        </button>
      </form>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Table view */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === 'SUBSCRIPTIONS' ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Subscriber MSISDN</th>
                  <th className="py-3 px-4">Display Name</th>
                  <th className="py-3 px-4">VAS Plan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">GoPlay Coins</th>
                  <th className="py-3 px-4">Activated At</th>
                  <th className="py-3 px-4">Expires / Renewal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading subscribers ledger...
                    </td>
                  </tr>
                ) : subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No subscriber records found.
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {s.maskedMsisdn}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {s.displayName}
                      </td>
                      <td className="py-3 px-4 uppercase font-semibold text-[11px] text-blue-700 font-mono">
                        {s.plan || 'Daily 2 ETB'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge status={s.isActive ? 'ACTIVE' : 'INACTIVE'} size="sm" />
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-700">
                        {s.coins.toLocaleString()} 🪙
                      </td>
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-500">
                        {s.activatedAt ? new Date(s.activatedAt).toLocaleDateString() : 'Today'}
                      </td>
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-500">
                        {s.expiresAt ? new Date(s.expiresAt).toLocaleDateString() : 'Auto-Renew'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Subscriber</th>
                  <th className="py-3 px-4">Method & Item</th>
                  <th className="py-3 px-4">Amount ETB</th>
                  <th className="py-3 px-4">Coins Credited</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4">Telebirr Ref</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading Telebirr payment transactions...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No payment transactions found.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {tx.id.substring(0, 12)}...
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{tx.displayName}</div>
                        <div className="font-mono text-[10px] text-slate-400">{tx.maskedMsisdn}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{tx.itemTitle || tx.itemType}</div>
                        <div className="font-mono text-[10px] text-slate-400 uppercase">{tx.method}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                        {tx.amountEtb.toLocaleString()} ETB
                      </td>
                      <td className="py-3 px-4 font-mono text-amber-600 font-semibold">
                        +{tx.coins} 🪙
                      </td>
                      <td className="py-3 px-4">
                        <Badge status={tx.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-500">
                        {tx.providerRef || '-'}
                      </td>
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'Today'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
