import React, { useEffect, useCallback, useRef, useState } from 'react';
import type { Task } from '../types';
import { Play, Pause, SkipForward, RefreshCw, Zap, PictureInPicture, ArrowDownToLine, ExternalLink } from 'lucide-react';
import GlassCard from './ui/Card';
import type { TimerState } from '../hooks/usePomodoro';

interface TimerSettings {
  work: number;
  shortBreak: number;
  longBreak: number;
  pomodorosPerLongBreak: number;
  enableSound: boolean;
  soundUrl: string;
}

interface PomodoroTimerProps {
  timerState: TimerState;
  settings: TimerSettings;
  activeTask?: Task;
  toggleTimer: () => void;
  skipSession: () => void;
  resetTimer: () => void;
  startPendingSession: () => void;
  isZenMode?: boolean;
  isFloating?: boolean;
  onPopOut?: () => void;
  onToggleFloating?: () => void;
  onDock?: () => void;
  dragHandleProps?: Record<string, (e: React.MouseEvent<HTMLDivElement>) => void>;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  timerState,
  settings,
  activeTask,
  toggleTimer,
  skipSession,
  resetTimer,
  startPendingSession,
  isZenMode = false,
  isFloating = false,
  onPopOut,
  onToggleFloating,
  onDock,
  dragHandleProps,
}) => {
  const { mode, secondsLeft, isActive, pomodoros, focusStreak, pendingMode } = timerState;
  const prevModeRef = useRef(mode);
  const [isUiVisible, setIsUiVisible] = useState(true);
  const inactivityTimerRef = useRef<number | null>(null);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
    }
    if (isZenMode && !isFloating) {
        inactivityTimerRef.current = window.setTimeout(() => {
            setIsUiVisible(false);
        }, 3000); // 3 seconds
    }
  }, [isZenMode, isFloating]);

  useEffect(() => {
      if (isZenMode && !isFloating) {
          resetInactivityTimer();
      } else {
          setIsUiVisible(true);
          if (inactivityTimerRef.current) {
              clearTimeout(inactivityTimerRef.current);
          }
      }

      return () => {
          if (inactivityTimerRef.current) {
              clearTimeout(inactivityTimerRef.current);
          }
      };
  }, [isZenMode, isFloating, resetInactivityTimer]);

  const handleActivity = () => {
      if (!isUiVisible) {
          setIsUiVisible(true);
      }
      resetInactivityTimer();
  };

  const playSound = useCallback(() => {
    if (settings.enableSound && settings.soundUrl) {
      const audio = new Audio(settings.soundUrl);
      audio.play().catch(e => console.error("Audio play failed:", e));
    }
  }, [settings.enableSound, settings.soundUrl]);

  useEffect(() => {
    if (prevModeRef.current !== mode || (secondsLeft === 0 && !isActive)) {
      if (pomodoros === 0 && secondsLeft === 0 && !isActive && !pendingMode) return;
      playSound();
    }
    prevModeRef.current = mode;
  }, [mode, secondsLeft, isActive, pomodoros, pendingMode, playSound]);

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  
  const totalSeconds = settings[mode];
  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;
  const modeText = { work: 'Focus', shortBreak: 'Short Break', longBreak: 'Long Break' };
  
  const sessionEnded = !isActive && secondsLeft === 0 && pendingMode;

  let bottomMessage;
  if (sessionEnded) {
      if (pendingMode && pendingMode.includes('Break')) {
          bottomMessage = "Well done! Time for a break.";
      } else {
          bottomMessage = "Break's over. Time to focus!";
      }
  } else {
      bottomMessage = `Session ${pomodoros % settings.pomodorosPerLongBreak || settings.pomodorosPerLongBreak} of ${settings.pomodorosPerLongBreak}`;
  }
  
  const fadeClass = `transition-opacity duration-700 ${!isUiVisible ? 'opacity-0' : 'opacity-100'}`;

  return (
    <GlassCard 
        className={`text-center flex flex-col items-center justify-center relative transition-all duration-300
          ${isFloating
            ? '!p-4 min-h-0 w-[300px]'
            : '!p-8 min-h-[400px] lg:min-h-[600px]'
          }`}
        onMouseMove={handleActivity}
        onClick={handleActivity}
    >
      {isFloating && (
        <div 
          {...dragHandleProps}
          className="w-full flex justify-between items-center bg-white/5 p-2 rounded-t-lg mb-2 cursor-grab active:cursor-grabbing"
        >
          <h3 className="text-sm font-semibold truncate text-white ml-2 flex-1 text-left">{activeTask?.title || 'General Focus'}</h3>
          {onDock && (
             <button onClick={onDock} aria-label="Dock timer" title="Dock timer" className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                <ArrowDownToLine size={16} />
              </button>
          )}
        </div>
      )}

      <div className={`absolute top-4 right-4 flex items-center gap-2 ${fadeClass} ${isFloating ? 'hidden' : ''}`}>
        {focusStreak > 0 && (
          <div className="flex items-center gap-1.5 text-orange-400 bg-orange-400/10 px-3 py-1.5 rounded-full text-sm font-semibold">
            <Zap size={16} className="animate-pulse" />
            <span>{focusStreak}</span>
          </div>
        )}
        <div className="flex items-center gap-1 p-1 bg-black/20 rounded-full">
            {onPopOut && (
                <button
                    onClick={onPopOut}
                    aria-label="Pop out timer"
                    title="Pop out timer in new window"
                    className="w-9 h-9 text-gray-400 hover:text-white rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-100"
                >
                    <ExternalLink size={18} />
                </button>
            )}
            {onToggleFloating && (
                <button 
                onClick={onToggleFloating} 
                aria-label="Float timer" 
                title="Float timer (Picture-in-picture)"
                className="w-9 h-9 text-gray-400 hover:text-white rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-100"
                >
                <PictureInPicture size={18} />
                </button>
            )}
        </div>
      </div>
        
      <div className={`relative mx-auto ${isFloating ? 'w-48 h-48 mb-2' : 'w-72 h-72 lg:w-96 lg:h-96 mb-6'}`}>
        <svg className={`w-full h-full ${fadeClass}`} viewBox="0 0 100 100">
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00BFFF" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
          </defs>
          <circle className="text-white/10" strokeWidth="5" cx="50" cy="50" r="47" fill="transparent"></circle>
          <circle
            stroke="url(#gradient)" strokeWidth="5" strokeLinecap="round" cx="50" cy="50" r="47" fill="transparent"
            strokeDasharray="295.4" strokeDashoffset={295.4 - (295.4 * progress) / 100}
            transform="rotate(-90 50 50)" className="transition-all duration-1000"
            style={{ filter: "drop-shadow(0 0 8px theme('colors.electric-blue'))" }}
          ></circle>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-bold tracking-tighter text-white font-display ${isFloating ? 'text-5xl' : 'text-7xl lg:text-8xl'}`}>{formatTime(secondsLeft)}</span>
          <span className={`font-medium text-gray-400 mt-1 uppercase tracking-widest ${isFloating ? 'text-xs' : 'text-sm'}`}>{modeText[mode]}</span>
        </div>
      </div>
      
      {!isFloating && (
        <>
            <h3 className={`text-2xl font-semibold truncate text-white mb-1 h-8 max-w-sm ${fadeClass}`}>{activeTask?.title || 'General Focus'}</h3>
            <p className={`text-base text-gray-500 mb-8 ${fadeClass}`}>{bottomMessage}</p>
        </>
      )}

      <div className={`flex justify-center items-center ${isFloating ? 'space-x-2' : 'space-x-6'}`}>
        {sessionEnded && pendingMode && pendingMode.includes('Break') ? (
            <>
              <button onClick={startPendingSession} className={`bg-gradient-to-br from-green-400 to-emerald-500 text-white rounded-full flex flex-col items-center justify-center font-semibold shadow-lg transition-transform transform hover:scale-105 active:scale-100 focus:outline-none focus:ring-2 focus:ring-green-300 ${isFloating ? 'h-20 px-4 text-base' : 'h-24 px-8 text-lg'}`}>
                <span>Start Break</span>
                <span className="text-xs font-normal opacity-75">{formatTime(settings[pendingMode])}</span>
              </button>
              <button 
                  onClick={skipSession} 
                  aria-label="Skip break"
                  className={`text-gray-400 hover:text-white bg-white/5 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-100 ${isFloating ? 'w-20 h-20' : 'w-24 h-24'}`}
              >
                  <SkipForward size={isFloating ? 24 : 32} />
              </button>
            </>
        ) : sessionEnded && pendingMode === 'work' ? (
             <>
                <button 
                    onClick={startPendingSession} 
                    className={`bg-gradient-to-br from-accent-indigo to-accent-cyan text-white rounded-full flex flex-col items-center justify-center font-semibold shadow-lg transition-transform transform hover:scale-105 active:scale-100 focus:outline-none focus:ring-2 focus:ring-accent-cyan ${isFloating ? 'h-20 px-4 text-base' : 'h-24 px-8 text-lg'}`}
                >
                    <span>Start Focus</span>
                    <span className="text-xs font-normal opacity-75">{formatTime(settings.work)}</span>
                </button>
                <button 
                    onClick={skipSession} 
                    aria-label="Skip to next session"
                    className={`text-gray-400 hover:text-white bg-white/5 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-100 ${isFloating ? 'w-20 h-20' : 'w-24 h-24'}`}
                >
                    <SkipForward size={isFloating ? 24 : 32} />
                </button>
            </>
        ) : (
          <>
            <button 
                onClick={resetTimer} 
                aria-label="Reset timer"
                className={`text-gray-400 hover:text-white bg-white/5 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-100 ${fadeClass} ${isFloating ? 'w-16 h-16' : 'w-24 h-24'}`}
            >
                <RefreshCw size={isFloating ? 20 : 28} />
            </button>
            <button 
                onClick={toggleTimer} 
                aria-label={isActive ? 'Pause timer' : 'Start timer'}
                className={`bg-white text-dark-bg rounded-full flex items-center justify-center font-bold shadow-2xl transition-transform transform hover:scale-110 active:scale-100 focus:outline-none focus:ring-4 focus:ring-white/50 ${isFloating ? 'w-20 h-20 text-2xl' : 'w-32 h-32 text-3xl'}`}
            >
                {isActive ? <Pause size={isFloating ? 32 : 48} /> : <Play size={isFloating ? 32 : 48} className={isFloating ? 'ml-1' : 'ml-2'} />}
            </button>
            <button 
                onClick={skipSession} 
                aria-label="Skip to next session"
                className={`text-gray-400 hover:text-white bg-white/5 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-100 ${fadeClass} ${isFloating ? 'w-16 h-16' : 'w-24 h-24'}`}
            >
                <SkipForward size={isFloating ? 20 : 28} />
            </button>
          </>
        )}
      </div>
    </GlassCard>
  );
};

export default PomodoroTimer;