

import { useState, useEffect, useCallback } from 'react';
import type { Task, SessionLog, Distraction, AccountabilityGoal, Subtask } from '../types';
// Remove stale informational comment about a past fix.
import { GoalPeriod } from '../types';

const createId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(`Error saving ${key} to localStorage`, error);
  }
};

const sanitizeLogs = (logs: SessionLog[]): SessionLog[] => {
  if (!Array.isArray(logs)) return [];
  return logs.map(log => ({
    ...log,
    duration: Number(log.duration) || 0,
  }));
};

const useProductivityData = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('tasks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [logs, setLogs] = useState<SessionLog[]>(() => {
    try {
      const saved = localStorage.getItem('logs');
      if (saved) {
        const parsedLogs = JSON.parse(saved);
        return sanitizeLogs(parsedLogs);
      }
    } catch (error) {
      console.error("Failed to load or parse logs from localStorage", error);
    }
    return [];
  });
  const [distractions, setDistractions] = useState<Distraction[]>(() => {
    try {
      const saved = localStorage.getItem('distractions');
      return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
  });
  const [goals, setGoals] = useState<AccountabilityGoal[]>(() => {
    try {
      const saved = localStorage.getItem('goals');
      return saved ? JSON.parse(saved) : [{ id: 'weekly', period: GoalPeriod.Weekly, targetHours: 20, guiltFreeDays: 1 }];
    } catch {
        return [{ id: 'weekly', period: GoalPeriod.Weekly, targetHours: 20, guiltFreeDays: 1 }];
    }
  });

  useEffect(() => {
    safeSetItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    safeSetItem('logs', JSON.stringify(logs));
  }, [logs]);
  
  useEffect(() => {
    safeSetItem('distractions', JSON.stringify(distractions));
  }, [distractions]);

  useEffect(() => {
    safeSetItem('goals', JSON.stringify(goals));
  }, [goals]);
  
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.newValue) return;
      try {
        switch (e.key) {
          case 'tasks':
            setTasks(JSON.parse(e.newValue));
            break;
          case 'logs':
            setLogs(sanitizeLogs(JSON.parse(e.newValue)));
            break;
          case 'distractions':
            setDistractions(JSON.parse(e.newValue));
            break;
          case 'goals':
            setGoals(JSON.parse(e.newValue));
            break;
        }
      } catch (err) {
        console.error('Error parsing storage update in useProductivityData:', err);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const addTask = useCallback((task: Omit<Task, 'id' | 'status' | 'pomodorosCompleted' | 'createdAt' | 'subtasks'>) => {
    setTasks(prev => [...prev, { 
        ...task, 
        id: createId(), 
        status: 'todo',
        pomodorosCompleted: 0, 
        createdAt: new Date().toISOString(),
        subtasks: []
    }]);
  }, []);

  const updateTask = useCallback((updatedTask: Task) => {
    setTasks(prev => {
      let tasksToUpdate = [...prev];
      // If the updated task is moving to 'in_progress', ensure no other task remains 'in_progress'.
      if (updatedTask.status === 'in_progress') {
        tasksToUpdate = tasksToUpdate.map(task => {
          if (task.id !== updatedTask.id && task.status === 'in_progress') {
            return { ...task, status: 'todo' }; // Set any other 'in_progress' task to 'todo'.
          }
          return task;
        });
      }
      
      // For any other status change, just update the single task.
      return tasksToUpdate.map(task => (task.id === updatedTask.id ? updatedTask : task));
    });
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  }, []);

  const reorderTasks = useCallback((draggedId: string, overId: string) => {
    setTasks(prev => {
        const newTasks = [...prev];
        const draggedIdx = newTasks.findIndex(t => t.id === draggedId);
        const overIdx = newTasks.findIndex(t => t.id === overId);

        if (draggedIdx > -1 && overIdx > -1) {
            const draggedTask = newTasks[draggedIdx];
            const overTask = newTasks[overIdx];
            if (draggedTask.status === 'todo' && overTask.status === 'todo' && draggedTask.priority === overTask.priority) {
                 const [draggedItem] = newTasks.splice(draggedIdx, 1);
                 // After splice, the index of overId might have shifted. Find it again for accuracy.
                 const newOverIdx = newTasks.findIndex(t => t.id === overId);
                 newTasks.splice(newOverIdx, 0, draggedItem);
                 return newTasks;
            }
        }
        return prev;
    });
  }, []);

  const addLog = useCallback((log: Omit<SessionLog, 'id'>) => {
    setLogs(prev => [...prev, { ...log, id: createId() }]);
  }, []);
  
  const addDistraction = useCallback((distractionName: string) => {
    const newDistraction: Distraction = {
      id: createId(),
      name: distractionName,
      timestamp: new Date().toISOString(),
    };
    setDistractions(prev => [...prev, newDistraction]);
  }, []);

  const updateGoal = useCallback((updatedGoal: AccountabilityGoal) => {
      setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
  }, []);

  return { tasks, addTask, updateTask, deleteTask, reorderTasks, logs, addLog, distractions, addDistraction, goals, updateGoal };
};

export default useProductivityData;