import React, { useState, useEffect } from 'react';
import { Sidebar, NavPage } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { GamesCatalogPage } from './pages/GamesCatalogPage';
import { TournamentsPage } from './pages/TournamentsPage';
import { DailyChallengePage } from './pages/DailyChallengePage';
import { PrizesPage } from './pages/PrizesPage';
import { PlayersPage } from './pages/PlayersPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { AntiCheatPage } from './pages/AntiCheatPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { LoginPage } from './pages/LoginPage';
import { api, getStoredSystemMode, setStoredSystemMode } from './services/api';
import { AdminUser, DashboardStats } from './types';

export default function App() {
  const [currentPage, setCurrentPage] = useState<NavPage>('DASHBOARD');
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [availableAdmins, setAvailableAdmins] = useState<AdminUser[]>([]);
  const [systemMode, setSystemMode] = useState<'DEMO' | 'PRODUCTION'>(getStoredSystemMode);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Initialize auth and stats
  const initApp = async () => {
    try {
      setIsRefreshing(true);
      const [authData, statsData] = await Promise.all([
        api.getAuthMe(),
        api.getDashboardStats(),
      ]);
      setCurrentAdmin(authData.currentAdmin);
      setAvailableAdmins(authData.availableAdmins);
      setDashboardStats(statsData);
      setSystemMode(statsData.mode);
    } catch (err) {
      console.error('Failed to initialize admin session:', err);
      setCurrentAdmin(null);
    } finally {
      setIsRefreshing(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    initApp();
  }, []);

  const handleLoginSuccess = async (admin: AdminUser) => {
    setCurrentAdmin(admin);
    await initApp();
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {}
    setCurrentAdmin(null);
  };

  const handleSwitchAdmin = async (adminId: string) => {
    try {
      const res = await api.switchAdmin(adminId);
      setCurrentAdmin(res.currentAdmin);
      await initApp();
    } catch (err: any) {
      alert(err.message || 'Failed to switch administrator');
    }
  };

  const handleToggleMode = async (mode: 'DEMO' | 'PRODUCTION') => {
    const confirmSwitch = window.confirm(
      `Switch to ${mode} dataset mode?\n\n- DEMO: Includes realistic sample tournament participants, games & telemetry.\n- PRODUCTION: Direct live connection to GCP VM & PostgreSQL 16.`
    );
    if (!confirmSwitch) return;

    try {
      setIsRefreshing(true);
      const res = await api.switchSystemMode(mode);
      setSystemMode(res.mode);
      setStoredSystemMode(res.mode);
      await initApp();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  // If loading session
  if (initialLoading) {
    return (
      <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-[#050D1A] text-slate-100">
        <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <div className="font-bold text-sm tracking-wide">CONNECTING TO GOPLAY / ETHIOTELECOM ADMIN GATEWAY</div>
        <div className="text-xs text-slate-500 mt-1 font-mono">Verifying administrative JWT credentials & WORM ledger...</div>
      </div>
    );
  }

  // If unauthenticated, show styled login page
  if (!currentAdmin) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-900 select-none">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        currentAdmin={currentAdmin}
        availableAdmins={availableAdmins}
        onSwitchAdmin={handleSwitchAdmin}
        systemMode={systemMode}
        onToggleMode={handleToggleMode}
        onLogout={handleLogout}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          currentPage={currentPage}
          currentAdmin={currentAdmin}
          systemMode={systemMode}
          onToggleMode={handleToggleMode}
          onRefresh={initApp}
          onLogout={handleLogout}
          isRefreshing={isRefreshing}
        />

        {/* Page Body */}
        <main className="flex-1 overflow-y-auto bg-slate-50 scrollbar-thin scrollbar-thumb-slate-300">
          {currentPage === 'DASHBOARD' && (
            <DashboardPage
              stats={dashboardStats}
              onNavigate={setCurrentPage}
              onRefresh={initApp}
            />
          )}

          {currentPage === 'GAMES_CATALOG' && (
            <GamesCatalogPage currentRole={currentAdmin.role} />
          )}

          {currentPage === 'TOURNAMENTS' && (
            <TournamentsPage currentRole={currentAdmin.role} />
          )}

          {currentPage === 'DAILY_CHALLENGES' && (
            <DailyChallengePage currentRole={currentAdmin.role} />
          )}

          {currentPage === 'PRIZES_WINNERS' && (
            <PrizesPage currentRole={currentAdmin.role} />
          )}

          {currentPage === 'PLAYERS' && (
            <PlayersPage currentRole={currentAdmin.role} />
          )}

          {currentPage === 'SUBSCRIPTIONS' && (
            <SubscriptionsPage currentRole={currentAdmin.role} />
          )}

          {currentPage === 'ANTI_CHEAT' && (
            <AntiCheatPage currentRole={currentAdmin.role} />
          )}

          {currentPage === 'REPORTS' && (
            <ReportsPage currentRole={currentAdmin.role} />
          )}

          {currentPage === 'SETTINGS' && (
            <SettingsPage currentRole={currentAdmin.role} />
          )}

          {currentPage === 'ADMIN_USERS' && (
            <AdminUsersPage currentRole={currentAdmin.role} />
          )}

          {currentPage === 'AUDIT_LOG' && (
            <AuditLogPage />
          )}
        </main>
      </div>
    </div>
  );
}
