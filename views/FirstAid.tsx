
import React from 'react';
import { Shield, HeartPulse } from 'lucide-react';
import { UserProfile, View } from '../types';

interface FirstAidProps {
  profile: UserProfile;
  setActiveView: (view: View) => void;
}

const FirstAid: React.FC<FirstAidProps> = () => {
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

      {/* Coming Soon */}
      <div className="relative z-10 flex flex-col items-center justify-center py-24 md:py-32">
        <div className="bg-[#111] border border-white/10 rounded-3xl p-12 md:p-16 max-w-lg mx-4 text-center shadow-2xl">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <HeartPulse size={40} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white lowercase tracking-tight mb-3">
            coming soon
          </h2>
          <p className="text-sm font-medium text-zinc-500 lowercase leading-relaxed">
            SOS and first-aid features are under construction. Check back later.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FirstAid;
