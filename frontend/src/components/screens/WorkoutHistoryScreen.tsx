import { useState, useEffect } from 'react';
import { ChevronLeft, Calendar, Clock, Dumbbell, ChevronRight, History, TrendingUp, Trophy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';
import { useSettings } from '../../context/SettingsContext';

interface WorkoutHistoryScreenProps {
  onNavigate: (screen: string) => void;
}

interface Workout {
  _id: string;
  name: string;
  date: string;
  duration: number;
  exercises: any[];
  source?: string;
  programTitle?: string;
  programGoal?: string;
  programDayIndex?: number;
}

export default function WorkoutHistoryScreen({ onNavigate }: WorkoutHistoryScreenProps) {
  const { token } = useAuth();
  const { t, language } = useSettings();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        const response = await fetch(`${API_URL}/api/workouts`, {
          headers: {
            'x-auth-token': token || ''
          }
        });
        if (response.ok) {
          const data = await response.json();
          // Sort by date descending
          setWorkouts(data.sort((a: Workout, b: Workout) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        }
      } catch (error) {
        console.error('Error fetching workouts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkouts();
  }, [token]);

  const calculateVolume = (exercises: any[]) => {
    return exercises.reduce((acc, ex) => 
      acc + (ex.sets || []).reduce((sAcc: number, s: any) => sAcc + ((Number(s.weight) || 0) * (Number(s.reps) || 0)), 0), 0
    );
  };

  const getWorkoutDisplayName = (w: Workout) => {
    const goalLabel = w.programGoal ? t(`generator.goals.${w.programGoal}`) : null;
    if (w.source === 'generator' && w.programDayIndex) {
      return `${t('common.day') || 'Day'} ${w.programDayIndex}: ${goalLabel || w.programTitle || (t('common.workout') || 'Workout')}`;
    }
    return w.name || (t('common.workout') || 'Workout');
  };

  const localeMap: Record<string, string> = { ru: 'ru-RU', uk: 'uk-UA', en: 'en-US' };
  const locale = localeMap[language] || 'uk-UA';

  if (loading) {
    return (
      <div className="h-full bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-950 overflow-y-auto pb-24 relative overflow-x-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-orange-500/10 to-transparent pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[50%] aspect-square bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 px-6 pt-[calc(3rem+env(safe-area-inset-top))] pb-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => onNavigate('profile')}
            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all active:scale-95"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <div>
            <h1 className="text-white text-2xl font-black tracking-tight">{t('profile.history') || 'Workout History'}</h1>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
              {workouts.length} {t('profile.workouts') || 'Workouts'}
            </p>
          </div>
        </div>

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-2 gap-3 mb-10">
          <div className="bg-white/5 border border-white/5 rounded-[2rem] p-5 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-orange-500/10 rounded-xl flex items-center justify-center border border-orange-500/20">
                <TrendingUp className="w-4 h-4 text-orange-400" />
              </div>
              <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{t('statistics.totalVolume') || 'Volume'}</span>
            </div>
            <p className="text-2xl font-black text-white">
              {workouts.reduce((acc, w) => acc + calculateVolume(w.exercises), 0).toLocaleString()} 
              <span className="text-xs text-white/40 ml-1 uppercase">{t('common.kg')}</span>
            </p>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-[2rem] p-5 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                <Clock className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{t('statistics.time') || 'Total Time'}</span>
            </div>
            <p className="text-2xl font-black text-white">
              {workouts.reduce((acc, w) => acc + (w.duration || 0), 0)}
              <span className="text-xs text-white/40 ml-1 uppercase">{t('common.min')}</span>
            </p>
          </div>
        </div>

        {/* Workouts List */}
        <div className="space-y-4">
          {workouts.length > 0 ? (
            workouts.map((workout, idx) => (
              <div 
                key={workout._id} 
                className="bg-white/5 border border-white/5 rounded-[2.5rem] p-6 backdrop-blur-md group hover:bg-white/[0.08] transition-all animate-fade-in-up overflow-hidden relative"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 blur-3xl -mr-12 -mt-12 group-hover:bg-orange-500/10 transition-all" />
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-white font-black text-lg tracking-tight mb-1 group-hover:text-orange-400 transition-colors">{getWorkoutDisplayName(workout)}</h3>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-white/30">
                          <Calendar className="w-3 h-3" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(workout.date))}</span>
                        </div>
                        <div className="w-1 h-1 bg-white/10 rounded-full" />
                        <div className="flex items-center gap-1.5 text-white/30">
                          <Clock className="w-3 h-3" />
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            {new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(workout.date))}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full shadow-lg shadow-emerald-500/5">
                      <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">{t('common.completed') || 'Completed'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-6 border-t border-white/5">
                    <div className="text-center">
                      <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">{t('diary.duration') || 'Duration'}</p>
                      <p className="text-sm font-black text-white">{workout.duration || 0} <span className="text-[10px] text-white/30">{t('common.min')}</span></p>
                    </div>
                    <div className="text-center border-x border-white/5">
                      <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">{t('diary.todaysExercises') || 'Exercises'}</p>
                      <p className="text-sm font-black text-white">{workout.exercises?.length || 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">{t('statistics.stats.totalVolume') || 'Volume'}</p>
                      <p className="text-sm font-black text-orange-400">{calculateVolume(workout.exercises).toLocaleString()} <span className="text-[10px] text-orange-400/40">{t('common.kg')}</span></p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-24 bg-white/5 rounded-[3rem] border border-dashed border-white/10 backdrop-blur-md">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                <History className="w-10 h-10 text-white/10" />
              </div>
              <h3 className="text-white font-black text-xl mb-2 tracking-tight">{t('diary.noWorkouts') || 'No workouts yet'}</h3>
              <p className="text-white/30 text-xs font-bold uppercase tracking-widest px-12">{t('diary.startWorkoutPrompt') || 'Complete your first training to see it here'}</p>
              
              <button 
                onClick={() => onNavigate('dashboard')}
                className="mt-10 px-8 py-4 bg-white text-slate-950 rounded-[1.8rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl active:scale-95 transition-all"
              >
                {t('dashboard.startWorkout') || 'Start Training'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
