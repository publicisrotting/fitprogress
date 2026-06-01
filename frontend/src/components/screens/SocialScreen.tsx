import { useState } from 'react';
import { ChevronLeft, UserPlus, Trophy, TrendingUp, Share2, Users, MessageCircle, Heart, Award, Search, Bell } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

interface SocialScreenProps {
  onNavigate: (screen: string) => void;
}

export default function SocialScreen({ onNavigate }: SocialScreenProps) {
  const { t } = useSettings();
  const [activeTab, setActiveTab] = useState('friends');
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());

  const friends = [
    {
      id: 1,
      name: 'Олена Коваль',
      avatar: 'ОК',
      workouts: 156,
      achievements: 23,
      streak: 12,
      level: t('gamification.levels.expert'),
      color: 'from-pink-500 to-rose-600',
    },
    {
      id: 2,
      name: 'Максим Шевченко',
      avatar: 'МШ',
      workouts: 98,
      achievements: 15,
      streak: 8,
      level: t('gamification.levels.advanced'),
      color: 'from-blue-500 to-cyan-600',
    },
    {
      id: 3,
      name: 'Ірина Бондаренко',
      avatar: 'ІБ',
      workouts: 234,
      achievements: 34,
      streak: 24,
      level: t('gamification.levels.master'),
      color: 'from-purple-500 to-indigo-600',
    },
  ];

  const achievements = [
    {
      id: 1,
      user: 'Андрій Петренко',
      avatar: 'АП',
      achievement: t('gamification.achievementsList.workouts100'),
      description: t('gamification.achievementsList.workouts100Desc'),
      time: '2 години тому',
      likes: 24,
      comments: 5,
      color: 'from-orange-500 to-pink-600',
    },
    {
      id: 2,
      user: 'Олена Коваль',
      avatar: 'ОК',
      achievement: t('gamification.achievementsList.newRecord'),
      description: 'Жим лежачи: 80 кг!',
      time: '5 годин тому',
      likes: 18,
      comments: 3,
      color: 'from-pink-500 to-rose-600',
    },
    {
      id: 3,
      user: 'Максим Шевченко',
      avatar: 'МШ',
      achievement: t('gamification.achievementsList.weekStreak'),
      description: t('gamification.achievementsList.weekStreakDesc'),
      time: '1 день тому',
      likes: 32,
      comments: 8,
      color: 'from-blue-500 to-cyan-600',
    },
  ];

  const leaderboard = [
    { rank: 1, name: 'Ірина Бондаренко', avatar: 'ІБ', points: 2450, color: 'from-purple-500 to-indigo-600' },
    { rank: 2, name: 'Андрій Петренко', avatar: 'АП', points: 2180, color: 'from-orange-500 to-pink-600' },
    { rank: 3, name: 'Олена Коваль', avatar: 'ОК', points: 1890, color: 'from-pink-500 to-rose-600' },
    { rank: 4, name: 'Максим Шевченко', avatar: 'МШ', points: 1650, color: 'from-blue-500 to-cyan-600' },
    { rank: 5, name: 'Петро Мельник', avatar: 'ПМ', points: 1420, color: 'from-green-500 to-teal-600' },
  ];

  return (
    <div className="h-full bg-slate-950 overflow-y-auto pb-24 relative overflow-x-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-pink-500/10 to-transparent pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[50%] aspect-square bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 px-6 pt-[calc(3rem+env(safe-area-inset-top))] pb-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('dashboard')}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all active:scale-95"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <div>
              <h1 className="text-white text-2xl font-black tracking-tight">{t('social.title')}</h1>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mt-1">{t('social.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-3 bg-white/5 border border-white/10 rounded-2xl text-white/40 hover:text-white transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <button className="p-3 bg-white/5 border border-white/10 rounded-2xl text-white/40 hover:text-white transition-colors relative">
              <Bell className="w-5 h-5" />
              <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-pink-500 rounded-full border-2 border-slate-950" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-white/5 p-1.5 rounded-[1.8rem] border border-white/5 backdrop-blur-md mb-8">
          {[
            { id: 'friends', icon: Users, label: t('social.tabs.friends') },
            { id: 'feed', icon: Share2, label: t('social.tabs.feed') },
            { id: 'leaderboard', icon: Trophy, label: t('social.tabs.leaderboard') }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${
                activeTab === tab.id
                  ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20'
                  : 'text-white/30 hover:text-white/60 hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="space-y-6">
          {/* Friends Tab */}
          {activeTab === 'friends' && (
            <div className="animate-fade-in">
              <button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-pink-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mb-8 group">
                <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {t('social.addFriend')}
              </button>

              <div className="space-y-4">
                {friends.map((friend, idx) => (
                  <div 
                    key={friend.id} 
                    className="bg-white/5 border border-white/5 rounded-[2.5rem] p-6 backdrop-blur-md group hover:bg-white/[0.08] transition-all animate-fade-in-up"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className="flex items-center gap-5 mb-6">
                      <div className={`w-16 h-16 bg-gradient-to-br ${friend.color} rounded-[1.5rem] flex items-center justify-center text-white text-xl font-black shadow-lg shadow-black/20 group-hover:scale-110 transition-transform`}>
                        {friend.avatar}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-black text-lg tracking-tight mb-1">{friend.name}</h3>
                        <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest">{friend.level}</p>
                      </div>
                      <button className="px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-white/60 font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95">
                        {t('social.compare')}
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: t('social.stats.workouts'), value: friend.workouts },
                        { label: t('social.stats.achievements'), value: friend.achievements },
                        { label: t('social.stats.streak'), value: friend.streak }
                      ].map((stat, sIdx) => (
                        <div key={sIdx} className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
                          <p className="text-lg font-black text-white mb-0.5">{stat.value}</p>
                          <p className="text-[8px] font-black text-white/20 uppercase tracking-widest leading-none mt-1">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feed Tab */}
          {activeTab === 'feed' && (
            <div className="space-y-6 animate-fade-in">
              {achievements.map((post, idx) => (
                <div 
                  key={post.id} 
                  className="bg-white/5 border border-white/5 rounded-[2.5rem] p-6 backdrop-blur-md animate-fade-in-up"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="flex items-center gap-4 mb-5">
                    <div className={`w-12 h-12 bg-gradient-to-br ${post.color} rounded-2xl flex items-center justify-center text-white font-black shadow-lg`}>
                      {post.avatar}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-black tracking-tight">{post.user}</h4>
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">{post.time}</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-pink-500/10 to-purple-600/10 rounded-[2rem] p-6 mb-5 border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform duration-1000">
                      <Award className="w-16 h-16 text-white" />
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-pink-500/20 rounded-xl flex items-center justify-center">
                        <Award className="w-5 h-5 text-pink-400" />
                      </div>
                      <p className="text-white font-black tracking-tight">{post.achievement}</p>
                    </div>
                    <p className="text-sm text-white/60 font-medium leading-relaxed">{post.description}</p>
                  </div>

                  <div className="flex items-center gap-6 pt-5 border-t border-white/5">
                    <button
                      className={`flex items-center gap-2 transition-all active:scale-90 ${
                        likedPosts.has(post.id) ? 'text-pink-500' : 'text-white/20 hover:text-white/40'
                      }`}
                      onClick={() => {
                        const newLiked = new Set(likedPosts);
                        if (newLiked.has(post.id)) newLiked.delete(post.id);
                        else newLiked.add(post.id);
                        setLikedPosts(newLiked);
                      }}
                    >
                      <Heart className={`w-6 h-6 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                      <span className="text-xs font-black">{likedPosts.has(post.id) ? post.likes + 1 : post.likes}</span>
                    </button>
                    <button className="flex items-center gap-2 text-white/20 hover:text-white/40 transition-all active:scale-90">
                      <MessageCircle className="w-6 h-6" />
                      <span className="text-xs font-black">{post.comments}</span>
                    </button>
                    <button className="flex items-center gap-2 text-white/20 hover:text-white/40 transition-all active:scale-90 ml-auto">
                      <Share2 className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-8 animate-fade-in">
              <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-pink-500/20">
                <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div>
                    <p className="text-white/40 font-black uppercase text-[10px] tracking-[0.2em] mb-2">{t('social.yourRank')}</p>
                    <p className="text-5xl font-black tracking-tighter">#2</p>
                  </div>
                  <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-[2rem] flex items-center justify-center border border-white/20">
                    <Trophy className="w-10 h-10 text-white" />
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 relative z-10">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{t('social.yourPoints')}</span>
                    <span className="text-2xl font-black tabular-nums">2,180</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-white font-black text-lg tracking-tight mb-6 px-2">{t('social.topMonth')}</h3>
                <div className="space-y-3">
                  {leaderboard.map((user) => (
                    <div
                      key={user.rank}
                      className={`bg-white/5 border rounded-[2rem] p-5 backdrop-blur-md transition-all group hover:bg-white/10 ${
                        user.rank <= 3 ? 'border-pink-500/30 shadow-lg shadow-pink-500/5' : 'border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                          user.rank === 1
                            ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg'
                            : user.rank === 2
                            ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white'
                            : user.rank === 3
                            ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white'
                            : 'bg-white/5 text-white/40 border border-white/5'
                        }`}>
                          {user.rank}
                        </div>
                        <div className={`w-12 h-12 bg-gradient-to-br ${user.color} rounded-2xl flex items-center justify-center text-white font-black shadow-lg`}>
                          {user.avatar}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-black tracking-tight group-hover:text-pink-400 transition-colors">{user.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <TrendingUp className="w-3 h-3 text-pink-400" />
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest tabular-nums">
                              {user.points.toLocaleString()} {t('social.points')}
                            </span>
                          </div>
                        </div>
                        {user.rank <= 3 && (
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            user.rank === 1 ? 'bg-yellow-400/10 text-yellow-400' :
                            user.rank === 2 ? 'bg-slate-400/10 text-slate-400' :
                            'bg-orange-400/10 text-orange-400'
                          }`}>
                            <Trophy className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
