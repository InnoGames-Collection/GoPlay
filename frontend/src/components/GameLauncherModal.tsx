/**
 * Official telebirr SuperApp Game Center Launcher Modal - GoPlay
 * High-performance mobile container for GoPlay (12 Games).
 */

import React, { useState } from 'react';
import { GameDefinition, UserProfile, GameSessionResult } from '../types';
import { CrazyColorsGame } from '../games/crazyColors';
import { JuicyMatchGame } from '../games/juicyMatch';
import { EmojiFunGame } from '../games/emojiFun/EmojiFunGame';
import { PopPianoGame } from '../games/popPiano/PopPianoGame';
import { WorldLegendsGame } from '../games/worldLegends/WorldLegendsGame';
import { CandyBlastGame } from '../games/candyBlast/CandyBlastGame';
import { SoccerShooterGame } from '../games/soccerShooter';
import { DamaGame } from '../games/dama/DamaGame';
import { ButtonSoccerGame } from '../games/buttonSoccer';
import { SoccerPingPongGame } from '../games/soccerPingPong/SoccerPingPongGame';
import { BubbleSortGame } from '../games/bubbleSort';
import { ColorTapSprintGame } from '../games/colorTapSprint';
import { InteractiveGameRunner } from '../games/interactiveSimulator';

interface GameLauncherModalProps {
  game: GameDefinition;
  profile: UserProfile;
  lastResult: GameSessionResult | null;
  onClose: () => void;
  onGameOver: (finalScore: number, durationSeconds: number) => void;
  onPlayAgain?: () => void;
  isAudioEnabled?: boolean;
}

export const GameLauncherModal: React.FC<GameLauncherModalProps> = ({
  game,
  profile,
  lastResult,
  onClose,
  onGameOver,
  onPlayAgain,
  isAudioEnabled = true,
}) => {
  const handleGameEnd = (scoreOrResult: any, duration?: number) => {
    if (typeof scoreOrResult === 'object' && scoreOrResult !== null) {
      onGameOver(Number(scoreOrResult.score) || 0, Number(scoreOrResult.durationSeconds) || duration || 30);
    } else {
      onGameOver(Number(scoreOrResult) || 0, duration || 30);
    }
  };

  // Dedicated routes for GoPlay games
  
  if (game.id === 'crazy-colors') {
    return (
      <div className="fixed inset-0 z-50 bg-[#090A10] flex flex-col justify-center items-center overflow-hidden animate-in fade-in duration-200 font-['Plus_Jakarta_Sans',sans-serif] touch-none overscroll-none select-none">
        <CrazyColorsGame
          onExit={onClose}
          onGameOver={(score, duration) => handleGameEnd(score, duration)}
        />
      </div>
    );
  }

  if (game.id === 'juicy-match') {
    return (
      <div className="fixed inset-0 z-50 bg-[#090A10] flex flex-col justify-center items-center overflow-hidden animate-in fade-in duration-200 font-['Plus_Jakarta_Sans',sans-serif] touch-none overscroll-none select-none">
        <JuicyMatchGame
          onBackToHub={onClose}
          onLevelComplete={(score, duration) => handleGameEnd(score, duration)}
        />
      </div>
    );
  }

  if (game.id === 'emoji-fun') {
    return (
      <div className="fixed inset-0 z-50 bg-[#090A10] flex flex-col justify-center items-center overflow-hidden animate-in fade-in duration-200 font-['Plus_Jakarta_Sans',sans-serif] touch-none overscroll-none select-none">
        <EmojiFunGame
          onExit={onClose}
          onGameOver={(score, duration) => handleGameEnd(score, duration)}
        />
      </div>
    );
  }

  if (game.id === 'pop-piano') {
    return (
      <div className="fixed inset-0 z-50 bg-[#090A10] flex flex-col justify-center items-center overflow-hidden animate-in fade-in duration-200 font-['Plus_Jakarta_Sans',sans-serif] touch-none overscroll-none select-none">
        <PopPianoGame
          game={game}
          profile={profile}
          onExit={onClose}
          onGameOver={(score, duration) => handleGameEnd(score, duration)}
          isAudioEnabled={isAudioEnabled}
        />
      </div>
    );
  }

  if (game.id === 'world-legends') {
    return (
      <div className="fixed inset-0 z-50 bg-[#090A10] flex flex-col justify-center items-center overflow-hidden animate-in fade-in duration-200 font-['Plus_Jakarta_Sans',sans-serif] touch-none overscroll-none select-none">
        <WorldLegendsGame
          game={game}
          profile={profile}
          onExit={onClose}
          onGameOver={(score, duration) => handleGameEnd(score, duration)}
          isAudioEnabled={isAudioEnabled}
        />
      </div>
    );
  }

  if (game.id === 'candy-blast') {
    return (
      <div className="fixed inset-0 z-50 bg-[#090A10] flex flex-col justify-center items-center overflow-hidden animate-in fade-in duration-200 font-['Plus_Jakarta_Sans',sans-serif] touch-none overscroll-none select-none">
        <CandyBlastGame
          game={game}
          profile={profile}
          onExit={onClose}
          onGameOver={(score, duration) => handleGameEnd(score, duration)}
          isAudioEnabled={isAudioEnabled}
        />
      </div>
    );
  }

  if (game.id === 'soccer-shooter') {
    return (
      <div className="fixed inset-0 z-50 bg-[#090A10] flex flex-col justify-center items-center overflow-hidden animate-in fade-in duration-200 font-['Plus_Jakarta_Sans',sans-serif] touch-none overscroll-none select-none">
        <SoccerShooterGame
          game={game}
          profile={profile}
          onExit={onClose}
          onGameOver={(score, duration) => handleGameEnd(score, duration)}
          isAudioEnabled={isAudioEnabled}
        />
      </div>
    );
  }

  if (game.id === 'dama') {
    return (
      <div className="fixed inset-0 z-50 bg-[#090A10] flex flex-col justify-center items-center overflow-hidden animate-in fade-in duration-200 font-['Plus_Jakarta_Sans',sans-serif] touch-none overscroll-none select-none">
        <DamaGame
          game={game}
          profile={profile}
          onExit={onClose}
          onGameOver={(res) => handleGameEnd(res.score, res.durationSeconds)}
          isAudioEnabled={isAudioEnabled}
        />
      </div>
    );
  }

  if (game.id === 'button-soccer') {
    return (
      <div className="fixed inset-0 z-50 bg-[#090A10] flex flex-col justify-center items-center overflow-hidden animate-in fade-in duration-200 font-['Plus_Jakarta_Sans',sans-serif] touch-none overscroll-none select-none">
        <ButtonSoccerGame
          game={game}
          profile={profile}
          onExit={onClose}
          onGameOver={(score, duration) => handleGameEnd(score, duration)}
          isAudioEnabled={isAudioEnabled}
        />
      </div>
    );
  }

  if (game.id === 'soccer-ping-pong') {
    return (
      <div className="fixed inset-0 z-50 bg-[#090A10] flex flex-col justify-center items-center overflow-hidden animate-in fade-in duration-200 font-['Plus_Jakarta_Sans',sans-serif] touch-none overscroll-none select-none">
        <SoccerPingPongGame
          game={game}
          profile={profile}
          onExit={onClose}
          onGameOver={(score, duration) => handleGameEnd(score, duration)}
          isAudioEnabled={isAudioEnabled}
        />
      </div>
    );
  }

  if (game.id === 'bubble-sort') {
    return (
      <div className="fixed inset-0 z-50 bg-[#090A10] flex flex-col justify-center items-center overflow-hidden animate-in fade-in duration-200 font-['Plus_Jakarta_Sans',sans-serif] touch-none overscroll-none select-none">
        <BubbleSortGame
          game={game}
          profile={profile}
          onExit={onClose}
          onGameOver={(score, duration) => handleGameEnd(score, duration)}
          isAudioEnabled={isAudioEnabled}
        />
      </div>
    );
  }

  if (game.id === 'color-tap-sprint') {
    return (
      <div className="fixed inset-0 z-50 bg-[#090A10] flex flex-col justify-center items-center overflow-hidden animate-in fade-in duration-200 font-['Plus_Jakarta_Sans',sans-serif] touch-none overscroll-none select-none">
        <ColorTapSprintGame
          game={game}
          profile={profile}
          onExit={onClose}
          onGameOver={(score, duration) => handleGameEnd(score, duration)}
          isAudioEnabled={isAudioEnabled}
        />
      </div>
    );
  }

  // Fallback simulator for unexpected game IDs
  return (
    <div className="fixed inset-0 z-50 bg-[#090A10] flex flex-col justify-center items-center overflow-hidden animate-in fade-in duration-200 font-['Plus_Jakarta_Sans',sans-serif] touch-none overscroll-none select-none">
      <InteractiveGameRunner
        game={game}
        onGameOver={(score, duration) => handleGameEnd(score, duration)}
        onRequestRevive={() => {}}
        isAudioEnabled={isAudioEnabled}
      />
    </div>
  );
};
