import { Edit2, Settings, LogOut, Trophy, Calendar, TrendingUp, Bell, Crown, Shield, Camera, Scale, Users, Download, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { ApiError, apiJson } from '../../config';
import { useSettings } from '../../context/SettingsContext';
import PremiumModal from '../modals/PremiumModal';

interface ProfileScreenProps {
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}

export default function ProfileScreen({ onNavigate, onLogout }: ProfileScreenProps) {
  const { token } = useAuth();
  const { t } = useSettings();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    age: '',
    gender: 'Чоловік',
    weight: '',
    height: '',
    goal: ''
  });

  const exportCSV = () => {
    if (!workouts.length) { toast.error('Немає тренувань для експорту'); return; }
    // One clean row per SET — easy to read and pivot in Excel
    const sep = ';'; // Excel-friendly delimiter for locales using comma decimals
    const header = ['Дата', 'Тренування', 'Вправа', 'Підхід', 'Вага (кг)', 'Повтори', "Об'єм (кг)"];
    const rows: string[][] = [header];

    const sorted = [...workouts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    sorted.forEach(w => {
      const date = new Date(w.date).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const wName = (w.source === 'generator' && w.programDayIndex)
        ? `${t('common.day')} ${w.programDayIndex}: ${w.programTitle || ''}`.trim()
        : (w.name || t('common.workout'));
      (w.exercises || []).forEach((ex: any) => {
        const exName = ex.name || ex.nameKey || '';
        (ex.sets || []).forEach((s: any, si: number) => {
          if (!s.weight && !s.reps) return;
          const vol = (s.weight || 0) * (s.reps || 0);
          rows.push([date, wName, exName, String(si + 1), String(s.weight || 0), String(s.reps || 0), String(vol)]);
        });
      });
    });

    const escape = (c: string) => /[";\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c;
    const csv = rows.map(r => r.map(escape).join(sep)).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitprogress_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV завантажено!');
  };

  const fetchProfile = async () => {
    setLoading(true);
    setErrorMessage('');
    if (!token) {
      setUserData(null);
      setErrorMessage(t('auth.sessionExpired') || t('common.error') || 'Session expired');
      setLoading(false);
      return;
    }

    try {
      const [profile, workoutsData] = await Promise.all([
        apiJson<any>('/api/user/profile', { token }),
        apiJson<any[]>('/api/workouts', { token }).catch(() => [])
      ]);
      setUserData(profile);
      resetEditFormFromUser(profile);
      setWorkouts(Array.isArray(workoutsData) ? workoutsData : []);
    } catch (error: any) {
      if (error instanceof ApiError && error.status === 401) {
        toast.error(t('auth.sessionExpired'));
        onLogout();
        return;
      }
      const msg = t('common.networkError') || 'Network Error';
      setUserData(null);
      setErrorMessage(error?.message || msg);
      toast.error(error?.message || msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const resetEditFormFromUser = (data: any) => {
    setEditForm({
      name: data?.name || '',
      age: data?.age || '',
      gender: data?.gender || 'Чоловік',
      weight: data?.weight || '',
      height: data?.height || '',
      goal: data?.goal || ''
    });
  };

  const handleUpdateProfile = async () => {
    try {
      const updatedUser = await apiJson<any>('/api/user/profile', {
        method: 'PUT',
        token,
        body: editForm
      });
      setUserData(updatedUser);
      resetEditFormFromUser(updatedUser);
      setIsEditing(false);
      toast.success(t('profile.updateSuccess') || 'Профіль оновлено');
    } catch (error: any) {
      if (error instanceof ApiError && error.status === 401) {
        onLogout();
        return;
      }
      toast.error(error?.message || t('common.networkError') || 'Помилка мережі');
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await fetch(`/api/user/avatar`, {
        method: 'POST',
        headers: {
          'x-auth-token': token || ''
        },
        body: formData
      });

      if (response.status === 401) {
        onLogout();
        return;
      }

      if (response.ok) {
        const updatedUser = await response.json();
        setUserData(updatedUser);
      } else {
        console.error('Failed to upload avatar');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const stats = [
    { label: t('profile.workouts'), value: userData?.stats?.workouts || '0', icon: Calendar },
    { label: t('profile.achievements'), value: userData?.stats?.achievements || '0', icon: Trophy },
    { label: t('profile.streak'), value: userData?.stats?.streak || '0', icon: TrendingUp },
  ];


  if (loading) {
    return (
      <div className="h-full bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-950 text-white p-6 text-center">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
          <Shield className="w-10 h-10 text-white/20" />
        </div>
        <h3 className="text-xl font-bold mb-2">{t('common.error') || 'Error loading profile'}</h3>
        <p className="text-white/40 mb-8 max-w-xs mx-auto">{errorMessage || t('common.networkError') || 'Network Error'}</p>
        <button 
          onClick={fetchProfile} 
          className="px-8 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/20 active:scale-95 transition-transform"
        >
          {t('common.retry') || 'Retry'}
        </button>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-950 overflow-y-auto pb-24 relative overflow-x-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] aspect-square bg-orange-600/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[30%] aspect-square bg-purple-600/10 blur-[80px] rounded-full pointer-events-none" />

      {/* Header / Avatar Section */}
      <div className="relative z-10 px-6 pt-[calc(3rem+env(safe-area-inset-top))] pb-8">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative group mb-6">
            <div className="p-1 bg-gradient-to-tr from-orange-500 via-pink-500 to-purple-600 rounded-[3rem] shadow-2xl shadow-orange-500/20 active:scale-95 transition-transform duration-500">
              <div 
                className="w-36 h-36 rounded-[2.8rem] bg-slate-900 flex items-center justify-center overflow-hidden cursor-pointer border-4 border-slate-950 relative"
                onClick={() => document.getElementById('avatar-input')?.click()}
              >
                {userData?.picture ? (
                  <img src={userData.picture} alt="Profile" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center text-white text-5xl font-black">
                    {userData?.name ? userData.name.substring(0, 1).toUpperCase() : 'U'}
                  </div>
                )}
                <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm">
                   <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                     <Camera className="w-6 h-6 text-white" />
                   </div>
                </div>
              </div>
            </div>
            <input 
              type="file" 
              id="avatar-input" 
              className="hidden" 
              accept="image/*"
              onChange={handleAvatarUpload}
            />
            {userData?.isPremium && (
              <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center border-4 border-slate-950 shadow-xl animate-bounce-slow">
                <Crown className="w-6 h-6 text-white" />
              </div>
            )}
          </div>

          <div className="w-full max-w-xs animate-fade-in-up">
            {isEditing ? (
              <div className="space-y-3 p-2 bg-white/5 rounded-[2.5rem] border border-white/5 backdrop-blur-md">
                <input 
                  value={editForm.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="bg-transparent text-white px-6 py-4 w-full text-center font-black text-xl focus:outline-none placeholder:text-white/10"
                  placeholder={t('profile.name')}
                  autoFocus
                />
              </div>
            ) : (
              <div className="group">
                <div className="flex items-center justify-center gap-3 mb-1">
                  <h2 className="text-white font-black text-3xl tracking-tight group-hover:text-orange-400 transition-colors">{userData?.name || t('profile.user')}</h2>
                  <button 
                    onClick={() => setIsEditing(true)} 
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 active:scale-90"
                  >
                    <Edit2 className="w-4 h-4 text-white/40" />
                  </button>
                </div>
                <p className="text-white/20 text-xs font-bold uppercase tracking-[0.2em] mb-8">{userData?.email}</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {stats.map((stat, idx) => (
            <div 
              key={idx} 
              className="bg-white/5 border border-white/5 backdrop-blur-md rounded-[2.2rem] p-5 text-center group hover:bg-white/10 transition-all duration-300 animate-scale-in"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-orange-500/10 transition-all">
                <stat.icon className="w-6 h-6 text-orange-400" />
              </div>
              <p className="text-2xl font-black text-white mb-0.5 leading-none">{stat.value}</p>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest leading-tight mt-2">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Premium Banner */}
        <div 
          onClick={() => setShowPremiumModal(true)}
          className={`group relative rounded-[2.5rem] p-8 flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] overflow-hidden animate-fade-in-up ${
            userData?.isPremium 
              ? 'bg-white/5 border border-white/10' 
              : 'bg-gradient-to-br from-indigo-600 to-blue-700 shadow-2xl shadow-blue-500/30'
          }`}
          style={{ animationDelay: '0.3s' }}
        >
          <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
          
          <div className="flex items-center gap-6 relative z-10">
            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${userData?.isPremium ? 'bg-gradient-to-tr from-yellow-400 to-orange-500 shadow-orange-500/20' : 'bg-white/10 border border-white/10'}`}>
              <Crown className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-black text-white tracking-tight text-xl mb-1">
                {userData?.isPremium ? 'Premium Plus' : t('premium')}
              </h3>
              <p className="text-xs text-white/40 font-bold uppercase tracking-widest">
                {userData?.isPremium ? t('profile.enabled') : t('profile.unlockAll')}
              </p>
            </div>
          </div>
          
          {!userData?.isPremium && (
            <div className="bg-white text-indigo-600 text-[10px] font-black px-5 py-3 rounded-2xl shadow-2xl uppercase tracking-[0.2em] relative z-10 group-hover:scale-105 transition-transform">
              {t('premium.getButton')}
            </div>
          )}
        </div>
      </div>

      {/* Profile Details Section */}
      <div className="px-6 space-y-6 pb-12 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        <div className="bg-white/5 border border-white/5 rounded-[3rem] p-8 backdrop-blur-md">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500/10 rounded-2xl flex items-center justify-center border border-orange-500/20">
                <Shield className="w-5 h-5 text-orange-400" />
              </div>
              <h3 className="text-white font-black uppercase text-xs tracking-[0.2em]">{t('profile.personalInfo')}</h3>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-white/5 text-white/40 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                {t('profile.edit')}
              </button>
            )}
          </div>
          
          <div className="space-y-2">
            {[
              { label: t('profile.age'), key: 'age', unit: t('profile.years'), type: 'number' },
              { label: t('profile.gender'), key: 'gender', type: 'select' },
              { label: t('profile.weight'), key: 'weight', unit: t('common.kg'), type: 'number' },
              { label: t('profile.height'), key: 'height', unit: t('common.cm'), type: 'number' },
              { label: t('profile.goal'), key: 'goal', type: 'text', color: 'text-orange-400' }
            ].map((field, idx) => (
              <div key={idx} className="flex justify-between items-center py-5 border-b border-white/5 last:border-0 group">
                <span className="text-white/30 text-xs font-black uppercase tracking-widest">{field.label}</span>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    {field.type === 'select' ? (
                      <select 
                        value={editForm.gender}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        className="text-right bg-white/5 text-white font-black px-4 py-2 rounded-xl border border-white/10 focus:border-orange-500 outline-none appearance-none"
                      >
                        <option value="Чоловік" className="bg-slate-900">{t('profile.male')}</option>
                        <option value="Жінка" className="bg-slate-900">{t('profile.female')}</option>
                      </select>
                    ) : (
                      <input 
                        type={field.type}
                        value={editForm[field.key as keyof typeof editForm]}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                        className="text-right bg-white/5 text-white font-black px-4 py-2 rounded-xl border border-white/10 focus:border-orange-500 outline-none w-28"
                        placeholder="-"
                      />
                    )}
                    {field.unit && <span className="text-white/10 text-[10px] font-black uppercase">{field.unit}</span>}
                  </div>
                ) : (
                  <span className={`font-black tracking-tight ${field.color || 'text-white'}`}>
                    {userData[field.key] ? 
                      (field.key === 'gender' ? (userData.gender === 'Чоловік' || userData.gender === 'Male' ? t('profile.male') : t('profile.female')) : 
                      `${userData[field.key]} ${field.unit || ''}`) : 
                      '-'
                    }
                  </span>
                )}
              </div>
            ))}
          </div>
          {isEditing && (
            <div className="grid grid-cols-2 gap-3 mt-8">
              <button
                onClick={() => { resetEditFormFromUser(userData); setIsEditing(false); }}
                className="py-4 bg-white/5 text-white/40 rounded-2xl text-[10px] font-black uppercase tracking-widest"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleUpdateProfile}
                className="py-4 bg-white text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl"
              >
                {t('common.save')}
              </button>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="rounded-3xl overflow-hidden mb-4" style={{ background: 'var(--bg-card)', boxShadow: '0 2px 16px rgba(40,32,56,0.06)' }}>
          {[
            { Icon: Scale, color: 'var(--accent-exercise)', label: 'Вага тіла', sub: 'Відстежувати динаміку', screen: 'body-weight' },
            { Icon: Calendar, color: 'var(--accent-energy)', label: 'Календар тренувань', sub: 'Всі тренування по місяцях', screen: 'calendar' },
            { Icon: Users, color: 'var(--accent-stand)', label: 'Спільнота', sub: 'Ділитись прогресом', screen: 'social' },
            { Icon: Download, color: 'var(--accent-move)', label: 'Експорт даних', sub: 'Завантажити як CSV', screen: 'export' },
          ].map((item, i) => (
            <button key={item.screen} onClick={() => item.screen === 'export' ? exportCSV() : onNavigate(item.screen)}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 active:opacity-70 apple-text"
              style={{ borderBottom: i < 3 ? '0.5px solid var(--separator)' : 'none' }}>
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}1A` }}>
                <item.Icon className="w-5 h-5" style={{ color: item.color }} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-xs apple-text-2 mt-0.5">{item.sub}</p>
              </div>
              <ChevronRight className="w-4 h-4 apple-text-3" />
            </button>
          ))}
        </div>

        {/* Action Grid Section */}
        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={() => onNavigate('settings')}
            className="flex items-center justify-between p-8 bg-white/5 border border-white/5 rounded-[2.8rem] hover:bg-white/10 transition-all group active:scale-[0.98] backdrop-blur-md"
          >
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-white/5 rounded-[1.2rem] flex items-center justify-center group-hover:bg-orange-500/20 transition-all duration-500 group-hover:rotate-12">
                <Settings className="w-7 h-7 text-white/40 group-hover:text-orange-400 transition-colors" />
              </div>
              <div>
                <span className="text-white font-black text-lg tracking-tight block">{t('settings.title')}</span>
                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1 block">{t('settings.subtitle')}</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center group-hover:border-orange-500/30 group-hover:translate-x-1 transition-all">
              <svg className="w-5 h-5 text-white/20 group-hover:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center justify-center gap-4 p-8 bg-red-500/5 border border-red-500/10 rounded-[2.8rem] text-red-500 font-black uppercase tracking-[0.3em] text-[10px] hover:bg-red-500/10 transition-all active:scale-[0.98]"
          >
            <div className="w-10 h-10 bg-red-500/10 rounded-2xl flex items-center justify-center">
              <LogOut className="w-5 h-5" />
            </div>
            <span>{t('settings.logout')}</span>
          </button>
        </div>
      </div>
      
      <PremiumModal 
        isOpen={showPremiumModal} 
        onClose={() => setShowPremiumModal(false)}
        onSuccess={() => fetchProfile()}
        isPremium={userData?.isPremium}
      />
    </div>
  );
}
