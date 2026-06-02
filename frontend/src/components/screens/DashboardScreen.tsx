import { useState, useEffect } from 'react';
import { Bell, TrendingUp, Dumbbell, Book, Trophy, Calendar, ChevronRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ScrollArea } from "../ui/scroll-area";
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { ApiError, apiJson } from '../../config';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface DashboardScreenProps {
  onNavigate: (screen: string) => void;
}

interface DashboardData {
  user: {
    name: string;
    picture: string;
    weight: number;
    stats: {
        workouts: number;
        achievements: number;
        streak: number;
    };
  };
  stats: {
    totalReps: number;
    workoutsThisMonth: number;
    weekStreak: { date: string; completed: boolean }[];
  };
  todayWorkouts: {
    _id: string;
    name: string;
    details: string;
    completed: boolean;
  }[];
}

interface Notification {
  _id: string;
  title: string;
  text: string;
  read: boolean;
  createdAt: string;
  type?: string;
}

export default function DashboardScreen({ onNavigate }: DashboardScreenProps) {
  const { t, language, units } = useSettings();
  const { token, logout } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState<string>('');

  const unreadCount = notifications.filter((n) => !n.read).length;
  const localeMap: Record<string, string> = {
    ru: 'ru-RU',
    uk: 'uk-UA',
    en: 'en-US'
  };
  const locale = localeMap[language] || 'uk-UA';
  const weightUnit = units === 'imperial' ? t('common.lb') : t('common.kg');

  const loadDashboard = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const [userData, dashboardData, notifData] = await Promise.all([
        apiJson<any>('/api/user/profile', { token }),
        apiJson<any>('/api/user/dashboard', { token }),
        apiJson<any>('/api/notifications', { token }).catch(() => [])
      ]);

      setData({
        ...dashboardData,
        user: userData
      });

      if (Array.isArray(notifData)) setNotifications(notifData);
      else if (notifData && Array.isArray(notifData.notifications)) setNotifications(notifData.notifications);
      else setNotifications([]);

    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setError(t('common.networkError') || 'Network error');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiJson('/api/notifications/mark-all-read', { method: 'PUT', token });
      setNotifications((prev: any) => Array.isArray(prev) ? prev.map((n: any) => ({ ...n, read: true })) : []);
    } catch {
    }
  };

  useEffect(() => {
    if (!token) return;
    loadDashboard();
  }, [token]);

  const getTodayWorkout = () => {
    if (!data?.todayWorkouts || !Array.isArray(data.todayWorkouts)) return null;
    return data.todayWorkouts[0]; // Take the first one for the banner
  };

  const todayWorkout = getTodayWorkout();

  if (loading) {
    return (
      <div className="h-full bg-[#262135] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full bg-[#262135] flex flex-col items-center justify-center text-center px-6">
        <p className="text-white/80 mb-4">{error}</p>
        <button
          onClick={loadDashboard}
          className="px-4 py-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors"
        >
          {t('common.loading')}
        </button>
      </div>
    );
  }

  const todayWorkouts = data?.todayWorkouts || [];

  const quickStats = [
    { 
      label: t('dashboard.weight'), 
      value: (data?.user?.weight || 0) + ' ' + weightUnit, 
      change: '0%', 
      icon: TrendingUp 
    },
    { 
      label: t('dashboard.reps'), 
      value: (data?.stats?.totalReps || 0).toLocaleString(), 
      change: '', 
      icon: Dumbbell 
    },
    { 
      label: t('dashboard.prMonth'), 
      value: (data?.stats?.workoutsThisMonth || 0).toString(), 
      change: '', 
      icon: Trophy 
    },
  ];

  const weekDaysRaw = t('dashboard.weekDays');
  const normalizedWeekDays = Array.isArray(weekDaysRaw) ? weekDaysRaw : [];
  const weekStreakSource = Array.isArray(data?.stats?.weekStreak) ? data?.stats?.weekStreak : [];
  
  // Create a localized date-based streak
  const weekStreak = normalizedWeekDays.map((dayLabel: string, idx: number) => {
    // We assume the week starts from Monday (index 0) to Sunday (index 6)
    // Find the date for this day in the current week
    const d = new Date();
    const dayOfWeek = d.getDay(); // 0 is Sunday, 1-6 is Mon-Sat
    const diff = (idx + 1) - (dayOfWeek === 0 ? 7 : dayOfWeek);
    const targetDate = new Date(d);
    targetDate.setDate(d.getDate() + diff);
    const dateStr = targetDate.toISOString().split('T')[0];
    
    // Check if this date is in the weekStreakSource
    const streakEntry = weekStreakSource.find((s: any) => s.date === dateStr);
    
    return {
      day: dayLabel,
      completed: streakEntry ? Boolean(streakEntry.completed) : false,
      date: dateStr
    };
  });

  const today = new Date();
  const currentDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;

  return (
    <div className="h-full bg-slate-950 overflow-y-auto pb-24 relative overflow-x-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-orange-500/10 to-transparent pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[40%] aspect-square bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute top-[20%] left-[-10%] w-[30%] aspect-square bg-purple-600/10 blur-[80px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 p-6 pt-[calc(3rem+env(safe-area-inset-top))] animate-fade-in-up">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-white/60 text-sm font-medium mb-1 tracking-wide uppercase">{t('dashboard.hello')}</h1>
            <h2 className="text-white text-3xl font-bold tracking-tight">
              {data?.user?.name || t('profile.user')}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <button className="relative p-2.5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all outline-none border border-white/5 group active:scale-95">
                  <Bell className="w-6 h-6 text-white/80 group-hover:text-white transition-colors" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(249,115,22,0.8)] border-2 border-slate-950"></span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[calc(100vw-2rem)] sm:w-80 bg-slate-900/95 border-white/10 text-white p-0 shadow-2xl backdrop-blur-xl" align="end" sideOffset={10}>
                <div className="p-4 border-b border-white/5 flex justify-between items-center">
                  <h4 className="font-bold text-white tracking-tight">{t('dashboard.notificationsTitle')}</h4>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-xs text-orange-400 hover:text-orange-300 transition-colors font-semibold uppercase tracking-wider">
                      {t('dashboard.markAllRead')}
                    </button>
                  )}
                </div>
                <ScrollArea className="max-h-[350px]">
                  {!Array.isArray(notifications) || notifications.length === 0 ? (
                    <div className="py-12 px-8 text-center">
                      <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bell className="w-6 h-6 text-white/20" />
                      </div>
                      <p className="text-white/40 text-sm font-medium">{t('dashboard.notificationsEmpty')}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {notifications.map((notification) => (
                        <div 
                          key={notification._id} 
                          className={`p-4 border-b border-white/5 hover:bg-white/5 transition-all cursor-pointer group relative ${!notification.read ? 'bg-white/[0.03]' : ''}`}
                        >
                          {!notification.read && (
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-orange-500" />
                          )}
                          <div className="flex justify-between items-start gap-3">
                            <div>
                               <h5 className={`text-sm font-bold mb-1 ${!notification.read ? 'text-white' : 'text-white/70'}`}>
                                  {notification.title}
                               </h5>
                               <p className={`text-sm leading-relaxed ${!notification.read ? 'text-white/90' : 'text-white/50'}`}>
                                  {notification.text}
                               </p>
                            </div>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-1.5 shadow-[0_0_8px_rgba(249,115,22,0.6)]"></span>
                            )}
                          </div>
                          <p className="text-[10px] uppercase font-bold tracking-widest text-white/20 mt-3 group-hover:text-white/40 transition-colors">
                            {new Date(notification.createdAt).toLocaleString(locale, { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>
            <button 
              onClick={() => onNavigate('profile')} 
              className="relative p-0.5 bg-gradient-to-tr from-orange-500 to-pink-500 rounded-2xl active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 rounded-[14px] overflow-hidden bg-slate-900 border-2 border-slate-950">
                {data?.user?.picture ? (
                  <ImageWithFallback
                    src={data.user.picture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    fallback={
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center text-white text-xl font-bold">
                        {(data.user.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    }
                  />
                ) : (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center text-white text-xl font-bold">
                    {(data?.user?.name || t('profile.user')).charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </button>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 rounded-[2.8rem] p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/10 blur-3xl -mr-10 -mt-10" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">{t('dashboard.hello')}</p>
                  <h2 className="text-3xl font-black text-white tracking-tight">{data?.user?.name || t('profile.user')}</h2>
                </div>
                <button
                  onClick={() => onNavigate('diary')}
                  className="px-4 py-2 bg-white text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-full"
                >
                  {t('dashboard.startWorkout')}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {quickStats.map((stat, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className="text-lg font-black text-white">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => onNavigate('diary')}
              className="bg-white/5 border border-white/10 rounded-[2rem] p-6 text-left hover:bg-white/10 transition-all"
            >
              <Calendar className="w-6 h-6 text-orange-400 mb-3" />
              <p className="text-white font-black">{t('dashboard.diary')}</p>
              <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">{t('dashboard.workouts')}</p>
            </button>
            <button
              onClick={() => onNavigate('generator')}
              className="bg-white/5 border border-white/10 rounded-[2rem] p-6 text-left hover:bg-white/10 transition-all"
            >
              <Dumbbell className="w-6 h-6 text-indigo-400 mb-3" />
              <p className="text-white font-black">{t('dashboard.generator')}</p>
              <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">{t('dashboard.programs')}</p>
            </button>
            <button
              onClick={() => onNavigate('statistics')}
              className="bg-white/5 border border-white/10 rounded-[2rem] p-6 text-left hover:bg-white/10 transition-all"
            >
              <TrendingUp className="w-6 h-6 text-fuchsia-400 mb-3" />
              <p className="text-white font-black">{t('dashboard.statistics')}</p>
              <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">{t('dashboard.progress')}</p>
            </button>
            <button
              onClick={() => onNavigate('library')}
              className="bg-white/5 border border-white/10 rounded-[2rem] p-6 text-left hover:bg-white/10 transition-all"
            >
              <Book className="w-6 h-6 text-emerald-400 mb-3" />
              <p className="text-white font-black">{t('dashboard.library')}</p>
              <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">{t('dashboard.exercises')}</p>
            </button>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-black">{t('dashboard.todaysActivity')}</h3>
              <button
                onClick={() => onNavigate('diary')}
                className="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-500/10 px-4 py-2 rounded-full"
              >
                {t('dashboard.viewAll')}
              </button>
            </div>
            {todayWorkout ? (
              <button
                onClick={() => onNavigate('diary')}
                className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-5 text-left hover:bg-white/10 transition-all"
              >
                <p className="text-white font-black mb-1">{todayWorkout.name}</p>
                <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">{todayWorkout.details || t('dashboard.workouts')}</p>
              </button>
            ) : (
              <div className="bg-white/5 border border-white/10 border-dashed rounded-[2rem] p-6 text-center">
                <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-4">{t('dashboard.noWorkouts')}</p>
                <button
                  onClick={() => onNavigate('generator')}
                  className="px-6 py-3 bg-white text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-[1.5rem]"
                >
                  {t('dashboard.startWorkout')}
                </button>
              </div>
            )}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-black">{t('dashboard.workoutStreak')}</h3>
              <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{t('dashboard.weekDays')[currentDayIndex]}</span>
            </div>
            <div className="flex justify-between items-center">
              {weekStreak.map((day, idx) => {
                const isToday = idx === currentDayIndex;
                return (
                  <div key={idx} className="flex flex-col items-center gap-2">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${day.completed ? 'bg-orange-500 text-white' : 'bg-white/5 text-white/30'} ${isToday ? 'ring-2 ring-orange-500/40' : ''}`}>
                      {day.completed ? '✓' : ''}
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${isToday ? 'text-orange-500' : 'text-white/30'}`}>{day.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => onNavigate('gamification')}
            className="w-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-4 mb-20"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-white">{t('dashboard.achievements')}</p>
                  <p className="text-sm text-white/60">
                    {data?.user?.stats?.achievements || 0} {t('dashboard.earned')}
                  </p> 
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/60" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
