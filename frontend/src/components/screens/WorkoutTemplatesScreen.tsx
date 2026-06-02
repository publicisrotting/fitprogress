import { useState } from 'react';
import { ChevronLeft, ChevronRight, Dumbbell, Zap, CheckCircle } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';
import { toast } from 'sonner';

interface Props { onNavigate: (s: string) => void; }

const TEMPLATES = [
  {
    id: 'ppl',
    name: 'Push / Pull / Legs',
    description: 'Класична 6-денна програма. Ідеально для проміжного рівня.',
    days: 6,
    level: 'intermediate',
    color: 'var(--accent-move)',
    emoji: '💪',
    program: [
      { name: 'Push A (Груди/Плечі/Трицепс)', exercises: [
        { nameKey: 'benchPress', sets: 4, reps: '8-10', muscle: 'chest' },
        { nameKey: 'inclineDumbbellPress', sets: 3, reps: '10-12', muscle: 'chest' },
        { nameKey: 'dumbbellPress', sets: 4, reps: '8-10', muscle: 'shoulders' },
        { nameKey: 'lateralRaises', sets: 3, reps: '12-15', muscle: 'shoulders' },
        { nameKey: 'skullCrushers', sets: 3, reps: '10-12', muscle: 'arms' },
      ]},
      { name: 'Pull A (Спина/Біцепс)', exercises: [
        { nameKey: 'pullups', sets: 4, reps: '6-10', muscle: 'back' },
        { nameKey: 'barbellRows', sets: 4, reps: '8-10', muscle: 'back' },
        { nameKey: 'latPulldown', sets: 3, reps: '10-12', muscle: 'back' },
        { nameKey: 'bicepCurls', sets: 3, reps: '10-12', muscle: 'arms' },
        { nameKey: 'hammerCurls', sets: 3, reps: '12-15', muscle: 'arms' },
      ]},
      { name: 'Legs A (Ноги)', exercises: [
        { nameKey: 'squats', sets: 4, reps: '6-8', muscle: 'legs' },
        { nameKey: 'romanianDeadlift', sets: 4, reps: '8-10', muscle: 'legs' },
        { nameKey: 'lunges', sets: 3, reps: '10-12', muscle: 'legs' },
        { nameKey: 'crunches', sets: 3, reps: '15-20', muscle: 'abs' },
        { nameKey: 'plank', sets: 3, reps: '60 сек', muscle: 'abs' },
      ]},
      { name: 'Push B (Груди/Плечі/Трицепс)', exercises: [
        { nameKey: 'inclineDumbbellPress', sets: 4, reps: '8-10', muscle: 'chest' },
        { nameKey: 'dumbbellFlyes', sets: 3, reps: '12-15', muscle: 'chest' },
        { nameKey: 'uprightRows', sets: 3, reps: '10-12', muscle: 'shoulders' },
        { nameKey: 'lateralRaises', sets: 4, reps: '15-20', muscle: 'shoulders' },
        { nameKey: 'skullCrushers', sets: 4, reps: '10-12', muscle: 'arms' },
      ]},
      { name: 'Pull B (Спина/Біцепс)', exercises: [
        { nameKey: 'pullups', sets: 4, reps: '6-10', muscle: 'back' },
        { nameKey: 'dumbbellRows', sets: 4, reps: '10-12', muscle: 'back' },
        { nameKey: 'barbellRows', sets: 3, reps: '8-10', muscle: 'back' },
        { nameKey: 'bicepCurls', sets: 4, reps: '10-12', muscle: 'arms' },
        { nameKey: 'hammerCurls', sets: 3, reps: '12-15', muscle: 'arms' },
      ]},
      { name: 'Legs B (Ноги)', exercises: [
        { nameKey: 'squats', sets: 4, reps: '8-10', muscle: 'legs' },
        { nameKey: 'romanianDeadlift', sets: 3, reps: '10-12', muscle: 'legs' },
        { nameKey: 'dumbbellLunges', sets: 4, reps: '10-12', muscle: 'legs' },
        { nameKey: 'legRaises', sets: 3, reps: '15-20', muscle: 'abs' },
        { nameKey: 'plank', sets: 3, reps: '60 сек', muscle: 'abs' },
      ]},
    ],
  },
  {
    id: 'upper_lower',
    name: 'Upper / Lower',
    description: '4-денна програма. Відмінний баланс об\'єму та відновлення.',
    days: 4,
    level: 'beginner',
    color: 'var(--accent-stand)',
    emoji: '🏋️',
    program: [
      { name: 'Upper A', exercises: [
        { nameKey: 'benchPress', sets: 4, reps: '6-8', muscle: 'chest' },
        { nameKey: 'barbellRows', sets: 4, reps: '6-8', muscle: 'back' },
        { nameKey: 'dumbbellPress', sets: 3, reps: '10-12', muscle: 'shoulders' },
        { nameKey: 'bicepCurls', sets: 3, reps: '10-12', muscle: 'arms' },
        { nameKey: 'skullCrushers', sets: 3, reps: '10-12', muscle: 'arms' },
      ]},
      { name: 'Lower A', exercises: [
        { nameKey: 'squats', sets: 4, reps: '6-8', muscle: 'legs' },
        { nameKey: 'romanianDeadlift', sets: 4, reps: '8-10', muscle: 'legs' },
        { nameKey: 'lunges', sets: 3, reps: '12', muscle: 'legs' },
        { nameKey: 'legRaises', sets: 3, reps: '15', muscle: 'abs' },
        { nameKey: 'plank', sets: 3, reps: '45 сек', muscle: 'abs' },
      ]},
      { name: 'Upper B', exercises: [
        { nameKey: 'inclineDumbbellPress', sets: 4, reps: '8-10', muscle: 'chest' },
        { nameKey: 'pullups', sets: 4, reps: '6-10', muscle: 'back' },
        { nameKey: 'lateralRaises', sets: 3, reps: '12-15', muscle: 'shoulders' },
        { nameKey: 'hammerCurls', sets: 3, reps: '12-15', muscle: 'arms' },
        { nameKey: 'skullCrushers', sets: 3, reps: '12-15', muscle: 'arms' },
      ]},
      { name: 'Lower B', exercises: [
        { nameKey: 'squats', sets: 4, reps: '8-10', muscle: 'legs' },
        { nameKey: 'romanianDeadlift', sets: 3, reps: '10-12', muscle: 'legs' },
        { nameKey: 'dumbbellLunges', sets: 4, reps: '10', muscle: 'legs' },
        { nameKey: 'crunches', sets: 4, reps: '20', muscle: 'abs' },
      ]},
    ],
  },
  {
    id: 'full_body',
    name: 'Full Body 3×',
    description: '3-денна повнотілова програма. Ідеально для початківців.',
    days: 3,
    level: 'beginner',
    color: 'var(--accent-exercise)',
    emoji: '🌟',
    program: [
      { name: 'Full Body A', exercises: [
        { nameKey: 'squats', sets: 3, reps: '8', muscle: 'legs' },
        { nameKey: 'benchPress', sets: 3, reps: '8', muscle: 'chest' },
        { nameKey: 'barbellRows', sets: 3, reps: '8', muscle: 'back' },
        { nameKey: 'dumbbellPress', sets: 3, reps: '10', muscle: 'shoulders' },
        { nameKey: 'plank', sets: 3, reps: '30 сек', muscle: 'abs' },
      ]},
      { name: 'Full Body B', exercises: [
        { nameKey: 'romanianDeadlift', sets: 3, reps: '8', muscle: 'legs' },
        { nameKey: 'inclineDumbbellPress', sets: 3, reps: '10', muscle: 'chest' },
        { nameKey: 'latPulldown', sets: 3, reps: '10', muscle: 'back' },
        { nameKey: 'lateralRaises', sets: 3, reps: '12', muscle: 'shoulders' },
        { nameKey: 'crunches', sets: 3, reps: '15', muscle: 'abs' },
      ]},
      { name: 'Full Body C', exercises: [
        { nameKey: 'lunges', sets: 3, reps: '10', muscle: 'legs' },
        { nameKey: 'dumbbellFlyes', sets: 3, reps: '12', muscle: 'chest' },
        { nameKey: 'pullups', sets: 3, reps: '6-8', muscle: 'back' },
        { nameKey: 'bicepCurls', sets: 3, reps: '12', muscle: 'arms' },
        { nameKey: 'skullCrushers', sets: 3, reps: '12', muscle: 'arms' },
      ]},
    ],
  },
  {
    id: 'strength',
    name: '5×5 Сила',
    description: 'Класична силова програма на базових рухах. 3 дні на тиждень.',
    days: 3,
    level: 'intermediate',
    color: 'var(--accent-energy)',
    emoji: '⚡',
    program: [
      { name: 'Тренування A', exercises: [
        { nameKey: 'squats', sets: 5, reps: '5', muscle: 'legs' },
        { nameKey: 'benchPress', sets: 5, reps: '5', muscle: 'chest' },
        { nameKey: 'barbellRows', sets: 5, reps: '5', muscle: 'back' },
      ]},
      { name: 'Тренування B', exercises: [
        { nameKey: 'squats', sets: 5, reps: '5', muscle: 'legs' },
        { nameKey: 'dumbbellPress', sets: 5, reps: '5', muscle: 'shoulders' },
        { nameKey: 'romanianDeadlift', sets: 1, reps: '5', muscle: 'legs' },
      ]},
      { name: 'Тренування C', exercises: [
        { nameKey: 'squats', sets: 5, reps: '5', muscle: 'legs' },
        { nameKey: 'benchPress', sets: 5, reps: '5', muscle: 'chest' },
        { nameKey: 'barbellRows', sets: 5, reps: '5', muscle: 'back' },
      ]},
    ],
  },
];

const LEVEL_LABELS: Record<string, string> = { beginner: 'Початківець', intermediate: 'Середній', advanced: 'Просунутий' };

export default function WorkoutTemplatesScreen({ onNavigate }: Props) {
  const { t } = useSettings();
  const { token } = useAuth();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const handleSave = async (template: typeof TEMPLATES[0]) => {
    setSaving(template.id);
    try {
      const timeRes = await fetch(`${API_URL}/api/workouts/time`);
      const { now } = await timeRes.json();
      const base = new Date(now || new Date());
      const programId = `tpl-${template.id}-${Date.now()}`;
      const programTitle = template.name;

      for (let i = 0; i < template.program.length; i++) {
        const day = template.program[i];
        const exPayload = day.exercises.map(ex => {
          const translatedName = t(`library.exercisesList.${ex.nameKey}.name`);
          const displayName = (translatedName && translatedName !== `library.exercisesList.${ex.nameKey}.name`) ? translatedName : ex.nameKey;
          return {
          name: displayName,
          nameKey: ex.nameKey,
          notes: '',
          sets: Array.from({ length: ex.sets }).map(() => ({
            weight: 0,
            reps: parseInt(String(ex.reps).split('-').pop() || '10') || 10,
            done: false,
          })),
        };});
        const d = new Date(base);
        d.setDate(base.getDate() + i);
        d.setHours(12, 0, 0, 0);

        await fetch(`${API_URL}/api/workouts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
          body: JSON.stringify({
            name: `${template.name} — ${day.name}`,
            duration: 60,
            exercises: exPayload,
            date: d.toISOString(),
            source: 'template',
            programId,
            programTitle,
            programDayIndex: i + 1,
            programGoal: template.id,
          }),
        });
      }
      toast.success(`${template.name} додано в щоденник!`);
      setSaved(prev => new Set([...prev, template.id]));
      onNavigate('diary');
    } catch { toast.error('Помилка'); }
    setSaving(null);
  };

  return (
    <div className="h-full apple-bg overflow-y-auto pb-28">
      <div className="px-5 pt-[calc(3rem+env(safe-area-inset-top))] pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate('generator')} className="w-9 h-9 apple-card rounded-full flex items-center justify-center active:scale-90 transition-transform" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
            <ChevronLeft className="w-5 h-5 apple-text-2" />
          </button>
          <div>
            <h1 className="text-2xl font-bold apple-text">Шаблони програм</h1>
            <p className="text-xs apple-text-3 mt-0.5">Готові програми від тренерів</p>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-4">
        {TEMPLATES.map(tpl => (
          <div key={tpl.id} className="apple-card rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            {/* Header */}
            <button onClick={() => setExpanded(expanded === tpl.id ? null : tpl.id)}
              className="w-full flex items-center gap-4 px-4 py-4 text-left active:opacity-70">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0" style={{ background: tpl.color + '15' }}>
                {tpl.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold apple-text text-base">{tpl.name}</p>
                <p className="text-xs apple-text-2 mt-0.5 leading-relaxed">{tpl.description}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: tpl.color + '20', color: tpl.color }}>
                    {tpl.days} днів
                  </span>
                  <span className="text-xs apple-text-3">{LEVEL_LABELS[tpl.level]}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 apple-text-3 flex-shrink-0 transition-transform" style={{ transform: expanded === tpl.id ? 'rotate(90deg)' : 'none' }} />
            </button>

            {/* Expanded program preview */}
            {expanded === tpl.id && (
              <div style={{ borderTop: '0.5px solid var(--separator)' }}>
                {tpl.program.map((day, di) => (
                  <div key={di} style={{ borderBottom: di < tpl.program.length - 1 ? '0.5px solid var(--separator)' : 'none' }}>
                    <div className="px-4 py-2.5" style={{ background: 'var(--bg-card2)' }}>
                      <p className="text-xs font-semibold apple-text-2">{day.name}</p>
                    </div>
                    {day.exercises.map((ex, ei) => (
                      <div key={ei} className="flex items-center justify-between px-4 py-2.5"
                        style={{ borderTop: ei > 0 ? '0.5px solid var(--separator)' : 'none' }}>
                        <div className="flex items-center gap-3">
                          <Dumbbell className="w-4 h-4 apple-text-3 flex-shrink-0" />
                          <span className="text-sm apple-text">{t(`library.exercisesList.${ex.nameKey}.name`) || ex.nameKey}</span>
                        </div>
                        <span className="text-xs font-medium apple-text-2 flex-shrink-0 ml-2">{ex.sets}×{ex.reps}</span>
                      </div>
                    ))}
                  </div>
                ))}

                <div className="p-4" style={{ borderTop: '0.5px solid var(--separator)' }}>
                  <button onClick={() => handleSave(tpl)} disabled={!!saving || saved.has(tpl.id)}
                    className="w-full py-3.5 rounded-xl text-white font-semibold text-sm active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
                    style={{ background: saved.has(tpl.id) ? 'var(--accent-exercise)' : tpl.color }}>
                    {saving === tpl.id ? (
                      <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : saved.has(tpl.id) ? (
                      <><CheckCircle className="w-5 h-5" /> Додано в щоденник</>
                    ) : (
                      <><Zap className="w-5 h-5" /> Додати в щоденник</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
