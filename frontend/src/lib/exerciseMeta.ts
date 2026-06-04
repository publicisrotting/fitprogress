// Exercise type metadata — drives whether the weight field is shown.
// 'weighted' → weight + reps
// 'bodyweight' → reps only (no weight field)
// 'timed' → seconds only (no weight field, reps column means seconds)

export type ExerciseType = 'weighted' | 'bodyweight' | 'timed';

const BODYWEIGHT = new Set(['pullups', 'crunches', 'legRaises', 'burpees', 'pushups', 'dips']);
const TIMED = new Set(['plank']);

export function getExerciseType(nameKey?: string, name?: string): ExerciseType {
  const key = nameKey || '';
  if (TIMED.has(key)) return 'timed';
  if (BODYWEIGHT.has(key)) return 'bodyweight';
  // Heuristic fallback by human name for custom entries
  const n = (name || '').toLowerCase();
  if (/планк|plank|планка/.test(n)) return 'timed';
  if (/прес|скручув|press up|push.?up|підтяг|pull.?up|берпі|burpee|підйом ніг|leg raise|віджим/.test(n)) return 'bodyweight';
  return 'weighted';
}

export function isWeighted(nameKey?: string, name?: string) {
  return getExerciseType(nameKey, name) === 'weighted';
}

// nameKey → primary muscle group (mirrors backend)
export const EXERCISE_MUSCLE: Record<string, string> = {
  benchPress: 'chest', inclineDumbbellPress: 'chest', dumbbellFlyes: 'chest',
  pullups: 'back', barbellRows: 'back', latPulldown: 'back', dumbbellRows: 'back',
  squats: 'legs', romanianDeadlift: 'legs', lunges: 'legs', dumbbellLunges: 'legs',
  dumbbellPress: 'shoulders', lateralRaises: 'shoulders', uprightRows: 'shoulders',
  bicepCurls: 'arms', hammerCurls: 'arms', skullCrushers: 'arms',
  plank: 'abs', crunches: 'abs', legRaises: 'abs',
  burpees: 'all', dumbbellCleanPress: 'all',
};

export const MUSCLE_LABEL: Record<string, string> = {
  chest: 'Груди', back: 'Спина', legs: 'Ноги', shoulders: 'Плечі',
  arms: 'Руки', abs: 'Прес', all: 'Все тіло',
};

export function getMuscle(nameKey?: string, name?: string): string {
  if (nameKey && EXERCISE_MUSCLE[nameKey]) return EXERCISE_MUSCLE[nameKey];
  const n = (name || '').toLowerCase();
  if (/груд|жим лежач|chest|bench/.test(n)) return 'chest';
  if (/спин|тяг|підтяг|back|row|pull/.test(n)) return 'back';
  if (/ног|присід|випад|legs|squat|lunge/.test(n)) return 'legs';
  if (/плеч|махи|shoulder|press|raise/.test(n)) return 'shoulders';
  if (/біцепс|трицепс|рук|curl|arm/.test(n)) return 'arms';
  if (/прес|планк|скручув|abs|plank|crunch/.test(n)) return 'abs';
  return 'all';
}
