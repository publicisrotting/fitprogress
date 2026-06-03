import { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Pause, Play, Check, ChevronLeft, ChevronRight } from 'lucide-react';

interface WorkoutSet { set: number; weight: number; reps: number; done: boolean; }
interface WorkoutExercise { name: string; nameKey?: string; sets: WorkoutSet[]; }

interface Props {
  workoutName: string;
  exercises: WorkoutExercise[];
  elapsed: number;
  isMinimized: boolean;
  onMinimize: () => void;
  onExpand: () => void;
  onSave: () => void;
  onCancel: () => void;
  onSetDone: (exIdx: number, sIdx: number) => void;
  onUpdateSet: (exIdx: number, sIdx: number, field: 'weight' | 'reps', val: string) => void;
  units: string;
}

function fmt(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  return `${m}:${String(r).padStart(2, '0')}`;
}

// 3-color brand system, cycled per exercise
const ACCENTS = [
  { from: '#6D4AFF', to: '#9A6BFF' },  // violet (primary)
  { from: '#FF6B4A', to: '#FF8A6B' },  // coral (accent)
  { from: '#22C55E', to: '#4ADE80' },  // green (success)
];

// Shared grid template so header + every set row align perfectly
const ROW = 'grid items-center gap-2.5 grid-cols-[40px_1fr_1fr_52px]';

export default function ActiveWorkoutOverlay({
  workoutName, exercises, elapsed, isMinimized,
  onMinimize, onExpand, onSave, onCancel, onSetDone, onUpdateSet, units
}: Props) {
  const [exIdx, setExIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [rest, setRest] = useState(0);
  const [showRest, setShowRest] = useState(false);
  const restRef = useRef<any>(null);
  const touchY = useRef(0);

  useEffect(() => {
    if (!showRest) return;
    restRef.current = setInterval(() => {
      setRest(p => { if (p <= 1) { setShowRest(false); clearInterval(restRef.current); return 0; } return p - 1; });
    }, 1000);
    return () => clearInterval(restRef.current);
  }, [showRest]);

  const ex = exercises[exIdx];
  if (!ex) return null;

  const activeSetIdx = ex.sets.findIndex(s => !s.done);
  const allDoneThisEx = activeSetIdx === -1;

  const totalDone = exercises.reduce((a, e) => a + e.sets.filter(s => s.done).length, 0);
  const totalAll = exercises.reduce((a, e) => a + e.sets.length, 0);
  const pct = totalAll > 0 ? totalDone / totalAll : 0;
  const accent = ACCENTS[exIdx % ACCENTS.length];
  const wUnit = units === 'metric' ? 'кг' : 'lb';

  const handleDone = () => {
    if (activeSetIdx === -1) return;
    const wasLast = activeSetIdx === ex.sets.length - 1;
    onSetDone(exIdx, activeSetIdx);
    if (window.navigator.vibrate) window.navigator.vibrate([15, 30, 15]);
    setRest(90); setShowRest(true);
    if (wasLast) {
      const nextEx = exercises.findIndex((e, i) => i > exIdx && e.sets.some(s => !s.done));
      if (nextEx !== -1) setTimeout(() => setExIdx(nextEx), 700);
    }
  };

  // ── MINIMIZED PILL ────────────────────────────────────────────────────────
  if (isMinimized) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-[1500]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        onTouchStart={e => { touchY.current = e.touches[0].clientY; }}
        onTouchEnd={e => { if (e.changedTouches[0].clientY - touchY.current < -50) onExpand(); }}>
        <button onClick={onExpand}
          className="w-full flex items-center gap-3 px-4 py-3.5 active:opacity-80"
          style={{ background: 'var(--bg-card)', borderTop: '0.5px solid var(--separator)', boxShadow: '0 -6px 24px rgba(0,0,0,0.12)' }}>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${accent.from}, ${accent.to})` }}>
            <span className="text-white text-xs font-bold tabular-nums">{fmt(elapsed).replace(/:\d\d$/, '′')}</span>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-bold apple-text truncate">{ex.name}</p>
            <p className="text-xs apple-text-2">{fmt(elapsed)} · {ex.sets.filter(s => s.done).length}/{ex.sets.length} підходів</p>
          </div>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${accent.from}20` }}>
            <Play className="w-4 h-4" style={{ color: accent.from }} fill={accent.from} />
          </div>
        </button>
      </div>
    );
  }

  // ── FULL SCREEN ───────────────────────────────────────────────────────────
  const R = 54, C = 2 * Math.PI * R;

  return (
    <div className="fixed inset-0 z-[1500] flex flex-col"
      style={{ background: 'var(--bg-primary)' }}
      onTouchStart={e => { touchY.current = e.touches[0].clientY; }}
      onTouchEnd={e => { if (e.changedTouches[0].clientY - touchY.current > 80) onMinimize(); }}>

      {/* Top bar — symmetric: close left, save right, drag handle center */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center px-5 flex-shrink-0"
        style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))', paddingBottom: '0.5rem' }}>
        <div className="justify-self-start">
          <button onClick={onCancel} className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90" style={{ background: 'var(--bg-card2)' }}>
            <X className="w-5 h-5 apple-text-2" />
          </button>
        </div>
        <button onClick={onMinimize} className="justify-self-center flex flex-col items-center gap-1 px-6 py-1 active:opacity-60">
          <div className="w-9 h-1 rounded-full" style={{ background: 'var(--separator)' }} />
          <ChevronDown className="w-4 h-4 apple-text-3" />
        </button>
        <div className="justify-self-end">
          <button onClick={onSave}
            className="px-5 h-10 rounded-full text-white text-sm font-bold active:scale-90"
            style={{ background: '#22C55E', boxShadow: '0 2px 10px rgba(34,197,94,0.35)' }}>
            Готово
          </button>
        </div>
      </div>

      {/* BIG CENTERED TIMER with progress ring */}
      <div className="flex flex-col items-center justify-center flex-shrink-0 pt-2 pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] apple-text-3 mb-3 px-6 text-center truncate max-w-full">{workoutName}</p>
        <div className="relative" style={{ width: 200, height: 200 }}>
          <svg width="200" height="200" viewBox="0 0 120 120" className="-rotate-90">
            <circle cx="60" cy="60" r={R} fill="none" stroke="var(--bg-card2)" strokeWidth="7" />
            <circle cx="60" cy="60" r={R} fill="none" stroke={accent.from} strokeWidth="7" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - pct)} style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1)' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-5xl font-bold tabular-nums apple-text leading-none" style={{ letterSpacing: '-0.02em' }}>{fmt(elapsed)}</p>
            <p className="text-xs apple-text-3 mt-2">{totalDone} / {totalAll} підходів</p>
          </div>
        </div>
        {/* Pause control — single centered pill */}
        <button onClick={() => setPaused(p => !p)}
          className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-full active:scale-95 transition-transform"
          style={{ background: 'var(--bg-card2)' }}>
          {paused ? <Play className="w-4 h-4" style={{ color: accent.from }} fill={accent.from} /> : <Pause className="w-4 h-4 apple-text-2" />}
          <span className="text-sm font-semibold apple-text-2">{paused ? 'Продовжити' : 'Пауза'}</span>
        </button>
      </div>

      {/* Exercise nav — symmetric */}
      <div className="grid grid-cols-[40px_1fr_40px] items-center gap-3 px-5 mb-3 flex-shrink-0">
        <button onClick={() => setExIdx(Math.max(0, exIdx - 1))} disabled={exIdx === 0}
          className="w-10 h-10 rounded-2xl flex items-center justify-center active:scale-90 disabled:opacity-25 justify-self-start" style={{ background: 'var(--bg-card)' }}>
          <ChevronLeft className="w-5 h-5 apple-text-2" />
        </button>
        <div className="text-center min-w-0">
          <p className="text-xs apple-text-3 mb-0.5">{exIdx + 1} / {exercises.length}</p>
          <p className="text-lg font-bold apple-text truncate">{ex.name}</p>
        </div>
        <button onClick={() => setExIdx(Math.min(exercises.length - 1, exIdx + 1))} disabled={exIdx === exercises.length - 1}
          className="w-10 h-10 rounded-2xl flex items-center justify-center active:scale-90 disabled:opacity-25 justify-self-end" style={{ background: 'var(--bg-card)' }}>
          <ChevronRight className="w-5 h-5 apple-text-2" />
        </button>
      </div>

      {/* Sets — aligned grid */}
      <div className="flex-1 overflow-y-auto px-5">
        {/* Column header — same grid template as rows */}
        <div className={`${ROW} px-3 pb-2`}>
          <span className="text-[11px] font-semibold apple-text-3 text-center">№</span>
          <span className="text-[11px] font-semibold apple-text-3 text-center">{wUnit}</span>
          <span className="text-[11px] font-semibold apple-text-3 text-center">Повтори</span>
          <span />
        </div>

        <div className="space-y-2">
          {ex.sets.map((s, sIdx) => {
            const isActive = sIdx === activeSetIdx;
            const isDone = s.done;
            const locked = !isActive && !isDone;
            return (
              <div key={sIdx} className={`${ROW} rounded-2xl px-3 py-2.5 transition-all duration-300`}
                style={{
                  background: isDone ? '#22C55E10' : isActive ? `${accent.from}0D` : 'var(--bg-card)',
                  border: isDone ? '1px solid #22C55E30' : isActive ? `1.5px solid ${accent.from}` : '0.5px solid var(--separator)',
                  opacity: locked ? 0.45 : 1,
                  boxShadow: isActive ? `0 6px 22px ${accent.from}1F` : 'none',
                }}>
                {/* Set number */}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center justify-self-center text-sm font-bold"
                  style={{ background: isDone ? '#22C55E' : isActive ? `linear-gradient(135deg,${accent.from},${accent.to})` : 'var(--bg-card2)', color: isDone || isActive ? '#fff' : 'var(--text-secondary)' }}>
                  {isDone ? <Check className="w-4 h-4" strokeWidth={3} /> : s.set}
                </div>
                {/* Weight */}
                <input type="number" inputMode="decimal" step="0.5" min={0}
                  value={s.weight === 0 ? '' : s.weight}
                  onChange={e => onUpdateSet(exIdx, sIdx, 'weight', e.target.value)}
                  disabled={locked}
                  className="w-full h-11 rounded-xl text-center text-lg font-bold apple-text outline-none"
                  style={{ background: isActive ? `${accent.from}14` : isDone ? '#22C55E12' : 'var(--bg-card2)', border: isActive ? `1px solid ${accent.from}55` : '1px solid transparent' }}
                  placeholder="0" />
                {/* Reps */}
                <input type="number" inputMode="numeric" step="1" min={0}
                  value={s.reps === 0 ? '' : s.reps}
                  onChange={e => onUpdateSet(exIdx, sIdx, 'reps', e.target.value)}
                  disabled={locked}
                  className="w-full h-11 rounded-xl text-center text-lg font-bold apple-text outline-none"
                  style={{ background: isActive ? `${accent.from}14` : isDone ? '#22C55E12' : 'var(--bg-card2)', border: isActive ? `1px solid ${accent.from}55` : '1px solid transparent' }}
                  placeholder="0" />
                {/* Check button — fixed slot, always same size */}
                <button onClick={isActive ? handleDone : undefined} disabled={!isActive}
                  className="w-11 h-11 rounded-xl flex items-center justify-center justify-self-center transition-all active:scale-90"
                  style={{
                    background: isDone ? '#22C55E20' : isActive ? `linear-gradient(135deg,${accent.from},${accent.to})` : 'var(--bg-card2)',
                    boxShadow: isActive ? `0 4px 14px ${accent.from}45` : 'none',
                    cursor: isActive ? 'pointer' : 'default',
                  }}>
                  {isDone
                    ? <Check className="w-5 h-5" style={{ color: '#22C55E' }} strokeWidth={3} />
                    : <Check className="w-5 h-5" style={{ color: isActive ? '#fff' : 'var(--text-tertiary)' }} strokeWidth={isActive ? 3 : 2} />}
                </button>
              </div>
            );
          })}
        </div>

        {/* Next / finish CTA */}
        {allDoneThisEx && (
          <button onClick={exIdx < exercises.length - 1 ? () => setExIdx(exIdx + 1) : onSave}
            className="w-full py-4 rounded-2xl text-white font-bold mt-3 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            style={exIdx < exercises.length - 1
              ? { background: `linear-gradient(135deg,${accent.from},${accent.to})`, boxShadow: `0 6px 20px ${accent.from}33` }
              : { background: '#22C55E', boxShadow: '0 6px 20px rgba(34,197,94,0.33)' }}>
            {exIdx < exercises.length - 1
              ? <>Наступна вправа <ChevronRight className="w-5 h-5" /></>
              : <><Check className="w-5 h-5" strokeWidth={3} /> Завершити тренування</>}
          </button>
        )}
        <div className="h-4" />
      </div>

      {/* Exercise pills — even row */}
      <div className="flex gap-2 px-5 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] overflow-x-auto no-scrollbar flex-shrink-0"
        style={{ borderTop: '0.5px solid var(--separator)' }}>
        {exercises.map((e, i) => {
          const done = e.sets.filter(s => s.done).length;
          const total = e.sets.length;
          const isAct = i === exIdx;
          const allD = done === total;
          const a = ACCENTS[i % ACCENTS.length];
          return (
            <button key={i} onClick={() => setExIdx(i)}
              className="flex-shrink-0 h-9 px-3.5 rounded-full text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
              style={{
                background: isAct ? `linear-gradient(135deg,${a.from},${a.to})` : allD ? '#22C55E20' : 'var(--bg-card2)',
                color: isAct ? '#fff' : allD ? '#22C55E' : 'var(--text-secondary)',
              }}>
              {allD && !isAct && <Check className="w-3 h-3" strokeWidth={3} />}
              {done}/{total}
            </button>
          );
        })}
      </div>

      {/* Rest timer — floating centered toast */}
      {showRest && (
        <div className="absolute left-1/2 -translate-x-1/2 z-10 rounded-full flex items-center gap-3 pl-4 pr-2 py-2"
          style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom))', background: 'var(--bg-card)', boxShadow: '0 8px 30px rgba(0,0,0,0.25)', border: '0.5px solid var(--separator)' }}>
          <span className="text-xs apple-text-3">Відпочинок</span>
          <span className="text-lg font-bold tabular-nums" style={{ color: accent.from }}>{fmt(rest)}</span>
          <button onClick={() => { setShowRest(false); setRest(0); clearInterval(restRef.current); }}
            className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-card2)' }}>
            <X className="w-4 h-4 apple-text-2" />
          </button>
        </div>
      )}
    </div>
  );
}
