/**
 * GoPlay - Coin Purchase Wallet
 * Connects directly to Telebirr C2B billing API on port 3302.
 */

import React, { useState } from 'react';
import { UserProfile } from '../types';
import { apiService } from '../services/apiService';
import { StorageService } from '../services/storageService';
import { 
  X, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface CoinTopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onProfileUpdate: (updated: UserProfile) => void;
}

const COIN_PACKAGES = [
  { id: 'COIN_PACK_10' as const, coins: 10, priceETB: 10 },
  { id: 'COIN_PACK_25' as const, coins: 25, priceETB: 25 },
  { id: 'COIN_PACK_50' as const, coins: 50, priceETB: 50 },
];

export const CoinTopupModal: React.FC<CoinTopupModalProps> = ({
  isOpen,
  onClose,
  profile,
  onProfileUpdate,
}) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedPack = COIN_PACKAGES[selectedIdx];

  const handlePurchase = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsProcessing(true);

    try {
      const res = await apiService.buyCoins(selectedPack.id);

      if (!res.success) {
        setErrorMsg(res.message || 'Telebirr payment initiation failed. Please try again.');
        setIsProcessing(false);
        return;
      }

      if (res.checkoutUrl) {
        setSuccessMsg('Redirecting to Telebirr Checkout...');
        setTimeout(() => {
          window.location.href = res.checkoutUrl!;
        }, 600);
        return;
      }

      // If sandbox or direct fulfillment, fetch updated profile from PostgreSQL
      const fresh = await apiService.getProfile();
      if (fresh) {
        StorageService.saveProfile(fresh);
        onProfileUpdate(fresh);
      }

      setSuccessMsg(`Successfully credited ${selectedPack.coins} GoPlay Coins!`);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error communicating with Telebirr gateway.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200 select-none">
      <div 
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-6 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#1688C9] text-white p-4 sm:p-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black tracking-tight">GoPlay Coins</h3>
            <p className="text-xs text-blue-100 font-medium mt-0.5">
              Choose a Telebirr Package
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 3 Clean Selectable Packages */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {COIN_PACKAGES.map((pkg, idx) => {
              const isSelected = selectedIdx === idx;
              return (
                <button
                  key={pkg.coins}
                  type="button"
                  onClick={() => setSelectedIdx(idx)}
                  className={`relative p-3.5 sm:p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                    isSelected
                      ? 'border-[#8BCB3D] bg-lime-50/70 shadow-md ring-2 ring-[#8BCB3D] -translate-y-0.5'
                      : 'border-slate-200 hover:border-slate-300 bg-white shadow-2xs'
                  }`}
                >
                  <div className="text-2xl sm:text-3xl mb-1">🪙</div>
                  <div className="text-xs sm:text-sm font-black text-[#17202A] tracking-tight uppercase">
                    {pkg.priceETB} BIRR
                  </div>
                  <div className="text-[11px] sm:text-xs font-bold text-slate-500 mt-0.5 uppercase">
                    {pkg.coins} COINS
                  </div>
                </button>
              );
            })}
          </div>

          {/* Dynamic Purchase Action */}
          <button
            onClick={handlePurchase}
            disabled={isProcessing}
            className="w-full py-3.5 px-4 rounded-xl bg-[#8BCB3D] hover:bg-[#7cb934] active:scale-[0.99] text-white font-black text-sm tracking-wide transition-all shadow-md flex items-center justify-center cursor-pointer uppercase"
          >
            {isProcessing ? (
              <span className="inline-block animate-pulse">Processing with Telebirr...</span>
            ) : (
              <span>BUY {selectedPack.coins} COINS</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
