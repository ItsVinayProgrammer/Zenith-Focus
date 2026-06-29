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
  endTime: number | null;
}

export const usePomodoro = (
  settings: TimerSettings,
  activeTask: Task | undefined,
  addLog: (log: Omit<SessionLog, 'id'>) => void,
  updateTask: (task: Task) => void,
  onDistraction: () => void
) => {
  const [timerState, setTimerState] = useState<TimerState>(() => {
    try {
      const saved = localStorage.getItem(TIMER_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as TimerState;
        if (parsed.isActive && parsed.endTime) {
          const remaining = Math.max(0, Math.ceil((parsed.endTime - Date.now()) / 1000));
          return { ...parsed, secondsLeft: remaining };
        }
        return { ...parsed, endTime: parsed.endTime || null };
      }
    } catch (e) {
      console.error("Error reading initial timer state from localStorage", e);
    }
    return {
      mode: 'work',
      secondsLeft: settings.work,
      isActive: false,
      pomodoros: 0,
      focusStreak: 0,
      pendingMode: null,
      endTime: null,
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
        endTime: Date.now() + settings[newMode] * 1000,
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
        endTime: null,
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

  // Main timer interval using timestamps to prevent background throttling issues
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive && timerState.endTime) {
      interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((timerState.endTime! - Date.now()) / 1000));
        if (remaining === 0) {
          endSession();
        } else {
          setTimerState(s => {
            if (s.secondsLeft === remaining) return s;
            return { ...s, secondsLeft: remaining };
          });
        }
      }, 200);
    } else if (isActive && secondsLeft === 0) {
      endSession();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timerState.endTime, secondsLeft, endSession]);

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
        endTime: Date.now() + settings[s.pendingMode] * 1000,
      };
    });
  }, [pendingMode, settings]);

  const toggleTimer = useCallback(() => {
    if (isActive) { // Pausing
        logSession(mode);
        setTimerState(s => ({...s, focusStreak: 0, isActive: false, endTime: null })); // Pausing breaks streak and stops timer
    } else { // Resuming / Starting
        if(sessionStartRef.current) { // Was paused
            logSession(SessionType.Pause);
        }
        sessionStartRef.current = new Date();
        const duration = secondsLeft;
        setTimerState(s => ({ ...s, isActive: true, pendingMode: null, endTime: Date.now() + duration * 1000 }));
    }
  }, [isActive, mode, logSession, secondsLeft]);
  
  const resetTimer = useCallback(() => {
    if (sessionStartRef.current) {
        logSession(mode);
    }
    sessionStartRef.current = null;
    setTimerState({
      mode: 'work',
      secondsLeft: settings.work,
      isActive: false,
      pomodoros: 0,
      focusStreak: 0,
      pendingMode: null,
      endTime: null,
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
                endTime: Date.now() + settings.work * 1000,
            }));
        } else {
            startPendingSession();
        }
        return;
    }
    handleNext(true);
  }, [handleNext, pendingMode, startPendingSession, settings.work]);

  // Synchronize timer state changes across multiple tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === TIMER_STATE_KEY && e.newValue) {
        try {
          const newState = JSON.parse(e.newValue) as TimerState;
          setTimerState(prev => {
            if (
              prev.mode === newState.mode &&
              prev.secondsLeft === newState.secondsLeft &&
              prev.isActive === newState.isActive &&
              prev.pomodoros === newState.pomodoros &&
              prev.focusStreak === newState.focusStreak &&
              prev.pendingMode === newState.pendingMode &&
              prev.endTime === newState.endTime
            ) {
              return prev;
            }
            return newState;
          });
        } catch (err) {
          console.error("Error synchronizing timer state across tabs", err);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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
                    case 'endSession':
                        endSession();
                        break;
                }
            } catch (err) {
                console.error("Error processing timer command", err);
            }
        }
    };
    window.addEventListener('storage', handleCommand);
    return () => window.removeEventListener('storage', handleCommand);
  }, [toggleTimer, skipSession, resetTimer, startPendingSession, endSession]); 

  return {
    timerState,
    toggleTimer,
    skipSession,
    resetTimer,
    startPendingSession,
  };
};
  