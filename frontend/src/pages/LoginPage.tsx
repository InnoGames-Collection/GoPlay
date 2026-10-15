/**
 * telebirr SuperApp Game Center Official Login Screen
 * 
 * Implements the official Telebirr Single Sign-On (SSO) Handshake
 * according to Workflow 3 (Direct Carrier Authentication).
 * 
 * - WHITE background (#FFFFFF)
 * - BLUE telebirr accents (#0057A8)
 * - GREEN GoPlay accents (#78BE20 / #82C341)
 * - Direct carrier authentication without SMS OTP codes
 * - Fast Persona selection for regulatory auditors and live testing
 */

import React, { useState } from 'react';
import { UserProfile } from '../types';
import { AuthService } from '../services/authService';
import { 
  Menu, 
  Phone, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Crown,
  UserCheck,
  Loader2
} from 'lucide-react';
import { DEMO_TEST_PERSONAS } from '../data/portalConfig';
import { GoPlayLogo } from '../components/GoPlayLogo';

interface LoginPageProps {
  onLoginSuccess: (profile: UserProfile) => void;
  onOpenSubscribe: () => void;
  onOpenMenu?: () => void;
  showToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, desc?: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onOpenSubscribe,
  onOpenMenu,
  showToast,
}) => {
  const vipPersona = DEMO_TEST_PERSONAS.find((p) => p.id === 'vip') || DEMO_TEST_PERSONAS[0];
  const freePersona = DEMO_TEST_PERSONAS.find((p) => p.id === 'free') || DEMO_TEST_PERSONAS[1];

  const [phoneNumber, setPhoneNumber] = useState(vipPersona.phone);
  const [selectedPersona, setSelectedPersona] = useState<'vip' | 'free' | 'custom'>('vip');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const handleSelectPersona = (persona: 'vip' | 'free', phone: string) => {
    setSelectedPersona(persona);
    setPhoneNumber(phone);
    setInlineError(null);
  };

  const handleTelebirrSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineError(null);
    if (!phoneNumber || phoneNumber.trim().length < 8) {
      setInlineError('Please enter a valid Ethiopian mobile number.');
      return;
    }

    setIsAuthenticating(true);

    try {
      const res = await AuthService.loginWithTeleBirr(phoneNumber.trim());
      if (res.success && res.profile) {
        // Successful sign-in updates session silently without intrusive top popups
        onLoginSuccess(res.profile);
      } else {
        setInlineError(res.message || 'Unable to connect to telebirr gateway.');
        setIsAuthenticating(false);
      }
    } catch (err: any) {
      setInlineError(err?.message || 'Failed to authenticate with telebirr.');
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between p-4 sm:p-6 font-['Plus_Jakarta_Sans',sans-serif] select-none">
      
      {/* 1. TOP BAR: GoPlay Official Branding */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <GoPlayLogo size="sm" />
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#82C341]/15 text-[#659C28] font-black uppercase tracking-wider">
            Game Center
          </span>
        </div>

        {onOpenMenu && (
          <button
            id="login-main-menu-btn"
            type="button"
            onClick={onOpenMenu}
            aria-label="Open GoPlay Menu"
            className="p-1.5 rounded-xl text-[#17202A] hover:bg-slate-100 active:scale-95 transition-colors cursor-pointer"
            title="Menu"
          >
            <Menu className="w-5 h-5 stroke-[2.2]" />
          </button>
        )}
      </div>

      {/* 2. MAIN CONTAINER */}
      <div className="w-full max-w-md mx-auto my-auto space-y-4 py-2">
        
        {/* Promotional Banner */}
        <div 
          id="login-promo-banner"
          className="relative rounded-3xl bg-[#0057A8] text-white p-5 shadow-lg overflow-hidden border border-blue-800"
        >
          <div className="relative z-10 space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#78BE20] text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
              <Sparkles className="w-3 h-3" />
              <span>OFFICIAL TELEBIRR SUPERAPP GAMING</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
              Play & Win Cash Prizes on telebirr
            </h1>

            <p className="text-xs text-blue-100 leading-relaxed max-w-xs">
              Compete in weekly tournaments, climb national leaderboards, and claim instant Telebirr wallet rewards.
            </p>
          </div>

          <div className="absolute -right-6 -bottom-8 w-28 h-28 bg-[#78BE20]/20 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Compact White Sign In Card */}
        <div 
          id="login-signin-card"
          className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-md space-y-4"
        >
          {isAuthenticating ? (
            /* Workflow 3: "Getting your info..." Loading Screen */
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-5 animate-in fade-in">
              <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-200 shadow-inner flex items-center justify-center relative">
                <Loader2 className="w-9 h-9 text-[#82C341] animate-spin" />
                <div className="absolute inset-0 rounded-3xl border-2 border-[#82C341]/30 animate-ping pointer-events-none" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Getting your info...
                </h3>
                <p className="text-xs text-slate-500 max-w-xs">
                  Connecting carrier session for <span className="font-mono font-bold text-[#0057A8]">{phoneNumber}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-[#78BE20] font-semibold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>telebirr Game Center Single Sign-On</span>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Sign In with telebirr
                </h2>
                <p className="text-xs text-slate-500">
                  Select a verified telebirr persona or enter your registered mobile number.
                </p>
              </div>

              {/* Persona Quick Selectors */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Test / Auditor Personas:
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectPersona('vip', vipPersona.phone)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      selectedPersona === 'vip' && phoneNumber === vipPersona.phone
                        ? 'border-[#0057A8] bg-blue-50/70 ring-2 ring-[#0057A8]/30 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-slate-900">{vipPersona.phone}</span>
                      <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    </div>
                    <div className="text-[10px] text-blue-700 font-extrabold uppercase">
                      {vipPersona.badge}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {vipPersona.description}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPersona('free', freePersona.phone)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      selectedPersona === 'free' && phoneNumber === freePersona.phone
                        ? 'border-[#82C341] bg-[#DFF7EA]/50 ring-2 ring-[#82C341]/30 shadow-xs'
                        : 'border-[#DCE7E8] hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-[#183345]">{freePersona.phone}</span>
                      <UserCheck className="w-3.5 h-3.5 text-[#607582]" />
                    </div>
                    <div className="text-[10px] text-[#82C341] font-extrabold uppercase">
                      {freePersona.badge}
                    </div>
                    <div className="text-[10px] text-[#607582]">
                      {freePersona.description}
                    </div>
                  </button>
                </div>
              </div>

              {/* Phone Form */}
              <form onSubmit={handleTelebirrSignIn} className="space-y-3.5">
                {inlineError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{inlineError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-[#183345] uppercase tracking-wider">
                    Mobile Number (MSISDN):
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[#607582] font-bold text-xs">
                      <Phone className="w-4 h-4 text-[#087F8C]" />
                      <span>+251</span>
                    </div>
                    <input
                      id="login-phone-input"
                      type="tel"
                      value={phoneNumber.replace(/^\+251\s?/, '')}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value);
                        setSelectedPersona('custom');
                        setInlineError(null);
                      }}
                      placeholder="91 123 4567"
                      required
                      className="w-full pl-20 pr-4 py-3 bg-[#F4F7F6] border border-[#DCE7E8] rounded-2xl text-[#183345] font-mono text-sm font-semibold focus:border-[#087F8C] focus:bg-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Primary Button: Direct Telebirr Sign In */}
                <button
                  id="login-signin-submit-btn"
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-[#82C341] hover:bg-[#72af36] text-white font-black text-sm active:scale-[0.98] transition-all shadow-xs flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>SIGN IN WITH TELEBIRR</span>
                </button>
              </form>

              {/* Secondary Action: Subscribe Button */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <button
                  id="login-subscribe-btn"
                  type="button"
                  onClick={onOpenSubscribe}
                  className="w-full py-3 rounded-2xl bg-white border-2 border-[#78BE20] text-[#78BE20] hover:bg-emerald-50/50 font-black text-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer shadow-sm"
                >
                  <span>SUBSCRIBE TO GAMING PASS</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-[#78BE20]" />
          <span>Secured via telebirr SuperApp Container Bridge</span>
        </div>
      </div>

      {/* 3. BOTTOM FOOTER */}
      <div className="w-full max-w-md mx-auto text-center py-2 text-[11px] text-slate-400 font-medium">
        <span>Official VAS Service • Shortcode 977 • EthioTelecom telebirr SuperApp</span>
      </div>
    </div>
  );
};
