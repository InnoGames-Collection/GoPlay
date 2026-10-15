/**
 * telebirr SuperApp SSO Authentication Modal
 * 
 * Implements the official Telebirr Game Center Single Sign-On (SSO) Handshake
 * according to Workflow 3 (Direct Carrier Authentication).
 * 
 * Flow:
 * 1. Inside telebirr SuperApp: Authentication is handled automatically via carrier session token / MSISDN.
 * 2. In Standalone / Auditor Browser Mode: Displays the telebirr SSO Consent & Persona Selector
 *    (Pre-seeded DB personas: 0977057270 VIP and 0911998890 Free) or custom MSISDN.
 * 3. On confirmation, displays the "Getting your info..." loading transition, calls
 *    POST /api/auth/telebirr-login, and loads the authoritative profile.
 * 
 * ZERO SMS OTP or client-side verification required.
 */

import React, { useState } from 'react';
import { UserProfile } from '../types';
import { AuthService } from '../services/authService';
import { 
  X, 
  Phone, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  Loader2,
  Crown,
  UserCheck
} from 'lucide-react';
import { DEMO_TEST_PERSONAS } from '../data/portalConfig';
import { GoPlayLogo } from './GoPlayLogo';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (profile: UserProfile) => void;
  onOpenSubscribe?: () => void;
  showToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, desc?: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  onClose, 
  onSuccess, 
  onOpenSubscribe,
  showToast 
}) => {
  const vipPersona = DEMO_TEST_PERSONAS.find((p) => p.id === 'vip') || DEMO_TEST_PERSONAS[0];
  const freePersona = DEMO_TEST_PERSONAS.find((p) => p.id === 'free') || DEMO_TEST_PERSONAS[1];

  const [phoneNumber, setPhoneNumber] = useState(vipPersona.phone);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<'vip' | 'free' | 'custom'>('vip');
  const [inlineError, setInlineError] = useState<string | null>(null);

  const handleSelectPersona = (persona: 'vip' | 'free', phone: string) => {
    setSelectedPersona(persona);
    setPhoneNumber(phone);
    setInlineError(null);
  };

  const handleTelebirrSSO = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setInlineError(null);
    if (!phoneNumber || phoneNumber.trim().length < 8) {
      setInlineError('Please provide a valid Ethiopian mobile number.');
      return;
    }

    setIsAuthenticating(true);

    try {
      const res = await AuthService.loginWithTeleBirr(phoneNumber.trim());

      if (res.success && res.profile) {
        // Successful sign-in updates session silently without intrusive top popups
        onSuccess(res.profile);
        onClose();
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
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in select-none">
      <div className="w-full max-w-md bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-2xl p-5 sm:p-6 relative my-6 font-['Plus_Jakarta_Sans',sans-serif]">
        
        {/* Close Button (Hidden while connecting) */}
        {!isAuthenticating && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Top Header: GoPlay Official Branding */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <GoPlayLogo size="xs" />
          </div>

          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Game Center
          </div>
        </div>

        {/* VIEW 1: "Getting your info..." - Official Workflow 3 Loading Transition */}
        {isAuthenticating ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-5 animate-in fade-in">
            {/* Pulsing Loading Container */}
            <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-200 shadow-inner flex items-center justify-center relative">
              <Loader2 className="w-9 h-9 text-[#82C341] animate-spin" />
              <div className="absolute inset-0 rounded-3xl border-2 border-[#82C341]/30 animate-ping pointer-events-none" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Getting your info...
              </h3>
              <p className="text-xs text-slate-500 max-w-xs">
                Authorizing secure telebirr SuperApp session for <span className="font-mono font-bold text-[#0057A8]">{phoneNumber}</span>
              </p>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-[#78BE20] font-semibold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Direct Carrier Single Sign-On</span>
            </div>
          </div>
        ) : (
          /* VIEW 2: telebirr SSO Consent & Persona Selector */
          <div className="space-y-4">
            
            {/* Promotional Banner */}
            <div className="relative rounded-2xl bg-[#0057A8] text-white p-4 shadow-md overflow-hidden border border-blue-800">
              <div className="relative z-10 space-y-1">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#78BE20] text-white text-[9px] font-black uppercase tracking-wider">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>OFFICIAL TELEBIRR SUPERAPP GAMING</span>
                </div>
                <h3 className="text-base font-black text-white leading-tight">
                  Sign in with telebirr
                </h3>
                <p className="text-[11px] text-blue-100 leading-snug">
                  Direct carrier authentication. Zero SMS verification codes required.
                </p>
              </div>
            </div>

            {/* Persona Quick Selectors (Seeded Database Accounts for Auditors) */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Select telebirr Persona:
              </label>

              <div className="grid grid-cols-2 gap-2">
                {/* VIP Persona Button */}
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

                {/* Free Persona Button */}
                <button
                  type="button"
                  onClick={() => handleSelectPersona('free', freePersona.phone)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedPersona === 'free' && phoneNumber === freePersona.phone
                      ? 'border-[#0057A8] bg-blue-50/70 ring-2 ring-[#0057A8]/30 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-slate-900">{freePersona.phone}</span>
                    <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <div className="text-[10px] text-emerald-700 font-extrabold uppercase">
                    {freePersona.badge}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {freePersona.description}
                  </div>
                </button>
              </div>
            </div>

            {/* Custom MSISDN Input */}
            <form onSubmit={handleTelebirrSSO} className="space-y-3">
              {inlineError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{inlineError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Mobile Station ID (MSISDN):
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-500 font-bold text-xs">
                    <Phone className="w-4 h-4 text-[#087F8C]" />
                    <span>+251</span>
                  </div>
                  <input
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

              {/* Primary Action Button: Direct Telebirr Sign In */}
              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-3.5 rounded-2xl bg-[#82C341] hover:bg-[#72af36] text-white font-black text-sm active:scale-[0.98] transition-all shadow-xs flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>SIGN IN WITH TELEBIRR</span>
              </button>
            </form>

            {/* Footer Regulatory Assurance */}
            <div className="pt-2 border-t border-[#DCE7E8] flex items-center justify-center gap-1.5 text-[11px] text-[#607582]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#82C341]" />
              <span>Secured by telebirr SuperApp Container Bridge</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
