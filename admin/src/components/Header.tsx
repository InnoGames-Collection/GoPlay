import React from 'react';
import {
  Phone,
  Clock,
  RefreshCw,
  LogOut,
  User,
  Shield,
  Database,
  Radio,
} from 'lucide-react';
import { AdminUser } from '../types';
import { NavPage } from './Sidebar';

interface HeaderProps {
  currentPage: NavPage;
  currentAdmin: AdminUser | null;
  systemMode: 'DEMO' | 'PRODUCTION';
  onToggleMode: (mode: 'DEMO' | 'PRODUCTION') => void;
  onRefresh: () => void;
  onLogout: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  currentAdmin,
  systemMode,
  onToggleMode,
  onRefresh,
  onLogout,
  isRefreshing = false,
}) => {
  const getPageInfo = (): { title: string; subtitle: string } => {
    switch (currentPage) {
      case 'DASHBOARD':
        return {
          title: 'Operations Dashboard',
          subtitle: 'Real-time overview of GoPlay / GameON Tele active players, tournaments, and Telebirr operations.',
        };
      case 'GAMES_CATALOG':
        return {
          title: 'Games Catalog & Anti-Cheat Thresholds',
          subtitle: 'Operational control plane for 100+ GameON Studios titles, categories, coin fees, and velocity rules.',
        };
      case 'TOURNAMENTS':
        return {
          title: 'Tournaments & Authoritative Finalization',
          subtitle: 'Manage national gaming championships, review live leaderboards, and execute prize settlements.',
        };
      case 'DAILY_CHALLENGES':
        return {
          title: 'Daily Challenges & Streaks',
          subtitle: 'Configure daily rapid tournaments, coin prize pools, and qualifying player rankings.',
        };
      case 'PRIZES_WINNERS':
        return {
          title: 'Prizes & Telebirr B2C Settlements',
          subtitle: 'Authoritative payout ledger, Telebirr automated transfers, and dispute resolution.',
        };
      case 'PLAYERS':
        return {
          title: 'Player & Subscriber Directory',
          subtitle: 'Ethio Telecom subscriber accounts, masked MSISDN governance, coin balance adjustments, and fraud bans.',
        };
      case 'SUBSCRIPTIONS':
        return {
          title: 'Subscriptions & Telebirr Orders',
          subtitle: 'Live billing state for shortcode 9898 recurring subscriptions and instant coin purchases.',
        };
      case 'ANTI_CHEAT':
        return {
          title: 'Anti-Cheat Inspection & Score Invalidation',
          subtitle: 'Automated fraud detection engine, telemetry spike inspection, and score invalidation controls.',
        };
      case 'REPORTS':
        return {
          title: 'Telecom VAS Reports & Reconciliation',
          subtitle: 'Official financial reports, gross revenue splits, Telebirr reconciliation, and subscriber churn.',
        };
      case 'SETTINGS':
        return {
          title: 'VAS Service & Compliance Settings',
          subtitle: 'Configure shortcode 9898 parameters, billing limits, and anti-cheat thresholds.',
        };
      case 'ADMIN_USERS':
        return {
          title: 'Administrative Users & Access Control (RBAC)',
          subtitle: 'Manage authorized operators, assign strict roles, and review session security.',
        };
      case 'AUDIT_LOG':
        return {
          title: 'Immutable Compliance Audit Trail (WORM)',
          subtitle: 'Tamper-proof chronological ledger of all operator mutations, bans, overrides, and settlements.',
        };
      default:
        return {
          title: 'GoPlay Admin Console',
          subtitle: 'Official EthioTelecom Gaming VAS Management Portal',
        };
    }
  };

  const { title, subtitle } = getPageInfo();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-10 shrink-0">
      {/* Page Title & Context */}
      <div>
        <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center space-x-2">
          <span>{title}</span>
        </h1>
        <p className="text-xs text-slate-500 hidden sm:block truncate max-w-xl">
          {subtitle}
        </p>
      </div>

      {/* Right Tools & Operator Info */}
      <div className="flex items-center space-x-3">
        {/* Ethio Telecom Info pill */}
        <div className="hidden lg:flex items-center space-x-2 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600">
          <Phone className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-medium text-slate-800">Shortcode: 9898</span>
          <span className="text-slate-300">|</span>
          <span className="text-emerald-700 font-semibold">2 Birr/Day</span>
        </div>

        {/* Timezone pill */}
        <div className="hidden xl:flex items-center space-x-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-500 font-mono">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>UTC+3 EAT</span>
        </div>

        {/* Mode Switcher */}
        <button
          onClick={() => onToggleMode(systemMode === 'DEMO' ? 'PRODUCTION' : 'DEMO')}
          title="Toggle Dataset Mode: Switch between realistic demo staging data and clean live production data"
          className={`flex items-center space-x-1.5 text-xs px-2.5 py-1.5 rounded-lg border font-mono font-medium transition-colors cursor-pointer ${
            systemMode === 'PRODUCTION'
              ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>{systemMode === 'PRODUCTION' ? 'LIVE PROD' : 'DEMO MODE'}</span>
        </button>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh All Real-time Data"
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
        </button>

        {/* Current Operator Profile Chip */}
        {currentAdmin && (
          <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold tracking-wider">
              {currentAdmin.username.substring(0, 2).toUpperCase()}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-slate-900 leading-tight">
                {currentAdmin.username}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {currentAdmin.role.replace(/_/g, ' ')}
              </div>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={onLogout}
          title="Sign Out of Session"
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
