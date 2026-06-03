import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, X, Dumbbell, Clock, TrendingUp, ChevronRight, Star, Search, Zap, Target, Play } from 'lucide-react';
import ActiveWorkoutOverlay from '../ActiveWorkoutOverlay';
import WorkoutCompleteOverlay, { WorkoutSummary } from '../WorkoutCompleteOverlay';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';
import { useSettings } from '../../context/SettingsContext';
import { translations } from '../../translations';

interface WorkoutSet {
  set: number;
  weight: number;
  reps: number;
  done: boolean;
}

interface WorkoutExercise {
  name: string;
  nameKey?: string;
  sets: WorkoutSet[];
}

export default function WorkoutDiaryScreen({ onNavigate }: { onNavigate: (s: string) => void }) {
  const { token } = useAuth();
  const { units, t, language } = useSettings();
  
  const [view, setView] = useState<'list' | 'active' | 'view' | 'today' | 'favorites'>('list');
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [workoutDate, setWorkoutDate] = useState<string>(new Date().toISOString());
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);
  const [inlineDrafts, setInlineDrafts] = useState<Record<string, { name: string; exercises: WorkoutExercise[] }>>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [dayFilter, setDayFilter] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [assignedDays, setAssignedDays] = useState<Record<string, number | null>>({});
  
  // Active Workout State
  const [workoutName, setWorkoutName] = useState('Моє тренування');
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [restTimer, setRestTimer] = useState(0);
  const [isRestActive, setIsRestActive] = useState(false);
  const [workoutElapsed, setWorkoutElapsed] = useState(0); // seconds
  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null);
  const workoutTimerRef = useRef<any>(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [overlayMinimized, setOverlayMinimized] = useState(false);
  const [completedSummary, setCompletedSummary] = useState<WorkoutSummary | null>(null);
  const [hints, setHints] = useState<Record<number, { last: { weight: number; reps: number; date: string } | null; best: { weight: number; reps: number; date: string } | null }>>({});
  const hintTimers = useRef<Record<number, any>>({});
  const exerciseNameToKey = useRef<Record<string, string> | null>(null);
  const normalizeExerciseName = (value: string) => {
    return String(value || '')
      .toLowerCase()
      .replace(/ё/g, 'е')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9а-яіїєґ\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };
  const ensureExerciseIndex = () => {
    if (exerciseNameToKey.current) return;
    const map: Record<string, string> = {};
    (['uk', 'ru', 'en'] as const).forEach(lang => {
      const list = (translations as any)[lang]?.library?.exercisesList || {};
      Object.keys(list).forEach((key) => {
        const nm = normalizeExerciseName(String(list[key]?.name || ''));
        if (nm) map[nm] = key;
      });
    });
    const aliases: Record<string, string[]> = {
      benchPress: ['жим лежа', 'жим лёжа', 'жим лежачи', 'bench press'],
      inclineDumbbellPress: ['жим на наклонной', 'жим на похилій лаві', 'жим гантелей на наклонной', 'жим гантелей на похилій лаві', 'incline dumbbell press'],
      dumbbellFlyes: ['dumbbell flys', 'dumbbell flies', 'разведение гантелей', 'розведення гантелей'],
      barbellRows: ['тяга штанги в наклоне', 'тяга штанги в нахилі', 'barbell rows', 'rows'],
      latPulldown: ['тяга верхнего блока', 'тяга верхнього блоку', 'lat pulldown'],
      romanianDeadlift: ['румынская тяга', 'румунська тяга', 'rdl', 'romanian deadlift'],
      lunges: ['выпады', 'випади', 'lunges'],
      lateralRaises: ['подъемы гантелей в стороны', 'підйоми гантелей у сторони', 'lateral raises'],
      uprightRows: ['тяга к подбородку', 'тяга до підборіддя', 'upright rows'],
      skullCrushers: ['французский жим', 'французький жим', 'skull crushers'],
      hammerCurls: ['молотковые сгибания', 'молоткові підйоми', 'hammer curls'],
      crunches: ['скручивания', 'скручування', 'crunches'],
      legRaises: ['подъем ног', 'підйом ніг', 'leg raises'],
      burpees: ['берпи', 'burpees'],
      dumbbellRows: ['тяга гантели в наклоне', 'тяга гантелі в нахилі', 'dumbbell row', 'dumbbell rows'],
      dumbbellLunges: ['выпады с гантелями', 'випади з гантелями', 'dumbbell lunges'],
      dumbbellCleanPress: ['dumbbell clean and press', 'dumbbell clean & press', 'подъем на грудь и жим гантелей', 'підйом на груди і жим гантелей'],
    };
    Object.keys(aliases).forEach((key) => {
      aliases[key].forEach((alias) => {
        const nm = normalizeExerciseName(alias);
        if (nm) map[nm] = key;
      });
    });
    exerciseNameToKey.current = map;
  };
  const resolveExerciseKey = (name: string) => {
    const n = normalizeExerciseName(name);
    if (!n) return undefined;
    ensureExerciseIndex();
    return exerciseNameToKey.current?.[n];
  };
  const translateExerciseName = (nameKey?: string, fallback?: string) => {
    if (!nameKey) return fallback || '';
    const keyPath = `library.exercisesList.${nameKey}.name`;
    const translated = t(keyPath);
    if (typeof translated === 'string' && translated !== keyPath) return translated;
    return fallback || translated || '';
  };

  // Fetch history on mount
  useEffect(() => {
    if (view === 'list' || view === 'today' || view === 'favorites') fetchWorkouts();
  }, [view, token]);

  useEffect(() => {
    const saved = localStorage.getItem('favoriteExercises');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          ensureExerciseIndex();
          const normalized = parsed
            .map((v: any) => String(v || '').trim())
            .filter(Boolean)
            .map((v: string) => {
              if ((translations as any).en?.library?.exercisesList?.[v]) return v;
              if ((translations as any).ru?.library?.exercisesList?.[v]) return v;
              if ((translations as any).uk?.library?.exercisesList?.[v]) return v;
              return resolveExerciseKey(v) || v;
            });
          setFavorites(Array.from(new Set(normalized)));
        }
      } catch {
        setFavorites([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('favoriteExercises', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    const saved = localStorage.getItem('workoutDayAssignments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') setAssignedDays(parsed);
      } catch {
        setAssignedDays({});
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('workoutDayAssignments', JSON.stringify(assignedDays));
  }, [assignedDays]);

  // Rest timer
  useEffect(() => {
    let interval: any;
    if (isRestActive && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => prev - 1);
      }, 1000);
    } else if (restTimer === 0) {
      setIsRestActive(false);
    }
    return () => clearInterval(interval);
  }, [isRestActive, restTimer]);

  // Workout elapsed timer
  useEffect(() => {
    if (view === 'active' && workoutStartTime) {
      workoutTimerRef.current = setInterval(() => {
        setWorkoutElapsed(Math.floor((Date.now() - workoutStartTime) / 1000));
      }, 1000);
    } else {
      if (workoutTimerRef.current) clearInterval(workoutTimerRef.current);
    }
    return () => { if (workoutTimerRef.current) clearInterval(workoutTimerRef.current); };
  }, [view, workoutStartTime]);

  const fetchWorkouts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/workouts`, {
        headers: { 'x-auth-token': token || '' }
      });
      const data = await res.json();
      setWorkouts(Array.isArray(data) ? data.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : []);
    } catch (e) {
      toast.error(t('common.networkError') || 'Error loading workouts');
    } finally {
      setLoading(false);
    }
  };

  const fetchServerNow = async (): Promise<string> => {
    try {
      const resp = await fetch(`${API_URL}/api/workouts/time`);
      const data = await resp.json();
      return data?.now || new Date().toISOString();
    } catch {
      return new Date().toISOString();
    }
  };

  const startWorkout = () => {
    const defaultKey = 'benchPress';
    const defaultName = translateExerciseName(defaultKey, 'Bench Press');
    setExercises([{ name: defaultName, nameKey: defaultKey, sets: [{ set: 1, weight: 0, reps: 0, done: false }] }]);
    setWorkoutName(t('common.workout') || 'Workout');
    fetchServerNow().then(now => setWorkoutDate(now));
    setView('active');
    setHints({});
    scheduleHint(defaultName, 0, defaultKey);
    setEditingWorkoutId(null);
    setExpandedWorkoutId(null);
    setWorkoutStartTime(Date.now());
    setWorkoutElapsed(0);
  };

  const openWorkout = (w: any) => {
    const mapped = (w.exercises || []).map((ex: any) => ({
      name: ex.name || 'Exercise',
      nameKey: ex.nameKey || resolveExerciseKey(ex.name || ''),
      sets: (ex.sets || []).map((s: any, idx: number) => ({
        set: idx + 1,
        weight: Number(s.weight || 0),
        reps: Number(s.reps || 0),
        done: Boolean(s.done)
      }))
    }));
    setExercises(mapped.length ? mapped : [{ name: t('library.exercisesList.benchPress.name') || 'Bench Press', nameKey: 'benchPress', sets: [{ set: 1, weight: 0, reps: 0, done: false }] }]);
    const goalLabel = w.programGoal ? t(`generator.goals.${w.programGoal}`) : null;
    const displayName = w.source === 'generator' && w.programDayIndex ? `${t('common.day') || 'Day'} ${w.programDayIndex}: ${goalLabel || w.programTitle || (t('common.workout') || 'Workout')}` : (w.name || (t('common.workout') || 'Workout'));
    setWorkoutName(displayName);
    setWorkoutDate(w.date || new Date().toISOString());
    setView('active');
    setEditingWorkoutId(w._id);
    setWorkoutStartTime(Date.now());
    setWorkoutElapsed(0);
    setHints({});
    setExpandedWorkoutId(null);
    // Progressive overload — prefill weights from last time for planned (empty) sets
    prefillFromHistory(mapped);
  };

  // Auto-fill each weighted exercise's sets with last-time weight/reps when they're empty
  const prefillFromHistory = async (mapped: WorkoutExercise[]) => {
    try {
      const results = await Promise.all(mapped.map(async (ex) => {
        const hasLogged = ex.sets.some(s => (s.weight || 0) > 0);
        if (hasLogged) return null; // already has data — don't override
        const params = new URLSearchParams();
        if (ex.nameKey) params.set('nameKey', ex.nameKey); else params.set('name', ex.name || '');
        const resp = await fetch(`${API_URL}/api/workouts/hints?${params.toString()}`, { headers: { 'x-auth-token': token || '' } });
        const data = await resp.json().catch(() => null);
        return data?.last || null;
      }));
      let changed = false;
      const next = mapped.map((ex, i) => {
        const last = results[i];
        if (!last || (last.weight || 0) <= 0) return ex;
        changed = true;
        return { ...ex, sets: ex.sets.map(s => ({ ...s, weight: s.weight > 0 ? s.weight : Number(last.weight) || 0, reps: s.reps > 0 ? s.reps : Number(last.reps) || 0 })) };
      });
      if (changed) setExercises(next);
    } catch { /* non-blocking */ }
  };

  const startEditCurrentWorkout = () => {
    if (!editingWorkoutId) return;
    setView('active');
  };

  const toggleInline = (w: any) => {
    if (expandedWorkoutId === w._id) {
      setExpandedWorkoutId(null);
      return;
    }
    if (!inlineDrafts[w._id]) {
      const mapped = (w.exercises || []).map((ex: any) => ({
        name: ex.name || 'Exercise',
        nameKey: ex.nameKey || resolveExerciseKey(ex.name || ''),
        sets: (ex.sets || []).map((s: any, idx: number) => ({
          set: idx + 1,
          weight: Number(s.weight || 0),
          reps: Number(s.reps || 0),
          done: Boolean(s.done)
        }))
      }));
      setInlineDrafts(prev => ({
        ...prev,
        [w._id]: { name: w.name || (t('common.workout') || 'Workout'), exercises: mapped.length ? mapped : [{ name: t('library.exercisesList.benchPress.name') || 'Bench Press', nameKey: 'benchPress', sets: [{ set: 1, weight: 0, reps: 0, done: false }] }] }
      }));
    }
    setExpandedWorkoutId(w._id);
  };

  const setWorkoutDay = (workoutId: string, day: number | null) => {
    setAssignedDays(prev => ({ ...prev, [workoutId]: day }));
  };

  const handleAddExercise = () => {
    setExercises([...exercises, { name: t('library.exercisesList.benchPress.name') || 'Bench Press', nameKey: 'benchPress', sets: [{ set: 1, weight: 0, reps: 0, done: false }] }]);
  };

  const handleRemoveExercise = (idx: number) => {
    const next = [...exercises];
    next.splice(idx, 1);
    setExercises(next);
    setHints(prev => {
      const nextHints = { ...prev };
      delete nextHints[idx];
      return nextHints;
    });
  };

  const handleAddSet = (exIdx: number) => {
    const newEx = [...exercises];
    const lastSet = newEx[exIdx].sets[newEx[exIdx].sets.length - 1];
    newEx[exIdx].sets.push({
      set: newEx[exIdx].sets.length + 1,
      weight: lastSet ? lastSet.weight : 0,
      reps: lastSet ? lastSet.reps : 0,
      done: false
    });
    setExercises(newEx);
  };

  const addInlineSet = (workoutId: string, exIdx: number) => {
    setInlineDrafts(prev => {
      const draft = prev[workoutId];
      if (!draft) return prev;
      const next = { ...draft };
      const exercise = next.exercises[exIdx];
      const lastSet = exercise.sets[exercise.sets.length - 1];
      exercise.sets = [
        ...exercise.sets,
        { set: exercise.sets.length + 1, weight: lastSet ? lastSet.weight : 0, reps: lastSet ? lastSet.reps : 0, done: false }
      ];
      return { ...prev, [workoutId]: next };
    });
  };

  const removeInlineSet = (workoutId: string, exIdx: number, setIdx: number) => {
    setInlineDrafts(prev => {
      const draft = prev[workoutId];
      if (!draft) return prev;
      const next = { ...draft };
      const exercise = next.exercises[exIdx];
      exercise.sets = exercise.sets.filter((_, idx) => idx !== setIdx).map((s, idx) => ({ ...s, set: idx + 1 }));
      return { ...prev, [workoutId]: next };
    });
  };

  const updateInlineExerciseName = (workoutId: string, exIdx: number, name: string) => {
    setInlineDrafts(prev => {
      const draft = prev[workoutId];
      if (!draft) return prev;
      const next = { ...draft };
      next.exercises[exIdx].name = name;
      next.exercises[exIdx].nameKey = resolveExerciseKey(name);
      return { ...prev, [workoutId]: next };
    });
  };

  const updateInlineSet = (workoutId: string, exIdx: number, setIdx: number, field: 'weight' | 'reps', val: string) => {
    setInlineDrafts(prev => {
      const draft = prev[workoutId];
      if (!draft) return prev;
      const next = { ...draft };
      const cleanVal = field === 'weight' ? val.replace(',', '.').replace(/[^\d.]/g, '') : val.replace(/[^\d]/g, '');
      const numVal = field === 'weight' ? parseFloat(cleanVal) || 0 : parseInt(cleanVal) || 0;
      if (field === 'weight') {
        const maxWeight = units === 'imperial' ? 1000 : 500;
        next.exercises[exIdx].sets[setIdx][field] = Math.max(0, Math.min(numVal, maxWeight));
      } else {
        next.exercises[exIdx].sets[setIdx][field] = Math.max(0, Math.min(numVal, 200));
      }
      return { ...prev, [workoutId]: next };
    });
  };

  const saveInlineWorkout = async (workoutId: string) => {
    const draft = inlineDrafts[workoutId];
    if (!draft) return;
    const cleanedExercises = (draft.exercises || [])
      .map(ex => ({
        name: ex.name,
        nameKey: ex.nameKey || resolveExerciseKey(ex.name),
        sets: (ex.sets || [])
          .filter(s => (Number(s.weight) || 0) > 0 || (Number(s.reps) || 0) > 0)
          .map(s => ({ weight: s.weight, reps: s.reps, done: Boolean(s.done) }))
      }))
      .filter(ex => (ex.name || ex.nameKey) && ex.sets.length > 0);
    if (cleanedExercises.length === 0) {
      toast.error(t('common.error') || 'Пустая тренировка не может быть сохранена');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/workouts/${workoutId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
        body: JSON.stringify({
          name: draft.name,
          duration: 0,
          exercises: cleanedExercises
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setWorkouts(prev => prev.map(w => w._id === workoutId ? updated : w));
        toast.success(t('common.success') || 'Готово');
        setExpandedWorkoutId(null);
      } else {
        toast.error(t('common.error') || 'Ошибка');
      }
    } catch {
      toast.error(t('common.networkError') || 'Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkout = async (workoutId: string) => {
    const confirmText = t('common.confirmDelete') || 'Вы уверены, что хотите удалить тренировку?';
    if (!window.confirm(confirmText)) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/workouts/${workoutId}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token || '' }
      });
      if (res.ok) {
        setWorkouts(prev => prev.filter(w => w._id !== workoutId));
        setExpandedWorkoutId(null);
        toast.success(t('common.success') || 'Готово');
      } else {
        toast.error(t('common.error') || 'Ошибка');
      }
    } catch {
      toast.error(t('common.networkError') || 'Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSet = (exIdx: number, sIdx: number) => {
    const next = [...exercises];
    next[exIdx].sets.splice(sIdx, 1);
    next[exIdx].sets = next[exIdx].sets.map((s, i) => ({ ...s, set: i + 1 }));
    setExercises(next);
  };

  const handleUpdateSet = (exIdx: number, setIdx: number, field: string, val: string) => {
    const newEx = [...exercises];
    const cleanVal = field === 'weight' ? val.replace(',', '.').replace(/[^\d.]/g, '') : val.replace(/[^\d]/g, '');
    const numVal = field === 'weight' ? parseFloat(cleanVal) || 0 : parseInt(cleanVal) || 0;
    if (field === 'weight') {
      const maxWeight = units === 'imperial' ? 1000 : 500;
      (newEx[exIdx].sets[setIdx] as any)[field] = Math.max(0, Math.min(numVal, maxWeight));
    } else {
      (newEx[exIdx].sets[setIdx] as any)[field] = Math.max(0, Math.min(numVal, 200));
    }
    setExercises(newEx);
  };

  const getExerciseId = (name: string, nameKey?: string) => {
    const key = nameKey || resolveExerciseKey(name);
    if (key) return key;
    const trimmed = (name || '').trim();
    return trimmed || undefined;
  };

  const toggleFavorite = (name: string, nameKey?: string) => {
    const id = getExerciseId(name, nameKey);
    if (!id) return;
    setFavorites(prev => prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]);
  };

  const isFavorite = (name: string, nameKey?: string) => {
    const id = getExerciseId(name, nameKey);
    if (!id) return false;
    return favorites.includes(id);
  };

  const fetchHint = async (name: string, idx: number, nameKey?: string) => {
    const trimmed = name.trim();
    if (!trimmed || !token) {
      setHints(prev => ({ ...prev, [idx]: { last: null, best: null } }));
      return;
    }
    try {
      const params = new URLSearchParams();
      if (nameKey) params.set('nameKey', nameKey);
      else params.set('name', trimmed);
      const resp = await fetch(`${API_URL}/api/workouts/hints?${params.toString()}`, {
        headers: { 'x-auth-token': token || '' }
      });
      const data = await resp.json();
      setHints(prev => ({ ...prev, [idx]: { last: data.last || null, best: data.best || null } }));
    } catch (e) {
      setHints(prev => ({ ...prev, [idx]: { last: null, best: null } }));
    }
  };

  const scheduleHint = (name: string, idx: number, nameKey?: string) => {
    if (hintTimers.current[idx]) clearTimeout(hintTimers.current[idx]);
    hintTimers.current[idx] = setTimeout(() => fetchHint(name, idx, nameKey), 400);
  };

  const toggleSetDone = (exIdx: number, sIdx: number) => {
    const next = [...exercises];
    const isNowDone = !next[exIdx].sets[sIdx].done;
    next[exIdx].sets[sIdx].done = isNowDone;
    setExercises(next);
    
    if (isNowDone) {
      setRestTimer(60); // 60s rest by default
      setIsRestActive(true);
      // Haptic feedback simulation
      if (window.navigator.vibrate) window.navigator.vibrate(20);
    } else {
      setIsRestActive(false);
    }
  };

  const handleSave = async () => {
    if (exercises.length === 0) return toast.error(t('diary.addExercise') || 'Добавьте хотя бы одну упражнение');
    const cleanedExercises = (exercises || [])
      .map(ex => ({
        name: ex.name,
        nameKey: ex.nameKey || resolveExerciseKey(ex.name),
        sets: (ex.sets || [])
          .filter(s => (Number(s.weight) || 0) > 0 || (Number(s.reps) || 0) > 0)
          .map(s => ({ weight: s.weight, reps: s.reps, done: Boolean(s.done) }))
      }))
      .filter(ex => (ex.name || ex.nameKey) && ex.sets.length > 0);
    if (cleanedExercises.length === 0) {
      return toast.error(t('common.error') || 'Пустая тренировка не может быть сохранена');
    }
    
    setLoading(true);
    try {
      const serverNow = await fetchServerNow();
      const url = editingWorkoutId ? `${API_URL}/api/workouts/${editingWorkoutId}` : `${API_URL}/api/workouts`;
      const res = await fetch(url, {
        method: editingWorkoutId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
        body: JSON.stringify({
          name: workoutName,
          duration: Math.max(1, Math.round(workoutElapsed / 60)),
          exercises: cleanedExercises,
          date: workoutDate || serverNow
        })
      });
      
      if (res.ok) {
        // ── Build celebration summary ──────────────────────────────
        // Historical best weight per exercise (excluding the one being edited)
        const historicalBest: Record<string, number> = {};
        workouts.forEach(w => {
          if (editingWorkoutId && w._id === editingWorkoutId) return;
          (w.exercises || []).forEach((ex: any) => {
            const key = ex.nameKey || ex.name;
            (ex.sets || []).forEach((s: any) => {
              const wt = Number(s.weight) || 0;
              if (wt > (historicalBest[key] || 0)) historicalBest[key] = wt;
            });
          });
        });

        const prs: { name: string; weight: number }[] = [];
        let setsDone = 0;
        let volume = 0;
        cleanedExercises.forEach(ex => {
          const key = ex.nameKey || ex.name;
          let exMax = 0;
          ex.sets.forEach(s => {
            setsDone += 1;
            volume += (Number(s.weight) || 0) * (Number(s.reps) || 0);
            if ((Number(s.weight) || 0) > exMax) exMax = Number(s.weight) || 0;
          });
          if (exMax > 0 && exMax > (historicalBest[key] || 0)) {
            prs.push({ name: ex.name || key, weight: exMax });
          }
        });

        setEditingWorkoutId(null);
        setView('list');
        setOverlayMinimized(false);
        setCompletedSummary({
          durationMin: Math.max(1, Math.round(workoutElapsed / 60)),
          volume,
          setsDone,
          exercises: cleanedExercises.length,
          prs,
        });
      } else {
        toast.error(t('common.error') || 'Save failed');
      }
    } catch (e) {
      toast.error(t('common.networkError') || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalVolume = () => {
    return exercises.reduce((acc, ex) => 
      acc + ex.sets.reduce((sAcc, s) => sAcc + (s.weight * s.reps), 0), 0
    );
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return `${m}:${rs.toString().padStart(2, '0')}`;
  };

  const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const todayWorkouts = workouts.filter(w => isSameDay(new Date(w.date), new Date()));
  const favoriteWorkouts = workouts.filter(w => (w.exercises || []).some((ex: any) => {
    const id = getExerciseId(ex.name || '', ex.nameKey);
    return id ? favorites.includes(id) : false;
  }));
  const weekDaysRaw = t('dashboard.weekDays');
  const weekDays = Array.isArray(weekDaysRaw) ? weekDaysRaw : ['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'];
  const byDay = (list: any[]) => dayFilter === null ? list : list.filter(w => assignedDays[w._id] === dayFilter);
  const visibleWorkouts = byDay(view === 'today' ? todayWorkouts : view === 'favorites' ? favoriteWorkouts : workouts);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredWorkouts = normalizedQuery
    ? visibleWorkouts.filter(w => {
        const nameMatch = (w.name || '').toLowerCase().includes(normalizedQuery);
        const exMatch = (w.exercises || []).some((ex: any) => {
          const raw = String(ex.name || '').toLowerCase();
          const key = ex.nameKey || resolveExerciseKey(ex.name || '');
          const display = translateExerciseName(key, ex.name || '').toLowerCase();
          return raw.includes(normalizedQuery) || display.includes(normalizedQuery);
        });
        return nameMatch || exMatch;
      })
    : visibleWorkouts;

  const localeMap: Record<string, string> = { ru: 'ru-RU', uk: 'uk-UA', en: 'en-US' };
  const locale = localeMap[language] || 'uk-UA';

  const startWorkoutFromFavorites = () => {
    if (!favorites.length) {
      toast.error(t('common.error') || 'Нет избранных');
      return;
    }
    const starter = favorites.map((value) => {
      const key = resolveExerciseKey(value) || value;
      return {
        name: translateExerciseName(key, value),
        nameKey: key,
        sets: [{ set: 1, weight: 0, reps: 0, done: false }]
      };
    });
    setExercises(starter);
    setWorkoutName(t('diary.favoritesTitle') || 'Favorites');
    fetchServerNow().then(now => setWorkoutDate(now));
    setView('active');
    setHints({});
    favorites.forEach((id, idx) => scheduleHint(translateExerciseName(id, id), idx, resolveExerciseKey(id) || id));
    setEditingWorkoutId(null);
    setExpandedWorkoutId(null);
  };


  // ─── START MODAL ──────────────────────────────────────────────────────────
  const StartModal = () => (
    <div className="fixed inset-0 z-[2000] flex items-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowStartModal(false)} />
      <div className="relative w-full apple-card rounded-t-3xl animate-slide-up" style={{ borderTop: '0.5px solid var(--separator)', maxHeight: '85vh' }}>
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-5" style={{ background: 'var(--separator)' }} />
        <div className="overflow-y-auto px-5" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)', maxHeight: 'calc(85vh - 32px)' }}>
          <h2 className="text-xl font-bold apple-text mb-1">Нове тренування</h2>
          <p className="text-sm apple-text-2 mb-5">Обери спосіб старту</p>
          <div className="space-y-2.5">
            <button onClick={() => { setShowStartModal(false); startWorkout(); }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl text-white active:scale-[0.98] transition-transform"
              style={{ background: 'linear-gradient(135deg, var(--accent-move) 0%, #FF6B9D 100%)', boxShadow: '0 4px 16px rgba(255,55,95,0.3)' }}>
              <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Play className="w-6 h-6 text-white fill-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Швидкий старт</p>
                <p className="text-sm opacity-70">Почни порожнє тренування</p>
              </div>
              <ChevronRight className="w-5 h-5 opacity-60 ml-auto" />
            </button>

            {workouts.filter(w => w.source === 'generator').length > 0 && (
              <button onClick={() => { setShowStartModal(false); const n = workouts.filter(w => w.source === 'generator').sort((a,b) => new Date(a.date).getTime()-new Date(b.date).getTime())[0]; if(n) openWorkout(n); }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl apple-card2 active:scale-[0.98] transition-transform" style={{ border: '0.5px solid var(--separator)' }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent-stand)20' }}>
                  <Zap className="w-6 h-6" style={{ color: 'var(--accent-stand)' }} />
                </div>
                <div className="text-left">
                  <p className="font-semibold apple-text">З програми</p>
                  <p className="text-sm apple-text-2">Продовжити заплановане</p>
                </div>
                <ChevronRight className="w-5 h-5 apple-text-3 ml-auto" />
              </button>
            )}

            {favorites.length > 0 && (
              <button onClick={() => { setShowStartModal(false); startWorkoutFromFavorites(); }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl apple-card2 active:scale-[0.98] transition-transform" style={{ border: '0.5px solid var(--separator)' }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent-energy)20' }}>
                  <Star className="w-6 h-6" style={{ color: 'var(--accent-energy)' }} />
                </div>
                <div className="text-left">
                  <p className="font-semibold apple-text">З улюблених</p>
                  <p className="text-sm apple-text-2">{favorites.length} вправ</p>
                </div>
                <ChevronRight className="w-5 h-5 apple-text-3 ml-auto" />
              </button>
            )}

            <button onClick={() => { setShowStartModal(false); onNavigate('generator'); }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl apple-card2 active:scale-[0.98] transition-transform" style={{ border: '0.5px solid var(--separator)' }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#BF5AF220' }}>
                <Target className="w-6 h-6" style={{ color: '#BF5AF2' }} />
              </div>
              <div className="text-left">
                <p className="font-semibold apple-text">Згенерувати програму</p>
                <p className="text-sm apple-text-2">AI підбере вправи</p>
              </div>
              <ChevronRight className="w-5 h-5 apple-text-3 ml-auto" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── RENDER ───────────────────────────────────────────────────────────────
  const isListView = view === 'list' || view === 'today' || view === 'favorites';
  const isActiveView = view === 'active';

  return (
    <div className="h-full apple-bg overflow-hidden flex flex-col">
      {showStartModal && <StartModal />}
      {completedSummary && (
        <WorkoutCompleteOverlay
          summary={completedSummary}
          units={units}
          onClose={() => { setCompletedSummary(null); setView('list'); fetchWorkouts(); }}
        />
      )}
      {isActiveView && !completedSummary && (
        <ActiveWorkoutOverlay
          workoutName={workoutName}
          exercises={exercises}
          elapsed={workoutElapsed}
          isMinimized={overlayMinimized}
          onMinimize={() => setOverlayMinimized(true)}
          onExpand={() => setOverlayMinimized(false)}
          onSave={() => { handleSave(); setOverlayMinimized(false); }}
          onCancel={() => { if(window.confirm('Скасувати тренування?')) { setView('list'); setOverlayMinimized(false); } }}
          onSetDone={(exIdx, sIdx) => toggleSetDone(exIdx, sIdx)}
          onUpdateSet={(exIdx, sIdx, field, val) => handleUpdateSet(exIdx, sIdx, field, val)}
          units={units}
        />
      )}

      {/* ── LIST VIEW (always shown; workout goes to overlay) ─────────── */}
      <div className="flex flex-col h-full" style={{ visibility: isActiveView && !overlayMinimized ? 'hidden' : 'visible' }}>
          {/* Header */}
          <div className="px-5 pt-[calc(3rem+env(safe-area-inset-top))] pb-3 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold apple-text tracking-tight">
                  {view === 'today' ? 'Сьогодні' : view === 'favorites' ? 'Обрані' : (t('diary.title') || 'Щоденник')}
                </h1>
                <p className="text-sm apple-text-2 mt-0.5">{workouts.length} тренувань</p>
              </div>
              <button onClick={() => setShowStartModal(true)}
                className="w-11 h-11 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform"
                style={{ background: 'var(--accent-move)', boxShadow: '0 4px 12px rgba(255,55,95,0.35)' }}>
                <Plus className="w-6 h-6" strokeWidth={2.5} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1.5 p-1 apple-card rounded-xl mb-3" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              {[{id:'list',label:t('diary.all')||'Усі'},{id:'today',label:t('diary.today')||'Сьогодні'},{id:'favorites',label:t('diary.favorites')||'Обрані'}].map(tab => (
                <button key={tab.id} onClick={() => { setView(tab.id as any); setDayFilter(null); }}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
                  style={{ background: view === tab.id ? 'var(--accent-move)' : 'transparent', color: view === tab.id ? '#fff' : 'var(--text-secondary)' }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 apple-text-3 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Пошук тренувань та вправ"
                className="w-full apple-card rounded-xl pl-10 pr-4 py-3 text-sm apple-text outline-none"
                style={{ border: '0.5px solid var(--separator)' }} />
            </div>
          </div>

          {/* Quick stats */}
          <div className="px-5 flex gap-3 mb-3 flex-shrink-0">
            <div className="flex-1 apple-card rounded-2xl p-3.5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--accent-move)' }} />
                <span className="text-xs apple-text-3">Об'єм</span>
              </div>
              <p className="text-xl font-bold apple-text">
                {workouts.reduce((a,w) => a+(w.exercises?.reduce((b:number,ex:any)=>b+ex.sets?.reduce((c:number,s:any)=>c+(s.weight*s.reps),0),0)||0),0).toLocaleString()}
              </p>
            </div>
            <div className="flex-1 apple-card rounded-2xl p-3.5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5" style={{ color: 'var(--accent-stand)' }} />
                <span className="text-xs apple-text-3">Всього</span>
              </div>
              <p className="text-xl font-bold apple-text">{workouts.length}</p>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-5 pb-28">
            {loading ? (
              <div className="py-20 flex justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent-move)', borderTopColor: 'transparent' }} />
              </div>
            ) : filteredWorkouts.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--bg-card2)' }}>
                  <Dumbbell className="w-8 h-8 apple-text-3" />
                </div>
                <p className="text-base font-semibold apple-text mb-1">{view==='today'?'Сьогодні немає тренувань':'Ще немає тренувань'}</p>
                <p className="text-sm apple-text-2 mb-6">Натисни + щоб почати</p>
                <button onClick={() => setShowStartModal(true)}
                  className="px-6 py-3 rounded-xl text-white text-sm font-semibold"
                  style={{ background: 'var(--accent-move)' }}>
                  Почати тренування
                </button>
              </div>
            ) : (
              <div className="apple-card rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                {filteredWorkouts.map((w, idx) => {
                  const wName = w.source === 'generator' && w.programDayIndex
                    ? `${t('common.day')} ${w.programDayIndex}: ${w.programGoal ? t(`generator.goals.${w.programGoal}`) : (w.programTitle || t('common.workout'))}`
                    : (w.name || t('common.workout'));
                  return (
                    <div key={w._id} style={{ borderBottom: idx < filteredWorkouts.length - 1 ? '0.5px solid var(--separator)' : 'none' }}>
                      <div onClick={() => openWorkout(w)} className="flex items-center gap-3 px-4 py-3.5 active:opacity-70 cursor-pointer">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: w.source==='generator' ? 'var(--accent-stand)20' : 'var(--accent-move)20' }}>
                          <Dumbbell className="w-5 h-5" style={{ color: w.source==='generator' ? 'var(--accent-stand)' : 'var(--accent-move)' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold apple-text truncate">{wName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs apple-text-3">
                              {new Intl.DateTimeFormat(locale, {day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(w.date))}
                            </span>
                            {(w.duration||0) > 0 && <>
                              <span className="text-xs apple-text-3">·</span>
                              <span className="text-xs apple-text-3">{w.duration}хв</span>
                            </>}
                            <span className="text-xs apple-text-3">· {w.exercises?.length||0} вправ</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button onClick={e => { e.stopPropagation(); deleteWorkout(w._id); }}
                            className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                            style={{ background: 'var(--bg-card2)' }}>
                            <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--accent-move)' }} />
                          </button>
                          <ChevronRight className="w-4 h-4 apple-text-3" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

      </div>
    </div>
  );
}
