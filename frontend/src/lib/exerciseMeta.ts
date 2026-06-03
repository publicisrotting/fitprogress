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
