
import React, { useState, useRef, useMemo } from 'react';
import { Camera, Search, Loader2, X, Utensils, ChevronLeft, ChevronRight, Calendar, Lock, Zap, Info } from 'lucide-react';
import { FoodEntry, UserProfile, View } from '../types';
import { analyzeFoodImage, analyzeFoodText } from '../services/geminiService';
import { translations } from '../translations';
import { saveFoodEntry, deleteFoodEntry, incrementAiUsage } from '../services/databaseService';
import { compressImage, getBase64WithoutPrefix } from '../services/imageUtils';
import { getCachedFoodResult, cacheFoodResult } from '../services/foodCache';

interface FoodTrackerProps {
  foods: FoodEntry[];
  setFoods: React.Dispatch<React.SetStateAction<FoodEntry[]>>;
  profile: UserProfile;
  setProfile?: React.Dispatch<React.SetStateAction<UserProfile>>;
  setActiveView?: (view: View) => void;
}

const MacroStatus = ({ label, current, target, color }: { label: string, current: number, target: number, color: string }) => {
  const percentage = Math.min((current / target) * 100, 100);
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end px-1">
        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 leading-none">{label}</span>
        <span className="text-[11px] font-black text-white leading-none">{current}<span className="text-[8px] text-zinc-700 uppercase tracking-tighter ml-1">/ {target}g</span></span>
      </div>
      <div className="h-1 w-full bg-black rounded-full overflow-hidden shadow-inner">
        <div 
          className={`h-full ${color} transition-all duration-1000 ease-out`} 
          style={{ width: `${percentage}%` }} 
        />
      </div>
    </div>
  );
};

const hasGeminiKey = () => {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  return typeof key === 'string' && key.length > 10 && !key.includes('your-');
};

const FoodTracker: React.FC<FoodTrackerProps> = ({ foods, setFoods, profile, setProfile, setActiveView }) => {
  const t = translations[profile.language || 'en'];
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [inputText, setInputText] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showManualForm, setShowManualForm] = useState(!hasGeminiKey());
  const [manualName, setManualName] = useState('');
  const [manualCalories, setManualCalories] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualFats, setManualFats] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const checkAiLimit = () => {
    if (profile.isFounder) return true;
    const today = new Date().toISOString().split('T')[0];
    const isToday = profile.dailyAiUsage.date === today;
    const currentCount = isToday ? (profile.dailyAiUsage.count || 0) : 0;
    
    if (profile.isPremium) {
      // Premium 用户：每天最多 13 次
      if (currentCount >= 13) {
        alert(`每日 AI 分析配额已用完（13次/天）。请明天再试。`);
        return false;
      }
      return true;
    } else {
      // 免费用户：每天 1 次
      if (currentCount >= 1) {
        alert(t.food.limit_reached_alert || "Daily AI quota exhausted.");
        if (setActiveView) setActiveView(View.SUBSCRIPTION);
        return false;
      }
      return true;
    }
  };


  const weekDays = useMemo(() => {
    const days = [];
    const base = new Date(selectedDate);
    for (let i = -3; i <= 3; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      days.push(d);
    }
    return days;
  }, [selectedDate]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !checkAiLimit() || !profile.authIdentifier) return;
    setIsAnalyzing(true);
    
    try {
      // 1. 压缩图片
      const compressedBase64 = await compressImage(file, 1024, 1024, 0.8);
      const originalBase64 = compressedBase64; // 保存原始 base64（包含前缀）用于显示
      const base64WithoutPrefix = getBase64WithoutPrefix(compressedBase64);
      
      // 2. 检查缓存
      const cachedResult = getCachedFoodResult(base64WithoutPrefix);
      if (cachedResult) {
        // 使用缓存结果
        const newEntry: FoodEntry = {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: selectedDate.toISOString(),
          imageUrl: originalBase64,
          ...cachedResult
        };
        
        const savedEntry = await saveFoodEntry(profile.authIdentifier, newEntry);
        setFoods(prev => [{ ...newEntry, id: savedEntry.id }, ...prev]);
        setIsAnalyzing(false);
        return;
      }
      
      // 3. 调用 AI 分析（使用压缩后的图片）
      const result = await analyzeFoodImage(base64WithoutPrefix);
      
      // 4. 缓存结果
      cacheFoodResult(base64WithoutPrefix, result);
      
      const newEntry: FoodEntry = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: selectedDate.toISOString(),
        imageUrl: originalBase64,
        ...result
      };
      
      // 5. 保存到数据库并更新使用计数
      const savedEntry = await saveFoodEntry(profile.authIdentifier, newEntry);
      await incrementAiUsage(profile.authIdentifier, profile.isPremium);
      
      setFoods(prev => [{ ...newEntry, id: savedEntry.id }, ...prev]);
      if (setProfile) {
        const today = new Date().toISOString().split('T')[0];
        const isToday = profile.dailyAiUsage.date === today;
        setProfile(prev => ({
          ...prev,
          dailyAiUsage: { 
            date: today, 
            count: isToday ? (prev.dailyAiUsage.count || 0) + 1 : 1 
          }
        }));
      }
    } catch (err: any) { 
      console.error('Analysis failed:', err);
      const msg = err?.message || '';
      if (msg.includes('配额已用完') || msg.includes('quota')) {
        alert(msg);
      } else if (!import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY.includes('your-') || msg.includes('API key') || msg.includes('401') || msg.includes('403')) {
        alert('⚠️ 食物分析需要配置 Gemini API Key。\n\n1. 访问 https://aistudio.google.com/ 获取 API Key\n2. 在 .env.local 中设置 VITE_GEMINI_API_KEY\n3. 重启开发服务器 (npm run dev)');
      } else {
        alert('分析失败，请稍后重试。' + (msg ? '\n\n' + msg : ''));
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !checkAiLimit() || !profile.authIdentifier) return;
    setIsAnalyzing(true);
    
    try {
      // 1. 检查缓存
      const cachedResult = getCachedFoodResult(inputText.trim());
      if (cachedResult) {
        // 使用缓存结果
        const newEntry: FoodEntry = {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: selectedDate.toISOString(),
          ...cachedResult
        };
        
        const savedEntry = await saveFoodEntry(profile.authIdentifier, newEntry);
        setFoods(prev => [{ ...newEntry, id: savedEntry.id }, ...prev]);
        setInputText('');
        setIsAnalyzing(false);
        return;
      }
      
      // 2. 调用 AI 分析
      const result = await analyzeFoodText(inputText.trim());
      
      // 3. 缓存结果
      cacheFoodResult(inputText.trim(), result);
      
      const newEntry: FoodEntry = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: selectedDate.toISOString(),
        ...result
      };
      
      // 4. 保存到数据库并更新使用计数
      const savedEntry = await saveFoodEntry(profile.authIdentifier, newEntry);
      await incrementAiUsage(profile.authIdentifier, profile.isPremium);
      
      setFoods(prev => [{ ...newEntry, id: savedEntry.id }, ...prev]);
      setInputText('');
      if (setProfile) {
        const today = new Date().toISOString().split('T')[0];
        const isToday = profile.dailyAiUsage.date === today;
        setProfile(prev => ({
          ...prev,
          dailyAiUsage: { 
            date: today, 
            count: isToday ? (prev.dailyAiUsage.count || 0) + 1 : 1 
          }
        }));
      }
    } catch (err: any) { 
      console.error('Analysis failed:', err);
      const msg = err?.message || '';
      if (msg.includes('配额已用完') || msg.includes('quota')) {
        alert(msg);
      } else if (!import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY.includes('your-') || msg.includes('API key') || msg.includes('401') || msg.includes('403')) {
        alert('⚠️ 食物分析需要配置 Gemini API Key。\n\n1. 访问 https://aistudio.google.com/ 获取 API Key\n2. 在 .env.local 中设置 VITE_GEMINI_API_KEY\n3. 重启开发服务器 (npm run dev)');
      } else {
        alert('分析失败，请稍后重试。' + (msg ? '\n\n' + msg : ''));
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !profile.authIdentifier) return;
    const cal = Number(manualCalories) || 0;
    const pro = Number(manualProtein) || 0;
    const car = Number(manualCarbs) || 0;
    const fat = Number(manualFats) || 0;
    try {
      const newEntry: FoodEntry = {
        id: '',
        name: manualName.trim(),
        timestamp: selectedDate.toISOString(),
        calories: cal,
        protein: pro,
        carbs: car,
        fats: fat,
      };
      const savedEntry = await saveFoodEntry(profile.authIdentifier, newEntry);
      setFoods(prev => [{ ...newEntry, id: savedEntry.id }, ...prev]);
      setManualName('');
      setManualCalories('');
      setManualProtein('');
      setManualCarbs('');
      setManualFats('');
    } catch (err) {
      console.error('Failed to save food entry:', err);
      alert('儲存失敗，請稍後重試');
    }
  };

  const dayFoods = foods.filter(f => new Date(f.timestamp).toDateString() === selectedDate.toDateString());
  const totals = dayFoods.reduce((acc, f) => ({
    cal: acc.cal + f.calories,
    pro: acc.pro + f.protein,
    car: acc.car + f.carbs,
    fat: acc.fat + f.fats,
  }), { cal: 0, pro: 0, car: 0, fat: 0 });

  const today = new Date().toISOString().split('T')[0];
  const isToday = profile.dailyAiUsage.date === today;
  const currentCount = isToday ? (profile.dailyAiUsage.count || 0) : 0;
  const maxLimit = profile.isPremium ? 13 : 1;
  const aiQuotaRemaining = profile.isPremium 
    ? `${Math.max(0, maxLimit - currentCount)}/13 left today`
    : `${Math.max(0, maxLimit - currentCount)}/1 free left`;
  const geminiConfigured = hasGeminiKey();

  return (
    <div className="relative space-y-6 pt-20">
      {/* Background Icon Decoration */}
      <div className="absolute top-0 right-0 opacity-[0.03] text-white pointer-events-none transform translate-x-1/4 -translate-y-1/4">
        <Utensils size={320} />
      </div>

      <header className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-4">
        <div>
          <p className="text-[8px] font-black lowercase tracking-[0.3em] text-zinc-600 uppercase">{t.food.sector}</p>
          <h1 className="text-3xl font-black tracking-tighter text-white lowercase leading-none">{t.food.title}</h1>
        </div>
        <div className="flex flex-col items-end gap-3 w-full md:w-auto">
          <button 
            onClick={() => setSelectedDate(new Date())} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.03] border border-white/10 rounded-full text-[8px] font-black lowercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/10 transition-all active:scale-[0.92]"
          >
            <Calendar size={12} />
            {t.food.back_today}
          </button>
          <div className="bg-[#111] border border-white/10 p-1.5 rounded-xl flex items-center justify-between gap-2 w-full md:w-auto shadow-xl">
            <button onClick={() => {const d = new Date(selectedDate); d.setDate(d.getDate()-7); setSelectedDate(d);}} className="p-1.5 text-zinc-600 hover:text-white hover:bg-white/5 rounded-lg transition-all active:scale-[0.8]"><ChevronLeft size={16}/></button>
            <div className="flex-1 flex justify-around gap-1 overflow-x-auto no-scrollbar px-1">
              {weekDays.map((date, i) => {
                const active = date.toDateString() === selectedDate.toDateString();
                const isToday = date.toDateString() === new Date().toDateString();
                return (
                  <button key={i} onClick={() => setSelectedDate(date)} className={`flex flex-col items-center min-w-[38px] py-2 rounded-lg transition-all active:scale-[0.85] ${active ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-zinc-600 hover:text-white hover:bg-white/5'}`}>
                    <span className="text-[7px] font-black uppercase mb-0.5 opacity-60">{date.toLocaleDateString(undefined, {weekday:'short'})}</span>
                    <span className={`text-[11px] font-black leading-none ${isToday && !active ? 'text-emerald-500' : ''}`}>{date.getDate()}</span>
                  </button>
                );
              })}
            </div>
            <button onClick={() => {const d = new Date(selectedDate); d.setDate(d.getDate()+7); setSelectedDate(d);}} className="p-1.5 text-zinc-600 hover:text-white hover:bg-white/5 rounded-lg transition-all active:scale-[0.8]"><ChevronRight size={16}/></button>
          </div>
        </div>
      </header>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#111] border border-white/10 p-6 rounded-2xl space-y-6 relative overflow-hidden shadow-xl">
            {!profile.isPremium && profile.dailyAiUsage.count >= 1 && (
              <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-20 flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                  <Lock size={20} className="text-orange-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-white uppercase tracking-widest">daily quota exhausted</p>
                  <p className="text-[8px] font-medium text-zinc-500 lowercase leading-relaxed">brother plan includes 1 free scan per solar cycle. upgrade for unlimited neural processing.</p>
                </div>
                <button onClick={() => setActiveView?.(View.SUBSCRIPTION)} className="w-full bg-emerald-500 text-black py-3 rounded-xl text-[9px] font-black lowercase tracking-widest active:scale-95 transition-all hover:bg-white shadow-xl shadow-emerald-500/10 flex items-center justify-center gap-2">
                  <Zap size={12} fill="currentColor" /> upgrade elite commander
                </button>
              </div>
            )}
            
            <div className="space-y-4">
              {geminiConfigured && (
                <>
                  <div className="flex justify-between items-center px-1">
                    <h3 className="text-[8px] font-black lowercase tracking-widest text-zinc-600 uppercase">{t.food.log_intake}</h3>
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${profile.isPremium ? 'text-emerald-500 border-emerald-500/20' : 'text-orange-500 border-orange-500/20'}`}>
                      {aiQuotaRemaining}
                    </span>
                  </div>
                  <form onSubmit={handleTextSubmit} className="relative group">
                    <input 
                      type="text" 
                      value={inputText} 
                      onChange={(e) => setInputText(e.target.value)} 
                      placeholder={t.food.describe} 
                      className="w-full bg-black border border-white/10 rounded-xl py-3 pl-4 pr-12 text-[11px] font-black lowercase text-white focus:outline-none focus:border-white/30 transition-all placeholder:text-zinc-800 shadow-inner" 
                    />
                    <button type="submit" disabled={isAnalyzing} className="absolute right-2 top-1.5 p-2 bg-white text-black rounded-lg hover:bg-emerald-500 transition-all active:scale-[0.85] shadow-lg">
                      {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} strokeWidth={3} />}
                    </button>
                  </form>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-white/5"></div>
                      <p className="text-[7px] font-black text-zinc-800 lowercase tracking-widest uppercase">or</p>
                      <div className="h-px flex-1 bg-white/5"></div>
                    </div>
                    <button 
                      onClick={() => fileInputRef.current?.click()} 
                      disabled={isAnalyzing} 
                      className="w-full group flex flex-col items-center justify-center gap-4 py-8 bg-white/[0.01] border border-white/5 border-dashed rounded-xl text-zinc-700 hover:text-white hover:border-emerald-500/30 hover:bg-white/[0.03] transition-all active:scale-[0.98]"
                    >
                      <Camera size={24} />
                      <span className="text-[9px] font-black lowercase tracking-widest uppercase">{t.food.thermal_active}</span>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                  </div>
                </>
              )}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-white/5"></div>
                  <p className="text-[7px] font-black text-zinc-800 lowercase tracking-widest uppercase">{geminiConfigured ? 'or' : ''} 手動輸入</p>
                  <div className="h-px flex-1 bg-white/5"></div>
                </div>
                <button type="button" onClick={() => setShowManualForm(!showManualForm)} className="w-full text-[9px] font-black text-zinc-500 hover:text-white uppercase tracking-widest">
                  {showManualForm ? '收起' : '展開手動輸入營養數據'}
                </button>
                {showManualForm && (
                  <form onSubmit={handleManualSubmit} className="space-y-3 p-3 bg-black/40 border border-white/5 rounded-xl">
                    <input type="text" value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="食物名稱 *" required className="w-full bg-black border border-white/10 rounded-lg py-2 px-3 text-[11px] font-black text-white focus:outline-none focus:border-white/30 placeholder:text-zinc-700" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" min="0" value={manualCalories} onChange={(e) => setManualCalories(e.target.value)} placeholder="熱量 kcal" className="w-full bg-black border border-white/10 rounded-lg py-2 px-3 text-[11px] font-black text-white focus:outline-none focus:border-white/30 placeholder:text-zinc-700" />
                      <input type="number" min="0" value={manualProtein} onChange={(e) => setManualProtein(e.target.value)} placeholder="蛋白質 g" className="w-full bg-black border border-white/10 rounded-lg py-2 px-3 text-[11px] font-black text-white focus:outline-none focus:border-white/30 placeholder:text-zinc-700" />
                      <input type="number" min="0" value={manualCarbs} onChange={(e) => setManualCarbs(e.target.value)} placeholder="碳水 g" className="w-full bg-black border border-white/10 rounded-lg py-2 px-3 text-[11px] font-black text-white focus:outline-none focus:border-white/30 placeholder:text-zinc-700" />
                      <input type="number" min="0" value={manualFats} onChange={(e) => setManualFats(e.target.value)} placeholder="脂肪 g" className="w-full bg-black border border-white/10 rounded-lg py-2 px-3 text-[11px] font-black text-white focus:outline-none focus:border-white/30 placeholder:text-zinc-700" />
                    </div>
                    <button type="submit" className="w-full bg-white text-black py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all">
                      儲存
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>

          <div className="bg-[#111] border border-white/10 p-6 rounded-2xl shadow-xl space-y-6">
             <div className="space-y-1">
               <h3 className="text-[8px] font-black lowercase tracking-widest text-zinc-500 uppercase">{t.food.totals_for}</h3>
               <p className="text-[12px] font-black text-white">{selectedDate.toDateString()}</p>
             </div>
             
             <div className="space-y-4">
                <div className="flex justify-between items-baseline">
                   <span className="text-4xl font-black text-white tracking-tighter">{totals.cal}</span>
                   <span className="text-[8px] font-black text-zinc-600 lowercase tracking-widest uppercase leading-none">kcal utilized</span>
                </div>
                <div className="h-1.5 w-full bg-black rounded-full overflow-hidden shadow-inner">
                   <div className="h-full bg-white transition-all duration-1000 ease-out" style={{width: `${Math.min((totals.cal / profile.nutritionGoals.calories) * 100, 100)}%`}} />
                </div>
             </div>

             <div className="space-y-4 pt-4 border-t border-white/5">
                <MacroStatus label="protein" current={totals.pro} target={profile.nutritionGoals.protein} color="bg-emerald-500" />
                <MacroStatus label="carbs" current={totals.car} target={profile.nutritionGoals.carbs} color="bg-sky-500" />
                <MacroStatus label="fats" current={totals.fat} target={profile.nutritionGoals.fats} color="bg-orange-500" />
             </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-4">
           <div className="flex items-center justify-between px-2">
             <h2 className="text-[8px] font-black lowercase tracking-widest text-zinc-600 uppercase">{t.food.reports}</h2>
             <span className="text-[8px] text-zinc-700 font-black">{dayFoods.length} entries</span>
           </div>
           
           <div className="grid gap-3">
             {dayFoods.length === 0 ? (
               <div className="py-20 text-center border border-white/5 border-dashed rounded-2xl bg-white/[0.01]">
                 <Utensils size={24} className="mx-auto text-zinc-800 mb-2" />
                 <p className="text-[10px] font-black text-zinc-800 lowercase italic">no data logged</p>
               </div>
             ) : (
               dayFoods.map(food => (
                 <div key={food.id} className="bg-[#111] border border-white/5 p-4 rounded-2xl flex items-center gap-4 group hover:border-white/10 transition-all shadow-lg">
                    <div className="w-16 h-16 bg-black rounded-xl overflow-hidden border border-white/5 shrink-0 shadow-inner">
                      {food.imageUrl ? <img src={food.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-white/5"><Utensils size={20} className="text-zinc-900" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-base lowercase text-white mb-2 truncate">{food.name}</h3>
                      <div className="flex flex-wrap gap-3 text-[8px] font-black text-zinc-600 lowercase tracking-widest">
                         <span className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-md border border-white/5 hover:bg-white/10 transition-colors">
                           <div className="w-1 h-1 rounded-full bg-emerald-500" /> pro: {food.protein}g
                         </span>
                         <span className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-md border border-white/5 hover:bg-white/10 transition-colors">
                           <div className="w-1 h-1 rounded-full bg-sky-500" /> carb: {food.carbs}g
                         </span>
                         <span className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-md border border-white/5 hover:bg-white/10 transition-colors">
                           <div className="w-1 h-1 rounded-full bg-orange-500" /> fat: {food.fats}g
                         </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end px-4 border-l border-white/5">
                      <p className="text-2xl font-black text-white leading-none tracking-tighter">{food.calories}</p>
                      <p className="text-[7px] font-black text-zinc-700 uppercase tracking-widest mt-1">kcal</p>
                    </div>
                    <button onClick={async () => {
                      try {
                        await deleteFoodEntry(food.id);
                        setFoods(prev => prev.filter(f => f.id !== food.id));
                      } catch (error) {
                        console.error('Failed to delete food entry:', error);
                      }
                    }} className="opacity-0 group-hover:opacity-100 p-2 text-zinc-800 hover:text-red-500 active:scale-[0.8] transition-all">
                      <X size={16}/>
                    </button>
                 </div>
               ))
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default FoodTracker;
