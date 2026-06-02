import { useState, useEffect, useRef } from 'react';
import { Plus, Check, Trash2, Timer, Save, X, Dumbbell, Clock, TrendingUp, ChevronRight, Star, Pencil, Eye, Search, Zap, Target, BarChart2, Play } from 'lucide-react';
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
        toast.success(t('common.success') || 'Saved!');
        setView('list');
        setEditingWorkoutId(null);
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

  // START WORKOUT MODAL
  const StartModal = () => (
    <div className="fixed inset-0 z-[200] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowStartModal(false)} />
      <div className="relative w-full max-w-lg bg-slate-900 rounded-t-[3rem] p-8 pb-[calc(2rem+env(safe-area-inset-bottom))] animate-slide-up border-t border-white/10">
        {/* Handle */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-8" />

        <h2 className="text-white text-2xl font-black tracking-tight mb-2">Нове тренування</h2>
        <p className="text-white/40 text-sm mb-8">Обери спосіб старту</p>

        <div className="space-y-3">
          {/* Quick start */}
          <button
            onClick={() => { setShowStartModal(false); startWorkout(); }}
            className="w-full flex items-center gap-5 p-5 bg-gradient-to-r from-orange-500 to-pink-500 rounded-[2rem] active:scale-[0.98] transition-all shadow-xl shadow-orange-500/20"
          >
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Play className="w-7 h-7 text-white fill-white" />
            </div>
            <div className="text-left">
              <p className="text-white font-black text-lg">Швидкий старт</p>
              <p className="text-white/70 text-sm">Почни порожнє тренування</p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/60 ml-auto" />
          </button>

          {/* From program */}
          {workouts.filter(w => w.source === 'generator').length > 0 && (
            <button
              onClick={() => {
                setShowStartModal(false);
                const nextPlan = workouts.filter(w => w.source === 'generator')
                  .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
                if (nextPlan) openWorkout(nextPlan);
              }}
              className="w-full flex items-center gap-5 p-5 bg-white/5 border border-white/10 rounded-[2rem] active:scale-[0.98] transition-all hover:bg-white/10"
            >
              <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 border border-indigo-500/20">
                <Zap className="w-7 h-7 text-indigo-400" />
              </div>
              <div className="text-left">
                <p className="text-white font-black text-lg">З програми</p>
                <p className="text-white/40 text-sm">Продовжити заплановане</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/30 ml-auto" />
            </button>
          )}

          {/* From favorites */}
          {favorites.length > 0 && (
            <button
              onClick={() => { setShowStartModal(false); startWorkoutFromFavorites(); }}
              className="w-full flex items-center gap-5 p-5 bg-white/5 border border-white/10 rounded-[2rem] active:scale-[0.98] transition-all hover:bg-white/10"
            >
              <div className="w-14 h-14 bg-yellow-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 border border-yellow-500/20">
                <Star className="w-7 h-7 text-yellow-400" />
              </div>
              <div className="text-left">
                <p className="text-white font-black text-lg">З улюблених</p>
                <p className="text-white/40 text-sm">{favorites.length} вправ збережено</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/30 ml-auto" />
            </button>
          )}

          {/* Go to generator */}
          <button
            onClick={() => { setShowStartModal(false); onNavigate('generator'); }}
            className="w-full flex items-center gap-5 p-5 bg-white/5 border border-white/10 rounded-[2rem] active:scale-[0.98] transition-all hover:bg-white/10"
          >
            <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 border border-purple-500/20">
              <Target className="w-7 h-7 text-purple-400" />
            </div>
            <div className="text-left">
              <p className="text-white font-black text-lg">Згенерувати програму</p>
              <p className="text-white/40 text-sm">AI підбере вправи під твою ціль</p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/30 ml-auto" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white pb-24 relative overflow-x-hidden">
      {showStartModal && <StartModal />}
      {/* Premium Background Blurs */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[50%] aspect-square bg-orange-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 p-6 pt-12">
        {view === 'list' || view === 'today' || view === 'favorites' ? (
          <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-4xl font-black tracking-tighter leading-none mb-2">{t('diary.title') || 'Дневник'}</h1>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">{view === 'today' ? (t('diary.todayTitle') || 'Сегодняшняя тренировка') : view === 'favorites' ? (t('diary.favoritesTitle') || 'Избранные упражнения') : (t('diary.subtitle') || 'История тренировок')}</p>
              </div>
              <button
                onClick={() => setShowStartModal(true)}
                className="group relative active:scale-95 transition-all"
              >
                <div className="absolute -inset-2 bg-orange-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition" />
                <div className="relative bg-orange-500 p-4 rounded-2xl shadow-xl flex items-center justify-center">
                  <Plus className="w-7 h-7 text-white" />
                </div>
              </button>
            </div>

            <div className="flex gap-2 p-1.5 bg-slate-100/80 dark:bg-white/5 rounded-[2rem] border border-slate-200/70 dark:border-white/5 backdrop-blur-md">
              {[
                { id: 'list', label: t('diary.all') || 'Все' },
                { id: 'today', label: t('diary.today') || 'Сегодня' },
                { id: 'favorites', label: t('diary.favorites') || 'Избранные' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setView(tab.id as any); setDayFilter(null); }}
                  className={`flex-1 py-3 rounded-[1.6rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                    view === tab.id ? 'bg-white text-slate-950 shadow-xl' : 'text-slate-500 hover:text-slate-950 hover:bg-slate-200/60 dark:text-white/40 dark:hover:text-white dark:hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar px-1">
              <button
                onClick={() => setDayFilter(null)}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${
                  dayFilter === null ? 'bg-white text-slate-950' : 'bg-slate-100 text-slate-500 hover:bg-slate-200/60 dark:bg-white/5 dark:text-white/40 dark:hover:bg-white/10'
                }`}
              >
                {t('diary.weekdayAll') || 'Все дни'}
              </button>
              {weekDays.map((label: string, idx: number) => (
                <button
                  key={`${label}-${idx}`}
                  onClick={() => setDayFilter(idx)}
                  className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${
                    dayFilter === idx ? 'bg-white text-slate-950' : 'bg-slate-100 text-slate-500 hover:bg-slate-200/60 dark:bg-white/5 dark:text-white/40 dark:hover:bg-white/10'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2rem] p-5 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-orange-400" />
                  <span className="text-[9px] font-black text-slate-500 dark:text-white/20 uppercase tracking-widest">{t('diary.totalVolume') || 'Тоннаж'}</span>
                </div>
                <p className="text-2xl font-black">
                  {workouts.reduce((acc, w) => acc + (w.exercises?.reduce((eAcc:any, ex:any) => eAcc + ex.sets?.reduce((sAcc:any, s:any) => sAcc + (s.weight * s.reps), 0), 0) || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2rem] p-5 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-[9px] font-black text-slate-500 dark:text-white/20 uppercase tracking-widest">{t('diary.totalWorkouts') || 'Всего тренировок'}</span>
                </div>
                <p className="text-2xl font-black">
                  {workouts.length}
                  <span className="text-sm text-slate-500 dark:text-white/30 ml-1">{t('common.workouts') || 'шт'}</span>
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
                  {view === 'today' ? (t('diary.todayList') || 'Сегодня') : view === 'favorites' ? (t('diary.favoritesList') || 'Избранные упражнения') : (t('diary.recent') || 'Последние тренировки')}
                </h3>
                {view === 'favorites' && (
                  <button
                    onClick={startWorkoutFromFavorites}
                    className="px-4 py-2 bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-white/20 transition-all"
                  >
                    {t('diary.startFromFavorites') || 'Начать из избранных'}
                  </button>
                )}
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 dark:text-white/30 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('diary.searchPlaceholder') || 'Поиск по названию или упражнениям'}
                  className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none focus:border-orange-500"
                />
              </div>
              {loading ? (
                <div className="py-20 flex flex-col items-center gap-4 opacity-20">
                  <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-widest">{t('common.loading')}</p>
                </div>
              ) : filteredWorkouts.length === 0 ? (
                <div className="py-16 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10 px-8">
                  <Dumbbell className="w-12 h-12 text-white/10 mx-auto mb-4" />
                  <p className="text-white/60 text-sm font-black mb-3">{view === 'today' ? (t('diary.todayEmpty') || 'Сегодня тренировок нет') : view === 'favorites' ? (t('diary.favoritesEmpty') || 'Избранных упражнений пока нет') : (t('diary.noWorkouts') || 'Пока нет тренировок')}</p>
                  <p className="text-slate-500 dark:text-white/30 text-xs font-bold uppercase tracking-widest mb-6">{t('diary.emptyHint') || 'Нажми + чтобы начать или сохрани программу из генератора'}</p>
                  <button
                    onClick={startWorkout}
                    className="px-8 py-4 bg-white text-slate-950 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl active:scale-95 transition-all"
                  >
                    {t('diary.startWorkout') || 'Начать тренировку'}
                  </button>
                </div>
              ) : (
                filteredWorkouts.map((w, idx) => (
                  <div 
                    key={w._id} 
                    onClick={() => openWorkout(w)}
                    className="group bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-[2.5rem] active:scale-[0.98] transition-all relative overflow-hidden animate-fade-in-up cursor-pointer"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 blur-3xl -mr-12 -mt-12 group-hover:bg-orange-500/10 transition-all" />
                    <div className="flex justify-between items-start relative z-10">
                      <div>
                        <h3 className="text-lg font-black tracking-tight mb-1 group-hover:text-orange-400 transition-colors">
                          {w.source === 'generator' && w.programDayIndex ? `${t('common.day')} ${w.programDayIndex}: ${w.programGoal ? t(`generator.goals.${w.programGoal}`) : (w.programTitle || t('common.workout'))}` : (w.name || t('common.workout'))}
                        </h3>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                            {new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(w.date))}
                          </span>
                          <div className="w-1 h-1 bg-white/10 rounded-full" />
                          <span className="text-[10px] font-black text-blue-400/60 uppercase tracking-widest">
                            {w.duration || 0} хв
                          </span>
                          {assignedDays[w._id] !== undefined && assignedDays[w._id] !== null && (
                            <>
                              <div className="w-1 h-1 bg-white/10 rounded-full" />
                              <span className="text-[10px] font-black text-orange-400/80 uppercase tracking-widest bg-orange-500/10 px-2 py-1 rounded-full">
                                {weekDays[assignedDays[w._id] as number]}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleInline(w); }}
                          className="w-10 h-10 rounded-xl bg-white/5 text-white/50 hover:bg-white/10 transition-all flex items-center justify-center"
                          title={t('diary.editInline') || 'Редактировать'}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); openWorkout(w); }}
                          className="w-10 h-10 rounded-xl bg-white text-slate-950 hover:bg-white/90 transition-all flex items-center justify-center"
                          title={t('diary.open') || 'Открыть'}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteWorkout(w._id); }}
                          className="w-10 h-10 rounded-xl bg-white/5 text-white/40 hover:bg-red-500/20 hover:text-red-400 transition-all flex items-center justify-center"
                          title={t('common.delete') || 'Удалить'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-white/5 flex gap-4">
                       <div className="flex items-center gap-1.5">
                         <Dumbbell className="w-3 h-3 text-orange-500/40" />
                         <span className="text-[10px] font-black text-white/60 uppercase">{w.exercises?.length || 0} {t('profile.exercises') || 'exercises'}</span>
                       </div>
                    </div>

                    {expandedWorkoutId === w._id && inlineDrafts[w._id] && (
                      <div className="mt-6 space-y-4 border-t border-white/5 pt-6">
                        <input
                          value={inlineDrafts[w._id].name}
                          onChange={(e) => setInlineDrafts(prev => ({ ...prev, [w._id]: { ...prev[w._id], name: e.target.value } }))}
                          className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-sm font-black outline-none focus:border-orange-500"
                        />
                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                            {t('diary.assignDay') || 'День тренировки'}
                          </span>
                          <select
                            value={assignedDays[w._id] ?? ''}
                            onChange={(e) => setWorkoutDay(w._id, e.target.value === '' ? null : Number(e.target.value))}
                            className="ml-auto bg-white/5 border border-white/10 text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl outline-none"
                          >
                            <option value="" className="bg-slate-900">{t('diary.noDay') || 'Без дня'}</option>
                            {weekDays.map((label: string, idx: number) => (
                              <option key={`${label}-${idx}`} value={idx} className="bg-slate-900">
                                {label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-4">
                          {inlineDrafts[w._id].exercises.map((ex, exIdx) => (
                            <div key={`${w._id}-${exIdx}`} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                              <div className="flex items-center gap-3">
                                <input
                                  value={translateExerciseName(ex.nameKey || resolveExerciseKey(ex.name), ex.name)}
                                  onChange={(e) => updateInlineExerciseName(w._id, exIdx, e.target.value)}
                                  className="flex-1 bg-transparent border-b border-white/10 text-sm font-black outline-none pb-1"
                                />
                                <button
                                  onClick={() => toggleFavorite(ex.name, (ex as any).nameKey)}
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${isFavorite(ex.name, (ex as any).nameKey) ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-white/20'}`}
                                >
                                  <Star className={`w-4 h-4 ${isFavorite(ex.name, (ex as any).nameKey) ? 'stroke-[2.5]' : ''}`} />
                                </button>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 px-2">
                                  <div className="w-8" />
                                  <div className="flex-1 text-[9px] font-black text-white/40 uppercase text-center tracking-widest">{t('statistics.metrics.weight') || 'Вес'} ({units === 'metric' ? t('common.kg') : t('common.lb')})</div>
                                  <div className="flex-1 text-[9px] font-black text-white/40 uppercase text-center tracking-widest">{t('statistics.metrics.reps') || 'Повторы'}</div>
                                  <div className="w-9" />
                                </div>
                                {ex.sets.map((s, sIdx) => (
                                  <div key={`${w._id}-${exIdx}-${sIdx}`} className="flex items-center gap-2">
                                    <div className="w-8 h-9 flex items-center justify-center text-[10px] font-black text-white/50">{s.set}</div>
                                    <input
                                      type="number"
                                      inputMode="decimal"
                                      enterKeyHint="next"
                                      min={0}
                                      step="0.5"
                                      value={s.weight === 0 ? '' : s.weight}
                                      onChange={(e) => updateInlineSet(w._id, exIdx, sIdx, 'weight', e.target.value)}
                                      className="flex-1 bg-white/10 border border-white/20 p-3 h-12 rounded-xl text-center text-sm font-black text-white outline-none focus:border-orange-400 focus:bg-white/15 caret-white placeholder:text-white/30"
                                      placeholder="0"
                                    />
                                    <input
                                      type="number"
                                      inputMode="numeric"
                                      enterKeyHint="done"
                                      min={0}
                                      step="1"
                                      value={s.reps === 0 ? '' : s.reps}
                                      onChange={(e) => updateInlineSet(w._id, exIdx, sIdx, 'reps', e.target.value)}
                                      className="flex-1 bg-white/10 border border-white/20 p-3 h-12 rounded-xl text-center text-sm font-black text-white outline-none focus:border-orange-400 focus:bg-white/15 caret-white placeholder:text-white/30"
                                      placeholder="0"
                                    />
                                    <button
                                      onClick={() => removeInlineSet(w._id, exIdx, sIdx)}
                                      className="w-9 h-9 rounded-xl bg-white/5 text-white/20 hover:text-red-500"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <button
                                onClick={() => addInlineSet(w._id, exIdx)}
                                className="w-full py-2 bg-white/5 border border-dashed border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40"
                              >
                                {t('diary.addSet') || 'Добавить подход'}
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => saveInlineWorkout(w._id)}
                            className="flex-1 py-3 bg-white text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                          >
                            {t('common.save') || 'Сохранить'}
                          </button>
                          <button
                            onClick={() => setExpandedWorkoutId(null)}
                            className="flex-1 py-3 bg-white/5 text-white/40 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                          >
                            {t('common.cancel') || 'Отмена'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* WORKOUT VIEW / EDIT */
          <div className="space-y-8 animate-scale-in pb-20">
            {/* Active Header */}
            <div className="flex items-center justify-between sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl py-4 -mx-6 px-6 border-b border-slate-200/70 dark:border-transparent">
              <button 
                onClick={() => { if(view === 'view' || window.confirm(t('diary.cancelWorkoutConfirm') || 'Отменить тренировку? Данные не будут сохранены.')) setView('list'); }} 
                className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl active:scale-90 transition-all border border-slate-200 dark:border-white/5"
              >
                <X className="w-5 h-5 text-slate-500 dark:text-white/40" />
              </button>
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-500 dark:text-white/30 uppercase tracking-[0.3em]">{t('common.workout') || 'Тренировка'}</p>
                {view === 'active' && workoutStartTime && (
                  <p className="text-xs font-black text-orange-400 tabular-nums mt-0.5">{formatTime(workoutElapsed)}</p>
                )}
              </div>

              {view === 'active' ? (
                <button 
                  onClick={handleSave} 
                  className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-90 transition-all"
                >
                  <Save className="w-6 h-6" />
                </button>
              ) : (
                <button 
                  onClick={startEditCurrentWorkout} 
                  className="p-3 bg-white text-slate-950 rounded-2xl shadow-lg active:scale-90 transition-all"
                  title={t('profile.edit') || 'Редактировать'}
                >
                  <Pencil className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Rest Timer Overlay (If active) */}
            {view === 'active' && isRestActive && (
              <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-[2.5rem] flex items-center justify-between animate-fade-in backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/20">
                    <Timer className="w-6 h-6 text-blue-400 animate-spin" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-blue-400/60 uppercase tracking-widest mb-1">{t('diary.rest')}</p>
                    <p className="text-2xl font-black tabular-nums">{formatTime(restTimer)}</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setIsRestActive(false); setRestTimer(0); }}
                  className="px-6 py-3 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  {t('common.skip') || 'Пропустить'}
                </button>
              </div>
            )}

            {/* Workout Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-2">
                <div className="w-1 h-1 bg-orange-500 rounded-full" />
                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">{t('diary.workoutNameLabel') || 'Название тренировки'}</span>
              </div>
              <input 
                value={workoutName}
                onChange={e => setWorkoutName(e.target.value)}
                className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-[2rem] text-xl font-black outline-none focus:border-orange-500 transition-all backdrop-blur-md"
                disabled={view === 'view'}
              />
            </div>

            {/* Exercises List */}
            <div className="space-y-6">
              {exercises.length === 0 && (
                <div className="py-16 text-center bg-white dark:bg-white/5 rounded-[3rem] border border-dashed border-slate-200 dark:border-white/10 px-8">
                  <Dumbbell className="w-12 h-12 text-slate-300 dark:text-white/10 mx-auto mb-4" />
                  <p className="text-slate-700 dark:text-white/60 text-sm font-black mb-3">{t('diary.addExercisePrompt') || 'Добавьте упражнение, чтобы начать'}</p>
                  <p className="text-slate-500 dark:text-white/30 text-xs font-bold uppercase tracking-widest">{t('diary.emptyHint') || 'Нажми + чтобы добавить первое упражнение'}</p>
                </div>
              )}
              {exercises.map((ex, exIdx) => (
                <div key={exIdx} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[3rem] p-8 space-y-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                    <Dumbbell className="w-32 h-32" />
                  </div>
                  
                  <div className="flex justify-between items-center relative z-10">
            <input 
                      value={translateExerciseName(ex.nameKey || resolveExerciseKey(ex.name), ex.name)}
                      onChange={e => {
                        const n = [...exercises];
                        n[exIdx].name = e.target.value;
                n[exIdx].nameKey = resolveExerciseKey(e.target.value);
                        setExercises(n);
                scheduleHint(e.target.value, exIdx, n[exIdx].nameKey);
                      }}
                      className="bg-transparent border-b border-slate-200 dark:border-white/10 text-xl font-black outline-none pb-2 focus:border-orange-500 transition-colors flex-1 mr-4"
                      disabled={view === 'view'}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleFavorite(ex.name, ex.nameKey)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${isFavorite(ex.name, ex.nameKey) ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-white/20'}`}
                        disabled={view === 'view'}
                      >
                        <Star className={`w-5 h-5 ${isFavorite(ex.name, ex.nameKey) ? 'stroke-[2.5]' : ''}`} />
                      </button>
                      {view === 'active' && (
                        <button 
                          onClick={() => handleRemoveExercise(exIdx)}
                          className="p-2 text-white/10 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-3 relative z-10">
                    {hints[exIdx] && (hints[exIdx].last || hints[exIdx].best) && (
                      <div className="flex items-center gap-3 px-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/30">
                        {hints[exIdx].last && (
                          <span>{t('diary.lastTime') || 'Прошлый раз'}: {hints[exIdx].last.weight} × {hints[exIdx].last.reps}</span>
                        )}
                        {hints[exIdx].best && (
                          <span>{t('diary.bestRecord') || 'Рекорд'}: {hints[exIdx].best.weight} × {hints[exIdx].best.reps}</span>
                        )}
                      </div>
                    )}
                    {ex.sets.map((s, sIdx) => (
                      <div key={sIdx} className="flex items-start gap-3 animate-fade-in-up" style={{ animationDelay: `${sIdx * 0.05}s` }}>
                        <div className="w-8 h-12 flex items-center justify-center bg-slate-100 dark:bg-white/5 rounded-xl text-xs font-black text-slate-500 dark:text-white/20 border border-slate-200 dark:border-white/5">
                          {s.set}
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <label className="flex flex-col gap-2">
                            <span className="text-[9px] font-black text-slate-500 dark:text-white/30 uppercase tracking-widest text-center">
                              {t('statistics.metrics.weight') || 'Вес'} ({units === 'metric' ? t('common.kg') : t('common.lb')})
                            </span>
                            <input 
                              type="number"
                              inputMode="decimal"
                              enterKeyHint="next"
                              min={0}
                              step="0.5"
                              value={s.weight === 0 ? '' : s.weight}
                              onChange={e => handleUpdateSet(exIdx, sIdx, 'weight', e.target.value)}
                              className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-3 h-12 rounded-xl text-center font-black outline-none focus:bg-slate-50 dark:focus:bg-white/10 focus:border-blue-500 transition-all text-lg text-slate-950 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30"
                              placeholder="0"
                              disabled={view === 'view'}
                            />
                          </label>
                          <label className="flex flex-col gap-2">
                            <span className="text-[9px] font-black text-slate-500 dark:text-white/30 uppercase tracking-widest text-center">
                              {t('statistics.metrics.reps') || 'Повторы'}
                            </span>
                            <input 
                              type="number"
                              inputMode="numeric"
                              enterKeyHint="done"
                              min={0}
                              step="1"
                              value={s.reps === 0 ? '' : s.reps}
                              onChange={e => handleUpdateSet(exIdx, sIdx, 'reps', e.target.value)}
                              className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-3 h-12 rounded-xl text-center font-black outline-none focus:bg-slate-50 dark:focus:bg-white/10 focus:border-orange-500 transition-all text-lg text-slate-950 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30"
                              placeholder="0"
                              disabled={view === 'view'}
                            />
                          </label>
                        </div>
                        {view === 'active' && (
                          <div className="flex flex-col items-center gap-2">
                            <button 
                              onClick={() => toggleSetDone(exIdx, sIdx)}
                              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-lg ${
                                s.done 
                                  ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                                  : 'bg-white/5 text-white/10 border border-white/5 hover:bg-white/10'
                              }`}
                            >
                              <Check className={`w-6 h-6 ${s.done ? 'stroke-[3]' : ''}`} />
                            </button>
                            <button
                              onClick={() => handleRemoveSet(exIdx, sIdx)}
                              className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/5 text-white/20 border border-white/5 hover:text-red-500 hover:border-red-500/30 transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {view === 'active' && (
                    <div className="flex gap-3 relative z-10">
                      <button 
                        onClick={() => handleAddSet(exIdx)}
                        className="flex-1 py-4 bg-white/5 border border-dashed border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] text-white/40 hover:bg-white/10 transition-all"
                      >
                        {t('diary.addSet')}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {view === 'active' && (
              <button 
                onClick={handleAddExercise}
                className="group w-full py-6 bg-blue-500/10 border-2 border-dashed border-blue-500/20 rounded-[2.5rem] text-blue-400 font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-3 active:scale-[0.98] transition-all hover:bg-blue-500/20"
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                {t('diary.addExercise') || 'Добавить упражнение'}
              </button>
            )}

            {/* Total Volume Info */}
            <div className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-950 border border-slate-200 dark:border-white/10 p-8 rounded-[3rem] text-center shadow-2xl">
              <p className="text-[10px] font-black text-slate-500 dark:text-white/20 uppercase tracking-[0.3em] mb-3">{t('diary.totalVolumeLabel') || t('statistics.stats.totalVolume')}</p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-black tracking-tighter text-orange-400">{calculateTotalVolume().toLocaleString()}</span>
                <span className="text-slate-500 dark:text-white/30 font-black uppercase text-xs">{units === 'metric' ? t('common.kg') : t('common.lb')}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
