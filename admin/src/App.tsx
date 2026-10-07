import { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Gamepad2, 
  Trophy, 
  ShieldCheck, 
  RefreshCw,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Lock,
  Search,
  DollarSign,
  Eye,
  Ban,
  Coins,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Activity,
  AlertOctagon,
  FileSpreadsheet
} from 'lucide-react';

type TabType = 'DASHBOARD' | 'SUBSCRIBERS' | 'GAMES' | 'TOURNAMENTS' | 'TRANSACTIONS' | 'ANTI_CHEAT' | 'AUDIT_LOGS';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'SUPER_ADMIN' | 'TOURNAMENT_OPERATOR' | 'FINANCIAL_AUDITOR' | 'SUPPORT_AGENT';
}

export default function App() {
  const [adminToken, setAdminToken] = useState<string>(() => localStorage.getItem('goplay_admin_token') || '');
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem('goplay_admin_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // App Navigation & Data States
  const [activeTab, setActiveTab] = useState<TabType>('DASHBOARD');
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Live Metrics
  const [metrics, setMetrics] = useState({
    activeSubscribers: 0,
    totalPlayers: 0,
    activeTournaments: 0,
    fraudIncidentsBlocked: 0,
    portalRevenueEtb: 0,
    totalCoinsCirculating: 0,
  });

  // Live Data Lists (100% PostgreSQL Source of Truth — Zero Mock)
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [subscribersPage, setSubscribersPage] = useState(1);
  const [subscribersTotalPages, setSubscribersTotalPages] = useState(1);
  const [subscribersSearch, setSubscribersSearch] = useState('');

  const [games, setGames] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [activeTournId, setActiveTournId] = useState<string>('');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);

  const [flaggedSessions, setFlaggedSessions] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // PII Unmasking Modal
  const [unmaskedData, setUnmaskedData] = useState<{ id: string; name: string; phone: string } | null>(null);

  // Helper for authenticated API calls
  const authHeaders = useCallback(() => {
    const token = localStorage.getItem('goplay_admin_token') || '';
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'Authentication failed.');
        return;
      }

      setAdminToken(data.token);
      setAdminUser(data.admin);
      localStorage.setItem('goplay_admin_token', data.token);
      localStorage.setItem('goplay_admin_user', JSON.stringify(data.admin));
      setUsername('');
      setPassword('');
    } catch {
      setLoginError('Network failure connecting to administrative auth gateway.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST', headers: authHeaders() });
    } catch {}
    setAdminToken('');
    setAdminUser(null);
    localStorage.removeItem('goplay_admin_token');
    localStorage.removeItem('goplay_admin_user');
  };

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/dashboard', { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch {}
  }, [authHeaders]);

  const fetchSubscribers = useCallback(async (page: number = 1, search: string = '') => {
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '15' });
      if (search) params.append('search', search);

      const res = await fetch(`/api/admin/subscribers?${params.toString()}`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setSubscribers(data.subscribers || []);
        setSubscribersPage(data.page || 1);
        setSubscribersTotalPages(data.totalPages || 1);
      }
    } catch {}
  }, [authHeaders]);

  const fetchGames = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/games', { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setGames(data || []);
      }
    } catch {}
  }, [authHeaders]);

  const fetchTournaments = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/tournaments', { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setTournaments(data || []);
        if (data.length > 0) {
          const firstId = data[0].id;
          setActiveTournId(firstId);
          const lbRes = await fetch(`/api/admin/tournaments/${firstId}/leaderboard`, { headers: authHeaders() });
          if (lbRes.ok) {
            const lbData = await lbRes.json();
            setLeaderboard(lbData.leaderboard || []);
          }
        }
      }
    } catch {}
  }, [authHeaders]);

  const fetchLeaderboard = async (tournId: string) => {
    setActiveTournId(tournId);
    try {
      const res = await fetch(`/api/admin/tournaments/${tournId}/leaderboard`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch {}
  };

  const fetchTransactions = useCallback(async () => {
    try {
      const [txRes, pyRes] = await Promise.all([
        fetch('/api/admin/transactions?limit=25', { headers: authHeaders() }),
        fetch('/api/admin/payouts?limit=25', { headers: authHeaders() }),
      ]);
      if (txRes.ok) {
        const data = await txRes.json();
        setTransactions(data.transactions || []);
      }
      if (pyRes.ok) {
        const data = await pyRes.json();
        setPayouts(data.payouts || []);
      }
    } catch {}
  }, [authHeaders]);

  const fetchAntiCheat = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/anti-cheat/flagged?limit=25', { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setFlaggedSessions(data.flaggedSessions || []);
      }
    } catch {}
  }, [authHeaders]);

  const fetchAuditLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/audit-logs?limit=30', { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch {}
  }, [authHeaders]);

  const refreshActiveTab = useCallback(async () => {
    setLoading(true);
    if (activeTab === 'DASHBOARD') await fetchDashboard();
    else if (activeTab === 'SUBSCRIBERS') await fetchSubscribers(subscribersPage, subscribersSearch);
    else if (activeTab === 'GAMES') await fetchGames();
    else if (activeTab === 'TOURNAMENTS') await fetchTournaments();
    else if (activeTab === 'TRANSACTIONS') await fetchTransactions();
    else if (activeTab === 'ANTI_CHEAT') await fetchAntiCheat();
    else if (activeTab === 'AUDIT_LOGS') await fetchAuditLogs();
    setLoading(false);
  }, [activeTab, fetchDashboard, fetchSubscribers, subscribersPage, subscribersSearch, fetchGames, fetchTournaments, fetchTransactions, fetchAntiCheat, fetchAuditLogs]);

  useEffect(() => {
    if (adminToken) {
      refreshActiveTab();
    }
  }, [adminToken, activeTab, refreshActiveTab]);

  // Operations Actions
  const toggleGame = async (gameId: string) => {
    try {
      const res = await fetch(`/api/admin/games/${gameId}/toggle`, { method: 'POST', headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setGames((prev) => prev.map((g) => (g.game_id === gameId ? { ...g, is_enabled: data.isEnabled } : g)));
        setActionMessage({ text: `Game status toggled successfully.`, type: 'success' });
      } else {
        const err = await res.json();
        setActionMessage({ text: err.error || 'Failed to toggle game status.', type: 'error' });
      }
    } catch {
      setActionMessage({ text: 'Network failure toggling game.', type: 'error' });
    }
  };

  const handleFinalizeTournament = async (tournId: string) => {
    if (!confirm(`Finalize tournament ${tournId} and trigger Telebirr prize payouts? This action is irreversible.`)) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tournaments/${tournId}/finalize`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ text: data.message, type: 'success' });
        await fetchTournaments();
      } else {
        setActionMessage({ text: data.message || data.error || 'Finalization rejected.', type: 'error' });
      }
    } catch {
      setActionMessage({ text: 'Network failure settling tournament.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUnmaskMsisdn = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/subscribers/${userId}/unmask`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setUnmaskedData({ id: data.userId, name: data.displayName, phone: data.unmaskedPhone });
      } else {
        const err = await res.json();
        alert(err.error || 'Insufficient privileges to unmask customer PII.');
      }
    } catch {
      alert('Error requesting unmasked MSISDN.');
    }
  };

  const handleBanPlayer = async (userId: string, isBanned: boolean) => {
    const reason = prompt(isBanned ? 'Enter ban reason for player:' : 'Enter reason for unbanning player:');
    if (reason === null) return;

    try {
      const res = await fetch(`/api/admin/players/${userId}/ban`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ isBanned, reason }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ text: data.message, type: 'success' });
        await fetchSubscribers(subscribersPage, subscribersSearch);
      } else {
        setActionMessage({ text: data.error || 'Ban operation rejected.', type: 'error' });
      }
    } catch {
      setActionMessage({ text: 'Network failure during ban operation.', type: 'error' });
    }
  };

  const handleAdjustCoins = async (userId: string) => {
    const amountStr = prompt('Enter coins delta (e.g. 100 for credit, -50 for debit):');
    if (!amountStr) return;
    const coinsDelta = parseInt(amountStr, 10);
    if (isNaN(coinsDelta) || coinsDelta === 0) {
      alert('Invalid coin amount.');
      return;
    }
    const reason = prompt('Enter compliance reason for balance adjustment:') || 'Manual Adjustment';

    try {
      const res = await fetch(`/api/admin/players/${userId}/adjust-coins`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ coinsDelta, reason }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ text: data.message, type: 'success' });
        await fetchSubscribers(subscribersPage, subscribersSearch);
      } else {
        setActionMessage({ text: data.error || 'Balance adjustment rejected.', type: 'error' });
      }
    } catch {
      setActionMessage({ text: 'Network failure adjusting balance.', type: 'error' });
    }
  };

  const handleInvalidateSession = async (sessionId: string) => {
    const reason = prompt('Reason for score invalidation:') || 'Telemetry anomaly';
    try {
      const res = await fetch(`/api/admin/anti-cheat/invalidate-session`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ sessionId, reason }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ text: data.message, type: 'success' });
        await fetchAntiCheat();
      } else {
        setActionMessage({ text: data.error || 'Invalidation rejected.', type: 'error' });
      }
    } catch {
      setActionMessage({ text: 'Network error invalidating session.', type: 'error' });
    }
  };

  // ============================================================================
  // UNMAPPED AUTH VIEW: RENDER SECURE LOGIN SCREEN
  // ============================================================================
  if (!adminToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 font-sans text-slate-100">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 font-black text-white text-lg shadow-lg shadow-sky-500/20">
              GP
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">GoPlay Operations</h1>
              <p className="text-xs text-slate-400">Zero-Trust Enterprise Console</p>
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-sky-500/20 bg-sky-500/10 p-3 text-xs text-sky-300">
            <div className="flex items-center gap-2 font-semibold">
              <Lock size={14} /> Identity Isolated Administration
            </div>
            <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
              Standard player credentials are strictly rejected. Enter authorized operational credentials. Brute force lockouts are active.
            </p>
          </div>

          {loginError && (
            <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-semibold text-rose-400 flex items-center gap-2">
              <AlertOctagon size={16} /> {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Administrative Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="superadmin / tourn_operator / goplay_auditor"
                required
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full rounded-xl bg-sky-600 hover:bg-sky-500 px-4 py-2.5 text-xs font-bold text-white transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loginLoading ? <RefreshCw size={14} className="animate-spin" /> : <Lock size={14} />}
              Authenticate & Verify Session
            </button>
          </form>

          <div className="mt-6 border-t border-slate-800 pt-4 text-center text-[10px] text-slate-500">
            Protected by Ethio Telecom VAS Compliance & WORM Audit Trail
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // AUTHENTICATED CONSOLE VIEW
  // ============================================================================
  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 px-2 py-4 mb-6 border-b border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-sky-500/20">
              GP
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide text-white">GoPlay Admin</h1>
              <p className="text-[11px] text-slate-400 font-medium">Ops & Auditor Console</p>
            </div>
          </div>

          {/* Admin Identity Card */}
          <div className="mb-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs">
            <div className="text-[10px] uppercase font-bold text-slate-500">Active Operator</div>
            <div className="font-bold text-white mt-0.5 truncate">{adminUser?.username}</div>
            <div className="mt-1.5 flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                adminUser?.role === 'SUPER_ADMIN' ? 'bg-purple-500/20 text-purple-300' :
                adminUser?.role === 'TOURNAMENT_OPERATOR' ? 'bg-amber-500/20 text-amber-300' :
                adminUser?.role === 'FINANCIAL_AUDITOR' ? 'bg-emerald-500/20 text-emerald-300' :
                'bg-sky-500/20 text-sky-300'
              }`}>
                {adminUser?.role}
              </span>
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-rose-400 transition"
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>

          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('DASHBOARD')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'DASHBOARD' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard size={16} /> Dashboard KPIs
            </button>
            <button
              onClick={() => setActiveTab('SUBSCRIBERS')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'SUBSCRIBERS' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Users size={16} /> Subscribers & Players
            </button>
            <button
              onClick={() => setActiveTab('GAMES')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'GAMES' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Gamepad2 size={16} /> Catalog Controller
            </button>
            <button
              onClick={() => setActiveTab('TOURNAMENTS')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'TOURNAMENTS' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Trophy size={16} /> Tournaments & Settlement
            </button>
            <button
              onClick={() => setActiveTab('TRANSACTIONS')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'TRANSACTIONS' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <DollarSign size={16} /> Financial Reconciliation
            </button>
            <button
              onClick={() => setActiveTab('ANTI_CHEAT')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'ANTI_CHEAT' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Activity size={16} /> Anti-Cheat Inspection
            </button>
            <button
              onClick={() => setActiveTab('AUDIT_LOGS')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'AUDIT_LOGS' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet size={16} /> Immutable Audit Logs
            </button>
          </nav>
        </div>

        <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
            <ShieldCheck size={14} /> SP Gateway Connected
          </div>
          <p className="text-[11px]">Shortcode: 9898 | 2 ETB/day</p>
          <p className="text-[10px] text-slate-500 mt-1">Host: 34.41.116.217:3302</p>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 overflow-y-auto p-8">
        <header className="flex items-center justify-between pb-6 border-b border-slate-800 mb-6">
          <div>
            <h2 className="text-xl font-black tracking-tight text-white capitalize">{activeTab.replace('_', ' ').toLowerCase()}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Authoritative Live Database Operations Console</p>
          </div>
          <button
            onClick={refreshActiveTab}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh View
          </button>
        </header>

        {actionMessage && (
          <div className={`mb-6 p-3 rounded-xl border text-xs flex items-center justify-between ${
            actionMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}>
            <span>{actionMessage.text}</span>
            <button onClick={() => setActionMessage(null)} className="font-bold">&times;</button>
          </div>
        )}

        {/* 1. DASHBOARD VIEW */}
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Subscribers</span>
                <div className="text-3xl font-black text-white mt-2">{metrics.activeSubscribers.toLocaleString()}</div>
                <span className="inline-block mt-2 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Shortcode 9898 (2 ETB/day)
                </span>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Registered Players</span>
                <div className="text-3xl font-black text-white mt-2">{metrics.totalPlayers.toLocaleString()}</div>
                <span className="inline-block mt-2 text-[11px] font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full">
                  Telebirr SuperApp SSO
                </span>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Coins Circulating</span>
                <div className="text-3xl font-black text-amber-400 mt-2">{metrics.totalCoinsCirculating.toLocaleString()}</div>
                <span className="inline-block mt-2 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                  Economy Coin Velocity
                </span>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Tournaments</span>
                <div className="text-3xl font-black text-white mt-2">{metrics.activeTournaments}</div>
                <span className="inline-block mt-2 text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                  Prize Pools in Play
                </span>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Anti-Cheat Fraud Blocked</span>
                <div className="text-3xl font-black text-rose-400 mt-2">{metrics.fraudIncidentsBlocked}</div>
                <span className="inline-block mt-2 text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">
                  Flagged Anomalies
                </span>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Portal Revenue (ETB)</span>
                <div className="text-3xl font-black text-emerald-400 mt-2">{metrics.portalRevenueEtb.toLocaleString()} ETB</div>
                <span className="inline-block mt-2 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Telebirr Direct Settled
                </span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Zero-Trust Operational Architecture</h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-4xl">
                Every administrative endpoint enforces Fastify RBAC verification against PostgreSQL 16 on port 5434. Telebirr MSISDNs are masked by default (`0911*****567`). Mutating actions write directly to the immutable WORM `admin_audit_logs` ledger guarded by database triggers.
              </p>
            </div>
          </div>
        )}

        {/* 2. SUBSCRIBERS VIEW */}
        {activeTab === 'SUBSCRIBERS' && (
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden space-y-4 p-4">
            <div className="flex justify-between items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
                <input
                  type="text"
                  placeholder="Search by phone or display name..."
                  value={subscribersSearch}
                  onChange={(e) => setSubscribersSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchSubscribers(1, subscribersSearch)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchSubscribers(subscribersPage - 1, subscribersSearch)}
                  disabled={subscribersPage <= 1}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs text-slate-400">Page {subscribersPage} of {subscribersTotalPages}</span>
                <button
                  onClick={() => fetchSubscribers(subscribersPage + 1, subscribersSearch)}
                  disabled={subscribersPage >= subscribersTotalPages}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3 font-semibold">Masked MSISDN</th>
                    <th className="p-3 font-semibold">Display Name</th>
                    <th className="p-3 font-semibold">Tariff Plan</th>
                    <th className="p-3 font-semibold">Coins</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {subscribers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-500">
                        No subscriber records matching search query.
                      </td>
                    </tr>
                  ) : (
                    subscribers.map((s: any) => (
                      <tr key={s.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 font-mono text-white flex items-center gap-2">
                          {s.maskedMsisdn}
                          <button
                            onClick={() => handleUnmaskMsisdn(s.userId)}
                            title="Unmask PII (Audit Logged)"
                            className="text-slate-500 hover:text-sky-400"
                          >
                            <Eye size={12} />
                          </button>
                        </td>
                        <td className="p-3 text-slate-300">{s.displayName}</td>
                        <td className="p-3 text-slate-400 capitalize">{s.plan} (2 ETB/day)</td>
                        <td className="p-3 font-semibold text-amber-400">{s.coins} Coins</td>
                        <td className="p-3">
                          {s.isBanned ? (
                            <span className="bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full font-semibold text-[10px]">BANNED</span>
                          ) : s.isActive ? (
                            <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-semibold text-[10px]">ACTIVE</span>
                          ) : (
                            <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-semibold text-[10px]">EXPIRED</span>
                          )}
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => handleAdjustCoins(s.userId)}
                            className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded text-[11px] font-semibold"
                            title="Adjust Coin Balance"
                          >
                            <Coins size={12} className="inline mr-1" /> Balance
                          </button>
                          <button
                            onClick={() => handleBanPlayer(s.userId, !s.isBanned)}
                            className={`px-2 py-1 rounded text-[11px] font-semibold ${
                              s.isBanned ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            <Ban size={12} className="inline mr-1" /> {s.isBanned ? 'Unban' : 'Ban'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. GAMES CATALOG VIEW */}
        {activeTab === 'GAMES' && (
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Games Controller (PostgreSQL Relational Store)</h3>
              <span className="text-xs text-slate-400">{games.length} Configured Titles</span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3 font-semibold">Game Title</th>
                  <th className="p-3 font-semibold">Category</th>
                  <th className="p-3 font-semibold">Entry Fee</th>
                  <th className="p-3 font-semibold">Max Rate</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold text-right">Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {games.map((g) => (
                  <tr key={g.game_id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-bold text-white">{g.title}</td>
                    <td className="p-3 text-slate-400 capitalize">{g.category}</td>
                    <td className="p-3 text-amber-400 font-semibold">{g.entry_fee_coins} Coins</td>
                    <td className="p-3 text-slate-400">{g.max_score_per_sec} pts/s</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        g.is_enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {g.is_enabled ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {g.is_enabled ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => toggleGame(g.game_id)}
                        className="text-slate-400 hover:text-white transition"
                      >
                        {g.is_enabled ? <ToggleRight size={22} className="text-sky-400" /> : <ToggleLeft size={22} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. TOURNAMENTS VIEW */}
        {activeTab === 'TOURNAMENTS' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tournaments.map((t) => (
                <div
                  key={t.id}
                  onClick={() => fetchLeaderboard(t.id)}
                  className={`p-5 rounded-2xl border cursor-pointer transition ${
                    activeTournId === t.id ? 'border-sky-500 bg-slate-900 shadow-md' : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-bold text-white">{t.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Game: {t.game_title} ({t.game_category})</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      t.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {t.status}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs border-t border-slate-800/80 pt-3">
                    <span className="text-amber-400 font-bold">{Number(t.prize_pool_etb).toLocaleString()} ETB Prize Pool</span>
                    <span className="text-slate-400">{t.total_entries || 0} Registered Entries</span>
                  </div>

                  {t.status === 'ACTIVE' && (
                    <div className="mt-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFinalizeTournament(t.id);
                        }}
                        className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
                      >
                        <Lock size={14} /> Finalize Tournament & Disburse Prizes
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Active Leaderboard Contenders */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Live Authoritative Contenders ({activeTournId || 'Select Tournament'})
                </h3>
                <span className="text-xs text-slate-400">{leaderboard.length} Ranked Contenders</span>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3 font-semibold">Rank</th>
                    <th className="p-3 font-semibold">Contender MSISDN</th>
                    <th className="p-3 font-semibold">Player Name</th>
                    <th className="p-3 font-semibold">Score</th>
                    <th className="p-3 font-semibold">Allocated Prize</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500">
                        No submissions recorded for this tournament.
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((c) => (
                      <tr key={c.rank} className="hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-white">#{c.rank}</td>
                        <td className="p-3 font-mono text-slate-300">{c.maskedMsisdn}</td>
                        <td className="p-3 text-slate-300">{c.displayName}</td>
                        <td className="p-3 font-black text-sky-400">{c.score.toLocaleString()} pts</td>
                        <td className="p-3 font-bold text-amber-400">{c.prizeText || `${c.prizeETB} ETB`}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. FINANCIAL RECONCILIATION */}
        {activeTab === 'TRANSACTIONS' && (
          <div className="space-y-6">
            {/* Payment Orders */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-800">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Telebirr C2B Payment Orders</h3>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3 font-semibold">Order ID</th>
                    <th className="p-3 font-semibold">Masked MSISDN</th>
                    <th className="p-3 font-semibold">Amount</th>
                    <th className="p-3 font-semibold">Item</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono text-slate-300">{tx.id.substring(0, 16)}...</td>
                      <td className="p-3 font-mono text-slate-300">{tx.maskedMsisdn}</td>
                      <td className="p-3 font-bold text-emerald-400">{tx.amountEtb} ETB</td>
                      <td className="p-3 text-slate-400">{tx.itemTitle}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* B2C Payouts */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-800">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Telebirr B2C Prize Disbursements</h3>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3 font-semibold">Tournament</th>
                    <th className="p-3 font-semibold">Rank</th>
                    <th className="p-3 font-semibold">Masked MSISDN</th>
                    <th className="p-3 font-semibold">Prize Disbursed</th>
                    <th className="p-3 font-semibold">B2C Ref</th>
                    <th className="p-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {payouts.map((py) => (
                    <tr key={py.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-semibold text-white">{py.tournamentTitle}</td>
                      <td className="p-3 text-amber-400 font-bold">#{py.rank}</td>
                      <td className="p-3 font-mono text-slate-300">{py.maskedMsisdn}</td>
                      <td className="p-3 font-bold text-emerald-400">{py.prizeEtb} ETB</td>
                      <td className="p-3 font-mono text-slate-400">{py.telebirrB2cRef || 'Pending Gateway'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          py.status === 'DISBURSED' ? 'bg-emerald-500/10 text-emerald-400' :
                          py.status === 'PROCESSING' ? 'bg-sky-500/10 text-sky-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {py.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. ANTI-CHEAT VIEW */}
        {activeTab === 'ANTI_CHEAT' && (
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Flagged Suspicious Runs (Fraud Incidents)</h3>
              <span className="text-xs text-rose-400 font-semibold">{flaggedSessions.length} Anomaly Sessions</span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3 font-semibold">Session ID</th>
                  <th className="p-3 font-semibold">Game</th>
                  <th className="p-3 font-semibold">Player</th>
                  <th className="p-3 font-semibold">Score</th>
                  <th className="p-3 font-semibold">Duration / Velocity</th>
                  <th className="p-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {flaggedSessions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">
                      Zero suspicious runs flagged in database.
                    </td>
                  </tr>
                ) : (
                  flaggedSessions.map((fs) => (
                    <tr key={fs.sessionId} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono text-slate-300">{fs.sessionId}</td>
                      <td className="p-3 font-semibold text-white">{fs.gameTitle}</td>
                      <td className="p-3 font-mono text-slate-400">{fs.maskedMsisdn}</td>
                      <td className="p-3 font-bold text-rose-400">{fs.score} pts</td>
                      <td className="p-3 text-slate-400">
                        {fs.serverDurationSec}s ({fs.maxVelocity} pts/s)
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => handleInvalidateSession(fs.sessionId)}
                          className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded text-[11px] font-semibold"
                        >
                          Invalidate Score
                        </button>
                        <button
                          onClick={() => handleBanPlayer(fs.userId, true)}
                          className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-semibold"
                        >
                          Ban Player
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 7. IMMUTABLE AUDIT LOGS VIEW */}
        {activeTab === 'AUDIT_LOGS' && (
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Immutable WORM Audit Trail (PostgreSQL Trigger Enforced)
              </h3>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3 font-semibold">Timestamp</th>
                  <th className="p-3 font-semibold">Operator</th>
                  <th className="p-3 font-semibold">Action</th>
                  <th className="p-3 font-semibold">Entity</th>
                  <th className="p-3 font-semibold">IP Address</th>
                  <th className="p-3 font-semibold">New Value / Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">
                      No audit events recorded in database ledger.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 font-mono text-[11px]">
                      <td className="p-3 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="p-3 font-bold text-sky-400">{log.admin_username}</td>
                      <td className="p-3 text-amber-300">{log.action}</td>
                      <td className="p-3 text-slate-300">{log.entity_type} ({log.entity_id})</td>
                      <td className="p-3 text-slate-400">{log.ip_address}</td>
                      <td className="p-3 text-slate-400 max-w-xs truncate">
                        {log.new_value ? JSON.stringify(log.new_value) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Unmask PII Modal */}
        {unmaskedData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm mb-4">
                <AlertOctagon size={18} /> Sensitive Customer PII Unmasked
              </div>
              <div className="space-y-3 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 block">Player Name:</span>
                  <span className="font-bold text-white">{unmaskedData.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Unmasked MSISDN:</span>
                  <span className="font-mono text-base font-bold text-sky-400">{unmaskedData.phone}</span>
                </div>
                <div className="text-[10px] text-amber-400/80 pt-2 border-t border-slate-800">
                  Notice: This unmasking operation has been immutably recorded in the compliance audit ledger.
                </div>
              </div>
              <button
                onClick={() => setUnmaskedData(null)}
                className="mt-6 w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition"
              >
                Close PII Viewer
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
