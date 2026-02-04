
import React, { useState } from 'react';
import { Smartphone, Mail, ChevronRight, Loader2, Terminal, LogIn, UserPlus } from 'lucide-react';
import { UserProfile } from '../types';
import { supabase } from '../supabaseClient';

interface AuthProps {
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
}

const Auth: React.FC<AuthProps> = ({ setProfile }) => {
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) return;
    setIsVerifying(true);
    setMessage(null);

    try {
      if (method === 'email') {
        // Supabase 的 signInWithOtp 会自动处理新用户注册
        // 如果邮箱不存在，会自动创建账户
        const { data, error } = await supabase.auth.signInWithOtp({
          email: identifier,
          options: {
            emailRedirectTo: window.location.origin,
            // 对于新用户，自动创建账户
            shouldCreateUser: true,
          }
        });
        
        if (error) {
          // 如果是配置错误，提供更友好的提示
          if (error.message.includes('Invalid API key') || error.message.includes('Failed to fetch')) {
            alert('⚠️ Supabase 配置错误！\n\n请检查：\n1. .env.local 文件中的 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 是否正确\n2. Supabase 项目是否已创建\n3. 是否已运行 schema.sql 创建数据库表\n\n查看 supabase/README.md 获取详细设置说明');
            throw error;
          }
          throw error;
        }
        
        setMessage(
          authMode === 'login' 
            ? "✅ 登录链接已发送！请检查您的邮箱（包括垃圾邮件文件夹）" 
            : "✅ 欢迎！激活链接已发送到您的邮箱（包括垃圾邮件文件夹）"
        );
      } else {
        alert("⚠️ 手机号登录需要 Twilio 集成。请使用邮箱登录。");
        setMethod('email');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      alert(`❌ 认证失败: ${err.message}\n\n如果这是首次注册，请检查邮箱中的验证链接。`);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] z-[100] flex items-center justify-center p-6 overflow-hidden">
      <div className="max-w-md w-full space-y-8 relative animate-fade-in-up">
        <div className="text-center space-y-6">
          <div className="brand-logo text-3xl md:text-4xl">nofap nojerk<span className="dot">.</span></div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <Terminal size={12} className="text-emerald-500" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">access gateway_v2.0_cloud</p>
            </div>
          </div>
        </div>

        <div className="bg-[#111] border border-white/5 p-8 rounded-[3rem] shadow-2xl space-y-6 relative overflow-hidden group">
          {message ? (
            <div className="text-center space-y-6 py-8">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 text-emerald-500">
                <Mail size={20} />
              </div>
              <p className="text-[11px] font-black uppercase tracking-widest text-emerald-500">{message}</p>
              <button onClick={() => setMessage(null)} className="text-[9px] font-black text-zinc-700 uppercase tracking-widest hover:text-white transition-colors">Recalibrate Signal</button>
            </div>
          ) : (
            <>
              <div className="flex p-1 bg-black rounded-2xl border border-white/5">
                <button onClick={() => setMethod('email')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${method === 'email' ? 'bg-white text-black' : 'text-zinc-600'}`}><Mail size={14} /> Email</button>
                <button onClick={() => setMethod('phone')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${method === 'phone' ? 'bg-white text-black' : 'text-zinc-600'}`}><Smartphone size={14} /> Phone</button>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-700 ml-1">
                    {method === 'email' ? 'NEURAL MAIL ADDRESS' : 'CELLULAR LINK NUMBER'}
                  </label>
                  <input 
                    type={method === 'email' ? 'email' : 'tel'} 
                    value={identifier} 
                    onChange={(e) => setIdentifier(e.target.value)} 
                    placeholder={method === 'email' ? "brother@network.sh" : "+1 555 000 000"} 
                    className="w-full bg-black border border-white/10 rounded-2xl py-4 px-6 text-sm font-black text-white focus:outline-none focus:border-white/30 transition-all placeholder:text-zinc-900" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button" 
                    onClick={() => { setAuthMode('login'); }}
                    className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border ${authMode === 'login' ? 'bg-white/10 border-white/50 text-white' : 'bg-black border-white/5 text-zinc-600'}`}
                  >
                    <LogIn size={14} /> Log In
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setAuthMode('signup'); }}
                    className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border ${authMode === 'signup' ? 'bg-white/10 border-white/50 text-white' : 'bg-black border-white/5 text-zinc-600'}`}
                  >
                    <UserPlus size={14} /> Sign Up
                  </button>
                </div>

                <button 
                  type="submit" 
                  disabled={isVerifying || !identifier} 
                  className="w-full bg-white text-black py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:bg-emerald-500 transition-all active:scale-[0.98] shadow-xl"
                >
                  {isVerifying ? <Loader2 size={16} className="animate-spin" /> : <>{authMode === 'login' ? 'Initialize Log In' : 'Activate Profile'} <ChevronRight size={14} strokeWidth={3} /></>}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
