import { useState, useEffect } from 'react';
import { ChevronLeft, Search, Filter, Play, Plus } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';
import { toast } from 'sonner';

interface ExerciseLibraryScreenProps {
  onNavigate: (screen: string) => void;
}

interface Exercise {
  _id: string;
  nameKey: string;
  muscle: string;
  muscleIcon?: string; // Frontend helper
  difficulty: string;
  image: string;
  // Frontend computed props
  name?: string;
  description?: string;
  instructions?: string[];
}

export default function ExerciseLibraryScreen({ onNavigate }: ExerciseLibraryScreenProps) {
  const { t } = useSettings();
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      const response = await fetch(`${API_URL}/api/exercises`);
      if (response.ok) {
        const data = await response.json();
        setExercises(data);
      } else {
        toast.error(t('common.error'));
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddToProgram = async (exerciseId: string) => {
    if (!token) {
      toast.error(t('auth.loginRequired'));
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/programs/add-exercise`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ exerciseId })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(t('library.addedToProgram'));
      } else {
        if (data.msg === 'Exercise already in program') {
          toast.error(t('library.alreadyInProgram'));
        } else {
          toast.error(data.msg || t('common.error'));
        }
      }
    } catch (error) {
      console.error('Error adding to program:', error);
      toast.error(t('common.error'));
    }
  };

  const getMuscleIcon = (muscle: string) => {
    switch (muscle) {
      case 'chest': return '🔴';
      case 'back': return '🔵';
      case 'legs': return '🟢';
      case 'shoulders': return '🟡';
      case 'arms': return '🟣';
      case 'abs': return '🟠';
      default: return '💪';
    }
  };

  const muscleGroups = [
    { id: 'all', label: t('library.allMuscles'), icon: '💪' },
    { id: 'chest', label: t('library.chest'), icon: '🔴' },
    { id: 'back', label: t('library.back'), icon: '🔵' },
    { id: 'legs', label: t('library.legs'), icon: '🟢' },
    { id: 'shoulders', label: t('library.shoulders'), icon: '🟡' },
    { id: 'arms', label: t('library.arms'), icon: '🟣' },
  ];

  const filteredExercises = exercises.map(ex => ({
    ...ex,
    muscleIcon: getMuscleIcon(ex.muscle),
    name: t(`library.exercisesList.${ex.nameKey}.name`),
    description: t(`library.exercisesList.${ex.nameKey}.description`),
    instructions: t(`library.exercisesList.${ex.nameKey}.instructions`) as string[],
  })).filter((exercise) => {
    const matchesSearch = exercise.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscle = selectedMuscle === 'all' || exercise.muscle === selectedMuscle;
    const matchesDifficulty = selectedDifficulty === 'all' || exercise.difficulty === selectedDifficulty;
    return matchesSearch && matchesMuscle && matchesDifficulty;
  });

  return (
    <div className="h-full bg-slate-950 overflow-y-auto pb-24 relative overflow-x-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[40%] aspect-square bg-teal-600/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 px-6 pt-[calc(3rem+env(safe-area-inset-top))] pb-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => onNavigate('dashboard')}
            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all active:scale-95"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <div>
            <h1 className="text-white text-2xl font-bold tracking-tight">{t('library.title')}</h1>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">
              {exercises.length} {t('library.subtitle')}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
            <Search className="w-5 h-5 text-white/20" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('library.searchPlaceholder')}
            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-[1.5rem] text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
          />
        </div>

        {/* Muscle Group Filter */}
        <div className="mb-6">
          <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {muscleGroups.map((group) => (
              <button
                key={group.id}
                onClick={() => setSelectedMuscle(group.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl whitespace-nowrap transition-all border ${
                  selectedMuscle === group.id
                    ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                    : 'bg-white/5 text-white/60 border-white/5 hover:border-white/20'
                }`}
              >
                <span className="text-lg">{group.icon}</span>
                <span className="text-sm font-bold uppercase tracking-wider">{group.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Filter */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
            <Filter className="w-5 h-5 text-white/40" />
          </div>
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none font-medium"
          >
            <option value="all" className="bg-slate-900">{t('library.allLevels')}</option>
            <option value="easy" className="bg-slate-900">{t('library.easy')}</option>
            <option value="medium" className="bg-slate-900">{t('library.medium')}</option>
            <option value="hard" className="bg-slate-900">{t('library.hard')}</option>
          </select>
        </div>

        {/* Exercise Cards */}
        <div className="space-y-6">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20">
               <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mb-4"></div>
               <p className="text-white/20 text-sm font-bold uppercase tracking-widest">{t('common.loading')}</p>
             </div>
          ) : (
          filteredExercises.map((exercise, idx) => (
            <div 
              key={exercise._id} 
              className="bg-white/5 border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-md animate-fade-in-up group hover:bg-white/[0.08] transition-all duration-300"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="relative h-56">
                <ImageWithFallback
                  src={exercise.image}
                  alt={exercise.name || ''}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                
                <button className="absolute top-4 right-4 w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center hover:bg-white/20 transition-all active:scale-90 group/play">
                  <Play className="w-5 h-5 text-white fill-white group-hover/play:scale-110 transition-transform" />
                </button>
                
                <div className="absolute bottom-4 left-4 flex gap-2">
                  <span className="px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-wider">
                    {exercise.muscleIcon} {t(`library.${exercise.muscle}`)}
                  </span>
                  <span className={`px-3 py-1.5 backdrop-blur-md border rounded-xl text-[10px] font-black uppercase tracking-wider ${
                    exercise.difficulty === 'easy'
                      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                      : exercise.difficulty === 'medium'
                      ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
                      : 'bg-red-500/20 border-red-500/30 text-red-400'
                  }`}>
                    {t(`library.${exercise.difficulty}`)}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-white text-xl font-bold mb-2 group-hover:text-emerald-400 transition-colors">{exercise.name}</h3>
                <p className="text-sm text-white/40 mb-6 leading-relaxed font-medium">{exercise.description}</p>
                
                {expandedExerciseId === exercise._id && (
                  <div className="mb-6 p-4 bg-white/5 border border-white/5 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3">{t('library.technique')}</p>
                    <ul className="space-y-3">
                      {exercise.instructions?.map((instruction, idx) => (
                        <li key={idx} className="text-sm text-white/70 flex items-start gap-3 leading-relaxed">
                          <span className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center text-[10px] font-bold text-emerald-400 flex-shrink-0 mt-0.5">{idx + 1}</span>
                          <span>{instruction}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => handleAddToProgram(exercise._id)}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(16,185,129,0.2)]"
                  >
                    <Plus className="w-5 h-5" />
                    {t('library.addToProgram')}
                  </button>
                  <button
                    onClick={() => setExpandedExerciseId(
                      expandedExerciseId === exercise._id ? null : exercise._id
                    )}
                    className="px-6 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all border border-white/5 active:scale-[0.98]"
                  >
                    {expandedExerciseId === exercise._id ? t('common.hide') : t('library.details')}
                  </button>
                </div>
              </div>
            </div>
          )))}
        </div>

        {filteredExercises.length === 0 && !loading && (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
              <Search className="w-10 h-10 text-white/10" />
            </div>
            <p className="text-white font-bold text-lg mb-2">{t('library.notFound')}</p>
            <p className="text-white/40 text-sm font-medium">{t('library.changeFilters')}</p>
          </div>
        )}
      </div>
    </div>
  );
}