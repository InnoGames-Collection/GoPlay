import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, Pause, ArrowLeft, Lock, Plus, Film } from 'lucide-react';
import { BubbleItem, BubbleSortLevel, FloatingParticle, FlyingOrb } from './types';
import { getBubbleSortLevel } from './levels';
import { BubbleSortAudio } from './audio';
import { BubbleSortPauseModal } from './BubbleSortPauseModal';
import { BubbleSortCompleteModal } from './BubbleSortCompleteModal';
import { BubbleSortGameOverModal } from './BubbleSortGameOverModal';
import { BubbleSortRewardModal } from './BubbleSortRewardModal';
import { saveLevelCompletion, loadBubbleSortProgress, unlockBoosterReward } from './storage';

interface BubbleSortGameplayProps {
  levelNumber: number;
  onExitToLevelSelect: () => void;
  onNextLevel: (nextLvl: number) => void;
  onSessionComplete?: (score: number, durationSeconds: number) => void;
}

export const BubbleSortGameplay: React.FC<BubbleSortGameplayProps> = ({
  levelNumber,
  onExitToLevelSelect,
  onNextLevel,
  onSessionComplete,
}) => {
  const levelData: BubbleSortLevel = getBubbleSortLevel(levelNumber);

  // Core Game State
  const [movesLeft, setMovesLeft] = useState<number>(levelData.movesLimit);
  const [score, setScore] = useState<number>(0);
  const [completedCategoriesCount, setCompletedCategoriesCount] = useState<number>(0);
  const totalCategories = levelData.categories.length;

  // Active bubbles in the arena & reserve queue
  const [bubbles, setBubbles] = useState<BubbleItem[]>([]);
  const [reserveQueue, setReserveQueue] = useState<BubbleItem[]>([]);

  // Selection & Interactions
  const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null);
  const [praiseText, setPraiseText] = useState<{ text: string; color: string } | null>(null);

  // Boosters & Modals
  const [hasExtraBubblesBooster, setHasExtraBubblesBooster] = useState<boolean>(() => {
    return loadBubbleSortProgress().hasExtraBubblesBooster || levelNumber >= 3;
  });
  const [extraBubblesCount, setExtraBubblesCount] = useState<number>(() => {
    return Math.max(3, loadBubbleSortProgress().extraBubblesCount);
  });
  const [showRewardModal, setShowRewardModal] = useState<boolean>(false);
  const [showBoosterTutorial, setShowBoosterTutorial] = useState<boolean>(levelNumber === 3);
  const [showPlus5Ticket, setShowPlus5Ticket] = useState<boolean>(false);

  // Particles & Animations
  const [particles, setParticles] = useState<FloatingParticle[]>([]);
  const [flyingOrbs, setFlyingOrbs] = useState<FlyingOrb[]>([]);

  // Modal Flow States
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isLevelComplete, setIsLevelComplete] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  // Results State
  const [earnedStars, setEarnedStars] = useState<number>(3);
  const [currentWisdom, setCurrentWisdom] = useState<number>(() => loadBubbleSortProgress().wisdom);
  const [currentCoins, setCurrentCoins] = useState<number>(() => loadBubbleSortProgress().coins);

  const startTimeRef = useRef<number>(Date.now());
  const animFrameRef = useRef<number | null>(null);

  // Initialize Level Puzzles
  const initLevel = useCallback(() => {
    const allItems: BubbleItem[] = [];
    levelData.categories.forEach((cat, catIdx) => {
      cat.words.forEach((word, wordIdx) => {
        allItems.push({
          id: `b_${catIdx}_${wordIdx}_${Math.random().toString(36).substring(2, 6)}`,
          words: [word],
          category: cat.category,
          x: Math.floor(Math.random() * 70) + 15,
          y: Math.floor(Math.random() * 56) + 24,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
          radius: 38,
          colorStage: 1,
        });
      });
    });

    // Shuffle
    const shuffled = [...allItems].sort(() => Math.random() - 0.5);

    // Initial visible items in arena (e.g. 18-20 bubbles, rest queued)
    const initialCount = Math.min(shuffled.length, levelData.initialVisibleCount || 20);
    const visible = shuffled.slice(0, initialCount);
    const reserve = shuffled.slice(initialCount);

    // Arrange visible nicely in grid-like clusters to avoid initial overlapping
    const cols = 4;
    visible.forEach((b, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      b.x = 18 + col * 21 + (Math.random() - 0.5) * 6;
      b.y = 28 + row * 12 + (Math.random() - 0.5) * 5;
    });

    setBubbles(visible);
    setReserveQueue(reserve);
    setMovesLeft(levelData.movesLimit);
    setScore(0);
    setCompletedCategoriesCount(0);
    setSelectedBubbleId(null);
    setPraiseText(null);
    setShowPlus5Ticket(false);
    setIsPaused(false);
    setIsLevelComplete(false);
    setIsGameOver(false);
    startTimeRef.current = Date.now();
  }, [levelData]);

  useEffect(() => {
    initLevel();
  }, [initLevel]);

  // Audio start & cleanup
  useEffect(() => {
    BubbleSortAudio.startBgm();
    return () => {
      BubbleSortAudio.stopBgm();
    };
  }, []);

  // Show floating +5 MOVES ticket when moves drop <= 6 (as seen at 01:26 in video)
  useEffect(() => {
    if (movesLeft <= 6 && !showPlus5Ticket && completedCategoriesCount < totalCategories) {
      setShowPlus5Ticket(true);
    }
  }, [movesLeft, showPlus5Ticket, completedCategoriesCount, totalCategories]);

  // Gentle Floating Bubble Physics Animation Loop
  useEffect(() => {
    if (isPaused || isLevelComplete || isGameOver) return;

    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min(32, time - lastTime);
      lastTime = time;

      setBubbles((prev) =>
        prev.map((b) => {
          if (b.isPopping) return b;

          let newX = b.x + b.vx * (dt / 16);
          let newY = b.y + b.vy * (dt / 16);
          let newVx = b.vx;
          let newVy = b.vy;

          // Safe Arena Bounds
          if (newX < 12) {
            newX = 12;
            newVx = Math.abs(newVx);
          } else if (newX > 88) {
            newX = 88;
            newVx = -Math.abs(newVx);
          }

          if (newY < 20) {
            newY = 20;
            newVy = Math.abs(newVy);
          } else if (newY > 80) {
            newY = 80;
            newVy = -Math.abs(newVy);
          }

          return {
            ...b,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
          };
        })
      );

      // Animate Flying Orbs
      setFlyingOrbs((prev) =>
        prev
          .map((orb) => ({
            ...orb,
            progress: orb.progress + 0.05,
          }))
          .filter((orb) => orb.progress <= 1)
      );

      // Animate Particles
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            alpha: p.alpha - 0.04,
          }))
          .filter((p) => p.alpha > 0)
      );

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPaused, isLevelComplete, isGameOver]);

  // Claim +5 Moves Ticket
  const handleClaimPlus5Moves = () => {
    BubbleSortAudio.playPraiseSound();
    setMovesLeft((prev) => prev + 5);
    setShowPlus5Ticket(false);
  };

  // Spawn Extra Bubbles (Booster)
  const handleUseExtraBubblesBooster = () => {
    if (extraBubblesCount <= 0 || reserveQueue.length === 0) return;

    BubbleSortAudio.playTapSound();
    setShowBoosterTutorial(false);
    setExtraBubblesCount((prev) => prev - 1);

    const toSpawn = reserveQueue.slice(0, 3);
    const remaining = reserveQueue.slice(3);
    setReserveQueue(remaining);

    // Drop new bubbles into top of arena
    toSpawn.forEach((b, idx) => {
      b.x = 25 + idx * 25 + (Math.random() - 0.5) * 8;
      b.y = 22 + (Math.random() - 0.5) * 4;
      b.isSpawning = true;
    });

    setBubbles((prev) => [...prev, ...toSpawn]);
  };

  // Handle Bubble Tap & Category Merging
  const handleBubbleClick = (clickedBubble: BubbleItem) => {
    if (isPaused || isLevelComplete || isGameOver || clickedBubble.isPopping) return;

    // First selection
    if (!selectedBubbleId) {
      setSelectedBubbleId(clickedBubble.id);
      BubbleSortAudio.playTapSound();
      return;
    }

    // Tapped the same bubble: unselect
    if (selectedBubbleId === clickedBubble.id) {
      setSelectedBubbleId(null);
      BubbleSortAudio.playTapSound();
      return;
    }

    const firstBubble = bubbles.find((b) => b.id === selectedBubbleId);
    if (!firstBubble) {
      setSelectedBubbleId(clickedBubble.id);
      BubbleSortAudio.playTapSound();
      return;
    }

    // Spend 1 move on attempt
    setMovesLeft((prev) => {
      const nextMoves = Math.max(0, prev - 1);
      if (nextMoves === 0 && completedCategoriesCount < totalCategories) {
        setTimeout(() => setIsGameOver(true), 600);
      }
      return nextMoves;
    });

    // CHECK IF RELATED (SAME CATEGORY)
    if (firstBubble.category === clickedBubble.category) {
      // Merge all words
      const combinedWords = Array.from(new Set([...firstBubble.words, ...clickedBubble.words]));
      const wordCount = combinedWords.length;

      // Color Stage: 2 = green, 3 = purple, 4 = orange (Category Complete)
      const newStage = (Math.min(4, Math.max(2, wordCount))) as 2 | 3 | 4;
      const newRadius = wordCount === 2 ? 46 : wordCount === 3 ? 55 : 65;

      BubbleSortAudio.playMergeSound(newStage);

      // Check if Category is completely formed (4 words)
      if (wordCount >= 4) {
        // Praise text
        const praises = [
          { text: 'Amazing!', color: '#38BDF8' },
          { text: 'Well Done!', color: '#4ADE80' },
          { text: 'Perfect!', color: '#F472B6' },
          { text: 'Cool!', color: '#38BDF8' },
        ];
        const selectedPraise = praises[Math.floor(Math.random() * praises.length)];
        setPraiseText(selectedPraise);
        BubbleSortAudio.playPraiseSound();
        setTimeout(() => setPraiseText(null), 1200);

        // Transform into Category Name in large bold text!
        const mergedBubble: BubbleItem = {
          ...clickedBubble,
          words: combinedWords,
          colorStage: 4,
          radius: newRadius,
          categoryLabel: clickedBubble.category,
        };

        // Replace bubbles
        setBubbles((prev) =>
          prev.map((b) => (b.id === clickedBubble.id ? mergedBubble : b)).filter((b) => b.id !== firstBubble.id)
        );
        setSelectedBubbleId(null);

        // Burst & Fly Particle Orb to Progress Bar
        setTimeout(() => {
          BubbleSortAudio.playBubblePopSound();
          BubbleSortAudio.playOrbFlySound();

          // Spawn flying orb
          setFlyingOrbs((prev) => [
            ...prev,
            {
              id: `orb_${Date.now()}`,
              startX: mergedBubble.x,
              startY: mergedBubble.y,
              endX: 50,
              endY: 8,
              progress: 0,
              color: '#F97316',
            },
          ]);

          // Pop burst particles
          const burstParticles: FloatingParticle[] = [];
          for (let i = 0; i < 14; i++) {
            const angle = (Math.PI * 2 * i) / 14;
            const speed = Math.random() * 3 + 2;
            burstParticles.push({
              id: `p_${Date.now()}_${i}`,
              x: mergedBubble.x,
              y: mergedBubble.y,
              color: '#F97316',
              size: Math.random() * 4 + 3,
              vx: Math.cos(angle) * speed * 0.4,
              vy: Math.sin(angle) * speed * 0.4,
              alpha: 1,
            });
          }
          setParticles((prev) => [...prev, ...burstParticles]);

          // Remove category bubble
          setBubbles((prev) => prev.filter((b) => b.id !== mergedBubble.id));

          // Increment Progress
          setCompletedCategoriesCount((prev) => {
            const nextCount = prev + 1;

            // Replenish from reserve queue if items remain
            if (reserveQueue.length > 0) {
              const refill = reserveQueue.slice(0, 2);
              setReserveQueue((rq) => rq.slice(2));
              refill.forEach((b, idx) => {
                b.x = 30 + idx * 35;
                b.y = 24;
              });
              setBubbles((bList) => [...bList, ...refill]);
            }

            // Check Level Victory!
            if (nextCount >= totalCategories) {
              handleLevelSuccess();
            }

            return nextCount;
          });

          // Add Score
          setScore((prev) => prev + 250 + movesLeft * 10);
        }, 550);
      } else {
        // Partial merge (2 or 3 items)
        const mergedBubble: BubbleItem = {
          ...clickedBubble,
          words: combinedWords,
          colorStage: newStage,
          radius: newRadius,
        };

        setBubbles((prev) =>
          prev.map((b) => (b.id === clickedBubble.id ? mergedBubble : b)).filter((b) => b.id !== firstBubble.id)
        );
        setSelectedBubbleId(null);
        setScore((prev) => prev + 50);
      }
    } else {
      // Mismatch!
      BubbleSortAudio.playErrorSound();
      setSelectedBubbleId(null);
    }
  };

  // Level Complete Celebration
  const handleLevelSuccess = () => {
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    const finalScore = score + 500 + movesLeft * 25;

    const { progress: updated, stars } = saveLevelCompletion(levelNumber, finalScore, movesLeft, duration);

    setEarnedStars(stars);
    setCurrentWisdom(updated.wisdom);
    setCurrentCoins(updated.coins);
    setScore(finalScore);

    if (onSessionComplete) {
      onSessionComplete(finalScore, duration);
    }

    setTimeout(() => {
      setIsLevelComplete(true);
    }, 600);
  };

  // Next Level Action
  const handleProceedNextLevel = () => {
    setIsLevelComplete(false);

    // If level 2 just completed, show the extra bubbles unlock reward modal (as seen in video at 01:39)
    if (levelNumber === 2 && !loadBubbleSortProgress().hasExtraBubblesBooster) {
      setShowRewardModal(true);
      return;
    }

    if (levelNumber < 40) {
      onNextLevel(levelNumber + 1);
    } else {
      onExitToLevelSelect();
    }
  };

  const handleClaimReward = () => {
    unlockBoosterReward();
    setShowRewardModal(false);
    setHasExtraBubblesBooster(true);
    setExtraBubblesCount(3);
    onNextLevel(3);
  };

  // Low moves warning threshold (moves <= 5)
  const isLowMoves = movesLeft <= 5;
  const progressRatio = Math.min(1, completedCategoriesCount / totalCategories);

  return (
    <div className="relative w-full h-full flex flex-col justify-between items-center bg-gradient-to-b from-[#024089] via-[#04285E] to-[#021435] text-white select-none overflow-hidden touch-none font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Underwater Background Beams & Atmosphere */}
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(125,211,252,0.6)_0%,transparent_70%)]" />

      {/* Silhouetted Coral Cliffs Left & Right */}
      <div className="absolute inset-y-0 left-0 w-24 pointer-events-none opacity-45 bg-[radial-gradient(ellipse_100%_80%_at_0%_50%,rgba(2,132,199,0.5)_0%,transparent_80%)]" />
      <div className="absolute inset-y-0 right-0 w-24 pointer-events-none opacity-45 bg-[radial-gradient(ellipse_100%_80%_at_100%_50%,rgba(2,132,199,0.5)_0%,transparent_80%)]" />

      {/* Rising Ambient Bubbles in Background */}
      <div className="absolute bottom-10 left-1/4 w-3 h-3 rounded-full bg-white/20 blur-[0.5px] pointer-events-none animate-ping" />
      <div className="absolute bottom-20 right-1/3 w-4 h-4 rounded-full bg-white/20 blur-[0.5px] pointer-events-none animate-pulse" />

      {/* ----------------- TOP UI SECTION ----------------- */}
      <div className="relative z-30 w-full max-w-md px-3 pt-2.5 pb-1 flex flex-col gap-1.5">
        {/* Top Header Row with Score, Back, and Controls */}
        <div className="flex items-center justify-between gap-2">
          {/* Top Back Button */}
          <button
            onClick={onExitToLevelSelect}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#072147]/85 border border-cyan-400/30 text-xs font-black text-cyan-200 hover:text-white active:scale-95 transition-all shadow cursor-pointer"
            title="Return to Level Selection"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>BACK</span>
          </button>

          {/* Prominent Score Indicator (as requested in Section 8) */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#041630]/90 border border-white/20 text-xs shadow-inner">
            <span className="text-[10px] font-extrabold text-cyan-300 uppercase tracking-wider">SCORE</span>
            <span className="font-mono font-black text-amber-300 text-sm tracking-wide">
              {score.toLocaleString()}
            </span>
          </div>

          {/* Top-Right Reset Button */}
          <button
            onClick={initLevel}
            className="w-8 h-8 rounded-full bg-[#0a2754]/90 border border-cyan-400/40 text-cyan-200 hover:text-white flex items-center justify-center active:rotate-180 transition-transform shadow cursor-pointer"
            title="Reset Current Level"
          >
            <RotateCcw className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Moves Counter & Level Progress Row (Exact layout from Video at 00:03) */}
        <div className="flex items-center justify-between gap-3 px-1">
          {/* Top-Left: MOVES Pill Counter */}
          <div
            className={`flex flex-col items-center justify-center w-14 h-14 rounded-full bg-[#04152F] border-2 shadow-md transition-all ${
              isLowMoves
                ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.7)] animate-pulse'
                : 'border-white/30'
            }`}
          >
            <span
              className={`text-xl font-black font-sans leading-none ${
                isLowMoves ? 'text-red-400' : 'text-white'
              }`}
            >
              {movesLeft}
            </span>
            <span className="text-[9px] font-extrabold tracking-wider text-slate-300 uppercase mt-0.5">
              MOVES
            </span>
          </div>

          {/* Top-Center: LEVEL & ORANGE PROGRESS BAR */}
          <div className="flex-1 flex flex-col items-center">
            <div className="text-xs font-black tracking-widest text-white uppercase mb-0.5">
              LEVEL {levelNumber}
            </div>
            <div className="text-xs font-mono font-black text-white/90 mb-1">
              {completedCategoriesCount}/{totalCategories}
            </div>

            {/* Orange Fill Progress Bar (exact from video) */}
            <div className="w-full max-w-[150px] h-3 rounded-full bg-[#061835] border border-white/25 p-0.5 relative overflow-hidden shadow-inner">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#EA580C] via-[#F97316] to-[#FBBF24] transition-all duration-300"
                style={{ width: `${progressRatio * 100}%` }}
              />
            </div>
          </div>

          {/* Spacer to balance the top-left moves counter */}
          <div className="w-14" />
        </div>
      </div>

      {/* Floating +5 MOVES Ticket Booster (appears at 01:26 in video) */}
      {showPlus5Ticket && (
        <div className="relative z-40 my-1 animate-bounce">
          <button
            onClick={handleClaimPlus5Moves}
            className="flex flex-col items-center justify-center px-4 py-1.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 border-2 border-white shadow-[0_4px_20px_rgba(245,158,11,0.6)] cursor-pointer active:scale-95 transition-transform"
          >
            <div className="flex items-center gap-1.5 text-slate-950 font-black text-xs">
              <Film className="w-3.5 h-3.5" />
              <span>+5</span>
            </div>
            <span className="text-[9px] font-extrabold text-slate-950 uppercase tracking-wider">
              MOVES
            </span>
          </button>
        </div>
      )}

      {/* ----------------- INTERACTIVE BUBBLE ARENA ----------------- */}
      <div className="relative z-20 w-full max-w-md flex-1 overflow-hidden my-1">
        {/* Celebratory Praise Popup ("Amazing!", "Well Done!", "Perfect!", "Cool!") */}
        {praiseText && (
          <div className="absolute inset-x-0 top-1/4 flex items-center justify-center z-40 pointer-events-none animate-in zoom-in-75 fade-in duration-200">
            <span
              style={{ color: praiseText.color }}
              className="text-3xl sm:text-4xl font-black italic tracking-wider drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] stroke-black"
            >
              {praiseText.text}
            </span>
          </div>
        )}

        {/* Floating Glass Word Bubbles */}
        {bubbles.map((b) => {
          const isSelected = b.id === selectedBubbleId;

          // Color stage styles from video:
          // 1 = Glass blue translucent
          // 2 = Green/Lime
          // 3 = Purple/Violet
          // 4 = Orange/Gold (Category complete)
          let bgStyle =
            'bg-gradient-to-b from-white/35 via-cyan-400/25 to-blue-700/40 border border-white/50 shadow-[0_0_15px_rgba(56,189,248,0.35)]';
          if (b.colorStage === 2) {
            bgStyle =
              'bg-gradient-to-b from-lime-200/50 via-[#84cc16] to-[#4d7c0f] border-2 border-lime-300 shadow-[0_0_25px_rgba(132,204,22,0.6)]';
          } else if (b.colorStage === 3) {
            bgStyle =
              'bg-gradient-to-b from-fuchsia-200/50 via-[#a855f7] to-[#6b21a8] border-2 border-purple-300 shadow-[0_0_25px_rgba(168,85,247,0.6)]';
          } else if (b.colorStage === 4) {
            bgStyle =
              'bg-gradient-to-b from-amber-200/50 via-[#ea580c] to-[#9a3412] border-2 border-orange-300 shadow-[0_0_30px_rgba(234,88,12,0.7)]';
          }

          return (
            <div
              key={b.id}
              onClick={() => handleBubbleClick(b)}
              onTouchStart={() => handleBubbleClick(b)}
              style={{
                left: `${b.x}%`,
                top: `${b.y}%`,
                width: `${b.radius * 2}px`,
                height: `${b.radius * 2}px`,
                transform: 'translate(-50%, -50%)',
              }}
              className={`absolute rounded-full flex flex-col items-center justify-center text-center cursor-pointer transition-transform duration-200 active:scale-95 ${bgStyle} ${
                isSelected
                  ? 'ring-4 ring-white ring-offset-2 ring-offset-[#024089] scale-105 animate-pulse'
                  : ''
              } ${b.isSpawning ? 'animate-in zoom-in-50 duration-300' : ''}`}
            >
              {/* Glass Top Specular Sheen (mimicking realistic 3D bubble) */}
              <div className="absolute top-1.5 left-2.5 w-6 h-3 rounded-full bg-white/60 blur-[0.5px] -rotate-25 pointer-events-none" />

              {/* Category Name Display when complete (e.g. FRUITS, SHAPES, HOUSE) */}
              {b.categoryLabel ? (
                <span className="font-black text-white text-xs sm:text-sm tracking-wide uppercase px-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  {b.categoryLabel}
                </span>
              ) : (
                /* Stacked Words inside merged bubble */
                <div className="flex flex-col items-center justify-center px-1 leading-tight pointer-events-none">
                  {b.words.map((w, wIdx) => (
                    <span
                      key={wIdx}
                      className="font-black text-white text-[10px] sm:text-[11px] tracking-wider uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
                    >
                      {w}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Flying Golden Orbs to Progress Bar */}
        {flyingOrbs.map((orb) => {
          const curX = orb.startX + (orb.endX - orb.startX) * orb.progress;
          const curY = orb.startY + (orb.endY - orb.startY) * orb.progress;
          return (
            <div
              key={orb.id}
              style={{
                left: `${curX}%`,
                top: `${curY}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className="absolute w-5 h-5 rounded-full bg-amber-400 border border-white shadow-[0_0_15px_rgba(245,158,11,0.9)] pointer-events-none z-40"
            />
          );
        })}

        {/* Burst Particles */}
        {particles.map((p) => (
          <div
            key={p.id}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              opacity: p.alpha,
              transform: 'translate(-50%, -50%)',
            }}
            className="absolute rounded-full pointer-events-none shadow-[0_0_8px_currentColor] z-35"
          />
        ))}

        {/* Level 3 Extra Bubbles Tutorial Guidance Banner (from Video at 01:41) */}
        {showBoosterTutorial && (
          <div className="absolute top-4 inset-x-4 p-2.5 rounded-2xl bg-[#032757]/90 border border-cyan-400 text-center z-40 shadow-xl animate-in fade-in duration-300">
            <div className="text-xs font-black uppercase text-amber-300 tracking-wider">
              EXTRA BUBBLES
            </div>
            <div className="text-[11px] text-slate-200">
              Tap on the Extra Bubbles button below to spawn 3 new bubbles.
            </div>
          </div>
        )}
      </div>

      {/* ----------------- BOTTOM GAME CONTROLS ----------------- */}
      <div className="relative z-30 w-full max-w-md px-4 py-2.5 flex items-center justify-between gap-3 bg-[#031c42]/85 border-t border-cyan-400/20 backdrop-blur-sm">
        {/* Leftmost: Extra Bubbles Booster Button OR Locked Level Pill */}
        {hasExtraBubblesBooster ? (
          <button
            onClick={handleUseExtraBubblesBooster}
            disabled={extraBubblesCount <= 0 || reserveQueue.length === 0}
            className="relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-600 border border-white text-white font-black text-xs shadow-[0_0_15px_rgba(236,72,153,0.5)] active:scale-95 cursor-pointer disabled:opacity-50"
            title="Spawn 3 Extra Bubbles"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{extraBubblesCount}</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#092b5e]/60 border border-slate-700 text-slate-400 text-xs font-bold">
            <Lock className="w-3.5 h-3.5" />
            <span>Level 3</span>
          </div>
        )}

        {/* Center: Locked Level Preview Pills (exact from video) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#092b5e]/60 border border-slate-700 text-slate-400 text-xs font-bold">
            <Lock className="w-3.5 h-3.5" />
            <span>Level 4</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#092b5e]/60 border border-slate-700 text-slate-400 text-xs font-bold">
            <Lock className="w-3.5 h-3.5" />
            <span>Level 7</span>
          </div>
        </div>

        {/* Rightmost: Pause Button */}
        <button
          onClick={() => setIsPaused(true)}
          className="w-9 h-9 rounded-xl bg-[#092b5e]/90 hover:bg-[#0c3778] border border-cyan-400/40 text-cyan-200 hover:text-white flex items-center justify-center active:scale-95 shadow cursor-pointer transition-colors"
          title="Pause Game"
        >
          <Pause className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {/* ----------------- MODALS ----------------- */}
      {isPaused && (
        <BubbleSortPauseModal
          levelNumber={levelNumber}
          movesLeft={movesLeft}
          score={score}
          onResume={() => setIsPaused(false)}
          onRestart={initLevel}
          onExitToLevelSelect={onExitToLevelSelect}
        />
      )}

      {isLevelComplete && (
        <BubbleSortCompleteModal
          levelNumber={levelNumber}
          timeSeconds={Math.round((Date.now() - startTimeRef.current) / 1000)}
          movesLeft={movesLeft}
          score={score}
          stars={earnedStars}
          wisdom={currentWisdom}
          coins={currentCoins}
          onNextLevel={handleProceedNextLevel}
        />
      )}

      {showRewardModal && (
        <BubbleSortRewardModal
          onClaim={handleClaimReward}
          onClose={() => {
            setShowRewardModal(false);
            onNextLevel(3);
          }}
        />
      )}

      {isGameOver && (
        <BubbleSortGameOverModal
          levelNumber={levelNumber}
          completedCategories={completedCategoriesCount}
          totalCategories={totalCategories}
          score={score}
          onRetry={initLevel}
          onExitToLevelSelect={onExitToLevelSelect}
        />
      )}
    </div>
  );
};
