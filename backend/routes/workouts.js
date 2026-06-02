const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Workout = require('../models/Workout');
const User = require('../models/User');

// @route   GET api/time
// @desc    Get server time (UTC)
// @access  Public
router.get('/time', async (req, res) => {
  try {
    const now = new Date();
    res.json({ now: now.toISOString(), epoch: now.getTime() });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/workouts
// @desc    Save a new workout
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { name, duration, exercises, date, source, programId, programTitle, programDayIndex, programGoal } = req.body;
    const safeProgramDayIndex = Number.isFinite(Number(programDayIndex)) ? Math.max(0, Math.min(Number(programDayIndex), 365)) : 0;

    const sanitizedExercises = Array.isArray(exercises) ? exercises.map(ex => {
      const sets = Array.isArray(ex.sets) ? ex.sets.map(s => {
        const w = Math.max(0, Math.min(Number(s.weight || 0), 1000));
        const r = Math.max(0, Math.min(Number(s.reps || 0), 100));
        const done = Boolean(s.done);
        return { weight: w, reps: r, done };
      }).filter(s => (s.weight || 0) > 0 || (s.reps || 0) > 0) : [];
      const nameKey = typeof ex.nameKey === 'string' ? ex.nameKey : undefined;
      return { name: (ex.name || '').trim(), nameKey, notes: ex.notes || '', sets };
    }) : [];

    const nonEmptyExercises = sanitizedExercises.filter(ex => (ex.name || ex.nameKey) && ex.sets && ex.sets.length > 0);
    if (nonEmptyExercises.length === 0) {
      return res.status(400).json({ message: 'Workout must include at least one exercise with non-empty sets' });
    }

    const newWorkout = new Workout({
      user: req.user.userId,
      name,
      duration,
      exercises: nonEmptyExercises,
      date: date || Date.now(),
      source: typeof source === 'string' ? source : '',
      programId: typeof programId === 'string' ? programId : '',
      programTitle: typeof programTitle === 'string' ? programTitle : '',
      programGoal: typeof programGoal === 'string' ? programGoal : '',
      programDayIndex: safeProgramDayIndex
    });

    const workout = await newWorkout.save();

    // Update user stats
    await User.findByIdAndUpdate(req.user.userId, {
      $inc: { 'stats.workouts': 1 }
    });

    res.json(workout);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/workouts
// @desc    Get all workouts for current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const workouts = await Workout.find({ user: req.user.userId }).sort({ date: -1 });
    res.json(workouts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id);
    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }
    if (!workout.user || workout.user.toString() !== req.user.userId) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    const { name, date, exercises, source, programId, programTitle, programDayIndex, programGoal } = req.body || {};
    if (name) workout.name = name;
    if (date) workout.date = date;
    if (typeof source === 'string') workout.source = source;
    if (typeof programId === 'string') workout.programId = programId;
    if (typeof programTitle === 'string') workout.programTitle = programTitle;
    if (typeof programGoal === 'string') workout.programGoal = programGoal;
    if (programDayIndex !== undefined) {
      const safeProgramDayIndex = Number.isFinite(Number(programDayIndex)) ? Math.max(0, Math.min(Number(programDayIndex), 365)) : 0;
      workout.programDayIndex = safeProgramDayIndex;
    }
    if (Array.isArray(exercises)) {
      const sanitized = exercises.map(ex => {
        const sets = Array.isArray(ex.sets) ? ex.sets.map(s => {
          const w = Math.max(0, Math.min(Number(s.weight || 0), 1000));
          const r = Math.max(0, Math.min(Number(s.reps || 0), 100));
          const done = Boolean(s.done);
          return { weight: w, reps: r, done };
        }).filter(s => (s.weight || 0) > 0 || (s.reps || 0) > 0) : [];
        const nameKey = typeof ex.nameKey === 'string' ? ex.nameKey : undefined;
        return { name: (ex.name || '').trim(), nameKey, notes: ex.notes || '', sets };
      });
      const nonEmpty = sanitized.filter(ex => (ex.name || ex.nameKey) && ex.sets && ex.sets.length > 0);
      if (nonEmpty.length === 0) {
        return res.status(400).json({ message: 'Workout must include at least one exercise with non-empty sets' });
      }
      workout.exercises = nonEmpty;
    }
    await workout.save();
    res.json(workout);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Workout not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/workouts/:id
// @desc    Delete a workout
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id);

    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    // Check user
    if (!workout.user || workout.user.toString() !== req.user.userId) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await workout.deleteOne();

    // Update user stats (decrement workout count)
    await User.findByIdAndUpdate(req.user.userId, {
      $inc: { 'stats.workouts': -1 }
    });

    res.json({ message: 'Workout removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Workout not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/workouts/hints
// @desc    Get last and best set for exercise name
// @access  Private
router.get('/hints', auth, async (req, res) => {
  try {
    const nameKey = typeof req.query.nameKey === 'string' ? req.query.nameKey.trim() : '';
    const rawName = typeof req.query.name === 'string' ? req.query.name.trim() : '';

    let query = { user: req.user.userId };
    if (nameKey) {
      query['exercises.nameKey'] = nameKey;
    } else if (rawName) {
      const nameRegex = new RegExp(`^${rawName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      query['exercises.name'] = nameRegex;
    } else {
      return res.json({ last: null, best: null });
    }

    const workouts = await Workout.find(query)
      .sort({ date: -1 })
      .select('date exercises');

    let last = null;
    let best = null;

    for (const w of workouts) {
      const ex = (w.exercises || []).find(e => {
        if (nameKey) return (e.nameKey || '') === nameKey;
        const nameRegex = new RegExp(`^${rawName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
        return nameRegex.test(e.name || '');
      });
      if (!ex || !Array.isArray(ex.sets)) continue;

      if (!last) {
        const lastSet = [...ex.sets].reverse().find(s => (s.weight || 0) > 0 || (s.reps || 0) > 0);
        if (lastSet) {
          last = {
            weight: Number(lastSet.weight || 0),
            reps: Number(lastSet.reps || 0),
            date: w.date
          };
        }
      }

      ex.sets.forEach(s => {
        const weight = Number(s.weight || 0);
        const reps = Number(s.reps || 0);
        if (weight <= 0 && reps <= 0) return;
        if (!best || weight > best.weight || (weight === best.weight && reps > best.reps)) {
          best = { weight, reps, date: w.date };
        }
      });
    }

    res.json({ last, best });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/workouts/stats
// @desc    Get workout statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const workouts = await Workout.find({ user: req.user.userId }).sort({ date: 1 });

    // 1. Volume Data (for chart)
    const volumeData = workouts.map(w => {
      const volume = w.exercises.reduce((acc, ex) => {
        return acc + ex.sets.reduce((sAcc, set) => sAcc + (set.weight * set.reps), 0);
      }, 0);
      return {
        date: new Date(w.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        volume,
        rawDate: w.date // for sorting if needed
      };
    });

    // 2. Personal Records
    const prs = {};
    workouts.forEach(w => {
      w.exercises.forEach(ex => {
        ex.sets.forEach(set => {
          if (set.weight > 0) { // Only count real weights
             const key = ex.nameKey || ex.name || 'exercise';
             if (!prs[key] || set.weight > prs[key].weight) {
               prs[key] = {
                 weight: set.weight,
                 date: new Date(w.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
               };
             }
          }
        });
      });
    });

    const personalRecords = Object.entries(prs).map(([key, data]) => ({
      exercise: key,
      weight: `${data.weight} kg`,
      date: data.date,
      improvement: '-' 
    })).slice(0, 5);

    // 3. General Stats
    const totalWorkouts = workouts.length;
    const totalVolume = workouts.reduce((acc, w) => {
       return acc + w.exercises.reduce((eAcc, ex) => {
         return eAcc + ex.sets.reduce((sAcc, set) => sAcc + (set.weight * set.reps), 0);
       }, 0);
    }, 0);

    // This month stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthWorkouts = workouts.filter(w => new Date(w.date) >= startOfMonth);
    
    // Muscle Group Distribution — prefer nameKey lookup, fall back to keyword match
    const muscleGroups = {
      'Chest': 0, 'Back': 0, 'Legs': 0, 'Shoulders': 0, 'Arms': 0, 'Core': 0
    };

    const nameKeyMuscleMap = {
      benchPress: 'Chest', inclineDumbbellPress: 'Chest', dumbbellFlyes: 'Chest',
      pullups: 'Back', barbellRows: 'Back', latPulldown: 'Back', dumbbellRows: 'Back',
      squats: 'Legs', romanianDeadlift: 'Legs', lunges: 'Legs', dumbbellLunges: 'Legs',
      dumbbellPress: 'Shoulders', lateralRaises: 'Shoulders', uprightRows: 'Shoulders',
      bicepCurls: 'Arms', hammerCurls: 'Arms', skullCrushers: 'Arms',
      plank: 'Core', crunches: 'Core', legRaises: 'Core',
      burpees: 'Core', dumbbellCleanPress: 'Core',
    };

    workouts.forEach(w => {
      w.exercises.forEach(ex => {
        if (ex.nameKey && nameKeyMuscleMap[ex.nameKey]) {
          muscleGroups[nameKeyMuscleMap[ex.nameKey]]++;
          return;
        }
        const name = (ex.name || '').toLowerCase();
        if (name.includes('bench') || name.includes('chest') || name.includes('push up') || name.includes('fly')) muscleGroups['Chest']++;
        else if (name.includes('row') || name.includes('pull') || name.includes('lat') || name.includes('deadlift')) muscleGroups['Back']++;
        else if (name.includes('squat') || name.includes('leg') || name.includes('calf') || name.includes('lunge')) muscleGroups['Legs']++;
        else if (name.includes('press') || name.includes('raise') || name.includes('shoulder')) muscleGroups['Shoulders']++;
        else if (name.includes('curl') || name.includes('extension') || name.includes('tricep') || name.includes('bicep')) muscleGroups['Arms']++;
        else muscleGroups['Core']++;
      });
    });

    const muscleGroupData = Object.entries(muscleGroups)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value,
        color: name === 'Chest' ? '#ef4444' : 
               name === 'Back' ? '#3b82f6' : 
               name === 'Legs' ? '#22c55e' : 
               name === 'Shoulders' ? '#eab308' : 
               name === 'Arms' ? '#a855f7' : '#9ca3af'
      }));

    res.json({
      volumeData,
      personalRecords,
      stats: {
        totalVolume,
        totalWorkouts,
        thisMonthWorkouts: thisMonthWorkouts.length
      },
      muscleGroupData
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/workouts/coach
// @desc    AI coach: progressive overload suggestions + recovery guidance
// @access  Private
router.get('/coach', auth, async (req, res) => {
  try {
    const workouts = await Workout.find({ user: req.user.userId })
      .sort({ date: -1 })
      .limit(60)
      .select('date exercises duration');

    if (workouts.length === 0) {
      return res.json({ suggestions: [], message: 'complete_first_workout' });
    }

    const now = new Date();
    const daysSinceLastWorkout = workouts[0]
      ? Math.floor((now - new Date(workouts[0].date)) / (1000 * 60 * 60 * 24))
      : 99;

    // Build per-exercise progression map (only real logged sets with weight > 0)
    const exerciseHistory = {};
    workouts.forEach(w => {
      (w.exercises || []).forEach(ex => {
        const key = ex.nameKey || ex.name;
        if (!key) return;
        if (!exerciseHistory[key]) exerciseHistory[key] = [];
        const maxSet = (ex.sets || []).reduce((best, s) => {
          const vol = (s.weight || 0) * (s.reps || 0);
          return vol > best.vol ? { weight: s.weight, reps: s.reps, vol } : best;
        }, { weight: 0, reps: 0, vol: 0 });
        if (maxSet.vol > 0) {
          exerciseHistory[key].push({ date: w.date, weight: maxSet.weight, reps: maxSet.reps });
        }
      });
    });

    const suggestions = [];
    const hasRealData = Object.keys(exerciseHistory).length > 0;

    // Progressive overload suggestions (need 2+ real sessions)
    Object.entries(exerciseHistory).forEach(([key, history]) => {
      if (history.length < 2) return;
      const [latest, previous] = history;
      const latestVol = latest.weight * latest.reps;
      const prevVol = previous.weight * previous.reps;
      if (latestVol <= prevVol * 1.05) {
        const suggestedWeight = Math.ceil((latest.weight * 1.025) / 2.5) * 2.5;
        suggestions.push({
          type: 'progressive_overload',
          exercise: key,
          current: { weight: latest.weight, reps: latest.reps },
          suggested: { weight: suggestedWeight, reps: latest.reps }
        });
      }
    });

    // Recovery guidance
    let recoveryMessage = null;
    if (daysSinceLastWorkout === 0) {
      recoveryMessage = { type: 'trained_today', severity: 'info' };
    } else if (daysSinceLastWorkout === 1) {
      recoveryMessage = { type: 'good_recovery', severity: 'success' };
    } else if (daysSinceLastWorkout >= 3 && daysSinceLastWorkout <= 5) {
      recoveryMessage = { type: 'ready_to_train', severity: 'warning' };
    } else if (daysSinceLastWorkout > 5) {
      recoveryMessage = { type: 'long_break', severity: 'error', days: daysSinceLastWorkout };
    }

    // Deload recommendation (if 4+ weeks of consecutive training)
    const fourWeeksAgo = new Date(now);
    fourWeeksAgo.setDate(now.getDate() - 28);
    const recentWorkouts = workouts.filter(w => new Date(w.date) >= fourWeeksAgo);
    let deloadRecommended = false;
    if (recentWorkouts.length >= 16) {
      deloadRecommended = true;
    }

    // Weekly volume tracking
    const weeklyVolume = {};
    workouts.forEach(w => {
      const weekKey = getISOWeek(new Date(w.date));
      if (!weeklyVolume[weekKey]) weeklyVolume[weekKey] = 0;
      (w.exercises || []).forEach(ex => {
        (ex.sets || []).forEach(s => {
          weeklyVolume[weekKey] += (s.weight || 0) * (s.reps || 0);
        });
      });
    });
    const weeklyVolumeArray = Object.entries(weeklyVolume)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([week, volume]) => ({ week, volume }));

    // Count planned workouts (weight=0) separately
    const plannedWorkouts = workouts.filter(w =>
      (w.exercises || []).every(ex => (ex.sets || []).every(s => (s.weight || 0) === 0))
    ).length;

    res.json({
      suggestions: suggestions.slice(0, 5),
      recovery: recoveryMessage,
      deloadRecommended,
      daysSinceLastWorkout,
      weeklyVolume: weeklyVolumeArray,
      totalExercisesTracked: Object.keys(exerciseHistory).length,
      hasRealData,
      plannedWorkouts,
      totalWorkouts: workouts.length
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

function getISOWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return `${d.getFullYear()}-W${String(1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7)).padStart(2, '0')}`;
}

// @route   GET api/workouts/body-weight
// @desc    Get body weight history from workout notes (if tracked)
// @access  Private
router.get('/body-weight', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('weight');
    res.json({ current: user?.weight || null, history: [] });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
