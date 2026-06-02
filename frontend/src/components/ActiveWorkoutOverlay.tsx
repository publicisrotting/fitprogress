import { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Pause, Play, Check, ChevronLeft, ChevronRight, Save, Dumbbell } from 'lucide-react';

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

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const rs = s % 60;
  return `${m}:${rs.toString().padStart(2, '0')}`;
}

export default function ActiveWorkoutOverlay({
  workoutName, exercises, elapsed, isMinimized,
  onMinimize, onExpand, onSave, onCancel, onSetDone, onUpdateSet, units
}: Props) {
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [restSeconds, setRestSeconds] = useState(0);
  const [showRest, setShowRest] = useState(false);
  const restRef = useRef<any>(null);
  const touchStartY = useRef(0);

  // Rest countdown
  useEffect(() => {
    if (showRest && restSeconds > 0) {
      restRef.current = setInterval(() => {
        setRestSeconds(p => {
          if (p <= 1) { setShowRest(false); clearInterval(restRef.current); return 0; }
          return p - 1;
        });
      }, 1000);
    }
    return () => clearInterval(restRef.current);
  }, [showRest]);

  const currentEx = exercises[currentExIdx];
  if (!currentEx) return null;

  const doneSets = currentEx.sets.filter(s => s.done).length;
  const totalSets = currentEx.sets.length;
  const totalDone = exercises.reduce((a, ex) => a + ex.sets.filter(s => s.done).length, 0);
  const totalAll = exercises.reduce((a, ex) => a + ex.sets.length, 0);
  const progress = totalAll > 0 ? totalDone / totalAll : 0;

  const handleSetDone = (sIdx: number) => {
    onSetDone(currentExIdx, sIdx);
    if (!currentEx.sets[sIdx].done) {
      // Starting rest timer
      setRestSeconds(90);
      setShowRest(true);
      if (window.navigator.vibrate) window.navigator.vibrate([10, 50, 10]);
    }
    // Auto-advance to next undone set / next exercise
    const nextUndone = currentEx.sets.findIndex((s, i) => i > sIdx && !s.done);
    if (nextUndone === -1) {
      // All sets done in this exercise — move to next
      const nextEx = exercises.findIndex((ex, i) => i > currentExIdx && ex.sets.some(s => !s.done));
      if (nextEx !== -1) setTimeout(() => setCurrentExIdx(nextEx), 600);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (dy > 60) onMinimize();
    if (dy < -60 && isMinimized) onExpand();
  };

  // ── MINIMIZED BAR ──────────────────────────────────────────────────────────
  if (isMinimized) {
    return (
      <div
        className="fixed bottom-0 left-0 right-0 z-[1500]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
      >
        <button onClick={onExpand}
          className="w-full apple-card rounded-t-3xl px-5 py-4 flex items-center gap-4 active:opacity-80 transition-opacity"
          style={{ borderTop: '0.5px solid var(--separator)', boxShadow: '0 -8px 30px rgba(0,0,0,0.15)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent-move)' }}>
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold apple-text truncate">{workoutName}</p>
            <p className="text-xs apple-text-2">{formatTime(elapsed)} · {currentEx.name} · {doneSets}/{totalSets} підходів</p>
          </div>
          {/* Mini progress */}
          <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-card2)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${progress * 100}%`, background: 'var(--accent-move)' }} />
          </div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-move)20' }}>
            <Play className="w-4 h-4" style={{ color: 'var(--accent-move)' }} />
          </div>
        </button>
      </div>
    );
  }

  // ── FULL SCREEN ────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-[1500] flex flex-col"
      style={{ background: 'var(--bg-primary)' }}
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
    >
      {/* Drag handle + controls */}
      <div className="flex items-center justify-between px-5 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-3 flex-shrink-0">
        <button onClick={onCancel} className="w-9 h-9 apple-card2 rounded-full flex items-center justify-center active:scale-90">
          <X className="w-4 h-4 apple-text-2" />
        </button>
        <button onClick={onMinimize} className="flex flex-col items-center gap-1 px-4 active:scale-90">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--separator)' }} />
          <ChevronDown className="w-4 h-4 apple-text-3" />
        </button>
        <button onClick={onSave}
          className="px-5 py-2 rounded-xl text-white text-sm font-semibold active:scale-90"
          style={{ background: 'var(--accent-exercise)', boxShadow: '0 2px 8px rgba(48,209,88,0.3)' }}>
          <Save className="w-4 h-4" />
        </button>
      </div>

      {/* Timer */}
      <div className="text-center px-5 pb-4 flex-shrink-0">
        <p className="text-xs font-semibold uppercase tracking-widest apple-text-3 mb-1">{workoutName}</p>
        <div className="flex items-center justify-center gap-3">
          <p className="text-5xl font-bold tabular-nums tracking-tight" style={{ color: paused ? 'var(--text-tertiary)' : 'var(--accent-move)', fontVariantNumeric: 'tabular-nums' }}>
            {formatTime(elapsed)}
          </p>
          <button onClick={() => setPaused(p => !p)}
            className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90"
            style={{ background: paused ? 'var(--accent-move)' : 'var(--bg-card2)' }}>
            {paused ? <Play className="w-5 h-5 text-white" fill="white" /> : <Pause className="w-5 h-5 apple-text-2" />}
          </button>
        </div>
        {/* Overall progress bar */}
        <div className="mt-3 h-1.5 rounded-full overflow-hidden mx-8" style={{ background: 'var(--bg-card2)' }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress * 100}%`, background: 'var(--accent-move)' }} />
        </div>
        <p className="text-xs apple-text-3 mt-1">{totalDone} з {totalAll} підходів виконано</p>
      </div>

      {/* Rest timer overlay */}
      {showRest && (
        <div className="mx-5 mb-3 rounded-2xl p-4 flex items-center justify-between flex-shrink-0"
          style={{ background: 'var(--accent-stand)15', border: '1px solid var(--accent-stand)30' }}>
          <div>
            <p className="text-xs apple-text-3">Відпочинок</p>
            <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--accent-stand)' }}>{formatTime(restSeconds)}</p>
          </div>
          <button onClick={() => { setShowRest(false); setRestSeconds(0); clearInterval(restRef.current); }}
            className="px-4 py-2 rounded-xl text-sm font-medium" style={{ color: 'var(--accent-stand)', background: 'var(--accent-stand)20' }}>
            Пропустити
          </button>
        </div>
      )}

      {/* Exercise navigation */}
      <div className="px-5 flex items-center gap-3 mb-3 flex-shrink-0">
        <button onClick={() => setCurrentExIdx(Math.max(0, currentExIdx - 1))} disabled={currentExIdx === 0}
          className="w-9 h-9 apple-card rounded-full flex items-center justify-center active:scale-90 disabled:opacity-30">
          <ChevronLeft className="w-5 h-5 apple-text-2" />
        </button>
        <div className="flex-1 text-center">
          <p className="text-xs apple-text-3 mb-0.5">{currentExIdx + 1} / {exercises.length} вправа</p>
          <p className="text-xl font-bold apple-text truncate">{currentEx.name}</p>
          <p className="text-sm apple-text-2 mt-0.5">{doneSets} з {totalSets} підходів</p>
        </div>
        <button onClick={() => setCurrentExIdx(Math.min(exercises.length - 1, currentExIdx + 1))} disabled={currentExIdx === exercises.length - 1}
          className="w-9 h-9 apple-card rounded-full flex items-center justify-center active:scale-90 disabled:opacity-30">
          <ChevronRight className="w-5 h-5 apple-text-2" />
        </button>
      </div>

      {/* Sets */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {/* Column headers */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl mb-2" style={{ background: 'var(--bg-card2)' }}>
          <div className="w-8 text-xs font-semibold apple-text-3 text-center">#</div>
          <div className="flex-1 text-xs font-semibold apple-text-3 text-center">{units === 'metric' ? 'кг' : 'lb'}</div>
          <div className="flex-1 text-xs font-semibold apple-text-3 text-center">Повтори</div>
          <div className="w-14 text-xs font-semibold apple-text-3 text-center">Готово</div>
        </div>

        <div className="space-y-2">
          {currentEx.sets.map((s, sIdx) => (
            <div key={sIdx}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
              style={{
                background: s.done ? 'var(--accent-exercise)12' : 'var(--bg-card)',
                border: s.done ? '1px solid var(--accent-exercise)30' : '0.5px solid var(--separator)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold" style={{ background: s.done ? 'var(--accent-exercise)' : 'var(--bg-card2)', color: s.done ? '#fff' : 'var(--text-secondary)' }}>
                {s.set}
              </div>
              <input type="number" inputMode="decimal" step="0.5" min={0}
                value={s.weight === 0 ? '' : s.weight}
                onChange={e => onUpdateSet(currentExIdx, sIdx, 'weight', e.target.value)}
                className="flex-1 rounded-xl py-3 text-center text-lg font-bold apple-text outline-none"
                style={{ background: s.done ? 'var(--accent-exercise)15' : 'var(--bg-card2)', border: 'none' }}
                placeholder="0" />
              <input type="number" inputMode="numeric" step="1" min={0}
                value={s.reps === 0 ? '' : s.reps}
                onChange={e => onUpdateSet(currentExIdx, sIdx, 'reps', e.target.value)}
                className="flex-1 rounded-xl py-3 text-center text-lg font-bold apple-text outline-none"
                style={{ background: s.done ? 'var(--accent-exercise)15' : 'var(--bg-card2)', border: 'none' }}
                placeholder="0" />
              <button onClick={() => handleSetDone(sIdx)}
                className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90"
                style={{
                  background: s.done ? 'var(--accent-exercise)' : 'var(--bg-card2)',
                  boxShadow: s.done ? '0 4px 14px rgba(48,209,88,0.4)' : 'none',
                  border: s.done ? 'none' : '0.5px solid var(--separator)',
                }}>
                <Check className="w-6 h-6" style={{ color: s.done ? '#fff' : 'var(--text-tertiary)' }} strokeWidth={s.done ? 3 : 2} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Exercise list pills at bottom */}
      <div className="px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] flex gap-2 overflow-x-auto no-scrollbar flex-shrink-0 pt-2" style={{ borderTop: '0.5px solid var(--separator)' }}>
        {exercises.map((ex, i) => {
          const done = ex.sets.filter(s => s.done).length;
          const total = ex.sets.length;
          const isActive = i === currentExIdx;
          const allDone = done === total;
          return (
            <button key={i} onClick={() => setCurrentExIdx(i)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95"
              style={{
                background: isActive ? 'var(--accent-move)' : allDone ? 'var(--accent-exercise)20' : 'var(--bg-card2)',
                color: isActive ? '#fff' : allDone ? 'var(--accent-exercise)' : 'var(--text-secondary)',
                border: isActive ? 'none' : `0.5px solid ${allDone ? 'var(--accent-exercise)40' : 'var(--separator)'}`,
              }}>
              {done}/{total}
            </button>
          );
        })}
      </div>
    </div>
  );
}
