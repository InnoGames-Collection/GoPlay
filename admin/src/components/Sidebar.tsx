import React from 'react';
import {
  LayoutDashboard,
  Gamepad2,
  Trophy,
  CalendarDays,
  Award,
  Users,
  PhoneCall,
  ShieldCheck,
  FileSpreadsheet,
  Settings,
  ClipboardList,
  LogOut,
  ChevronDown,
  Database,
  Radio,
  Lock,
} from 'lucide-react';
import { AdminUser, AdminRole } from '../types';

export type NavPage =
  | 'DASHBOARD'
  | 'GAMES_CATALOG'
  | 'TOURNAMENTS'
  | 'DAILY_CHALLENGES'
  | 'PRIZES_WINNERS'
  | 'PLAYERS'
  | 'SUBSCRIPTIONS'
  | 'ANTI_CHEAT'
  | 'REPORTS'
  | 'SETTINGS'
  | 'ADMIN_USERS'
  | 'AUDIT_LOG';

interface SidebarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  currentAdmin: AdminUser | null;
  availableAdmins: AdminUser[];
  onSwitchAdmin: (adminId: string) => void;
  systemMode: 'DEMO' | 'PRODUCTION';
  onToggleMode: (mode: 'DEMO' | 'PRODUCTION') => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  currentAdmin,
  availableAdmins,
  onSwitchAdmin,
  systemMode,
  onToggleMode,
  onLogout,
}) => {
  const [showAdminMenu, setShowAdminMenu] = React.useState(false);

  const getRoleBadge = (role: AdminRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="text-[10px] bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 px-1.5 py-0.5 rounded font-mono">SUPER ADMIN</span>;
      case 'TOURNAMENT_OPERATOR':
      case 'OPERATIONS_ADMIN':
        return <span className="text-[10px] bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono">TOURN OPERATOR</span>;
      case 'FINANCIAL_AUDITOR':
      case 'REPORTING_ADMIN':
        return <span className="text-[10px] bg-amber-500/20 text-amber-200 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono">AUDITOR</span>;
      case 'SUPPORT_AGENT':
        return <span className="text-[10px] bg-sky-500/20 text-sky-200 border border-sky-500/30 px-1.5 py-0.5 rounded font-mono">SUPPORT</span>;
      default:
        return <span className="text-[10px] bg-slate-500/20 text-slate-200 border border-slate-500/30 px-1.5 py-0.5 rounded font-mono">{role}</span>;
    }
  };

  const navItemClass = (page: NavPage) => {
    const isActive = currentPage === page;
    return `w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
      isActive
        ? 'bg-blue-600 text-white shadow-xs font-semibold'
        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
    }`;
  };

  return (
    <aside className="w-64 bg-[#0a192f] text-slate-100 flex flex-col h-screen shrink-0 select-none border-r border-slate-800 z-20">
      {/* Brand & Telecom Identification */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#82C341] to-[#1688C9] flex items-center justify-center font-black text-white shadow-md tracking-wider text-base">
            GP
          </div>
          <div>
            <div className="font-bold text-base tracking-tight text-white flex items-center space-x-1.5">
              <span>GoPlay</span>
              <span className="text-xs px-1.5 py-0.2 bg-[#82C341]/20 text-[#82C341] rounded font-mono">TELE</span>
            </div>
            <div className="text-[11px] text-emerald-400 font-mono tracking-wide font-medium flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>ADMIN PORTAL</span>
            </div>
          </div>
        </div>

        {/* Operating Mode Indicator & Switch */}
        <div className="mt-3.5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5 text-slate-400">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono text-[11px]">DATASET:</span>
          </div>
          <button
            onClick={() => onToggleMode(systemMode === 'DEMO' ? 'PRODUCTION' : 'DEMO')}
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider border cursor-pointer ${
              systemMode === 'PRODUCTION'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
            }`}
          >
            {systemMode}
          </button>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
        <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Operations & Gaming
        </div>

        <button
          onClick={() => onNavigate('DASHBOARD')}
          className={navItemClass('DASHBOARD')}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0 text-slate-400" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => onNavigate('GAMES_CATALOG')}
          className={navItemClass('GAMES_CATALOG')}
        >
          <Gamepad2 className="w-4 h-4 shrink-0 text-slate-400" />
          <span>Games Catalog</span>
        </button>

        <button
          onClick={() => onNavigate('TOURNAMENTS')}
          className={navItemClass('TOURNAMENTS')}
        >
          <Trophy className="w-4 h-4 shrink-0 text-amber-400" />
          <span>Tournaments</span>
        </button>

        <button
          onClick={() => onNavigate('DAILY_CHALLENGES')}
          className={navItemClass('DAILY_CHALLENGES')}
        >
          <CalendarDays className="w-4 h-4 shrink-0 text-slate-400" />
          <span>Daily Challenges</span>
        </button>

        <button
          onClick={() => onNavigate('PRIZES_WINNERS')}
          className={navItemClass('PRIZES_WINNERS')}
        >
          <Award className="w-4 h-4 shrink-0 text-slate-400" />
          <span>Prizes & Settlements</span>
        </button>

        <div className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Subscribers & Telebirr
        </div>

        <button
          onClick={() => onNavigate('PLAYERS')}
          className={navItemClass('PLAYERS')}
        >
          <Users className="w-4 h-4 shrink-0 text-slate-400" />
          <span>Players Directory</span>
        </button>

        <button
          onClick={() => onNavigate('SUBSCRIPTIONS')}
          className={navItemClass('SUBSCRIPTIONS')}
        >
          <PhoneCall className="w-4 h-4 shrink-0 text-slate-400" />
          <span>Subscriptions (9898)</span>
        </button>

        <button
          onClick={() => onNavigate('ANTI_CHEAT')}
          className={navItemClass('ANTI_CHEAT')}
        >
          <ShieldCheck className="w-4 h-4 shrink-0 text-rose-400" />
          <span>Anti-Cheat & Fraud</span>
        </button>

        <button
          onClick={() => onNavigate('REPORTS')}
          className={navItemClass('REPORTS')}
        >
          <FileSpreadsheet className="w-4 h-4 shrink-0 text-slate-400" />
          <span>Telecom Reports</span>
        </button>

        <div className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          System & Compliance
        </div>

        <button
          onClick={() => onNavigate('SETTINGS')}
          className={navItemClass('SETTINGS')}
        >
          <Settings className="w-4 h-4 shrink-0 text-slate-400" />
          <span>VAS Settings</span>
        </button>

        <button
          onClick={() => onNavigate('ADMIN_USERS')}
          className={navItemClass('ADMIN_USERS')}
        >
          <ShieldCheck className="w-4 h-4 shrink-0 text-slate-400" />
          <span>Admin Users & RBAC</span>
        </button>

        <button
          onClick={() => onNavigate('AUDIT_LOG')}
          className={navItemClass('AUDIT_LOG')}
        >
          <ClipboardList className="w-4 h-4 shrink-0 text-slate-400" />
          <span>Immutable Audit Log</span>
        </button>
      </nav>

      {/* Operator Account & Switcher */}
      <div className="p-3 border-t border-slate-800 bg-[#071324]/80">
        <div className="relative">
          <button
            onClick={() => setShowAdminMenu(!showAdminMenu)}
            className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors text-left cursor-pointer border border-slate-700/60"
          >
            <div className="flex items-center space-x-2.5 truncate">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {currentAdmin?.username.substring(0, 2).toUpperCase() || 'AD'}
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-white truncate">
                  {currentAdmin?.name || currentAdmin?.username || 'Operator'}
                </div>
                <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                  <span>{currentAdmin?.role ? getRoleBadge(currentAdmin.role) : 'OPERATOR'}</span>
                </div>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {/* Switch Operator Dropdown */}
          {showAdminMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 text-xs">
              <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
                Switch Authorized Persona
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {availableAdmins.map((adm) => (
                  <button
                    key={adm.id}
                    onClick={() => {
                      onSwitchAdmin(adm.id);
                      setShowAdminMenu(false);
                    }}
                    className={`w-full flex items-center justify-between p-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                      adm.id === currentAdmin?.id
                        ? 'bg-blue-600/30 text-blue-200 border border-blue-500/40'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="truncate">
                      <div className="font-medium text-xs text-white truncate">{adm.name || adm.username}</div>
                      <div className="text-[10px] text-slate-400">{adm.email}</div>
                    </div>
                    {getRoleBadge(adm.role)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onLogout}
          className="mt-2 w-full py-1.5 px-3 flex items-center justify-center space-x-1.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-slate-800/40 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out Session</span>
        </button>
      </div>
    </aside>
  );
};
