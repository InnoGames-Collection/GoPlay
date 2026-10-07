import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Target, Play, Film } from 'lucide-react';
import { CardItem, ColorId, ColorTapSprintLevel, FloatingFeedback } from './types';
import { getColorTapSprintLevel, COLOR_DEFINITIONS } from './levels';
import { ColorTapSprintAudio } from './audio';
import { ColorTapSprintGameOverModal } from './ColorTapSprintGameOverModal';
import { ColorTapSprintLevelCompleteModal } from './ColorTapSprintLevelCompleteModal';
import {
  saveLevelResult,
  loadColorTapSprintProgress,
  useFocusCharge,
  addFocusCharge,
} from './storage';

interface ColorTapSprintGameplayProps {
  levelNumber: number;
  onExitToLevelSelect: () => void;
  onNextLevel: (nextLvl: number) => void;
  onSessionComplete?: (score: number, durationSeconds: number) => void;
}

export const ColorTapSprintGameplay: React.FC<ColorTapSprintGameplayProps> = ({
  levelNumber,
  onExitToLevelSelect,
  onNextLevel,
  onSessionComplete,
}) => {
  const levelData: ColorTapSprintLevel = getColorTapSprintLevel(levelNumber);

  // Game States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [bestCombo, setBestCombo] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(() => loadColorTapSprintProgress().bestScore);
  const [correctTapsCount, setCorrectTapsCount] = useState<number>(0);
  const [totalAttemptsCount, setTotalAttemptsCount] = useState<number>(0);

  // Time Engine
  const [timeLeft, setTimeLeft] = useState<number>(levelData.initialTimeSeconds);
  const [targetColor, setTargetColor] = useState<ColorId>('BLUE');
  const [cards, setCards] = useState<CardItem[]>([]);

  // Feedback & Boosters
  const [floatingFeedbacks, setFloatingFeedbacks] = useState<FloatingFeedback[]>([]);
  const [focusActive, setFocusActive] = useState<boolean>(false);
  const [focusCharges, setFocusCharges] = useState<number>(() => loadColorTapSprintProgress().focusCount);
  const [isAdPlaying, setIsAdPlaying] = useState<boolean>(false);

  // Modals
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isLevelComplete, setIsLevelComplete] = useState<boolean>(false);
  const [earnedStars, setEarnedStars] = useState<number>(3);

  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<number | null>(null);

  // Helper to generate a fresh, guaranteed-solvable challenge
  const generateChallenge = useCallback(
    (currentLevel: ColorTapSprintLevel, prevTarget?: ColorId): { target: ColorId; newCards: CardItem[] } => {
      const pool = currentLevel.colorPool;
      const count = currentLevel.cardCount;

      // Select target color different from previous target if possible
      const availableTargets = pool.filter((c) => c !== prevTarget);
      const chosenTarget =
        availableTargets.length > 0
          ? availableTargets[Math.floor(Math.random() * availableTargets.length)]
          : pool[Math.floor(Math.random() * pool.length)];

      // Select (count - 1) distractor colors
      const distractorPool = pool.filter((c) => c !== chosenTarget);
      const shuffledDistractors = [...distractorPool].sort(() => Math.random() - 0.5);

      const chosenDistractors: ColorId[] = [];
      for (let i = 0; i < count - 1; i++) {
        chosenDistractors.push(shuffledDistractors[i % shuffledDistractors.length]);
      }

      // Combine target + distractors and shuffle positions
      const allColorIds = [chosenTarget, ...chosenDistractors].sort(() => Math.random() - 0.5);

      // Create card items with Stroop word labels
      const newCards: CardItem[] = allColorIds.map((colorId, idx) => {
        const def = COLOR_DEFINITIONS[colorId];

        // Stroop decoy label: deliberately choose a different color name on higher levels
        let labelWord = def.name;
        if (currentLevel.useStroopDecoy) {
          // 70% chance of a distractor word label
          if (Math.random() < 0.75) {
            const otherWords = pool.filter((c) => c !== colorId);
            labelWord = otherWords[Math.floor(Math.random() * otherWords.length)];
          }
        }

        return {
          id: `card_${idx}_${Date.now()}_${Math.random()}`,
          colorId,
          wordLabel: labelWord,
          bgHex: def.bgHex,
          textOnCardHex: def.textOnCardHex,
        };
      });

      return { target: chosenTarget, newCards };
    },
    []
  );

  // Initialize/Reset Game
  const startFreshRun = useCallback(() => {
    setTimeLeft(levelData.initialTimeSeconds);
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    setCorrectTapsCount(0);
    setTotalAttemptsCount(0);
    setFloatingFeedbacks([]);
    setFocusActive(false);
    setIsGameOver(false);
    setIsLevelComplete(false);

    const { target, newCards } = generateChallenge(levelData);
    setTargetColor(target);
    setCards(newCards);
    setIsPlaying(true);
    startTimeRef.current = Date.now();
  }, [levelData, generateChallenge]);

  // Audio start & cleanup
  useEffect(() => {
    ColorTapSprintAudio.startBgm();
    return () => {
      ColorTapSprintAudio.stopBgm();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Main Sprint Timer Loop
  useEffect(() => {
    if (!isPlaying || isGameOver || isLevelComplete) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        const next = Math.max(0, prev - 1);
        if (next === 0) {
          handleTimeExpired();
        }
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isGameOver, isLevelComplete]);

  // Time Expired -> Game Over
  const handleTimeExpired = () => {
    setIsPlaying(false);
    ColorTapSprintAudio.playGameOverSound();

    const accuracy = totalAttemptsCount > 0 ? Math.round((correctTapsCount / totalAttemptsCount) * 100) : 0;
    const { progress: updated } = saveLevelResult(levelNumber, score, bestCombo, accuracy, false);
    setBestScore(updated.bestScore);

    const durationSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    if (onSessionComplete) {
      onSessionComplete(score, durationSec);
    }

    setIsGameOver(true);
  };

  // Level Win
  const handleLevelVictory = (finalScore: number, finalBestCombo: number, finalCorrect: number, finalTotal: number) => {
    setIsPlaying(false);
    ColorTapSprintAudio.playVictorySound();

    const accuracy = finalTotal > 0 ? Math.round((finalCorrect / finalTotal) * 100) : 100;
    const stars = accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : 1;
    setEarnedStars(stars);

    const { progress: updated } = saveLevelResult(levelNumber, finalScore, finalBestCombo, accuracy, true);
    setBestScore(updated.bestScore);

    const durationSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    if (onSessionComplete) {
      onSessionComplete(finalScore, durationSec);
    }

    setIsLevelComplete(true);
  };

  // Card Tap Handler
  const handleCardTap = (tappedCard: CardItem) => {
    if (!isPlaying || isGameOver || isLevelComplete) return;

    setTotalAttemptsCount((prev) => prev + 1);

    // CHECK IF TAPPED CARD'S BACKGROUND COLOR MATCHES TARGET COLOR
    if (tappedCard.colorId === targetColor) {
      // CORRECT!
      const newCombo = combo + 1;
      const newBestCombo = Math.max(bestCombo, newCombo);
      const points = 2 + Math.floor(newCombo / 2);
      const newScore = score + points;
      const newCorrect = correctTapsCount + 1;

      setCombo(newCombo);
      setBestCombo(newBestCombo);
      setScore(newScore);
      setCorrectTapsCount(newCorrect);

      ColorTapSprintAudio.playCorrectSound(newCombo);

      // Add Time Bonus (+1.3s GREAT)
      setTimeLeft((prev) => Math.min(60, prev + levelData.timeBonusSeconds));

      // Visual feedback
      const fbId = `fb_${Date.now()}`;
      setFloatingFeedbacks((prev) => [
        ...prev,
        { id: fbId, text: `+${levelData.timeBonusSeconds.toFixed(1)}s GREAT`, isPositive: true },
      ]);
      setTimeout(() => {
        setFloatingFeedbacks((prev) => prev.filter((f) => f.id !== fbId));
      }, 700);

      // Check level victory
      if (newCorrect >= levelData.targetCorrectTaps) {
        handleLevelVictory(newScore, newBestCombo, newCorrect, totalAttemptsCount + 1);
        return;
      }

      // Next challenge
      const { target, newCards } = generateChallenge(levelData, targetColor);
      setTargetColor(target);
      setCards(newCards);
      setFocusActive(false);
    } else {
      // WRONG!
      ColorTapSprintAudio.playWrongSound();

      setCombo(0);
      setScore((prev) => Math.max(0, prev - 1));

      // Subtract Time Penalty (-4s WRONG)
      setTimeLeft((prev) => {
        const afterPenalty = Math.max(0, prev - levelData.timePenaltySeconds);
        if (afterPenalty === 0) {
          setTimeout(() => handleTimeExpired(), 200);
        }
        return afterPenalty;
      });

      // Visual feedback
      const fbId = `fb_${Date.now()}`;
      setFloatingFeedbacks((prev) => [
        ...prev,
        { id: fbId, text: `-${levelData.timePenaltySeconds.toFixed(0)}s WRONG`, isPositive: false },
      ]);
      setTimeout(() => {
        setFloatingFeedbacks((prev) => prev.filter((f) => f.id !== fbId));
      }, 700);
    }
  };

  // Focus Booster Action
  const handleUseFocus = () => {
    if (focusCharges <= 0 || focusActive || !isPlaying) return;

    if (useFocusCharge()) {
      ColorTapSprintAudio.playFocusSound();
      setFocusCharges((prev) => Math.max(0, prev - 1));
      setFocusActive(true);

      // Focus lasts for 3 seconds or until next tap
      setTimeout(() => {
        setFocusActive(false);
      }, 3000);
    }
  };

  // Watch Ad for +1 Focus Booster
  const handleWatchAd = () => {
    if (isAdPlaying) return;
    setIsAdPlaying(true);
    ColorTapSprintAudio.playTapSound();

    setTimeout(() => {
      const updatedCount = addFocusCharge(1);
      setFocusCharges(updatedCount);
      setIsAdPlaying(false);
      ColorTapSprintAudio.playFocusSound();
    }, 600);
  };

  // Progress bar ratio (timer left vs initial)
  const timerRatio = Math.min(1, Math.max(0, timeLeft / levelData.initialTimeSeconds));
  const targetDef = COLOR_DEFINITIONS[targetColor];
  const progressRatio = Math.min(1, correctTapsCount / levelData.targetCorrectTaps);

  // Dynamic Grid Class according to cardCount
  let gridLayoutClass = 'grid-cols-2 gap-3.5'; // 4 cards (2x2)
  if (levelData.cardCount === 6) {
    gridLayoutClass = 'grid-cols-3 gap-2.5'; // 6 cards (2x3)
  } else if (levelData.cardCount === 8) {
    gridLayoutClass = 'grid-cols-4 gap-2'; // 8 cards (2x4)
  } else if (levelData.cardCount === 9) {
    gridLayoutClass = 'grid-cols-3 gap-2'; // 9 cards (3x3)
  }

  return (
    <div className="relative w-full h-full flex flex-col justify-between items-center bg-[#FFF8EE] text-[#1E293B] select-none overflow-hidden touch-none font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Decorative Candies in Background (matching video) */}
      <div className="absolute top-0 inset-x-0 h-10 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_50%_0%,rgba(244,114,182,0.6)_0%,transparent_70%)]" />
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-tr from-pink-400 via-rose-300 to-yellow-200 border-4 border-white shadow-md pointer-events-none opacity-60 rotate-45" />
      <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-gradient-to-tr from-lime-400 via-emerald-300 to-white border-4 border-white shadow-md pointer-events-none opacity-60 -rotate-12" />
      <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-gradient-to-tr from-pink-500 via-fuchsia-400 to-white border-4 border-white shadow-lg pointer-events-none opacity-70" />

      {/* ----------------- TOP HEADER SECTION (Exact layout from Video 00:04) ----------------- */}
      <div className="relative z-30 w-full max-w-md px-3 pt-2.5 pb-1 flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          {/* Top Back Button */}
          <button
            onClick={onExitToLevelSelect}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-white border border-pink-300 text-xs font-black text-pink-600 hover:bg-pink-50 active:scale-95 transition-all shadow-xs cursor-pointer"
            title="Return to Level Selection"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>BACK</span>
          </button>

          {/* Level Title */}
          <div className="px-3 py-1 rounded-full bg-white border border-amber-300 text-xs font-black text-amber-800 shadow-xs">
            LEVEL {levelNumber} ({correctTapsCount}/{levelData.targetCorrectTaps})
          </div>

          {/* Logo Branding */}
          <div className="flex flex-col items-end leading-none">
            <span className="text-xs font-black italic tracking-tight text-pink-600">Color Tap</span>
            <span className="text-[10px] font-black italic tracking-wider text-amber-600">Sprint</span>
          </div>
        </div>

        {/* 3 Live Stats in Rounded Cream Panels (Exact from Reference Video 00:04) */}
        <div className="flex items-center justify-between gap-2 px-1">
          {/* SCORE Box */}
          <div className="flex-1 bg-[#FFFBEB] border-2 border-[#FDE68A] rounded-2xl py-1.5 px-2 flex flex-col items-center justify-center shadow-xs">
            <span className="text-[9px] font-extrabold uppercase text-[#A16207] tracking-wider">SCORE</span>
            <span className="font-mono text-lg font-black text-[#1E293B] leading-none mt-0.5">{score}</span>
          </div>

          {/* BEST Box */}
          <div className="flex-1 bg-[#FFFBEB] border-2 border-[#FDE68A] rounded-2xl py-1.5 px-2 flex flex-col items-center justify-center shadow-xs">
            <span className="text-[9px] font-extrabold uppercase text-[#A16207] tracking-wider">BEST</span>
            <span className="font-mono text-lg font-black text-[#1E293B] leading-none mt-0.5">{bestScore}</span>
          </div>

          {/* COMBO Box */}
          <div className="flex-1 bg-[#FFFBEB] border-2 border-[#FDE68A] rounded-2xl py-1.5 px-2 flex flex-col items-center justify-center shadow-xs">
            <span className="text-[9px] font-extrabold uppercase text-[#A16207] tracking-wider">COMBO</span>
            <span className="font-mono text-lg font-black text-[#1E293B] leading-none mt-0.5">{combo}</span>
          </div>
        </div>

        {/* Turquoise / Teal Progress & Timer Bar (Exact from Video at 00:04) */}
        <div className="w-full flex items-center gap-2 px-1 mt-1">
          <div className="flex-1 h-2.5 rounded-full bg-slate-200 border border-slate-300 p-0.5 relative overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#06B6D4] to-[#0891B2] transition-all duration-300"
              style={{ width: `${timerRatio * 100}%` }}
            />
          </div>
          <span className="font-mono font-black text-xs text-slate-700 min-w-7 text-right">
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* ----------------- TARGET COLOR PROMPT AREA (Exact from Video 00:04 - 00:10) ----------------- */}
      <div className="relative z-20 w-full max-w-md flex flex-col items-center justify-center py-2 text-center">
        {isPlaying ? (
          <>
            <span className="text-[11px] font-extrabold text-[#94A3B8] tracking-widest uppercase mb-0.5">
              {levelData.useStroopDecoy ? 'TAP THE CARD COLOR' : 'TAP'}
            </span>
            <span
              style={{ color: targetDef.targetHex }}
              className="text-3xl sm:text-4xl font-black italic tracking-wider drop-shadow-xs uppercase animate-in zoom-in-90 duration-150"
            >
              {targetDef.name}
            </span>
          </>
        ) : (
          <>
            <span className="text-[11px] font-extrabold text-[#94A3B8] tracking-widest uppercase mb-0.5">
              TAP THE CARD COLOR
            </span>
            <span className="text-3xl sm:text-4xl font-black italic tracking-wider text-pink-500 uppercase">
              READY
            </span>
          </>
        )}

        {/* Floating Feedback (+1.3s GREAT / -4s WRONG) */}
        {floatingFeedbacks.map((fb) => (
          <div
            key={fb.id}
            className={`absolute top-12 font-black text-lg sm:text-xl tracking-wider uppercase drop-shadow-md animate-out fade-out slide-out-to-top duration-700 ${
              fb.isPositive ? 'text-emerald-500' : 'text-rose-500'
            }`}
          >
            {fb.text}
          </div>
        ))}
      </div>

      {/* ----------------- COLORED ANSWER CARDS PLAYFIELD ----------------- */}
      <div className="relative z-20 w-full max-w-md flex-1 px-4 flex flex-col items-center justify-center my-auto">
        {!isPlaying ? (
          /* START Button (Before Sprint Begins) */
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={startFreshRun}
              className="group py-4 px-10 rounded-full bg-gradient-to-r from-[#F43F5E] via-[#EC4899] to-[#F43F5E] hover:brightness-110 active:scale-95 text-white font-black text-xl tracking-wider uppercase shadow-[0_8px_25px_rgba(236,72,153,0.5)] transition-all flex items-center justify-center gap-3 border-2 border-white cursor-pointer"
            >
              <Play className="w-7 h-7 fill-white text-white group-hover:scale-110 transition-transform" />
              <span>START</span>
            </button>
            <div className="text-xs text-slate-500 font-bold">
              Tap the card whose <strong className="text-pink-600">COLOR</strong> matches the target!
            </div>
          </div>
        ) : (
          /* Answer Cards Grid */
          <div className={`w-full max-w-xs sm:max-w-sm grid ${gridLayoutClass}`}>
            {cards.map((card) => {
              const isTargetMatch = card.colorId === targetColor;
              const isFocusHighlighted = focusActive && isTargetMatch;
              const isFocusDimmed = focusActive && !isTargetMatch;

              return (
                <button
                  key={card.id}
                  onClick={() => handleCardTap(card)}
                  style={{ backgroundColor: card.bgHex }}
                  className={`aspect-square sm:aspect-4/3 rounded-2xl flex items-center justify-center p-2 text-center transition-all duration-100 shadow-[0_6px_14px_rgba(0,0,0,0.18)] border-2 border-white/60 active:scale-95 cursor-pointer relative overflow-hidden ${
                    isFocusHighlighted
                      ? 'ring-4 ring-yellow-400 scale-105 shadow-[0_0_25px_rgba(250,204,21,0.8)] z-30 animate-pulse'
                      : ''
                  } ${isFocusDimmed ? 'opacity-30 grayscale' : 'opacity-100'}`}
                >
                  {/* Subtle Card Gloss Sheen */}
                  <div className="absolute top-0 inset-x-0 h-1/2 bg-white/20 rounded-t-2xl pointer-events-none" />

                  {/* Written Word Label (Stroop Decoy) */}
                  <span
                    style={{ color: card.textOnCardHex }}
                    className="font-black text-sm sm:text-base tracking-wider uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)] pointer-events-none select-none"
                  >
                    {card.wordLabel}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ----------------- BOTTOM CONTROLS (FOCUS & WATCH AD) ----------------- */}
      <div className="relative z-30 w-full max-w-md px-6 pb-4 pt-2 flex flex-col items-center">
        {/* FOCUS x1 Green Button (Exact from Reference Video 00:04) */}
        <button
          onClick={handleUseFocus}
          disabled={focusCharges <= 0 || !isPlaying || focusActive}
          className={`w-full max-w-xs py-3 px-5 rounded-2xl bg-gradient-to-r from-[#84CC16] via-[#65A30D] to-[#4D7C0F] hover:brightness-110 active:scale-98 text-white font-black text-sm sm:text-base tracking-wider uppercase shadow-[0_4px_16px_rgba(101,163,13,0.4)] border-2 border-lime-200 transition-all flex items-center justify-center gap-2 cursor-pointer ${
            focusCharges <= 0 || !isPlaying ? 'opacity-60 cursor-not-allowed' : ''
          }`}
        >
          <Target className="w-5 h-5 stroke-[2.5]" />
          <span>FOCUS x{focusCharges}</span>
        </button>

        {/* WATCH AD +1 FOCUS Banner (Exact from Video) */}
        <button
          onClick={handleWatchAd}
          disabled={isAdPlaying}
          className="mt-1.5 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/90 border border-lime-300 text-[10px] font-black text-lime-800 hover:bg-lime-50 active:scale-95 transition-all shadow-xs cursor-pointer"
        >
          <Film className="w-3.5 h-3.5 text-lime-600" />
          <span>{isAdPlaying ? 'GRANTING FOCUS...' : 'WATCH AD (+1 FOCUS)'}</span>
        </button>
      </div>

      {/* ----------------- MODALS ----------------- */}
      {isGameOver && (
        <ColorTapSprintGameOverModal
          score={score}
          bestScore={bestScore}
          bestCombo={bestCombo}
          accuracy={totalAttemptsCount > 0 ? Math.round((correctTapsCount / totalAttemptsCount) * 100) : 0}
          onRestart={startFreshRun}
          onLevelSelect={onExitToLevelSelect}
        />
      )}

      {isLevelComplete && (
        <ColorTapSprintLevelCompleteModal
          levelNumber={levelNumber}
          score={score}
          bestScore={bestScore}
          bestCombo={bestCombo}
          accuracy={totalAttemptsCount > 0 ? Math.round((correctTapsCount / totalAttemptsCount) * 100) : 100}
          stars={earnedStars}
          onNextLevel={() => {
            if (levelNumber < 40) {
              onNextLevel(levelNumber + 1);
            } else {
              onExitToLevelSelect();
            }
          }}
          onLevelSelect={onExitToLevelSelect}
        />
      )}
    </div>
  );
};
