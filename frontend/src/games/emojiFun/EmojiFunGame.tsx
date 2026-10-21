/**
 * Emoji Fun — Main Game Container
 *
 * Implements:
 * - 40 numbered tournament levels (LEVEL 1 to LEVEL 40)
 * - Calibrated time-based scoring: 5 base points per correct answer + speed bonus (0 for wrong/unanswered)
 * - Complete removal of lives/hearts and coin purchase requirements
 * - Smooth question timeout handling as unanswered without failure popups
 * - End-of-attempt result screen showing final score, total, answered, unanswered, and correct counts
 * - Reliable score persistence to My High Scores via onGameOver callback
 * - Working Retry and Back to Menu controls
 */

import React, { useState, useEffect, useRef } from 'react';
import { GameState, EmojiLevelConfig, EmojiQuestion, PlayerStats, TournamentScoreCalculation } from './types';
import { EMOJI_LEVELS_DATABASE, getQuestionsForLevel } from './questionDatabase';
import { calculateQuestionTournamentScore } from './scoringEngine';
import { tournamentLeaderboardService } from './tournamentLeaderboardService';
import { emojiAudio } from './emojiAudio';

// Subcomponents
import { BackgroundEmojis } from './components/BackgroundEmojis';
import { EmojiFunHeader } from './components/EmojiFunHeader';
import { EmojiFunHome } from './components/EmojiFunHome';
import { EmojiFunLevelInfo } from './components/EmojiFunLevelInfo';
import { EmojiFunPlayView } from './components/EmojiFunPlayView';
import { EmojiFunFeedbackModal } from './components/EmojiFunFeedbackModal';
import { EmojiFunLeaderboardModal } from './components/EmojiFunLeaderboardModal';
import { EmojiFunSettingsModal } from './components/EmojiFunSettingsModal';
import { EmojiFunHowToPlayModal } from './components/EmojiFunHowToPlayModal';

interface EmojiFunGameProps {
  onExit?: () => void;
  onGameOver?: (score: number, durationSeconds: number) => void;
}

export const EmojiFunGame: React.FC<EmojiFunGameProps> = ({ onExit, onGameOver }) => {
  // Game lifecycle
  const [gameState, setGameState] = useState<GameState>('HOME');
  const [selectedLevelNumber, setSelectedLevelNumber] = useState<number>(1);

  // Player persistent stats
  const [playerStats, setPlayerStats] = useState<PlayerStats>(() =>
    tournamentLeaderboardService.getPlayerStats()
  );

  // In-level active state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [activeQuestions, setActiveQuestions] = useState<EmojiQuestion[]>([]);
  const [levelScore, setLevelScore] = useState<number>(0);
  const [comboCount, setComboCount] = useState<number>(0);
  const [levelBestCombo, setLevelBestCombo] = useState<number>(0);
  const [levelCorrectCount, setLevelCorrectCount] = useState<number>(0);
  const [answeredCount, setAnsweredCount] = useState<number>(0);
  const [unansweredCount, setUnansweredCount] = useState<number>(0);
  const [levelStartTime, setLevelStartTime] = useState<number>(Date.now());
  const [hintsUsedInQuestion, setHintsUsedInQuestion] = useState<number>(0);
  const [eliminatedOptions, setEliminatedOptions] = useState<number[]>([]);

  // Feedback modal state
  const [feedbackType, setFeedbackType] = useState<'CORRECT' | 'INCORRECT' | 'LEVEL_CLEAR' | null>(null);
  const [lastScoreResult, setLastScoreResult] = useState<TournamentScoreCalculation | undefined>(undefined);

  // Sub-modals
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(false);

  // Settings
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => emojiAudio.isAudioEnabled());
  const [musicEnabled, setMusicEnabled] = useState<boolean>(() => emojiAudio.isMusicEnabled());

  // Backgrounding & audio suspension lifecycle handler
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        emojiAudio.setAudioEnabled(false);
        emojiAudio.setMusicEnabled(false);
      } else {
        emojiAudio.setAudioEnabled(soundEnabled);
        emojiAudio.setMusicEnabled(musicEnabled);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [soundEnabled, musicEnabled]);

  // Current active level configuration
  const currentLevelConfig: EmojiLevelConfig =
    EMOJI_LEVELS_DATABASE[selectedLevelNumber - 1] || EMOJI_LEVELS_DATABASE[0];

  // Refresh stats helper
  const refreshStats = () => {
    setPlayerStats({ ...tournamentLeaderboardService.getPlayerStats() });
  };

  // Start Level logic
  const handleStartLevel = () => {
    const questions = getQuestionsForLevel(selectedLevelNumber);
    setActiveQuestions(questions);
    setCurrentQuestionIndex(0);
    setLevelScore(0);
    setComboCount(0);
    setLevelBestCombo(0);
    setLevelCorrectCount(0);
    setAnsweredCount(0);
    setUnansweredCount(0);
    setLevelStartTime(Date.now());
    setHintsUsedInQuestion(0);
    setEliminatedOptions([]);
    setFeedbackType(null);
    setGameState('PLAYING');
  };

  // Conclude an attempt and persist results
  const finishLevelAttempt = (
    finalScore: number,
    correctCount: number,
    ansCount: number,
    unansCount: number
  ) => {
    const totalQ = activeQuestions.length || 10;
    const finalAccuracy = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;
    const duration = Math.max(1, Math.round((Date.now() - levelStartTime) / 1000));

    // 1. Record in tournament leaderboard service (updates best score and advances unlockedLevel)
    tournamentLeaderboardService.recordLevelAttempt({
      level: selectedLevelNumber,
      score: finalScore,
      completed: true,
      accuracy: finalAccuracy,
      totalQuestions: totalQ,
      answeredCount: ansCount,
      unansweredCount: unansCount,
      correctCount,
      durationSeconds: duration,
    });
    refreshStats();

    // 2. Play celebratory sound if passed
    if (correctCount > 0) {
      emojiAudio.playLevelClear();
    }

    // 3. Persist score to GoPlay portal & My High Scores
    onGameOver?.(finalScore, duration);

    // 4. Show final result screen
    setFeedbackType('LEVEL_CLEAR');
  };

  // Handle Answer Selection
  const handleSelectAnswer = (chosenIndex: number, timeRemainingSeconds: number) => {
    const question = activeQuestions[currentQuestionIndex];
    if (!question) return;

    const isCorrect = chosenIndex === question.correctIndex;
    const newAnswered = answeredCount + 1;
    setAnsweredCount(newAnswered);

    if (isCorrect) {
      // Correct Answer!
      const newCombo = comboCount + 1;
      setComboCount(newCombo);
      if (newCombo > levelBestCombo) {
        setLevelBestCombo(newCombo);
      }
      const newCorrect = levelCorrectCount + 1;
      setLevelCorrectCount(newCorrect);

      // Calculate time-based score: exactly 5 base points + time-based bonus
      const scoreCalc = calculateQuestionTournamentScore({
        question,
        timeRemainingSeconds,
        comboCount: newCombo,
        hintsUsedOnThisQuestion: hintsUsedInQuestion,
      });

      if (scoreCalc.isPerfect) {
        emojiAudio.playPerfect();
      } else {
        emojiAudio.playCorrect();
      }

      setLevelScore((prev) => prev + scoreCalc.totalPointsAwarded);
      setLastScoreResult(scoreCalc);
      setFeedbackType('CORRECT');
    } else {
      // Incorrect Answer! (No lives lost, 0 points earned)
      emojiAudio.playIncorrect();
      setComboCount(0);
      setFeedbackType('INCORRECT');
    }
  };

  // Handle Time Expired on Question (Unanswered Question)
  // Spec: When a question times out, record it as unanswered and continue according to the question sequence.
  // Do not display a failure popup after every unanswered question.
  const handleTimeExpired = () => {
    emojiAudio.playIncorrect();
    setComboCount(0);

    const newUnanswered = unansweredCount + 1;
    setUnansweredCount(newUnanswered);

    const nextIdx = currentQuestionIndex + 1;
    if (nextIdx >= activeQuestions.length) {
      // Level attempt ended via timeout on final question
      finishLevelAttempt(levelScore, levelCorrectCount, answeredCount, newUnanswered);
    } else {
      // Advance to next question immediately
      setCurrentQuestionIndex(nextIdx);
      setHintsUsedInQuestion(0);
      setEliminatedOptions([]);
    }
  };

  // Handle Hint Usage
  const handleUseHint = () => {
    const question = activeQuestions[currentQuestionIndex];
    if (!question) return;

    // Find wrong options that haven't been eliminated yet
    const wrongIndices = question.options
      .map((_, idx) => idx)
      .filter((idx) => idx !== question.correctIndex && !eliminatedOptions.includes(idx));

    if (wrongIndices.length === 0) return;

    // Eliminate 1 wrong option
    const toEliminate = wrongIndices.slice(0, 1);
    setEliminatedOptions([...eliminatedOptions, ...toEliminate]);
    setHintsUsedInQuestion((prev) => prev + 1);

    tournamentLeaderboardService.useHint();
    refreshStats();
    emojiAudio.playHint();
  };

  // Advance from Question Feedback Modal (Continue or OK)
  const handleAdvanceFromFeedback = () => {
    const nextIdx = currentQuestionIndex + 1;

    if (nextIdx >= activeQuestions.length) {
      // Completed all questions in the level!
      finishLevelAttempt(levelScore, levelCorrectCount, answeredCount, unansweredCount);
    } else {
      // Advance to next question
      setCurrentQuestionIndex(nextIdx);
      setHintsUsedInQuestion(0);
      setEliminatedOptions([]);
      setFeedbackType(null);
    }
  };

  // Advance to Next Level from Result Screen
  const handleProceedToNextLevel = () => {
    const nextLevel = Math.min(40, selectedLevelNumber + 1);
    setSelectedLevelNumber(nextLevel);
    setFeedbackType(null);
    setGameState('LEVEL_INFO');
  };

  // Back to Menu from Result Screen or In-Game
  const handleBackToMenu = () => {
    setFeedbackType(null);
    setGameState('LEVEL_INFO');
  };

  // Handle early exit while playing: ensure attempt is persisted
  const handleEarlyExitFromPlay = () => {
    if (answeredCount > 0 || levelScore > 0) {
      const duration = Math.max(1, Math.round((Date.now() - levelStartTime) / 1000));
      tournamentLeaderboardService.recordLevelAttempt({
        level: selectedLevelNumber,
        score: levelScore,
        completed: false,
        accuracy: answeredCount > 0 ? Math.round((levelCorrectCount / answeredCount) * 100) : 0,
        totalQuestions: activeQuestions.length || 10,
        answeredCount,
        unansweredCount,
        correctCount: levelCorrectCount,
        durationSeconds: duration,
      });
      refreshStats();
      onGameOver?.(levelScore, duration);
    }
    setFeedbackType(null);
    setGameState('LEVEL_INFO');
  };

  // Leaderboard data for previews and modals
  const leaderboardPreview = tournamentLeaderboardService.getLeaderboardPreview();
  const allLeaderboardEntries = tournamentLeaderboardService.getLeaderboard();

  // Elapsed time formatted for display
  const totalSecondsSpent = Math.max(1, Math.round((Date.now() - levelStartTime) / 1000));
  const timeFormatted = `00:${String(Math.floor(totalSecondsSpent / 60)).padStart(2, '0')}:${String(
    totalSecondsSpent % 60
  ).padStart(2, '0')}`;

  const currentQuestion = activeQuestions[currentQuestionIndex];

  return (
    <div className="relative w-full h-full min-h-[600px] flex flex-col items-center justify-between overflow-hidden bg-gradient-to-b from-[#fce4ec] via-[#f3e5f5] to-[#e1f5fe] font-sans">
      {/* Dynamic Floating Emojis Background */}
      <BackgroundEmojis />

      {/* Top Bar HUD */}
      <EmojiFunHeader
        levelNumber={gameState === 'PLAYING' ? selectedLevelNumber : undefined}
        score={gameState === 'PLAYING' ? levelScore : undefined}
        hints={playerStats.availableHints}
        showHints={gameState === 'PLAYING'}
        onOpenSettings={() => setShowSettings(true)}
        onUseHint={gameState === 'PLAYING' ? handleUseHint : undefined}
        onBack={
          gameState === 'LEVEL_INFO'
            ? () => setGameState('HOME')
            : gameState === 'PLAYING'
            ? handleEarlyExitFromPlay
            : undefined
        }
        onExit={gameState === 'HOME' ? onExit : undefined}
      />

      {/* VIEW 1: HOME SCREEN */}
      {gameState === 'HOME' && (
        <EmojiFunHome
          totalScore={playerStats.totalTournamentScore}
          currentLevel={playerStats.unlockedLevel}
          onPlay={() => {
            setSelectedLevelNumber(playerStats.unlockedLevel);
            setGameState('LEVEL_INFO');
          }}
          onLeaderboard={() => setShowLeaderboard(true)}
          onSettings={() => setShowSettings(true)}
          onHowToPlay={() => setShowHowToPlay(true)}
        />
      )}

      {/* VIEW 2: LEVEL INFORMATION MENU (Strictly Numbered Levels 1 to 40) */}
      {gameState === 'LEVEL_INFO' && (
        <EmojiFunLevelInfo
          levelConfig={currentLevelConfig}
          playerStats={playerStats}
          leaderboardPreview={leaderboardPreview}
          onSelectLevel={(lvl) => setSelectedLevelNumber(lvl)}
          onStartLevel={handleStartLevel}
          onOpenFullLeaderboard={() => setShowLeaderboard(true)}
          onBack={() => setGameState('HOME')}
        />
      )}

      {/* VIEW 3: ACTIVE GAMEPLAY VIEW */}
      {gameState === 'PLAYING' && currentQuestion && (
        <EmojiFunPlayView
          question={currentQuestion}
          levelConfig={currentLevelConfig}
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={activeQuestions.length}
          levelScore={levelScore}
          comboCount={comboCount}
          hintsUsedOnCurrentQuestion={hintsUsedInQuestion}
          eliminatedOptionIndices={eliminatedOptions}
          onSelectAnswer={handleSelectAnswer}
          onTimeExpired={handleTimeExpired}
        />
      )}

      {/* FEEDBACK & RESULT MODAL */}
      {feedbackType && (
        <EmojiFunFeedbackModal
          type={feedbackType}
          scoreResult={lastScoreResult}
          correctAnswerText={
            feedbackType === 'INCORRECT'
              ? currentQuestion?.options[currentQuestion?.correctIndex]
              : undefined
          }
          timeSpentFormatted={timeFormatted}
          accuracyPercent={
            activeQuestions.length > 0
              ? Math.round((levelCorrectCount / activeQuestions.length) * 100)
              : 0
          }
          levelScore={levelScore}
          totalQuestions={activeQuestions.length || 10}
          answeredCount={answeredCount}
          unansweredCount={unansweredCount}
          correctCount={levelCorrectCount}
          totalTournamentScore={playerStats.totalTournamentScore}
          userRank={leaderboardPreview.userRank}
          levelNumber={selectedLevelNumber}
          onContinue={
            feedbackType === 'LEVEL_CLEAR'
              ? handleProceedToNextLevel
              : handleAdvanceFromFeedback
          }
          onRetry={handleStartLevel}
          onBackToMenu={handleBackToMenu}
          onLeaderboard={() => {
            setFeedbackType(null);
            setShowLeaderboard(true);
          }}
          onClose={handleBackToMenu}
        />
      )}

      {/* LEADERBOARD MODAL */}
      {showLeaderboard && (
        <EmojiFunLeaderboardModal
          entries={allLeaderboardEntries}
          userRank={leaderboardPreview.userRank}
          userScore={playerStats.totalTournamentScore}
          nextPlayerScore={leaderboardPreview.nextPlayerScore}
          pointsToNextRank={leaderboardPreview.pointsToNextRank}
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      {/* SETTINGS MODAL */}
      {showSettings && (
        <EmojiFunSettingsModal
          soundEnabled={soundEnabled}
          musicEnabled={musicEnabled}
          onToggleSound={() => {
            const next = !soundEnabled;
            setSoundEnabled(next);
            emojiAudio.setAudioEnabled(next);
          }}
          onToggleMusic={() => {
            const next = !musicEnabled;
            setMusicEnabled(next);
            emojiAudio.setMusicEnabled(next);
          }}
          onHowToPlay={() => {
            setShowSettings(false);
            setShowHowToPlay(true);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* HOW TO PLAY MODAL */}
      {showHowToPlay && (
        <EmojiFunHowToPlayModal onClose={() => setShowHowToPlay(false)} />
      )}
    </div>
  );
};
