


import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Task, Category } from '../types';
import { PRIORITY_CONFIG, PRIORITY_OPTIONS, DEFAULT_CATEGORIES, ICONS } from '../constants';
import { Plus, Trash2, Check, Play, Undo2, ArrowDownUp, TrendingUp, TrendingDown, Sparkles, X } from 'lucide-react';
import CustomSelect from './ui/CustomSelect';
import { suggestCategory } from '../services/geminiService';

interface TaskMatrixProps {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'status' | 'pomodorosCompleted' | 'createdAt' | 'subtasks'>) => void;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  reorderTasks: (draggedId: string, overId: string) => void;
  isAddTaskFormVisible: boolean;
  setAddTaskFormVisible: (isVisible: boolean) => void;
  categories: Category[];
  categoryMap: Record<string, { color: string; icon: React.ReactNode }>;
}

interface TaskItemProps {
  task: Task;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, task: Task) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, task: Task) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, task: Task) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  isBeingDragged: boolean;
  isDragTarget: boolean;
  isDraggable: boolean;
  categoryMap: Record<string, { color: string; icon: React.ReactNode }>;
}

const TaskItem: React.FC<TaskItemProps> = ({ 
    task, updateTask, deleteTask, 
    onDragStart, onDragEnd, onDragOver, onDrop, onDragLeave,
    isBeingDragged, isDragTarget, isDraggable, categoryMap
}) => {
    const [isConfirmingDone, setIsConfirmingDone] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);
    const { icon, color } = categoryMap[task.category] || categoryMap['fallback'];

    const handleSetInProgress = () => {
        if (task.status !== 'in_progress') {
            updateTask({ ...task, status: 'in_progress' });
        }
    }

    const handleConfirmSetDone = () => {
        if (task.status !== 'done' && !isCompleting) {
            setIsCompleting(true);
            setTimeout(() => {
                updateTask({ ...task, status: 'done' });
            }, 300); // Match transition duration
        }
        setIsConfirmingDone(false);
    }

    const handleRevert = () => {
        updateTask({ ...task, status: 'todo' });
    }
    
    const progressPercentage = task.pomodoros > 0 ? (task.pomodorosCompleted / task.pomodoros) * 100 : 0;

    return (
        <div 
            draggable={isDraggable}
            onDragStart={e => onDragStart(e, task)}
            onDragEnd={onDragEnd}
            onDragOver={e => onDragOver(e, task)}
            onDrop={e => onDrop(e, task)}
            onDragLeave={onDragLeave}
            className={`relative p-3 rounded-lg flex items-center gap-3 border-l-4 transition-all duration-200 
                ${PRIORITY_CONFIG[task.priority].borderColor}
                ${isDraggable ? 'cursor-grab' : ''}
                ${isBeingDragged ? 'opacity-50' : ''}
                ${isDragTarget
                    ? 'bg-electric-blue/10 border-t-4 border-electric-blue'
                    : `${PRIORITY_CONFIG[task.priority].bgColor} border-t-4 border-transparent`
                }
                ${isCompleting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>

            <div className="flex-1 overflow-hidden">
                <div className="flex items-center gap-2">
                    <span style={{ color: color }} className="flex-shrink-0">{icon}</span>
                    {PRIORITY_CONFIG[task.priority].icon}
                    <p className={`text-white font-medium truncate transition-colors duration-300 ${task.status === 'done' ? 'line-through text-gray-500' : ''}`}>{task.title}</p>
                </div>
                <div className="flex items-center gap-3 mt-2 pl-10">
                    <div className="w-full bg-black/40 rounded-full h-2.5">
                        <div 
                            className="bg-gradient-to-r from-accent-indigo to-accent-cyan h-full rounded-full transition-all duration-500 ease-out"
                            style={{ 
                                width: `${progressPercentage}%`,
                                boxShadow: progressPercentage > 0 ? `0 0 12px 2px ${color}55` : 'none'
                            }}>
                        </div>
                    </div>
                    <p className="text-xs font-mono text-gray-400 whitespace-nowrap">{task.pomodorosCompleted}/{task.pomodoros}</p>
                </div>
            </div>
            
            {isConfirmingDone ? (
                <>
                    <button onClick={handleConfirmSetDone} className="p-2 text-green-400 hover:text-white rounded-full hover:bg-green-500/20 transition-all duration-150 active:scale-90" aria-label="Confirm completion">
                        <Check size={18} />
                    </button>
                    <button onClick={() => setIsConfirmingDone(false)} className="p-2 text-red-400 hover:text-white rounded-full hover:bg-red-500/20 transition-all duration-150 active:scale-90" aria-label="Cancel completion">
                        <X size={18} />
                    </button>
                </>
            ) : (
                <>
                    {task.status === 'todo' && (
                         <button onClick={handleSetInProgress} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-all duration-150 active:scale-90" aria-label="Set as active task">
                            <Play size={16} />
                        </button>
                    )}
                    {task.status !== 'done' && (
                         <button onClick={() => setIsConfirmingDone(true)} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-all duration-150 active:scale-90" aria-label="Mark as done">
                            <Check size={16} />
                        </button>
                    )}
                     {task.status === 'done' && (
                        <button onClick={handleRevert} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-all duration-150 active:scale-90" aria-label="Revert to to-do">
                            <Undo2 size={16} />
                        </button>
                    )}
                    <button onClick={() => deleteTask(task.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-white/10 transition-all duration-150 active:scale-90" aria-label="Delete task">
                        <Trash2 size={16} />
                    </button>
                </>
            )}
        </div>
    );
};

const TaskMatrix: React.FC<TaskMatrixProps> = ({ tasks, addTask, updateTask, deleteTask, reorderTasks, isAddTaskFormVisible, setAddTaskFormVisible, categories, categoryMap }) => {
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskCategory, setNewTaskCategory] = useState<string>(DEFAULT_CATEGORIES[0]?.name || 'Work');
    const [newTaskPomodoros, setNewTaskPomodoros] = useState(1);
    const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [isAiSuggesting, setIsAiSuggesting] = useState(false);
    const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
    
    type SortOrder = 'manual' | 'date-asc' | 'date-desc';
    const [sortOrder, setSortOrder] = useState<SortOrder>('manual');
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
    const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);

    const titleInputRef = useRef<HTMLInputElement>(null);
    const pomodoroInputRef = useRef<HTMLInputElement>(null);
    const addTaskButtonRef = useRef<HTMLButtonElement>(null);
    const wasFormVisible = useRef(isAddTaskFormVisible);

    useEffect(() => {
        if (isAddTaskFormVisible) {
            titleInputRef.current?.focus();
        } else if (wasFormVisible.current && !isAddTaskFormVisible) {
            addTaskButtonRef.current?.focus();
        }
        wasFormVisible.current = isAddTaskFormVisible;
    }, [isAddTaskFormVisible]);

    // Debounce effect for AI suggestion
    useEffect(() => {
        setSuggestedCategory(null); // Reset suggestion on new input
        if (newTaskTitle.trim().length < 5) {
            return;
        }

        const handler = setTimeout(async () => {
            setIsAiSuggesting(true);
            const suggestion = await suggestCategory(newTaskTitle, categories);
            if (suggestion) {
                setSuggestedCategory(suggestion);
            }
            setIsAiSuggesting(false);
        }, 800); // 800ms debounce delay

        return () => {
            clearTimeout(handler);
            setIsAiSuggesting(false);
        };
    }, [newTaskTitle, categories]);

    const { highPriority, mediumPriority, lowPriority } = useMemo(() => {
        const todo = tasks.filter(t => t.status === 'todo');

        const sorter = (a: Task, b: Task) => {
            if (sortOrder === 'date-asc') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            if (sortOrder === 'date-desc') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            return 0;
        };

        let high = todo.filter(t => t.priority === 'high');
        let medium = todo.filter(t => t.priority === 'medium');
        let low = todo.filter(t => t.priority === 'low');
        
        if (sortOrder !== 'manual') {
            high = high.sort(sorter);
            medium = medium.sort(sorter);
            low = low.sort(sorter);
        }

        return { highPriority: high, mediumPriority: medium, lowPriority: low };
    }, [tasks, sortOrder]);
    
    const inProgressTask = tasks.find(t => t.status === 'in_progress');
    const doneTasks = tasks.filter(t => t.status === 'done');
    
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, task: Task) => {
        if (sortOrder === 'manual' && task.status === 'todo') {
            e.dataTransfer.setData('text/plain', task.id);
            // Use a slight delay to allow the browser to render the drag image before state updates
            setTimeout(() => {
                setDraggedTaskId(task.id);
            }, 0);
        } else {
            e.preventDefault();
        }
    };

    const handleDragEnd = () => {
        setDraggedTaskId(null);
        setDragOverTaskId(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, task: Task) => {
        e.preventDefault();
        const draggedTask = tasks.find(t => t.id === draggedTaskId);
        if (draggedTask && draggedTask.priority === task.priority && task.id !== draggedTaskId && task.status === 'todo') {
            setDragOverTaskId(task.id);
        }
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, task: Task) => {
        e.preventDefault();
        if (draggedTaskId) {
            const draggedTask = tasks.find(t => t.id === draggedTaskId);
            if (draggedTask && draggedTask.priority === task.priority) {
                reorderTasks(draggedTaskId, task.id);
                setSortOrder('manual');
            }
        }
        handleDragEnd();
    };

    const handleDragLeave = () => {
        setDragOverTaskId(null);
    };

    const handleSortClick = () => {
        const nextOrder: Record<SortOrder, SortOrder> = {
            'manual': 'date-desc',
            'date-desc': 'date-asc',
            'date-asc': 'manual',
        };
        setSortOrder(prev => nextOrder[prev]);
    };

    const sortConfig: Record<SortOrder, { icon: React.ReactNode; label: string }> = {
        'manual': { icon: <ArrowDownUp size={14} />, label: "Manual Order"},
        'date-desc': { icon: <TrendingDown size={14} />, label: "Newest First" },
        'date-asc': { icon: <TrendingUp size={14} />, label: "Oldest First" },
    };

    const categoryOptions = useMemo(() =>
        categories.map(cat => ({
            value: cat.name,
            label: cat.name,
            icon: <span style={{ color: cat.color }}>{ICONS[cat.icon] || ICONS['Tag']}</span>,
        }))
    , [categories]);
    
    const handleCategoryChange = (value: string) => {
        setNewTaskCategory(value);
        setSuggestedCategory(null);
    };
    
    const handleApplySuggestion = () => {
        if (suggestedCategory) {
            setNewTaskCategory(suggestedCategory);
            setSuggestedCategory(null);
            pomodoroInputRef.current?.focus();
        }
    };

    const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Tab' && !e.shiftKey && suggestedCategory && suggestedCategory !== newTaskCategory) {
            e.preventDefault();
            handleApplySuggestion();
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTaskTitle.trim()) {
            addTask({ title: newTaskTitle, category: newTaskCategory, pomodoros: newTaskPomodoros, priority: newTaskPriority });
            setNewTaskTitle('');
            setNewTaskCategory(DEFAULT_CATEGORIES[0]?.name || 'Work');
            setNewTaskPomodoros(1);
            setNewTaskPriority('medium');
            setAddTaskFormVisible(false);
            setSuggestedCategory(null);
        }
    };
    
    const renderTaskList = (list: Task[], title: string) => {
        if (list.length === 0) return null;
        return (
            <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-500 tracking-wider px-1">{title}</h4>
                {list.map(task => 
                    <TaskItem 
                        key={task.id} 
                        task={task} 
                        updateTask={updateTask} 
                        deleteTask={deleteTask}
                        categoryMap={categoryMap}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onDragLeave={handleDragLeave}
                        isDraggable={sortOrder === 'manual'}
                        isBeingDragged={draggedTaskId === task.id}
                        isDragTarget={dragOverTaskId === task.id}
                    />
                )}
            </div>
        )
    };

    return (
        <div className="h-full flex flex-col gap-4 text-gray-200 p-2">
            {!isAddTaskFormVisible ? (
                 <button ref={addTaskButtonRef} onClick={() => setAddTaskFormVisible(true)} className="flex items-center justify-center gap-2 w-full bg-electric-blue/10 hover:bg-electric-blue/20 text-electric-blue font-semibold px-4 py-3 rounded-lg transition-all active:scale-95">
                    <Plus size={18} /> Add New Task
                </button>
            ) : (
                <form onSubmit={handleSubmit} className="bg-white/5 p-4 rounded-lg flex flex-col gap-3">
                    <input
                        ref={titleInputRef}
                        type="text"
                        value={newTaskTitle}
                        onChange={e => setNewTaskTitle(e.target.value)}
                        onKeyDown={handleTitleKeyDown}
                        placeholder="What's the mission? (Press Enter to save)"
                        className="w-full bg-black/20 p-2 rounded-md border border-white/10 focus:outline-none focus:ring-2 focus:ring-electric-blue"
                    />
                    <div className="grid grid-cols-3 gap-2">
                        <div className="relative">
                            <CustomSelect
                                value={newTaskCategory}
                                onChange={handleCategoryChange}
                                options={categoryOptions}
                                isHighlighted={!!suggestedCategory && suggestedCategory !== newTaskCategory}
                            />
                             {isAiSuggesting && (
                                <div className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-accent-indigo rounded-full" title="AI is thinking...">
                                    <Sparkles size={12} className="text-white animate-spin" />
                                </div>
                            )}
                        </div>
                         <input
                            ref={pomodoroInputRef}
                            type="number"
                            value={newTaskPomodoros}
                            onChange={e => setNewTaskPomodoros(Math.max(1, parseInt(e.target.value, 10) || 1))}
                            min="1"
                            placeholder="Pomodoros"
                            className="bg-black/20 p-2 rounded-md border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue"
                         />
                         <CustomSelect
                            value={newTaskPriority}
                            onChange={(value) => setNewTaskPriority(value as 'low' | 'medium' | 'high')}
                            options={PRIORITY_OPTIONS}
                        />
                    </div>
                    {suggestedCategory && suggestedCategory !== newTaskCategory && (
                        <div className="animate-dropdown-enter -mt-1">
                            <button
                                type="button"
                                onClick={handleApplySuggestion}
                                className="flex items-center gap-2 text-xs text-accent-cyan bg-accent-cyan/10 hover:bg-accent-cyan/20 px-3 py-1.5 rounded-md transition-all w-full sm:w-auto active:scale-95"
                            >
                                <Sparkles size={14} />
                                <span>AI Suggestion: <span className="font-semibold">{suggestedCategory}</span></span>
                                <span className="text-gray-500 ml-2 border border-gray-600/50 bg-black/20 rounded px-1.5 py-0.5 font-sans">Tab</span>
                            </button>
                        </div>
                    )}
                    <div className="flex justify-end gap-2">
                         <button type="button" onClick={() => setAddTaskFormVisible(false)} className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-sm transition-all duration-150 active:scale-95">Cancel</button>
                         <button type="submit" className="px-3 py-1.5 rounded-md bg-electric-blue hover:bg-opacity-80 text-white font-semibold text-sm transition-all duration-150 active:scale-95">Add Task</button>
                    </div>
                </form>
            )}

            <div className="space-y-4 flex-1 overflow-y-auto">
                {inProgressTask && (
                    <div>
                        <h3 className="text-sm font-bold uppercase text-accent-cyan tracking-wider mb-2">In Progress</h3>
                        <TaskItem 
                            task={inProgressTask} 
                            updateTask={updateTask} 
                            deleteTask={deleteTask}
                            categoryMap={categoryMap}
                            onDragStart={()=>{}} onDragEnd={()=>{}} onDragOver={()=>{}} onDrop={()=>{}} onDragLeave={()=>{}}
                            isDraggable={false} isBeingDragged={false} isDragTarget={false}
                        />
                    </div>
                )}
                 <div>
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-bold uppercase text-gray-400 tracking-wider">Todo</h3>
                        <button onClick={handleSortClick} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-white/5 px-2 py-1 rounded-md transition-all duration-150 active:scale-95">
                           {sortConfig[sortOrder].icon} {sortConfig[sortOrder].label}
                        </button>
                    </div>
                    <div className="space-y-4">
                        {renderTaskList(highPriority, 'High Priority')}
                        {renderTaskList(mediumPriority, 'Medium Priority')}
                        {renderTaskList(lowPriority, 'Low Priority')}
                        
                        {highPriority.length === 0 && mediumPriority.length === 0 && lowPriority.length === 0 && (
                            <p className="text-gray-500 text-sm text-center py-4">No tasks queued. Ready for a new mission.</p>
                        )}
                    </div>
                </div>
                {doneTasks.length > 0 && (
                     <div>
                        <h3 className="text-sm font-bold uppercase text-gray-600 tracking-wider mb-2">Completed</h3>
                        <div className="space-y-2 opacity-60">
                            {doneTasks.map(task => 
                                <TaskItem 
                                    key={task.id} 
                                    task={task} 
                                    updateTask={updateTask} 
                                    deleteTask={deleteTask}
                                    categoryMap={categoryMap}
                                    onDragStart={()=>{}} onDragEnd={()=>{}} onDragOver={()=>{}} onDrop={()=>{}} onDragLeave={()=>{}}
                                    isDraggable={false} isBeingDragged={false} isDragTarget={false}
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskMatrix;
