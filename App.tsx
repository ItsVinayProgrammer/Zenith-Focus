


import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Sun, Moon, BarChart3, Users, Settings, Bot, Eye, EyeOff, Play, SkipForward, Plus, Zap, Database, Focus, User, PictureInPicture, ExternalLink } from 'lucide-react';
import PomodoroTimer from './components/PomodoroTimer';
import MissionControl from './components/Dashboard';
// Fix: Use named import for Reports component to resolve module resolution error.
import { Reports } from './components/Reports';
import Social from './components/Social';
import Profile from './components/Profile';
import Modal from './components/ui/Modal';
// Fix: Use a named import for SettingsModal to resolve the module resolution error.
import { SettingsModal } from './components/SettingsModal';
import DistractionModal from './components/DistractionModal';
import { CommandPalette } from './components/ui/CommandPalette';
import type { CommandAction } from './components/ui/CommandPalette';
import { ToastContainer } from './components/ui/Toast';
import { useToast } from './hooks/useToast';
import useProductivityData from './hooks/useProductivityData';
import useTimerSettings from './hooks/useTimerSettings';
import useTheme from './hooks/useTheme';
import useCategoryData from './hooks/useCategoryData';
import useUserProfile from './hooks/useUserProfile';
import { ICONS, DEFAULT_CATEGORIES } from './constants';
import { usePomodoro } from './hooks/usePomodoro';
import FloatingTimerPlaceholder from './components/FloatingTimerPlaceholder';
import PopOutTimerPlaceholder from './components/PopOutTimerPlaceholder';
import { generateMockData } from './utils/mockData';


const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'focus' | 'analytics' | 'social' | 'profile'>('focus');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isAddTaskFormVisible, setAddTaskFormVisible] = useState(false);
  const [isDistractionModalOpen, setIsDistractionModalOpen] = useState(false);
  const [isTimerFloating, setIsTimerFloating] = useState(false);
  const [isTimerPoppedOut, setIsTimerPoppedOut] = useState(false);
  
  const { toasts, addToast, removeToast } = useToast();

  const { settings, updateSettings } = useTimerSettings();
  const { themes, activeTheme, setThemeId } = useTheme();
  const { categories, addCategory, updateCategory, deleteCategory } = useCategoryData();
  const { profile, updateProfile } = useUserProfile();

  const {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    reorderTasks,
    logs,
    addLog,
    distractions,
    addDistraction,
    goals,
    updateGoal,
  } = useProductivityData();
  
  const activeTask = useMemo(() => tasks.find(t => t.status === 'in_progress'), [tasks]);
  
  const todayLogs = useMemo(() => {
    const today = new Date().toDateString();
    return logs.filter(log => new Date(log.startTime).toDateString() === today);
  }, [logs]);

  // Create a map for easy lookup of category properties
  const categoryMap = useMemo(() => {
    const map: Record<string, { color: string; icon: React.ReactNode }> = {};
    categories.forEach(cat => {
      map[cat.name] = {
        color: cat.color,
        icon: ICONS[cat.icon] || ICONS['Tag'],
      };
    });
    const fallbackCategory = DEFAULT_CATEGORIES[0] || { name: 'Work', color: '#3B82F6', icon: 'Briefcase' };
    map['fallback'] = {
        color: fallbackCategory.color,
        icon: ICONS[fallbackCategory.icon] || ICONS['Tag']
    };
    return map;
  }, [categories]);


  // Convert settings from minutes to seconds for the timer component
  const timerSettingsInSeconds = useMemo(() => ({
    work: settings.work * 60,
    shortBreak: settings.shortBreak * 60,
    longBreak: settings.longBreak * 60,
    pomodorosPerLongBreak: settings.pomodorosPerLongBreak,
    enableSound: settings.enableSound,
    soundUrl: settings.soundUrl,
  }), [settings]);

  const { timerState, toggleTimer, skipSession, resetTimer, startPendingSession } = usePomodoro(
    timerSettingsInSeconds,
    activeTask,
    addLog,
    updateTask,
    () => setIsDistractionModalOpen(true)
  );
  
  // Floating Timer Drag Logic
  const [floatingPosition, setFloatingPosition] = useState({ x: 20, y: window.innerHeight - 450 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  
  // Pop-out Timer Logic
  const popOutWindowRef = useRef<Window | null>(null);
  
  const handlePopOut = useCallback(() => {
    if (popOutWindowRef.current && !popOutWindowRef.current.closed) {
        popOutWindowRef.current.focus();
        return;
    }
    const windowFeatures = 'menubar=no,location=no,resizable=no,scrollbars=no,status=no,width=380,height=520';
    popOutWindowRef.current = window.open('/timer.html', 'zenithFocusTimer', windowFeatures);
    setIsTimerPoppedOut(true);
  }, []);

  const handlePopIn = useCallback(() => {
    if (popOutWindowRef.current) {
        popOutWindowRef.current.close();
        popOutWindowRef.current = null;
    }
    setIsTimerPoppedOut(false);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (popOutWindowRef.current && popOutWindowRef.current.closed) {
        setIsTimerPoppedOut(false);
        popOutWindowRef.current = null;
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleDragMouseDown = useCallback((e: React.MouseEvent) => {
      setIsDragging(true);
      dragOffset.current = {
        x: e.clientX - floatingPosition.x,
        y: e.clientY - floatingPosition.y,
      };
      // Prevent text selection on drag
      e.preventDefault();
  }, [floatingPosition]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setFloatingPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    if (isDragging) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = 'none';
    }

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
    };
  }, [isDragging]);
  

  const handleSetView = useCallback((view: 'focus' | 'analytics' | 'social' | 'profile') => {
    setActiveView(view);
    setCommandPaletteOpen(false);
  }, []);

  const handleOpenSettings = useCallback(() => {
    setIsSettingsModalOpen(true);
    setCommandPaletteOpen(false);
  }, []);

  const handleToggleZenMode = useCallback(() => {
    setIsZenMode(prev => !prev);
    setCommandPaletteOpen(false);
    addToast(`Zen Mode ${!isZenMode ? 'enabled' : 'disabled'}.`, { icon: isZenMode ? <Eye/> : <EyeOff /> });
  }, [isZenMode, addToast]);

  const handleToggleTimer = useCallback(() => {
    toggleTimer();
    addToast('Timer toggled.', { icon: <Play /> });
    setCommandPaletteOpen(false);
  }, [addToast, toggleTimer]);
  
  const handleSkipSession = useCallback(() => {
    skipSession();
    addToast('Session skipped.', { icon: <SkipForward /> });
    setCommandPaletteOpen(false);
  }, [addToast, skipSession]);

  const handleShowAddTaskForm = useCallback(() => {
    setAddTaskFormVisible(true);
    setCommandPaletteOpen(false);
  }, []);

  const handleLogDistraction = (distractionName: string) => {
    addDistraction(distractionName);
    setIsDistractionModalOpen(false);
    addToast('Distraction logged. Stay focused!', { icon: <Zap /> });
  };
  
  const handleLoadTestData = useCallback(() => {
    const { tasks, logs, distractions } = generateMockData();
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('logs', JSON.stringify(logs));
    localStorage.setItem('distractions', JSON.stringify(distractions));
    
    addToast('Test data loaded. App will now reload.', { icon: <Database />, type: 'success' });

    setTimeout(() => {
      window.location.reload();
    }, 1500);
    setCommandPaletteOpen(false);
  }, [addToast]);
  
  const handleToggleFloat = useCallback(() => {
    setIsTimerFloating(prev => !prev);
    setCommandPaletteOpen(false);
    addToast(`Timer ${!isTimerFloating ? 'floating' : 'docked'}.`);
  }, [isTimerFloating, addToast]);


  // Keyboard shortcuts and command palette logic
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
      
      const isInputFocused = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if (isSettingsModalOpen || isCommandPaletteOpen || isInputFocused || isDistractionModalOpen) {
          if (e.key === 'Escape') {
              setIsSettingsModalOpen(false);
              setCommandPaletteOpen(false);
              setIsDistractionModalOpen(false);
          }
          return;
      }
      
      switch(e.key.toLowerCase()) {
        case 't':
          handleToggleTimer();
          break;
        case 's':
          handleSkipSession();
          break;
        case 'n':
          handleShowAddTaskForm();
          break;
        case 'z':
          handleToggleZenMode();
          break;
        case ',':
          if (e.shiftKey) handleOpenSettings();
          break;
        case 'a':
            if (e.shiftKey) handleSetView('analytics');
            break;
        case 'l':
            if (e.shiftKey) handleSetView('social');
            break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsModalOpen, isCommandPaletteOpen, isDistractionModalOpen, handleToggleTimer, handleSkipSession, handleShowAddTaskForm, handleToggleZenMode, handleOpenSettings, handleSetView]);

  const commandActions = useMemo<CommandAction[]>(() => [
    { id: 'toggle-timer', name: 'Start / Stop Timer', shortcut: ['T'], onExecute: handleToggleTimer, icon: <Play size={16} />, keywords: 'timer start stop pause play', group: 'Timer' },
    { id: 'skip-session', name: 'Skip Session', shortcut: ['S'], onExecute: handleSkipSession, icon: <SkipForward size={16} />, keywords: 'next break work', group: 'Timer' },
    { id: 'pop-out-timer', name: 'Pop Out Timer', onExecute: handlePopOut, icon: <ExternalLink size={16} />, keywords: 'window new separate', group: 'Timer' },
    { id: 'toggle-float', name: 'Toggle Floating Timer', onExecute: handleToggleFloat, icon: <PictureInPicture size={16} />, keywords: 'pip picture in picture float dock', group: 'Timer' },
    { id: 'add-task', name: 'Add New Task', shortcut: ['N'], onExecute: handleShowAddTaskForm, icon: <Plus size={16} />, keywords: 'new create task mission', group: 'Tasks' },
    { id: 'zen-mode', name: 'Toggle Zen Mode', shortcut: ['Z'], onExecute: handleToggleZenMode, icon: <Eye size={16} />, keywords: 'focus hide distraction', group: 'General' },
    { id: 'load-test-data', name: 'Load Test Data', onExecute: handleLoadTestData, icon: <Database size={16} />, keywords: 'mock sample seed developer', group: 'General' },
    { id: 'view-focus', name: 'Go to Focus', onExecute: () => handleSetView('focus'), icon: <Focus size={16} />, keywords: 'timer dashboard tasks missions', group: 'Navigation' },
    { id: 'analytics', name: 'View Analytics', shortcut: ['Shift', 'A'], onExecute: () => handleSetView('analytics'), icon: <BarChart3 size={16} />, keywords: 'reports stats data intel', group: 'Navigation' },
    { id: 'alliances', name: 'View Alliances', shortcut: ['Shift', 'L'], onExecute: () => handleSetView('social'), icon: <Users size={16} />, keywords: 'social friends pacts', group: 'Navigation' },
    { id: 'profile', name: 'View Profile', onExecute: () => handleSetView('profile'), icon: <User size={16} />, keywords: 'user account data settings', group: 'Navigation' },
    { id: 'settings', name: 'Open Settings', shortcut: ['Shift', ','], onExecute: handleOpenSettings, icon: <Settings size={16} />, keywords: 'config options preferences', group: 'Navigation' },
  ], [handleToggleTimer, handleSkipSession, handleShowAddTaskForm, handleToggleZenMode, handleSetView, handleOpenSettings, handlePopOut, handleToggleFloat, handleLoadTestData]);

  const HeaderButton = ({ icon: Icon, label, onClick, shortcut }: { icon: React.ElementType, label: string, onClick: () => void, shortcut?: string }) => (
    <button
      onClick={onClick}
      aria-label={label}
      data-tooltip={`${label} ${shortcut ? `(${shortcut})` : ''}`}
      className="relative flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-300 group text-gray-400 hover:text-white hover:bg-white/10 hover:scale-110 active:scale-100 before:content-[attr(data-tooltip)] before:absolute before:top-full before:mt-2 before:px-2 before:py-1 before:bg-dark-card before:text-xs before:rounded-md before:opacity-0 before:invisible group-hover:before:opacity-100 group-hover:before:visible before:transition-opacity whitespace-nowrap"
    >
      <Icon className="w-6 h-6" />
    </button>
  );
  
  const NavButton = ({ icon: Icon, label, onClick, isActive }: { icon: React.ElementType, label: string, onClick: () => void, isActive: boolean }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 active:scale-95 ${
            isActive ? 'bg-electric-blue text-white shadow' : 'text-gray-400 hover:bg-white/10 hover:text-white'
        }`}
    >
        <Icon size={18} />
        <span>{label}</span>
    </button>
  );

  return (
    <div className={`min-h-screen font-sans text-gray-200 bg-dark-bg transition-all duration-500 ${isZenMode ? 'zen-mode' : ''}`}>
      <style>{`
        .zen-mode .zen-fade {
          opacity: 0 !important;
          pointer-events: none !important;
          transition: opacity 0.5s ease-out;
        }
      `}</style>
      <div className="container mx-auto px-4 py-6">
        {/* Header and Navigation */}
        <header className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3 zen-fade">
                <div className="w-10 h-10 bg-gradient-to-br from-accent-indigo to-accent-cyan rounded-full flex items-center justify-center">
                    <Bot className="text-white w-6 h-6"/>
                </div>
                <h1 className="text-2xl font-bold text-white tracking-wider font-display">Zenith Focus</h1>
            </div>
            
             {/* Middle: Main Navigation */}
            <div className="flex items-center gap-1 p-1 bg-dark-card rounded-xl zen-fade">
                <NavButton icon={Focus} label="Focus" onClick={() => setActiveView('focus')} isActive={activeView === 'focus'} />
                <NavButton icon={BarChart3} label="Analytics" onClick={() => setActiveView('analytics')} isActive={activeView === 'analytics'} />
                <NavButton icon={Users} label="Alliances" onClick={() => setActiveView('social')} isActive={activeView === 'social'} />
                <NavButton icon={User} label="Profile" onClick={() => setActiveView('profile')} isActive={activeView === 'profile'} />
            </div>
            
            <div className="flex items-center gap-2">
                <div className="zen-fade flex items-center gap-2">
                    <HeaderButton icon={Settings} label="Settings" onClick={() => setIsSettingsModalOpen(true)} shortcut="Shift+," />
                </div>
                <HeaderButton icon={isZenMode ? EyeOff : Eye} label={isZenMode ? "Exit Zen Mode" : "Enter Zen Mode"} onClick={handleToggleZenMode} shortcut="Z" />
            </div>
        </header>
        
        {/* Main Content */}
        <main>
           {activeView === 'focus' && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                  <div className="lg:col-span-3">
                    {isTimerPoppedOut ? (
                      <PopOutTimerPlaceholder onPopIn={handlePopIn} />
                    ) : isTimerFloating ? (
                      <FloatingTimerPlaceholder onDock={() => setIsTimerFloating(false)} />
                    ) : (
                      <PomodoroTimer
                        timerState={timerState}
                        settings={timerSettingsInSeconds}
                        activeTask={activeTask}
                        toggleTimer={toggleTimer}
                        skipSession={skipSession}
                        resetTimer={resetTimer}
                        startPendingSession={startPendingSession}
                        onPopOut={handlePopOut}
                        onToggleFloating={() => setIsTimerFloating(true)}
                        isZenMode={isZenMode}
                      />
                    )}
                  </div>
                  <div className="lg:col-span-2 zen-fade">
                      <MissionControl 
                          tasks={tasks} 
                          addTask={addTask} 
                          updateTask={updateTask} 
                          deleteTask={deleteTask} 
                          reorderTasks={reorderTasks}
                          logs={todayLogs} 
                          addLog={addLog}
                          isAddTaskFormVisible={isAddTaskFormVisible}
                          setAddTaskFormVisible={setAddTaskFormVisible}
                          categories={categories}
                          categoryMap={categoryMap}
                      />
                  </div>
              </div>
           )}
           {activeView === 'analytics' && (
              <Reports logs={logs} distractions={distractions} tasks={tasks} categoryMap={categoryMap} categories={categories} />
           )}
           {activeView === 'social' && (
              <Social logs={logs} tasks={tasks} goals={goals} updateGoal={updateGoal} addToast={addToast} categoryMap={categoryMap} />
           )}
           {activeView === 'profile' && (
              <Profile 
                profile={profile}
                updateProfile={updateProfile}
                logs={logs}
                tasks={tasks}
                categories={categories}
                addToast={addToast}
                addTask={addTask}
                openSettings={() => setIsSettingsModalOpen(true)}
              />
           )}
        </main>
      </div>

      {isTimerFloating && (
        <div
          style={{
            position: 'fixed',
            top: floatingPosition.y,
            left: floatingPosition.x,
            zIndex: 40,
          }}
        >
          <PomodoroTimer
            timerState={timerState}
            settings={timerSettingsInSeconds}
            activeTask={activeTask}
            toggleTimer={toggleTimer}
            skipSession={skipSession}
            resetTimer={resetTimer}
            startPendingSession={startPendingSession}
            isFloating={true}
            onDock={() => setIsTimerFloating(false)}
            dragHandleProps={{ onMouseDown: handleDragMouseDown }}
          />
        </div>
      )}

      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        actions={commandActions}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentSettings={settings}
        onSave={updateSettings}
        themes={themes}
        activeTheme={activeTheme}
        setTheme={setThemeId}
        categories={categories}
        addCategory={addCategory}
        updateCategory={updateCategory}
        deleteCategory={deleteCategory}
      />

      <DistractionModal
        isOpen={isDistractionModalOpen}
        onClose={() => setIsDistractionModalOpen(false)}
        onLog={handleLogDistraction}
      />

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default App;