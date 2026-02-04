import React, { useState } from 'react';
import { Mail, ChevronRight, Loader2, Terminal, LogIn, UserPlus, Lock, KeyRound, MessageCircle } from 'lucide-react';
import { UserProfile } from '../types';
import { supabase, setRememberMe } from '../supabaseClient';
import { translations } from '../translations';

interface AuthProps {
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
}

const getAuthLanguage = (): 'en' | 'zh' => {
  if (typeof localStorage === 'undefined') return 'en';
  const stored = localStorage.getItem('nfnj_lang');
  if (stored === 'zh' || stored === 'en') return stored;
  const nav = navigator.language || '';
  return nav.startsWith('zh') ? 'zh' : 'en';
};

const Auth: React.FC<AuthProps> = ({ setProfile }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [rememberMe, setRememberMeState] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [loginMethod, setLoginMethod] = useState<'password' | 'code'>('password');
  const [codeSent, setCodeSent] = useState(false);

  const lang = getAuthLanguage();
  const t = translations[lang].auth;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    if (authMode === 'signup') {
      if (password.length < 6) {
        alert(lang === 'zh' ? '密碼至少 6 個字元。' : 'Password must be at least 6 characters.');
        return;
      }
      setLoading(true);
      setMessage(null);
      setRememberMe(rememberMe);
      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) {
          if (error.message.includes('already registered')) {
            alert(lang === 'zh' ? '此郵箱已註冊，請直接登入。' : 'This email is already registered. Please log in.');
          } else throw error;
          return;
        }
        if (data.user && !data.session) setMessage(t.success_signup);
        else if (data.session) setProfile((p) => ({ ...p, isLoggedIn: true, authIdentifier: data.session!.user.id }));
      } catch (err: any) {
        console.error('Auth error:', err);
        if (err.message?.includes('Invalid API key') || err.message?.includes('Failed to fetch')) alert(t.error_config);
        else alert(`❌ ${err.message || (lang === 'zh' ? '認證失敗' : 'Authentication failed')}`);
      } finally {
        setLoading(false);
      }
      return;
    }
    // Login
    if (loginMethod === 'password') {
      if (!password.trim()) return;
      setLoading(true);
      setMessage(null);
      setRememberMe(rememberMe);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) {
          if (error.message.includes('Invalid login credentials') || error.message.includes('invalid_credentials')) {
            alert(lang === 'zh' ? '郵箱或密碼錯誤，請重試。' : 'Invalid email or password. Please try again.');
          } else throw error;
          return;
        }
        if (data.session) setProfile((p) => ({ ...p, isLoggedIn: true, authIdentifier: data.session.user.id }));
      } catch (err: any) {
        console.error('Auth error:', err);
        if (err.message?.includes('Invalid API key') || err.message?.includes('Failed to fetch')) alert(t.error_config);
        else alert(`❌ ${err.message || (lang === 'zh' ? '認證失敗' : 'Authentication failed')}`);
      } finally {
        setLoading(false);
      }
      return;
    }
    // Login with code: verify OTP
    if (!code.trim()) return;
    setLoading(true);
    setMessage(null);
    setRememberMe(rememberMe);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: 'email',
      });
      if (error) {
        alert(lang === 'zh' ? '驗證碼無效或已過期，請點擊郵件中的連結或重新發送驗證碼。' : 'Invalid or expired code. Click the link in your email or request a new code.');
        return;
      }
      if (data.session) setProfile((p) => ({ ...p, isLoggedIn: true, authIdentifier: data.session.user.id }));
    } catch (err: any) {
      console.error('Verify OTP error:', err);
      alert(lang === 'zh' ? '驗證失敗，請重試或點擊郵件中的連結登入。' : 'Verification failed. Try again or use the link in your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      alert(lang === 'zh' ? '請先輸入郵箱。' : 'Please enter your email first.');
      return;
    }
    setLoading(true);
    setMessage(null);
    setRememberMe(rememberMe);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: window.location.origin, shouldCreateUser: true },
      });
      if (error) {
        if (error.message?.includes('Invalid API key') || error.message?.includes('Failed to fetch')) alert(t.error_config);
        else throw error;
        return;
      }
      setCodeSent(true);
      setMessage(t.code_sent);
      setCode('');
    } catch (err: any) {
      console.error('Send OTP error:', err);
      alert(`❌ ${err.message || (lang === 'zh' ? '發送失敗' : 'Send failed')}`);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      alert(lang === 'zh' ? '請先輸入郵箱。' : 'Please enter your email first.');
      return;
    }
    setLoading(true);
    setMessage(null);
    setRememberMe(rememberMe);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
      if (error) throw error;
      setMessage(t.success_reset);
    } catch (err: any) {
      console.error('Reset error:', err);
      alert(`❌ ${err.message || (lang === 'zh' ? '發送失敗' : 'Send failed')}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] z-[100] flex items-center justify-center p-6 overflow-y-auto">
      <div className="max-w-md w-full space-y-8 relative animate-fade-in-up py-8">
        <div className="text-center space-y-6">
          <div className="brand-logo text-3xl md:text-4xl">nofap nojerk<span className="dot">.</span></div>
          <div className="flex items-center gap-2">
            <Terminal size={12} className="text-emerald-500" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">access gateway • email + password / code</p>
          </div>
        </div>

        <div className="bg-[#111] border border-white/5 p-8 rounded-[3rem] shadow-2xl space-y-6 relative overflow-hidden">
          {message ? (
            <div className="text-center space-y-6 py-6">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 text-emerald-500">
                <Mail size={20} />
              </div>
              <p className="text-[11px] font-black uppercase tracking-widest text-emerald-500 whitespace-pre-line">{message}</p>
              <button type="button" onClick={() => setMessage(null)} className="text-[9px] font-black text-zinc-700 uppercase tracking-widest hover:text-white transition-colors">
                {lang === 'zh' ? '返回' : 'Back'}
              </button>
            </div>
          ) : (
            <>
              <div className="flex p-1 bg-black rounded-2xl border border-white/5">
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setMessage(null); setCodeSent(false); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${authMode === 'login' ? 'bg-white text-black' : 'text-zinc-600'}`}
                >
                  <LogIn size={14} /> {t.log_in}
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('signup'); setMessage(null); setCodeSent(false); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${authMode === 'signup' ? 'bg-white text-black' : 'text-zinc-600'}`}
                >
                  <UserPlus size={14} /> {t.sign_up}
                </button>
              </div>

              {authMode === 'login' && (
                <div className="flex p-1 bg-black/50 rounded-xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => { setLoginMethod('password'); setCodeSent(false); setCode(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${loginMethod === 'password' ? 'bg-white/10 text-white' : 'text-zinc-600'}`}
                  >
                    <Lock size={12} /> {t.login_with_password}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLoginMethod('code'); setMessage(null); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${loginMethod === 'code' ? 'bg-white/10 text-white' : 'text-zinc-600'}`}
                  >
                    <MessageCircle size={12} /> {t.login_with_code}
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-700 ml-1 flex items-center gap-2">
                    <Mail size={10} /> {t.email_label}
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.email_placeholder}
                    className="w-full bg-black border border-white/10 rounded-2xl py-4 px-6 text-sm font-black text-white focus:outline-none focus:border-white/30 transition-all placeholder:text-zinc-900"
                  />
                </div>

                {authMode === 'signup' && (
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-700 ml-1 flex items-center gap-2">
                      <Lock size={10} /> {t.password_label}
                    </label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t.password_placeholder}
                      className="w-full bg-black border border-white/10 rounded-2xl py-4 px-6 text-sm font-black text-white focus:outline-none focus:border-white/30 transition-all placeholder:text-zinc-900"
                    />
                  </div>
                )}

                {authMode === 'login' && loginMethod === 'password' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-700 ml-1 flex items-center gap-2">
                        <Lock size={10} /> {t.password_label}
                      </label>
                      <input
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t.password_placeholder}
                        className="w-full bg-black border border-white/10 rounded-2xl py-4 px-6 text-sm font-black text-white focus:outline-none focus:border-white/30 transition-all placeholder:text-zinc-900"
                      />
                    </div>
                    <div className="text-center">
                      <button type="button" onClick={handleForgotPassword} className="text-[9px] font-black text-zinc-600 uppercase tracking-widest hover:text-emerald-500 transition-colors flex items-center gap-1 mx-auto">
                        <KeyRound size={10} /> {t.forgot_password}
                      </button>
                    </div>
                  </>
                )}

                {authMode === 'login' && loginMethod === 'code' && (
                  <>
                    {!codeSent ? (
                      <button
                        type="button"
                        onClick={handleSendCode}
                        disabled={loading || !email.trim()}
                        className="w-full bg-white/10 border border-white/20 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-white/20 transition-all active:scale-[0.98] disabled:opacity-50"
                      >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <><MessageCircle size={14} /> {t.send_code}</>}
                      </button>
                    ) : (
                      <>
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{t.use_link_or_code}</p>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-zinc-700 ml-1">{t.code_placeholder}</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="000000"
                            className="w-full bg-black border border-white/10 rounded-2xl py-4 px-6 text-sm font-black text-white text-center focus:outline-none focus:border-white/30 transition-all placeholder:text-zinc-700"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={handleSendCode}
                            disabled={loading}
                            className="flex-1 py-3 rounded-xl text-[10px] font-black uppercase border border-white/10 text-zinc-500 hover:text-white hover:border-white/20 transition-all"
                          >
                            {loading ? <Loader2 size={14} className="animate-spin mx-auto" /> : lang === 'zh' ? '重新發送' : 'Resend'}
                          </button>
                          <button
                            type="submit"
                            disabled={loading || !code.trim()}
                            className="flex-1 bg-white text-black py-3 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-500 transition-all disabled:opacity-50"
                          >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : t.verify_code}
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}

                {(authMode === 'signup' || (authMode === 'login' && loginMethod === 'password')) && (
                  <>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMeState(e.target.checked)} className="w-4 h-4 rounded border-white/20 bg-black text-emerald-500 focus:ring-emerald-500" />
                      <span className="text-[10px] font-black text-zinc-500 group-hover:text-zinc-400 transition-colors">{t.remember_me}</span>
                    </label>
                    <button
                      type="submit"
                      disabled={loading || !email.trim() || (authMode === 'login' ? !password.trim() : password.length < 6)}
                      className="w-full bg-white text-black py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:bg-emerald-500 transition-all active:scale-[0.98] shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <>{authMode === 'login' ? t.submit_log_in : t.submit_sign_up} <ChevronRight size={14} strokeWidth={3} /></>}
                    </button>
                  </>
                )}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
