/**
 * Emoji Fun — Feedback & Result Modals
 *
 * Implements:
 * - Question Correct Feedback with speed bonus breakdown
 * - Question Incorrect Feedback with correct answer reveal
 * - End of Attempt Result Screen showing:
 *   * Final score
 *   * Total questions
 *   * Answered questions
 *   * Unanswered questions
 *   * Correct answers
 *   * Accuracy & elapsed time
 *   * Working Retry, Back to Menu, and Next Level controls
 * - No Lives dialog and per-timeout failure popups removed per spec.
 */

import React from 'react';
import { TournamentScoreCalculation } from '../types';
import { X, Trophy, Clock, ArrowRight, RotateCcw, Home, CheckCircle2, HelpCircle } from 'lucide-react';
import { emojiAudio } from '../emojiAudio';

interface EmojiFunFeedbackModalProps {
  type: 'CORRECT' | 'INCORRECT' | 'LEVEL_CLEAR' | string;
  scoreResult?: TournamentScoreCalculation;
  correctAnswerText?: string;
  coinsEarned?: number;
  timeSpentFormatted?: string;
  accuracyPercent?: number;
  levelScore?: number;
  totalQuestions?: number;
  answeredCount?: number;
  unansweredCount?: number;
  correctCount?: number;
  totalTournamentScore?: number;
  userRank?: number;
  levelNumber?: number;
  onContinue: () => void;
  onRetry?: () => void;
  onBackToMenu?: () => void;
  onLeaderboard?: () => void;
  onClose?: () => void;
}

export const EmojiFunFeedbackModal: React.FC<EmojiFunFeedbackModalProps> = ({
  type,
  scoreResult,
  correctAnswerText,
  timeSpentFormatted = '00:00:30',
  accuracyPercent = 100,
  levelScore = 0,
  totalQuestions = 10,
  answeredCount = 10,
  unansweredCount = 0,
  correctCount = 0,
  totalTournamentScore = 0,
  userRank = 1,
  levelNumber = 1,
  onContinue,
  onRetry,
  onBackToMenu,
  onLeaderboard,
  onClose,
}) => {
  const handleMenuClick = () => {
    emojiAudio.playTap();
    if (onBackToMenu) {
      onBackToMenu();
    } else if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-xs sm:max-w-sm rounded-3xl bg-gradient-to-b from-[#f87171] via-[#fb7185] to-[#f43f5e] p-5 sm:p-6 shadow-2xl border-4 border-white/60 text-white flex flex-col items-center animate-in zoom-in-95 duration-200">
        {/* Optional Top-Right Close Button */}
        {(onClose || onBackToMenu) && type === 'LEVEL_CLEAR' && (
          <button
            onClick={handleMenuClick}
            className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 border-2 border-white shadow-md flex items-center justify-center text-white z-20 cursor-pointer"
            aria-label="Back to Menu"
          >
            <X className="w-5 h-5 font-black" />
          </button>
        )}

        {/* 1. CORRECT ANSWER FEEDBACK */}
        {type === 'CORRECT' && (
          <>
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-b from-[#ffe082] to-[#ffca28] border-4 border-white shadow-lg flex items-center justify-center text-5xl mb-2 animate-bounce">
              {scoreResult?.isPerfect ? '🤩' : '😎'}
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-center font-['Fredoka',sans-serif] tracking-wide mb-1 text-white drop-shadow">
              {scoreResult?.isPerfect ? 'PERFECT!' : 'Correct!'}
            </h3>

            {scoreResult && (
              <div className="w-full bg-white/20 backdrop-blur-md rounded-2xl p-2.5 my-2 border border-white/40 text-center text-xs sm:text-sm">
                <div className="flex items-center justify-between font-bold py-0.5 border-b border-white/20">
                  <span className="text-white/80">Base Score</span>
                  <span className="font-mono">+{scoreResult.basePoints} pts</span>
                </div>
                <div className="flex items-center justify-between font-bold py-0.5 border-b border-white/20">
                  <span className="text-white/80">Speed Bonus</span>
                  <span className="text-emerald-200 font-mono">
                    +{scoreResult.perfectBonusPoints} pts ({scoreResult.speedTier})
                  </span>
                </div>
                <div className="flex items-center justify-between font-black text-sm sm:text-base pt-1 text-yellow-300">
                  <span>POINTS WON</span>
                  <span className="font-mono">+{scoreResult.totalPointsAwarded} pts</span>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                emojiAudio.playTap();
                onContinue();
              }}
              className="w-full mt-2 py-3 px-6 rounded-2xl bg-gradient-to-b from-[#4fc3f7] via-[#29b6f6] to-[#0288d1] border-b-[5px] border-[#01579b] active:border-b-2 active:translate-y-1 text-white font-black text-lg sm:text-xl tracking-wider uppercase font-['Fredoka',sans-serif] shadow-xl hover:brightness-105 transition-all cursor-pointer"
            >
              Continue
            </button>
          </>
        )}

        {/* 2. INCORRECT ANSWER FEEDBACK */}
        {type === 'INCORRECT' && (
          <>
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-b from-[#ffe082] to-[#ffca28] border-4 border-white shadow-lg flex items-center justify-center text-5xl mb-2">
              😐
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-center font-['Fredoka',sans-serif] tracking-wide mb-1 text-white drop-shadow">
              Incorrect!
            </h3>

            <p className="text-xs sm:text-sm font-bold text-center text-white/90 mb-1">
              Keep going, practice makes perfect!
            </p>

            {correctAnswerText && (
              <div className="w-full bg-black/25 rounded-2xl p-2.5 my-2 text-center border border-white/20">
                <span className="text-[11px] font-bold uppercase text-amber-200 block">
                  Correct Answer:
                </span>
                <span className="text-sm font-black text-white">{correctAnswerText}</span>
              </div>
            )}

            <button
              onClick={() => {
                emojiAudio.playTap();
                onContinue();
              }}
              className="w-full mt-2 py-3 px-6 rounded-2xl bg-gradient-to-b from-[#4fc3f7] via-[#29b6f6] to-[#0288d1] border-b-[5px] border-[#01579b] active:border-b-2 active:translate-y-1 text-white font-black text-lg sm:text-xl tracking-wider uppercase font-['Fredoka',sans-serif] shadow-xl hover:brightness-105 transition-all cursor-pointer"
            >
              OK
            </button>
          </>
        )}

        {/* 3. END-OF-ATTEMPT FINAL RESULT SCREEN */}
        {type === 'LEVEL_CLEAR' && (
          <>
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-b from-[#ffe082] to-[#ffca28] border-4 border-white shadow-lg flex items-center justify-center text-5xl mb-2 animate-bounce">
              {correctCount >= Math.ceil(totalQuestions / 2) ? '🏆' : '👍'}
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-center font-['Fredoka',sans-serif] tracking-wider mb-2 text-white drop-shadow uppercase">
              LEVEL {levelNumber} RESULT
            </h3>

            {/* Complete Statistics Box: Final Score, Total, Answered, Unanswered, Correct */}
            <div className="w-full bg-white/20 backdrop-blur-md rounded-2xl p-3 my-2 border border-white/40 space-y-1.5 text-xs sm:text-sm">
              {/* Final Score */}
              <div className="flex items-center justify-between bg-white/25 px-3 py-1.5 rounded-xl font-bold">
                <span className="text-white">Final Score</span>
                <span className="font-mono text-yellow-300 font-black text-base">
                  {levelScore.toLocaleString()} pts
                </span>
              </div>

              {/* Total Questions */}
              <div className="flex items-center justify-between bg-white/15 px-3 py-1 rounded-xl font-bold">
                <span className="text-white/90">Total Questions</span>
                <span className="font-mono text-white font-black">{totalQuestions}</span>
              </div>

              {/* Answered Questions */}
              <div className="flex items-center justify-between bg-white/15 px-3 py-1 rounded-xl font-bold">
                <span className="text-white/90">Answered Questions</span>
                <span className="font-mono text-sky-200 font-black">{answeredCount}</span>
              </div>

              {/* Unanswered Questions */}
              <div className="flex items-center justify-between bg-white/15 px-3 py-1 rounded-xl font-bold">
                <span className="text-white/90 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-pink-200" />
                  Unanswered Questions
                </span>
                <span className="font-mono text-pink-200 font-black">{unansweredCount}</span>
              </div>

              {/* Correct Answers */}
              <div className="flex items-center justify-between bg-white/15 px-3 py-1 rounded-xl font-bold">
                <span className="text-white/90 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  Correct Answers
                </span>
                <span className="font-mono text-emerald-300 font-black">
                  {correctCount} / {totalQuestions}
                </span>
              </div>

              {/* Accuracy & Time */}
              <div className="flex items-center justify-between bg-white/15 px-3 py-1 rounded-xl font-bold">
                <span className="text-white/90 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-sky-200" /> Time Spent
                </span>
                <span className="font-mono text-white font-bold">{timeSpentFormatted}</span>
              </div>
            </div>

            {/* Action Buttons: Next Level, Retry, Back to Menu */}
            <div className="w-full flex flex-col gap-2 mt-2">
              {levelNumber < 40 && (
                <button
                  onClick={() => {
                    emojiAudio.playTap();
                    onContinue();
                  }}
                  className="w-full py-3 px-5 rounded-2xl bg-gradient-to-b from-[#4fc3f7] via-[#29b6f6] to-[#0288d1] border-b-[5px] border-[#01579b] active:border-b-2 active:translate-y-1 text-white font-black text-lg tracking-wider uppercase font-['Fredoka',sans-serif] shadow-xl hover:brightness-105 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Next Level</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}

              {onRetry && (
                <button
                  onClick={() => {
                    emojiAudio.playTap();
                    onRetry();
                  }}
                  className="w-full py-2.5 px-5 rounded-2xl bg-gradient-to-b from-[#ffd54f] via-[#ffca28] to-[#ffb300] border-b-[4px] border-[#e65100] active:border-b-2 active:translate-y-1 text-[#4e2700] font-black text-base tracking-wider uppercase font-['Fredoka',sans-serif] shadow-lg hover:brightness-105 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retry</span>
                </button>
              )}

              <button
                onClick={handleMenuClick}
                className="w-full py-2.5 px-4 rounded-2xl bg-white/20 hover:bg-white/30 active:scale-98 text-white font-black text-sm tracking-wide transition-all flex items-center justify-center gap-2 border border-white/40 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Back to Menu</span>
              </button>

              {onLeaderboard && (
                <button
                  onClick={() => {
                    emojiAudio.playTap();
                    onLeaderboard();
                  }}
                  className="w-full py-1.5 px-3 rounded-xl bg-black/15 hover:bg-black/25 text-white/90 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-300" />
                  <span>View Leaderboard</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
