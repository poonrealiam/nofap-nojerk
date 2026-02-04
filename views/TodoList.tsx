
import React, { useState, useMemo } from 'react';
import { Plus, Trash2, CheckCircle, Circle, ChevronLeft, ChevronRight, Calendar, ClipboardList } from 'lucide-react';
import { Task } from '../types';
import { translations } from '../translations';
import { saveTask, updateTask, deleteTask } from '../services/databaseService';

interface TodoListProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  profile: any;
}

const TodoList: React.FC<TodoListProps> = ({ tasks, setTasks, profile }) => {
  const t = translations[profile.language || 'en'];
  const [newTaskText, setNewTaskText] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date(selectedDate);
      d.setDate(selectedDate.getDate() + i);
      days.push(d);
    }
    return days;
  }, [selectedDate]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim() || !profile.authIdentifier) return;
    
    const now = new Date();
    const taskDate = new Date(selectedDate);
    taskDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      text: newTaskText.toLowerCase(),
      completed: false,
      createdAt: taskDate.toISOString()
    };
    
    try {
      const savedTask = await saveTask(profile.authIdentifier, newTask);
      setTasks(prev => [{ ...newTask, id: savedTask.id }, ...prev]);
      setNewTaskText('');
      if (navigator.vibrate) navigator.vibrate(5);
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const dayTasks = tasks.filter(t => new Date(t.createdAt).toDateString() === selectedDate.toDateString());
  const completedCount = dayTasks.filter(t => t.completed).length;

  return (
    <div className="relative max-w-2xl mx-auto space-y-8 pt-20">
      {/* Background Icon Decoration */}
      <div className="absolute top-0 right-0 opacity-[0.03] text-white pointer-events-none transform translate-x-1/4 -translate-y-1/4">
        <ClipboardList size={320} />
      </div>

      <header className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-6">
        <div>
          <p className="text-[8px] font-black lowercase tracking-[0.3em] text-zinc-600 uppercase">{t.todo.sector}</p>
          <h1 className="text-3xl font-black tracking-tighter text-white lowercase leading-none">{t.todo.title}</h1>
        </div>
        
        <div className="flex flex-col items-end gap-3 w-full md:w-auto">
          <div className="flex items-center justify-between w-full md:w-auto md:gap-4">
             <div className="text-right">
                <p className="text-xl font-black text-white leading-none tracking-tighter">{completedCount} <span className="text-zinc-800 text-sm">/ {dayTasks.length}</span></p>
                <p className="text-[7px] text-zinc-600 font-black lowercase tracking-widest uppercase mt-0.5">secured today</p>
             </div>
             <button 
                onClick={() => setSelectedDate(new Date())} 
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.03] border border-white/10 rounded-full text-[8px] font-black lowercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/10 transition-all active:scale-[0.92]"
              >
                <Calendar size={10} />
                {t.food.back_today}
              </button>
          </div>

          <div className="bg-[#111] border border-white/10 p-1.5 rounded-xl flex items-center justify-between gap-2 w-full md:w-auto shadow-xl">
            <button onClick={() => {const d = new Date(selectedDate); d.setDate(d.getDate()-7); setSelectedDate(d);}} className="p-1.5 text-zinc-600 hover:text-white hover:bg-white/5 rounded-lg transition-all active:scale-[0.8]"><ChevronLeft size={14} /></button>
            <div className="flex-1 flex justify-around overflow-x-auto no-scrollbar gap-1.5 px-1">
              {weekDays.map((date, i) => {
                const active = date.toDateString() === selectedDate.toDateString();
                const isToday = date.toDateString() === new Date().toDateString();
                return (
                  <button key={i} onClick={() => setSelectedDate(date)} className={`flex flex-col items-center min-w-[38px] py-1.5 rounded-lg transition-all active:scale-[0.85] ${active ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-zinc-600 hover:text-white hover:bg-white/5'}`}>
                    <span className="text-[7px] font-black lowercase tracking-tighter mb-0.5 opacity-60">{date.toLocaleDateString(undefined, {weekday:'short'})}</span>
                    <span className="text-[11px] font-black tracking-tighter relative leading-none">
                        {date.getDate()}
                        {isToday && !active && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-500 rounded-full" />}
                    </span>
                  </button>
                );
              })}
            </div>
            <button onClick={() => {const d = new Date(selectedDate); d.setDate(d.getDate()+7); setSelectedDate(d);}} className="p-1.5 text-zinc-600 hover:text-white hover:bg-white/5 rounded-lg transition-all active:scale-[0.8]"><ChevronRight size={14}/></button>
          </div>
        </div>
      </header>

      <form onSubmit={addTask} className="relative z-10 flex gap-2 group">
        <input 
          type="text" 
          value={newTaskText} 
          onChange={(e) => setNewTaskText(e.target.value)} 
          placeholder={`${t.todo.new_directive} ${selectedDate.toLocaleDateString(undefined, {month:'short', day:'numeric'})}...`} 
          className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-[11px] font-black lowercase text-white focus:outline-none focus:border-white/30 transition-all placeholder:text-zinc-800 shadow-inner" 
        />
        <button type="submit" className="bg-white text-black px-6 rounded-xl hover:bg-emerald-500 transition-all active:scale-[0.92] shadow-xl shadow-white/5 flex items-center justify-center">
          <Plus size={20} strokeWidth={3} />
        </button>
      </form>

      <div className="relative z-10 bg-[#111] border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5 shadow-2xl">
        {dayTasks.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/5 opacity-50">
              <ClipboardList size={20} className="text-zinc-800" />
            </div>
            <p className="text-[10px] font-black lowercase tracking-widest text-zinc-800 italic">{t.todo.no_objectives}</p>
          </div>
        ) : (
          dayTasks.map(task => (
            <div key={task.id} className="p-4 flex items-center justify-between group hover:bg-white/[0.01] transition-all">
              <button onClick={async () => { 
                try {
                  await updateTask(task.id, { ...task, completed: !task.completed });
                  setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t));
                  if (navigator.vibrate) navigator.vibrate(5);
                } catch (error) {
                  console.error('Failed to update task:', error);
                }
              }} className="flex items-center gap-4 flex-1 text-left">
                <div className={`transition-all duration-300 ${task.completed ? 'scale-110' : 'scale-100'}`}>
                    {task.completed ? <CheckCircle className="text-emerald-500" size={20} fill="currentColor" /> : <Circle className="text-zinc-800" size={20} strokeWidth={3} />}
                </div>
                <span className={`text-[12px] font-black lowercase tracking-tight transition-all duration-500 ${task.completed ? 'text-zinc-700 line-through' : 'text-zinc-300'}`}>
                    {task.text}
                </span>
              </button>
              <button onClick={async () => {
                try {
                  await deleteTask(task.id);
                  setTasks(prev => prev.filter(t => t.id !== task.id));
                } catch (error) {
                  console.error('Failed to delete task:', error);
                }
              }} className="opacity-0 group-hover:opacity-100 p-2 text-zinc-800 hover:text-red-500 active:scale-[0.8] transition-all">
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
      
      <div className="relative z-10 text-center py-6 opacity-10">
        <p className="text-[7px] font-black uppercase tracking-[1em] text-white">integrity maintained</p>
      </div>
    </div>
  );
};

export default TodoList;
