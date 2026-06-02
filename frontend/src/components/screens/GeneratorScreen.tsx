import { useState, useEffect } from 'react';
import { ChevronLeft, Dumbbell, Zap, Target, User, Users, Lock, Crown, Plus, Check, BookOpen, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';
import PremiumModal from '../modals/PremiumModal';

export default function GeneratorScreen({ onNavigate }: { onNavigate: (s: string) => void }) {
  const { t, language } = useSettings();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [selectedGoal, setSelectedGoal] = useState('mass');
  const [selectedDays, setSelectedDays] = useState(3);
  const [selectedIntensity, setSelectedIntensity] = useState('medium');

  useEffect(() => {
    fetch(`${API_URL}/api/user/profile`, { headers: { 'x-auth-token': token || '' } })
      .then(r => r.json()).then(d => { setIsPremium(d.isPremium); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const goals = [
    { id: 'mass',     label: t('generator.goals.mass'),     icon: Dumbbell, color: 'var(--accent-stand)' },
    { id: 'strength', label: t('generator.goals.strength'), icon: Zap,      color: 'var(--accent-energy)' },
    { id: 'fat_loss', label: t('generator.goals.fat_loss'), icon: Target,   color: 'var(--accent-exercise)' },
    { id: 'upper',    label: t('generator.goals.upper'),    icon: User,     color: 'var(--accent-move)' },
    { id: 'lower',    label: t('generator.goals.lower'),    icon: Users,    color: '#BF5AF2' },
  ];

  const intensities = [
    { id: 'low',    label: t('generator.intensities.low'),    desc: t('generator.intensities.lowDesc') },
    { id: 'medium', label: t('generator.intensities.medium'), desc: t('generator.intensities.mediumDesc') },
    { id: 'high',   label: t('generator.intensities.high'),   desc: t('generator.intensities.highDesc') },
  ];

  const localeMap: Record<string, string> = { ru: 'ru-RU', uk: 'uk-UA', en: 'en-US' };
  const locale = localeMap[language] || 'uk-UA';

  const getMuscleLabel = (m: string) => {
    const map: Record<string, string> = {
      chest: t('statistics.muscleGroups.chest'), back: t('statistics.muscleGroups.back'),
      legs: t('statistics.muscleGroups.legs'), shoulders: t('statistics.muscleGroups.shoulders'),
      arms: t('statistics.muscleGroups.arms'), core: t('library.abs'), all: t('library.allMuscles')
    };
    return map[m.toLowerCase()] || m;
  };

  const getExerciseName = (ex: any) => ex.nameKey ? t(`library.exercisesList.${ex.nameKey}.name`) : (ex.name || '');

  const dayTitlesMap: Record<string, Record<string, string[]>> = {
    en: { mass: ['Chest + Triceps','Back + Biceps','Legs + Shoulders','Upper Body','Lower Body','Shoulders + Core'],
      strength: ['Squat + Acc','Bench + Acc','Deadlift + Acc','Overhead Press','Squat + Acc','Bench + Acc'],
      fat_loss: ['Upper + Cardio','Lower + Cardio','Full Body','Full Body + HIIT','Upper + Cardio','Lower + Cardio'],
      upper: ['Chest + Triceps','Back + Biceps','Shoulders + Core','Chest + Triceps','Back + Biceps','Shoulders + Core'],
      lower: ['Quadriceps','Glutes/Hamstrings','Legs + Cardio','Quadriceps','Glutes/Hamstrings','Legs + Cardio'] },
    uk: { mass: ['Груди + Трицепс','Спина + Біцепс','Ноги + Плечі','Верх тіла','Низ тіла','Плечі + Кор'],
      strength: ['Присідання + Дод','Жим лежачи + Дод','Тяга + Дод','Жим над головою','Присідання + Дод','Жим лежачи + Дод'],
      fat_loss: ['Верх + кардіо','Низ + кардіо','Повне тіло','Повне тіло + HIIT','Верх + кардіо','Низ + кардіо'],
      upper: ['Груди + Трицепс','Спина + Біцепс','Плечі + Кор','Груди + Трицепс','Спина + Біцепс','Плечі + Кор'],
      lower: ['Квадрицепси','Сідниці/Задня поверхня','Ноги + кардіо','Квадрицепси','Сідниці/Задня поверхня','Ноги + кардіо'] },
    ru: { mass: ['Грудь + Трицепс','Спина + Бицепс','Ноги + Плечи','Верх тела','Низ тела','Плечи + Кор'],
      strength: ['Присед + Доп','Жим лёжа + Доп','Тяга + Доп','Жим над головой','Присед + Доп','Жим лёжа + Доп'],
      fat_loss: ['Верх + кардио','Низ + кардио','Полное тело','Полное тело + HIIT','Верх + кардио','Низ + кардио'],
      upper: ['Грудь + Трицепс','Спина + Бицепс','Плечи + Кор','Грудь + Трицепс','Спина + Бицепс','Плечи + Кор'],
      lower: ['Квадрицепсы','Ягодицы/Задняя поверхность','Ноги + кардио','Квадрицепсы','Ягодицы/Задняя поверхность','Ноги + кардио'] }
  };

  const getDayTitle = (goal: string, idx: number) => {
    const lang = dayTitlesMap[language] ? language : 'uk';
    return dayTitlesMap[lang]?.[goal]?.[idx] || `Day ${idx + 1}`;
  };

  const getDayDate = (offset: number) => {
    const d = new Date(); d.setDate(d.getDate() + offset);
    return new Intl.DateTimeFormat(locale, { weekday: 'short', day: '2-digit', month: '2-digit' }).format(d);
  };

  const handleGenerate = async () => {
    setGenerating(true); setGenerated([]);
    try {
      const res = await fetch(`${API_URL}/api/programs/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
        body: JSON.stringify({ goal: selectedGoal, days: selectedDays, intensity: selectedIntensity, lang: language })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setGenerated(data.program || []);
      setMeta(data.meta);
      toast.success(t('common.success'));
    } catch (e: any) { toast.error(e.message); }
    finally { setGenerating(false); }
  };

  const handleSaveToDiary = async () => {
    if (!generated.length) return;
    try {
      const goalLabel = goals.find(g => g.id === selectedGoal)?.label || '';
      const programId = `gen-${Date.now()}`;
      const programTitle = `${goalLabel} · ${selectedDays}d`;
      const timeRes = await fetch(`${API_URL}/api/workouts/time`);
      const { now } = await timeRes.json();
      const base = new Date(now || new Date());

      for (let i = 0; i < generated.length; i++) {
        const day = generated[i];
        const exPayload = (day.exercises || []).map((ex: any) => {
          const repsNum = parseInt(String(ex.reps || '10').split('-').pop()?.replace(/\D/g,'') || '10') || 10;
          return {
            name: getExerciseName(ex), nameKey: ex.nameKey,
            notes: ex.muscle ? `${t('library.target')}: ${getMuscleLabel(ex.muscle)}` : '',
            sets: Array.from({ length: Number(ex.sets) || 3 }).map(() => ({ weight: 0, reps: repsNum, done: false }))
          };
        });
        const d = new Date(base); d.setDate(base.getDate() + i); d.setHours(12,0,0,0);
        const res = await fetch(`${API_URL}/api/workouts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
          body: JSON.stringify({ name: `${t('common.day')} ${i+1}: ${programTitle}`, duration: 45, exercises: exPayload, date: d.toISOString(), source: 'generator', programId, programTitle, programDayIndex: i+1, programGoal: selectedGoal })
        });
        if (!res.ok) throw new Error((await res.json()).message);
      }
      toast.success(t('common.success'));
      onNavigate('diary');
    } catch (e: any) { toast.error(e.message); }
  };

  if (loading) return (
    <div className="h-full apple-bg flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent-move)', borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div className="h-full apple-bg overflow-y-auto pb-28">
      <div className="px-5 pt-[calc(3rem+env(safe-area-inset-top))] pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate('dashboard')} className="w-9 h-9 apple-card rounded-full flex items-center justify-center active:scale-90 transition-transform" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
            <ChevronLeft className="w-5 h-5 apple-text-2" />
          </button>
          <div>
            <h1 className="text-2xl font-bold apple-text">{t('generator.title')}</h1>
            <p className="text-xs apple-text-3 mt-0.5">{t('generator.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-6">
        {/* Templates shortcut */}
        <button onClick={() => onNavigate('templates')}
          className="w-full apple-card rounded-2xl flex items-center gap-4 px-4 py-4 active:opacity-70" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-exercise)20' }}>
            <BookOpen className="w-5 h-5" style={{ color: 'var(--accent-exercise)' }} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold apple-text">Готові програми</p>
            <p className="text-xs apple-text-3 mt-0.5">PPL, Upper/Lower, 5×5 та інші</p>
          </div>
          <ChevronRight className="w-4 h-4 apple-text-3" />
        </button>

        {/* Goal */}
        <div>
          <h3 className="text-sm font-semibold apple-text-2 mb-3 uppercase tracking-wider">{t('generator.selectGoal')}</h3>
          <div className="grid grid-cols-2 gap-2.5">
            {goals.map(g => (
              <button key={g.id} onClick={() => setSelectedGoal(g.id)}
                className="flex items-center gap-3 p-4 rounded-2xl apple-card active:scale-95 transition-all text-left"
                style={{
                  boxShadow: selectedGoal === g.id ? `0 0 0 2px ${g.color}` : '0 1px 4px rgba(0,0,0,0.06)',
                  background: selectedGoal === g.id ? g.color + '12' : 'var(--bg-card)',
                }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: g.color + '20' }}>
                  <g.icon className="w-5 h-5" style={{ color: g.color }} />
                </div>
                <span className="text-sm font-medium apple-text leading-tight">{g.label}</span>
                {selectedGoal === g.id && <Check className="w-4 h-4 ml-auto flex-shrink-0" style={{ color: g.color }} />}
              </button>
            ))}
          </div>
        </div>

        {/* Days */}
        <div>
          <h3 className="text-sm font-semibold apple-text-2 mb-3 uppercase tracking-wider">{t('generator.daysPerWeek')}</h3>
          <div className="flex gap-2 p-1.5 apple-card rounded-2xl" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            {[2,3,4,5,6].map(d => (
              <button key={d} onClick={() => setSelectedDays(d)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95"
                style={{
                  background: selectedDays === d ? 'var(--accent-stand)' : 'transparent',
                  color: selectedDays === d ? '#fff' : 'var(--text-secondary)',
                }}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Intensity */}
        <div>
          <h3 className="text-sm font-semibold apple-text-2 mb-3 uppercase tracking-wider">{t('generator.intensity')}</h3>
          <div className="apple-card rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            {intensities.map((int, i) => (
              <button key={int.id} onClick={() => setSelectedIntensity(int.id)}
                className="w-full flex items-center justify-between px-4 py-3.5 text-left active:opacity-70"
                style={{ borderBottom: i < intensities.length - 1 ? '0.5px solid var(--separator)' : 'none' }}>
                <div>
                  <p className="text-sm font-medium apple-text">{int.label}</p>
                  <p className="text-xs apple-text-3 mt-0.5">{int.desc}</p>
                </div>
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-4 transition-all"
                  style={{ borderColor: selectedIntensity === int.id ? 'var(--accent-stand)' : 'var(--separator)' }}>
                  {selectedIntensity === int.id && <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--accent-stand)' }} />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button onClick={handleGenerate} disabled={generating}
          className="w-full py-4 rounded-2xl text-white font-semibold text-base active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: 'var(--accent-move)', boxShadow: '0 4px 16px rgba(255,55,95,0.35)' }}>
          {generating ? (
            <><div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Генерую...</>
          ) : (
            <><Zap className="w-5 h-5" /> {t('generator.generate')}</>
          )}
        </button>

        {/* Generated program */}
        {generated.length > 0 && (
          <div className="space-y-4 pb-4">
            <h3 className="text-base font-semibold apple-text">{t('generator.generated')}</h3>

            {generated.map((day, idx) => (
              <div key={idx} className="apple-card rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: '0.5px solid var(--separator)' }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-white" style={{ background: 'var(--accent-stand)' }}>
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold apple-text">{getDayTitle(meta?.goal || selectedGoal, idx)}</p>
                    <p className="text-xs apple-text-3">{getDayDate(idx)}</p>
                  </div>
                </div>
                {(day.exercises || []).map((ex: any, ei: number) => (
                  <div key={ei} className="flex items-center gap-3 px-4 py-3"
                    style={{ borderBottom: ei < day.exercises.length - 1 ? '0.5px solid var(--separator)' : 'none' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-card2)' }}>
                      <Dumbbell className="w-4 h-4 apple-text-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium apple-text truncate">{getExerciseName(ex)}</p>
                      <p className="text-xs apple-text-3">{getMuscleLabel(ex.muscle)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold apple-text">{ex.sets} × {ex.reps}</p>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {/* Premium upsell */}
            {!isPremium && (
              <div className="apple-card rounded-2xl p-4 flex items-center gap-3" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid var(--accent-energy)20' }}>
                <Crown className="w-6 h-6 flex-shrink-0" style={{ color: 'var(--accent-energy)' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold apple-text">{t('generator.premiumTitle')}</p>
                  <p className="text-xs apple-text-3">{t('generator.premiumDesc')}</p>
                </div>
                <button onClick={() => setShowPremium(true)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex-shrink-0" style={{ background: 'var(--accent-energy)' }}>
                  {t('generator.upgradeNow')}
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button disabled={!isPremium} onClick={async () => {
                try {
                  await fetch(`${API_URL}/api/programs/save`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-token': token||'' }, body: JSON.stringify({ name: 'Моя програма', program: generated }) });
                  toast.success(t('common.success'));
                } catch { toast.error(t('common.error')); }
              }}
                className="py-3.5 rounded-2xl text-sm font-semibold apple-card apple-text disabled:opacity-40 active:scale-95 transition-transform flex items-center justify-center gap-2"
                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                {!isPremium && <Lock className="w-4 h-4 apple-text-3" />}
                {t('generator.saveTemplate')}
              </button>
              <button onClick={handleSaveToDiary}
                className="py-3.5 rounded-2xl text-sm font-semibold text-white active:scale-95 transition-transform flex items-center justify-center gap-2"
                style={{ background: 'var(--accent-stand)', boxShadow: '0 4px 12px rgba(10,132,255,0.3)' }}>
                <Plus className="w-4 h-4" /> {t('generator.saveToDiary')}
              </button>
            </div>
          </div>
        )}
      </div>

      <PremiumModal isOpen={showPremium} onClose={() => setShowPremium(false)} onSuccess={() => setIsPremium(true)} isPremium={isPremium} />
    </div>
  );
}
