import { useState, useEffect } from 'react';
import { ChevronLeft, TrendingUp, TrendingDown, Calendar, Award, Dumbbell } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';

interface StatisticsScreenProps {
  onNavigate: (screen: string) => void;
  showHeader?: boolean;
}

export default function StatisticsScreen({ onNavigate, showHeader = true }: StatisticsScreenProps) {
  const { t, language } = useSettings();
  const { token } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('volume'); // Default to volume as we have data for it
  const [loading, setLoading] = useState(true);
  
  const [statsData, setStatsData] = useState<any>({
    volumeData: [],
    personalRecords: [],
    stats: {
      totalVolume: 0,
      totalWorkouts: 0,
      thisMonthWorkouts: 0
    },
    muscleGroupData: []
  });

  useEffect(() => {
    if (!token) return;

    fetch(`${API_URL}/api/workouts/stats`, {
      headers: { 'x-auth-token': token }
    })
      .then(res => res.json())
      .then(data => {
        setStatsData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [token]);

  const periods = [
    { id: 'week', label: t('statistics.periods.week') },
    { id: 'month', label: t('statistics.periods.month') },
    { id: 'year', label: t('statistics.periods.year') },
  ];

  const localeMap: Record<string, string> = {
    ru: 'ru-RU',
    uk: 'uk-UA',
    en: 'en-US'
  };
  const locale = localeMap[language] || 'uk-UA';
  const formatDateLabel = (value: string) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short' }).format(d);
  };
  const translateMuscle = (value: string) => {
    const key = value.toLowerCase();
    const map: Record<string, string> = {
      chest: t('statistics.muscleGroups.chest'),
      back: t('statistics.muscleGroups.back'),
      legs: t('statistics.muscleGroups.legs'),
      shoulders: t('statistics.muscleGroups.shoulders'),
      arms: t('statistics.muscleGroups.arms'),
      core: t('library.abs')
    };
    return map[key] || value;
  };

  const volumeData = (statsData.volumeData || []).map((item: any) => ({
    ...item,
    date: item.rawDate ? formatDateLabel(item.rawDate) : item.date
  }));
  const muscleGroupData = (statsData.muscleGroupData || []).map((item: any) => ({
    ...item,
    name: translateMuscle(item.name)
  }));
  const personalRecords = statsData.personalRecords || [];

  const getPeriodStart = () => {
    const now = new Date();
    if (selectedPeriod === 'week') {
      const day = (now.getDay() + 6) % 7;
      const start = new Date(now);
      start.setDate(now.getDate() - day);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    if (selectedPeriod === 'year') {
      return new Date(now.getFullYear(), 0, 1);
    }
    return new Date(now.getFullYear(), now.getMonth(), 1);
  };

  const getFilteredVolumeData = () => {
    if (!volumeData.length) return [];
    const startDate = getPeriodStart();
    return volumeData.filter((item: any) => {
      const itemDate = new Date(item.rawDate);
      return itemDate >= startDate;
    });
  };

  const filteredVolumeData = getFilteredVolumeData();

  const filteredTotalVolume = filteredVolumeData.reduce((acc: number, item: any) => acc + (Number(item.volume) || 0), 0);
  const filteredWorkouts = filteredVolumeData.length;
  const selectedLabel = periods.find(p => p.id === selectedPeriod)?.label || '';

  const stats = [
    {
      label: t('statistics.stats.totalVolume'),
      value: (filteredTotalVolume / 1000).toFixed(1) + 'k',
      unit: t('common.kg'),
      change: selectedLabel,
      trending: 'up',
      icon: Dumbbell,
    },
    {
      label: t('statistics.stats.workouts'),
      value: filteredWorkouts,
      unit: t('statistics.stats.total'),
      change: selectedLabel,
      trending: 'up',
      icon: Calendar,
    },
    {
      label: t('statistics.stats.newRecords'),
      value: personalRecords.length,
      unit: t('statistics.stats.prs'),
      change: '',
      trending: 'up',
      icon: Award,
    },
  ];

  if (loading) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-950 overflow-y-auto pb-24 relative overflow-x-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[40%] aspect-square bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />

      {showHeader && (
        <div className="relative z-10 px-6 pt-[calc(3rem+env(safe-area-inset-top))] pb-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => onNavigate('dashboard')}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all active:scale-95"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <div>
              <h1 className="text-white text-2xl font-bold tracking-tight">{t('statistics.title')}</h1>
              <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">
                {t('statistics.subtitle')}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={`${showHeader ? 'px-6 pb-6' : 'px-6 py-4'} relative z-10`}>
        {/* Period Selector */}
        <div className="flex gap-2 mb-8 bg-white/5 p-1.5 rounded-2xl border border-white/5">
          {periods.map((period) => (
            <button
              key={period.id}
              onClick={() => setSelectedPeriod(period.id)}
              className={`flex-1 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-widest ${
                selectedPeriod === period.id
                  ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                  : 'text-white/40 hover:text-white/60 hover:bg-white/5'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-1 gap-4 mb-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white/5 border border-white/5 rounded-[2rem] p-6 backdrop-blur-md group hover:bg-white/[0.08] transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <stat.icon className="w-7 h-7 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">{stat.label}</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-black text-white">{stat.value}</p>
                      <p className="text-xs font-bold text-white/40 uppercase">{stat.unit}</p>
                    </div>
                  </div>
                </div>
                {stat.change && (
                  <div className={`flex flex-col items-end ${
                    stat.trending === 'up' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    <div className="flex items-center gap-1 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                      <TrendingUp className="w-3 h-3" />
                      <span className="text-[10px] font-black">{stat.change}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Volume / Progress Chart */}
        <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-6 mb-8 backdrop-blur-md">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-white font-bold tracking-tight">{t('statistics.trainingVolume')}</h3>
            <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center border border-purple-500/20">
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          
          <div className="h-64">
            {filteredVolumeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredVolumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)', fontWeight: 'bold' }} 
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)', fontWeight: 'bold' }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '16px',
                      backdropFilter: 'blur(10px)',
                      color: 'white',
                      fontWeight: 'bold',
                    }}
                    itemStyle={{ color: '#a855f7' }}
                  />
                  <Bar 
                    dataKey="volume" 
                    fill="url(#colorVolume)" 
                    radius={[10, 10, 0, 0]} 
                    barSize={selectedPeriod === 'year' ? 10 : 25}
                  />
                  <defs>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-white/20">
                <Dumbbell className="w-10 h-10 mb-4 opacity-10" />
                <p className="text-sm font-bold uppercase tracking-widest">{t('statistics.noData')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Muscle Group Distribution */}
        <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-6 mb-8 backdrop-blur-md">
          <h3 className="text-white font-bold tracking-tight mb-8">{t('statistics.muscleDistribution')}</h3>
          
          {muscleGroupData.length > 0 ? (
            <>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={muscleGroupData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {muscleGroupData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '16px',
                        color: 'white',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                {muscleGroupData.map((group: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: group.color }}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-white/30 uppercase tracking-wider truncate">{group.name}</p>
                      <p className="text-sm font-bold text-white">{group.value} <span className="text-[10px] text-white/40">{t('statistics.setsLabel')}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-40 flex flex-col items-center justify-center text-white/20">
               <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/5">
                 <Calendar className="w-6 h-6 opacity-20" />
               </div>
               <p className="text-xs font-bold uppercase tracking-widest text-center px-8">
                 {t('statistics.noDistribution')}
               </p>
            </div>
          )}
        </div>

        {/* Personal Records */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white text-xl font-bold tracking-tight">{t('statistics.personalRecords')}</h3>
            <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center border border-yellow-500/20">
              <Award className="w-5 h-5 text-yellow-500" />
            </div>
          </div>

          {personalRecords.length > 0 ? (
            <div className="space-y-4">
              {personalRecords.map((record: any, idx: number) => (
                <div key={idx} className="bg-white/5 border border-white/5 rounded-[2rem] p-5 backdrop-blur-md group hover:bg-white/[0.08] transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-orange-500/20">
                        🏆
                      </div>
                      <div>
                        <p className="text-white font-bold group-hover:text-yellow-400 transition-colors">{record.exercise}</p>
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mt-1">{record.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-purple-400 leading-tight">{record.weight}</p>
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter mt-1">{record.improvement}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="text-center py-12 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
               <Award className="w-10 h-10 text-white/10 mx-auto mb-4" />
               <p className="text-white/30 text-sm font-bold uppercase tracking-widest">{t('statistics.noRecords')}</p>
             </div>
          )}
        </div>

        {/* Export Button */}
        <button className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black py-5 rounded-[2rem] transition-all shadow-xl shadow-purple-500/20 active:scale-[0.98] uppercase tracking-[0.2em] text-xs">
          {t('statistics.export')}
        </button>
      </div>
    </div>
  );
}
