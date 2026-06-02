import { useState, useEffect } from 'react';
import { ChevronLeft, TrendingUp, Award, Calculator } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';

interface Props { onNavigate: (s: string) => void; exercise?: string; }

export default function ExerciseProgressScreen({ onNavigate, exercise: initialExercise }: Props) {
  const { t, units } = useSettings();
  const { token } = useAuth();
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [allExercises, setAllExercises] = useState<string[]>([]);
  const [selected, setSelected] = useState(initialExercise || '');
  const [loading, setLoading] = useState(true);
  const [calc1rmWeight, setCalc1rmWeight] = useState('');
  const [calc1rmReps, setCalc1rmReps] = useState('');
  const weightUnit = units === 'imperial' ? 'lb' : 'kg';

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/workouts`, { headers: { 'x-auth-token': token } })
      .then(r => r.json())
      .then(data => {
        setWorkouts(Array.isArray(data) ? data : []);
        // Collect all unique exercises
        const exMap = new Map<string, string>();
        (Array.isArray(data) ? data : []).forEach((w: any) => {
          (w.exercises || []).forEach((ex: any) => {
            const key = ex.nameKey || ex.name;
            if (key) exMap.set(key, ex.name || key);
          });
        });
        const list = Array.from(exMap.keys());
        setAllExercises(list);
        if (!selected && list.length > 0) setSelected(list[0]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  // Build progression data for selected exercise
  const progressionData = workouts
    .filter(w => (w.exercises || []).some((ex: any) => (ex.nameKey || ex.name) === selected))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(w => {
      const ex = (w.exercises || []).find((e: any) => (e.nameKey || e.name) === selected);
      if (!ex) return null;
      const bestSet = (ex.sets || []).reduce((best: any, s: any) => {
        if (!s.weight || !s.reps) return best;
        const vol = s.weight * s.reps;
        return !best || vol > best.vol ? { weight: s.weight, reps: s.reps, vol } : best;
      }, null);
      if (!bestSet) return null;
      const orm = Math.round(bestSet.weight * (1 + bestSet.reps / 30) * 10) / 10;
      return {
        date: new Date(w.date).toLocaleDateString('uk-UA', { day: '2-digit', month: 'short' }),
        weight: bestSet.weight,
        reps: bestSet.reps,
        orm,
        rawDate: w.date,
      };
    })
    .filter(Boolean) as any[];

  // Personal record
  const pr = progressionData.reduce((best, d) => !best || d.weight > best.weight ? d : best, null as any);

  // 1RM calculator
  const w = parseFloat(calc1rmWeight);
  const r = parseInt(calc1rmReps);
  const calculated1rm = w > 0 && r > 0 ? Math.round(w * (1 + r / 30) * 10) / 10 : null;

  // Get display name
  const getDisplayName = (key: string) => {
    const tr = t(`library.exercisesList.${key}.name`);
    if (tr && tr !== `library.exercisesList.${key}.name`) return tr;
    const wk = workouts.find(w => (w.exercises||[]).some((e:any)=>(e.nameKey||e.name)===key));
    const ex = wk?.exercises?.find((e:any)=>(e.nameKey||e.name)===key);
    return ex?.name || key;
  };

  if (loading) return (
    <div className="h-full apple-bg flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent-stand)', borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div className="h-full apple-bg overflow-y-auto pb-28">
      {/* Header */}
      <div className="px-5 pt-[calc(3rem+env(safe-area-inset-top))] pb-4">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => onNavigate('statistics')} className="w-9 h-9 apple-card rounded-full flex items-center justify-center active:scale-90 transition-transform" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
            <ChevronLeft className="w-5 h-5 apple-text-2" />
          </button>
          <h1 className="text-2xl font-bold apple-text">Прогрес вправи</h1>
        </div>
      </div>

      <div className="px-5 space-y-5">
        {/* Exercise selector */}
        <div className="apple-card rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '0.5px solid var(--separator)' }}>
            <p className="text-xs apple-text-3 font-medium uppercase tracking-wider mb-2">Вправа</p>
            <select value={selected} onChange={e => setSelected(e.target.value)}
              className="w-full apple-bg text-base font-semibold apple-text outline-none py-1">
              {allExercises.map(key => (
                <option key={key} value={key}>{getDisplayName(key)}</option>
              ))}
            </select>
          </div>
          {pr && (
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-energy)20' }}>
                <Award className="w-5 h-5" style={{ color: 'var(--accent-energy)' }} />
              </div>
              <div>
                <p className="text-xs apple-text-3">Особистий рекорд</p>
                <p className="text-lg font-bold apple-text">{pr.weight} {weightUnit} × {pr.reps} повт</p>
                <p className="text-xs apple-text-3">1RM ≈ {pr.orm} {weightUnit}</p>
              </div>
            </div>
          )}
        </div>

        {/* Progress chart */}
        {progressionData.length > 1 ? (
          <div className="apple-card rounded-2xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent-stand)' }} />
              <h3 className="text-base font-semibold apple-text">Прогрес ваги</h3>
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--separator)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} dy={6} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '0.5px solid var(--separator)', borderRadius: 12, color: 'var(--text-primary)', fontSize: 13 }} />
                  <Line type="monotone" dataKey="weight" stroke="var(--accent-move)" strokeWidth={2.5} dot={{ fill: 'var(--accent-move)', r: 4 }} name={`Вага (${weightUnit})`} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : progressionData.length === 1 ? (
          <div className="apple-card rounded-2xl p-6 text-center" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <TrendingUp className="w-8 h-8 mx-auto mb-2 apple-text-3" />
            <p className="text-sm apple-text-2">Потрібно ще 1 тренування для графіка</p>
          </div>
        ) : (
          <div className="apple-card rounded-2xl p-6 text-center" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <p className="text-sm apple-text-2">Немає даних для цієї вправи</p>
          </div>
        )}

        {/* 1RM estimated chart */}
        {progressionData.length > 1 && (
          <div className="apple-card rounded-2xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center gap-2 mb-5">
              <Calculator className="w-4 h-4" style={{ color: 'var(--accent-exercise)' }} />
              <h3 className="text-base font-semibold apple-text">Оцінений 1RM</h3>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--separator)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} dy={6} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '0.5px solid var(--separator)', borderRadius: 12, color: 'var(--text-primary)', fontSize: 13 }} />
                  <Line type="monotone" dataKey="orm" stroke="var(--accent-exercise)" strokeWidth={2.5} dot={{ fill: 'var(--accent-exercise)', r: 4 }} name="1RM (кг)" strokeDasharray="5 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 1RM Calculator */}
        <div className="apple-card rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div className="px-4 py-3.5" style={{ borderBottom: '0.5px solid var(--separator)', background: 'var(--bg-card2)' }}>
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4" style={{ color: 'var(--accent-energy)' }} />
              <h3 className="text-base font-semibold apple-text">Калькулятор 1RM</h3>
            </div>
            <p className="text-xs apple-text-3 mt-0.5">Формула Epley: вага × (1 + повтори/30)</p>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs apple-text-3 mb-1.5">Вага ({weightUnit})</p>
                <input type="number" inputMode="decimal" value={calc1rmWeight} onChange={e => setCalc1rmWeight(e.target.value)}
                  placeholder="100"
                  className="w-full apple-card2 rounded-xl px-4 py-3 text-base font-semibold apple-text outline-none text-center"
                  style={{ border: '0.5px solid var(--separator)' }} />
              </div>
              <div>
                <p className="text-xs apple-text-3 mb-1.5">Повторення</p>
                <input type="number" inputMode="numeric" value={calc1rmReps} onChange={e => setCalc1rmReps(e.target.value)}
                  placeholder="5"
                  className="w-full apple-card2 rounded-xl px-4 py-3 text-base font-semibold apple-text outline-none text-center"
                  style={{ border: '0.5px solid var(--separator)' }} />
              </div>
            </div>
            {calculated1rm && (
              <div className="rounded-2xl p-4 text-center" style={{ background: 'var(--accent-energy)15', border: '1px solid var(--accent-energy)30' }}>
                <p className="text-xs apple-text-3 mb-1">Твій 1RM</p>
                <p className="text-4xl font-bold" style={{ color: 'var(--accent-energy)' }}>{calculated1rm}</p>
                <p className="text-xs apple-text-3 mt-1">{weightUnit}</p>
              </div>
            )}
            {calculated1rm && (
              <div className="apple-card2 rounded-2xl p-4" style={{ border: '0.5px solid var(--separator)' }}>
                <p className="text-xs font-semibold apple-text-2 mb-3">Схема відсотків</p>
                <div className="grid grid-cols-3 gap-2">
                  {[100, 95, 90, 85, 80, 75, 70, 65, 60].map(pct => (
                    <div key={pct} className="apple-card rounded-xl p-2.5 text-center">
                      <p className="text-xs apple-text-3">{pct}%</p>
                      <p className="text-sm font-bold apple-text">{Math.round(calculated1rm! * pct / 100 * 10) / 10}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* History table */}
        {progressionData.length > 0 && (
          <div>
            <h3 className="text-base font-semibold apple-text mb-3">Історія</h3>
            <div className="apple-card rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div className="grid grid-cols-4 gap-2 px-4 py-2.5 text-xs font-semibold apple-text-3 uppercase tracking-wider" style={{ background: 'var(--bg-card2)', borderBottom: '0.5px solid var(--separator)' }}>
                <span>Дата</span><span className="text-center">Вага</span><span className="text-center">Повт</span><span className="text-center">1RM</span>
              </div>
              {[...progressionData].reverse().slice(0, 10).map((d, i) => (
                <div key={i} className="grid grid-cols-4 gap-2 px-4 py-3 text-sm"
                  style={{ borderBottom: i < Math.min(progressionData.length, 10) - 1 ? '0.5px solid var(--separator)' : 'none' }}>
                  <span className="apple-text-2">{d.date}</span>
                  <span className="text-center font-semibold apple-text">{d.weight}</span>
                  <span className="text-center apple-text">{d.reps}</span>
                  <span className="text-center font-semibold" style={{ color: 'var(--accent-exercise)' }}>{d.orm}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
