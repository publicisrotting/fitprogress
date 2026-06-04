import { ChevronLeft, Bell, Crown, Globe, Moon, Smartphone, Lock, Mail, LogOut, Server, X, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { API_URL } from '../../config';
import PremiumModal from '../modals/PremiumModal';

interface SettingsScreenProps {
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}

export default function SettingsScreen({ onNavigate, onLogout }: SettingsScreenProps) {
  const { token } = useAuth();
  const { language, setLanguage, theme, toggleTheme, units, setUnits, t } = useSettings();
  const [serverStatus, setServerStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [userData, setUserData] = useState<any>(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('pushEnabled');
    setPushEnabled(saved === 'true');
  }, []);

  const togglePush = async () => {
    setPushLoading(true);
    try {
      if (!pushEnabled) {
        if (!('Notification' in window)) { alert('Ваш браузер не підтримує сповіщення'); return; }
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // Schedule a test notification
          setTimeout(() => new Notification('FitProgress 💪', { body: 'Push-сповіщення увімкнено! Ми нагадаємо про тренування.', icon: '/icon-192.png' }), 500);
          setPushEnabled(true);
          localStorage.setItem('pushEnabled', 'true');
          // Register a daily reminder (simulated with localStorage)
          localStorage.setItem('pushSchedule', JSON.stringify({ hour: 10, minute: 0, enabled: true }));
        } else {
          alert('Дозвіл на сповіщення відхилено. Змініть в налаштуваннях браузера.');
        }
      } else {
        setPushEnabled(false);
        localStorage.setItem('pushEnabled', 'false');
      }
    } finally { setPushLoading(false); }
  };
  
  // Modals state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showUnitsModal, setShowUnitsModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  
  // Forms state
  const [emailForm, setEmailForm] = useState({ email: '', password: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  
  // Status state
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleHaptic = () => {
    if (window.navigator && (window.navigator as any).vibrate) {
      (window.navigator as any).vibrate(10);
    }
  };

  const fetchProfile = () => {
    fetch(`${API_URL}/api/user/profile`, {
      headers: { 'x-auth-token': token || '' }
    })
      .then(res => res.json())
      .then(data => {
        setUserData(data);
        setEmailForm(prev => ({ ...prev, email: data.email }));
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetch(`${API_URL}/api/health`)
      .then(res => res.json())
      .then(() => setServerStatus('connected'))
      .catch(() => setServerStatus('disconnected'));
    fetchProfile();
  }, [token]);

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`${API_URL}/api/user/email`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
        body: JSON.stringify(emailForm)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || t('common.error'));
      setUserData({ ...userData, email: emailForm.email });
      setMessage({ type: 'success', text: t('settings.emailUpdated') });
      setTimeout(() => { setShowEmailModal(false); setMessage(null); }, 2000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: t('settings.passwordMismatch') });
      return;
    }
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`${API_URL}/api/user/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
        body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || t('common.error'));
      setMessage({ type: 'success', text: t('settings.passwordUpdated') });
      setTimeout(() => { setShowPasswordModal(false); setMessage(null); }, 2000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

 




  return (
    <div className="h-full bg-slate-950 overflow-y-auto pb-24 relative overflow-x-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[40%] aspect-square bg-orange-600/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute top-[30%] left-[-10%] w-[30%] aspect-square bg-purple-600/10 blur-[80px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 px-6 pt-[calc(3rem+env(safe-area-inset-top))] pb-8">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => onNavigate('profile')}
            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 active:scale-95"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <div>
            <h1 className="text-white text-2xl font-black tracking-tight leading-none mb-1">{t('settings.title')}</h1>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">{t('settings.subtitle') || 'Preferences'}</p>
          </div>
        </div>
      </div>

      <div className="relative z-10 px-6 space-y-8 animate-fade-in-up">
        {/* Push Notifications */}
        <section>
          <div className="flex items-center gap-2 mb-4 px-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent-exercise)' }} />
            <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Сповіщення</h3>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-6 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white/40" />
                </div>
                <div>
                  <p className="text-white font-bold">Push-нотифікації</p>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">{pushEnabled ? 'Увімкнено — щоденне нагадування' : 'Нагадування про тренування'}</p>
                </div>
              </div>
              <button onClick={togglePush} disabled={pushLoading}
                className="w-14 h-8 rounded-full transition-all relative disabled:opacity-50"
                style={{ background: pushEnabled ? 'var(--accent-exercise)' : 'rgba(255,255,255,0.1)' }}>
                <div className="absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm"
                  style={{ left: pushEnabled ? 'calc(100% - 28px)' : '4px' }} />
              </button>
            </div>
          </div>
        </section>

        {/* Account Settings */}
        <section>
          <div className="flex items-center gap-2 mb-4 px-2">
            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
            <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">{t('settings.account')}</h3>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-md">
            <button 
              onClick={() => { handleHaptic(); setShowEmailModal(true); }} 
              className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-all group border-b border-white/5"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                  <Mail className="w-5 h-5 text-white/40 group-hover:text-orange-400 transition-colors" />
                </div>
                <div className="text-left">
                  <p className="text-white font-bold tracking-tight">{t('settings.email')}</p>
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{userData?.email}</p>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-white/10 rotate-180 group-hover:text-white/40 transition-all" />
            </button>
            <button 
              onClick={() => { handleHaptic(); setShowPasswordModal(true); }} 
              className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-all group border-b border-white/5"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <Lock className="w-5 h-5 text-white/40 group-hover:text-blue-400 transition-colors" />
                </div>
                <p className="text-white font-bold tracking-tight">{t('settings.password')}</p>
              </div>
              <ChevronLeft className="w-5 h-5 text-white/10 rotate-180 group-hover:text-white/40 transition-all" />
            </button>
          </div>
        </section>

        {/* Preferences */}
        <section>
          <div className="flex items-center gap-2 mb-4 px-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">{t('settings.preferences')}</h3>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-md">
            <button 
              onClick={() => { handleHaptic(); setShowLanguageModal(true); }} 
              className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-all group border-b border-white/5"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                  <Globe className="w-5 h-5 text-white/40 group-hover:text-indigo-400 transition-colors" />
                </div>
                <div className="text-left">
                  <p className="text-white font-bold tracking-tight">{t('settings.language')}</p>
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{language === 'uk' ? t('settings.languageUk') : language === 'en' ? t('settings.languageEn') : t('settings.languageRu')}</p>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-white/10 rotate-180 group-hover:text-white/40 transition-all" />
            </button>
            <button 
              onClick={() => { handleHaptic(); setShowUnitsModal(true); }} 
              className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-all group border-b border-white/5"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                  <Smartphone className="w-5 h-5 text-white/40 group-hover:text-emerald-400 transition-colors" />
                </div>
                <div className="text-left">
                  <p className="text-white font-bold tracking-tight">{t('settings.units')}</p>
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{units === 'metric' ? t('settings.metric') : t('settings.imperial')}</p>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-white/10 rotate-180 group-hover:text-white/40 transition-all" />
            </button>
            <div className="w-full flex items-center justify-between p-6 group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                  <Moon className="w-5 h-5 text-white/40 group-hover:text-amber-400 transition-colors" />
                </div>
                <p className="text-white font-bold tracking-tight">{t('settings.theme')}</p>
              </div>
              <button 
                onClick={() => { handleHaptic(); toggleTheme(); }} 
                className="w-12 h-6 bg-white/10 rounded-full relative transition-all active:scale-95"
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full transition-all duration-300 ${theme === 'dark' ? 'right-1 bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]' : 'left-1 bg-white/40'}`} />
              </button>
            </div>
          </div>
        </section>

        {/* System */}
        <section>
          <div className="flex items-center gap-2 mb-4 px-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">{t('settings.system')}</h3>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-6 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center">
                <Server className="w-5 h-5 text-white/40" />
              </div>
              <div className="text-left">
                <p className="text-white font-bold tracking-tight">{t('settings.serverStatus')}</p>
                <p className={`text-[10px] font-black uppercase tracking-widest ${serverStatus === 'connected' ? 'text-green-500' : 'text-red-500'}`}>
                  {serverStatus === 'connected' ? t('common.connected') : t('common.disconnected')}
                </p>
              </div>
            </div>
            {serverStatus === 'connected' && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />}
          </div>
        </section>

        <div className="text-center space-y-2 pb-10">
          <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.3em]">{t('settings.appEdition')}</p>
          <button onClick={onLogout} className="mt-4 flex items-center justify-center gap-2 mx-auto text-red-500/60 hover:text-red-500 transition-colors uppercase text-[10px] font-black tracking-widest">
            <LogOut className="w-4 h-4" />
            {t('settings.logout')}
          </button>
        </div>
      </div>

      {/* Modals */}
      {showEmailModal && (
        <SettingsModal title={t('settings.updateEmail')} onClose={() => setShowEmailModal(false)} isLoading={isLoading} message={message}>
          <form onSubmit={handleEmailUpdate} className="space-y-4">
            <input type="email" value={emailForm.email} onChange={(e) => setEmailForm({...emailForm, email: e.target.value})} className="w-full bg-white/5 text-white px-5 py-4 rounded-2xl border border-white/10 focus:border-orange-500 outline-none" placeholder={t('settings.newEmail')} required />
            <input type="password" value={emailForm.password} onChange={(e) => setEmailForm({...emailForm, password: e.target.value})} className="w-full bg-white/5 text-white px-5 py-4 rounded-2xl border border-white/10 focus:border-orange-500 outline-none" placeholder={t('settings.password')} required />
            <button type="submit" disabled={isLoading} className="w-full py-5 bg-white text-slate-950 font-black rounded-2xl uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">{isLoading ? t('common.loading') : t('common.save')}</button>
          </form>
        </SettingsModal>
      )}

      {showPasswordModal && (
        <SettingsModal title={t('settings.updatePassword')} onClose={() => setShowPasswordModal(false)} isLoading={isLoading} message={message}>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})} className="w-full bg-white/5 text-white px-5 py-4 rounded-2xl border border-white/10 focus:border-orange-500 outline-none" placeholder={t('settings.currentPassword')} required />
            <input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})} className="w-full bg-white/5 text-white px-5 py-4 rounded-2xl border border-white/10 focus:border-orange-500 outline-none" placeholder={t('settings.newPassword')} required />
            <input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} className="w-full bg-white/5 text-white px-5 py-4 rounded-2xl border border-white/10 focus:border-orange-500 outline-none" placeholder={t('settings.confirmNewPassword')} required />
            <button type="submit" disabled={isLoading} className="w-full py-5 bg-white text-slate-950 font-black rounded-2xl uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">{isLoading ? t('common.loading') : t('common.save')}</button>
          </form>
        </SettingsModal>
      )}

      {showLanguageModal && (
        <SettingsModal title={t('settings.language')} onClose={() => setShowLanguageModal(false)}>
          <div className="space-y-3">
            {[{id:'uk',label:'Українська'},{id:'en',label:'English'},{id:'ru',label:'Русский'}].map(lang => (
              <button key={lang.id} onClick={() => { setLanguage(lang.id as any); setShowLanguageModal(false); }} className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all ${language === lang.id ? 'bg-orange-500/10 border-orange-500 text-white' : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'}`}>
                <span className="font-bold">{lang.label}</span>
                {language === lang.id && <Check className="w-5 h-5 text-orange-500" />}
              </button>
            ))}
          </div>
        </SettingsModal>
      )}

      {showUnitsModal && (
        <SettingsModal title={t('settings.units')} onClose={() => setShowUnitsModal(false)}>
          <div className="space-y-3">
            {[{id:'metric',label:t('settings.metric')},{id:'imperial',label:t('settings.imperial')}].map(unit => (
              <button key={unit.id} onClick={() => { setUnits(unit.id as any); setShowUnitsModal(false); }} className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all ${units === unit.id ? 'bg-blue-500/10 border-blue-500 text-white' : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'}`}>
                <span className="font-bold">{unit.label}</span>
                {units === unit.id && <Check className="w-5 h-5 text-blue-500" />}
              </button>
            ))}
          </div>
        </SettingsModal>
      )}

      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onSuccess={fetchProfile}
        isPremium={userData?.isPremium}
        premiumExpiresAt={userData?.premiumExpiresAt}
      />
    </div>
  );
}

function SettingsModal({ title, onClose, children, isLoading, message }: { title: string, onClose: () => void, children: React.ReactNode, isLoading?: boolean, message?: any }) {
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-scale-in">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-white font-black tracking-tight text-lg uppercase tracking-widest">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors"><X className="w-6 h-6 text-white/40" /></button>
        </div>
        <div className="p-8">
          {message && <div className={`mb-6 p-4 rounded-2xl text-xs font-bold uppercase tracking-widest text-center border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>{message.text}</div>}
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
