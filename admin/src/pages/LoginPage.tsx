import React, { useState } from 'react';
import { Lock, Mail, ShieldCheck, Eye, EyeOff, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';
import { api } from '../services/api';
import { AdminUser } from '../types';

interface LoginPageProps {
  onLoginSuccess: (admin: AdminUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('superadmin');
  const [password, setPassword] = useState('GoPlay@Admin2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Please enter both administrative username/email and password.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await api.login(username.trim(), password);
      if (res.success && res.admin) {
        onLoginSuccess(res.admin);
      } else {
        setErrorMessage('Authentication failed. Please verify credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error. Contact Telecom Security Officer.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-[#050D1A] p-4 font-sans select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Top Glow Element */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#82C341] via-[#1688C9] to-amber-500" />

        {/* Brand & Heading */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#82C341] to-[#1688C9] text-white font-black text-2xl shadow-lg shadow-sky-500/20 mb-2">
            GP
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">GOPLAY ADMIN PORTAL</h2>
          <p className="text-xs text-slate-400">
            Telecom Value Added Services (VAS) • Shortcode 9898 Control Plane
          </p>
          <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono text-emerald-400">
            Official EthioTelecom & Telebirr Gaming Gateway
          </div>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start space-x-2.5 text-xs text-rose-300 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Operator Username / Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="superadmin or operator@goplay.et"
                required
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Administrative Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  <span>Authenticate Session</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Quick Persona Switcher for Development & Staging */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2.5 flex items-center justify-center space-x-1.5">
            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Authorized Personas (1-Click Fill)</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-left">
            <button
              type="button"
              onClick={() => handleSelectPreset('superadmin', 'GoPlay@Admin2026!')}
              className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors cursor-pointer group"
            >
              <div className="text-[11px] font-bold text-white group-hover:text-blue-400">Super Admin</div>
              <div className="text-[10px] text-slate-400 font-mono">Full Access</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('tourn_operator', 'GoPlay@Operator2026!')}
              className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors cursor-pointer group"
            >
              <div className="text-[11px] font-bold text-white group-hover:text-emerald-400">Tourn Operator</div>
              <div className="text-[10px] text-slate-400 font-mono">Games & Tourns</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('goplay_auditor', 'GoPlay@Auditor2026!')}
              className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors cursor-pointer group"
            >
              <div className="text-[11px] font-bold text-white group-hover:text-amber-400">Financial Auditor</div>
              <div className="text-[10px] text-slate-400 font-mono">Ledgers & PII</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('support_agent', 'GoPlay@Support2026!')}
              className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors cursor-pointer group"
            >
              <div className="text-[11px] font-bold text-white group-hover:text-sky-400">Support Agent</div>
              <div className="text-[10px] text-slate-400 font-mono">Subscribers & Ban</div>
            </button>
          </div>
        </div>

        {/* Security Footer Notice */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center space-y-1">
          <p className="text-[11px] text-slate-500 flex items-center justify-center space-x-1.5 font-mono">
            <span>Locked after 5 failed attempts • 8h JWT lifespan</span>
          </p>
          <p className="text-[10px] text-slate-600">
            All administrative actions are permanently logged to immutable PostgreSQL WORM ledger.
          </p>
        </div>
      </div>
    </div>
  );
};
