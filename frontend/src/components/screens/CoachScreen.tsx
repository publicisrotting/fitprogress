import { useState, useEffect } from 'react';
import { ChevronLeft, Brain, TrendingUp, AlertTriangle, CheckCircle, Zap, Activity, BarChart2, RefreshCw } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface CoachScreenProps {
  onNavigate: (screen: string) => void;
}

interface CoachData {
  suggestions: Array<{
    type: string;
    exercise: string;
    message: string;
    current: { weight: number; reps: number };
    suggested: { weight: number; reps: number };
  }>;
  recovery: { type: string; severity: string; days?: number } | null;
  deloadRecommended: boolean;
  daysSinceLastWorkout: number;
  weeklyVolume: Array<{ week: string; volume: number }>;
  totalExercisesTracked: number;
  message?: string;
}

const RECOVERY_CONFIG: Record<string, { color: string; icon: any; textKey: string }> = {
  trained_today: { color: 'blue', icon: CheckCircle, textKey: 'trainedToday' },
  good_recovery: { color: 'emerald', icon: CheckCircle, textKey: 'goodRecovery' },
  ready_to_train: { color: 'orange', icon: AlertTriangle, textKey: 'readyToTrain' },
  long_break: { color: 'red', icon: AlertTriangle, textKey: 'longBreak' },
};

export default function CoachScreen({ onNavigate }: CoachScreenProps) {
  const { t, units } = useSettings();
  const { token } = useAuth();
  const [data, setData] = useState<CoachData | null>(null);
  const [loading, setLoading] = useState(true);
  const weightUnit = units === 'imperial' ? 'lb' : 'kg';

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/workouts/coach`, {
        headers: { 'x-auth-token': token }
      });
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [token]);

  if (loading) {
    return (
      <div className="h-full bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  const recovery = data?.recovery;
  const cfg = recovery ? RECOVERY_CONFIG[recovery.type] : null;

  const formatWeek = (w: string) => {
    const parts = w.split('-W');
    return parts[1] ? `W${parts[1]}` : w;
  };

  return (
    <div className="h-full bg-slate-950 overflow-y-auto pb-24 relative overflow-x-hidden">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-600/10 to-transparent pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[40%] aspect-square bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 px-6 pt-[calc(3rem+env(safe-area-inset-top))] pb-8">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => onNavigate('dashboard')}
            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 active:scale-95"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-white text-2xl font-black tracking-tight leading-none mb-1">{t('coach.title')}</h1>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest">{t('coach.subtitle')}</p>
          </div>
          <button
            onClick={load}
            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 active:scale-95"
          >
            <RefreshCw className="w-5 h-5 text-white/60" />
          </button>
        </div>
      </div>

      <div className="relative z-10 px-6 space-y-6">
        {/* Empty state */}
        {data?.message === 'complete_first_workout' && (
          <div className="bg-white/5 border border-dashed border-white/10 rounded-[2.5rem] p-10 text-center">
            <Brain className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/50 font-bold mb-2">{t('coach.firstWorkout')}</p>
            <button
              onClick={() => onNavigate('diary')}
              className="mt-4 px-6 py-3 bg-white text-slate-950 rounded-[2rem] text-xs font-black uppercase tracking-widest"
            >
              {t('coach.viewDiary')}
            </button>
          </div>
        )}

        {/* Recovery Status */}
        {cfg && recovery && (
          <div className={`bg-${cfg.color}-500/10 border border-${cfg.color}-500/20 rounded-[2rem] p-6 flex items-start gap-4`}>
            <div className={`w-12 h-12 bg-${cfg.color}-500/20 rounded-2xl flex items-center justify-center flex-shrink-0`}>
              <cfg.icon className={`w-6 h-6 text-${cfg.color}-400`} />
            </div>
            <div>
              <p className="text-xs font-black text-white/40 uppercase tracking-widest mb-1">{t('coach.recovery')}</p>
              <p className="text-white font-bold leading-relaxed">{t(`coach.${cfg.textKey}`)}</p>
              {recovery.days && (
                <p className="text-sm text-white/50 mt-1">{recovery.days} {t('coach.daysSince')}</p>
              )}
            </div>
          </div>
        )}

        {/* Deload recommendation */}
        {data?.deloadRecommended && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-[2rem] p-6 flex items-start gap-4">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Activity className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs font-black text-white/40 uppercase tracking-widest mb-1">{t('coach.deload')}</p>
              <p className="text-white font-bold leading-relaxed">{t('coach.deloadDesc')}</p>
            </div>
          </div>
        )}

        {/* Progressive Overload Suggestions */}
        {(data?.suggestions || []).length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
              <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">{t('coach.overload')}</h3>
            </div>
            <div className="space-y-3">
              {data!.suggestions.map((s, idx) => (
                <div key={idx} className="bg-white/5 border border-white/5 rounded-[2rem] p-6 animate-fade-in-up" style={{ animationDelay: `${idx * 0.08}s` }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-white font-black text-sm">{s.exercise}</p>
                      <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{t('coach.overload')}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
                      <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-2">{t('coach.currentWeight')}</p>
                      <p className="text-xl font-black text-white/60">{s.current.weight}<span className="text-xs text-white/20 ml-1">{weightUnit}</span></p>
                      <p className="text-[10px] text-white/30 mt-1">× {s.current.reps} {t('coach.reps')}</p>
                    </div>
                    <div className="bg-indigo-500/10 rounded-2xl p-4 text-center border border-indigo-500/20">
                      <p className="text-[9px] font-black text-indigo-400/60 uppercase tracking-widest mb-2">{t('coach.suggestedWeight')}</p>
                      <p className="text-xl font-black text-indigo-300">{s.suggested.weight}<span className="text-xs text-indigo-400/60 ml-1">{weightUnit}</span></p>
                      <p className="text-[10px] text-indigo-400/50 mt-1">× {s.suggested.reps} {t('coach.reps')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No suggestions */}
        {data && data.message !== 'complete_first_workout' && (data.suggestions || []).length === 0 && !data.deloadRecommended && !recovery && (
          <div className="bg-white/5 border border-white/5 rounded-[2rem] p-8 text-center">
            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
              <CheckCircle className="w-7 h-7 text-emerald-400" />
            </div>
            <p className="text-white font-bold">{t('coach.noSuggestions')}</p>
          </div>
        )}

        {/* Weekly Volume Chart */}
        {(data?.weeklyVolume || []).length > 0 && (
          <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
                <BarChart2 className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="text-white font-black">{t('coach.weeklyVolumeTitle')}</h3>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data!.weeklyVolume.map(d => ({ ...d, week: formatWeek(d.week) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: 'white', fontWeight: 'bold' }}
                    itemStyle={{ color: '#818cf8' }}
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  />
                  <Bar dataKey="volume" fill="url(#coachVolGrad)" radius={[8, 8, 0, 0]} barSize={20} />
                  <defs>
                    <linearGradient id="coachVolGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={1} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Stats footer */}
        {data && data.totalExercisesTracked > 0 && (
          <div className="bg-white/5 border border-white/5 rounded-[2rem] p-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Exercises Tracked</p>
              <p className="text-2xl font-black text-white">{data.totalExercisesTracked}</p>
            </div>
          </div>
        )}

        <button
          onClick={() => onNavigate('diary')}
          className="w-full py-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[2rem] shadow-xl shadow-indigo-500/20 active:scale-[0.98] transition-all"
        >
          {t('coach.viewDiary')}
        </button>
      </div>
    </div>
  );
}
