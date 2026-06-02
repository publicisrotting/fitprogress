import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Trophy, Flame, Dumbbell, TrendingUp, Users, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';

interface Props { onNavigate: (s: string) => void; }

const COMMUNITY_POSTS = [
  { id: '1', user: 'Олексій К.', avatar: '💪', time: '2 год тому', workout: 'Push Day — Груди + Трицепс', exercises: 5, volume: 8450, duration: 62, pr: 'Жим лежачи 120кг 🏆', likes: 12, comments: 3 },
  { id: '2', user: 'Марія В.', avatar: '🔥', time: '4 год тому', workout: 'Legs Day', exercises: 6, volume: 12300, duration: 75, pr: null, likes: 8, comments: 1 },
  { id: '3', user: 'Дмитро П.', avatar: '⚡', time: '6 год тому', workout: '5×5 Сила — Тренування A', exercises: 3, volume: 15600, duration: 55, pr: 'Присідання 140кг 🏆', likes: 24, comments: 7 },
  { id: '4', user: 'Вікторія С.', avatar: '🌟', time: 'вчора', workout: 'Full Body', exercises: 8, volume: 6200, duration: 48, pr: null, likes: 5, comments: 2 },
];

export default function SocialScreen({ onNavigate }: Props) {
  const { token } = useAuth();
  const [myWorkouts, setMyWorkouts] = useState<any[]>([]);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<'feed' | 'my'>('feed');
  const [sharing, setSharing] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/workouts`, { headers: { 'x-auth-token': token } })
      .then(r => r.json()).then(d => setMyWorkouts(Array.isArray(d) ? d.slice(0, 10) : [])).catch(() => {});
  }, [token]);

  const shareWorkout = async (workout: any) => {
    setSharing(workout._id || workout.id);
    const vol = (workout.exercises || []).reduce((a: number, ex: any) =>
      a + (ex.sets || []).reduce((b: number, s: any) => b + ((s.weight || 0) * (s.reps || 0)), 0), 0);
    const text = `💪 Щойно завершив тренування в FitProgress!\n\n🏋️ ${workout.name || workout.workout}\n📊 ${(workout.exercises || []).length || workout.exercises} вправ\n⚡ Об'єм: ${(vol || workout.volume || 0).toLocaleString()} кг\n⏱ ${workout.duration || 60} хв\n\n#FitProgress #fitness #workout`;
    try {
      if (navigator.share) await navigator.share({ title: 'Моє тренування', text });
      else { await navigator.clipboard.writeText(text); alert('Скопійовано в буфер!'); }
    } catch {}
    setSharing(null);
  };

  const toggleLike = (id: string) => setLiked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div className="h-full apple-bg overflow-y-auto pb-28">
      <div className="px-5 pt-[calc(3rem+env(safe-area-inset-top))] pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold apple-text tracking-tight">Спільнота</h1>
            <p className="text-sm apple-text-2 mt-0.5">Тренування друзів</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium" style={{ background: 'var(--accent-stand)' }}>
            <UserPlus className="w-4 h-4" /> Запросити
          </button>
        </div>
        <div className="flex gap-1.5 p-1 apple-card rounded-xl mb-2" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          {[{id:'feed',label:'Стрічка'},{id:'my',label:'Мої'}].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{ background: tab === t.id ? 'var(--accent-move)' : 'transparent', color: tab === t.id ? '#fff' : 'var(--text-secondary)' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 space-y-4">
        {tab === 'feed' ? <>
          <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'var(--accent-stand)12', border: '1px solid var(--accent-stand)25' }}>
            <Users className="w-8 h-8 flex-shrink-0" style={{ color: 'var(--accent-stand)' }} />
            <div>
              <p className="text-sm font-semibold apple-text">FitProgress Спільнота</p>
              <p className="text-xs apple-text-2 mt-0.5">1 247 атлетів тренуються разом</p>
            </div>
          </div>
          {COMMUNITY_POSTS.map(post => (
            <div key={post.id} className="apple-card rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '0.5px solid var(--separator)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: 'var(--bg-card2)' }}>{post.avatar}</div>
                <div className="flex-1"><p className="text-sm font-semibold apple-text">{post.user}</p><p className="text-xs apple-text-3">{post.time}</p></div>
                <button onClick={() => shareWorkout(post)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-card2)' }}>
                  <Share2 className="w-4 h-4 apple-text-3" />
                </button>
              </div>
              <div className="px-4 py-3">
                <p className="text-base font-bold apple-text mb-2">{post.workout}</p>
                {post.pr && <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl" style={{ background: 'var(--accent-energy)15' }}>
                  <Trophy className="w-4 h-4" style={{ color: 'var(--accent-energy)' }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--accent-energy)' }}>{post.pr}</span>
                </div>}
                <div className="flex items-center gap-4">
                  {[{icon:Dumbbell,val:`${post.exercises} вправ`},{icon:TrendingUp,val:`${post.volume.toLocaleString()} кг`},{icon:Flame,val:`${post.duration} хв`}].map((s,i)=>(
                    <div key={i} className="flex items-center gap-1.5"><s.icon className="w-3.5 h-3.5 apple-text-3" /><span className="text-xs apple-text-2">{s.val}</span></div>
                  ))}
                </div>
              </div>
              <div className="flex items-center px-4 py-2.5" style={{ borderTop: '0.5px solid var(--separator)' }}>
                <button onClick={() => toggleLike(post.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl active:scale-90">
                  <Heart className="w-4 h-4" style={{ color: liked.has(post.id) ? 'var(--accent-move)' : 'var(--text-tertiary)', fill: liked.has(post.id) ? 'var(--accent-move)' : 'none' }} />
                  <span className="text-sm apple-text-2">{post.likes + (liked.has(post.id) ? 1 : 0)}</span>
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl active:scale-90 ml-1">
                  <MessageCircle className="w-4 h-4 apple-text-3" />
                  <span className="text-sm apple-text-2">{post.comments}</span>
                </button>
              </div>
            </div>
          ))}
        </> : <>
          {myWorkouts.length === 0 ? (
            <div className="py-14 text-center">
              <Dumbbell className="w-12 h-12 apple-text-3 mx-auto mb-3" />
              <p className="text-base font-semibold apple-text mb-1">Немає тренувань</p>
              <button onClick={() => onNavigate('diary')} className="px-6 py-3 rounded-xl text-white text-sm font-semibold mt-3" style={{ background: 'var(--accent-move)' }}>Розпочати</button>
            </div>
          ) : myWorkouts.map((w, i) => {
            const vol = (w.exercises||[]).reduce((a:number,ex:any)=>a+(ex.sets||[]).reduce((b:number,s:any)=>b+((s.weight||0)*(s.reps||0)),0),0);
            return (
              <div key={w._id||i} className="apple-card rounded-2xl p-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <p className="text-sm font-bold apple-text mb-1">{w.name}</p>
                <p className="text-xs apple-text-2 mb-3">{(w.exercises||[]).length} вправ · {vol.toLocaleString()} кг · {w.duration||0} хв</p>
                <button onClick={() => shareWorkout(w)} disabled={sharing===w._id}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-60"
                  style={{ background: 'var(--accent-stand)15', color: 'var(--accent-stand)' }}>
                  {sharing===w._id ? '...' : <><Share2 className="w-4 h-4" /> Поділитись</>}
                </button>
              </div>
            );
          })}
        </>}
      </div>
    </div>
  );
}
