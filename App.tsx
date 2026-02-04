
import React, { useState, useEffect, useCallback } from 'react';
import { Utensils, ClipboardList, Radio, User, Crown, HeartPulse, Lock, Settings as SettingsIcon, Globe, Loader2 } from 'lucide-react';
import { View, UserProfile, FoodEntry, Task, Post } from './types';
import { translations } from './translations';
import { supabase } from './supabaseClient';
import Dashboard from './views/Dashboard';
import FoodTracker from './views/FoodTracker';
import TodoList from './views/TodoList';
import Plaza from './views/Plaza';
import Profile from './views/Profile';
import Settings from './views/Settings';
import Subscription from './views/Subscription';
import FirstAid from './views/FirstAid';
import Auth from './views/Auth';

const OverviewIcon = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2.5L12.2155 2.70425C15.9042 6.19659 21 11.2334 21 15.5C21 19.0899 18.0899 22 14.5 22C13 22 12.5 21.5 12 21C11.5 21.5 11 22 9.5 22C5.91015 22 3 19.0899 3 15.5C3 11.2334 8.09581 6.19659 11.7845 2.70425L12 2.5Z" />
  </svg>
);

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(View.DASHBOARD);
  const [isAnimatingCenter, setIsAnimatingCenter] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [profile, setProfile] = useState<UserProfile>({
    name: 'brother',
    avatar: 'https://picsum.photos/seed/warrior/150/150',
    bio: 'initializing protocol...',
    streak: 0,
    relapseCount: 0,
    lastCheckIn: null,
    lastPostDate: null,
    commentsTodayCount: 0,
    lastCommentReset: null,
    lastBodyScanDate: null,
    journeyStartDate: null,
    bodyScanHistory: [],
    checkInHistory: {},
    language: 'en',
    weight: 75,
    height: 180,
    hasUsedFreeBodyAnalysis: false,
    isPremium: false,
    dailyAiUsage: { date: new Date().toISOString().split('T')[0], count: 0 },
    nutritionGoals: { calories: 2500, protein: 150, carbs: 250, fats: 70 },
    preferences: { stealthMode: false, showStreakOnPlaza: true, notificationsEnabled: true },
    isLoggedIn: false
  });

  const [foods, setFoods] = useState<FoodEntry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  // Auth & Initial Data Fetch
  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetchUserData(session.user.id);
      } else {
        setIsLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchUserData(session.user.id);
      } else {
        setProfile(prev => ({ ...prev, isLoggedIn: false }));
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    setIsLoading(true);
    try {
      const { data: profData } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (profData) {
        setProfile(prev => ({
          ...prev,
          isLoggedIn: true,
          authIdentifier: userId,
          name: profData.name || prev.name,
          avatar: profData.avatar_url || prev.avatar,
          bio: profData.bio || prev.bio,
          streak: profData.streak || 0,
          relapseCount: profData.relapse_count || 0,
          journeyStartDate: profData.journey_start_date,
          weight: profData.weight || 75,
          height: profData.height || 180,
          isPremium: profData.is_premium || false,
          language: profData.language || 'en',
          preferences: profData.preferences || prev.preferences,
          nutritionGoals: profData.nutrition_goals || prev.nutritionGoals
        }));
      }

      const { data: checkInData } = await supabase.from('check_ins').select('*').eq('user_id', userId);
      if (checkInData) {
        const history: Record<string, 'check' | 'reset'> = {};
        checkInData.forEach(ci => { history[ci.date] = ci.status; });
        setProfile(prev => ({ ...prev, checkInHistory: history }));
      }

      const { data: foodData } = await supabase.from('food_entries').select('*').eq('user_id', userId).order('timestamp', { ascending: false });
      if (foodData) setFoods(foodData.map(f => ({ ...f, calories: f.calories, protein: f.protein, carbs: f.carbs, fats: f.fats, imageUrl: f.image_url })));

      const { data: taskData } = await supabase.from('tasks').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (taskData) setTasks(taskData.map(t => ({ id: t.id, text: t.text, completed: t.completed, createdAt: t.created_at })));

      const { data: postData } = await supabase.from('posts').select('*, profiles(name, avatar_url)').order('created_at', { ascending: false });
      if (postData) {
        // 为每个post加载comments
        const postsWithComments = await Promise.all(postData.map(async (p) => {
          const { data: commentsData } = await supabase
            .from('comments')
            .select('*, profiles(name, avatar_url)')
            .eq('post_id', p.id)
            .order('created_at', { ascending: true });
          
          return {
            id: p.id,
            author: p.profiles?.name || 'unknown',
            authorAvatar: p.profiles?.avatar_url || '',
            content: p.content,
            timestamp: p.created_at,
            likes: p.likes || 0,
            comments: (commentsData || []).map(c => ({
              id: c.id,
              author: c.profiles?.name || 'unknown',
              content: c.content,
              timestamp: c.created_at
            })),
            category: p.category,
            streak: p.streak_at_time,
            season: p.season_at_time,
            imageUrl: p.image_url
          };
        }));
        setPosts(postsWithComments);
      }

    } catch (err) {
      console.error("Backend sync failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const t = translations[profile.language || 'en'];

  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
    if (profile.authIdentifier) {
      await supabase.from('profiles').update({
        name: updates.name,
        avatar_url: updates.avatar,
        bio: updates.bio,
        weight: updates.weight,
        height: updates.height,
        is_premium: updates.isPremium,
        language: updates.language,
        preferences: updates.preferences,
        nutrition_goals: updates.nutritionGoals,
        journey_start_date: updates.journeyStartDate
      }).eq('id', profile.authIdentifier);
    }
  };

  const navItems = [
    { icon: Utensils, label: t.nav.fuel, view: View.FOOD },
    { icon: ClipboardList, label: t.nav.goals, view: View.TODO },
    { icon: Radio, label: t.nav.plaza, view: View.PLAZA },
    { icon: OverviewIcon, label: t.nav.nfnj, view: View.DASHBOARD },
    { icon: HeartPulse, label: t.nav.sos, view: View.FIRST_AID, premium: true },
    { icon: User, label: t.nav.id, view: View.PROFILE },
    { icon: SettingsIcon, label: t.nav.settings, view: View.SETTINGS },
    { icon: Crown, label: t.nav.elite, view: View.SUBSCRIPTION },
  ];

  const handleNavClick = (view: View, isPremium?: boolean) => {
    if (view === View.DASHBOARD) {
      setIsAnimatingCenter(true);
      setTimeout(() => setIsAnimatingCenter(false), 300);
    }
    if (isPremium && !profile.isPremium) {
      setActiveView(View.SUBSCRIPTION);
    } else {
      setActiveView(view);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden px-6 py-8">
        <div className="splash-glow" aria-hidden />
        <div className="flex flex-col items-center gap-6 relative z-10 min-w-0 max-w-full">
          <h1 className="splash-logo shrink-0">
            nofap nojerk<span className="dot">.</span>
          </h1>
          <div className="flex items-center gap-2">
            <Loader2 size={14} className="text-emerald-500/80 animate-spin" />
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-500">Syncing Network...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile.isLoggedIn) {
    return (
      <div className="min-h-screen animate-fade-in-from-splash">
        <Auth setProfile={setProfile} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] selection:bg-white selection:text-black animate-fade-in-from-splash">
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
           <div className="brand-logo text-lg md:text-xl">nofap nojerk<span className="dot">.</span></div>
           <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
             <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-[8px] font-black lowercase tracking-widest text-zinc-500 uppercase">{t.nav.sync_active}</span>
           </div>
        </div>
        <button onClick={() => handleUpdateProfile({ language: profile.language === 'en' ? 'zh' : 'en' })} className="flex items-center gap-2 px-4 py-1.5 bg-white/[0.03] border border-white/10 rounded-full hover:bg-white/10 transition-all active:scale-95 group">
          <Globe size={12} className="text-zinc-500 group-hover:text-emerald-500 transition-colors" />
          <span className="text-[10px] font-black uppercase tracking-widest">{profile.language === 'en' ? 'English' : '中文 (繁)'}</span>
        </button>
      </header>

      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-56 bg-[#0a0a0a] border-r border-white/5 z-40 pt-16">
        <nav className="flex-1 px-3 py-6 space-y-0.5">
          {navItems.map((item) => {
            const isActive = activeView === item.view;
            const isLocked = item.premium && !profile.isPremium;
            return (
              <button key={item.view} onClick={() => handleNavClick(item.view, item.premium)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-[10px] font-black lowercase tracking-[0.1em] active:scale-[0.96] group relative overflow-hidden ${isActive ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                <div className="relative">
                  <item.icon size={16} strokeWidth={isActive ? 3 : 2} />
                  {isLocked && <Lock size={7} className="absolute -top-1 -right-1 text-zinc-700" />}
                </div>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="md:ml-56 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 md:px-8 pt-20 pb-32 md:pb-16">
          {activeView === View.DASHBOARD && <Dashboard profile={profile} foods={foods} tasks={tasks} setProfile={setProfile} onRefreshCheckIns={profile.authIdentifier ? () => fetchUserData(profile.authIdentifier!) : undefined} />}
          {activeView === View.FOOD && <FoodTracker foods={foods} setFoods={setFoods} profile={profile} setProfile={setProfile} setActiveView={setActiveView} />}
          {activeView === View.TODO && <TodoList tasks={tasks} setTasks={setTasks} profile={profile} />}
          {activeView === View.PLAZA && <Plaza profile={profile} posts={posts} setPosts={setPosts} setProfile={setProfile} />}
          {activeView === View.FIRST_AID && <FirstAid profile={profile} setActiveView={setActiveView} />}
          {activeView === View.PROFILE && <Profile profile={profile} setProfile={setProfile} setActiveView={setActiveView} handleReset={() => supabase.auth.signOut()} />}
          {activeView === View.SETTINGS && <Settings profile={profile} setProfile={setProfile} handleReset={() => supabase.auth.signOut()} />}
          {activeView === View.SUBSCRIPTION && <Subscription profile={profile} setProfile={setProfile} />}
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0a0a0a]/90 backdrop-blur-2xl border-t border-white/5 flex items-center z-50 px-2 pb-1 shadow-2xl">
        <div className="flex flex-1 justify-around items-center h-full overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const isActive = activeView === item.view;
            const isCenter = item.view === View.DASHBOARD;
            return (
              <button key={item.view} onClick={() => handleNavClick(item.view, item.premium)} className={`flex flex-col items-center justify-center min-w-[50px] transition-all duration-200 active:scale-[0.8] ${isCenter ? '' : 'text-zinc-500'} ${isActive && !isCenter ? 'text-white' : ''}`}>
                {isCenter ? (
                  <div className={`w-12 h-12 -mt-8 rounded-full shadow-2xl bg-white text-black flex items-center justify-center transition-transform ${isAnimatingCenter ? 'animate-nav-pop' : ''}`}>
                    <item.icon size={20} strokeWidth={3} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <item.icon size={16} strokeWidth={isActive ? 3 : 2} />
                    <span className="text-[7px] font-black lowercase tracking-widest mt-1">{item.label}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default App;
