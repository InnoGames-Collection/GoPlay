import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  CheckCircle,
  AlertTriangle,
  Radio,
  Phone,
  HelpCircle,
  Shield,
  RefreshCw,
} from 'lucide-react';
import { ServiceSettings, AdminRole } from '../types';
import { api } from '../services/api';
import { ConfirmModal } from '../components/ConfirmModal';

interface SettingsPageProps {
  currentRole: AdminRole;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ currentRole }) => {
  const [settings, setSettings] = useState<ServiceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form fields
  const [serviceName, setServiceName] = useState('GameON Tele / GoPlay');
  const [shortcode, setShortcode] = useState('9898');
  const [subscriptionInstruction, setSubscriptionInstruction] = useState('Send OK to 9898 to activate daily gaming subscription for 2 ETB/day.');
  const [dailyPrice, setDailyPrice] = useState(2);
  const [dailyChallengeEnabled, setDailyChallengeEnabled] = useState(true);
  const [weeklyCompetitionEnabled, setWeeklyCompetitionEnabled] = useState(true);
  const [autoFinalizeWinners, setAutoFinalizeWinners] = useState(true);
  const [telebirrDisbursementEnabled, setTelebirrDisbursementEnabled] = useState(true);
  const [antiCheatSensitivity, setAntiCheatSensitivity] = useState<'STRICT' | 'STANDARD' | 'LENIENT'>('STANDARD');
  const [maxVelocityThreshold, setMaxVelocityThreshold] = useState(50);
  const [supportContact, setSupportContact] = useState('support@innogames.et • Shortcode 9898');
  const [serviceNoticeBanner, setServiceNoticeBanner] = useState('Welcome to GoPlay! Compete in weekly tournaments and claim Telebirr cash rewards.');

  const [confirmOpen, setConfirmOpen] = useState(false);

  const isSuperAdmin = currentRole === 'SUPER_ADMIN';

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getSettings();
      setSettings(data);
      setServiceName(data.serviceName);
      setShortcode(data.shortcode);
      setSubscriptionInstruction(data.subscriptionInstruction);
      setDailyPrice(data.dailySubscriptionPriceBirr);
      setDailyChallengeEnabled(data.dailyChallengeEnabled);
      setWeeklyCompetitionEnabled(data.weeklyCompetitionEnabled);
      setAutoFinalizeWinners(data.autoFinalizeWinners ?? true);
      setTelebirrDisbursementEnabled(data.telebirrDisbursementEnabled);
      setAntiCheatSensitivity(data.antiCheatSensitivity || 'STANDARD');
      setMaxVelocityThreshold(data.maxVelocityThreshold || 50);
      setSupportContact(data.supportContact);
      setServiceNoticeBanner(data.serviceNoticeBanner);
    } catch (err: any) {
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (reason: string) => {
    try {
      await api.updateSettings(
        {
          serviceName,
          shortcode,
          subscriptionInstruction,
          dailySubscriptionPriceBirr: Number(dailyPrice),
          dailyChallengeEnabled,
          weeklyCompetitionEnabled,
          autoFinalizeWinners,
          telebirrDisbursementEnabled,
          antiCheatSensitivity,
          maxVelocityThreshold: Number(maxVelocityThreshold),
          supportContact,
          serviceNoticeBanner,
        },
        reason
      );
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
      await loadSettings();
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        Loading service configuration...
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
          <Settings className="w-5 h-5 text-slate-700" />
          <span>VAS Service & Telecom Compliance Settings</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure authoritative Ethio Telecom Shortcode 9898 parameters, billing limits, and anti-cheat thresholds.
        </p>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Service configuration updated successfully and recorded to compliance audit log.</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100 text-xs">
        {/* Section 1: Telecom Identity */}
        <div className="p-6 space-y-4">
          <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-blue-700">
            1. Telecom VAS & Brand Identification
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Service Brand Name</label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Ethio Telecom Shortcode</label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={shortcode}
                onChange={(e) => setShortcode(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 font-mono text-xs text-slate-800 disabled:bg-slate-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Daily Subscription Tariff (ETB)</label>
            <input
              type="number"
              disabled={!isSuperAdmin}
              value={dailyPrice}
              onChange={(e) => setDailyPrice(Number(e.target.value))}
              className="w-full max-w-xs border border-slate-300 rounded-lg p-2.5 font-mono text-xs text-slate-800 disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Subscription Instruction (SMS / USSD)</label>
            <textarea
              disabled={!isSuperAdmin}
              value={subscriptionInstruction}
              onChange={(e) => setSubscriptionInstruction(e.target.value)}
              rows={2}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 disabled:bg-slate-50"
            />
          </div>
        </div>

        {/* Section 2: Anti-Cheat & Tournament Engine */}
        <div className="p-6 space-y-4">
          <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-indigo-700">
            2. Anti-Cheat Engine & Automated Settlement Rules
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Anti-Cheat Sensitivity</label>
              <select
                disabled={!isSuperAdmin}
                value={antiCheatSensitivity}
                onChange={(e) => setAntiCheatSensitivity(e.target.value as any)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 disabled:bg-slate-50"
              >
                <option value="STRICT">Strict (Zero Tolerance, Auto-Flag &gt; 35 pts/s)</option>
                <option value="STANDARD">Standard (Flag &gt; 50 pts/s)</option>
                <option value="LENIENT">Lenient (Flag &gt; 75 pts/s)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Max Velocity Threshold (Points/Sec)</label>
              <input
                type="number"
                disabled={!isSuperAdmin}
                value={maxVelocityThreshold}
                onChange={(e) => setMaxVelocityThreshold(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg p-2.5 font-mono text-xs text-slate-800 disabled:bg-slate-50"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                disabled={!isSuperAdmin}
                checked={autoFinalizeWinners}
                onChange={(e) => setAutoFinalizeWinners(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-semibold text-slate-800">Automatic Winner Finalization</span>
                <span className="block text-[11px] text-slate-500">Automatically settle tournament winners at deadline via cron.</span>
              </div>
            </label>

            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                disabled={!isSuperAdmin}
                checked={telebirrDisbursementEnabled}
                onChange={(e) => setTelebirrDisbursementEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-semibold text-slate-800">Telebirr B2C Automated Payout Gateway</span>
                <span className="block text-[11px] text-slate-500">Transmit prize disbursement requests directly to Telebirr API.</span>
              </div>
            </label>
          </div>
        </div>

        {/* Section 3: Support Contact & Banner */}
        <div className="p-6 space-y-4">
          <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-emerald-700">
            3. Customer Support & In-App Announcements
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Official Support Contact</label>
            <input
              type="text"
              disabled={!isSuperAdmin}
              value={supportContact}
              onChange={(e) => setSupportContact(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Global Player Service Notice Banner</label>
            <textarea
              disabled={!isSuperAdmin}
              value={serviceNoticeBanner}
              onChange={(e) => setServiceNoticeBanner(e.target.value)}
              rows={2}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 disabled:bg-slate-50"
            />
          </div>
        </div>
      </div>

      {isSuperAdmin && (
        <div className="flex justify-end">
          <button
            onClick={() => setConfirmOpen(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-2 shadow-sm cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration Changes</span>
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleSave}
        title="Update Authoritative Service Settings"
        actionName="Modify Shortcode 9898 and Telebirr Gateway Configuration"
        warningNote="Modifying these settings alters active subscriber billing parameters and anti-cheat enforcement thresholds."
      />
    </div>
  );
};
