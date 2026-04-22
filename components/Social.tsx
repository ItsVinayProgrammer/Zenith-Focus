

import React, { useMemo, useState, useCallback, ReactNode } from 'react';
import type { SessionLog, AccountabilityGoal, Task, Bounty } from '../types';
import { MOCK_FRIENDS, DEFAULT_CATEGORIES } from '../constants';
import GlassCard from './ui/Card';
import { Trophy, ShieldCheck, Zap, Sparkles, Loader2, Award, ArrowLeft, Plus, UserPlus, Clock, BarChart2, Star, Flame, PieChart as PieChartIcon } from 'lucide-react';
import { generateBounties } from '../services/geminiService';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface SocialProps {
  logs: SessionLog[];
  tasks: Task[];
  goals: AccountabilityGoal[];
  updateGoal: (goal: AccountabilityGoal) => void;
  addToast: (message: string, options?: { type?: 'success' | 'info' | 'error', icon?: ReactNode }) => void;
  categoryMap: Record<string, { color: string; icon: React.ReactNode }>;
}

interface Friend {
  id: string;
  name: string;
  avatar: string;
  hours: number;
  avgSessionMinutes: number;
  topCategory: string;
  streak: number;
}

const ProfileStat: React.FC<{ 
    icon: React.ReactNode, 
    label: string, 
    value: string | number, 
    category?: string,
    comparisonValue?: number,
    categoryMap: Record<string, { color: string; icon: React.ReactNode }>;
}> = ({ icon, label, value, category, comparisonValue, categoryMap }) => {
    
    const isNumeric = typeof value === 'number';
    const numericValue = isNumeric ? value as number : 0;
    const maxValue = isNumeric ? Math.max(numericValue, comparisonValue ?? 0) : 0;
    
    const friendWidth = maxValue > 0 ? (numericValue / maxValue) * 100 : 0;
    const yourWidth = maxValue > 0 && comparisonValue ? (comparisonValue / maxValue) * 100 : 0;

    const displayValue = () => {
        if (category) {
            const catDetails = categoryMap[category] || categoryMap['fallback'];
            return (
                <div className="flex items-center gap-2">
                    <span style={{ color: catDetails.color }}>{catDetails.icon}</span>
                    <p className="font-semibold text-white">{value}</p>
                </div>
            )
        }
        if (isNumeric) {
            const unit = label.includes('Focus') ? 'hrs' : label.includes('Session') ? 'min' : 'days';
            const formattedValue = label.includes('Focus') ? numericValue.toFixed(1) : numericValue.toFixed(0);
            return <p className="text-xl font-bold text-white">{formattedValue} <span className="text-sm text-gray-500">{unit}</span></p>
        }
        return <p className="text-xl font-bold text-white">{value}</p>
    };

    const unit = isNumeric ? (label.includes('Focus') ? 'hrs' : label.includes('Session') ? 'min' : '') : '';

    return (
        <div className="bg-white/5 p-4 rounded-lg flex flex-col gap-2">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 flex-shrink-0 bg-black/20 rounded-full flex items-center justify-center text-accent-cyan">
                   {icon}
                </div>
                <div>
                    <p className="text-xs text-gray-400">{label}</p>
                    {displayValue()}
                </div>
            </div>
            {isNumeric && comparisonValue !== undefined && maxValue > 0 && (
                <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                        <div title="Friend" className="w-1.5 h-4 rounded-full bg-accent-indigo flex-shrink-0"></div>
                        <div className="flex-1 bg-black/30 rounded-full h-1.5">
                            <div className="bg-accent-indigo h-1.5 rounded-full transition-all duration-500" style={{ width: `${friendWidth}%` }}></div>
                        </div>
                        <span className="w-16 text-right font-mono text-white">{numericValue.toFixed(1)} <span className="text-gray-500">{unit}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <div title="You" className="w-1.5 h-4 rounded-full bg-accent-cyan flex-shrink-0"></div>
                        <div className="flex-1 bg-black/30 rounded-full h-1.5">
                            <div className="bg-accent-cyan h-1.5 rounded-full transition-all duration-500" style={{ width: `${yourWidth}%` }}></div>
                        </div>
                        <span className="w-16 text-right font-mono text-white">{comparisonValue.toFixed(1)} <span className="text-gray-500">{unit}</span></span>
                    </div>
                </div>
            )}
        </div>
    );
};


const ProfileView: React.FC<{ friend: Friend, yourData: Friend, onBack: () => void, categoryMap: Record<string, { color: string; icon: React.ReactNode }> }> = ({ friend, yourData, onBack, categoryMap }) => {
    return (
        <div className="animate-fadeIn">
             <style>{`
                @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
            `}</style>
            <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 font-semibold transition-all duration-200 active:scale-95">
                <ArrowLeft size={18}/>
                Back to Alliances
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Friend Profile */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <img src={friend.avatar} alt={friend.name} className="w-20 h-20 rounded-full ring-2 ring-accent-indigo"/>
                        <div>
                            <h2 className="text-3xl font-bold text-white">{friend.name}</h2>
                            <p className="text-gray-400">Weekly Performance</p>
                        </div>
                    </div>
                    <ProfileStat icon={<Clock size={20}/>} label="Weekly Focus" value={friend.hours} comparisonValue={yourData.hours} categoryMap={categoryMap} />
                    <ProfileStat icon={<BarChart2 size={20}/>} label="Avg. Session" value={friend.avgSessionMinutes} comparisonValue={yourData.avgSessionMinutes} categoryMap={categoryMap} />
                    <ProfileStat icon={<Star size={20}/>} label="Top Category" value={friend.topCategory} category={friend.topCategory} categoryMap={categoryMap}/>
                    <ProfileStat icon={<Flame size={20}/>} label="Focus Streak" value={friend.streak} categoryMap={categoryMap}/>
                </div>
                {/* Your Profile */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <img src={yourData.avatar} alt={yourData.name} className="w-20 h-20 rounded-full ring-2 ring-accent-cyan"/>
                        <div>
                            <h2 className="text-3xl font-bold text-white">You</h2>
                            <p className="text-gray-400">Your Performance</p>
                        </div>
                    </div>
                    <ProfileStat icon={<Clock size={20}/>} label="Weekly Focus" value={yourData.hours} categoryMap={categoryMap} />
                    <ProfileStat icon={<BarChart2 size={20}/>} label="Avg. Session" value={yourData.avgSessionMinutes} categoryMap={categoryMap} />
                    <ProfileStat icon={<Star size={20}/>} label="Top Category" value={yourData.topCategory} category={yourData.topCategory} categoryMap={categoryMap}/>
                    <ProfileStat icon={<Flame size={20}/>} label="Focus Streak" value={yourData.streak} categoryMap={categoryMap}/>
                </div>
            </div>
        </div>
    );
};


const Social: React.FC<SocialProps> = ({ logs, tasks, goals, updateGoal, addToast, categoryMap }) => {
  const weeklyGoal = goals.find(g => g.period === 'weekly')!;
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [isLoadingBounties, setIsLoadingBounties] = useState(false);
  const [bountyError, setBountyError] = useState<string | null>(null);
  const [view, setView] = useState<'main' | 'profile'>('main');
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [friends, setFriends] = useState(MOCK_FRIENDS);
  const [newFriendName, setNewFriendName] = useState('');
  const [isAddingFriend, setIsAddingFriend] = useState(false);

  const yourData: Friend = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklyLogs = logs.filter(log => new Date(log.startTime) > oneWeekAgo && log.type === 'work');
    
    if (weeklyLogs.length === 0) {
        return { id: 'you', name: 'You', avatar: 'https://picsum.photos/seed/you/100/100', hours: 0, avgSessionMinutes: 0, topCategory: DEFAULT_CATEGORIES[0].name, streak: 0 };
    }

    const focusSeconds = weeklyLogs.reduce((acc, log) => acc + log.duration, 0);
    const hours = focusSeconds / 3600;
    const avgSessionMinutes = (focusSeconds / weeklyLogs.length) / 60;

    const categoryCounts: { [key: string]: number } = {};
    weeklyLogs.forEach(log => {
      if (log.taskId) {
        const task = tasks.find(t => t.id === log.taskId);
        if (task) {
          categoryCounts[task.category] = (categoryCounts[task.category] || 0) + 1;
        }
      }
    });
    
    const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as string || DEFAULT_CATEGORIES[0].name;
    
    // Simple streak calculation for demo purposes
    const uniqueDays = new Set(weeklyLogs.map(log => new Date(log.startTime).toDateString()));
    const streak = uniqueDays.size; 

    return { id: 'you', name: 'You', avatar: `https://picsum.photos/seed/you/100/100`, hours, avgSessionMinutes, topCategory, streak };
  }, [logs, tasks]);

  const standings = useMemo(() => [...friends, yourData].sort((a, b) => b.hours - a.hours), [friends, yourData]);
  const topHours = standings.length > 0 ? standings[0].hours : 0;

  const weeklyProgressHours = yourData.hours;
  const progressPercentage = Math.min((weeklyProgressHours / weeklyGoal.targetHours) * 100, 100);
  
  const weeklyCategoryDistribution = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklyLogs = logs.filter(log => new Date(log.startTime) > oneWeekAgo && log.type === 'work');

    const distribution: { [key: string]: number } = {};

    weeklyLogs.forEach(log => {
        let category: string | undefined | null = null;
        if (log.category) { // Manually logged category
            category = log.category;
        } else if (log.taskId) { // Logged from a task
            const task = tasks.find(t => t.id === log.taskId);
            if (task) {
                category = task.category;
            }
        }
        if (category) {
            distribution[category] = (distribution[category] || 0) + log.duration;
        }
    });

    return Object.entries(distribution)
        .map(([name, value]) => ({ 
            name: name, 
            value: Math.round(value / 60), // in minutes
            fill: (categoryMap[name] || categoryMap['fallback']).color
        }))
        .filter(item => item.value > 0)
        .sort((a, b) => b.value - a.value);

  }, [logs, tasks, categoryMap]);

  const handleGenerateBounties = useCallback(async () => {
    setIsLoadingBounties(true);
    setBountyError(null);
    try {
        const generated = await generateBounties({ logs, tasks });
        setBounties(generated);
    } catch (error) {
        console.error("Bounty generation failed:", error);
        setBountyError("Failed to generate bounties. Check API key.");
    } finally {
        setIsLoadingBounties(false);
    }
  }, [logs, tasks]);

  const handleViewProfile = (friend: Friend) => {
    setSelectedFriend(friend);
    setView('profile');
  }
  
  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendName.trim() || isAddingFriend) return;

    setIsAddingFriend(true);
    addToast(`Sending request to ${newFriendName}...`, { icon: <Loader2 className="w-4 h-4 animate-spin" />, type: 'info' });

    setTimeout(() => {
        const success = Math.random() > 0.15; // 85% chance of success
        const friendName = newFriendName.trim();

        if (success) {
            const categories = Object.keys(categoryMap).filter(c => c !== 'fallback');
            const newFriend: Friend = {
                id: new Date().toISOString(),
                name: friendName,
                avatar: `https://picsum.photos/seed/${friendName.replace(/\s/g, '')}/100/100`,
                hours: Math.random() * 20,
                avgSessionMinutes: 20 + Math.random() * 35,
                topCategory: categories[Math.floor(Math.random() * categories.length)],
                streak: Math.floor(Math.random() * 10)
            };
            setFriends(prev => [...prev, newFriend]);
            addToast(`${friendName} has been added to your Alliance!`, { icon: <UserPlus size={16} />, type: 'success' });
            setNewFriendName('');
        } else {
            addToast(`Request failed for ${friendName}. Ally network is unstable.`, { type: 'error' });
        }
        
        setIsAddingFriend(false);
    }, 1500);
  }

  if (view === 'profile' && selectedFriend) {
      return <ProfileView friend={selectedFriend} yourData={yourData} onBack={() => setView('main')} categoryMap={categoryMap} />
  }

  return (
    <div className="h-full flex flex-col gap-6">
      <header>
        <h1 className="text-4xl font-bold text-white tracking-tight font-display">Alliances & Pacts</h1>
        <p className="text-gray-400 mt-1">Forge alliances, claim bounties, and dominate your goals.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h3 className="flex items-center gap-2 text-xl font-bold text-white mb-4">
            <Trophy className="text-yellow-400" />
            Weekly Standings
          </h3>
          <form onSubmit={handleAddFriend} className="flex gap-2 mb-4">
            <input
                type="text"
                value={newFriendName}
                onChange={e => setNewFriendName(e.target.value)}
                placeholder="Enter ally's callsign..."
                className="flex-1 bg-black/20 px-3 py-2 rounded-md border border-white/10 focus:outline-none focus:ring-1 focus:ring-electric-blue text-sm"
                disabled={isAddingFriend}
            />
            <button
                type="submit"
                disabled={!newFriendName.trim() || isAddingFriend}
                className="flex items-center justify-center gap-2 w-32 bg-electric-blue text-white font-semibold px-4 py-2 rounded-md transition-all hover:bg-opacity-80 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isAddingFriend ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <>
                        <UserPlus size={16}/>
                        <span>Add Ally</span>
                    </>
                )}
            </button>
          </form>
          <div className="space-y-2">
            {standings.map((friend, index) => {
              const friendProgress = topHours > 0 ? (friend.hours / topHours) * 100 : 0;
              return (
                <button key={friend.id} onClick={() => handleViewProfile(friend)} className={`w-full text-left flex items-center p-3 rounded-lg transition-all active:scale-[0.98] ${friend.name === 'You' ? 'bg-accent-indigo/20 ring-1 ring-accent-indigo' : 'bg-white/5 hover:bg-white/10'}`}>
                  <span className="font-bold text-lg w-8 text-gray-400">{index + 1}</span>
                  <div className="relative mr-4">
                    <img src={friend.avatar} alt={friend.name} className="w-10 h-10 rounded-full" />
                    <svg className="w-12 h-12 absolute -top-1 -left-1" viewBox="0 0 100 100">
                      <circle className="text-white/10" strokeWidth="6" cx="50" cy="50" r="45" fill="transparent"></circle>
                      <circle
                        className="text-yellow-400"
                        strokeWidth="6"
                        strokeLinecap="round"
                        cx="50" cy="50" r="45" fill="transparent"
                        strokeDasharray="283"
                        strokeDashoffset={283 - (283 * friendProgress) / 100}
                        transform="rotate(-90 50 50)"
                      ></circle>
                    </svg>
                  </div>
                  <span className="flex-1 font-medium text-white">{friend.name}</span>
                  <span className="font-semibold text-lg text-white">{friend.hours.toFixed(1)} <span className="text-sm text-gray-400">hrs</span></span>
                </button>
              )
            })}
          </div>
        </GlassCard>

        <div className="flex flex-col gap-6">
            <GlassCard className="p-6">
                <h3 className="flex items-center gap-2 text-xl font-bold text-white mb-4">
                    <ShieldCheck className="text-green-400" />
                    Weekly Pact
                </h3>
                <div>
                    <div className="flex justify-between items-baseline mb-2 text-white">
                        <p className="font-semibold">Goal: {weeklyGoal.targetHours} hours</p>
                        <p className="font-bold">{weeklyProgressHours.toFixed(1)} / {weeklyGoal.targetHours} hrs</p>
                    </div>
                    <div className="w-full bg-black/20 rounded-full h-3 ring-1 ring-white/10">
                        <div className="bg-gradient-to-r from-green-400 to-accent-cyan h-3 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                    <p className="text-sm text-gray-400 mt-2 text-right">{weeklyGoal.guiltFreeDays} guilt-free days remaining</p>
                </div>
            </GlassCard>
            
            <GlassCard className="p-6">
              <h3 className="flex items-center gap-2 text-xl font-bold text-white mb-4">
                <PieChartIcon className="text-purple-400" />
                Weekly Focus Allocation
              </h3>
              {weeklyCategoryDistribution.length > 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                    <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                            <Pie 
                                data={weeklyCategoryDistribution} 
                                cx="50%" 
                                cy="50%" 
                                innerRadius={50} 
                                outerRadius={70} 
                                fill="#8884d8" 
                                paddingAngle={5} 
                                dataKey="value"
                                nameKey="name"
                            >
                                {weeklyCategoryDistribution.map((entry) => (
                                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0A0910', border: '1px solid #ffffff1a', borderRadius: '0.75rem' }} 
                                formatter={(value) => [`${value} minutes`, 'Focus']} 
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 w-full grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        {weeklyCategoryDistribution.slice(0, 4).map((entry) => (
                            <div key={entry.name} className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.fill }}></div>
                                <span className="text-gray-300 truncate">{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm py-8">
                    <p>No categorized focus data for this week.</p>
                </div>
              )}
            </GlassCard>

            <GlassCard className="p-6">
                <h3 className="flex items-center gap-2 text-xl font-bold text-white mb-4">
                    <Award className="text-orange-400" />
                    AI Bounty Board
                </h3>
                <div className="space-y-3">
                    {isLoadingBounties && (
                        <div className="flex flex-col items-center justify-center gap-2 text-gray-400 h-24">
                            <Loader2 className="w-8 h-8 animate-spin text-accent-cyan" />
                            <span>Contacting Bounty Coordinator...</span>
                        </div>
                    )}
                    {bountyError && <p className="text-center text-red-400 text-sm">{bountyError}</p>}
                    {!isLoadingBounties && bounties.length > 0 && (
                        bounties.map((bounty, index) => (
                            <div key={index} className="bg-white/5 p-3 rounded-lg border border-transparent hover:border-orange-400/50 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold text-white">{bounty.title}</p>
                                        <p className="text-sm text-gray-400 mt-1">{bounty.description}</p>
                                    </div>
                                    <div className="flex items-center gap-1 font-bold text-orange-400 bg-orange-400/10 px-2 py-1 rounded-full text-xs">
                                        <Zap size={12} />
                                        <span>{bounty.xp}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    {!isLoadingBounties && bounties.length === 0 && (
                        <div className="text-center text-gray-500 text-sm py-4">
                           <p>No active bounties. Generate a new set!</p>
                        </div>
                    )}
                    <button 
                        onClick={handleGenerateBounties}
                        disabled={isLoadingBounties}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-accent-indigo to-electric-blue text-white font-semibold px-4 py-2 rounded-lg transition-transform hover:scale-105 active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        <Sparkles size={18} />
                        {bounties.length > 0 ? 'Generate New Bounties' : 'Generate Bounties'}
                    </button>
                </div>
            </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Social;
