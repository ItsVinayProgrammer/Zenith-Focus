import React, { useState } from 'react';
import type { SessionLog, Task, Category } from '../types';
import { SessionType } from '../types';
import { Briefcase, Coffee, BrainCircuit, Plus } from 'lucide-react';
import ManualLogModal from './ManualLogModal';

interface SessionLogViewProps {
  logs: SessionLog[];
  addLog: (log: Omit<SessionLog, 'id'>) => void;
  tasks: Task[];
  categoryMap: Record<string, { color: string; icon: React.ReactNode }>;
  categories: Category[];
}

const SessionLogView: React.FC<SessionLogViewProps> = ({ logs, addLog, tasks, categoryMap, categories }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const sessionDetails = {
        [SessionType.Work]: { icon: Briefcase, label: 'Focus Session', color: 'text-accent-cyan' },
        [SessionType.ShortBreak]: { icon: Coffee, label: 'Short Break', color: 'text-green-400' },
        [SessionType.LongBreak]: { icon: BrainCircuit, label: 'Long Break', color: 'text-yellow-400' },
    }

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    const formatDuration = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        return `${minutes} min`;
    }

    const filteredLogs = logs.filter(log => log.type in sessionDetails);
    const reversedLogs = [...filteredLogs].reverse();

  return (
    <div className="p-2">
        <div className="flex justify-end mb-4">
             <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-white/10 text-gray-300 font-semibold px-3 py-2 rounded-lg transition-all hover:bg-white/20 hover:text-white text-sm active:scale-95"
            >
                <Plus size={16} />
                Manual Entry
            </button>
        </div>
        {reversedLogs.length > 0 ? (
            <ul className="space-y-3">
                {reversedLogs.map(log => {
                    const details = sessionDetails[log.type as keyof typeof sessionDetails];
                    const task = log.taskId ? tasks.find(t => t.id === log.taskId) : null;
                    const logCategoryName = log.category || (task ? task.category : null);
                    const Icon = details.icon;
                    return (
                        <li key={log.id} className="flex items-start gap-4 text-sm">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-white/5 ${details.color} flex-shrink-0`}>
                                <Icon size={16} />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <p className="font-medium text-white">{details.label}</p>
                                    <p className="font-semibold text-gray-300">{formatDuration(log.duration)}</p>
                                </div>
                                <p className="text-xs text-gray-400">{formatTime(log.startTime)} - {formatTime(log.endTime)}</p>
                                {(task || log.notes) && (
                                    <div className="mt-2 pt-2 border-t border-white/10 space-y-2">
                                        {task && (
                                            <div className="flex items-center gap-2 text-xs">
                                                <span style={{ color: (categoryMap[task.category] || categoryMap['fallback']).color }}>
                                                    {(categoryMap[task.category] || categoryMap['fallback']).icon}
                                                </span>
                                                <span className="text-gray-300 font-medium">{task.title}</span>
                                            </div>
                                        )}
                                        {log.notes && <p className="text-sm text-gray-400 whitespace-pre-wrap">{log.notes}</p>}
                                    </div>
                                )}
                            </div>
                        </li>
                    )
                })}
            </ul>
        ) : (
            <p className="text-gray-500 text-sm text-center py-8">No sessions logged yet today. Start the timer to begin.</p>
        )}
        <ManualLogModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            addLog={addLog}
            categories={categories}
        />
    </div>
  );
};

export default SessionLogView;
