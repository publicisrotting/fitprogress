import { useState, useEffect } from 'react';
import { ChevronLeft, Search, Plus, ChevronDown, Dumbbell, Check } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';
import { toast } from 'sonner';

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

  useEffect(() => { fetchExercises(); }, []);

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
                      <button onClick={() => handleAdd(ex._id)} disabled={added.has(ex._id)}
                        className="w-full py-3 rounded-2xl text-white text-sm font-semibold active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-60"
                        style={{ background: added.has(ex._id) ? 'var(--accent-exercise)' : c }}>
                        {added.has(ex._id) ? <><Check className="w-4 h-4" /> {t('library.addedToProgram')}</> : <><Plus className="w-4 h-4" /> {t('library.addToProgram')}</>}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
