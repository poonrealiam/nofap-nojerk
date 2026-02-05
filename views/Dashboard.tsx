
import React, { useState, useRef, useEffect } from 'react';
import { Flame, AlertTriangle, ChevronLeft, ChevronRight, ClipboardList, Circle, AlertOctagon, Power, Radio, Calendar as CalendarIcon, Target, Utensils, ShoppingBag, ExternalLink, Clock, RefreshCw, Bell } from 'lucide-react';
import { UserProfile, FoodEntry, Task } from '../types';
import { translations } from '../translations';
import { saveCheckIn, getFriendRelationships, notifyFriendsOfReset, getNotifications, markNotificationsRead, notifyFriendsWarning } from '../services/databaseService';

interface DashboardProps {
  profile: UserProfile;
  foods: FoodEntry[];
  tasks: Task[];
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onRefreshCheckIns?: () => void;
}

const OverviewIcon = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2.5L12.2155 2.70425C15.9042 6.19659 21 11.2334 21 15.5C21 19.0899 18.0899 22 14.5 22C13 22 12.5 21.5 12 21C11.5 21.5 11 22 9.5 22C5.91015 22 3 19.0899 3 15.5C3 11.2334 8.09581 6.19659 11.7845 2.70425L12 2.5Z" />
  </svg>
);

const ProgressCircle = ({ current, goal, color = "stroke-white", size = 24 }: { current: number, goal: number, color?: string, size?: number }) => {
  const radius = (size / 2) - 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min((current / (goal || 1)) * 100, 100);
  const offset = circumference - (percentage / 100) * circumference;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} className="stroke-white/5 fill-none" strokeWidth="2" />
      <circle cx={size / 2} cy={size / 2} r={radius} className={`${color} fill-none transition-all duration-1000 ease-out`} strokeWidth="2" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
    </svg>
  );
};

const getLunarDateString = (date: Date) => {
  try {
    const formatter = new Intl.DateTimeFormat('zh-u-ca-chinese', {
      day: 'numeric',
      month: 'long',
    });
    const lunarParts = formatter.format(date);
    return `蛇年 ${lunarParts}`;
  } catch (e) {
    return "蛇年 乙巳";
  }
};

const SuccessParticles = ({ trigger }: { trigger: number }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {[...Array(12)].map((_, i) => (
        <div 
          key={`${trigger}-${i}`}
          className="absolute bg-white/20 rounded-sm animate-particle-float opacity-0"
          style={{
            width: Math.random() * 4 + 2 + 'px',
            height: Math.random() * 4 + 2 + 'px',
            left: Math.random() * 100 + '%',
            bottom: '20%',
            animationDelay: Math.random() * 0.1 + 's',
            animationDuration: Math.random() * 0.5 + 0.5 + 's'
          }}
        />
      ))}
    </div>
  );
};

const EmergencyParticles = () => {
  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {[...Array(15)].map((_, i) => (
        <div 
          key={i}
          className="absolute text-red-500 animate-emergency-float opacity-0"
          style={{
            left: Math.random() * 100 + '%',
            bottom: '30%',
            animationDelay: Math.random() * 0.3 + 's',
            animationDuration: Math.random() * 0.8 + 0.5 + 's'
          }}
        >
          {Math.random() > 0.5 ? <AlertTriangle size={12} fill="currentColor" /> : <AlertOctagon size={12} fill="currentColor" />}
        </div>
      ))}
    </div>
  );
};

const REFRESH_DELAY_MS = 15000;

const Dashboard: React.FC<DashboardProps> = ({ profile, foods, tasks, setProfile, onRefreshCheckIns }) => {
  const t = translations[profile.language || 'en'];
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isFueling, setIsFueling] = useState(false);
  const [isRelapsing, setIsRelapsing] = useState(false);
  const [isRefreshingCheckIns, setIsRefreshingCheckIns] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [flashKey, setFlashKey] = useState(0);
  const [showEmergencyFlash, setShowEmergencyFlash] = useState(false);
  const [friendsForAlerts, setFriendsForAlerts] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<{ id: string; user_id: string; from_user_id: string; type: 'friend_reset' | 'friend_warning'; payload: any; read: boolean; created_at: string; }[]>([]);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleRefreshAfterCheckIn = () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(async () => {
      refreshTimerRef.current = null;
      if (onRefreshCheckIns) await onRefreshCheckIns();
    }, REFRESH_DELAY_MS);
  };

  useEffect(() => {
    if (!profile.authIdentifier) return;

    const load = async () => {
      try {
        const friendRows = await getFriendRelationships(profile.authIdentifier!);
        const accepted = friendRows
          .filter(r => r.status === 'accepted')
          .map(r => (r.user_id === profile.authIdentifier ? r.friend_id : r.user_id));
        setFriendsForAlerts(accepted);

        const notes = await getNotifications(profile.authIdentifier!);
        setNotifications(notes);
      } catch (err) {
        console.error('Failed to load friend / notifications data:', err);
      }
    };

    load();
  }, [profile.authIdentifier]);

  useEffect(() => () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
  }, []);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playSuccessSound = () => {
    initAudio();
    const ctx = audioCtxRef.current!;
    const t = ctx.currentTime;
    const mainOsc = ctx.createOscillator();
    const mainGain = ctx.createGain();
    mainOsc.type = 'triangle';
    mainOsc.frequency.setValueAtTime(800, t);
    mainOsc.frequency.exponentialRampToValueAtTime(4500, t + 0.08);
    mainGain.gain.setValueAtTime(0, t);
    mainGain.gain.linearRampToValueAtTime(0.2, t + 0.005);
    mainGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    mainOsc.connect(mainGain);
    mainGain.connect(ctx.destination);
    mainOsc.start(t);
    mainOsc.stop(t + 0.2);
  };

  const playRelapseSound = () => {
    initAudio();
    const ctx = audioCtxRef.current!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  };

  const handleQuickCheckIn = async (status: 'check' | 'reset') => {
    const today = new Date().toISOString().split('T')[0];
    const isAlreadyChecked = profile.checkInHistory[today] === 'check';
    const isAlreadyReset = profile.checkInHistory[today] === 'reset';

    if (status === 'check') {
      playSuccessSound();
      setFlashKey(prev => prev + 1);
      setShowFlash(true);
      if (navigator.vibrate) navigator.vibrate([20]);
      setTimeout(() => setShowFlash(false), 300);

      if (!isAlreadyChecked && profile.authIdentifier) {
        setIsFueling(true);
        try {
          await saveCheckIn(profile.authIdentifier, today, 'check');
          setProfile(prev => {
            const newHistory: Record<string, 'check' | 'reset'> = { ...prev.checkInHistory, [today]: 'check' };
            return { ...prev, checkInHistory: newHistory, streak: prev.streak + 1 };
          });
          scheduleRefreshAfterCheckIn();
        } catch (error) {
          console.error('Failed to save check-in:', error);
        }
        setTimeout(() => setIsFueling(false), 1500);
      }
    } else {
      if (isAlreadyReset || !profile.authIdentifier) return;
      setIsRelapsing(true);
      setShowEmergencyFlash(true);
      playRelapseSound();
      if (navigator.vibrate) navigator.vibrate([50, 50, 50, 50, 200]);
      try {
        await saveCheckIn(profile.authIdentifier, today, 'reset');
        setProfile(prev => {
          const newHistory: Record<string, 'check' | 'reset'> = { ...prev.checkInHistory, [today]: 'reset' };
          return { ...prev, checkInHistory: newHistory, streak: 0, relapseCount: prev.relapseCount + 1 };
        });
        scheduleRefreshAfterCheckIn();
        if (friendsForAlerts.length) {
          await notifyFriendsOfReset(profile.authIdentifier, friendsForAlerts, new Date().toISOString());
        }
      } catch (error) {
        console.error('Failed to save reset:', error);
      }
      setTimeout(() => {
        setShowEmergencyFlash(false);
        setIsRelapsing(false);
      }, 1500);
    }
  };

  const toggleDay = async (day: number) => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const targetDate = new Date(y, m, day);
    targetDate.setHours(0,0,0,0);
    const today = new Date();
    today.setHours(0,0,0,0);
    if (targetDate > today || !profile.authIdentifier) return;
    const key = targetDate.toISOString().split('T')[0];
    
    const currentStatus = profile.checkInHistory[key];
    let nextStatus: 'check' | 'reset' | undefined;
    if (!currentStatus) { 
      nextStatus = 'check'; 
      playSuccessSound(); 
    } else if (currentStatus === 'check') { 
      nextStatus = 'reset'; 
      playRelapseSound(); 
    } else { 
      nextStatus = undefined; 
    }
    
    if (nextStatus) {
      try {
        await saveCheckIn(profile.authIdentifier, key, nextStatus);
        setProfile(prev => {
          const newHistory: Record<string, 'check' | 'reset'> = { ...prev.checkInHistory, [key]: nextStatus! };
          const relapseCount = Object.values(newHistory).filter(v => v === 'reset').length;
          return { ...prev, checkInHistory: newHistory, relapseCount };
        });
        scheduleRefreshAfterCheckIn();
      } catch (error) {
        console.error('Failed to save check-in:', error);
      }
    } else {
      // 删除记录（需要手动删除数据库记录，这里只更新本地状态）
      setProfile(prev => {
        const newHistory: Record<string, 'check' | 'reset'> = { ...prev.checkInHistory };
        delete newHistory[key];
        const relapseCount = Object.values(newHistory).filter(v => v === 'reset').length;
        return { ...prev, checkInHistory: newHistory, relapseCount };
      });
    }
  };

  const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const firstDay = (y: number, m: number) => new Date(y, m, 1).getDay();
  const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

  const renderCalendar = () => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const days = daysInMonth(y, m);
    const start = firstDay(y, m);
    const today = new Date();
    today.setHours(0,0,0,0);
    const cells = [];
    for (let i = 0; i < start; i++) cells.push(<div key={`e-${i}`} className="h-6" />);
    for (let d = 1; d <= days; d++) {
      const date = new Date(y, m, d);
      date.setHours(0,0,0,0);
      const key = date.toISOString().split('T')[0];
      const status = profile.checkInHistory[key];
      const isFuture = date > today;
      const isToday = date.getTime() === today.getTime();
      cells.push(
        <button key={d} onClick={() => toggleDay(d)} disabled={isFuture}
          className={`h-6 w-full rounded-md flex items-center justify-center text-[8px] font-black border transition-all active:scale-[0.85] ${
            isFuture ? 'border-transparent text-zinc-900 cursor-default' :
            status === 'check' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' :
            status === 'reset' ? 'bg-red-500/10 border-red-500/30 text-red-500' :
            'border-white/5 text-zinc-700 hover:border-zinc-500 hover:bg-white/5'
          } ${isToday ? 'ring-1 ring-white/20' : ''}`}>
          {d}
        </button>
      );
    }
    return cells;
  };

  const todayKey = new Date().toISOString().split('T')[0];
  const todayStatus = profile.checkInHistory[todayKey];
  const todayFoods = foods.filter(f => new Date(f.timestamp).toDateString() === new Date().toDateString());
  const totals = todayFoods.reduce((acc, f) => ({
    cal: acc.cal + f.calories, pro: acc.pro + f.protein, car: acc.car + f.carbs, fat: acc.fat + f.fats
  }), { cal: 0, pro: 0, car: 0, fat: 0 });
  const todayTasks = tasks.filter(t => new Date(t.createdAt).toDateString() === new Date().toDateString());
  const completedTasks = todayTasks.filter(t => t.completed).length;
  const unreadAlerts = notifications.filter(n => !n.read).length;

  return (
    <div className={`relative space-y-6 transition-transform duration-75 ${isRelapsing ? 'animate-shake-intense' : ''}`}>
      <style>{`
        @keyframes liquid-fill { 0% { transform: translateY(100%); } 100% { transform: translateY(0%); } }
        @keyframes success-flash-anim { 0% { opacity: 0; } 20% { opacity: 0.6; } 100% { opacity: 0; } }
        @keyframes particle-float { 
          0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateY(-100px) scale(0) rotate(360deg); opacity: 0; }
        }
        @keyframes emergency-float { 
          0% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translate(var(--tw-translate-x, 20px), -150px) scale(0) rotate(720deg); opacity: 0; }
        }
        @keyframes shake-intense {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-2px, -2px); }
          20% { transform: translate(2px, -1px); }
          30% { transform: translate(-3px, 1px); }
          40% { transform: translate(1px, -1px); }
          50% { transform: translate(-1px, 2px); }
          60% { transform: translate(-3px, 1px); }
          70% { transform: translate(2px, 1px); }
          80% { transform: translate(-1px, -1px); }
          90% { transform: translate(1px, 2px); }
        }
        @keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
        @keyframes pulse-white { 0%, 100% { box-shadow: 0 0 10px rgba(255, 255, 255, 0.05); } 50% { box-shadow: 0 0 20px rgba(255, 255, 255, 0.1); } }
        .fuel-liquid { position: absolute; inset: 0; background: linear-gradient(to top, #ffffff10, #ffffff20); animation: liquid-fill 1.5s ease-out forwards; z-index: 0; }
        .caution-stripes { background: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(239, 68, 68, 0.05) 10px, rgba(239, 68, 68, 0.05) 20px); }
        .scanline-effect { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.02) 50%, transparent); animation: scanline 4s linear infinite; pointer-events: none; }
        .animate-particle-float { animation: particle-float linear forwards; }
        .animate-emergency-float { animation: emergency-float ease-out forwards; }
        .animate-shake-intense { animation: shake-intense 0.15s infinite; }
        .success-flash-overlay { position: absolute; inset: 0; background: white; z-index: 40; pointer-events: none; animation: success-flash-anim 0.3s ease-out forwards; }
      `}</style>

      {/* Background Icon Decoration */}
      <div className="absolute top-0 right-0 opacity-[0.03] text-white pointer-events-none transform translate-x-1/4 -translate-y-1/4">
        <OverviewIcon size={320} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-0 relative z-10">
        <div className="md:col-span-8 space-y-6">
          <div className={`relative bg-[#0c0c0c] border p-1 rounded-[2.5rem] shadow-2xl transition-all duration-700 ${todayStatus ? 'border-white/20' : 'border-white/10'}`}>
            <div className={`bg-[#111] rounded-[2.3rem] p-8 relative overflow-hidden ${todayStatus === 'reset' ? 'caution-stripes' : ''}`}>
              <div className="scanline-effect" />
              {showFlash && <div key={flashKey} className="success-flash-overlay" />}
              <SuccessParticles trigger={flashKey} />
              {isRelapsing && <EmergencyParticles />}

              <div className="relative z-10 space-y-8">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 text-zinc-600 mb-1">
                      <Radio size={12} className={todayStatus === 'check' ? 'text-emerald-500' : todayStatus === 'reset' ? 'text-red-500' : ''} />
                      <span className="text-[8px] font-black uppercase tracking-[0.3em]">{t.dashboard.welcome}, {profile.name}</span>
                    </div>
                    <h2 className="text-2xl font-black lowercase text-white tracking-tighter leading-none mb-3">be 69 master⚔️</h2>
                    
                    <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-2 text-zinc-500">
                        <CalendarIcon size={12} className="text-zinc-700" />
                        <span className="text-[9px] font-black tracking-widest lowercase">
                          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="text-[9px] font-black tracking-widest text-emerald-500/80 uppercase">
                        {getLunarDateString(new Date())}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    {todayStatus && (
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[8px] font-black uppercase tracking-widest shadow-lg animate-in fade-in zoom-in duration-300 ${todayStatus === 'check' ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-red-500 text-white border-red-500'}`}>
                        {todayStatus === 'check' ? 'Core Stabilized' : 'System Compromised'}
                      </div>
                    )}
                    {profile.authIdentifier && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={async () => {
                            if (!profile.authIdentifier) return;
                            try {
                              // 開啟列表時把未讀標記為已讀，並重新抓一次
                              await markNotificationsRead(profile.authIdentifier);
                              const fresh = await getNotifications(profile.authIdentifier);
                              setNotifications(fresh);
                            } catch (err) {
                              console.error('Failed to refresh notifications:', err);
                            }
                          }}
                          className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 border border-white/10 text-[8px] font-black text-zinc-300 hover:bg-black/70 active:scale-95 transition-all"
                        >
                          <div className="relative">
                            <Bell size={12} />
                            {unreadAlerts > 0 && (
                              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            )}
                          </div>
                          <span className="uppercase tracking-widest">
                            {unreadAlerts > 0 ? `${unreadAlerts} alerts` : 'no alerts'}
                          </span>
                        </button>
                        {notifications.length > 0 && (
                          <div className="absolute right-0 mt-2 w-64 bg-[#111] border border-white/10 rounded-2xl shadow-2xl p-3 space-y-2 max-h-64 overflow-y-auto">
                            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">
                              Friend Alerts
                            </p>
                            {notifications.map((n) => (
                              <div
                                key={n.id}
                                className={`p-2 rounded-xl text-[9px] space-y-1 ${
                                  n.type === 'friend_reset' ? 'bg-red-500/5 border border-red-500/20' : 'bg-emerald-500/5 border border-emerald-500/20'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-black text-zinc-300">
                                    {n.type === 'friend_reset' ? 'Reset Alert' : 'Distress Signal'}
                                  </span>
                                  <span className="text-[7px] text-zinc-500">
                                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-[8px] text-zinc-400">
                                  from: <span className="font-mono">{n.from_user_id}</span>
                                </p>
                                {n.type === 'friend_warning' && n.payload?.message && (
                                  <p className="text-[8px] text-zinc-300 italic">“{n.payload.message}”</p>
                                )}
                                {n.type === 'friend_reset' && (
                                  <p className="text-[8px] text-zinc-300">
                                    your ally has reset. check in on them.
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-center py-6">
                  <div className="relative group">
                    <div className={`w-36 h-36 rounded-full flex items-center justify-center border-4 transition-all duration-1000 ${todayStatus === 'check' ? 'border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.3)] bg-emerald-500/5' : todayStatus === 'reset' ? 'border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.3)] bg-red-500/5' : 'border-white/5 bg-black/40'}`}>
                       <div className="flex flex-col items-center">
                          <span className={`text-4xl font-black tracking-tighter transition-colors duration-500 ${todayStatus === 'check' ? 'text-emerald-500' : todayStatus === 'reset' ? 'text-red-500' : 'text-white'}`}>
                            {profile.streak}
                          </span>
                          <span className={`text-[8px] font-black uppercase tracking-[0.2em] mt-1 ${todayStatus === 'check' ? 'text-emerald-400' : todayStatus === 'reset' ? 'text-red-400' : 'text-zinc-600'}`}>
                             {t.dashboard.day} • season {profile.relapseCount + 1}
                          </span>
                       </div>
                    </div>
                  </div>
                </div>

                {profile.journeyStartDate && (
                   <div className="flex items-center justify-center gap-2 px-4 py-2 bg-white/[0.02] border border-white/5 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-700">
                     <Clock size={12} className="text-zinc-600" />
                     <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                       {t.dashboard.journey_start_date}: {new Date(profile.journeyStartDate).toLocaleDateString()} {new Date(profile.journeyStartDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                     </p>
                   </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={() => handleQuickCheckIn('check')} 
                    className={`group relative overflow-hidden flex items-center justify-center gap-3 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border transition-all duration-500 active:scale-[0.95] shadow-2xl ${todayStatus === 'check' ? 'bg-emerald-500 border-emerald-500 text-black' : 'bg-white/5 border-white/10 text-zinc-500 hover:border-emerald-500 hover:text-white hover:bg-emerald-500/10'}`}
                  >
                    {isFueling && <div className="fuel-liquid" />}
                    <div className="relative z-10 flex items-center gap-2">
                      <Power size={16} className={`transition-transform duration-500 ${isFueling ? 'animate-pulse scale-125' : 'group-hover:scale-110'}`} />
                      <span>{isFueling ? t.dashboard.fuelling : 'nofap nojerk.'}</span>
                    </div>
                  </button>
                  <button 
                    onClick={() => handleQuickCheckIn('reset')} 
                    disabled={todayStatus === 'reset'}
                    className={`group relative overflow-hidden flex items-center justify-center gap-3 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border transition-all duration-500 active:scale-[0.95] shadow-2xl ${todayStatus === 'reset' ? 'bg-red-500 border-red-500 text-white' : 'bg-white/5 border-white/10 text-zinc-700 hover:border-red-500 hover:text-white hover:bg-red-500/10'}`}
                  >
                    <div className={`relative z-10 flex items-center gap-2`}>
                      <AlertTriangle size={16} /> 
                      <span>{t.dashboard.reset_mars}</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#111] border border-white/5 p-6 rounded-2xl flex flex-col sm:flex-row gap-6 items-center shadow-xl">
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-zinc-600">
                <Flame size={14} className="text-emerald-500" />
                <span className="text-[8px] font-black uppercase tracking-[0.3em]">{t.dashboard.calendar}</span>
                {onRefreshCheckIns && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (isRefreshingCheckIns) return;
                      setIsRefreshingCheckIns(true);
                      try {
                        await onRefreshCheckIns();
                      } finally {
                        setIsRefreshingCheckIns(false);
                      }
                    }}
                    disabled={isRefreshingCheckIns}
                    className="p-1.5 text-zinc-600 hover:text-emerald-500 hover:bg-white/5 rounded-lg transition-all active:scale-[0.8] disabled:opacity-50"
                    title="Refresh day records"
                  >
                    <RefreshCw size={12} className={isRefreshingCheckIns ? 'animate-spin' : ''} />
                  </button>
                )}
              </div>
              <div className="flex items-baseline justify-center sm:justify-start gap-2">
                <span className="text-6xl font-black tracking-tighter text-white leading-none">{profile.streak}</span>
                <span className="text-[11px] font-black text-zinc-600 uppercase tracking-widest">{t.dashboard.day} • season {profile.relapseCount + 1}</span>
              </div>
            </div>
            <div className="w-full sm:w-56 p-4 bg-white/[0.01] rounded-xl border border-white/5">
              {profile.journeyStartDate && (
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/5">
                  <CalendarIcon size={10} className="text-zinc-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">{t.dashboard.journey_start_date}</p>
                    <p className="text-[9px] font-black text-white truncate">{new Date(profile.journeyStartDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[8px] font-black text-white uppercase tracking-widest">{monthNames[currentDate.getMonth()]}</h3>
                <div className="flex gap-1">
                  <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()-1, 1))} className="p-1.5 text-zinc-600 hover:text-white hover:bg-white/5 rounded-lg transition-all active:scale-[0.8]"><ChevronLeft size={12}/></button>
                  <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()+1, 1))} className="p-1.5 text-zinc-600 hover:text-white hover:bg-white/5 rounded-lg transition-all active:scale-[0.8]"><ChevronRight size={12}/></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {renderCalendar()}
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-4 space-y-6">
           <div className="bg-[#111] border border-white/5 p-6 rounded-2xl space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-zinc-600">
                <Target size={14} />
                <span className="text-[8px] font-black uppercase tracking-[0.3em]">daily goals</span>
              </div>
              <ProgressCircle current={completedTasks} goal={todayTasks.length} color="stroke-sky-500" />
            </div>
            <p className="text-3xl font-black tracking-tighter text-white">{completedTasks}/{todayTasks.length}</p>
            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">objectives secured</p>
          </div>

          <div className="bg-[#111] border border-white/5 p-6 rounded-2xl space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-zinc-600">
                <Utensils size={14} />
                <span className="text-[8px] font-black uppercase tracking-[0.3em]">daily fuel</span>
              </div>
              <ProgressCircle current={totals.cal} goal={profile.nutritionGoals.calories} color="stroke-emerald-500" />
            </div>
            <p className="text-3xl font-black tracking-tighter text-white">{totals.cal}</p>
            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">kcal utilized</p>
          </div>

          <a 
            href="http://itisok.baby" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block group"
          >
            <div className="bg-[#111] border border-white/5 p-6 rounded-2xl space-y-4 shadow-xl hover:border-white/20 transition-all active:scale-[0.98]">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-zinc-600">
                  <ShoppingBag size={14} />
                  <span className="text-[8px] font-black uppercase tracking-[0.3em]">nfnj store</span>
                </div>
                <ExternalLink size={12} className="text-zinc-800 group-hover:text-white transition-colors" />
              </div>
              <p className="text-xl font-black tracking-tighter text-white leading-tight">secure elite equipment.</p>
              <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">itisok.baby</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
