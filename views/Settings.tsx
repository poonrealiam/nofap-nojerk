
import React, { useState, useRef, useEffect } from 'react';
import { Globe, Clock, ShieldCheck, EyeOff, Power, Bell, Smartphone, Mail, Apple, Trash2, ShieldAlert, Terminal, Rocket, ChevronRight, Check, Link as LinkIcon, MessageSquareWarning, Star, X } from 'lucide-react';
import { UserProfile, View } from '../types';
import { translations } from '../translations';
import { submitReport } from '../services/databaseService';
import { supabase } from '../supabaseClient';

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function ScrollDatePicker({
  value,
  onChange,
  label,
}: {
  value: string | null;
  onChange: (iso: string) => void;
  label: string;
}) {
  const baseDate = value ? new Date(value) : new Date();
  const [year, setYear] = useState(baseDate.getFullYear());
  const [month, setMonth] = useState(baseDate.getMonth() + 1);
  const [day, setDay] = useState(Math.min(baseDate.getDate(), getDaysInMonth(baseDate.getFullYear(), baseDate.getMonth() + 1)));
  const yearRef = useRef<HTMLDivElement>(null);
  const monthRef = useRef<HTMLDivElement>(null);
  const dayRef = useRef<HTMLDivElement>(null);

  const years = Array.from({ length: 25 }, (_, i) => new Date().getFullYear() - 15 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const monthNames = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  const daysCount = getDaysInMonth(year, month);
  const days = Array.from({ length: daysCount }, (_, i) => i + 1);

  useEffect(() => {
    const d = value ? new Date(value) : new Date();
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
    const maxDay = getDaysInMonth(d.getFullYear(), d.getMonth() + 1);
    setDay(Math.min(d.getDate(), maxDay));
  }, [value]);

  useEffect(() => {
    const maxDay = getDaysInMonth(year, month);
    if (day > maxDay) setDay(maxDay);
  }, [year, month]);

  const scrollToIndex = (ref: React.RefObject<HTMLDivElement | null>, index: number) => {
    if (!ref.current) return;
    const target = index * ITEM_HEIGHT;
    ref.current.scrollTo({ top: target, behavior: 'auto' });
  };

  useEffect(() => {
    const yi = years.indexOf(year);
    const mi = months.indexOf(month);
    const di = days.indexOf(day);
    if (yi >= 0) scrollToIndex(yearRef, yi);
    if (mi >= 0) scrollToIndex(monthRef, mi);
    if (di >= 0) scrollToIndex(dayRef, di);
  }, [year, month, day, years.length, months.length, days.length]);

  const emit = (y: number, m: number, d: number) => {
    const date = new Date(y, m - 1, d, 0, 0, 0, 0);
    onChange(date.toISOString());
  };

  return (
    <div className="space-y-2">
      <label className="text-[8px] font-black lowercase tracking-widest text-zinc-600 uppercase ml-1">{label}</label>
      <div className="relative flex items-stretch gap-1 bg-black border border-white/10 rounded-xl overflow-hidden shadow-inner">
        {/* Center highlight band */}
        <div className="absolute left-0 right-0 h-[40px] border-y border-white/20 pointer-events-none z-10" style={{ top: (PICKER_HEIGHT - ITEM_HEIGHT) / 2 }} />
        {/* Fade overlay: top and bottom dimmed so center row stands out */}
        <div className="absolute inset-0 pointer-events-none z-[1] opacity-80" style={{ background: 'linear-gradient(to bottom, #0a0a0a 0%, transparent 35%, transparent 65%, #0a0a0a 100%)' }} />
        <div
          ref={yearRef}
          className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth shrink-0"
          style={{ height: PICKER_HEIGHT, scrollSnapType: 'y mandatory' }}
          onScroll={() => {
            const yi = yearRef.current ? Math.round(yearRef.current.scrollTop / ITEM_HEIGHT) : 0;
            const y = years[Math.max(0, Math.min(yi, years.length - 1))];
            setYear(y);
            const maxD = getDaysInMonth(y, month);
            const d = Math.min(day, maxD);
            if (d !== day) setDay(d);
            emit(y, month, d);
          }}
        >
          <div style={{ height: ITEM_HEIGHT * (VISIBLE_ITEMS - 1) / 2, minHeight: ITEM_HEIGHT }} />
          {years.map((y) => (
            <div
              key={y}
              className="flex items-center justify-center text-[11px] font-black text-white"
              style={{ height: ITEM_HEIGHT, scrollSnapAlign: 'center' }}
            >
              {y}
            </div>
          ))}
          <div style={{ height: ITEM_HEIGHT * (VISIBLE_ITEMS - 1) / 2, minHeight: ITEM_HEIGHT }} />
        </div>
        <div
          ref={monthRef}
          className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth shrink-0"
          style={{ height: PICKER_HEIGHT, scrollSnapType: 'y mandatory' }}
          onScroll={() => {
            const mi = monthRef.current ? Math.round(monthRef.current.scrollTop / ITEM_HEIGHT) : 0;
            const m = months[Math.max(0, Math.min(mi, months.length - 1))];
            setMonth(m);
            const maxD = getDaysInMonth(year, m);
            const d = Math.min(day, maxD);
            if (d !== day) setDay(d);
            emit(year, m, d);
          }}
        >
          <div style={{ height: ITEM_HEIGHT * (VISIBLE_ITEMS - 1) / 2, minHeight: ITEM_HEIGHT }} />
          {monthNames.map((m) => (
            <div
              key={m}
              className="flex items-center justify-center text-[11px] font-black text-white"
              style={{ height: ITEM_HEIGHT, scrollSnapAlign: 'center' }}
            >
              {String(m).padStart(2, '0')}
            </div>
          ))}
          <div style={{ height: ITEM_HEIGHT * (VISIBLE_ITEMS - 1) / 2, minHeight: ITEM_HEIGHT }} />
        </div>
        <div
          ref={dayRef}
          className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth shrink-0"
          style={{ height: PICKER_HEIGHT, scrollSnapType: 'y mandatory' }}
          onScroll={() => {
            const di = dayRef.current ? Math.round(dayRef.current.scrollTop / ITEM_HEIGHT) : 0;
            const d = days[Math.max(0, Math.min(di, days.length - 1))];
            setDay(d);
            emit(year, month, d);
          }}
        >
          <div style={{ height: ITEM_HEIGHT * (VISIBLE_ITEMS - 1) / 2, minHeight: ITEM_HEIGHT }} />
          {days.map((d) => (
            <div
              key={d}
              className="flex items-center justify-center text-[11px] font-black text-white"
              style={{ height: ITEM_HEIGHT, scrollSnapAlign: 'center' }}
            >
              {String(d).padStart(2, '0')}
            </div>
          ))}
          <div style={{ height: ITEM_HEIGHT * (VISIBLE_ITEMS - 1) / 2, minHeight: ITEM_HEIGHT }} />
        </div>
      </div>
      <div className="flex justify-center gap-4 text-[8px] font-black text-zinc-600 uppercase tracking-widest">
        <span>Year</span>
        <span>Month</span>
        <span>Day</span>
      </div>
    </div>
  );
}

interface SettingsProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  handleReset: () => void;
}

const Settings: React.FC<SettingsProps> = ({ profile, setProfile, handleReset }) => {
  const t = translations[profile.language || 'en'];
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const [reportSubject, setReportSubject] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const InputField = ({ label, icon: Icon, ...props }: any) => (
    <div className="space-y-1.5 flex-1">
      <label className="text-[8px] font-black lowercase tracking-widest text-zinc-600 uppercase ml-1">{label}</label>
      <div className="relative flex items-center group">
        {Icon && <Icon className="absolute left-4 text-zinc-800 group-focus-within:text-white transition-colors" size={14} />}
        <input {...props} className={`w-full bg-black border border-white/10 rounded-xl py-3 ${Icon ? 'pl-10' : 'px-4'} pr-4 text-[11px] font-black lowercase text-white focus:outline-none focus:border-white/30 transition-all placeholder:text-zinc-800 shadow-inner`} />
      </div>
    </div>
  );

  const BinarySwitch = ({ label, description, icon: Icon, active, onToggle }: any) => (
    <button onClick={onToggle} className="w-full flex items-center justify-between p-4 bg-[#111] border border-white/5 rounded-2xl group hover:border-white/10 hover:bg-white/[0.03] transition-all text-left active:scale-[0.98] shadow-lg">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg transition-all ${active ? 'bg-white text-black shadow-lg shadow-white/5' : 'bg-black text-zinc-800 border border-white/5'}`}>
          <Icon size={16} />
        </div>
        <div>
          <p className="text-[11px] font-black lowercase text-white leading-none">{label}</p>
          <p className="text-[8px] font-medium lowercase text-zinc-600 mt-1">{description}</p>
        </div>
      </div>
      <div className={`relative w-8 h-4 rounded-full border transition-all ${active ? 'bg-emerald-500 border-emerald-500/50' : 'bg-black border-zinc-800'}`}>
        <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all ${active ? 'left-[16px] bg-black shadow-sm' : 'left-0.5 bg-zinc-800'}`} />
      </div>
    </button>
  );

  const ActionRow = ({ label, description, icon: Icon, onClick, colorClass = "bg-black text-zinc-800 border border-white/5" }: any) => (
    <button onClick={onClick} className="w-full flex items-center justify-between p-4 bg-[#111] border border-white/5 rounded-2xl group hover:border-white/10 hover:bg-white/[0.03] transition-all text-left active:scale-[0.98] shadow-lg">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg transition-all group-hover:bg-white group-hover:text-black ${colorClass}`}>
          <Icon size={16} />
        </div>
        <div>
          <p className="text-[11px] font-black lowercase text-white leading-none">{label}</p>
          <p className="text-[8px] font-medium lowercase text-zinc-600 mt-1">{description}</p>
        </div>
      </div>
      <ChevronRight size={14} className="text-zinc-800 group-hover:text-white transition-colors" />
    </button>
  );

  const LinkRow = ({ label, icon: Icon, status }: { label: string, icon: any, status: string }) => (
    <div className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-xl group hover:border-white/10 transition-all">
      <div className="flex items-center gap-3">
        <Icon size={16} className="text-zinc-600 group-hover:text-white" />
        <span className="text-[11px] font-black text-zinc-300">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-[8px] font-black uppercase tracking-widest ${status === 'linked' ? 'text-emerald-500' : 'text-zinc-700'}`}>{status === 'linked' ? t.settings.linked : t.settings.unlinked}</span>
        {status === 'linked' ? <Check size={12} className="text-emerald-500" /> : <LinkIcon size={12} className="text-zinc-800" />}
      </div>
    </div>
  );

  const handleSubmitReport = async () => {
    const msg = reportMessage.trim();
    if (!msg) return;
    setReportSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert(profile.language === 'zh' ? '請先登入' : 'Please sign in first.');
        setReportSubmitting(false);
        return;
      }
      await submitReport(user.id, msg, reportSubject.trim() || undefined);
      setShowReportModal(false);
      setReportMessage('');
      setReportSubject('');
      alert(t.settings.report_sent);
    } catch (e: any) {
      console.error('Report submit error:', e);
      const errMsg = String(e?.message ?? '');
      const code = e?.code ?? '';
      const isTableMissing = code === '42P01' || /does not exist|relation "reports"/i.test(errMsg);
      const isRls = /row-level security|policy|violates/i.test(errMsg);
      let show = isTableMissing
        ? t.settings.report_failed_setup
        : isRls
          ? (profile.language === 'zh' ? '權限被拒絕，請確認已登入且 Supabase 已執行 reports_migration.sql' : 'Permission denied. Ensure you\'re logged in and reports migration was run.')
          : t.settings.report_failed;
      if (errMsg && !isTableMissing) show += '\n' + errMsg.slice(0, 120);
      alert(show);
    } finally {
      setReportSubmitting(false);
    }
  };

  return (
    <div className="relative space-y-8 pt-20">
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => !reportSubmitting && setShowReportModal(false)}>
          <div className="w-full max-w-md bg-[#111] border border-white/10 rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black lowercase tracking-widest text-zinc-400 uppercase">{t.settings.report_problem}</h3>
              <button type="button" onClick={() => !reportSubmitting && setShowReportModal(false)} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-all">
                <X size={18} />
              </button>
            </div>
            <input
              type="text"
              value={reportSubject}
              onChange={e => setReportSubject(e.target.value)}
              placeholder={t.settings.report_subject_placeholder}
              className="w-full bg-black border border-white/10 rounded-xl py-2.5 px-4 text-[11px] font-medium text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
            />
            <textarea
              value={reportMessage}
              onChange={e => setReportMessage(e.target.value)}
              placeholder={t.settings.report_placeholder}
              rows={4}
              className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-[11px] font-medium text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 resize-none"
            />
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => !reportSubmitting && setShowReportModal(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:border-white/20 transition-all">
                {t.settings.report_cancel}
              </button>
              <button type="button" onClick={handleSubmitReport} disabled={reportSubmitting || !reportMessage.trim()} className="flex-1 py-2.5 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {reportSubmitting ? '…' : t.settings.report_submit}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="absolute top-0 right-0 opacity-[0.03] text-white pointer-events-none transform translate-x-1/4 -translate-y-1/4">
        <Terminal size={320} />
      </div>

      <header className="relative z-10 border-b border-white/5 pb-6">
        <p className="text-[8px] font-black lowercase tracking-[0.3em] text-zinc-600 uppercase">{t.settings.sector}</p>
        <h1 className="text-3xl font-black tracking-tighter text-white lowercase leading-none">{t.settings.title}</h1>
      </header>

      <div className="relative z-10 space-y-6">
        {/* Language Selection */}
        <section className="bg-[#111] border border-white/10 p-6 rounded-3xl space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <Globe size={14} />
            <h3 className="text-[8px] font-black lowercase tracking-widest uppercase">{t.settings.log_protocol}</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setProfile(p => ({...p, language: 'en'}))}
              className={`py-4 rounded-xl border transition-all text-[11px] font-black uppercase tracking-widest active:scale-[0.98] ${profile.language === 'en' ? 'bg-white text-black border-white shadow-xl shadow-white/5' : 'bg-black text-zinc-600 border-white/5 hover:text-white'}`}
            >
              {t.settings.en}
            </button>
            <button 
              onClick={() => setProfile(p => ({...p, language: 'zh'}))}
              className={`py-4 rounded-xl border transition-all text-[11px] font-black uppercase tracking-widest active:scale-[0.98] ${profile.language === 'zh' ? 'bg-white text-black border-white shadow-xl shadow-white/5' : 'bg-black text-zinc-600 border-white/5 hover:text-white'}`}
            >
              {t.settings.zh}
            </button>
          </div>
        </section>

        {/* Journey Calibration - scroll picker */}
        <section className="bg-[#111] border border-white/10 p-6 rounded-3xl space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <Rocket size={14} />
            <h3 className="text-[8px] font-black lowercase tracking-widest uppercase">{t.settings.journey_config}</h3>
          </div>
          <ScrollDatePicker
            label={t.settings.init_date}
            value={profile.journeyStartDate}
            onChange={(iso) => setProfile(p => ({ ...p, journeyStartDate: iso }))}
          />
        </section>

        {/* Neural Security */}
        <section className="bg-[#111] border border-white/10 p-6 rounded-3xl space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <ShieldCheck size={14} />
            <h3 className="text-[8px] font-black lowercase tracking-widest uppercase">{t.settings.privacy}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <BinarySwitch label={t.profile.stealth} description="Hide identity" icon={EyeOff} active={profile.preferences.stealthMode} onToggle={() => setProfile(p => ({...p, preferences: {...p.preferences, stealthMode: !p.preferences.stealthMode}}))} />
            <BinarySwitch label={t.profile.streak_vis} description="Show streak" icon={Power} active={profile.preferences.showStreakOnPlaza} onToggle={() => setProfile(p => ({...p, preferences: {...p.preferences, showStreakOnPlaza: !p.preferences.showStreakOnPlaza}}))} />
            <BinarySwitch label={t.profile.neural_alerts} description="Neural pings" icon={Bell} active={profile.preferences.notificationsEnabled} onToggle={() => setProfile(p => ({...p, preferences: {...p.preferences, notificationsEnabled: !p.preferences.notificationsEnabled}}))} />
          </div>
        </section>

        {/* Feedback & Intelligence */}
        <section className="bg-[#111] border border-white/10 p-6 rounded-3xl space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <MessageSquareWarning size={14} />
            <h3 className="text-[8px] font-black lowercase tracking-widest uppercase">{t.settings.feedback_sector}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ActionRow 
              label={t.settings.report_problem} 
              description={t.settings.report_desc} 
              icon={MessageSquareWarning} 
              onClick={() => setShowReportModal(true)} 
            />
            <ActionRow 
              label={t.settings.rate_app} 
              description={t.settings.rate_desc} 
              icon={Star} 
              onClick={() => alert("Transmission received. Thank you for broadcasting your support to the network.")} 
            />
          </div>
        </section>

        {/* Account Link Profile */}
        <section className="bg-[#111] border border-white/10 p-6 rounded-3xl space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <LinkIcon size={14} />
            <h3 className="text-[8px] font-black lowercase tracking-widest uppercase">{t.settings.account_link}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <LinkRow label={t.settings.apple} icon={Apple} status={profile.appleLinkedEmail ? 'linked' : 'unlinked'} />
            <LinkRow label={t.settings.google} icon={Globe} status={profile.googleLinkedEmail ? 'linked' : 'unlinked'} />
            <LinkRow label={t.settings.phone} icon={Smartphone} status={profile.linkedPhone ? 'linked' : 'unlinked'} />
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-red-500/5 border border-red-500/10 p-6 rounded-3xl space-y-4 shadow-2xl">
          <div className="flex items-center gap-2 text-red-500 mb-2">
            <ShieldAlert size={14} />
            <h3 className="text-[8px] font-black lowercase tracking-widest uppercase">{t.settings.danger_zone}</h3>
          </div>
          <button 
            onClick={handleReset} 
            className="w-full py-4 bg-red-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all active:scale-[0.98] shadow-xl shadow-red-500/10 flex items-center justify-center gap-2"
          >
            <Trash2 size={14} /> {t.settings.wipe}
          </button>
        </section>
      </div>
    </div>
  );
};

export default Settings;
