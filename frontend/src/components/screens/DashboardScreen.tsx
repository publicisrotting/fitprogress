import { useState, useEffect } from 'react';
import { Bell, ChevronRight, Flame, Dumbbell, BarChart3, Zap, BookOpen, TrendingUp, Scale, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ScrollArea } from '../ui/scroll-area';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { ApiError, apiJson } from '../../config';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface DashboardScreenProps { onNavigate: (screen: string) => void; }

interface Notification {
  _id: string; title: string; text: string; read: boolean; createdAt: string;
}

export default function DashboardScreen({ onNavigate }: DashboardScreenProps) {
  const { t, language, units } = useSettings();
  const { token, logout } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState('');

  const weightUnit = units === 'imperial' ? 'lb' : 'kg';
  const localeMap: Record<string, string> = { ru: 'ru-RU', uk: 'uk-UA', en: 'en-US' };
  const locale = localeMap[language] || 'uk-UA';
  const unreadCount = notifications.filter(n => !n.read).length;

  const load = async () => {
    if (!token) return;
    setLoading(true); setError('');
    try {
      const [userData, dashData, notifData] = await Promise.all([
        apiJson<any>('/api/user/profile', { token }),
        apiJson<any>('/api/user/dashboard', { token }),
        apiJson<any>('/api/notifications', { token }).catch(() => []),
      ]);
      setData({ ...dashData, user: userData });
      const n = Array.isArray(notifData) ? notifData : (notifData?.notifications || []);
      setNotifications(n);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) { logout(); return; }
      setError('Network error');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [token]);

  const markAllRead = async () => {
    await apiJson('/api/notifications/mark-all-read', { method: 'PUT', token }).catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center apple-bg">
      <div className="w-8 h-8 rounded-full border-2 border-[--accent-move] border-t-transparent animate-spin" />
    </div>
  );

  if (error) return (
    <div className="h-full flex flex-col items-center justify-center apple-bg px-6 gap-4">
      <p className="apple-text-2 text-center">{error}</p>
      <button onClick={load} className="px-6 py-3 rounded-2xl font-semibold text-white" style={{ background: 'var(--accent-move)' }}>
        {t('common.retry')}
      </button>
    </div>
  );

  const streak = data?.user?.stats?.streak || 0;
  const workoutsMonth = data?.stats?.workoutsThisMonth || 0;
  const totalReps = data?.stats?.totalReps || 0;
  const weight = data?.user?.weight || 0;
  const name = data?.user?.name || '';
  const picture = data?.user?.picture || '';

  // Week streak
  const weekStreakSource: { date: string; completed: boolean }[] = Array.isArray(data?.stats?.weekStreak) ? data.stats.weekStreak : [];
  const weekDaysRaw = t('dashboard.weekDays');
  const weekDayLabels: string[] = Array.isArray(weekDaysRaw) ? weekDaysRaw : ['M','T','W','T','F','S','S'];
  const today = new Date();
  const currentDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const weekStreak = weekDayLabels.map((dayLabel: string, idx: number) => {
    const d = new Date(today);
    const diff = (idx + 1) - (today.getDay() === 0 ? 7 : today.getDay());
    d.setDate(today.getDate() + diff);
    const dateStr = d.toISOString().split('T')[0];
    const entry = weekStreakSource.find((s: any) => s.date === dateStr);
    return { day: dayLabel, completed: entry ? Boolean(entry.completed) : false, isToday: idx === currentDayIndex };
  });

  // Activity ring progress (move ring = workouts this month / 20 target)
  const moveProgress = Math.min(workoutsMonth / 20, 1);
  const exerciseProgress = Math.min(totalReps / 10000, 1);
  const standProgress = Math.min(streak / 7, 1);

  const Ring = ({ r, progress, color, strokeWidth = 8 }: { r: number; progress: number; color: string; strokeWidth?: number }) => {
    const circ = 2 * Math.PI * r;
    const dash = circ * progress;
    return (
      <g>
        <circle cx={60} cy={60} r={r} fill="none" stroke={color} strokeOpacity={0.15} strokeWidth={strokeWidth} />
        <circle cx={60} cy={60} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ * 0.25}
          strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease' }} />
      </g>
    );
  };

  return (
    <div className="h-full apple-bg overflow-y-auto pb-28">
      {/* Header */}
      <div className="px-5 pt-[calc(3rem+env(safe-area-inset-top))] pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium apple-text-2 mb-0.5">
              {new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}
            </p>
            <h1 className="text-3xl font-bold apple-text tracking-tight">
              {name ? `${t('dashboard.hello')}, ${name.split(' ')[0]}` : 'FitProgress'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="relative w-10 h-10 rounded-full flex items-center justify-center apple-card active:scale-90 transition-transform" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }}>
                  <Bell className="w-5 h-5 apple-text-2" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: 'var(--accent-move)' }} />
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 border-0 shadow-2xl rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)' }} align="end" sideOffset={8}>
                <div className="p-4 flex items-center justify-between" style={{ borderBottom: '0.5px solid var(--separator)' }}>
                  <h4 className="font-semibold apple-text">{t('dashboard.notificationsTitle')}</h4>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs font-medium" style={{ color: 'var(--accent-stand)' }}>
                      {t('dashboard.markAllRead')}
                    </button>
                  )}
                </div>
                <ScrollArea className="max-h-72">
                  {notifications.length === 0 ? (
                    <div className="py-10 text-center">
                      <Bell className="w-8 h-8 mx-auto mb-3 apple-text-3" />
                      <p className="text-sm apple-text-2">{t('dashboard.notificationsEmpty')}</p>
                    </div>
                  ) : notifications.map(n => (
                    <div key={n._id} className="px-4 py-3 flex gap-3" style={{ borderBottom: '0.5px solid var(--separator)' }}>
                      {!n.read && <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--accent-move)' }} />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold apple-text truncate">{n.title}</p>
                        <p className="text-xs apple-text-2 mt-0.5 leading-relaxed">{n.text}</p>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </PopoverContent>
            </Popover>

            {/* Avatar */}
            <button onClick={() => onNavigate('profile')} className="w-10 h-10 rounded-full overflow-hidden active:scale-90 transition-transform" style={{ boxShadow: '0 0 0 2px var(--accent-move)' }}>
              {picture ? (
                <ImageWithFallback src={picture} alt="Avatar" className="w-full h-full object-cover"
                  fallback={<div className="w-full h-full flex items-center justify-center text-white text-base font-bold" style={{ background: 'var(--accent-move)' }}>{(name || 'U')[0].toUpperCase()}</div>} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-base font-bold" style={{ background: 'var(--accent-move)' }}>{(name || 'U')[0].toUpperCase()}</div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Activity Ring Card */}
      <div className="px-5 mb-4">
        <div className="apple-card rounded-3xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <div className="flex items-center gap-6">
            {/* Rings */}
            <div className="relative flex-shrink-0">
              <svg width="120" height="120" viewBox="0 0 120 120">
                <Ring r={52} progress={moveProgress}     color="var(--accent-move)"     strokeWidth={9} />
                <Ring r={40} progress={exerciseProgress} color="var(--accent-exercise)" strokeWidth={9} />
                <Ring r={28} progress={standProgress}    color="var(--accent-stand)"    strokeWidth={9} />
              </svg>
            </div>

            {/* Ring labels */}
            <div className="flex flex-col gap-3 flex-1">
              {[
                { label: t('dashboard.prMonth') || 'Workouts',  value: workoutsMonth, unit: 'this month', color: 'var(--accent-move)' },
                { label: t('dashboard.reps') || 'Total Reps',   value: totalReps.toLocaleString(), unit: 'reps', color: 'var(--accent-exercise)' },
                { label: 'Streak',                               value: streak, unit: 'days', color: 'var(--accent-stand)' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                  <div>
                    <span className="text-lg font-bold apple-text leading-none">{item.value} </span>
                    <span className="text-xs apple-text-2">{item.unit}</span>
                    <p className="text-[11px] apple-text-3 mt-0">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Streak */}
      <div className="px-5 mb-4">
        <div className="apple-card rounded-3xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4" style={{ color: 'var(--accent-energy)' }} />
              <span className="text-sm font-semibold apple-text">{t('dashboard.workoutStreak')}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold" style={{ color: 'var(--accent-energy)' }}>{streak}</span>
              <Flame className="w-4 h-4" style={{ color: 'var(--accent-energy)', fill: 'var(--accent-energy)' }} />
            </div>
          </div>
          <div className="flex justify-between">
            {weekStreak.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: day.completed ? 'var(--accent-move)' : 'var(--bg-card2)',
                    color: day.completed ? '#fff' : 'var(--text-tertiary)',
                    outline: day.isToday ? '2px solid var(--accent-move)' : 'none',
                    outlineOffset: '2px',
                  }}
                >
                  {day.completed && <Check className="w-4 h-4" strokeWidth={3} />}
                </div>
                <span className="text-[10px] font-medium apple-text-3">{day.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Start button */}
      <div className="px-5 mb-4">
        <button
          onClick={() => onNavigate('diary')}
          className="w-full py-4 rounded-2xl text-white font-semibold text-base active:scale-[0.98] transition-transform"
          style={{ background: 'var(--accent-move)', boxShadow: '0 4px 16px rgba(255,55,95,0.35)' }}
        >
          {t('dashboard.startWorkout')}
        </button>
      </div>

      {/* Quick nav grid */}
      <div className="px-5 mb-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'diary',      icon: Dumbbell, label: t('dashboard.diary'),      sub: t('dashboard.workouts'),  color: 'var(--accent-move)' },
            { id: 'generator',  icon: Zap,      label: t('dashboard.generator'),  sub: t('dashboard.programs'),  color: 'var(--accent-energy)' },
            { id: 'statistics', icon: BarChart3, label: t('dashboard.statistics'), sub: t('dashboard.progress'),  color: 'var(--accent-stand)' },
            { id: 'library',    icon: BookOpen,  label: t('dashboard.library'),    sub: t('dashboard.exercises'), color: 'var(--accent-exercise)' },
          ].map(item => (
            <button key={item.id} onClick={() => onNavigate(item.id)}
              className="apple-card rounded-2xl p-4 text-left active:scale-95 transition-transform flex items-start gap-3"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: item.color + '18' }}>
                <item.icon className="w-5 h-5" style={{ color: item.color }} />
              </div>
              <div>
                <p className="text-sm font-semibold apple-text">{item.label}</p>
                <p className="text-xs apple-text-3 mt-0.5">{item.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Today's workouts */}
      {(data?.todayWorkouts || []).length > 0 && (
        <div className="px-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold apple-text">{t('dashboard.todaysActivity')}</span>
            <button onClick={() => onNavigate('diary')} className="text-sm font-medium" style={{ color: 'var(--accent-stand)' }}>
              {t('dashboard.viewAll')}
            </button>
          </div>
          <div className="apple-card rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            {data.todayWorkouts.map((w: any, i: number) => (
              <button key={w._id} onClick={() => onNavigate('diary')}
                className="w-full flex items-center gap-3 px-4 py-3.5 active:opacity-70"
                style={{ borderBottom: i < data.todayWorkouts.length - 1 ? '0.5px solid var(--separator)' : 'none' }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-move)' + '18' }}>
                  <Dumbbell className="w-5 h-5" style={{ color: 'var(--accent-move)' }} />
                </div>
                <span className="flex-1 text-sm font-medium apple-text text-left">{w.name}</span>
                <ChevronRight className="w-4 h-4 apple-text-3" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Weight tracker */}
      <div className="px-5 mb-4">
        <button onClick={() => onNavigate('body-weight')}
          className="w-full apple-card rounded-2xl px-4 py-3.5 flex items-center gap-3 active:opacity-70" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-exercise)20' }}>
            <Scale className="w-5 h-5" style={{ color: 'var(--accent-exercise)' }} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-xs apple-text-3">{t('dashboard.weight')}</p>
            <p className="text-sm font-semibold apple-text">{weight > 0 ? `${weight} ${weightUnit}` : 'Натисни щоб відстежувати'}</p>
          </div>
          <ChevronRight className="w-4 h-4 apple-text-3" />
        </button>
      </div>
    </div>
  );
}
