import { useState, useEffect } from 'react';
import { ChevronLeft, Award, TrendingUp, Calendar, Dumbbell, ChevronRight, Trophy } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';

export default function StatisticsScreen({ onNavigate, showHeader = true }: { onNavigate: (s: string) => void; showHeader?: boolean }) {
  const { t, language } = useSettings();
  const { token } = useAuth();
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({ volumeData: [], personalRecords: [], stats: {}, muscleGroupData: [] });

  const localeMap: Record<string, string> = { ru: 'ru-RU', uk: 'uk-UA', en: 'en-US' };
  const locale = localeMap[language] || 'uk-UA';

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/workouts/stats`, { headers: { 'x-auth-token': token } })
      .then(r => r.json()).then(d => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const periodStart = () => {
    const now = new Date();
    if (period === 'week') { const d = new Date(now); d.setDate(now.getDate() - ((now.getDay()+6)%7)); d.setHours(0,0,0,0); return d; }
    if (period === 'year') return new Date(now.getFullYear(), 0, 1);
    return new Date(now.getFullYear(), now.getMonth(), 1);
  };

  const volumeData = (stats.volumeData || []).map((i: any) => ({
    ...i,
    date: i.rawDate ? new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short' }).format(new Date(i.rawDate)) : i.date
  }));
  const filtered = volumeData.filter((i: any) => i.rawDate ? new Date(i.rawDate) >= periodStart() : true);
  const totalVol = filtered.reduce((a: number, i: any) => a + (Number(i.volume) || 0), 0);
  const totalWorkouts = filtered.length;

  const muscleColors: Record<string, string> = {
    Chest: '#6D4AFF', Back: '#FF6B4A', Legs: '#22C55E', Shoulders: '#6D4AFF', Arms: '#FF6B4A', Core: '#22C55E'
  };
  const muscleData = (stats.muscleGroupData || []).map((g: any) => ({
    ...g, color: muscleColors[g.name] || '#888'
  }));

  const translateMuscle = (name: string) => {
    const map: Record<string, string> = {
      Chest: t('statistics.muscleGroups.chest'), Back: t('statistics.muscleGroups.back'),
      Legs: t('statistics.muscleGroups.legs'), Shoulders: t('statistics.muscleGroups.shoulders'),
      Arms: t('statistics.muscleGroups.arms'), Core: t('library.abs')
    };
    return map[name] || name;
  };

  const periods: { id: 'week' | 'month' | 'year'; label: string }[] = [
    { id: 'week', label: t('statistics.periods.week') },
    { id: 'month', label: t('statistics.periods.month') },
    { id: 'year', label: t('statistics.periods.year') },
  ];

  if (loading) return (
    <div className="h-full apple-bg flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent-stand)', borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div className="h-full apple-bg overflow-y-auto pb-28">
      {showHeader && (
        <div className="px-5 pt-[calc(3rem+env(safe-area-inset-top))] pb-4">
          <div className="flex items-center gap-3 mb-1">
            <button onClick={() => onNavigate('dashboard')} className="w-9 h-9 apple-card rounded-full flex items-center justify-center active:scale-90 transition-transform" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
              <ChevronLeft className="w-5 h-5 apple-text-2" />
            </button>
            <h1 className="text-2xl font-bold apple-text">{t('statistics.title')}</h1>
          </div>
        </div>
      )}

      <div className="px-5 space-y-5">
        {/* Period selector */}
        <div className="flex p-1 rounded-xl apple-card gap-1" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          {periods.map(p => (
            <button key={p.id} onClick={() => setPeriod(p.id)}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: period === p.id ? 'var(--accent-stand)' : 'transparent',
                color: period === p.id ? '#fff' : 'var(--text-secondary)',
              }}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Key stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Dumbbell,   value: (totalVol/1000).toFixed(1)+'k', label: t('statistics.stats.totalVolume'), color: 'var(--accent-stand)' },
            { icon: Calendar,   value: totalWorkouts,                  label: t('statistics.stats.workouts'),    color: 'var(--accent-exercise)' },
            { icon: Award,      value: (stats.personalRecords||[]).length, label: t('statistics.stats.newRecords'), color: 'var(--accent-energy)' },
          ].map((s, i) => (
            <div key={i} className="apple-card rounded-2xl p-4 flex flex-col gap-2" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: s.color + '20' }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <p className="text-2xl font-bold apple-text leading-none">{s.value}</p>
              <p className="text-[11px] apple-text-3 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Volume chart */}
        <div className="apple-card rounded-2xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent-stand)' }} />
            <h3 className="text-base font-semibold apple-text">{t('statistics.trainingVolume')}</h3>
          </div>
          {filtered.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filtered} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--separator)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} dy={6} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-card)', border: '0.5px solid var(--separator)', borderRadius: 12, color: 'var(--text-primary)', fontSize: 13 }}
                    cursor={{ fill: 'var(--separator)', radius: 4 }}
                  />
                  <Bar dataKey="volume" fill="var(--accent-stand)" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-40 flex flex-col items-center justify-center gap-2">
              <Dumbbell className="w-8 h-8 apple-text-3" />
              <p className="text-sm apple-text-3">{t('statistics.noData')}</p>
            </div>
          )}
        </div>

        {/* Muscle distribution */}
        {muscleData.length > 0 && (
          <div className="apple-card rounded-2xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h3 className="text-base font-semibold apple-text mb-5">{t('statistics.muscleDistribution')}</h3>
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={muscleData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={4} dataKey="value">
                      {muscleData.map((g: any, i: number) => <Cell key={i} fill={g.color} stroke="none" />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {muscleData.map((g: any, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: g.color }} />
                    <span className="text-xs apple-text flex-1">{translateMuscle(g.name)}</span>
                    <span className="text-xs font-semibold apple-text-2">{g.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Calendar */}
        <button onClick={() => onNavigate('calendar')}
          className="w-full apple-card rounded-2xl flex items-center gap-4 px-4 py-4 active:opacity-70" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-energy)20' }}>
            <Calendar className="w-5 h-5" style={{ color: 'var(--accent-energy)' }} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold apple-text">Календар тренувань</p>
            <p className="text-xs apple-text-3 mt-0.5">Всі дні активності по місяцях</p>
          </div>
          <ChevronRight className="w-4 h-4 apple-text-3" />
        </button>

        {/* Exercise Progress */}
        <button onClick={() => onNavigate('exercise-progress')}
          className="w-full apple-card rounded-2xl flex items-center gap-4 px-4 py-4 active:opacity-70" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-move)20' }}>
            <TrendingUp className="w-5 h-5" style={{ color: 'var(--accent-move)' }} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold apple-text">Прогрес по вправі</p>
            <p className="text-xs apple-text-3 mt-0.5">Графік + 1RM калькулятор</p>
          </div>
          <ChevronRight className="w-4 h-4 apple-text-3" />
        </button>

        {/* Personal Records */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold apple-text">{t('statistics.personalRecords')}</h3>
            <Award className="w-4 h-4" style={{ color: 'var(--accent-energy)' }} />
          </div>
          {(stats.personalRecords || []).length > 0 ? (
            <div className="apple-card rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              {stats.personalRecords.map((rec: any, i: number) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3.5"
                  style={{ borderBottom: i < stats.personalRecords.length - 1 ? '0.5px solid var(--separator)' : 'none' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent-energy)1A' }}>
                    <Trophy className="w-5 h-5" style={{ color: 'var(--accent-energy)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium apple-text truncate">{rec.exercise}</p>
                    <p className="text-xs apple-text-3 mt-0.5">{rec.date}</p>
                  </div>
                  <p className="text-sm font-bold" style={{ color: 'var(--accent-energy)' }}>{rec.weight}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="apple-card rounded-2xl p-8 text-center" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <Award className="w-8 h-8 mx-auto mb-2 apple-text-3" />
              <p className="text-sm apple-text-3">{t('statistics.noRecords')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
