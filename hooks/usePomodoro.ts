import { useState, useEffect, useCallback, useRef } from 'react';
import type { Task, SessionLog } from '../types';
import { SessionType } from '../types';

const TIMER_STATE_KEY = 'zenith-focus-timer-state';
const TIMER_COMMAND_KEY = 'zenith-focus-timer-command';

interface TimerSettings {
  work: number;
  shortBreak: number;
  longBreak: number;
  pomodorosPerLongBreak: number;
}

// Define the shape of the timer state to be stored
export interface TimerState {
  mode: 'work' | 'shortBreak' | 'longBreak';
  secondsLeft: number;
  isActive: boolean;
  pomodoros: number;
  focusStreak: number;
  pendingMode: 'work' | 'shortBreak' | 'longBreak' | null;
}

export const usePomodoro = (
  settings: TimerSettings,
  activeTask: Task | undefined,
  addLog: (log: Omit<SessionLog, 'id'>) => void,
  updateTask: (task: Task) => void,
  onDistraction: () => void
) => {
  const [timerState, setTimerState] = useState<TimerState>(() => {
    return {
      mode: 'work',
      secondsLeft: settings.work,
      isActive: false,
      pomodoros: 0,
      focusStreak: 0,
      pendingMode: null,
    };
  });

  const sessionStartRef = useRef<Date | null>(null);
  const wasDistracted = useRef(false);

  // Sync state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(TIMER_STATE_KEY, JSON.stringify(timerState));
  }, [timerState]);

  const { mode, secondsLeft, isActive, pomodoros, focusStreak, pendingMode } = timerState;

  // Distraction detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (isActive && mode === 'work') {
        if (document.visibilityState === 'hidden') {
          wasDistracted.current = true;
        } else if (document.visibilityState === 'visible' && wasDistracted.current) {
          wasDistracted.current = false;
          onDistraction();
        }
      } else {
        wasDistracted.current = false;
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive, mode, onDistraction]);

  // Reset timer if settings change while idle
  useEffect(() => {
    if (!isActive && sessionStartRef.current === null) {
      setTimerState(prev => ({ ...prev, secondsLeft: settings[prev.mode] }));
    }
  }, [settings, isActive]);
  
  const logSession = useCallback((type: SessionType | 'work' | 'shortBreak' | 'longBreak') => {
    if (sessionStartRef.current) {
      const endTime = new Date();
      const duration = (endTime.getTime() - sessionStartRef.current.getTime()) / 1000;
      if (duration > 1) {
        const sessionTypeMap = {
            'work': SessionType.Work,
            'shortBreak': SessionType.ShortBreak,
            'longBreak': SessionType.LongBreak,
        };
        const logType = sessionTypeMap[type as keyof typeof sessionTypeMap] || type as SessionType;

        addLog({
          taskId: activeTask?.id,
          type: logType,
          startTime: sessionStartRef.current.toISOString(),
          endTime: endTime.toISOString(),
          duration,
        });
      }
      sessionStartRef.current = new Date();
    }
  }, [addLog, activeTask]);
  
  const switchMode = useCallback((newMode: 'work' | 'shortBreak' | 'longBreak', fromAutoSwitch: boolean = false) => {
    logSession(mode);
    
    let newPomodoros = pomodoros;
    let newStreak = focusStreak;

    if (mode === 'work' && fromAutoSwitch) {
        newPomodoros = pomodoros + 1;
        newStreak = focusStreak + 1;
        if (activeTask) {
            updateTask({ ...activeTask, pomodorosCompleted: activeTask.pomodorosCompleted + 1 });
        }
    }

    setTimerState({
        mode: newMode,
        secondsLeft: settings[newMode],
        isActive: true,
        pomodoros: newPomodoros,
        focusStreak: newStreak,
        pendingMode: null,
    });

  }, [mode, logSession, pomodoros, focusStreak, activeTask, updateTask, settings]);

  const endSession = useCallback(() => {
    logSession(mode);

    let newPomodoros = pomodoros;
    let newStreak = focusStreak;
    let nextMode: 'work' | 'shortBreak' | 'longBreak';

    if (mode === 'work') {
        newPomodoros = pomodoros + 1;
        newStreak = focusStreak + 1;
        if (activeTask) {
            updateTask({ ...activeTask, pomodorosCompleted: activeTask.pomodorosCompleted + 1 });
        }
        nextMode = newPomodoros % settings.pomodorosPerLongBreak === 0 ? 'longBreak' : 'shortBreak';
    } else { // break ended
        nextMode = 'work';
    }

    setTimerState(s => ({
        ...s,
        isActive: false,
        secondsLeft: 0,
        pomodoros: newPomodoros,
        focusStreak: newStreak,
        pendingMode: nextMode,
    }));

  }, [logSession, mode, pomodoros, focusStreak, activeTask, updateTask, settings.pomodorosPerLongBreak]);

  const handleNext = useCallback((manual: boolean = false) => {
    let newStreak = focusStreak;
    if (manual && mode === 'work') {
      newStreak = 0; // Manual skip breaks streak
    }
    const newPomodoros = (mode === 'work') ? pomodoros + 1 : pomodoros;
    
    setTimerState(s => ({...s, focusStreak: newStreak}));

    if (mode === 'work') {
      switchMode(newPomodoros % settings.pomodorosPerLongBreak === 0 ? 'longBreak' : 'shortBreak', !manual);
    } else {
      switchMode('work');
    }
  }, [mode, pomodoros, focusStreak, switchMode, settings.pomodorosPerLongBreak]);

  // Main timer interval
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => setTimerState(s => ({ ...s, secondsLeft: s.secondsLeft - 1 })), 1000);
    } else if (isActive && secondsLeft === 0) {
      endSession();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsLeft, endSession]);

  const startPendingSession = useCallback(() => {
    if (!pendingMode) return;

    sessionStartRef.current = new Date();
    setTimerState(s => {
      if (!s.pendingMode) return s;

      return {
        ...s,
        mode: s.pendingMode,
        secondsLeft: settings[s.pendingMode],
        isActive: true,
        pendingMode: null,
      };
    });
  }, [pendingMode, settings]);

  const toggleTimer = useCallback(() => {
    if (isActive) { // Pausing
        logSession(mode);
        setTimerState(s => ({...s, focusStreak: 0, isActive: false })); // Pausing breaks streak and stops timer
    } else { // Resuming / Starting
        if(sessionStartRef.current) { // Was paused
            logSession(SessionType.Pause);
        }
        sessionStartRef.current = new Date();
        setTimerState(s => ({ ...s, isActive: true, pendingMode: null }));
    }
  }, [isActive, mode, logSession]);
  
  const resetTimer = useCallback(() => {
    if (sessionStartRef.current) {
        logSession(mode);
    }
    sessionStartRef.current = null;
    // Reset to the initial state
    setTimerState({
      mode: 'work',
      secondsLeft: settings.work,
      isActive: false,
      pomodoros: 0,
      focusStreak: 0,
      pendingMode: null,
    });
  }, [mode, logSession, settings.work]);

  const skipSession = useCallback(() => {
    if (pendingMode) {
        if (pendingMode.includes('Break')) {
            sessionStartRef.current = new Date();
            setTimerState(s => ({
                ...s,
                mode: 'work',
                secondsLeft: settings.work,
                isActive: true,
                focusStreak: 0, // Skipping a break resets the streak
                pendingMode: null,
            }));
        } else {
            startPendingSession();
        }
        return;
    }
    handleNext(true);
  }, [handleNext, pendingMode, startPendingSession, settings.work]);

  // Command listener for pop-out window
  useEffect(() => {
    const handleCommand = (e: StorageEvent) => {
        if (e.key === TIMER_COMMAND_KEY && e.newValue) {
            try {
                const { command } = JSON.parse(e.newValue);
                switch (command) {
                    case 'toggle':
                        toggleTimer();
                        break;
                    case 'skip':
                        skipSession();
                        break;
                    case 'reset':
                        resetTimer();
                        break;
                    case 'startPending':
                        startPendingSession();
                        break;
                }
            } catch (err) {
                console.error("Error processing timer command", err);
            }
        }
    };
    window.addEventListener('storage', handleCommand);
    return () => window.removeEventListener('storage', handleCommand);
  }, [toggleTimer, skipSession, resetTimer, startPendingSession]); 

  return {
    timerState,
    toggleTimer,
    skipSession,
    resetTimer,
    startPendingSession,
  };
};