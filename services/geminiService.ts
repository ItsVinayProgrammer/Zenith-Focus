

import { GoogleGenAI, Type } from "@google/genai";
import type { SessionLog, Distraction, Task, Bounty, Category } from '../types';
import { SessionType } from "../types";

if (!process.env.API_KEY) {
  // In a real app, this would be a fatal error.
  // For this context, we will proceed but API calls will fail.
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

interface InsightsPayload {
  logs: SessionLog[]; // Expects pre-filtered logs
  topDistractions: { name: string, count: number }[];
  tasks: Task[];
  timePeriod: 'today' | 'week' | 'month' | 'year';
}

export const generateInsights = async (payload: InsightsPayload): Promise<string> => {
  const { logs, topDistractions, tasks, timePeriod } = payload;

  const totalFocusSeconds = logs.filter(l => l.type === SessionType.Work).reduce((sum, l) => sum + Number(l.duration || 0), 0);
  const totalBreakSeconds = logs.filter(l => l.type === SessionType.ShortBreak || l.type === SessionType.LongBreak).reduce((sum, l) => sum + Number(l.duration || 0), 0);
  const totalPauseSeconds = logs.filter(l => l.type === SessionType.Pause).reduce((sum, l) => sum + Number(l.duration || 0), 0);
  const pauseCount = logs.filter(l => l.type === SessionType.Pause).length;

  const categoryFocus: { [key: string]: number } = {};
  logs.forEach(log => {
    if (log.type === 'work') {
      let category: string | undefined | null = null;
      if (log.category) {
        category = log.category;
      } else if (log.taskId) {
        const task = tasks.find(t => t.id === log.taskId);
        if (task) category = task.category;
      }
      if (category) {
        categoryFocus[category] = (categoryFocus[category] || 0) + Number(log.duration || 0);
      }
    }
  });

  const categoryFocusHours = Object.entries(categoryFocus).map(([category, seconds]) => {
    return `${category}: ${(seconds / 3600).toFixed(2)} hours`;
  }).join('; ') || 'None';
  
  const completedTasks = tasks.filter(t => {
      if (t.status !== 'done') return false;
      // Check if task was completed within the filtered log period
      const lastWorkLog = logs.filter(l => l.taskId === t.id).pop();
      return !!lastWorkLog;
  }).length;

  let peakPerformanceMetric = 'N/A';
  let peakPerformanceLabel = 'Peak Performance';

  if (timePeriod === 'today') {
      const hourlyFocus: { [key: string]: number } = {};
      logs.forEach(log => {
          if (log.type === 'work') {
              const hour = new Date(log.startTime).getHours();
              hourlyFocus[String(hour)] = (hourlyFocus[String(hour)] || 0) + Number(log.duration || 0);
          }
      });
      const peakHour = Object.entries(hourlyFocus).reduce((max, entry) => (entry[1] > max[1] ? entry : max), ['-1', 0])[0];
      if (peakHour !== '-1') {
        peakPerformanceMetric = `${peakHour}:00 - ${parseInt(peakHour) + 1}:00`;
        peakPerformanceLabel = 'Peak Hour';
      }
  } else if (timePeriod === 'week' || timePeriod === 'month') {
      const dailyFocus: { [key: string]: number } = {};
      logs.forEach(log => {
          if (log.type === 'work') {
              const day = new Date(log.startTime).toLocaleDateString();
              dailyFocus[day] = (dailyFocus[day] || 0) + Number(log.duration || 0);
          }
      });
      const peakDay = Object.entries(dailyFocus).reduce((max, entry) => (entry[1] > max[1] ? entry : max), ['', 0])[0];
      if (peakDay) {
          peakPerformanceMetric = new Date(peakDay).toLocaleDateString(undefined, { weekday: 'long' });
          peakPerformanceLabel = 'Peak Day';
      }
  } else if (timePeriod === 'year') {
      const monthlyFocus: { [key: string]: number } = {};
      logs.forEach(log => {
          if (log.type === 'work') {
              const month = new Date(log.startTime).getMonth();
              monthlyFocus[String(month)] = (monthlyFocus[String(month)] || 0) + Number(log.duration || 0);
          }
      });
      const peakMonthIndex = Object.entries(monthlyFocus).reduce((max, entry) => (entry[1] > max[1] ? entry : max), ['-1', 0])[0];
      if (peakMonthIndex !== '-1') {
          peakPerformanceMetric = new Date(0, parseInt(peakMonthIndex)).toLocaleString('default', { month: 'long' });
          peakPerformanceLabel = 'Peak Month';
      }
  }


  const timeFrameText = {
    today: "today's",
    week: "the last 7 days'",
    month: "the last 30 days'",
    year: "the last year's",
  }[timePeriod];

  const prompt = `
    You are 'Nexus', a futuristic 'Quantum Productivity Analyst' for the 'Zenith Focus' app. Your analysis is sharp, insightful, data-driven, and motivating. Provide a detailed, structured analysis of the user's ${timeFrameText} productivity data. The response should be plain text. Use line breaks to separate paragraphs and sections.

    Analyze the following data stream and generate a report.

    **DATA STREAM START**
    - Time Period Analyzed: ${timeFrameText}
    - Total Focus Time: ${(totalFocusSeconds / 3600).toFixed(2)} hours
    - Total Break Time: ${(totalBreakSeconds / 3600).toFixed(2)} hours
    - Interruptions: ${pauseCount} pauses, totaling ${Math.round(totalPauseSeconds / 60)} minutes.
    - Tasks Completed This Period: ${completedTasks}
    - Focus Distribution by Category: ${categoryFocusHours}
    - ${peakPerformanceLabel}: ${peakPerformanceMetric}
    - Top Distractions Logged: ${topDistractions.map(d => `${d.name} (${d.count} times)`).join(', ') || 'None'}
    **DATA STREAM END**

    **REPORT STRUCTURE:**

    **OVERALL ANALYSIS:**
    (Your 2-3 sentence summary of the performance for this period. Mention the balance between focus and breaks.)

    **DEEP DIVE:**
    - **Focus Distribution:** (Analyze where the user's time went. Is it aligned with their goals for this period?)
    - **Interruptions:** (Comment on the pause count and duration. What could it imply about their work environment or focus state?)
    - **Peak Performance:** (Highlight the peak performance metric and suggest how to leverage this information. For example, scheduling demanding tasks during peak hours/days.)

    **ACTIONABLE DIRECTIVES:**
    (Your 2-3 concrete, actionable tips for the next period based on the data. Start each tip with a hyphen '-')

    Keep your language futuristic and empowering. For example: "Nexus analysis complete. Your temporal metrics indicate..." or "To optimize future timelines, consider these directives...". Do not use markdown formatting like ### or **.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to communicate with the AI. Please check the API key configuration.");
  }
};


export const generateBounties = async ({ logs, tasks }: { logs: SessionLog[]; tasks: Task[] }): Promise<Bounty[]> => {
    
    const totalFocusSeconds = logs.filter(l => l.type === SessionType.Work).reduce((sum, l) => sum + Number(l.duration || 0), 0);
    const totalSessions = logs.filter(l => l.type === SessionType.Work).length;

    const categoryFocus: { [key: string]: number } = {};
    logs.forEach(log => {
      if (log.type === 'work') {
        let category: string | undefined | null = null;
        if (log.category) {
          category = log.category;
        } else if (log.taskId) {
          const task = tasks.find(t => t.id === log.taskId);
          if (task) category = task.category;
        }
        if (category) {
          categoryFocus[category] = (categoryFocus[category] || 0) + 1; // count sessions
        }
      }
    });

    const topCategories = Object.entries(categoryFocus)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(entry => entry[0])
        .join(', ') || 'any category';

    const prompt = `
        You are the 'Bounty Coordinator' for a futuristic productivity app called 'Zenith Focus'. 
        Your role is to create 3 engaging, personalized, and challenging (but achievable) productivity challenges (bounties) for a user based on their recent activity.
        The bounties should encourage good habits like consistency, deep work, and exploring different task types.

        **User's Recent Activity (Last 7 Days):**
        - Total Focus Time: ${(totalFocusSeconds / 3600).toFixed(1)} hours
        - Total Focus Sessions: ${totalSessions}
        - Top Task Categories: ${topCategories}
        
        **Instructions:**
        1.  Create exactly 3 unique bounties.
        2.  Make them specific and measurable.
        3.  One bounty should focus on consistency (e.g., focus for X days in a row).
        4.  One bounty should focus on total volume (e.g., achieve X hours of focus).
        5.  One bounty should relate to their top categories: ${topCategories}.
        6.  The tone should be cool, futuristic, and motivating.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: {
                                type: Type.STRING,
                                description: "A short, catchy title for the bounty (e.g., 'Deep Work Marathon').",
                            },
                            description: {
                                type: Type.STRING,
                                description: "A clear, actionable description of what the user needs to do to complete the bounty.",
                            },
                            xp: {
                                type: Type.INTEGER,
                                description: "A number representing the experience points (XP) reward, between 50 and 200.",
                            },
                        },
                        required: ['title', 'description', 'xp'],
                    },
                },
            },
        });

        const jsonStr = response.text.trim();
        const bounties = JSON.parse(jsonStr);
        return bounties as Bounty[];
    } catch (error) {
        console.error("Error calling Gemini API for bounties:", error);
        throw new Error("Failed to generate bounties.");
    }
};

/**
 * Analyzes a task title using the Gemini API and suggests the most relevant category.
 * @param {string} taskTitle The title of the task to analyze. Must be at least 5 characters long.
 * @param {Category[]} categories The list of available categories to choose from.
 * @returns {Promise<string | null>} A promise that resolves to the suggested category name, or null if no suggestion could be made or an error occurred.
 */
export const suggestCategory = async (taskTitle: string, categories: Category[]): Promise<string | null> => {
    if (!taskTitle.trim() || taskTitle.trim().length < 5) {
        return null;
    }

    const categoryNames = categories.map(c => c.name);

    const prompt = `
        Analyze the following task title and choose the most appropriate category from the provided list.
        Task Title: "${taskTitle}"
        
        Available Categories:
        - ${categoryNames.join('\n- ')}

        Choose only one category that best fits the task.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        category: {
                            type: Type.STRING,
                            enum: categoryNames,
                            description: "The suggested category for the task."
                        },
                    },
                    required: ['category'],
                },
            },
        });

        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);
        
        if (result.category && categoryNames.includes(result.category)) {
            return result.category as string;
        }
        return null;
    } catch (error) {
        console.error("Error calling Gemini API for category suggestion:", error);
        // Don't throw, just fail gracefully.
        return null;
    }
};

/**
 * Suggests a new task based on recent activity.
 * @param {Task[]} tasks The user's list of tasks.
 * @param {SessionLog[]} logs The user's recent session logs.
 * @returns {Promise<{title: string, category: string, pomodoros: number} | null>} A suggested task object or null.
 */
export const suggestNextTask = async (
  tasks: Task[],
  logs: SessionLog[],
  categories: Category[]
): Promise<{ title: string; category: string; pomodoros: number } | null> => {
  const recentLogs = logs.slice(-20); // last 20 logs
  const categoryFocus: { [key: string]: number } = {};
  
  recentLogs.forEach(log => {
    if (log.type === 'work') {
      let category: string | undefined | null = null;
      if (log.category) {
        category = log.category;
      } else if (log.taskId) {
        const task = tasks.find(t => t.id === log.taskId);
        if (task) category = task.category;
      }
      if (category) {
        categoryFocus[category] = (categoryFocus[category] || 0) + 1;
      }
    }
  });

  const topCategory = Object.entries(categoryFocus).sort((a, b) => b[1] - a[1])[0]?.[0];
  const existingTaskTitles = tasks.map(t => t.title).join(', ');
  const categoryNames = categories.map(c => c.name);

  const prompt = `
    You are 'Nexus', an AI productivity assistant for 'Zenith Focus'.
    Based on the user's recent activity, suggest a single, actionable, and new task for them to tackle next.
    The task should be something that can be broken down into 1-4 Pomodoro sessions (25 minutes each).
    Do not suggest a task that is too similar to existing tasks.

    **Recent Activity:**
    - Top focus category recently: ${topCategory || 'None'}
    - Existing tasks: ${existingTaskTitles}
    - Available Categories: ${categoryNames.join(', ')}

    **Your Task:**
    Generate a concise task title, estimate the number of Pomodoros (1-4), and pick the most suitable category from the list.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "A short, actionable task title.",
            },
            category: {
              type: Type.STRING,
              enum: categoryNames,
              description: "The most appropriate category from the available list.",
            },
            pomodoros: {
              type: Type.INTEGER,
              description: "Estimated pomodoros required (1-4).",
              minimum: 1,
              maximum: 4,
            },
          },
          required: ['title', 'category', 'pomodoros'],
        },
      },
    });

    const jsonStr = response.text.trim();
    const result = JSON.parse(jsonStr);
    
    // Final check to ensure the category exists
    if (result && categoryNames.includes(result.category)) {
      return result as { title: string; category: string; pomodoros: number };
    }
    return null;
  } catch (error) {
    console.error('Error calling Gemini API for task suggestion:', error);
    return null;
  }
};
