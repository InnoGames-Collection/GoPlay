/**
 * GameON Tele - Telebirr SuperApp In-App Subscription & Passes
 * 
 * Compliant with GameON Tele specifications:
 * - NO SMS shortcode flows, no 977, no "Send OK".
 * - Direct in-app telebirr SuperApp wallet billing.
 * - Manages active game subscriptions and passes with expiration tracking.
 */

import React, { useState } from 'react';
import { UserProfile, SubscriptionPlan } from '../../types';
import { EntitlementService } from '../../services/entitlementService';
import { StorageService } from '../../services/storageService';
import { apiService } from '../../services/apiService';
import { 
  CreditCard, 
  ArrowLeft, 
  CheckCircle2, 
  ShieldCheck, 
  Wallet, 
  Calendar,
  AlertCircle,
  Sparkles,
  Zap
} from 'lucide-react';

interface SubscriptionPageProps {
  onBack?: () => void;
  showHeader?: boolean;
  profile?: UserProfile;
  onProfileUpdate?: (updated: UserProfile) => void;
}

const ALL_ACCESS_PASSES: {
  id: 'daily' | 'weekly' | 'monthly';
  name: string;
  priceETB: number;
  period: string;
  features: string[];
}[] = [
  {
    id: 'daily',
    name: 'Daily',
    priceETB: 5,
    period: '24 Hours',
    features: [
      'Full game access for 24 hours',
    ],
  },
  {
    id: 'weekly',
    name: 'Weekly',
    priceETB: 20,
    period: '7 Days',
    features: [
      'Full game access for 7 days',
    ],
  },
  {
    id: 'monthly',
    name: 'Monthly',
    priceETB: 50,
    period: '30 Days',
    features: [
      'Full game access for 30 days',
    ],
  },
];

export const SubscriptionPage: React.FC<SubscriptionPageProps> = ({
  onBack,
  showHeader = true,
  profile,
  onProfileUpdate,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeSubs = EntitlementService.getActiveSubscriptionsList();

  const handleSubscribe = async (pass: typeof ALL_ACCESS_PASSES[0]) => {
    if (!profile) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsProcessing(true);

    try {
      const res = await apiService.activateSubscription(pass.id);
      if (res.success) {
        if (res.checkoutUrl) {
          setSuccessMsg('Redirecting to Telebirr Checkout...');
          setTimeout(() => {
            window.location.href = res.checkoutUrl!;
          }, 600);
          return;
        }
        const fresh = await apiService.getProfile();
        if (fresh) {
          StorageService.saveProfile(fresh);
          if (onProfileUpdate) {
            onProfileUpdate(fresh);
          }
        }
        setSuccessMsg(`Successfully activated ${pass.name} subscription via telebirr!`);
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.message || 'Telebirr subscription initiation failed.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error communicating with Telebirr gateway.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F6] text-[#183345] pb-24 max-w-md md:max-w-xl lg:max-w-3xl mx-auto px-3.5 pt-3 select-none">
      {/* 1. Header with Back Button */}
      {showHeader && (
        <div className="flex items-center justify-between gap-3 bg-[#102B3F] text-white p-3.5 rounded-2xl shadow-xs mb-4 border border-[#116B73]/40">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                id="subscription-back-btn"
                onClick={onBack}
                className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
                title="Go Back"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#82C341] shrink-0" />
              <h1 className="text-base font-black tracking-tight">Subscription</h1>
            </div>
          </div>
        </div>
      )}

      {/* 2. Telebirr Mini-App Informational Notice */}
      <div className="p-3.5 mb-4 rounded-2xl bg-[#DFF7EA]/70 border border-[#82C341]/40 text-[#116B73] text-xs flex items-center gap-2.5 shadow-2xs">
        <ShieldCheck className="w-5 h-5 text-[#82C341] shrink-0" />
        <div className="leading-relaxed">
          <strong className="text-[#102B3F] font-bold">Telebirr Mini-App Access: </strong>
          Subscriptions and tournament access are managed directly through your Telebirr session. In-app package purchase actions are disabled.
        </div>
      </div>

      {/* 3. Active Subscriptions Overview */}
      {profile?.subscription?.isActive && (
        <div className="p-4 rounded-2xl bg-white border border-[#82C341]/40 shadow-2xs mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#82C341]" />
              <span className="text-xs font-black text-[#102B3F] uppercase tracking-wide">
                Current Active Subscription
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#82C341] text-white text-[9px] font-black uppercase tracking-wider">
              ACTIVE
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div>
              <h3 className="text-base font-black text-[#183345] capitalize">
                {profile.subscription.plan} Subscription
              </h3>
              <p className="text-[11px] text-[#607582]">
                Pre-authenticated via Telebirr SuperApp
              </p>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-[#607582] font-bold uppercase">Status</div>
              <div className="text-xs font-black text-[#82C341]">Active</div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Telebirr Wallet Balance Summary */}
      {profile && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-[#DCE7E8] text-xs mb-4 shadow-2xs">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#087F8C]" />
            <span className="font-bold text-[#607582]">telebirr Wallet Balance</span>
          </div>
          <span className="font-black text-[#183345] font-mono">
            {profile.telebirrBalance.toFixed(2)} ETB
          </span>
        </div>
      )}

      {/* 5. Available Packages (Daily, Weekly, Monthly) */}
      <div className="space-y-3">
        <div className="text-xs font-black uppercase text-[#607582] tracking-wider px-1">
          Subscription Packages (Informational)
        </div>

        {ALL_ACCESS_PASSES.map((pass) => (
          <div
            key={pass.id}
            className="p-4 rounded-2xl border border-[#DCE7E8] bg-white shadow-2xs transition-all relative"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <h4 className="text-base font-black text-[#183345]">{pass.name}</h4>
                <span className="text-[11px] text-[#607582] font-medium">{pass.period}</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-[#087F8C] font-mono">{pass.priceETB} Birr</span>
              </div>
            </div>

            <ul className="mt-2.5 space-y-1 text-xs text-[#607582]">
              {pass.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#82C341] shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            {/* Visibly and semantically disabled button - cannot trigger purchase */}
            <button
              type="button"
              disabled={true}
              aria-disabled="true"
              className="mt-3.5 w-full py-2.5 rounded-xl bg-[#F4F7F6] text-[#607582] border border-[#DCE7E8] font-black text-xs flex items-center justify-center gap-1.5 cursor-not-allowed opacity-85 select-none"
              title="Subscriptions are pre-authenticated through Telebirr SuperApp"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#087F8C]" />
              <span>Managed via Telebirr</span>
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-center gap-1.5 text-[10px] text-[#607582] font-bold">
        <ShieldCheck className="w-3.5 h-3.5 text-[#82C341]" />
        <span>Telebirr Mini-App Integration • Pre-Authenticated Carrier Billing</span>
      </div>
    </div>
  );
};
