import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  DollarSign,
  TrendingUp,
  Users,
  CreditCard,
  Gamepad2,
  RefreshCw,
} from 'lucide-react';
import { AdminRole } from '../types';
import { api } from '../services/api';

interface ReportsPageProps {
  currentRole: AdminRole;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ currentRole }) => {
  const [dateRange, setDateRange] = useState('LAST_30_DAYS');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await api.getReportsData(dateRange);
      setReportData(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [dateRange]);

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Metric,Value,Note\n' +
      `Gross Portal Revenue,${reportData?.grossRevenue || 285400} ETB,Official Ethio Telecom Shortcode 9898\n` +
      `Ethio Telecom Share (55%),${Math.round((reportData?.grossRevenue || 285400) * 0.55)} ETB,Contractual Baseline\n` +
      `GoPlay Net Share (45%),${Math.round((reportData?.grossRevenue || 285400) * 0.45)} ETB,Hosting & Tournament Operations\n` +
      `Active 9898 Subscribers,${reportData?.activeSubscribers || 18450},Verified 2 Birr/Day Accounts\n` +
      `Total Tournament Payouts Disbursed,${reportData?.payoutsDisbursed || 42500} ETB,Telebirr B2C\n` +
      `Anti-Cheat Velocity Flags Blocked,${reportData?.fraudBlocked || 132},Automated Rate Limiter\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GoPlay_Telecom_VAS_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <span>Telecom VAS & Financial Reconciliation Reports</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Official Ethio Telecom Shortcode 9898 settlement audit, revenue splits, and Telebirr C2B/B2C reconciliation.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV Report</span>
          </button>
          <button
            onClick={loadReport}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
            title="Reload Report Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">Period:</span>
          <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {[
              { id: 'TODAY', label: 'Today' },
              { id: 'THIS_WEEK', label: 'This Week' },
              { id: 'LAST_30_DAYS', label: 'Last 30 Days' },
              { id: 'YEAR_TO_DATE', label: 'YTD 2026' },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setDateRange(r.id)}
                className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                  dateRange === r.id
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div className="font-mono text-slate-400 text-xs">
          Timezone Authority: UTC+3 EAT (Addis Ababa)
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross VAS Revenue</div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
            {(reportData?.grossRevenue || 285400).toLocaleString()} ETB
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Shortcode 9898 + Coins
          </div>
        </div>

        {/* Ethio Telecom Share */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ethio Telecom (55%)</div>
          <div className="text-2xl font-bold text-blue-700 font-mono mt-1">
            {Math.round((reportData?.grossRevenue || 285400) * 0.55).toLocaleString()} ETB
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Operator wholesale remittance
          </div>
        </div>

        {/* GoPlay Share */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">GoPlay Tele (45%)</div>
          <div className="text-2xl font-bold text-emerald-700 font-mono mt-1">
            {Math.round((reportData?.grossRevenue || 285400) * 0.45).toLocaleString()} ETB
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Platform operations & hosting
          </div>
        </div>

        {/* Prizes Disbursed */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Prizes Disbursed</div>
          <div className="text-2xl font-bold text-amber-600 font-mono mt-1">
            {(reportData?.payoutsDisbursed || 42500).toLocaleString()} ETB
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Automated Telebirr B2C payouts
          </div>
        </div>
      </div>

      {/* Revenue Breakdown & Engagement Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Telebirr Channel Split */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-blue-600" />
            <span>Revenue by Payment Channel</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-700">Recurring 9898 Subscriptions (2 ETB/day)</span>
                <span className="font-mono text-slate-900">228,320 ETB (80%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '80%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-700">Telebirr Mini-App Coin Packs (C2B)</span>
                <span className="font-mono text-slate-900">42,810 ETB (15%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '15%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-700">Airtime Direct Billing (SMS Trigger)</span>
                <span className="font-mono text-slate-900">14,270 ETB (5%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '5%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Played Games Engagement */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <Gamepad2 className="w-4 h-4 text-indigo-600" />
            <span>Game Engagement & Play Sessions</span>
          </h3>

          <div className="divide-y divide-slate-100 text-xs">
            {[
              { title: 'Neon Dunk', category: 'Sports / Arcade', sessions: '42,100', share: '32%' },
              { title: 'Subway Runner', category: 'Action', sessions: '31,450', share: '24%' },
              { title: 'Penalty Shootout', category: 'Sports', sessions: '25,200', share: '19%' },
              { title: 'Chess Master', category: 'Strategy', sessions: '18,300', share: '14%' },
              { title: 'Bubble Pop Deluxe', category: 'Puzzle', sessions: '14,400', share: '11%' },
            ].map((g, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">{g.title}</div>
                  <div className="text-[10px] text-slate-400">{g.category}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-slate-800">{g.sessions} plays</div>
                  <div className="text-[10px] text-emerald-600 font-semibold">{g.share}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
