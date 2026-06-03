import { useEffect, useState } from 'react';
import { Check, Clock, Dumbbell, TrendingUp, Trophy, Flame } from 'lucide-react';

export interface WorkoutSummary {
  durationMin: number;
  volume: number;
  setsDone: number;
  exercises: number;
  prs: { name: string; weight: number }[];
  streak?: number;
}

interface Props {
  summary: WorkoutSummary;
  units: string;
  onClose: () => void;
}

const COLORS = ['#6D4AFF', '#FF6B4A', '#22C55E'];

// Lightweight CSS confetti — no dependency
function Confetti() {
  const pieces = Array.from({ length: 44 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.6;
        const dur = 1.6 + Math.random() * 1.4;
        const size = 6 + Math.random() * 8;
        const color = COLORS[i % COLORS.length];
        const rotate = Math.random() * 360;
        return (
          <span key={i}
            style={{
              position: 'absolute',
              top: '-5%',
              left: `${left}%`,
              width: size,
              height: size * (Math.random() > 0.5 ? 1 : 0.4),
              background: color,
              borderRadius: Math.random() > 0.5 ? '2px' : '50%',
              transform: `rotate(${rotate}deg)`,
              animation: `confetti-fall ${dur}s ${delay}s cubic-bezier(0.4,0,0.6,1) forwards`,
              opacity: 0.9,
            }} />
        );
      })}
    </div>
  );
}

export default function WorkoutCompleteOverlay({ summary, units, onClose }: Props) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(true);
    if (window.navigator.vibrate) window.navigator.vibrate([20, 40, 20, 40, 60]);
  }, []);

  const wUnit = units === 'imperial' ? 'lb' : 'кг';
  const motivational =
    summary.prs.length > 0 ? 'Новий рекорд! Так тримати 🔥'
    : summary.volume > 5000 ? 'Потужне тренування. Ти стаєш сильнішим!'
    : 'Чудова робота. Кожне тренування рахується!';

  const stats = [
    { Icon: Clock, label: 'Час', value: `${summary.durationMin}`, unit: 'хв', color: '#6D4AFF' },
    { Icon: TrendingUp, label: "Об'єм", value: summary.volume.toLocaleString(), unit: wUnit, color: '#FF6B4A' },
    { Icon: Check, label: 'Підходів', value: `${summary.setsDone}`, unit: '', color: '#22C55E' },
    { Icon: Dumbbell, label: 'Вправ', value: `${summary.exercises}`, unit: '', color: '#6D4AFF' },
  ];

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center px-6"
      style={{ background: 'rgba(12,10,20,0.72)', backdropFilter: 'blur(8px)' }}>
      <Confetti />

      <div
        className="relative w-full max-w-sm rounded-[2rem] p-7 text-center"
        style={{
          background: 'var(--bg-card)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
          transform: show ? 'scale(1) translateY(0)' : 'scale(0.85) translateY(20px)',
          opacity: show ? 1 : 0,
          transition: 'all 0.45s cubic-bezier(0.16,1,0.3,1)',
        }}>

        {/* Animated check badge */}
        <div className="mx-auto mb-5 relative" style={{ width: 88, height: 88 }}>
          <div className="absolute inset-0 rounded-full"
            style={{ background: 'linear-gradient(135deg,#22C55E,#4ADE80)', boxShadow: '0 12px 32px rgba(34,197,94,0.45)',
              transform: show ? 'scale(1)' : 'scale(0)', transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.15s' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Check className="w-12 h-12 text-white" strokeWidth={3}
              style={{ transform: show ? 'scale(1)' : 'scale(0)', transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.35s' }} />
          </div>
        </div>

        <h2 className="text-2xl font-bold apple-text mb-1">Тренування завершено!</h2>
        <p className="text-sm apple-text-2 mb-6">{motivational}</p>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {stats.map((s, i) => (
            <div key={i} className="rounded-2xl p-4" style={{ background: 'var(--bg-card2)' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: `${s.color}1A` }}>
                <s.Icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <p className="text-2xl font-bold apple-text leading-none">{s.value}<span className="text-sm font-medium apple-text-3 ml-1">{s.unit}</span></p>
              <p className="text-xs apple-text-3 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* PRs */}
        {summary.prs.length > 0 && (
          <div className="rounded-2xl p-4 mb-5 text-left" style={{ background: '#FF6B4A12', border: '1px solid #FF6B4A30' }}>
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4" style={{ color: '#FF6B4A' }} />
              <span className="text-sm font-bold" style={{ color: '#FF6B4A' }}>Нові рекорди!</span>
            </div>
            <div className="space-y-1.5">
              {summary.prs.slice(0, 3).map((pr, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm apple-text truncate mr-2">{pr.name}</span>
                  <span className="text-sm font-bold apple-text">{pr.weight} {wUnit}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Streak */}
        {summary.streak && summary.streak > 1 && (
          <div className="flex items-center justify-center gap-2 mb-5">
            <Flame className="w-5 h-5" style={{ color: '#FF6B4A', fill: '#FF6B4A' }} />
            <span className="text-sm font-semibold apple-text">{summary.streak} днів поспіль!</span>
          </div>
        )}

        <button onClick={onClose}
          className="w-full py-4 rounded-2xl text-white font-bold active:scale-[0.98] transition-transform"
          style={{ background: 'linear-gradient(135deg,#6D4AFF,#9A6BFF)', boxShadow: '0 8px 24px rgba(109,74,255,0.4)' }}>
          Готово
        </button>
      </div>
    </div>
  );
}
