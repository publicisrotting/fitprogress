import { useState, useEffect } from 'react';
import { ChevronLeft, Zap, CheckCircle, AlertTriangle, Clock, Dumbbell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';

interface Props { onNavigate: (s: string) => void; }

const MUSCLE_GROUPS = [
  { key: 'chest',     label: 'Груди',   color: '#6D4AFF', nameKeys: ['benchPress','inclineDumbbellPress','dumbbellFlyes'], recoveryHours: 48 },
  { key: 'back',      label: 'Спина',   color: '#FF6B4A', nameKeys: ['pullups','barbellRows','latPulldown','dumbbellRows'], recoveryHours: 48 },
  { key: 'legs',      label: 'Ноги',    color: '#22C55E', nameKeys: ['squats','romanianDeadlift','lunges','dumbbellLunges'], recoveryHours: 72 },
  { key: 'shoulders', label: 'Плечі',   color: '#6D4AFF', nameKeys: ['dumbbellPress','lateralRaises','uprightRows'], recoveryHours: 48 },
  { key: 'arms',      label: 'Руки',    color: '#FF6B4A', nameKeys: ['bicepCurls','hammerCurls','skullCrushers'], recoveryHours: 36 },
  { key: 'abs',       label: 'Прес',    color: '#22C55E', nameKeys: ['plank','crunches','legRaises'], recoveryHours: 24 },
];

export default function MuscleRecoveryScreen({ onNavigate }: Props) {
  const { token } = useAuth();
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/workouts`, { headers: { 'x-auth-token': token } })
      .then(r => r.json()).then(d => { setWorkouts(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));
  }, [token]);

  // Find last training time for each muscle group
  const now = Date.now();
  type StatusKey = 'ready' | 'recovering' | 'fatigued';
  const STATUS_CONFIG: Record<StatusKey, { color: string; label: string; icon: any }> = {
    ready:      { color: 'var(--accent-exercise)', label: 'Готовий',      icon: CheckCircle },
    recovering: { color: 'var(--accent-energy)',   label: 'Відновлюється', icon: Clock },
    fatigued:   { color: 'var(--accent-move)',     label: 'Втомлений',    icon: AlertTriangle },
  };

  const muscleStatus = MUSCLE_GROUPS.map(mg => {
    let lastTrainedMs: number | null = null;
    [...workouts]
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .forEach(w => {
        if (lastTrainedMs !== null) return;
        const ts = new Date(w.date).getTime();
        // Ignore future-dated (planned) workouts — only count sessions already performed
        if (ts > now) return;
        const ex = (w.exercises || []).find((e: any) => mg.nameKeys.includes(e.nameKey || ''));
        if (!ex) return;
        // Count as "trained" only if it has a real logged set (weight or reps > 0)
        const performed = (ex.sets || []).some((s: any) => (s.weight || 0) > 0 || (s.reps || 0) > 0);
        if (performed) lastTrainedMs = ts;
      });
    const hoursSince = lastTrainedMs !== null ? Math.max(0, (now - lastTrainedMs) / 3600000) : 999;
    const pct = lastTrainedMs === null ? 100 : Math.min(100, (hoursSince / mg.recoveryHours) * 100);
    const status: StatusKey = pct >= 100 ? 'ready' : pct >= 60 ? 'recovering' : 'fatigued';
    return { ...mg, hoursSince, pct, status };
  });

  const formatHours = (h: number) => {
    if (h > 999) return 'Давно';
    if (h < 1) return `${Math.round(h*60)}хв тому`;
    if (h < 24) return `${Math.round(h)}год тому`;
    return `${Math.floor(h/24)}д тому`;
  };

  if (loading) return <div className="h-full apple-bg flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent-stand)', borderTopColor: 'transparent' }} /></div>;

  return (
    <div className="h-full apple-bg overflow-y-auto pb-28">
      <div className="px-5 pt-[calc(3rem+env(safe-area-inset-top))] pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate('coach')} className="w-9 h-9 apple-card rounded-full flex items-center justify-center active:scale-90" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
            <ChevronLeft className="w-5 h-5 apple-text-2" />
          </button>
          <div>
            <h1 className="text-2xl font-bold apple-text">Відновлення м'язів</h1>
            <p className="text-xs apple-text-3 mt-0.5">Коли можна тренуватись знову</p>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-4">
        {/* Recommendation — top priority */}
        <div className="rounded-2xl p-4" style={{ background: 'var(--c-primary)10', border: '1px solid var(--c-primary)30' }}>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--c-primary)1A' }}>
              <Zap className="w-5 h-5" style={{ color: 'var(--c-primary)' }} />
            </div>
            <div>
              <p className="text-sm font-semibold apple-text mb-1">Рекомендація на сьогодні</p>
              <p className="text-sm apple-text-2 leading-relaxed">
                {muscleStatus.filter(m => m.status === 'ready').length === 0
                  ? 'Дай тілу відпочити — всі м\'язи ще відновлюються. Ідеальний день для прогулянки або йоги.'
                  : `Готові до тренування: ${muscleStatus.filter(m => m.status === 'ready').map(m => m.label).join(', ')}.`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          {(['ready','recovering','fatigued'] as const).map(s => {
            const cnt = muscleStatus.filter(m => m.status === s).length;
            const cfg = STATUS_CONFIG[s];
            return (
              <div key={s} className="apple-card rounded-2xl p-3.5 text-center" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <p className="text-2xl font-bold" style={{ color: cfg.color }}>{cnt}</p>
                <p className="text-xs apple-text-3 mt-0.5">{cfg.label}</p>
              </div>
            );
          })}
        </div>

        {/* Muscle cards */}
        <div className="apple-card rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          {muscleStatus.map((mg, i) => {
            const cfg = STATUS_CONFIG[mg.status];
            const StatusIcon = cfg.icon;
            return (
              <div key={mg.key} className="px-4 py-4" style={{ borderBottom: i < muscleStatus.length-1 ? '0.5px solid var(--separator)' : 'none' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${mg.color}1A` }}>
                    <Dumbbell className="w-5 h-5" style={{ color: mg.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold apple-text">{mg.label}</p>
                      <div className="flex items-center gap-1.5">
                        <StatusIcon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                        <span className="text-xs font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-card2)' }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${mg.pct}%`, background: cfg.color }} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs apple-text-3">
                  <span>Останнє тренування: {formatHours(mg.hoursSince)}</span>
                  <span>Відновлення ~{mg.recoveryHours}год</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
