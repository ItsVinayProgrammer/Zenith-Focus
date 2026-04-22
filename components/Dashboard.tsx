import React, { useState } from 'react';
import type { Task, SessionLog, Category } from '../types';
import TaskMatrix from './TaskMatrix';
import DailyIntel from './DailyIntel';
import SessionLogView from './SessionLogView';
import GlassCard from './ui/Card';
import { ListChecks, BarChartHorizontal, History } from 'lucide-react';

interface MissionControlProps {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'status' | 'pomodorosCompleted' | 'createdAt' | 'subtasks'>) => void;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  reorderTasks: (draggedId: string, overId: string) => void;
  logs: SessionLog[];
  addLog: (log: Omit<SessionLog, 'id'>) => void;
  isAddTaskFormVisible: boolean;
  setAddTaskFormVisible: (isVisible: boolean) => void;
  categories: Category[];
  categoryMap: Record<string, { color: string; icon: React.ReactNode }>;
}

type MissionControlTab = 'tasks' | 'intel' | 'logs';

const MissionControl: React.FC<MissionControlProps> = (props) => {
  const [activeTab, setActiveTab] = useState<MissionControlTab>('tasks');

  // ✅ Sample logs for debugging DailyIntel
  const sampleLogs: SessionLog[] = [
    {
      id: "1",
      taskId: props.tasks[0]?.id || "task1",
      type: "work",
      startTime: new Date().toISOString(),
      duration: 1500, // seconds
      category: "Coding",
    },
    {
      id: "2",
      type: "shortBreak",
      startTime: new Date().toISOString(),
      duration: 300, // seconds
    },
    {
      id: "3",
      taskId: props.tasks[1]?.id || "task2",
      type: "work",
      startTime: new Date().toISOString(),
      duration: 1200,
      category: "Design",
    }
  ];

  const tabs = [
    { id: 'tasks', label: 'Task Matrix', icon: ListChecks },
    { id: 'intel', label: 'Daily Intel', icon: BarChartHorizontal },
    { id: 'logs', label: 'Session Log', icon: History },
  ];

  // Debugging: check logs being passed
  console.log("🚀 MissionControl tasks:", props.tasks);
  console.log("🚀 MissionControl logs:", props.logs);

  return (
    <GlassCard className="flex-1 flex flex-col p-4 h-full min-h-[600px]">
      <div className="flex-shrink-0 mb-4">
        <div className="flex items-center bg-black/20 p-1 rounded-lg">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as MissionControlTab)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-md transition-all duration-200 active:scale-95 ${
                activeTab === tab.id
                  ? 'bg-electric-blue text-white shadow'
                  : 'text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'tasks' && <TaskMatrix {...props} />}
        {activeTab === 'intel' && (
          <DailyIntel
            tasks={props.tasks}
            // ✅ Use real logs if available, otherwise fallback to sample logs
            logs={props.logs.length > 0 ? props.logs : sampleLogs}
            categoryMap={props.categoryMap}
          />
        )}
        {activeTab === 'logs' && (
          <SessionLogView
            logs={props.logs}
            addLog={props.addLog}
            tasks={props.tasks}
            categoryMap={props.categoryMap}
            categories={props.categories}
          />
        )}
      </div>
    </GlassCard>
  );
};

export default MissionControl;
