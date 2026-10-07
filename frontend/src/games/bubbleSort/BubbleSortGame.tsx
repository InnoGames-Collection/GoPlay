import React, { useState, useEffect } from 'react';
import { GameDefinition, UserProfile } from '../../types';
import { BubbleSortScreen, BubbleSortProgress } from './types';
import { loadBubbleSortProgress } from './storage';
import { BubbleSortAudio } from './audio';
import { BubbleSortMenu } from './BubbleSortMenu';
import { BubbleSortLevelSelect } from './BubbleSortLevelSelect';
import { BubbleSortGameplay } from './BubbleSortGameplay';

interface BubbleSortGameProps {
  game?: GameDefinition;
  profile?: UserProfile;
  onGameOver?: (score: number, durationSeconds: number) => void;
  onExit: () => void;
  isAudioEnabled?: boolean;
}

export const BubbleSortGame: React.FC<BubbleSortGameProps> = ({
  onGameOver,
  onExit,
  isAudioEnabled = true,
}) => {
  const [screen, setScreen] = useState<BubbleSortScreen>('menu');
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [progress, setProgress] = useState<BubbleSortProgress>(() => loadBubbleSortProgress());

  // Synchronize audio mute state with portal settings
  useEffect(() => {
    BubbleSortAudio.setMusicMuted(!isAudioEnabled);
    BubbleSortAudio.setSoundMuted(!isAudioEnabled);
  }, [isAudioEnabled]);

  // Clean up BGM on unmount
  useEffect(() => {
    return () => {
      BubbleSortAudio.stopBgm();
    };
  }, []);

  // Android device Back button support
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      if (screen === 'gameplay') {
        setScreen('menu');
      } else if (screen === 'level-select') {
        setScreen('menu');
      } else {
        onExit();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [screen, onExit]);

  const handlePlayCurrentLevel = () => {
    const loaded = loadBubbleSortProgress();
    setProgress(loaded);
    setCurrentLevel(loaded.unlockedLevel);
    setScreen('gameplay');
  };

  const handleSelectLevel = (levelNum: number) => {
    setCurrentLevel(levelNum);
    setScreen('gameplay');
  };

  const handleNextLevel = (nextLvl: number) => {
    const loaded = loadBubbleSortProgress();
    setProgress(loaded);
    setCurrentLevel(nextLvl);
    setScreen('gameplay');
  };

  const handleSessionComplete = (score: number, durationSeconds: number) => {
    setProgress(loadBubbleSortProgress());
    if (onGameOver) {
      onGameOver(score, durationSeconds);
    }
  };

  return (
    <div className="w-full h-full max-w-md mx-auto flex flex-col items-center justify-center overflow-hidden bg-slate-950 font-['Plus_Jakarta_Sans',sans-serif]">
      {screen === 'menu' && (
        <BubbleSortMenu
          progress={progress}
          onPlayCurrentLevel={handlePlayCurrentLevel}
          onOpenLevelSelect={() => {
            setProgress(loadBubbleSortProgress());
            setScreen('level-select');
          }}
          onExit={onExit}
          isAudioEnabled={isAudioEnabled}
        />
      )}

      {screen === 'level-select' && (
        <BubbleSortLevelSelect
          progress={progress}
          onSelectLevel={handleSelectLevel}
          onBack={() => setScreen('menu')}
        />
      )}

      {screen === 'gameplay' && (
        <BubbleSortGameplay
          levelNumber={currentLevel}
          onExitToLevelSelect={() => {
            setProgress(loadBubbleSortProgress());
            setScreen('menu');
          }}
          onNextLevel={handleNextLevel}
          onSessionComplete={handleSessionComplete}
        />
      )}
    </div>
  );
};
