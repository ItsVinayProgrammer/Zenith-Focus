

import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import type { SessionLog, Distraction, Task, Category } from '../types';
import { SessionType } from '../types';
import GlassCard from './ui/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, Sector } from 'recharts';
import { generateInsights } from '../services/geminiService';
import { Loader2, Sparkles, BrainCircuit, ListChecks, TrendingUp, Clock4, Timer, PieChart as PieChartIcon, Siren, Download, FileText, Sheet, ChevronDown, RefreshCw, Briefcase, Coffee, Tag, FileClock } from 'lucide-react';
import CustomSelect from './ui/CustomSelect';
import { ICONS } from '../constants';


interface ReportsProps {
  logs: SessionLog[];
  distractions: Distraction[];
  tasks: Task[];
  categoryMap: Record<string, { color: string; icon: React.ReactNode }>;
  // Pass in categories for the filter dropdown
  categories: Category[];
}

type TimePeriod = 'today' | 'week' | 'month' | 'year';
type SessionTypeFilter = 'all' | 'work' | 'break';

const RadialProgress = ({ percentage }: { percentage: number }) => {
    const radius = 22;
    const stroke = 4;
    const normalizedRadius = radius - stroke;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative w-12 h-12">
            <svg height="100%" width="100%" viewBox="0 0 44 44">
                 <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="var(--color-electric-blue)" />
                        <stop offset="100%" stopColor="var(--color-accent-indigo)" />
                    </linearGradient>
                </defs>
                <circle
                    stroke="#ffffff1a"
                    fill="transparent"
                    strokeWidth={stroke}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
                <circle
                    stroke="url(#progressGradient)"
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{ strokeDashoffset, strokeLinecap: 'round', transition: 'stroke-dashoffset 0.5s ease-out' }}
                    transform={`rotate(-90 ${radius} ${radius})`}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-semibold">
                {Math.round(percentage)}%
            </div>
        </div>
    );
};


const KpiCard: React.FC<{ icon: React.ReactElement, value: string, label: string, children?: React.ReactNode }> = ({ icon, value, label, children }) => (
    <GlassCard className="p-4">
        <div className="flex justify-between items-start h-full">
            <div className="flex flex-col">
                 <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-black/20 rounded-lg text-accent-cyan mb-2">
                    {React.cloneElement(icon as React.ReactElement<{ size: number }>, { size: 20 })}
                </div>
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-gray-400 mt-1">{label}</p>
            </div>
            {children && <div className="flex-shrink-0">{children}</div>}
        </div>
    </GlassCard>
);

// Fix: Use a named export to resolve module resolution issues.
export const Reports: React.FC<ReportsProps> = ({ logs, distractions, tasks, categoryMap, categories }) => {
  const [insights, setInsights] = useState('');
  const [insightsStatus, setInsightsStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [sessionTypeFilter, setSessionTypeFilter] = useState<SessionTypeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const [barVisibility, setBarVisibility] = useState({ focus: true, break: true });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setIsDownloadMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getLogCategory = useCallback((log: SessionLog, tasks: Task[]): string | null => {
      if (log.category) return log.category;
      if (log.taskId) {
          const task = tasks.find(t => t.id === log.taskId);
          return task ? task.category : null;
      }
      return null;
  }, []);

  const filteredData = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let startDate: Date = new Date(today);
    startDate.setHours(0, 0, 0, 0);

    switch (timePeriod) {
      case 'today':
        break;
      case 'week':
        startDate.setDate(today.getDate() - 6);
        break;
      case 'month':
        startDate.setDate(today.getDate() - 29);
        break;
      case 'year':
        startDate.setFullYear(today.getFullYear(), today.getMonth(), today.getDate() - 364);
        break;
    }
    
    return logs
        .filter(log => new Date(log.startTime) >= startDate)
        .filter(log => {
            if (sessionTypeFilter === 'work') return log.type === SessionType.Work;
            if (sessionTypeFilter === 'break') return log.type === SessionType.ShortBreak || log.type === SessionType.LongBreak;
            return true; // 'all'
        })
        .filter(log => {
            if (categoryFilter === 'all') return true;
            // Only filter work sessions by category, as breaks don't have categories.
            if (log.type !== SessionType.Work) return true;
            return getLogCategory(log, tasks) === categoryFilter;
        });

  }, [logs, timePeriod, sessionTypeFilter, categoryFilter, tasks, getLogCategory]);

  const { mainChartData, kpiData, categoryDistribution, distractionData, timePeriodConfig } = useMemo(() => {
    const totalFocusSeconds = filteredData.reduce((sum: number, log) => log.type === SessionType.Work ? sum + log.duration : sum, 0);
    const totalBreakSeconds = filteredData.reduce((sum: number, log) => (log.type === SessionType.ShortBreak || log.type === SessionType.LongBreak) ? sum + log.duration : sum, 0);
    const sessionsCompleted = filteredData.filter(log => log.type === SessionType.Work).length;
    const pauseCount = filteredData.filter(log => log.type === SessionType.Pause).length;

    const focusRatio = totalFocusSeconds + totalBreakSeconds > 0
        ? (totalFocusSeconds / (totalFocusSeconds + totalBreakSeconds)) * 100
        : 0;
    
    const avgSessionMinutes = sessionsCompleted > 0
        ? Math.round((totalFocusSeconds / sessionsCompleted) / 60)
        : 0;
    
    const distribution = filteredData.reduce((acc: Record<string, number>, log) => {
        if (log.type !== SessionType.Work) return acc;
        const categoryName = getLogCategory(log, tasks);
        if (categoryName) {
            acc[categoryName] = (acc[categoryName] || 0) + log.duration;
        }
        return acc;
    }, {} as Record<string, number>);

    const categoryDistributionData = Object.entries(distribution)
      .map(([name, value]) => ({ 
        name: name, 
        value: Math.round(value / 60),
        fill: (categoryMap[name] || categoryMap['fallback']).color,
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
    
    // Determine start date for filtering distractions (same as for logs)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let startDate: Date = new Date(today);
    startDate.setHours(0, 0, 0, 0);

    switch (timePeriod) {
      case 'today':
        break;
      case 'week':
        startDate.setDate(today.getDate() - 6);
        break;
      case 'month':
        startDate.setDate(today.getDate() - 29);
        break;
      case 'year':
        startDate.setFullYear(today.getFullYear(), today.getMonth(), today.getDate() - 364);
        break;
    }
    
    // Filter distractions by time period
    const filteredDistractions = distractions.filter(d => new Date(d.timestamp) >= startDate);
    
    // Count occurrences of each distraction
    const distractionCounts = filteredDistractions.reduce((acc, distraction) => {
        acc[distraction.name] = (acc[distraction.name] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Get top 3 distractions for the period
    const topDistractions = Object.entries(distractionCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

    let chartData: { name: string; focus: number; break: number }[] = [];
    const config = {
      today: { unit: 'm', title: 'Hourly Activity' },
      week: { unit: 'h', title: 'Daily Activity' },
      month: { unit: 'h', title: 'Daily Activity' },
      year: { unit: 'h', title: 'Monthly Activity' },
    };

    const isBreak = (log: SessionLog) => log.type === SessionType.ShortBreak || log.type === SessionType.LongBreak;

    if (timePeriod === 'today') {
        chartData = Array.from({ length: 24 }, (_, i) => ({ name: `${i}:00`, focus: 0, break: 0 }));
        filteredData.forEach(log => {
            const hour = new Date(log.startTime).getHours();
            const duration = log.duration / 60;
            if (log.type === SessionType.Work) chartData[hour].focus += duration;
            else if (isBreak(log)) chartData[hour].break += duration;
        });
        chartData = chartData.map(d => ({...d, focus: parseFloat(d.focus.toFixed(1)), break: parseFloat(d.break.toFixed(1))}));
    } else {
        const divisor = 3600; // to get hours
        if (timePeriod === 'week') {
            const today = new Date();
            const dataMap = new Map<string, {focus: number, break: number}>();
            for (let i = 6; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(today.getDate() - i);
                dataMap.set(d.toISOString().split('T')[0], {focus: 0, break: 0});
            }
            filteredData.forEach(log => {
                const logDate = new Date(log.startTime).toISOString().split('T')[0];
                if (dataMap.has(logDate)) {
                    const current = dataMap.get(logDate)!;
                    if(log.type === SessionType.Work) current.focus += log.duration / divisor;
                    else if(isBreak(log)) current.break += log.duration / divisor;
                }
            });
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            chartData = Array.from(dataMap.entries()).map(([date, values]) => ({
                name: days[new Date(date).getUTCDay()],
                focus: parseFloat(values.focus.toFixed(1)),
                break: parseFloat(values.break.toFixed(1))
            }));
        } else if (timePeriod === 'month') {
            const today = new Date();
            const dataMap = new Map<string, {focus: number, break: number}>();
            for (let i = 29; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(today.getDate() - i);
                dataMap.set(d.toISOString().split('T')[0], {focus: 0, break: 0});
            }
            filteredData.forEach(log => {
                const logDate = new Date(log.startTime).toISOString().split('T')[0];
                if (dataMap.has(logDate)) {
                    const current = dataMap.get(logDate)!;
                    if(log.type === SessionType.Work) current.focus += log.duration / divisor;
                    else if(isBreak(log)) current.break += log.duration / divisor;
                }
            });
            chartData = Array.from(dataMap.entries()).map(([date, values]) => ({
                name: new Date(date).getUTCDate().toString(),
                focus: parseFloat(values.focus.toFixed(1)),
                break: parseFloat(values.break.toFixed(1))
            }));
        } else if (timePeriod === 'year') {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            chartData = months.map(month => ({ name: month, focus: 0, break: 0 }));
            filteredData.forEach(log => {
                const month = new Date(log.startTime).getMonth();
                if (log.type === SessionType.Work) chartData[month].focus += log.duration / divisor;
                else if (isBreak(log)) chartData[month].break += log.duration / divisor;
            });
            chartData = chartData.map(d => ({...d, focus: parseFloat(d.focus.toFixed(1)), break: parseFloat(d.break.toFixed(1))}));
        }
    }
    
    return {
        mainChartData: chartData,
        kpiData: {
            totalFocus: (totalFocusSeconds / 3600).toFixed(1),
            sessionsCompleted: String(sessionsCompleted),
            pauseCount,
            focusRatio,
            avgSessionMinutes: `${avgSessionMinutes}m`,
        },
        categoryDistribution: categoryDistributionData,
        distractionData: topDistractions,
        timePeriodConfig: config[timePeriod]
    };
  }, [filteredData, tasks, timePeriod, categoryMap, distractions, getLogCategory]);


  const handleGenerateInsights = useCallback(async () => {
    setInsightsStatus('loading');
    setInsightsError(null);
    setInsights('');
    try {
      const insightText = await generateInsights({ 
        logs: filteredData, 
        topDistractions: distractionData,
        tasks,
        timePeriod,
      });
      if (!insightText || insightText.trim().length < 20) {
        throw new Error("The AI returned an incomplete analysis. This may be due to a temporary issue. Please try again.");
      }
      setInsights(insightText);
      setInsightsStatus('success');
    } catch (error) {
      console.error('Error generating insights:', error);
      setInsightsStatus('error');
      if (error instanceof Error) {
        setInsightsError(error.message);
      } else {
        setInsightsError('An unknown error occurred while generating insights.');
      }
    }
  }, [filteredData, distractionData, tasks, timePeriod]);

  const workLogs = useMemo(() => 
    filteredData
        .filter(log => log.type === SessionType.Work)
        .slice()
        .reverse(), 
    [filteredData]
  );
  
  const getReportData = useCallback(() => {
    const formatDateForReport = (dateString: string) => new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const formatDurationForReport = (seconds: number) => `${Math.floor(seconds / 60)} min`;
    
    const formattedLogs = workLogs.map(log => {
      const task = log.taskId ? tasks.find(t => t.id === log.taskId) : null;
      const logCategoryName = getLogCategory(log, tasks);
      return {
        task: task ? task.title : (log.category ? 'Manual Entry' : 'General Focus'),
        category: logCategoryName || 'N/A',
        date: formatDateForReport(log.startTime),
        timeSpent: formatDurationForReport(log.duration),
        notes: log.notes || '',
      };
    });

    return {
      timePeriod,
      generatedAt: new Date().toISOString(),
      kpis: kpiData,
      focusOverTime: {
        title: timePeriodConfig.title,
        unit: timePeriodConfig.unit,
        data: mainChartData,
      },
      categoryDistribution: {
        title: "Focus Allocation",
        unit: "minutes",
        data: categoryDistribution,
      },
      efficiencyKillers: {
        interruptions: kpiData.pauseCount,
        topDistractions: distractionData,
      },
      detailedActivityLog: {
          title: "Detailed Activity Log",
          data: formattedLogs
      }
    };
  }, [timePeriod, kpiData, timePeriodConfig, mainChartData, categoryDistribution, distractionData, workLogs, tasks, getLogCategory]);


  const downloadFile = (filename: string, content: string, mimeType: string) => {
    const dataStr = `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`;
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", filename);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setIsDownloadMenuOpen(false);
  };

  const handleDownloadJSON = useCallback(() => {
    const reportData = getReportData();
    downloadFile(
      `zenith-focus-report-${timePeriod}-${new Date().toISOString().split('T')[0]}.json`,
      JSON.stringify(reportData, null, 2),
      'text/json'
    );
  }, [getReportData, timePeriod]);

  const handleDownloadCSV = useCallback(() => {
    const reportData = getReportData();
    let csv = 'Zenith Focus Report\n';
    csv += `Time Period,${reportData.timePeriod}\n`;
    csv += `Generated At,${reportData.generatedAt}\n\n`;

    csv += 'Key Performance Indicators\n';
    csv += 'Metric,Value\n';
    Object.entries(reportData.kpis).forEach(([key, value]) => {
      csv += `${key},"${value}"\n`;
    });
    csv += '\n';

    csv += `${reportData.focusOverTime.title}\n`;
    csv += `Time,Focus (${reportData.focusOverTime.unit}),Break (${reportData.focusOverTime.unit})\n`;
    reportData.focusOverTime.data.forEach(item => {
      csv += `${item.name},${item.focus},${item.break}\n`;
    });
    csv += '\n';

    csv += `${reportData.categoryDistribution.title}\n`;
    csv += `Category,Focus (${reportData.categoryDistribution.unit})\n`;
    reportData.categoryDistribution.data.forEach(item => {
      csv += `${item.name},${item.value}\n`;
    });
    csv += '\n';

    csv += 'Efficiency Killers\n';
    csv += 'Metric,Value\n';
    csv += `Interruptions,${reportData.efficiencyKillers.interruptions}\n`;
    reportData.efficiencyKillers.topDistractions.forEach(d => {
        csv += `Distraction: ${d.name},${d.count}\n`;
    });
    
    if (reportData.detailedActivityLog && reportData.detailedActivityLog.data.length > 0) {
        csv += '\n';
        csv += `${reportData.detailedActivityLog.title}\n`;
        const headers = Object.keys(reportData.detailedActivityLog.data[0]);
        csv += headers.map(h => h.charAt(0).toUpperCase() + h.slice(1)).join(',') + '\n';
        reportData.detailedActivityLog.data.forEach(log => {
            const row = headers.map(header => {
                let value = (log as any)[header];
                if (typeof value === 'string' && (value.includes(',') || value.includes('\n'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });
            csv += row.join(',') + '\n';
        });
    }

    downloadFile(
      `zenith-focus-report-${timePeriod}-${new Date().toISOString().split('T')[0]}.csv`,
      csv,
      'text/csv'
    );
  }, [getReportData, timePeriod]);
  
  const handleDownloadPDF = useCallback(() => {
    const reportData = getReportData();
    const { kpis, focusOverTime, categoryDistribution, detailedActivityLog } = reportData;
    
    const htmlContent = `
      <html>
        <head>
          <title>Zenith Focus Report - ${timePeriod}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; color: #333; }
            @page { size: A4; margin: 1in; }
            h1, h2, h3 { color: #111; border-bottom: 2px solid #eee; padding-bottom: 8px; }
            h1 { font-size: 28px; } h2 { font-size: 22px; } h3 { font-size: 16px; }
            p { color: #555; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f8f8f8; font-weight: 600; }
            .kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .kpi-card { border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
            .kpi-card h3 { margin-top: 0; font-size: 14px; color: #555; text-transform: uppercase; }
            .kpi-card p { font-size: 2.5em; font-weight: bold; color: #000; margin: 0; }
            td { word-break: break-word; }
          </style>
        </head>
        <body>
          <h1>Zenith Focus Report</h1>
          <p><strong>Time Period:</strong> ${timePeriod}</p>
          <p><strong>Generated At:</strong> ${new Date(reportData.generatedAt).toLocaleString()}</p>
          
          <h2>Key Performance Indicators</h2>
          <div class="kpi-grid">
            ${Object.entries(kpis).map(([key, value]) => `
              <div class="kpi-card">
                <h3>${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h3>
                <p>${value}</p>
              </div>
            `).join('')}
          </div>

          <h2>${focusOverTime.title}</h2>
          <table>
            <thead><tr><th>Time</th><th>Focus (${focusOverTime.unit})</th><th>Break (${focusOverTime.unit})</th></tr></thead>
            <tbody>
              ${focusOverTime.data.map(row => `<tr><td>${row.name}</td><td>${row.focus}</td><td>${row.break}</td></tr>`).join('')}
            </tbody>
          </table>
          
          <h2>${categoryDistribution.title}</h2>
          <table>
            <thead><tr><th>Category</th><th>Focus (${categoryDistribution.unit})</th></tr></thead>
            <tbody>
              ${categoryDistribution.data.map(row => `<tr><td>${row.name}</td><td>${row.value}</td></tr>`).join('')}
            </tbody>
          </table>

          ${(detailedActivityLog && detailedActivityLog.data.length > 0) ? `
          <h2>${detailedActivityLog.title}</h2>
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Category</th>
                <th>Date</th>
                <th>Time Spent</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${detailedActivityLog.data.map(row => `
                <tr>
                  <td>${(row.task || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
                  <td>${(row.category || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
                  <td>${(row.date || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
                  <td>${(row.timeSpent || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
                  <td>${(row.notes || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ` : ''}
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500); // Allow content to render before printing
    }
    setIsDownloadMenuOpen(false);
  }, [getReportData, timePeriod]);

  const categoryOptions = useMemo(() => [
        { value: 'all', label: 'All Categories', icon: <Tag size={16}/> },
        ...categories.map(cat => ({
            value: cat.name,
            label: cat.name,
            icon: <span style={{ color: cat.color }}>{categoryMap[cat.name]?.icon || ICONS['Tag']}</span>,
        }))
  ], [categories, categoryMap]);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const formatDuration = (seconds: number) => `${Math.floor(seconds / 60)} min`;
  
  const handleLegendClick = (dataKey: 'focus' | 'break') => {
    setBarVisibility(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
  };
  
  const legendColors = {
      focus: '#00BFFF', // electric-blue from gradient
      break: '#22C55E', // green-500 from gradient
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <GlassCard className="!p-3 !rounded-lg !border-white/10 !shadow-lg">
          <p className="text-sm font-bold text-white mb-2">{label}</p>
          {payload.map((pld: any) => (
            <div key={pld.dataKey} className="flex items-center text-xs justify-between">
              <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: legendColors[pld.dataKey as 'focus' | 'break'] }}></div>
                  <span className="text-gray-400">{pld.name}:</span>
              </div>
              <span className="ml-4 font-semibold text-white">{pld.value.toFixed(1)} {timePeriodConfig.unit}</span>
            </div>
          ))}
        </GlassCard>
      );
    }
    return null;
  };
  
  const CustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex justify-center items-center gap-6 text-xs mt-2">
        {payload.map((entry: any) => {
          const dataKey = entry.dataKey as 'focus' | 'break';
          if (!dataKey) return null;
          const isActive = barVisibility[dataKey];
          return (
            <button
              key={`item-${entry.value}`}
              onClick={() => handleLegendClick(dataKey)}
              className={`flex items-center gap-2 cursor-pointer transition-opacity ${isActive ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: legendColors[dataKey] }}></div>
              <span>{entry.value}</span>
            </button>
          );
        })}
      </div>
    );
  };
  
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

  return (
    <div className="h-full flex flex-col gap-6">
      <header className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight font-display">Intel & Analytics</h1>
          <p className="text-gray-400 mt-1">Deconstruct your habits, optimize your flow.</p>
        </div>
        <div className="relative" ref={downloadMenuRef}>
          <button
            onClick={() => setIsDownloadMenuOpen(prev => !prev)}
            className="flex items-center gap-2 bg-white/10 text-gray-300 font-semibold px-4 py-2 rounded-lg transition-all hover:bg-white/20 hover:text-white flex-shrink-0 active:scale-95"
          >
            <Download size={16} />
            <span>Download Report</span>
            <ChevronDown size={16} className={`transition-transform ${isDownloadMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          {isDownloadMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-dark-card border border-white/10 rounded-lg shadow-lg z-10 animate-dropdown-enter">
              <ul>
                <li>
                  <button onClick={handleDownloadJSON} className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors rounded-t-lg active:scale-95">
                    <Sparkles size={16} className="text-accent-cyan" />
                    <span>JSON</span>
                  </button>
                </li>
                 <li>
                  <button onClick={handleDownloadPDF} className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors active:scale-95">
                    <FileText size={16} className="text-red-400" />
                    <span>PDF</span>
                  </button>
                </li>
                <li>
                  <button onClick={handleDownloadCSV} className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors rounded-b-lg active:scale-95">
                    <Sheet size={16} className="text-green-400" />
                    <span>CSV</span>
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </header>
      
      <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center bg-dark-card p-1 rounded-lg border border-white/10">
            {(['today', 'week', 'month', 'year'] as TimePeriod[]).map(period => (
              <button
                key={period}
                onClick={() => setTimePeriod(period)}
                className={`flex-1 px-3 py-2 text-sm font-semibold rounded-md transition-all duration-200 capitalize active:scale-95 ${
                  timePeriod === period
                    ? 'bg-electric-blue text-white shadow'
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {period}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-dark-card p-1 rounded-lg border border-white/10">
             {(['all', 'work', 'break'] as SessionTypeFilter[]).map(type => (
              <button
                key={type}
                onClick={() => setSessionTypeFilter(type)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-md transition-all duration-200 capitalize active:scale-95 ${
                  sessionTypeFilter === type
                    ? 'bg-electric-blue text-white shadow'
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {type === 'work' && <Briefcase size={16} />}
                {type === 'break' && <Coffee size={16} />}
                {type}
              </button>
            ))}
          </div>
          <div className="w-full md:w-auto md:flex-1 md:max-w-xs">
            <CustomSelect
                value={categoryFilter}
                onChange={setCategoryFilter}
                options={categoryOptions}
            />
          </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={<Clock4 />} value={kpiData.totalFocus} label="Focus Hours" />
        <KpiCard icon={<ListChecks />} value={kpiData.sessionsCompleted} label="Focus Sessions" />
        <KpiCard icon={<Timer />} value={kpiData.avgSessionMinutes} label="Avg. Focus" />
        <KpiCard icon={<PieChartIcon />} value={`${kpiData.focusRatio.toFixed(0)}%`} label="Focus Ratio">
            <RadialProgress percentage={kpiData.focusRatio} />
        </KpiCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        <GlassCard className="lg:col-span-2 p-6 flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-4">{timePeriodConfig.title}</h3>
            <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mainChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <defs>
                            <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00BFFF" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#00BFFF" stopOpacity={0.1}/>
                            </linearGradient>
                             <linearGradient id="colorBreak" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22C55E" stopOpacity={0.7}/>
                                <stop offset="95%" stopColor="#22C55E" stopOpacity={0.1}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="#8892b0" fontSize={12} tickLine={false} axisLine={false} interval={timePeriod === 'month' ? 3 : 'preserveStartEnd'} />
                        <YAxis stroke="#8892b0" fontSize={12} tickLine={false} axisLine={false} unit={timePeriodConfig.unit} />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(0, 191, 255, 0.1)'}} />
                        <Legend content={<CustomLegend />} />
                        {(sessionTypeFilter === 'all' || sessionTypeFilter === 'work') &&
                            <Bar dataKey="focus" hide={!barVisibility.focus} stackId="a" fill="url(#colorFocus)" name={`Focus (${timePeriodConfig.unit})`} radius={[4, 4, 0, 0]} />
                        }
                        {(sessionTypeFilter === 'all' || sessionTypeFilter === 'break') &&
                            <Bar dataKey="break" hide={!barVisibility.break} stackId="a" fill="url(#colorBreak)" name={`Break (${timePeriodConfig.unit})`} radius={[4, 4, 0, 0]} />
                        }
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>

        <div className="space-y-6">
            <GlassCard className="p-6 flex flex-col">
              <h3 className="text-lg font-semibold text-white mb-4">Focus Allocation</h3>
              {categoryDistribution.length > 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                    <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                            <Pie 
                                data={categoryDistribution} 
                                cx="50%" 
                                cy="50%" 
                                innerRadius={50} 
                                outerRadius={70} 
                                fill="#8884d8" 
                                paddingAngle={5} 
                                dataKey="value" 
                                nameKey="name"
                            >
                                {categoryDistribution.map((entry) => (<Cell key={`cell-${entry.name}`} fill={entry.fill} />))}
                            </Pie>
                            <Tooltip content={<CustomPieTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 w-full grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        {categoryDistribution.slice(0, 4).map((entry) => (
                            <div key={entry.name} className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.fill }}></div>
                                <span className="text-gray-300 truncate">{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
              ) : <div className="flex items-center justify-center h-full text-gray-500 text-sm">No categorized focus data for this period.</div>}
            </GlassCard>

             <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Siren className="text-red-400" /> Efficiency Killers</h3>
                <div className="flex justify-between items-baseline p-3 bg-black/20 rounded-md">
                    <p className="text-gray-300">Interruptions</p>
                    <p className="text-2xl font-bold text-white">{kpiData.pauseCount}</p>
                </div>
                <div className="mt-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Top Distractions</h4>
                    {distractionData.length > 0 ? (
                        <ul className="space-y-1 text-sm">
                            {distractionData.map(d => (
                                <li key={d.name} className="flex justify-between items-center text-gray-300">
                                    <span>{d.name}</span>
                                    <span className="font-mono bg-red-500/10 text-red-400 px-2 py-0.5 rounded-md text-xs">{d.count}</span>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-gray-500 text-sm">No distractions logged for this period.</p>}
                </div>
            </GlassCard>
        </div>

        <GlassCard className="lg:col-span-3 p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
                <FileClock size={20} />
                Detailed Activity Log
            </h3>
            <div className="max-h-[400px] overflow-y-auto">
                {workLogs.length > 0 ? (
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-400 uppercase bg-dark-card sticky top-0 backdrop-blur-sm">
                        <tr>
                            <th scope="col" className="px-4 py-3">Task</th>
                            <th scope="col" className="px-4 py-3">Category</th>
                            <th scope="col" className="px-4 py-3">Date</th>
                            <th scope="col" className="px-4 py-3 text-right">Time Spent</th>
                            <th scope="col" className="px-4 py-3">Notes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {workLogs.map(log => {
                        const task = log.taskId ? tasks.find(t => t.id === log.taskId) : null;
                        const logCategoryName = getLogCategory(log, tasks);
                        return (
                            <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-4 py-4 font-medium text-white whitespace-nowrap">
                                    {task ? task.title : (log.category ? 'Manual Entry' : 'General Focus')}
                                </td>
                                <td className="px-4 py-4">
                                    {logCategoryName ? (
                                    <div className="flex items-center gap-2">
                                        <span style={{ color: (categoryMap[logCategoryName] || categoryMap['fallback']).color }}>
                                            {(categoryMap[logCategoryName] || categoryMap['fallback']).icon}
                                        </span>
                                        <span>{logCategoryName}</span>
                                    </div>
                                    ) : (
                                        <span className="text-gray-500">—</span>
                                    )}
                                </td>
                                <td className="px-4 py-4 text-gray-400">
                                    {formatDate(log.startTime)}
                                </td>
                                <td className="px-4 py-4 text-right font-mono text-white">
                                    {formatDuration(log.duration)}
                                </td>
                                <td className="px-4 py-4 text-gray-400 max-w-xs truncate" title={log.notes}>
                                    {log.notes || <span className="text-gray-600">—</span>}
                                </td>
                            </tr>
                        )
                        })}
                    </tbody>
                </table>
                ) : (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm py-8">
                    <p>No work activity to display for this period.</p>
                </div>
                )}
            </div>
        </GlassCard>
      </div>
    </div>
  );
};