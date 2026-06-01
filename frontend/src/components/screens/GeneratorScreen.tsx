import { useState, useEffect } from 'react';
import { ChevronLeft, Target, Calendar, Zap, Dumbbell, User, Users, Plus, Lock, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';
import PremiumModal from '../modals/PremiumModal';

interface GeneratorScreenProps {
  onNavigate: (screen: string) => void;
}

export default function GeneratorScreen({ onNavigate }: GeneratorScreenProps) {
  const { t, language } = useSettings();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [generated, setGenerated] = useState<{ day: string; dayIndex?: number; exercises: { nameKey?: string; name?: string; sets: number; reps: string; muscle: string }[] }[]>([]);
  const [generatedMeta, setGeneratedMeta] = useState<{ goal?: string; days?: number; intensity?: string } | null>(null);
  const [error, setError] = useState<string>('');
  
  const [selectedGoal, setSelectedGoal] = useState('mass');
  const [selectedDays, setSelectedDays] = useState(3);
  const [selectedIntensity, setSelectedIntensity] = useState('medium');

  const checkPremiumStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/user/profile`, {
        headers: {
          'x-auth-token': token || ''
        }
      });
      if (response.ok) {
        const data = await response.json();
        setIsPremium(data.isPremium);
      }
    } catch (error) {
      console.error('Error checking premium status:', error);
      toast.error(t('common.networkError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkPremiumStatus();
  }, [token]);

  const handleGenerate = async () => {
    try {
      setError('');
      setGenerated([]);
      setGeneratedMeta(null);
      const response = await fetch(`${API_URL}/api/programs/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify({
          goal: selectedGoal,
          days: selectedDays,
          intensity: selectedIntensity,
          lang: language || 'uk'
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || t('common.error'));
      setGenerated(data.program || []);
      setGeneratedMeta(data.meta || { goal: selectedGoal, days: selectedDays, intensity: selectedIntensity });
      toast.success(t('common.success'));
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message);
    }
  };

  const handleSaveTemplate = async () => {
    try {
      setError('');
      const response = await fetch(`${API_URL}/api/programs/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify({
          name: 'Моя програма',
          program: generated
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || t('common.error'));
      toast.success(t('common.success'));
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message);
    }
  };

  const handleStartProgram = async () => {
    try {
      setError('');
      if (generated.length === 0) {
        toast.error(t('common.error'));
        return;
      }
      const goalLabel = goals.find(goal => goal.id === selectedGoal)?.label || t('generator.title');
      const programId = `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const programTitle = `${goalLabel} · ${selectedDays}`;
      // Get server base time (UTC) to avoid device clock issues
      const timeResp = await fetch(`${API_URL}/api/workouts/time`);
      const timeData = await timeResp.json();
      const baseDate = new Date(timeData?.now || new Date().toISOString());
      // Create workouts for each generated day
      for (let index = 0; index < generated.length; index += 1) {
        const day = generated[index];
        const exPayload = (day.exercises || []).map(ex => {
          // Parse reps: can be "8-12", "10", "15" etc.
          const repsText = String(ex.reps || '10');
          const repsNum = parseInt(repsText.split('-').pop()?.replace(/\D/g, '') || '10') || 10;
          const setsCount = Number(ex.sets) || 3;
          
          const nameKey = ex.nameKey;
          const fallbackName = String(ex.name || '');
          const translatedName = nameKey ? t(`library.exercisesList.${nameKey}.name`) : fallbackName;

          return {
            name: translatedName || fallbackName,
            nameKey,
            notes: ex.muscle ? `${t('library.target')}: ${getMuscleLabel(ex.muscle)}` : '',
            sets: Array.from({ length: setsCount }).map(() => ({ 
              weight: 0, 
              reps: repsNum, 
              done: false 
            }))
          };
        });

        const workoutDate = new Date(baseDate);
        workoutDate.setDate(workoutDate.getDate() + index);
        workoutDate.setHours(12, 0, 0, 0);

        const resp = await fetch(`${API_URL}/api/workouts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token || ''
          },
          body: JSON.stringify({
            name: `${t('common.day')} ${index + 1}: ${programTitle}`,
            duration: 45,
            exercises: exPayload,
            date: workoutDate.toISOString(),
            source: 'generator',
            programId,
            programTitle,
            programDayIndex: index + 1,
            programGoal: selectedGoal
          })
        });
        const d = await resp.json();
        if (!resp.ok) throw new Error(d.message || t('common.error'));
      }
      toast.success(t('common.success'));
      onNavigate('diary');
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message);
    }
  };

  const goals = [
    { id: 'mass', label: t('generator.goals.mass'), icon: Dumbbell, color: 'from-blue-500 to-blue-600' },
    { id: 'strength', label: t('generator.goals.strength'), icon: Zap, color: 'from-orange-500 to-orange-600' },
    { id: 'fat_loss', label: t('generator.goals.fat_loss'), icon: Target, color: 'from-green-500 to-green-600' },
    { id: 'upper', label: t('generator.goals.upper'), icon: User, color: 'from-purple-500 to-purple-600' },
    { id: 'lower', label: t('generator.goals.lower'), icon: Users, color: 'from-pink-500 to-pink-600' },
  ];

  const intensities = [
    { id: 'low', label: t('generator.intensities.low'), desc: t('generator.intensities.lowDesc') },
    { id: 'medium', label: t('generator.intensities.medium'), desc: t('generator.intensities.mediumDesc') },
    { id: 'high', label: t('generator.intensities.high'), desc: t('generator.intensities.highDesc') },
  ];
  
  const localeMap: Record<string, string> = {
    ru: 'ru-RU',
    uk: 'uk-UA',
    en: 'en-US'
  };
  const locale = localeMap[language] || 'uk-UA';
  const getDayLabel = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(d);
    const date = new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit' }).format(d);
    return `${weekday} ${date}`;
  };
  const getMuscleLabel = (muscle: string) => {
    const muscleKey = muscle.toLowerCase();
    const map: Record<string, string> = {
      chest: t('statistics.muscleGroups.chest'),
      back: t('statistics.muscleGroups.back'),
      legs: t('statistics.muscleGroups.legs'),
      shoulders: t('statistics.muscleGroups.shoulders'),
      arms: t('statistics.muscleGroups.arms'),
      core: t('library.abs'),
      all: t('library.allMuscles')
    };
    return map[muscleKey] || muscle;
  };

  const generatedDayTitles: Record<string, Record<string, string[]>> = {
    uk: {
      mass: [
        'День 1: Груди + Трицепс',
        'День 2: Спина + Біцепс',
        'День 3: Ноги + Плечі',
        'День 4: Верх тіла',
        'День 5: Низ тіла',
      ],
      strength: [
        'День 1: Присідання (Сила) + Дод',
        'День 2: Жим лежачи (Сила) + Дод',
        'День 3: Тяга (Сила) + Дод',
        'День 4: Жим над головою (Сила)',
      ],
      fat_loss: [
        'День 1: Верх тіла + кардіо',
        'День 2: Низ тіла + кардіо',
        'День 3: Повне тіло',
        'День 4: Повне тіло + HIIT',
      ],
      upper: [
        'День 1: Груди + Трицепс',
        'День 2: Спина + Біцепс',
        'День 3: Плечі + Кор',
      ],
      lower: [
        'День 1: Квадрицепси',
        'День 2: Сідниці/Задня поверхня',
        'День 3: Ноги + кардіо',
      ],
    },
    ru: {
      mass: [
        'День 1: Грудь + Трицепс',
        'День 2: Спина + Бицепс',
        'День 3: Ноги + Плечи',
        'День 4: Верх тела',
        'День 5: Низ тела',
      ],
      strength: [
        'День 1: Присед (Сила) + Доп',
        'День 2: Жим лёжа (Сила) + Доп',
        'День 3: Тяга (Сила) + Доп',
        'День 4: Жим над головой (Сила)',
      ],
      fat_loss: [
        'День 1: Верх тела + кардио',
        'День 2: Низ тела + кардио',
        'День 3: Полное тело',
        'День 4: Полное тело + HIIT',
      ],
      upper: [
        'День 1: Грудь + Трицепс',
        'День 2: Спина + Бицепс',
        'День 3: Плечи + кор',
      ],
      lower: [
        'День 1: Квадрицепсы',
        'День 2: Ягодицы/Задняя поверхность',
        'День 3: Ноги + кардио',
      ],
    },
    en: {
      mass: [
        'Day 1: Chest + Triceps',
        'Day 2: Back + Biceps',
        'Day 3: Legs + Shoulders',
        'Day 4: Upper Body',
        'Day 5: Lower Body',
      ],
      strength: [
        'Day 1: Squat (Strength) + Acc',
        'Day 2: Bench Press (Strength) + Acc',
        'Day 3: Deadlift (Strength) + Acc',
        'Day 4: Overhead Press (Strength)',
      ],
      fat_loss: [
        'Day 1: Upper Body + Cardio',
        'Day 2: Lower Body + Cardio',
        'Day 3: Full Body',
        'Day 4: Full Body + HIIT',
      ],
      upper: [
        'Day 1: Chest + Triceps',
        'Day 2: Back + Biceps',
        'Day 3: Shoulders + Core',
      ],
      lower: [
        'Day 1: Quadriceps',
        'Day 2: Glutes/Hamstrings',
        'Day 3: Legs + Cardio',
      ],
    },
  };

  const getGeneratedDayTitle = (fallback: string | undefined, goal: string | undefined, dayNumber: number) => {
    const langKey = generatedDayTitles[language] ? language : 'uk';
    const g = goal && generatedDayTitles[langKey]?.[goal] ? goal : 'mass';
    const title = generatedDayTitles[langKey]?.[g]?.[dayNumber - 1];
    return title || fallback || `${t('common.day') || 'Day'} ${dayNumber}`;
  };

  if (loading) {
    return (
      <div className="h-full bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-950 overflow-y-auto pb-24 relative overflow-x-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[40%] aspect-square bg-orange-600/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute top-[30%] left-[-10%] w-[30%] aspect-square bg-purple-600/10 blur-[80px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 px-6 pt-[calc(3rem+env(safe-area-inset-top))] pb-8">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => onNavigate('dashboard')}
            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 active:scale-95"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <div>
            <h1 className="text-white text-2xl font-black tracking-tight leading-none mb-1">{t('generator.title')}</h1>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest">{t('generator.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="relative z-10 px-6 space-y-8">
        {/* Goal Selection */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
            <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">{t('generator.selectGoal')}</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {goals.map((goal) => (
              <button
                key={goal.id}
                onClick={() => setSelectedGoal(goal.id)}
                className={`relative p-5 rounded-[2rem] border-2 transition-all duration-300 text-left overflow-hidden group active:scale-[0.98] ${
                  selectedGoal === goal.id
                    ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_20px_rgba(249,115,22,0.15)]'
                    : 'border-white/5 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${goal.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <goal.icon className="w-6 h-6 text-white" />
                </div>
                <p className={`text-sm font-bold tracking-tight ${selectedGoal === goal.id ? 'text-white' : 'text-white/60'}`}>
                  {goal.label}
                </p>
                {selectedGoal === goal.id && (
                  <div className="absolute top-4 right-4 w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Days Per Week */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">{t('generator.daysPerWeek')}</h3>
          </div>
          <div className="flex gap-2 p-2 bg-white/5 rounded-[2rem] border border-white/5 backdrop-blur-md">
            {[2, 3, 4, 5, 6].map((days) => (
              <button
                key={days}
                onClick={() => setSelectedDays(days)}
                className={`flex-1 py-4 rounded-2xl font-black transition-all active:scale-95 ${
                  selectedDays === days
                    ? 'bg-white text-slate-950 shadow-xl'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                {days}
              </button>
            ))}
          </div>
        </div>

        {/* Intensity */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
            <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">{t('generator.intensity')}</h3>
          </div>
          <div className="space-y-3">
            {intensities.map((intensity) => (
              <button
                key={intensity.id}
                onClick={() => setSelectedIntensity(intensity.id)}
                className={`w-full p-5 rounded-[2rem] border-2 text-left transition-all duration-300 group active:scale-[0.99] ${
                  selectedIntensity === intensity.id
                    ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.15)]'
                    : 'border-white/5 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className={`font-black tracking-tight mb-1 ${selectedIntensity === intensity.id ? 'text-white' : 'text-white/60'}`}>
                      {intensity.label}
                    </p>
                    <p className="text-xs font-medium text-white/30 leading-relaxed uppercase tracking-wider">{intensity.desc}</p>
                  </div>
                  {selectedIntensity === intensity.id && (
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.5)]">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <div className="pt-4 pb-8 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <button
            onClick={handleGenerate}
            className="w-full relative group active:scale-[0.98] transition-all"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-pink-500 rounded-[2.2rem] blur opacity-30 group-hover:opacity-60 transition duration-500" />
            <div className="relative flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-2xl">
              <Zap className="w-5 h-5" />
              {t('generator.generate')}
            </div>
          </button>
          {error && <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold text-center uppercase tracking-widest">{error}</div>}
        </div>

        {/* Generated Program Preview */}
        {generated.length > 0 && (
          <div className="pb-10 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                <h3 className="text-white font-black tracking-tight uppercase text-xs tracking-widest">{t('generator.generated')}</h3>
              </div>
            </div>
            
            <div className="space-y-6">
              {generated.map((day, idx) => (
                <div key={idx} className="bg-white/5 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-md">
                  <div className="bg-white/[0.03] px-6 py-4 flex justify-between items-center border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-white font-black">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-white font-black tracking-tight">{getGeneratedDayTitle(day.day, generatedMeta?.goal || selectedGoal, idx + 1)}</p>
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">{getDayLabel(idx)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    {day.exercises.map((ex, exIdx) => (
                      <div key={exIdx} className="bg-white/5 rounded-2xl p-4 flex items-center gap-4 group">
                        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-orange-500/10 transition-colors">
                          <Dumbbell className="w-6 h-6 text-white/30 group-hover:text-orange-500 transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold truncate mb-0.5">
                            {ex.nameKey ? t(`library.exercisesList.${ex.nameKey}.name`) : ex.name}
                          </p>
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">{getMuscleLabel(ex.muscle)}</span>
                             <span className="text-white/20">•</span>
                             <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{ex.sets} {t('library.sets')}</span>
                          </div>
                        </div>
                        <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                           <span className="text-xs font-black text-white">{ex.reps}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 space-y-4">
              {!isPremium && (
                <div className="bg-gradient-to-br from-indigo-600/20 to-blue-700/20 border border-blue-500/30 rounded-[2rem] p-6 text-center backdrop-blur-md mb-6">
                   <Crown className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
                   <h4 className="text-white font-black tracking-tight mb-2 uppercase text-xs tracking-widest">{t('generator.premiumTitle')}</h4>
                   <p className="text-white/50 text-xs font-medium mb-4 uppercase tracking-wider leading-relaxed">{t('generator.premiumDesc')}</p>
                   <button 
                     onClick={() => setShowPremiumModal(true)}
                     className="px-6 py-2.5 bg-blue-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest hover:bg-blue-500 transition-colors active:scale-95"
                   >
                     {t('generator.upgradeNow')}
                   </button>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  disabled={!isPremium}
                  onClick={handleSaveTemplate}
                  className={`py-4 rounded-[2rem] font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 ${
                    isPremium 
                      ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10 active:scale-95' 
                      : 'bg-white/5 border border-white/5 text-white/20 cursor-not-allowed opacity-50'
                  }`}
                >
                  {!isPremium && <Lock className="w-4 h-4" />}
                  {t('generator.saveTemplate')}
                </button>
                <button
                  onClick={handleStartProgram}
                  className="py-4 bg-white text-slate-950 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t('generator.saveToDiary')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <PremiumModal 
        isOpen={showPremiumModal} 
        onClose={() => setShowPremiumModal(false)}
        onSuccess={() => setIsPremium(true)}
        isPremium={isPremium}
      />
    </div>
  );
}
