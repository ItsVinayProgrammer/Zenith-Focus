import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import PomodoroTimer from './components/PomodoroTimer';
import useTheme from './hooks/useTheme';
import type { Task, TimerSettings } from './types';
import { INITIAL_TIMER_SETTINGS } from './constants';
import { validateSettings } from './utils/settingsValidator';
import type { TimerState } from './hooks/usePomodoro';

const TIMER_STATE_KEY = 'zenith-focus-timer-state';
const TIMER_COMMAND_KEY = 'zenith-focus-timer-command';
const SETTINGS_KEY = 'timerSettings';
const TASKS_KEY = 'tasks';

const getFromStorage = <T,>(key: string, defaultValue: T): T => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        console.error(`Error reading ${key} from storage`, e);
        return defaultValue;
    }
};

const PopOutApp: React.FC = () => {
    // Apply theme from main app
    useTheme();

    const [timerState, setTimerState] = useState<TimerState>(() => getFromStorage(TIMER_STATE_KEY, {
        mode: 'work',
        secondsLeft: INITIAL_TIMER_SETTINGS.work * 60,
        isActive: false,
        pomodoros: 0,
        focusStreak: 0,
        pendingMode: null,
    }));
    
    const [settings, setSettings] = useState(() => {
        const saved = getFromStorage<Partial<TimerSettings>>(SETTINGS_KEY, {});
        const validated = validateSettings(saved);
        return {
            work: validated.work * 60,
            shortBreak: validated.shortBreak * 60,
            longBreak: validated.longBreak * 60,
            pomodorosPerLongBreak: validated.pomodorosPerLongBreak,
            enableSound: validated.enableSound,
            soundUrl: validated.soundUrl,
        };
    });

    const [activeTask, setActiveTask] = useState<Task | undefined>(() => {
        const tasks = getFromStorage<Task[]>(TASKS_KEY, []);
        return tasks.find(t => t.status === 'in_progress');
    });

    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            try {
                if (e.key === TIMER_STATE_KEY && e.newValue) {
                    setTimerState(JSON.parse(e.newValue) as TimerState);
                }
                if (e.key === SETTINGS_KEY && e.newValue) {
                    const newSettings: Partial<TimerSettings> = JSON.parse(e.newValue);
                    const validated = validateSettings(newSettings);
                    setSettings({
                        work: validated.work * 60,
                        shortBreak: validated.shortBreak * 60,
                        longBreak: validated.longBreak * 60,
                        pomodorosPerLongBreak: validated.pomodorosPerLongBreak,
                        enableSound: validated.enableSound,
                        soundUrl: validated.soundUrl,
                    });
                }
                 if (e.key === TASKS_KEY && e.newValue) {
                    const tasks: Task[] = JSON.parse(e.newValue);
                    setActiveTask(tasks.find(t => t.status === 'in_progress'));
                }
            } catch (err) {
                console.error("Error processing storage update in pop-out window", err);
            }
        };

        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const sendCommand = (command: 'toggle' | 'skip' | 'reset' | 'startPending') => {
        localStorage.setItem(TIMER_COMMAND_KEY, JSON.stringify({ command, timestamp: Date.now() }));
    };

    return (
        <div className="p-4 bg-dark-bg min-h-screen">
            <PomodoroTimer
                timerState={timerState}
                settings={settings}
                activeTask={activeTask}
                toggleTimer={() => sendCommand('toggle')}
                skipSession={() => sendCommand('skip')}
                resetTimer={() => sendCommand('reset')}
                startPendingSession={() => sendCommand('startPending')}
            />
        </div>
    );
};


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <PopOutApp />
  </React.StrictMode>
);