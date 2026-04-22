import React, { useMemo } from 'react';
import type { Task, SessionLog } from '../types';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface DailyIntelProps {
  tasks: Task[];
  logs: SessionLog[];
  categoryMap: Record<string, { color: string; icon: React.ReactNode }>;
}

const DailyIntel: React.FC<DailyIntelProps> = ({ tasks, logs, categoryMap }) => {

  // Helper to check if log is for today (local time)
  const isToday = (date: string | number | Date) => {
    const logDate = new Date(date);
    const today = new Date();
    return (
      logDate.getFullYear() === today.getFullYear() &&
      logDate.getMonth() === today.getMonth() &&
      logDate.getDate() === today.getDate()
    );
  };

  // Calculate today's focus, break, and sessions
  const todayStats = useMemo(() => {
    const todayLogs = logs.filter(log => isToday(log.startTime));

    const focusSeconds = todayLogs
      .filter(log => log.type.toLowerCase() === "work")
      .reduce((sum, log) => sum + Number(log.duration || 0), 0);

    const breakSeconds = todayLogs
      .filter(log => ["short_break", "long_break"].includes(log.type.toLowerCase()))
      .reduce((sum, log) => sum + Number(log.duration || 0), 0);

    const allPomodoros = todayLogs.filter(log => log.type.toLowerCase() === "work").length;

    return {
      focusMinutes: Math.floor(focusSeconds / 60),
      breakMinutes: Math.floor(breakSeconds / 60),
      pomodorosCompleted: allPomodoros,
    };
  }, [logs]);

  // Calculate category distribution for pie chart
  const categoryDistribution = useMemo(() => {
    const todayLogs = logs.filter(log => isToday(log.startTime));
    const distribution: { [key: string]: number } = {};

    todayLogs.forEach(log => {
      if (log.type.toLowerCase() === "work") {
        let category: string | undefined | null = null;
        if (log.category) {
          category = log.category;
        } else if (log.taskId) {
          const task = tasks.find(t => t.id === log.taskId);
          if (task) category = task.category;
        }
        if (category) {
          distribution[category] = (distribution[category] || 0) + Number(log.duration || 0);
        }
      }
    });

    return Object.entries(distribution)
      .map(([name, value]) => ({ name, value: Math.round(value / 60) }))
      .filter(item => item.value > 0);

  }, [logs, tasks]);

  // Pie tooltip
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-dark-card/95 backdrop-blur-sm p-3 rounded-xl border border-white/20 shadow-xl">
          <div className="flex items-center gap-2.5 text-sm">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: data.fill }}></div>
            <span className="font-medium text-gray-100">{data.name}</span>
            <span className="ml-auto font-bold text-white whitespace-nowrap">{data.value} min</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Pie chart labels
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.1) return null;

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="p-2 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-white">{todayStats.focusMinutes}</p>
          <p className="text-xs text-gray-400 uppercase">Focus Mins</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{todayStats.breakMinutes}</p>
          <p className="text-xs text-gray-400 uppercase">Break Mins</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{todayStats.pomodorosCompleted}</p>
          <p className="text-xs text-gray-400 uppercase">Sessions</p>
        </div>
      </div>

      {/* Pie chart */}
      <div>
        <h3 className="text-sm font-bold uppercase text-gray-400 tracking-wider mb-2 text-center">Focus Distribution</h3>
        {categoryDistribution.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={categoryDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                innerRadius={40}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={5}
              >
                {categoryDistribution.map(entry => (
                  <Cell key={`cell-${entry.name}`} fill={(categoryMap[entry.name] || categoryMap['fallback']).color} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 text-sm text-center py-4">No focus sessions logged today.</p>
        )}
      </div>
    </div>
  );
};

export default DailyIntel;
