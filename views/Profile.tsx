
import React, { useState, useRef, useEffect } from 'react';
import { Camera, User, Ruler, Weight, Scan, Edit2, Activity, Zap, RefreshCw, History, TrendingUp, TrendingDown, Gift, Clock, Lock, Users, Check, X as XIcon } from 'lucide-react';
import { UserProfile, View, BodyScanRecord } from '../types';
import { translations } from '../translations';
import { analyzeBodyComposition } from '../services/geminiService';
import { redeemInvitationCode, checkBodyScanLimit, updateProfile, createFriendRequest, getFriendRelationships, respondToFriendRequest } from '../services/databaseService';
import { compressImage, getBase64WithoutPrefix } from '../services/imageUtils';

interface ProfileProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  setActiveView?: (view: View) => void;
  handleUpdateProfile?: (updates: Partial<UserProfile>) => Promise<void>;
  handleReset?: () => void;
}

const inputFieldClass = 'w-full bg-black border border-white/10 rounded-xl py-3 pr-4 text-[11px] font-black lowercase text-white focus:outline-none focus:border-white/30 transition-all placeholder:text-zinc-800 shadow-inner';

const Profile: React.FC<ProfileProps> = ({ profile, setProfile, setActiveView, handleUpdateProfile }) => {
  const t = translations[profile?.language || 'en'] || translations.en;
  
  const [formData, setFormData] = useState({ 
    name: profile?.name || 'brother', 
    avatar: profile?.avatar || 'https://picsum.photos/seed/warrior/150/150', 
    bio: profile?.bio || '', 
    weight: profile?.weight || 75, 
    height: profile?.height || 180,
    calories: profile?.nutritionGoals?.calories || 2500, 
    protein: profile?.nutritionGoals?.protein || 150, 
    carbs: profile?.nutritionGoals?.carbs || 250, 
    fats: profile?.nutritionGoals?.fats || 70
  });
  const [isScanning, setIsScanning] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<BodyScanRecord | null>(null);
  const [invitationCode, setInvitationCode] = useState('');
  const [isRedeemingCode, setIsRedeemingCode] = useState(false);
  const [bodyScanAllowed, setBodyScanAllowed] = useState(true);
  const [bodyScanMessage, setBodyScanMessage] = useState<string | null>(null);
  const [friendIdInput, setFriendIdInput] = useState('');
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendError, setFriendError] = useState<string | null>(null);
  const [friendRelationships, setFriendRelationships] = useState<{ id: string; user_id: string; friend_id: string; status: 'pending' | 'accepted' | 'blocked'; created_at: string; }[]>([]);
  const bodyFileInputRef = useRef<HTMLInputElement>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  // 僅在切換用戶（authIdentifier 變化）時從 profile 同步到 formData，避免輸入時被覆寫
  const prevAuthIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!profile) return;
    const currentId = profile.authIdentifier;
    if (prevAuthIdRef.current !== currentId) {
      prevAuthIdRef.current = currentId;
      setFormData({
        name: profile.name || 'brother',
        avatar: profile.avatar || 'https://picsum.photos/seed/warrior/150/150',
        bio: profile.bio || '',
        weight: profile.weight || 75,
        height: profile.height || 180,
        calories: profile.nutritionGoals?.calories || 2500,
        protein: profile.nutritionGoals?.protein || 150,
        carbs: profile.nutritionGoals?.carbs || 250,
        fats: profile.nutritionGoals?.fats || 70
      });
    }
  }, [profile?.authIdentifier]);

  useEffect(() => {
    const loadBodyScanLimit = async () => {
      if (!profile.authIdentifier) {
        setBodyScanAllowed(false);
        setBodyScanMessage(null);
        return;
      }

      if (profile.isPremium || profile.isFounder) {
        try {
          const limit = await checkBodyScanLimit(profile.authIdentifier);
          setBodyScanAllowed(limit.allowed);
          if (!limit.allowed && limit.lastScanDate) {
            const lastScan = new Date(limit.lastScanDate);
            const daysSince = Math.floor((Date.now() - lastScan.getTime()) / (1000 * 60 * 60 * 24));
            const daysRemaining = 7 - daysSince;
            setBodyScanMessage(`上次扫描：${lastScan.toLocaleDateString()}。还需等待 ${daysRemaining} 天才能再次扫描。`);
          } else {
            setBodyScanMessage(null);
          }
        } catch (err) {
          console.error('Failed to check body scan limit:', err);
          setBodyScanAllowed(true);
          setBodyScanMessage(null);
        }
      } else {
        setBodyScanAllowed(false);
        setBodyScanMessage('身体扫描功能仅限 Premium 用户使用。');
      }
    };

    const loadFriends = async () => {
      if (!profile.authIdentifier) return;
      try {
        setFriendsLoading(true);
        const rows = await getFriendRelationships(profile.authIdentifier);
        setFriendRelationships(rows);
      } catch (err) {
        console.error('Failed to load friends:', err);
      } finally {
        setFriendsLoading(false);
      }
    };

    loadBodyScanLimit();
    loadFriends();
  }, [profile.authIdentifier, profile.isPremium, profile.isFounder, profile.lastBodyScanDate]);

  const handleSendFriendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFriendError(null);
    const targetId = friendIdInput.trim();
    if (!targetId || !profile.authIdentifier) return;
    if (targetId === profile.authIdentifier) {
      setFriendError('不能加自己為好友');
      return;
    }
    try {
      setFriendsLoading(true);
      const created = await createFriendRequest(profile.authIdentifier, targetId);
      setFriendRelationships(prev => [created, ...prev]);
      setFriendIdInput('');
    } catch (err: any) {
      console.error(err);
      setFriendError(err?.message || '無法送出好友邀請');
    } finally {
      setFriendsLoading(false);
    }
  };

  const handleRespondFriend = async (id: string, accept: boolean) => {
    try {
      setFriendsLoading(true);
      await respondToFriendRequest(id, accept);
      setFriendRelationships(prev =>
        accept
          ? prev.map(r => (r.id === id ? { ...r, status: 'accepted' } : r))
          : prev.filter(r => r.id !== id)
      );
    } catch (err) {
      console.error('Failed to respond friend request', err);
    } finally {
      setFriendsLoading(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextProfile = {
      ...formData,
      nutritionGoals: { calories: formData.calories, protein: formData.protein, carbs: formData.carbs, fats: formData.fats }
    };
    setProfile(prev => ({ ...prev, ...nextProfile, nutritionGoals: nextProfile.nutritionGoals }));
    if (handleUpdateProfile) {
      await handleUpdateProfile({
        name: formData.name,
        avatar: formData.avatar,
        bio: formData.bio,
        weight: formData.weight,
        height: formData.height,
        nutritionGoals: nextProfile.nutritionGoals
      });
    }
    alert("Dossier synchronized.");
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setFormData(prev => ({ ...prev, avatar: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBodyScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!profile.isPremium && !profile.isFounder) {
      alert('身体扫描功能仅限 Premium 用户使用。');
      return;
    }

    if (!bodyScanAllowed && profile.authIdentifier) {
      const limit = await checkBodyScanLimit(profile.authIdentifier);
      if (!limit.allowed) {
        alert(bodyScanMessage || '一周内只能进行一次身体扫描。请稍后再试。');
        return;
      }
    }

    setIsScanning(true);
    
    try {
      // 1. 压缩图片
      const compressedBase64 = await compressImage(file, 1024, 1024, 0.8);
      const base64WithoutPrefix = getBase64WithoutPrefix(compressedBase64);
      
      // 2. 调用 AI 分析（使用压缩后的图片）
      const result = await analyzeBodyComposition(base64WithoutPrefix, formData.weight, formData.height);
      
      const scanRecord: BodyScanRecord = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        weight: formData.weight,
        ...result
      };

      setAnalysisResult(scanRecord);
      setProfile(prev => ({
        ...prev,
        lastBodyScanDate: scanRecord.timestamp,
        bodyAnalysisReport: result.analysis,
        bodyScanHistory: [scanRecord, ...(prev.bodyScanHistory || [])]
      }));

      // 3. 更新数据库中的 last_body_scan_date
      if (profile.authIdentifier) {
        try {
          await updateProfile(profile.authIdentifier, {
            last_body_scan_date: scanRecord.timestamp
          });
        } catch (err) {
          console.error('Failed to update body scan date:', err);
        }
      }
    } catch (err: any) {
      console.error('Body scan failed:', err);
      alert(err?.message || "Biometric analysis failed.");
    } finally {
      setIsScanning(false);
    }
  };

  const applySuggestedGoals = () => {
    if (!analysisResult) return;
    setFormData(prev => ({
      ...prev,
      calories: analysisResult.calories,
      protein: analysisResult.protein,
      carbs: analysisResult.carbs,
      fats: analysisResult.fats
    }));
    setAnalysisResult(null);
    alert("Neural goals synchronized.");
  };

  const handleRedeemInvitationCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitationCode.trim() || !profile.authIdentifier) return;
    setIsRedeemingCode(true);
    try {
      await redeemInvitationCode(profile.authIdentifier, invitationCode);
      setProfile(prev => ({ ...prev, isPremium: true }));
      setInvitationCode('');
      alert('邀請碼兌換成功！您已解鎖所有功能。');
    } catch (err: any) {
      alert(err?.message || '兌換失敗，請檢查邀請碼是否正確。');
    } finally {
      setIsRedeemingCode(false);
    }
  };

  // 如果 profile 不存在，显示加载状态
  if (!profile) {
    return (
      <div className="relative space-y-8 pt-20 min-h-screen bg-[#0a0a0a]">
        <div className="flex items-center justify-center py-20">
          <p className="text-zinc-600 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  try {
    return (
      <div className="relative space-y-8 pt-20 min-h-screen bg-[#0a0a0a]">
      <style>{`
        @keyframes scanner { 0% { top: 0; } 50% { top: 100%; } 100% { top: 0; } }
        .scan-line { position: absolute; left: 0; right: 0; height: 2px; background: #10b981; box-shadow: 0 0 15px #10b981; z-index: 10; animation: scanner 2s linear infinite; }
      `}</style>

      {/* Background Icon Decoration */}
      <div className="absolute top-0 right-0 opacity-[0.03] text-white pointer-events-none transform translate-x-1/4 -translate-y-1/4">
        <User size={320} />
      </div>

      <header className="relative z-10 border-b border-white/5 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <p className="text-[8px] font-black lowercase tracking-[0.3em] text-zinc-600 uppercase">{t.profile.sector_identity}</p>
          <h1 className="text-3xl font-black tracking-tighter text-white lowercase leading-none">{t.profile.title}</h1>
        </div>
        {(profile.isPremium || profile.isFounder) && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full shadow-lg shadow-emerald-500/5">
            <Zap size={12} className="text-emerald-500" fill="currentColor" />
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">{t.profile.elite_active}</span>
          </div>
        )}
      </header>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#111] border border-white/10 p-6 rounded-2xl flex flex-col items-center relative overflow-hidden group shadow-xl">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-2 border-white/5 p-1 bg-zinc-950 overflow-hidden shadow-2xl">
                <img src={formData.avatar} className="w-full h-full rounded-full object-cover" />
              </div>
              <button onClick={() => avatarFileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-white text-black p-2 rounded-full border-2 border-[#111] hover:scale-110 hover:bg-emerald-500 transition-all active:scale-90 shadow-xl">
                <Camera size={14} strokeWidth={3} />
              </button>
              <input type="file" ref={avatarFileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
            </div>
            <h2 className="mt-4 text-xl font-black lowercase text-white leading-none">{profile.name}</h2>
            <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest mt-1">ID: {profile.authIdentifier || 'guest'}</p>
          </div>

          <div className="bg-[#111] border border-white/10 p-6 rounded-2xl space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-zinc-500 mb-1">
              <Users size={14} />
              <h3 className="text-[8px] font-black lowercase tracking-widest uppercase">Accountability Network</h3>
            </div>
            <p className="text-[9px] font-medium text-zinc-600 leading-relaxed">
              交換上方的 ID，互相加為好友。當其中一人 reset 或發出求救訊號時，好友會收到通知。
            </p>
            <form onSubmit={handleSendFriendRequest} className="space-y-2">
              <input
                type="text"
                value={friendIdInput}
                onChange={(e) => setFriendIdInput(e.target.value.trim())}
                placeholder="輸入好友的 ID"
                className="w-full bg-black border border-white/10 rounded-xl py-2.5 px-3 text-[11px] font-black text-white placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500/50"
                disabled={friendsLoading || !profile.authIdentifier}
              />
              {friendError && (
                <p className="text-[9px] text-red-500 font-medium">{friendError}</p>
              )}
              <button
                type="submit"
                disabled={friendsLoading || !friendIdInput.trim() || !profile.authIdentifier}
                className="w-full py-2.5 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {friendsLoading ? 'Sending...' : 'Send Friend Request'}
              </button>
            </form>

            <div className="pt-3 border-t border-white/5 space-y-2 max-h-40 overflow-y-auto">
              <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Pending</p>
              {friendRelationships.filter(r => r.status === 'pending' && r.friend_id === profile.authIdentifier).length === 0 &&
               friendRelationships.filter(r => r.status === 'pending' && r.user_id === profile.authIdentifier).length === 0 && (
                <p className="text-[9px] text-zinc-700 italic">no pending requests</p>
              )}
              {friendRelationships.filter(r => r.status === 'pending' && r.friend_id === profile.authIdentifier).map(r => (
                <div key={r.id} className="flex items-center justify-between text-[9px] text-zinc-300">
                  <span>邀請自：{r.user_id}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleRespondFriend(r.id, true)}
                      className="p-1 rounded-full bg-emerald-500 text-black"
                    >
                      <Check size={10} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRespondFriend(r.id, false)}
                      className="p-1 rounded-full bg-red-500 text-black"
                    >
                      <XIcon size={10} />
                    </button>
                  </div>
                </div>
              ))}
              {friendRelationships.filter(r => r.status === 'pending' && r.user_id === profile.authIdentifier).map(r => (
                <div key={r.id} className="flex items-center justify-between text-[9px] text-zinc-500">
                  <span>已送出：{r.friend_id}</span>
                  <span className="text-[8px] uppercase">waiting</span>
                </div>
              ))}

              <p className="pt-2 text-[8px] font-black text-zinc-600 uppercase tracking-widest">Friends</p>
              {friendRelationships.filter(r => r.status === 'accepted').length === 0 && (
                <p className="text-[9px] text-zinc-700 italic">no friends linked yet</p>
              )}
              {friendRelationships.filter(r => r.status === 'accepted').map(r => {
                const otherId = r.user_id === profile.authIdentifier ? r.friend_id : r.user_id;
                return (
                  <div key={r.id} className="flex items-center justify-between text-[9px] text-zinc-300">
                    <span>{otherId}</span>
                    <span className="text-[7px] text-emerald-500 uppercase tracking-widest">linked</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[#111] border border-white/10 p-6 rounded-2xl space-y-4 shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-2 text-zinc-500 mb-2">
              <Activity size={14} />
              <h3 className="text-[8px] font-black lowercase tracking-widest uppercase">Biometric Scan</h3>
            </div>
            
            {isScanning ? (
              <div className="py-12 flex flex-col items-center gap-4">
                <div className="relative w-20 h-28 bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                  <div className="scan-line" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-20"><User size={40} className="text-emerald-500" /></div>
                </div>
                <p className="text-[9px] font-black text-emerald-500 animate-pulse uppercase tracking-widest">Processing Bio-Data...</p>
              </div>
            ) : analysisResult ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                  <p className="text-[10px] font-medium text-zinc-300 leading-relaxed italic mb-4">"{analysisResult.analysis}"</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">Kcal Suggestion</p>
                      <p className="text-xl font-black text-white">{analysisResult.calories}</p>
                    </div>
                    <div>
                      <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">Protein Goal</p>
                      <p className="text-xl font-black text-white">{analysisResult.protein}g</p>
                    </div>
                  </div>
                </div>
                <button onClick={applySuggestedGoals} className="w-full bg-emerald-500 text-black py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white transition-all shadow-lg">
                  <RefreshCw size={14} /> Sync Suggested Goals
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {!(profile.isPremium || profile.isFounder) ? (
                  <div className="py-6 border-2 border-dashed rounded-xl bg-white/5 border-white/10 text-center">
                    <Lock size={24} className="mx-auto text-zinc-600 mb-2" />
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Premium Feature</p>
                    <p className="text-[7px] font-medium text-zinc-700 mt-1">Upgrade to unlock body scan</p>
                  </div>
                ) : !bodyScanAllowed ? (
                  <div className="py-6 border-2 border-dashed rounded-xl bg-white/5 border-white/10 text-center">
                    <Clock size={24} className="mx-auto text-orange-500 mb-2" />
                    <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest">Weekly Limit</p>
                    <p className="text-[7px] font-medium text-zinc-600 mt-1 px-2">{bodyScanMessage || '一周内只能进行一次身体扫描'}</p>
                  </div>
                ) : (
                  <button onClick={() => bodyFileInputRef.current?.click()} className="w-full group flex items-center justify-center gap-3 py-6 border-2 border-dashed rounded-xl bg-white/5 border-white/10 text-white hover:border-emerald-500/30 transition-all active:scale-[0.98]">
                    <Scan size={24} className="group-hover:text-emerald-500 transition-colors" />
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-widest">Physique Scan</p>
                      <p className="text-[7px] font-black text-emerald-500 uppercase tracking-tighter mt-0.5">Initialize Bio-Capture</p>
                    </div>
                  </button>
                )}
                <input type="file" ref={bodyFileInputRef} onChange={handleBodyScan} accept="image/*" className="hidden" />
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <form onSubmit={handleSubmit} className="bg-[#111] border border-white/10 p-6 rounded-2xl space-y-6 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 flex-1">
                <label className="text-[8px] font-black lowercase tracking-widest text-zinc-600 uppercase ml-1">{t.profile.codename}</label>
                <div className="relative flex items-center group">
                  <User className="absolute left-4 text-zinc-800 group-focus-within:text-white transition-colors" size={14} />
                  <input type="text" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value.toLowerCase() }))} className={`${inputFieldClass} pl-10`} />
                </div>
              </div>
              <div className="space-y-1.5 flex-1">
                <label className="text-[8px] font-black lowercase tracking-widest text-zinc-600 uppercase ml-1">{t.profile.motto}</label>
                <div className="relative flex items-center group">
                  <Edit2 className="absolute left-4 text-zinc-800 group-focus-within:text-white transition-colors" size={14} />
                  <input type="text" value={formData.bio} onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value.toLowerCase() }))} className={`${inputFieldClass} pl-10`} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5 flex-1">
                <label className="text-[8px] font-black lowercase tracking-widest text-zinc-600 uppercase ml-1">kg</label>
                <div className="relative flex items-center group">
                  <Weight className="absolute left-4 text-zinc-800 group-focus-within:text-white transition-colors" size={14} />
                  <input type="number" value={formData.weight} onChange={(e) => setFormData(prev => ({ ...prev, weight: Number(e.target.value) || 0 }))} className={`${inputFieldClass} pl-10`} />
                </div>
              </div>
              <div className="space-y-1.5 flex-1">
                <label className="text-[8px] font-black lowercase tracking-widest text-zinc-600 uppercase ml-1">cm</label>
                <div className="relative flex items-center group">
                  <Ruler className="absolute left-4 text-zinc-800 group-focus-within:text-white transition-colors" size={14} />
                  <input type="number" value={formData.height} onChange={(e) => setFormData(prev => ({ ...prev, height: Number(e.target.value) || 0 }))} className={`${inputFieldClass} pl-10`} />
                </div>
              </div>
              <div className="space-y-1.5 flex-1">
                <label className="text-[8px] font-black lowercase tracking-widest text-zinc-600 uppercase ml-1">kcal</label>
                <div className="relative flex items-center group">
                  <input type="number" value={formData.calories} onChange={(e) => setFormData(prev => ({ ...prev, calories: Number(e.target.value) || 0 }))} className={`${inputFieldClass} px-4`} />
                </div>
              </div>
              <div className="space-y-1.5 flex-1">
                <label className="text-[8px] font-black lowercase tracking-widest text-zinc-600 uppercase ml-1">pro</label>
                <div className="relative flex items-center group">
                  <input type="number" value={formData.protein} onChange={(e) => setFormData(prev => ({ ...prev, protein: Number(e.target.value) || 0 }))} className={`${inputFieldClass} px-4`} />
                </div>
              </div>
            </div>
            <button type="submit" className="w-full bg-white text-black py-4 rounded-xl text-[11px] font-black lowercase tracking-widest hover:bg-emerald-500 transition-all shadow-xl">{t.profile.sync_data}</button>
          </form>

          <div className="bg-[#111] border border-white/10 p-6 rounded-2xl space-y-4 shadow-xl">
             <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-zinc-500"><History size={14} /><h3 className="text-[8px] font-black lowercase tracking-widest uppercase">Progression History</h3></div>
                <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">{profile.bodyScanHistory?.length || 0} Records</span>
             </div>
             <div className="space-y-3">
                {(!profile.bodyScanHistory || profile.bodyScanHistory.length === 0) ? (
                  <div className="py-12 border border-white/5 border-dashed rounded-2xl text-center"><p className="text-[9px] font-black text-zinc-800 lowercase italic">no scan data archived</p></div>
                ) : (
                  profile.bodyScanHistory.map((scan, idx) => {
                    const prevScan = profile.bodyScanHistory[idx + 1];
                    const weightDiff = prevScan ? scan.weight - prevScan.weight : 0;
                    return (
                      <div key={scan.id} className="bg-black/40 border border-white/5 p-4 rounded-xl flex items-center justify-between group hover:border-white/10 transition-all">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-lg bg-white/5 flex flex-col items-center justify-center shrink-0">
                              <span className="text-[8px] font-black text-zinc-500 uppercase leading-none">{new Date(scan.timestamp).toLocaleDateString(undefined, {month: 'short'})}</span>
                              <span className="text-[12px] font-black text-white leading-none mt-1">{new Date(scan.timestamp).getDate()}</span>
                           </div>
                           <div>
                              <div className="flex items-center gap-2">
                                <p className="text-[12px] font-black text-white lowercase">{scan.weight}kg</p>
                                {weightDiff !== 0 && (<div className={`flex items-center gap-0.5 text-[8px] font-black ${weightDiff > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{weightDiff > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}{Math.abs(weightDiff).toFixed(1)}kg</div>)}
                              </div>
                              <p className="text-[8px] font-medium text-zinc-600 truncate max-w-[150px] mt-0.5 italic">"{scan.analysis.substring(0, 40)}..."</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-6 text-right">
                           <div><p className="text-[10px] font-black text-white">{scan.calories}</p><p className="text-[7px] font-black text-zinc-700 uppercase">kcal</p></div>
                           <div><p className="text-[10px] font-black text-white">{scan.protein}g</p><p className="text-[7px] font-black text-zinc-700 uppercase">pro</p></div>
                        </div>
                      </div>
                    );
                  })
                )}
             </div>
          </div>

          {/* Invitation Code - 拉到最下方，給特殊邀請的人免費使用所有功能 */}
          {!profile.isPremium && !profile.isFounder && (
            <div className="bg-[#111] border border-white/10 p-6 rounded-2xl space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-zinc-500">
                <Gift size={14} />
                <h3 className="text-[8px] font-black lowercase tracking-widest uppercase">Invitation Code</h3>
              </div>
              <p className="text-[9px] font-medium text-zinc-600 leading-relaxed">
                若有收到邀請碼，輸入後即可免費解鎖所有功能（含 AI 分析、SOS 等）。
              </p>
              <form onSubmit={handleRedeemInvitationCode} className="flex gap-3">
                <input
                  type="text"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                  placeholder="invitation code"
                  className="flex-1 bg-black border border-white/10 rounded-xl py-3 px-4 text-[11px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-emerald-500/50 placeholder:text-zinc-700"
                  disabled={isRedeemingCode}
                />
                <button
                  type="submit"
                  disabled={isRedeemingCode || !invitationCode.trim()}
                  className="px-6 py-3 bg-emerald-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isRedeemingCode ? 'Redeeming...' : 'Redeem'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
    );
  } catch (error: any) {
    console.error('Profile component error:', error);
    return (
      <div className="relative space-y-8 pt-20 min-h-screen bg-[#0a0a0a]">
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-red-500 text-sm mb-4">Error loading profile</p>
          <p className="text-zinc-600 text-xs">{error?.message || 'Unknown error'}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-white text-black rounded-lg text-sm font-bold"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
};

export default Profile;
