
import React, { useState } from 'react';
import { Shield, HeartPulse, AlertTriangle } from 'lucide-react';
import { UserProfile, View } from '../types';
import { notifyFriendsWarning, getFriendRelationships } from '../services/databaseService';

interface FirstAidProps {
  profile: UserProfile;
  setActiveView: (view: View) => void;
}

const FirstAid: React.FC<FirstAidProps> = ({ profile, setActiveView }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handlePanic = async () => {
    if (!profile.authIdentifier) {
      alert('請先登入才能通知好友。');
      return;
    }
    setSending(true);
    try {
      const rows = await getFriendRelationships(profile.authIdentifier);
      const accepted = rows
        .filter(r => r.status === 'accepted')
        .map(r => (r.user_id === profile.authIdentifier ? r.friend_id : r.user_id));
      if (!accepted.length) {
        alert('目前尚未連結任何好友。請先在 Profile 頁面互加好友。');
        return;
      }
      await notifyFriendsWarning(profile.authIdentifier, accepted, message.trim() || 'I am struggling and about to reset.');
      setMessage('');
      alert('已向好友發出求救訊號。');
      setActiveView(View.DASHBOARD);
    } catch (err) {
      console.error('Failed to send panic signal', err);
      alert('發送失敗，請稍後再試。');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative space-y-8 pb-24 pt-20 min-h-screen">
      {/* Background Icon Decoration */}
      <div className="absolute top-0 right-0 opacity-[0.03] text-white pointer-events-none transform translate-x-1/4 -translate-y-1/4">
        <HeartPulse size={320} />
      </div>

      {/* Sector Header */}
      <header className="relative z-10 flex flex-col md:flex-row md:items-end justify-between border-b border-white/5 pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield size={12} className="text-emerald-500" />
            <p className="text-[9px] font-black lowercase tracking-[0.3em] text-emerald-500">sector 07: tactical response</p>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white lowercase leading-none">first-aid station</h1>
        </div>
      </header>

      <div className="relative z-10 flex flex-col items-center justify-center py-16 md:py-24">
        <div className="bg-[#111] border border-white/10 rounded-3xl p-8 md:p-10 max-w-xl mx-4 space-y-6 shadow-2xl">
          <div className="flex items-center gap-3 text-emerald-500">
            <HeartPulse size={28} />
            <h2 className="text-xl md:text-2xl font-black lowercase tracking-tight text-white">
              emergency broadcast
            </h2>
          </div>
          <p className="text-[11px] md:text-sm font-medium text-zinc-500 lowercase leading-relaxed">
            當你忍不住想 reset 的時候，可以在這裡發送一則求救訊號給你的好友網路，提醒他們你現在需要幫助。
          </p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="寫一句給好友們的話，例如：我快守不住了，拜託提醒我初衷。"
            className="w-full bg-black border border-white/10 rounded-2xl p-4 text-[11px] md:text-sm text-white font-medium placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500/50 min-h-[120px]"
          />
          <button
            type="button"
            onClick={handlePanic}
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500 text-black text-[11px] md:text-[10px] font-black uppercase tracking-widest hover:bg-red-400 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-500/20"
          >
            <AlertTriangle size={16} />
            {sending ? 'Transmitting...' : 'Send Distress Signal'}
          </button>
          <p className="text-[9px] text-zinc-600 mt-1">
            註：只有已互相加好友的人會收到這則通知。
          </p>
        </div>
      </div>
    </div>
  );
};

export default FirstAid;
