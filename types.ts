

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string; // The key for the ICONS map in constants
  isDefault?: boolean;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id:string;
  title: string;
  category: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  pomodoros: number;
  pomodorosCompleted: number;
  createdAt: string;
  subtasks?: Subtask[];
}

export enum SessionType {
  Work = 'work',
  ShortBreak = 'short_break',
  LongBreak = 'long_break',
  Pause = 'pause',
  Idle = 'idle',
}

export interface SessionLog {
  id: string;
  taskId?: string;
  category?: string;
  type: SessionType;
  startTime: string;
  endTime: string;
  duration: number; // in seconds
  distractionIds?: string[];
  notes?: string;
}

export interface Distraction {
  id: string;
  name: string;
  timestamp: string;
}

export enum GoalPeriod {
  Daily = 'daily',
  Weekly = 'weekly'
}

export interface AccountabilityGoal {
  id: string;
  period: GoalPeriod;
  targetHours: number;
  guiltFreeDays: number;
}

export enum BreakType {
    Micro = 'Micro',
    Short = 'Short',
    Long = 'Long'
}

export interface Bounty {
  title: string;
  description: string;
  xp: number;
}

export interface Theme {
  id: string;
  name: string;
  colors: {
    '--color-dark-bg': string;
    '--color-dark-card': string;
    '--color-accent-indigo': string;
    '--color-accent-cyan': string;
    '--color-accent-glow': string;
    '--color-electric-blue': string;
    '--background-style': string;
  };
}

export interface TimerSettings {
  work: number; // in minutes
  shortBreak: number; // in minutes
  longBreak: number; // in minutes
  pomodorosPerLongBreak: number;
  enableSound: boolean;
  soundUrl: string;
}

export interface UserProfile {
  name: string;
}
