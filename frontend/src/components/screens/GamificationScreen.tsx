import { ChevronLeft, Trophy, Award, Target, Flame, Star, Clock, CheckCircle, Lock, Zap, TrendingUp, Shield } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

interface GamificationScreenProps {
  onNavigate: (screen: string) => void;
}

export default function GamificationScreen({ onNavigate }: GamificationScreenProps) {
  const { t } = useSettings();

  const achievements = [
    {
      id: 1,
      title: t('gamification.achievementsList.workouts100'),
      description: t('gamification.achievementsList.workouts100Desc'),
      progress: 87,
      total: 100,
      unlocked: false,
      icon: Trophy,
      color: 'from-purple-500 to-indigo-600',
    },
    {
      id: 2,
      title: t('gamification.achievementsList.newRecord'),
      description: t('gamification.achievementsList.newRecordDesc'),
      progress: 100,
      total: 100,
      unlocked: true,
      icon: Award,
      color: 'from-yellow-400 to-orange-500',
    },
    {
      id: 3,
      title: t('gamification.achievementsList.weekStreak'),
      description: t('gamification.achievementsList.weekStreakDesc'),
      progress: 100,
      total: 100,
      unlocked: true,
      icon: Flame,
      color: 'from-orange-500 to-red-600',
    },
    {
      id: 4,
      title: t('gamification.achievementsList.first10kg'),
      description: t('gamification.achievementsList.first10kgDesc'),
      progress: 8,
      total: 10,
      unlocked: false,
      icon: Target,
      color: 'from-green-500 to-teal-600',
    },
    {
      id: 5,
      title: t('gamification.achievementsList.allMuscles'),
      description: t('gamification.achievementsList.allMusclesDesc'),
      progress: 100,
      total: 100,
      unlocked: true,
      icon: Star,
      color: 'from-blue-500 to-cyan-600',
    },
    {
      id: 6,
      title: t('gamification.achievementsList.earlyBird'),
      description: t('gamification.achievementsList.earlyBirdDesc'),
      progress: 3,
      total: 5,
      unlocked: false,
      icon: Clock,
      color: 'from-pink-500 to-rose-600',
    },
  ];

  const challenges = [
    {
      id: 1,
      title: t('gamification.challenges.streak'),
      description: t('gamification.challenges.streakDesc'),
      progress: 3,
      total: 5,
      reward: `50 ${t('gamification.points')}`,
      daysLeft: 4,
      active: true,
    },
    {
      id: 2,
      title: t('gamification.challenges.reps'),
      description: t('gamification.challenges.repsDesc'),
      progress: 672,
      total: 1000,
      reward: `100 ${t('gamification.points')}`,
      daysLeft: 2,
      active: true,
    },
    {
      id: 3,
      title: t('gamification.challenges.bench'),
      description: t('gamification.challenges.benchDesc'),
      progress: 12,
      total: 20,
      reward: `200 ${t('gamification.points')}`,
      daysLeft: 28,
      active: true,
    },
  ];

  const milestones = [
    { label: t('gamification.levels.novice'), points: 0, unlocked: true },
    { label: t('gamification.levels.beginner'), points: 500, unlocked: true },
    { label: t('gamification.levels.advanced'), points: 1000, unlocked: true },
    { label: t('gamification.levels.expert'), points: 2000, unlocked: true },
    { label: t('gamification.levels.master'), points: 5000, unlocked: false },
    { label: t('gamification.levels.legend'), points: 10000, unlocked: false },
  ];

  const currentPoints = 2180;
  const currentLevel = milestones.filter(m => m.unlocked).length;
  const nextMilestone = milestones.find(m => !m.unlocked);

  return (
    <div className="h-full bg-slate-950 overflow-y-auto pb-24 relative overflow-x-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-yellow-500/10 to-transparent pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[50%] aspect-square bg-orange-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 px-6 pt-[calc(3rem+env(safe-area-inset-top))] pb-4">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => onNavigate('dashboard')}
            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all active:scale-95"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <div>
            <h1 className="text-white text-2xl font-black tracking-tight">{t('gamification.title')}</h1>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mt-1">{t('gamification.subtitle')}</p>
          </div>
        </div>

        {/* Level Progress Banner */}
        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-purple-500/20 mb-10 group">
          <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div>
              <p className="text-white/40 font-black uppercase text-[10px] tracking-[0.2em] mb-2">{t('gamification.yourLevel')}</p>
              <h2 className="text-3xl font-black tracking-tight">{milestones[currentLevel - 1]?.label || t('gamification.levels.novice')}</h2>
            </div>
            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-[2.2rem] flex items-center justify-center border border-white/20 shadow-xl group-hover:rotate-12 transition-transform">
              <span className="text-4xl font-black">{currentLevel}</span>
            </div>
          </div>

          <div className="relative z-10 space-y-3">
            <div className="flex justify-between items-end px-1">
              <p className="text-xs font-black uppercase tracking-widest text-white/60">{currentPoints.toLocaleString()} <span className="text-[10px] opacity-40">{t('gamification.points')}</span></p>
              <p className="text-xs font-black uppercase tracking-widest text-white/60">{nextMilestone?.points.toLocaleString()} <span className="text-[10px] opacity-40">{t('gamification.points')}</span></p>
            </div>
            <div className="h-3 bg-black/20 rounded-full overflow-hidden border border-white/5 p-0.5">
              <div
                className="h-full bg-white rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                style={{
                  width: `${((currentPoints - (milestones[currentLevel - 1]?.points || 0)) / 
                    ((nextMilestone?.points || 5000) - (milestones[currentLevel - 1]?.points || 0))) * 100}%`
                }}
              ></div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 text-center">
              {nextMilestone ? `${t('gamification.toLevel')} "${nextMilestone.label}": ${nextMilestone.points - currentPoints}` : t('gamification.maxLevel')}
            </p>
          </div>
        </div>

        {/* Milestones Grid */}
        <div className="mb-12">
          <h3 className="text-white font-black text-lg tracking-tight mb-6 px-2">{t('gamification.levelProgress')}</h3>
          <div className="grid grid-cols-3 gap-3">
            {milestones.map((milestone, idx) => (
              <div
                key={idx}
                className={`rounded-[1.8rem] p-4 text-center border transition-all ${
                  milestone.unlocked
                    ? 'bg-white/5 border-purple-500/30 text-white shadow-lg shadow-purple-500/5'
                    : 'bg-white/5 border-white/5 text-white/20'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 border ${
                  milestone.unlocked ? 'bg-purple-500/20 border-purple-500/30' : 'bg-white/5 border-white/5'
                }`}>
                  {milestone.unlocked ? (
                    <CheckCircle className="w-5 h-5 text-purple-400" />
                  ) : (
                    <Lock className="w-5 h-5" />
                  )}
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1 truncate px-1">{milestone.label}</p>
                <p className="text-[9px] font-bold opacity-40 tabular-nums">{milestone.points}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Active Challenges */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6 px-2">
            <h3 className="text-white font-black text-lg tracking-tight">{t('gamification.activeChallenges')}</h3>
            <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center border border-orange-500/20">
              <Zap className="w-5 h-5 text-orange-400" />
            </div>
          </div>
          
          <div className="space-y-4">
            {challenges.map((challenge, idx) => (
              <div 
                key={challenge.id} 
                className="bg-white/5 border border-white/5 rounded-[2.5rem] p-6 backdrop-blur-md group hover:bg-white/[0.08] transition-all animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h4 className="text-white font-black text-lg tracking-tight mb-1 group-hover:text-orange-400 transition-colors">{challenge.title}</h4>
                    <p className="text-xs text-white/40 font-medium leading-relaxed">{challenge.description}</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-orange-400" />
                    <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">
                      {challenge.daysLeft} {t('gamification.days')}
                    </span>
                  </div>
                </div>

                <div className="mb-6 space-y-3">
                  <div className="flex justify-between items-end px-1">
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest tabular-nums">{challenge.progress} / {challenge.total}</span>
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-orange-400" />
                      <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">{challenge.reward}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-pink-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(249,115,22,0.3)]"
                      style={{ width: `${(challenge.progress / challenge.total) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-white/60 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/10 transition-all active:scale-95">
                    {t('gamification.details')}
                  </button>
                  <button 
                    onClick={() => onNavigate('diary')}
                    className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all"
                  >
                    {t('gamification.continue')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="mb-12">
          <h3 className="text-white font-black text-lg tracking-tight mb-6 px-2">{t('gamification.achievements')}</h3>
          <div className="grid grid-cols-2 gap-3">
            {achievements.map((achievement, idx) => (
              <div
                key={achievement.id}
                className={`rounded-[2.5rem] p-6 border transition-all animate-fade-in-up relative overflow-hidden group ${
                  achievement.unlocked
                    ? `bg-gradient-to-br ${achievement.color} border-white/10 text-white shadow-xl shadow-black/20`
                    : 'bg-white/5 border-white/5 text-white/40'
                }`}
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                {achievement.unlocked && (
                  <div className="absolute top-[-20%] right-[-20%] w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
                )}
                
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 border relative z-10 transition-transform group-hover:scale-110 group-hover:rotate-6 ${
                  achievement.unlocked ? 'bg-white/20 border-white/20 shadow-lg' : 'bg-white/5 border-white/5'
                }`}>
                  <achievement.icon className={`w-7 h-7 ${achievement.unlocked ? 'text-white' : 'text-white/10'}`} />
                </div>
                
                <div className="relative z-10">
                  <p className={`font-black tracking-tight mb-2 leading-tight ${achievement.unlocked ? 'text-white' : 'text-white/60'}`}>
                    {achievement.title}
                  </p>
                  <p className={`text-[10px] font-medium leading-relaxed mb-6 ${achievement.unlocked ? 'text-white/60' : 'text-white/20'}`}>
                    {achievement.description}
                  </p>
                  
                  {!achievement.unlocked && (
                    <div className="space-y-2">
                      <div className="h-1.5 bg-black/20 rounded-full overflow-hidden border border-white/5">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-pink-500 rounded-full transition-all duration-1000"
                          style={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-widest tabular-nums">
                        {achievement.progress} / {achievement.total}
                      </p>
                    </div>
                  )}

                  {achievement.unlocked && (
                    <div className="flex items-center gap-2 text-white/90">
                      <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-3 h-3" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">{t('gamification.unlocked')}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Motivational Quote */}
        <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 mb-10 text-center backdrop-blur-md relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 to-purple-600/5" />
          <p className="text-white/60 font-bold italic mb-4 leading-relaxed relative z-10 text-lg">
            "{t('gamification.quote')}"
          </p>
          <div className="flex items-center justify-center gap-2 relative z-10">
            <div className="w-1 h-1 bg-purple-500 rounded-full" />
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">{t('gamification.motivationDay')}</p>
            <div className="w-1 h-1 bg-purple-500 rounded-full" />
          </div>
        </div>

        <button className="w-full bg-white text-slate-950 font-black text-[10px] uppercase tracking-[0.3em] py-5 rounded-[2rem] shadow-2xl active:scale-[0.98] transition-all">
          {t('gamification.viewAll')}
        </button>
      </div>
    </div>
  );
}
