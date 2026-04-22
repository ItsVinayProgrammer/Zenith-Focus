import type { Task, SessionLog, Distraction } from '../types';
import { SessionType } from '../types';
import { DEFAULT_CATEGORIES } from '../constants';

export const generateMockData = () => {
    const categories = DEFAULT_CATEGORIES.map(c => c.name);
    const now = new Date();
    const mockTasks: Task[] = [];
    const mockLogs: SessionLog[] = [];
    let taskIdCounter = 0;

    // Generate tasks
    for (let i = 0; i < 20; i++) {
        const createdAt = new Date(now.getTime() - (Math.random() * 30 * 24 * 60 * 60 * 1000));
        const category = categories[i % categories.length];
        const pomodoros = Math.floor(Math.random() * 8) + 2; // 2-9 pomodoros
        const pomodorosCompleted = Math.floor(Math.random() * pomodoros);
        let status: 'todo' | 'in_progress' | 'done' = 'todo';
        if (pomodorosCompleted === pomodoros) {
            status = 'done';
        } else if (pomodorosCompleted > 0 && Math.random() > 0.5) {
            status = 'todo';
        }

        mockTasks.push({
            id: `task-${taskIdCounter++}`,
            title: `Mission ${i + 1}: Implement ${category} feature`,
            category,
            status,
            priority: ['low', 'medium', 'high'][i % 3] as 'low' | 'medium' | 'high',
            pomodoros,
            pomodorosCompleted,
            createdAt: createdAt.toISOString(),
            subtasks: []
        });
    }
    
    // Ensure exactly one task is in progress
    mockTasks.forEach(t => { if(t.status === 'in_progress') t.status = 'todo' });
    const notDoneTask = mockTasks.find(t => t.status !== 'done');
    if (notDoneTask) {
        notDoneTask.status = 'in_progress';
    }


    // Generate logs for the past 30 days
    for (let day = 30; day >= 0; day--) {
        const date = new Date(now.getTime() - (day * 24 * 60 * 60 * 1000));
        const sessionsToday = day > 5 ? Math.floor(Math.random() * 9) : Math.floor(Math.random() * 4); // Fewer sessions in recent days

        let sessionStartTime = new Date(date);
        sessionStartTime.setHours(9, Math.floor(Math.random() * 60), 0, 0); // Start day at 9 AM +/- 60min

        for (let i = 0; i < sessionsToday; i++) {
            const taskForLog = mockTasks.find(t => t.status !== 'done') || mockTasks[0];
            const workDuration = (20 + Math.floor(Math.random() * 10)) * 60; // 20-30 mins
            const breakDuration = (4 + Math.floor(Math.random() * 3)) * 60; // 4-7 mins

            // Work session
            let sessionEndTime = new Date(sessionStartTime.getTime() + workDuration * 1000);
            mockLogs.push({
                id: `log-${day}-${i}-work-${Math.random()}`,
                taskId: taskForLog.id,
                category: taskForLog.category,
                type: SessionType.Work,
                startTime: sessionStartTime.toISOString(),
                endTime: sessionEndTime.toISOString(),
                duration: workDuration,
            });

            sessionStartTime = new Date(sessionEndTime.getTime() + (Math.random() * 60 * 1000));

            // Break session
            sessionEndTime = new Date(sessionStartTime.getTime() + breakDuration * 1000);
            const breakType = i > 0 && i % 4 === 0 ? SessionType.LongBreak : SessionType.ShortBreak;
            mockLogs.push({
                id: `log-${day}-${i}-break-${Math.random()}`,
                type: breakType,
                startTime: sessionStartTime.toISOString(),
                endTime: sessionEndTime.toISOString(),
                duration: breakType === SessionType.LongBreak ? breakDuration * 3 : breakDuration,
            });
            sessionStartTime = new Date(sessionEndTime.getTime() + (Math.random() * 5 * 60 * 1000)); 
        }
    }

    const mockDistractions: Distraction[] = [];
    const distractionTypes = ['Social Media', 'Email/Messages', 'Unrelated Work', 'News', 'Personal'];
    for (let i = 0; i < 50; i++) {
        const timestamp = new Date(now.getTime() - (Math.random() * 30 * 24 * 60 * 60 * 1000));
        mockDistractions.push({
            id: `dist-${i}-${Math.random()}`,
            name: distractionTypes[i % distractionTypes.length],
            timestamp: timestamp.toISOString()
        });
    }
    
    return {
        tasks: mockTasks,
        logs: mockLogs,
        distractions: mockDistractions,
    };
};