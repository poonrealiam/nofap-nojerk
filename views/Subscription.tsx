
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Zap, Crosshair, BarChart3, Scan, Crown, CheckCircle2, Link, ExternalLink, ShieldAlert, Apple, Globe, Smartphone, CreditCard, Wallet, ShieldEllipsis } from 'lucide-react';
import { UserProfile, View } from '../types';
import { translations } from '../translations';

interface SubscriptionProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
}

interface LocalAIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

type BillingPlatform = 'apple' | 'android' | 'mainland';
type BillingCycle = 'monthly' | 'annual';

const Subscription: React.FC<SubscriptionProps> = ({ profile, setProfile }) => {
  const t = translations[profile?.language || 'en']?.subscription || translations.en.subscription;
  const [hasPaidKey, setHasPaidKey] = useState(false);
  const [activePlatform, setActivePlatform] = useState<BillingPlatform>('apple');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  const ELITE_MONTHLY_PRICE = 9.9;
  const ELITE_ANNUAL_PRICE = 99; // Approx 2 months free (9.9 × 10)

  useEffect(() => {
    const checkKey = async () => {
      const aiStudio = (window as any).aistudio as LocalAIStudio | undefined;
      if (aiStudio) {
        const selected = await aiStudio.hasSelectedApiKey();
        setHasPaidKey(selected);
      }
    };
    checkKey();
  }, []);

  const handleUpgrade = () => {
    const periodKey = billingCycle === 'monthly' ? 'period_monthly' : 'period_annual';
    const period = t[periodKey];
    const price = billingCycle === 'monthly' ? ELITE_MONTHLY_PRICE : ELITE_ANNUAL_PRICE;
    const priceStr = `$${price}`;

    const appStoreUrl = import.meta.env.VITE_APP_STORE_URL as string | undefined;
    const appStoreId = import.meta.env.VITE_APP_STORE_APP_ID as string | undefined;
    const playStoreUrl = import.meta.env.VITE_GOOGLE_PLAY_URL as string | undefined;
    const playPackage = import.meta.env.VITE_GOOGLE_PLAY_PACKAGE as string | undefined;
    const stripeMonthly = import.meta.env.VITE_STRIPE_MONTHLY_LINK as string | undefined;
    const stripeAnnual = import.meta.env.VITE_STRIPE_ANNUAL_LINK as string | undefined;

    // App Store 扣費：導向 App Store 應用頁，用戶在 App 內完成訂閱與扣費
    if (activePlatform === 'apple') {
      const url = appStoreUrl?.startsWith('http') ? appStoreUrl : (appStoreId ? `https://apps.apple.com/app/id${appStoreId}` : null);
      if (url) {
        window.location.href = url;
        return;
      }
    }

    // Google Play 扣費：導向 Play 商店應用頁，用戶在 App 內完成訂閱與扣費
    if (activePlatform === 'android') {
      const url = playStoreUrl?.startsWith('http') ? playStoreUrl : (playPackage ? `https://play.google.com/store/apps/details?id=${playPackage}` : null);
      if (url) {
        window.location.href = url;
        return;
      }
    }

    // Mainland / 直連：Stripe Payment Links 月付/年付自動扣費
    if (activePlatform === 'mainland') {
      if (billingCycle === 'monthly' && stripeMonthly?.startsWith('http')) {
        window.location.href = stripeMonthly;
        return;
      }
      if (billingCycle === 'annual' && stripeAnnual?.startsWith('http')) {
        window.location.href = stripeAnnual;
        return;
      }
    }

    // 未配置支付連結時：僅提示，不授予 Premium（需在商店或 Stripe 完成付款後由後台更新 is_premium）
    let msg = '';
    switch (activePlatform) {
      case 'apple':
        msg = t.alert_apple.replace('{period}', period).replace('${price}', priceStr);
        break;
      case 'android':
        msg = t.alert_android.replace('{period}', period).replace('${price}', priceStr);
        break;
      case 'mainland':
        msg = t.alert_mainland.replace('{period}', period).replace('${price}', priceStr);
        break;
    }
    alert(msg + (profile?.language === 'zh' ? '\n\n請在 .env.local 設定對應的支付連結後，點擊升級將跳轉至付款頁面。' : '\n\nConfigure payment links in .env.local to redirect to payment.'));
  };

  const handleLinkPaidKey = async () => {
    const aiStudio = (window as any).aistudio as LocalAIStudio | undefined;
    if (aiStudio) {
      await aiStudio.openSelectKey();
      setHasPaidKey(true);
      setProfile(prev => ({ ...prev, isPremium: true }));
    }
  };

  const PlanFeature = ({ text, unlocked = true, colorClass = "text-emerald-500" }: { text: string, unlocked?: boolean, colorClass?: string }) => (
    <div className={`flex items-center gap-2.5 ${unlocked ? 'text-zinc-300' : 'text-zinc-700'}`}>
      <CheckCircle2 size={14} className={unlocked ? colorClass : 'text-zinc-800'} />
      <span className="text-[10px] font-black lowercase tracking-tight">{text}</span>
    </div>
  );

  const PlatformButton = ({ platform, icon: Icon, label, sublabel }: { platform: BillingPlatform, icon: any, label: string, sublabel?: string }) => (
    <button 
      onClick={() => setActivePlatform(platform)}
      className={`flex flex-col flex-1 items-center justify-center gap-1 py-3 px-2 rounded-xl border transition-all active:scale-[0.9] ${
        activePlatform === platform 
        ? 'bg-white text-black border-white shadow-lg shadow-white/10' 
        : 'bg-[#111] text-zinc-600 border-white/5 hover:border-white/20 hover:text-white hover:bg-white/[0.02]'
      }`}
    >
      <Icon size={14} />
      <span className="text-[9px] font-black uppercase tracking-widest leading-none">{label}</span>
      {sublabel && <span className="text-[6px] font-black opacity-60 uppercase">{sublabel}</span>}
    </button>
  );

  return (
    <div className="relative max-w-4xl mx-auto space-y-8 pb-16 pt-20">
      {/* Background Icon Decoration */}
      <div className="absolute top-0 right-0 opacity-[0.03] text-white pointer-events-none transform translate-x-1/4 -translate-y-1/4">
        <ShieldEllipsis size={320} />
      </div>

      <header className="relative z-10 text-center space-y-3">
        <p className="text-[10px] font-black lowercase tracking-[0.4em] text-emerald-500">{t.access_protocols}</p>
        <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white lowercase leading-none">{t.upgrade_sector}</h1>
        <p className="text-[11px] font-medium text-zinc-500 lowercase tracking-widest max-w-lg mx-auto leading-relaxed px-4 md:px-0">
          {t.unlock_desc}
        </p>
      </header>

      {/* Payment Protocol Selector */}
      <div className="relative z-10 bg-[#111] border border-white/10 rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">{t.billing_gateway}</h3>
            <p className="text-[11px] font-medium text-zinc-500">{t.select_protocol}</p>
          </div>
          <div className="flex w-full md:w-auto gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5 shadow-inner">
            <PlatformButton platform="apple" icon={Apple} label={t.apple} sublabel={t.ios_users} />
            <PlatformButton platform="android" icon={Smartphone} label={t.play_store} sublabel={t.global_android} />
            <PlatformButton platform="mainland" icon={Globe} label={t.direct} sublabel={t.mainland_cn} />
          </div>
        </div>

        {activePlatform === 'mainland' && (
          <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2 shadow-inner">
            <div className="flex items-start gap-3">
              <Wallet size={16} className="text-emerald-500 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[10px] font-black text-white lowercase tracking-tight">{t.mainland_protocol_title}</p>
                <p className="text-[9px] font-medium text-zinc-500 leading-relaxed lowercase">{t.mainland_protocol_desc}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Billing Cycle Toggle - 選擇月付或年付後，訂閱將依所選方案自動扣費 */}
      <div className="relative z-10 flex flex-col items-center justify-center mb-4">
        <div className="bg-[#111] border border-white/5 p-1 rounded-2xl flex items-center gap-1 shadow-inner">
          <button 
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${billingCycle === 'monthly' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
          >
            {t.monthly}
          </button>
          <button 
            onClick={() => setBillingCycle('annual')}
            className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all relative ${billingCycle === 'annual' ? 'bg-emerald-500 text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
          >
            {t.annual}
            <span className="absolute -top-2 -right-2 bg-white text-black text-[6px] px-1.5 py-0.5 rounded-full font-black border border-zinc-900 shadow-xl">
              {t.save_pct}
            </span>
          </button>
        </div>
        <p className="text-[8px] font-medium text-zinc-500 mt-2 text-center max-w-sm">
          {t.auto_charge_note}
        </p>
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-start px-4 md:px-0">
        {/* Basic Plan */}
        <div className="bg-[#111] border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group shadow-xl h-full">
          <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
            <Crosshair size={120} />
          </div>
          <div className="relative z-10 space-y-8">
            <div>
              <h2 className="text-2xl font-black lowercase tracking-tight text-white mb-1">{t.operative}</h2>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">{t.base_protocol}</p>
            </div>
            
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black tracking-tighter text-white">$0</span>
              <span className="text-[9px] font-black text-zinc-600 uppercase">/ {t.forever}</span>
            </div>

            <div className="space-y-4 pt-6 border-t border-white/5">
              <PlanFeature text={t.streak_tracking} colorClass="text-orange-500" />
              <PlanFeature text={t.news_network} colorClass="text-orange-500" />
              <PlanFeature text={t.ai_food_per_day} colorClass="text-orange-500" />
              <PlanFeature text={t.one_physique_scan} colorClass="text-orange-500" />
              <PlanFeature text={t.task_management} colorClass="text-orange-500" />
            </div>

            <div className="pt-8">
              <div className="w-full bg-white/5 border border-white/10 py-4 rounded-2xl text-center text-[10px] font-black lowercase tracking-widest text-zinc-500 shadow-inner">
                {t.currently_active}
              </div>
            </div>
          </div>
        </div>

        {/* Elite Plan */}
        <div className="bg-white/5 border border-emerald-500/30 p-8 rounded-[2.5rem] relative overflow-hidden group shadow-2xl shadow-emerald-500/10 h-full">
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full" />
          <div className="absolute top-0 right-0 p-8 opacity-[0.1] text-emerald-500 group-hover:opacity-[0.2] transition-opacity">
            <Crown size={120} />
          </div>
          
          <div className="relative z-10 space-y-8">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black lowercase tracking-tight text-white mb-1">{t.elite_commander}</h2>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500">{t.priority_access}</p>
              </div>
              <div className="bg-emerald-500 text-black px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest shadow-lg">
                {t.recommended}
              </div>
            </div>
            
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black tracking-tighter text-white">
                ${billingCycle === 'monthly' ? ELITE_MONTHLY_PRICE : ELITE_ANNUAL_PRICE}
              </span>
              <span className="text-[9px] font-black text-zinc-600 uppercase">
                / {billingCycle === 'monthly' ? t.per_month : t.per_year}
              </span>
            </div>

            <div className="space-y-4 pt-6 border-t border-white/5">
              <PlanFeature text={t.unlimited_ai_food} />
              <PlanFeature text={t.weekly_physique} />
              <PlanFeature text={t.priority_rendering} />
              <PlanFeature text={t.vanguard_badge} />
              <PlanFeature text={t.ad_free} />
              <PlanFeature text={t.macro_tuning} />
            </div>

            <div className="pt-8">
              {profile.isPremium ? (
                <div className="w-full bg-emerald-500 text-black py-4 rounded-2xl text-center text-[10px] font-black lowercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20">
                  <ShieldCheck size={14} /> {t.active_elite_member}
                </div>
              ) : (
                <button 
                  onClick={handleUpgrade}
                  className="w-full bg-white text-black py-4 rounded-2xl text-[10px] font-black lowercase tracking-widest hover:bg-emerald-500 transition-all active:scale-[0.98] shadow-2xl shadow-white/10 flex items-center justify-center gap-2"
                >
                  {activePlatform === 'apple' && <Apple size={14} />}
                  {activePlatform === 'android' && <Smartphone size={14} />}
                  {activePlatform === 'mainland' && <CreditCard size={14} />}
                  {activePlatform === 'mainland' 
                    ? t.secure_alipay 
                    : activePlatform === 'apple' ? t.secure_app_store : t.secure_play_store}
                </button>
              )}
              {billingCycle === 'annual' && !profile.isPremium && (
                <p className="text-[7px] font-black text-emerald-500 text-center mt-3 uppercase tracking-widest">
                  {t.billed_annually}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Authentication Section */}
      <div className="relative z-10 bg-orange-500/5 border border-orange-500/20 rounded-[2.5rem] p-8 space-y-6 mx-4 md:mx-0 shadow-2xl shadow-orange-500/5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-orange-500">
              <ShieldAlert size={18} />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">{t.neural_link_title}</h3>
            </div>
            <p className="text-[11px] font-medium text-zinc-400 max-w-xl leading-relaxed">
              {t.neural_link_desc}
            </p>
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[9px] font-black text-orange-500 hover:text-white transition-colors uppercase tracking-widest"
            >
              {t.billing_docs} <ExternalLink size={10} />
            </a>
          </div>

          <button 
            onClick={handleLinkPaidKey}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-[0.95] shadow-2xl ${
              hasPaidKey 
                ? 'bg-emerald-500 text-black shadow-emerald-500/20 border-emerald-500' 
                : 'bg-white text-black hover:bg-orange-500 hover:text-white shadow-white/5 border border-white/10'
            }`}
          >
            {hasPaidKey ? <ShieldCheck size={16} /> : <Link size={16} />}
            {hasPaidKey ? t.vanguard_link_active : t.link_paid_gcp}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
