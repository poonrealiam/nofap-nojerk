
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Info, ShieldCheck } from 'lucide-react';
import { UserProfile } from '../types';

interface CalendarViewProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
}

const CalendarView: React.FC<CalendarViewProps> = ({ profile, setProfile }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const monthNames = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december"
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const toggleDay = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    clickedDate.setHours(0, 0, 0, 0);

    if (clickedDate > today) return;

    const dateKey = clickedDate.toISOString().split('T')[0];
    setProfile(prev => {
      const newHistory = { ...prev.checkInHistory };
      const currentStatus = newHistory[dateKey];
      
      let nextStatus: 'check' | 'reset' | undefined;
      
      if (!currentStatus) {
        nextStatus = 'check';
      } else if (currentStatus === 'check') {
        nextStatus = 'reset';
      } else {
        nextStatus = undefined;
      }
      
      if (nextStatus) {
        newHistory[dateKey] = nextStatus;
      } else {
        delete newHistory[dateKey];
      }
      
      const relapseCount = Object.values(newHistory).filter(v => v === 'reset').length;
      
      return { 
        ...prev, 
        checkInHistory: newHistory,
        relapseCount
      };
    });
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const calendarCells = [];
    for (let i = 0; i < startDay; i++) {
      calendarCells.push(<div key={`empty-${i}`} className="h-14 md:h-20 bg-transparent"></div>);
    }

    for (let day = 1; day <= days; day++) {
      const cellDate = new Date(year, month, day);
      cellDate.setHours(0, 0, 0, 0);
      const isFuture = cellDate > today;
      const isToday = cellDate.getTime() === today.getTime();
      const dateKey = cellDate.toISOString().split('T')[0];
      const status = profile.checkInHistory[dateKey];
      
      const isChecked = status === 'check';
      const isRelapse = status === 'reset';

      calendarCells.push(
        <button
          key={day}
          disabled={isFuture}
          onClick={() => toggleDay(day)}
          className={`h-14 md:h-20 rounded-xl flex flex-col items-center justify-center transition-all border relative overflow-hidden
            ${isFuture ? 'bg-zinc-900/10 border-zinc-900/50 text-zinc-800 cursor-not-allowed' : ''}
            ${!isFuture && !isChecked && !isRelapse ? 'bg-[#111] border-[#222] hover:border-zinc-500 text-zinc-500' : ''}
            ${isChecked ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' : ''}
            ${isRelapse ? 'bg-red-500/5 border-red-500/20 text-red-500' : ''}
            ${isToday ? 'ring-2 ring-white/10 ring-offset-2 ring-offset-[#0a0a0a]' : ''}
          `}
        >
          <span className={`text-sm md:text-lg font-black ${isChecked ? 'text-emerald-400' : isRelapse ? 'text-red-400' : ''}`}>{day}</span>
          {isChecked && (
            <div className="absolute bottom-2 w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
          )}
          {isRelapse && (
            <div className="absolute bottom-2 w-1.5 h-1.5 rounded-full bg-red-500"></div>
          )}
          {isToday && !isChecked && !isRelapse && (
            <span className="text-[7px] uppercase font-black text-zinc-600 mt-1">today</span>
          )}
        </button>
      );
    }

    return calendarCells;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black lowercase tracking-[0.3em] text-zinc-600 mb-1">sector 01: logistics</p>
          <h1 className="text-4xl font-black lowercase tracking-tight text-white">discipline map</h1>
        </div>
        <div className="flex items-center gap-3 bg-[#111] border border-[#222] p-1.5 rounded-xl">
          <button 
            onClick={handlePrevMonth}
            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-[10px] font-black w-32 text-center uppercase tracking-widest text-zinc-400">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button 
            onClick={handleNextMonth}
            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </header>

      <div className="bg-[#111] border border-[#222] rounded-2xl p-4 md:p-6 shadow-2xl relative">
        <div className="absolute top-4 right-4 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2">
          <ShieldCheck size={12} className="text-emerald-500" />
          <span className="text-[10px] font-black text-white lowercase tracking-wider">season {profile.relapseCount + 1}</span>
        </div>
        <div className="grid grid-cols-7 gap-2 mb-4 pt-10">
          {['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map(day => (
            <div key={day} className="text-center text-[9px] lowercase font-black text-zinc-700 tracking-tighter">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {renderCalendar()}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#111] border border-[#222] p-4 rounded-xl flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-[10px] font-black lowercase text-zinc-600">success (nfnj)</span>
        </div>
        <div className="bg-[#111] border border-[#222] p-4 rounded-xl flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-[10px] font-black lowercase text-zinc-600">reset (relapse)</span>
        </div>
        <div className="bg-[#111] border border-[#222] p-4 rounded-xl flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-zinc-900"></div>
            <span className="text-[10px] font-black lowercase text-zinc-600">missed report</span>
        </div>
        <div className="bg-[#111] border border-[#222] p-4 rounded-xl flex items-center gap-3">
            <div className="w-3 h-3 rounded-full ring-2 ring-white/20"></div>
            <span className="text-[10px] font-black lowercase text-zinc-600">current portal</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
