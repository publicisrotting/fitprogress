import { useState, useEffect } from 'react';
import { ChevronLeft, Search, Plus, ChevronDown, Dumbbell, Check, X, AlertTriangle, Calendar } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';
import { toast } from 'sonner';
import { getMuscle, MUSCLE_LABEL, getExerciseType } from '../../lib/exerciseMeta';

interface ExerciseLibraryScreenProps { onNavigate: (screen: string) => void; }

interface Exercise {
  _id: string;
  nameKey: string;
  muscle: string;
  difficulty: string;
  image?: string;
  name?: string;
  description?: string;
  instructions?: string[];
}

const MUSCLE_COLORS: Record<string, string> = {
  chest: '#6D4AFF', back: '#FF6B4A', legs: '#22C55E',
  shoulders: '#6D4AFF', arms: '#FF6B4A', abs: '#22C55E', all: '#6D4AFF',
};

export default function ExerciseLibraryScreen({ onNavigate }: ExerciseLibraryScreenProps) {
  const { t } = useSettings();
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  // Smart "add to day" sheet
  const [pickFor, setPickFor] = useState<Exercise | null>(null);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);

  useEffect(() => { fetchExercises(); }, []);

  const openDayPicker = async (ex: Exercise) => {
    setPickFor(ex);
    try {
      const res = await fetch(`${API_URL}/api/workouts`, { headers: { 'x-auth-token': token || '' } });
      const data = await res.json();
      // Upcoming / recent days first
      const list = (Array.isArray(data) ? data : []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setWorkouts(list);
    } catch { setWorkouts([]); }
  };

  // Dominant muscle of a workout day
  const dayMuscle = (w: any): string => {
    const counts: Record<string, number> = {};
    (w.exercises || []).forEach((e: any) => {
      const m = getMuscle(e.nameKey, e.name);
      counts[m] = (counts[m] || 0) + 1;
    });
    let best = 'all', n = 0;
    Object.entries(counts).forEach(([m, c]) => { if (c > n && m !== 'all') { n = c; best = m; } });
    return best;
  };

  const addToDay = async (w: any, ex: Exercise, force = false) => {
    const exMuscle = getMuscle(ex.nameKey);
    const exName = t(`library.exercisesList.${ex.nameKey}.name`) || ex.nameKey;
    // Duplicate check
    const dup = (w.exercises || []).some((e: any) => (e.nameKey || '') === ex.nameKey);
    if (dup) { toast.error(`«${exName}» вже є в цьому дні`); return; }
    // Muscle-fit check
    const dm = dayMuscle(w);
    if (!force && dm !== 'all' && exMuscle !== 'all' && exMuscle !== dm) {
      const ok = window.confirm(`Ця вправа на «${MUSCLE_LABEL[exMuscle]}», а день переважно «${MUSCLE_LABEL[dm]}».\nДодати все одно?`);
      if (!ok) return;
    }
    setAdding(true);
    try {
      const type = getExerciseType(ex.nameKey);
      const reps = type === 'timed' ? 40 : type === 'bodyweight' ? 12 : 10;
      const newEx = {
        name: exName, nameKey: ex.nameKey, notes: '',
        sets: [{ weight: 0, reps, done: false }, { weight: 0, reps, done: false }, { weight: 0, reps, done: false }],
      };
      const merged = [
        ...(w.exercises || []).map((e: any) => ({
          name: e.name, nameKey: e.nameKey, notes: e.notes || '',
          sets: (e.sets || []).map((s: any) => ({ weight: s.weight, reps: s.reps, done: s.done })),
        })),
        newEx,
      ];
      const res = await fetch(`${API_URL}/api/workouts/${w._id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
        body: JSON.stringify({ name: w.name, duration: w.duration || 0, exercises: merged }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Додано в «${w.name}»`);
      setPickFor(null);
    } catch { toast.error(t('common.error')); }
    finally { setAdding(false); }
  };

  const fetchExercises = async () => {
    try {
      const res = await fetch(`${API_URL}/api/exercises`);
      if (res.ok) setExercises(await res.json());
    } catch { toast.error(t('common.error')); }
    finally { setLoading(false); }
  };

  const handleAdd = async (id: string) => {
    if (!token) { toast.error(t('auth.loginRequired') || t('common.error')); return; }
    try {
      const res = await fetch(`${API_URL}/api/programs/add-exercise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ exerciseId: id }),
      });
      const data = await res.json();
      if (res.ok) { toast.success(t('library.addedToProgram')); setAdded(p => new Set([...p, id])); }
      else if (data.msg === 'Exercise already in program') { toast.error(t('library.alreadyInProgram')); setAdded(p => new Set([...p, id])); }
      else toast.error(data.msg || t('common.error'));
    } catch { toast.error(t('common.error')); }
  };

  const muscleGroups = [
    { id: 'all', label: t('library.allMuscles') },
    { id: 'chest', label: t('library.chest') },
    { id: 'back', label: t('library.back') },
    { id: 'legs', label: t('library.legs') },
    { id: 'shoulders', label: t('library.shoulders') },
    { id: 'arms', label: t('library.arms') },
  ];

  const list = exercises.map(ex => ({
    ...ex,
    name: t(`library.exercisesList.${ex.nameKey}.name`),
    description: t(`library.exercisesList.${ex.nameKey}.description`),
    instructions: t(`library.exercisesList.${ex.nameKey}.instructions`) as unknown as string[],
  })).filter(ex => {
    const q = searchQuery.trim().toLowerCase();
    const matchSearch = !q || ex.name?.toLowerCase().includes(q);
    const matchMuscle = selectedMuscle === 'all' || ex.muscle === selectedMuscle;
    const matchDiff = selectedDifficulty === 'all' || ex.difficulty === selectedDifficulty;
    return matchSearch && matchMuscle && matchDiff;
  });

  const diffColor = (d: string) => d === 'easy' ? 'var(--accent-exercise)' : d === 'medium' ? 'var(--accent-energy)' : 'var(--accent-move)';

  return (
    <div className="h-full apple-bg overflow-y-auto pb-28">
      {/* Header */}
      <div className="px-5 pt-[calc(3rem+env(safe-area-inset-top))] pb-3">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => onNavigate('dashboard')}
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90" style={{ background: 'var(--bg-card)', boxShadow: '0 1px 4px rgba(40,32,56,0.08)' }}>
            <ChevronLeft className="w-5 h-5 apple-text-2" />
          </button>
          <div>
            <h1 className="text-2xl font-bold apple-text">{t('library.title')}</h1>
            <p className="text-xs apple-text-3 mt-0.5">{exercises.length} {t('library.subtitle')}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="w-4 h-4 apple-text-3 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('library.searchPlaceholder')}
            className="w-full rounded-2xl pl-10 pr-4 py-3 text-sm apple-text outline-none"
            style={{ background: 'var(--bg-card)', border: '0.5px solid var(--separator)' }} />
        </div>

        {/* Muscle filter pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {muscleGroups.map(g => {
            const active = selectedMuscle === g.id;
            const c = MUSCLE_COLORS[g.id];
            return (
              <button key={g.id} onClick={() => setSelectedMuscle(g.id)}
                className="px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all active:scale-95"
                style={{ background: active ? c : 'var(--bg-card)', color: active ? '#fff' : 'var(--text-secondary)', border: active ? 'none' : '0.5px solid var(--separator)' }}>
                {g.label}
              </button>
            );
          })}
        </div>

        {/* Difficulty segmented */}
        <div className="flex gap-1.5 p-1 rounded-xl mt-3" style={{ background: 'var(--bg-card2)' }}>
          {[
            { id: 'all', label: t('library.allLevels') },
            { id: 'easy', label: t('library.easy') },
            { id: 'medium', label: t('library.medium') },
            { id: 'hard', label: t('library.hard') },
          ].map(d => (
            <button key={d.id} onClick={() => setSelectedDifficulty(d.id)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{ background: selectedDifficulty === d.id ? 'var(--bg-card)' : 'transparent', color: selectedDifficulty === d.id ? 'var(--text-primary)' : 'var(--text-secondary)', boxShadow: selectedDifficulty === d.id ? '0 1px 4px rgba(40,32,56,0.1)' : 'none' }}>
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-5 pt-2">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent-move)', borderTopColor: 'transparent' }} />
          </div>
        ) : list.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--bg-card2)' }}>
              <Search className="w-8 h-8 apple-text-3" />
            </div>
            <p className="text-base font-semibold apple-text mb-1">{t('library.notFound')}</p>
            <p className="text-sm apple-text-2">{t('library.changeFilters')}</p>
          </div>
        ) : (
          <div className="rounded-3xl overflow-hidden" style={{ background: 'var(--bg-card)', boxShadow: '0 2px 16px rgba(40,32,56,0.06)' }}>
            {list.map((ex, idx) => {
              const c = MUSCLE_COLORS[ex.muscle] || '#6D4AFF';
              const isOpen = expandedId === ex._id;
              return (
                <div key={ex._id} style={{ borderBottom: idx < list.length - 1 ? '0.5px solid var(--separator)' : 'none' }}>
                  <button onClick={() => setExpandedId(isOpen ? null : ex._id)}
                    className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left active:opacity-70">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${c}1A` }}>
                      <Dumbbell className="w-5 h-5" style={{ color: c }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold apple-text truncate">{ex.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs apple-text-3">{t(`library.${ex.muscle}`)}</span>
                        <span className="w-1 h-1 rounded-full" style={{ background: 'var(--separator)' }} />
                        <span className="text-xs font-medium" style={{ color: diffColor(ex.difficulty) }}>{t(`library.${ex.difficulty}`)}</span>
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 apple-text-3 transition-transform flex-shrink-0" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }} />
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1">
                      {ex.description && (
                        <p className="text-sm apple-text-2 leading-relaxed mb-3">{ex.description}</p>
                      )}
                      {Array.isArray(ex.instructions) && ex.instructions.length > 0 && (
                        <div className="rounded-2xl p-3.5 mb-3" style={{ background: 'var(--bg-card2)' }}>
                          <p className="text-xs font-semibold apple-text-3 uppercase tracking-wider mb-2.5">{t('library.technique')}</p>
                          <ol className="space-y-2.5">
                            {ex.instructions.map((step, si) => (
                              <li key={si} className="flex items-start gap-3">
                                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5" style={{ background: `${c}20`, color: c }}>{si + 1}</span>
                                <span className="text-sm apple-text leading-relaxed">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                      <button onClick={() => openDayPicker(ex)}
                        className="w-full py-3 rounded-2xl text-white text-sm font-semibold active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                        style={{ background: c }}>
                        <Plus className="w-4 h-4" /> Додати в день тренування
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Smart day picker sheet */}
      {pickFor && (
        <div className="fixed inset-0 z-[2000] flex items-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setPickFor(null)} />
          <div className="relative w-full rounded-t-3xl animate-slide-up" style={{ background: 'var(--bg-card)', borderTop: '0.5px solid var(--separator)', maxHeight: '80vh' }}>
            <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-3" style={{ background: 'var(--separator)' }} />
            <div className="px-5 pb-2 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold apple-text">Додати в який день?</h3>
                <p className="text-xs apple-text-3 mt-0.5">
                  {t(`library.exercisesList.${pickFor.nameKey}.name`)} · {MUSCLE_LABEL[getMuscle(pickFor.nameKey)]}
                </p>
              </div>
              <button onClick={() => setPickFor(null)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-card2)' }}>
                <X className="w-4 h-4 apple-text-2" />
              </button>
            </div>

            <div className="overflow-y-auto px-5" style={{ maxHeight: 'calc(80vh - 90px)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 100px)' }}>
              {workouts.length === 0 ? (
                <div className="py-10 text-center">
                  <Calendar className="w-10 h-10 apple-text-3 mx-auto mb-3" />
                  <p className="text-sm apple-text-2 mb-4">Немає днів тренувань. Створи програму в генераторі.</p>
                  <button onClick={() => { setPickFor(null); onNavigate('generator'); }}
                    className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: 'var(--c-primary)' }}>
                    До генератора
                  </button>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  {workouts.map((w) => {
                    const dm = dayMuscle(w);
                    const exM = getMuscle(pickFor.nameKey);
                    const fits = dm === 'all' || exM === 'all' || exM === dm;
                    const dup = (w.exercises || []).some((e: any) => (e.nameKey || '') === pickFor.nameKey);
                    return (
                      <button key={w._id} onClick={() => !dup && addToDay(w, pickFor)} disabled={adding || dup}
                        className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-left active:scale-[0.99] transition-transform disabled:opacity-50"
                        style={{ background: 'var(--bg-card2)', border: fits && !dup ? '1px solid var(--c-success)40' : '0.5px solid var(--separator)' }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: fits ? 'var(--c-success)1A' : 'var(--c-accent)1A' }}>
                          <Dumbbell className="w-5 h-5" style={{ color: fits ? 'var(--c-success)' : 'var(--c-accent)' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold apple-text truncate">{w.name}</p>
                          <p className="text-xs apple-text-3">
                            {(w.exercises || []).length} вправ · переважно {MUSCLE_LABEL[dm] || '—'}
                          </p>
                        </div>
                        {dup ? (
                          <span className="text-xs font-medium apple-text-3">вже є</span>
                        ) : fits ? (
                          <span className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--c-success)' }}><Check className="w-3.5 h-3.5" /> підходить</span>
                        ) : (
                          <span className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--c-accent)' }}><AlertTriangle className="w-3.5 h-3.5" /> не той день</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
