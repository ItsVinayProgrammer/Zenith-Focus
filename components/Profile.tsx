import React, { useState, useMemo, useCallback, useRef } from 'react';
import type { UserProfile, SessionLog, Task, Category } from '../types';
import GlassCard from './ui/Card';
import { Edit, Save, User, BarChart, Clock, Calendar, Database, Upload, Download, Trash2, Settings, Bot, Plus, Loader2 } from 'lucide-react';
import ConfirmationModal from './ui/ConfirmationModal';
import { generateMockData } from '../utils/mockData';
import { suggestNextTask } from '../services/geminiService';

interface ProfileProps {
  profile: UserProfile;
  updateProfile: (profile: Partial<UserProfile>) => void;
  logs: SessionLog[];
  tasks: Task[];
  categories: Category[];
  addToast: (message: string, options?: any) => void;
  addTask: (task: Omit<Task, 'id' | 'status' | 'pomodorosCompleted' | 'createdAt' | 'subtasks'>) => void;
  openSettings: () => void;
}

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number }> = ({ icon, label, value }) => (
    <div className="bg-white/5 p-4 rounded-lg flex items-center gap-4">
        <div className="w-10 h-10 flex-shrink-0 bg-black/20 rounded-lg flex items-center justify-center text-accent-cyan">{icon}</div>
        <div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-gray-400">{label}</p>
        </div>
    </div>
);

const Profile: React.FC<ProfileProps> = ({ profile, updateProfile, logs, tasks, categories, addToast, addTask, openSettings }) => {
    const [isEditingName, setIsEditingName] = useState(false);
    const [name, setName] = useState(profile.name);
    const [confirmation, setConfirmation] = useState<{ type: 'import' | 'clear' | 'loadTest'; file?: File } | null>(null);
    const [suggestedTask, setSuggestedTask] = useState<{ title: string; category: string; pomodoros: number } | null>(null);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const importFileRef = useRef<HTMLInputElement>(null);

    const lifetimeStats = useMemo(() => {
        const totalFocusSeconds = logs.reduce((sum, log) => log.type === 'work' ? sum + log.duration : sum, 0);
        const firstLogDate = logs.length > 0 ? new Date(logs[0].startTime) : new Date();
        return {
            totalHours: (totalFocusSeconds / 3600).toFixed(1),
            totalSessions: logs.filter(l => l.type === 'work').length,
            memberSince: firstLogDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long' }),
        };
    }, [logs]);

    const handleNameSave = () => {
        if (name.trim()) {
            updateProfile({ name: name.trim() });
            setIsEditingName(false);
            addToast('Profile name updated!', { type: 'success' });
        }
    };

    const handleExport = () => {
        try {
            const dataToExport: Record<string, string | null> = {};
            const keysToExport = ['tasks', 'logs', 'distractions', 'goals', 'timerSettings', 'taskCategories', 'userProfile', 'themeId'];
            keysToExport.forEach(key => {
                dataToExport[key] = localStorage.getItem(key);
            });
            const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(dataToExport, null, 2))}`;
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `zenith-focus-backup-${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            addToast('Data exported successfully.', { type: 'success' });
        } catch (error) {
            addToast('Failed to export data.', { type: 'error' });
            console.error(error);
        }
    };
    
    const handleImportClick = () => {
        importFileRef.current?.click();
    };

    const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setConfirmation({ type: 'import', file });
        }
        // Reset file input value to allow re-uploading the same file
        if (importFileRef.current) {
            importFileRef.current.value = '';
        }
    };
    
    const executeImport = () => {
        if (confirmation?.type !== 'import' || !confirmation.file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("Invalid file content");
                
                const data = JSON.parse(text);
                const requiredKeys = ['tasks', 'logs', 'timerSettings', 'taskCategories'];
                if (!requiredKeys.every(key => key in data)) {
                    throw new Error("Invalid backup file structure.");
                }

                Object.keys(data).forEach(key => {
                    if (typeof data[key] === 'string') {
                        localStorage.setItem(key, data[key]);
                    }
                });

                addToast('Data imported successfully. App will now reload.', { type: 'success' });
                setTimeout(() => window.location.reload(), 1500);

            } catch (error) {
                addToast(error instanceof Error ? error.message : 'Failed to import data.', { type: 'error' });
                console.error(error);
            }
        };
        reader.readAsText(confirmation.file);
        setConfirmation(null);
    };

    const executeClear = () => {
        try {
            const keysToClear = ['tasks', 'logs', 'distractions', 'goals', 'timerSettings', 'taskCategories', 'userProfile', 'themeId'];
            keysToClear.forEach(key => localStorage.removeItem(key));
            addToast('All data cleared. App will now reload.', { type: 'success' });
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
             addToast('Failed to clear data.', { type: 'error' });
        }
        setConfirmation(null);
    };

    const executeLoadTest = () => {
        const { tasks, logs, distractions } = generateMockData();
        localStorage.setItem('tasks', JSON.stringify(tasks));
        localStorage.setItem('logs', JSON.stringify(logs));
        localStorage.setItem('distractions', JSON.stringify(distractions));
        
        addToast('Test data loaded. App will now reload.', { icon: <Database />, type: 'success' });
        setTimeout(() => window.location.reload(), 1500);
        setConfirmation(null);
    }
    
    const handleSuggestMission = async () => {
      setIsSuggesting(true);
      setSuggestedTask(null);
      try {
        const suggestion = await suggestNextTask(tasks, logs, categories);
        if (suggestion) {
          setSuggestedTask(suggestion);
        } else {
          addToast("Couldn't generate a suggestion right now.", { type: 'error' });
        }
      } catch (error) {
        addToast("AI suggestion failed. Please check your API key.", { type: 'error' });
      } finally {
        setIsSuggesting(false);
      }
    };
    
    const handleAddTask = () => {
        if (suggestedTask) {
            addTask({
                title: suggestedTask.title,
                category: suggestedTask.category,
                pomodoros: suggestedTask.pomodoros,
                priority: 'medium'
            });
            addToast('Mission added to your Task Matrix!', { type: 'success' });
            setSuggestedTask(null);
        }
    };


    return (
    <>
      <div className="h-full flex flex-col gap-6">
         <header>
            <h1 className="text-4xl font-bold text-white tracking-tight font-display">Profile & Data</h1>
            <p className="text-gray-400 mt-1">Manage your identity and control your data stream.</p>
         </header>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2 space-y-6">
                <GlassCard className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 flex-shrink-0 bg-gradient-to-br from-accent-indigo to-accent-cyan rounded-full flex items-center justify-center">
                            <span className="text-4xl font-bold text-white">{profile.name.charAt(0)}</span>
                        </div>
                        <div className="flex-1">
                            {isEditingName ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="text-2xl font-bold text-white bg-black/20 p-2 rounded-md border border-white/10 focus:outline-none focus:ring-1 focus:ring-electric-blue w-full"
                                        autoFocus
                                    />
                                    <button onClick={handleNameSave} className="p-3 bg-electric-blue rounded-md text-white hover:bg-opacity-80 transition-all active:scale-95"><Save size={18}/></button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <h2 className="text-3xl font-bold text-white">{profile.name}</h2>
                                    <button onClick={() => setIsEditingName(true)} className="p-2 text-gray-400 hover:text-white"><Edit size={18}/></button>
                                </div>
                            )}
                            <p className="text-gray-400">Zenith Operative</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                       <StatCard icon={<Clock size={20}/>} label="Total Focus Hours" value={lifetimeStats.totalHours} />
                       <StatCard icon={<BarChart size={20}/>} label="Sessions Completed" value={lifetimeStats.totalSessions} />
                       <StatCard icon={<Calendar size={20}/>} label="Member Since" value={lifetimeStats.memberSince} />
                    </div>
                </GlassCard>

                <GlassCard className="p-6">
                    <h3 className="flex items-center gap-2 text-xl font-bold text-white mb-4">
                        <Bot className="text-accent-cyan" />
                        AI Mission Control
                    </h3>
                    <div className="space-y-4">
                      {isSuggesting && (
                        <div className="bg-white/5 p-4 rounded-lg flex items-center justify-center gap-3 text-gray-400">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Nexus is analyzing your data stream...</span>
                        </div>
                      )}
                      {suggestedTask && (
                        <div className="bg-white/5 p-4 rounded-lg animate-dropdown-enter">
                          <p className="text-sm text-gray-400">Nexus suggests your next mission:</p>
                          <p className="text-lg font-semibold text-white mt-1">"{suggestedTask.title}"</p>
                          <div className="flex items-center justify-between mt-3">
                            <p className="text-sm text-gray-300">Category: <span className="font-semibold text-white">{suggestedTask.category}</span> | Pomodoros: <span className="font-semibold text-white">{suggestedTask.pomodoros}</span></p>
                            <button onClick={handleAddTask} className="flex items-center gap-2 bg-electric-blue text-white font-semibold px-3 py-2 text-sm rounded-md transition-all hover:bg-opacity-80 active:scale-95">
                                <Plus size={16}/> Accept Mission
                            </button>
                          </div>
                        </div>
                      )}
                       <button onClick={handleSuggestMission} disabled={isSuggesting} className="w-full bg-gradient-to-r from-accent-indigo to-electric-blue text-white font-semibold px-4 py-3 rounded-lg transition-transform hover:scale-105 active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed">
                            Suggest a Mission
                        </button>
                    </div>
                </GlassCard>

             </div>
             
             <div className="space-y-6">
                <GlassCard className="p-6">
                  <h3 className="flex items-center gap-2 text-xl font-bold text-white mb-4">
                    <Database />
                    Data Management
                  </h3>
                  <div className="space-y-3">
                    <button onClick={handleExport} className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all active:scale-95">
                        <Download size={16}/> Export All Data
                    </button>
                    <button onClick={handleImportClick} className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all active:scale-95">
                        <Upload size={16}/> Import from Backup
                    </button>
                    <input type="file" ref={importFileRef} onChange={handleFileSelected} accept=".json" className="hidden" />
                    <button onClick={() => setConfirmation({ type: 'loadTest' })} className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-all active:scale-95">
                        <Database size={16}/> Load Test Data
                    </button>
                    <button onClick={() => setConfirmation({ type: 'clear' })} className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all active:scale-95">
                        <Trash2 size={16}/> Clear All Data
                    </button>
                  </div>
                </GlassCard>
                <GlassCard className="p-6">
                   <h3 className="flex items-center gap-2 text-xl font-bold text-white mb-4">
                    <Settings />
                    Configuration
                  </h3>
                  <button onClick={openSettings} className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all active:scale-95">
                     <Settings size={16}/> Open Settings Panel
                  </button>
                </GlassCard>
             </div>
         </div>
      </div>
      
      {confirmation?.type === 'import' && (
         <ConfirmationModal
            isOpen={true}
            onClose={() => setConfirmation(null)}
            onConfirm={executeImport}
            title="Confirm Data Import"
            confirmText="Import and Reload"
        >
            <p>You are about to import data from the file <strong className="text-white">{confirmation.file?.name}</strong>.</p>
            <p className="mt-2">This will <strong className="text-red-400">overwrite all current application data</strong>, including tasks, logs, and settings. This action cannot be undone.</p>
        </ConfirmationModal>
      )}

      {confirmation?.type === 'clear' && (
         <ConfirmationModal
            isOpen={true}
            onClose={() => setConfirmation(null)}
            onConfirm={executeClear}
            title="Confirm Clear All Data"
            confirmText="Delete Everything"
            prompt="DELETE"
        >
            <p>You are about to <strong className="text-red-400">permanently delete all your data</strong>, including tasks, logs, goals, and settings.</p>
            <p className="mt-2">This action is irreversible and will reset the application to its initial state.</p>
        </ConfirmationModal>
      )}

      {confirmation?.type === 'loadTest' && (
         <ConfirmationModal
            isOpen={true}
            onClose={() => setConfirmation(null)}
            onConfirm={executeLoadTest}
            title="Confirm Load Test Data"
            confirmText="Load Data"
        >
            <p>This will <strong className="text-yellow-400">replace all your current data</strong> with a set of pre-generated sample data for testing and demonstration purposes.</p>
            <p className="mt-2">Your existing data will be lost. This action cannot be undone.</p>
        </ConfirmationModal>
      )}
    </>
    );
};

export default Profile;
