import { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Pause, Play, Check, ChevronLeft, ChevronRight, Dumbbell } from 'lucide-react';

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
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// Gradient accent per exercise index
const ACCENTS = [
  { from: '#6D4AFF', to: '#A24BFF' },  // violet — brand
  { from: '#2E8BFF', to: '#5BB0FF' },  // azure
  { from: '#16C79A', to: '#22D3A6' },  // teal
  { from: '#FF8A3D', to: '#FFB23E' },  // amber
  { from: '#FF4D6D', to: '#FF6B9D' },  // magenta
  { from: '#A24BFF', to: '#C77DFF' },  // purple
];

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

  // Find current active set (first undone)
  const activeSetIdx = ex.sets.findIndex(s => !s.done);
  const allDoneThisEx = activeSetIdx === -1;
  const curSet = activeSetIdx !== -1 ? ex.sets[activeSetIdx] : ex.sets[ex.sets.length - 1];
  const curSetDisplayIdx = activeSetIdx !== -1 ? activeSetIdx : ex.sets.length - 1;

  const totalDone = exercises.reduce((a, e) => a + e.sets.filter(s => s.done).length, 0);
  const totalAll = exercises.reduce((a, e) => a + e.sets.length, 0);
  const pct = totalAll > 0 ? totalDone / totalAll : 0;
  const accent = ACCENTS[exIdx % ACCENTS.length];

  const handleDone = () => {
    if (activeSetIdx === -1) return;
    onSetDone(exIdx, activeSetIdx);
    if (window.navigator.vibrate) window.navigator.vibrate([15, 30, 15]);
    setRest(90); setShowRest(true);
    // Auto-advance to next exercise when all sets done
    const nextDone = ex.sets.filter((_, i) => i !== activeSetIdx).every(s => s.done) && ex.sets.length - 1 === activeSetIdx;
    if (nextDone) {
      const nextEx = exercises.findIndex((e, i) => i > exIdx && e.sets.some(s => !s.done));
      if (nextEx !== -1) setTimeout(() => setExIdx(nextEx), 700);
    }
  };

  const goNext = () => { if (exIdx < exercises.length - 1) setExIdx(exIdx + 1); };
  const goPrev = () => { if (exIdx > 0) setExIdx(exIdx - 1); };

  // ── MINIMIZED BAR ─────────────────────────────────────────────────────────
  if (isMinimized) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-[1500]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        onTouchStart={e => { touchY.current = e.touches[0].clientY; }}
        onTouchEnd={e => { if (e.changedTouches[0].clientY - touchY.current < -50) onExpand(); }}>
        <button onClick={onExpand}
          className="w-full flex items-center gap-3 px-4 py-3.5 active:opacity-80"
          style={{
            background: 'var(--bg-card)',
            borderTop: '0.5px solid var(--separator)',
            boxShadow: '0 -6px 24px rgba(0,0,0,0.12)',
          }}>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${accent.from}, ${accent.to})` }}>
            <Dumbbell className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-bold apple-text truncate">{ex.name}</p>
            <p className="text-xs apple-text-2">{fmt(elapsed)} · {ex.sets.filter(s=>s.done).length}/{ex.sets.length} підходів</p>
          </div>
          <div className="h-1.5 w-20 rounded-full overflow-hidden flex-shrink-0" style={{ background: 'var(--bg-card2)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${pct*100}%`, background: `linear-gradient(90deg,${accent.from},${accent.to})` }} />
          </div>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: `${accent.from}20` }}>
            <Play className="w-4 h-4" style={{ color: accent.from }} fill={accent.from} />
          </div>
        </button>
      </div>
    );
  }

  // ── FULL SCREEN ───────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[1500] flex flex-col"
      style={{ background: 'var(--bg-primary)' }}
      onTouchStart={e => { touchY.current = e.touches[0].clientY; }}
      onTouchEnd={e => { if (e.changedTouches[0].clientY - touchY.current > 70) onMinimize(); }}>

      {/* Accent header gradient */}
      <div className="absolute inset-x-0 top-0 h-48 pointer-events-none opacity-20"
        style={{ background: `linear-gradient(180deg, ${accent.from}50, transparent)` }} />

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 flex-shrink-0 relative z-10"
        style={{ paddingTop: 'calc(1.25rem + env(safe-area-inset-top))', paddingBottom: '0.75rem' }}>
        <button onClick={onCancel}
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
          style={{ background: 'var(--bg-card2)' }}>
          <X className="w-4 h-4 apple-text-2" />
        </button>

        {/* Swipe indicator + timer */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-8 h-1 rounded-full" style={{ background: 'var(--separator)' }} />
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold tabular-nums apple-text">{fmt(elapsed)}</p>
            <button onClick={() => setPaused(p => !p)}
              className="w-7 h-7 rounded-full flex items-center justify-center active:scale-90"
              style={{ background: paused ? `${accent.from}20` : 'var(--bg-card2)' }}>
              {paused
                ? <Play className="w-3.5 h-3.5" style={{ color: accent.from }} fill={accent.from} />
                : <Pause className="w-3.5 h-3.5 apple-text-3" />}
            </button>
          </div>
        </div>

        <button onClick={onSave}
          className="px-4 py-2 rounded-xl text-white text-sm font-bold active:scale-90"
          style={{ background: '#30D158', boxShadow: '0 2px 10px rgba(48,209,88,0.35)' }}>
          Зберегти
        </button>
      </div>

      {/* Overall progress bar */}
      <div className="px-5 mb-3 relative z-10">
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-card2)' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct*100}%`, background: `linear-gradient(90deg,${accent.from},${accent.to})` }} />
        </div>
        <p className="text-xs apple-text-3 mt-1 text-center">{totalDone} з {totalAll} підходів</p>
      </div>

      {/* Exercise nav */}
      <div className="px-5 flex items-center gap-3 mb-4 relative z-10">
        <button onClick={goPrev} disabled={exIdx === 0}
          className="w-9 h-9 rounded-2xl flex items-center justify-center active:scale-90 disabled:opacity-30"
          style={{ background: 'var(--bg-card)' }}>
          <ChevronLeft className="w-5 h-5 apple-text-2" />
        </button>
        <div className="flex-1 text-center">
          <p className="text-xs apple-text-3 mb-0.5">{exIdx+1} / {exercises.length}</p>
          <p className="text-xl font-bold apple-text truncate">{ex.name}</p>
        </div>
        <button onClick={goNext} disabled={exIdx === exercises.length - 1}
          className="w-9 h-9 rounded-2xl flex items-center justify-center active:scale-90 disabled:opacity-30"
          style={{ background: 'var(--bg-card)' }}>
          <ChevronRight className="w-5 h-5 apple-text-2" />
        </button>
      </div>

      {/* Rest timer */}
      {showRest && (
        <div className="mx-5 mb-3 rounded-2xl p-3.5 flex items-center justify-between flex-shrink-0 relative z-10"
          style={{ background: '#0A84FF15', border: '1px solid #0A84FF30' }}>
          <div>
            <p className="text-xs apple-text-3">Відпочинок</p>
            <p className="text-xl font-bold tabular-nums" style={{ color: '#0A84FF' }}>{fmt(rest)}</p>
          </div>
          <button onClick={() => { setShowRest(false); setRest(0); clearInterval(restRef.current); }}
            className="px-4 py-2 rounded-xl text-sm font-medium" style={{ color: '#0A84FF', background: '#0A84FF15' }}>
            Пропустити
          </button>
        </div>
      )}

      {/* Sets list */}
      <div className="flex-1 overflow-y-auto px-5 pb-4 relative z-10 space-y-2">
        {ex.sets.map((s, sIdx) => {
          const isActive = sIdx === activeSetIdx;
          const isDone = s.done;
          const isFuture = !isDone && sIdx > (activeSetIdx !== -1 ? activeSetIdx : ex.sets.length);

          return (
            <div key={sIdx}
              className="rounded-2xl transition-all duration-300"
              style={{
                background: isDone ? '#30D15812' : isActive ? `${accent.from}10` : 'var(--bg-card)',
                border: isDone ? '1px solid #30D15830' : isActive ? `1px solid ${accent.from}40` : '0.5px solid var(--separator)',
                opacity: isFuture ? 0.4 : 1,
                boxShadow: isActive ? `0 4px 20px ${accent.from}15` : 'none',
              }}>
              <div className="flex items-center gap-3 px-4 py-3.5">
                {/* Set number */}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
                  style={{
                    background: isDone ? '#30D158' : isActive ? `linear-gradient(135deg,${accent.from},${accent.to})` : 'var(--bg-card2)',
                    color: isDone || isActive ? '#fff' : 'var(--text-secondary)',
                  }}>
                  {isDone ? <Check className="w-4 h-4" strokeWidth={3} /> : s.set}
                </div>

                {/* Inputs — only active row editable */}
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] apple-text-3 text-center mb-1">{units === 'metric' ? 'кг' : 'lb'}</p>
                    <input type="number" inputMode="decimal" step="0.5" min={0}
                      value={s.weight === 0 ? '' : s.weight}
                      onChange={e => onUpdateSet(exIdx, sIdx, 'weight', e.target.value)}
                      disabled={!isActive && !isDone}
                      className="w-full rounded-xl py-2.5 text-center text-base font-bold apple-text outline-none disabled:opacity-60"
                      style={{
                        background: isActive ? `${accent.from}15` : isDone ? '#30D15815' : 'var(--bg-card2)',
                        border: isActive ? `1px solid ${accent.from}50` : '0.5px solid transparent',
                      }}
                      placeholder="0" />
                  </div>
                  <div>
                    <p className="text-[10px] apple-text-3 text-center mb-1">Повтори</p>
                    <input type="number" inputMode="numeric" step="1" min={0}
                      value={s.reps === 0 ? '' : s.reps}
                      onChange={e => onUpdateSet(exIdx, sIdx, 'reps', e.target.value)}
                      disabled={!isActive && !isDone}
                      className="w-full rounded-xl py-2.5 text-center text-base font-bold apple-text outline-none disabled:opacity-60"
                      style={{
                        background: isActive ? `${accent.from}15` : isDone ? '#30D15815' : 'var(--bg-card2)',
                        border: isActive ? `1px solid ${accent.from}50` : '0.5px solid transparent',
                      }}
                      placeholder="0" />
                  </div>
                </div>

                {/* Done button — only for active set */}
                {isActive && (
                  <button onClick={handleDone}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black active:scale-90 transition-all flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg,${accent.from},${accent.to})`,
                      boxShadow: `0 4px 16px ${accent.from}40`,
                    }}>
                    <Check className="w-6 h-6" strokeWidth={3} />
                  </button>
                )}
                {isDone && (
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: '#30D15820' }}>
                    <Check className="w-5 h-5" style={{ color: '#30D158' }} strokeWidth={3} />
                  </div>
                )}
                {!isActive && !isDone && (
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--bg-card2)' }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: 'var(--separator)' }} />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* All done in this exercise */}
        {allDoneThisEx && exIdx < exercises.length - 1 && (
          <button onClick={goNext}
            className="w-full py-4 rounded-2xl text-white font-bold mt-2 active:scale-[0.98] transition-transform"
            style={{ background: `linear-gradient(135deg,${accent.from},${accent.to})`, boxShadow: `0 4px 16px ${accent.from}30` }}>
            Наступна вправа →
          </button>
        )}
        {allDoneThisEx && exIdx === exercises.length - 1 && (
          <button onClick={onSave}
            className="w-full py-4 rounded-2xl text-white font-bold mt-2 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            style={{ background: '#16C79A', boxShadow: '0 4px 16px rgba(22,199,154,0.3)' }}>
            <Check className="w-5 h-5" strokeWidth={3} /> Завершити тренування
          </button>
        )}
      </div>

      {/* Exercise pills */}
      <div className="flex gap-2 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] overflow-x-auto no-scrollbar flex-shrink-0 pt-2 relative z-10"
        style={{ borderTop: '0.5px solid var(--separator)' }}>
        {exercises.map((e, i) => {
          const done = e.sets.filter(s => s.done).length;
          const total = e.sets.length;
          const isAct = i === exIdx;
          const allD = done === total;
          return (
            <button key={i} onClick={() => setExIdx(i)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95"
              style={{
                background: isAct ? `linear-gradient(135deg,${ACCENTS[i%ACCENTS.length].from},${ACCENTS[i%ACCENTS.length].to})` : allD ? '#30D15820' : 'var(--bg-card2)',
                color: isAct ? '#fff' : allD ? '#30D158' : 'var(--text-secondary)',
              }}>
              {done}/{total}
            </button>
          );
        })}
      </div>
    </div>
  );
}
