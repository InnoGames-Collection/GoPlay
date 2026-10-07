import React, { useState, useEffect } from 'react';
import { GameDefinition, UserProfile } from '../../types';
import { ColorTapSprintScreen, ColorTapSprintProgress } from './types';
import { loadColorTapSprintProgress } from './storage';
import { ColorTapSprintAudio } from './audio';
import { ColorTapSprintMenu } from './ColorTapSprintMenu';
import { ColorTapSprintLevelSelect } from './ColorTapSprintLevelSelect';
import { ColorTapSprintGameplay } from './ColorTapSprintGameplay';

interface ColorTapSprintGameProps {
  game?: GameDefinition;
  profile?: UserProfile;
  onGameOver?: (score: number, durationSeconds: number) => void;
  onExit: () => void;
  isAudioEnabled?: boolean;
}

export const ColorTapSprintGame: React.FC<ColorTapSprintGameProps> = ({
  onGameOver,
  onExit,
  isAudioEnabled = true,
}) => {
  const [screen, setScreen] = useState<ColorTapSprintScreen>('menu');
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [progress, setProgress] = useState<ColorTapSprintProgress>(() => loadColorTapSprintProgress());

  // Synchronize audio mute state with portal settings
  useEffect(() => {
    ColorTapSprintAudio.setMusicMuted(!isAudioEnabled);
    ColorTapSprintAudio.setSoundMuted(!isAudioEnabled);
  }, [isAudioEnabled]);

  // Clean up BGM on unmount
  useEffect(() => {
    return () => {
      ColorTapSprintAudio.stopBgm();
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

  const handlePlayLevel = () => {
    const loaded = loadColorTapSprintProgress();
    setProgress(loaded);
    setCurrentLevel(loaded.unlockedLevel);
    setScreen('gameplay');
  };

  const handleSelectLevel = (lvlNum: number) => {
    setCurrentLevel(lvlNum);
    setScreen('gameplay');
  };

  const handleNextLevel = (nextLvl: number) => {
    const loaded = loadColorTapSprintProgress();
    setProgress(loaded);
    setCurrentLevel(nextLvl);
    setScreen('gameplay');
  };

  const handleSessionComplete = (score: number, durationSeconds: number) => {
    setProgress(loadColorTapSprintProgress());
    if (onGameOver) {
      onGameOver(score, durationSeconds);
    }
  };

  return (
    <div className="w-full h-full max-w-md mx-auto flex flex-col items-center justify-center overflow-hidden bg-[#FFF9F0] font-['Plus_Jakarta_Sans',sans-serif]">
      {screen === 'menu' && (
        <ColorTapSprintMenu
          progress={progress}
          onPlayLevel={handlePlayLevel}
          onOpenLevelSelect={() => {
            setProgress(loadColorTapSprintProgress());
            setScreen('level-select');
          }}
          onExit={onExit}
          isAudioEnabled={isAudioEnabled}
        />
      )}

      {screen === 'level-select' && (
        <ColorTapSprintLevelSelect
          progress={progress}
          onSelectLevel={handleSelectLevel}
          onBack={() => setScreen('menu')}
        />
      )}

      {screen === 'gameplay' && (
        <ColorTapSprintGameplay
          levelNumber={currentLevel}
          onExitToLevelSelect={() => {
            setProgress(loadColorTapSprintProgress());
            setScreen('menu');
          }}
          onNextLevel={handleNextLevel}
          onSessionComplete={handleSessionComplete}
        />
      )}
    </div>
  );
};
