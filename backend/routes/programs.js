const express = require('express');
const router = express.Router();
const Program = require('../models/Program');
const Exercise = require('../models/Exercise');
const auth = require('../middleware/auth');
const User = require('../models/User');

// Get user's program
router.get('/', auth, async (req, res) => {
  try {
    let program = await Program.findOne({ user: req.user.userId }).populate('exercises.exercise');
    
    if (!program) {
      // Create default empty program if none exists
      program = new Program({
        user: req.user.id,
        name: 'My Personal Program',
        exercises: []
      });
      await program.save();
    }
    
    res.json(program);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Add exercise to program
router.post('/add-exercise', auth, async (req, res) => {
  const { exerciseId } = req.body;

  try {
    // Check if exercise exists
    const exercise = await Exercise.findById(exerciseId);
    if (!exercise) {
      return res.status(404).json({ msg: 'Exercise not found' });
    }

    let program = await Program.findOne({ user: req.user.userId });
    
    if (!program) {
      program = new Program({
        user: req.user.userId,
        exercises: []
      });
    }

    // Check if exercise already in program
    const isAlreadyAdded = program.exercises.some(
      item => item.exercise && item.exercise.toString() === exerciseId
    );

    if (isAlreadyAdded) {
      return res.status(400).json({ msg: 'Exercise already in program' });
    }

    // Add to exercises
    program.exercises.push({
      exercise: exerciseId,
      nameKey: exercise.nameKey
    });

    await program.save();
    
    // Populate before returning
    await program.populate('exercises.exercise');

    res.json(program);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Remove exercise from program
router.delete('/exercise/:exerciseId', auth, async (req, res) => {
  try {
    let program = await Program.findOne({ user: req.user.userId });
    
    if (!program) {
      return res.status(404).json({ msg: 'Program not found' });
    }

    program.exercises = program.exercises.filter(
      item => !item.exercise || item.exercise.toString() !== req.params.exerciseId
    );

    await program.save();
    await program.populate('exercises.exercise');

    res.json(program);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

 
// Generate program from user inputs (goal, days, intensity)
// Generate program from user inputs (goal, days, intensity)
router.post('/generate', auth, async (req, res) => {
  try {
    const { goal = 'mass', days = 3, intensity = 'medium', lang = 'uk' } = req.body || {};
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Basic rules using user profile to tweak volume
    const baseSets = intensity === 'high' ? 4 : intensity === 'low' ? 3 : 3;
    const repScheme = intensity === 'strength' ? '4-6' : intensity === 'high' ? '10-12' : '8-10';
    const weightFactor = user.weight ? (user.weight >= 80 ? 1 : 0) : 0;
    const sets = baseSets + weightFactor;
    const dayTitles = {
      uk: {
        mass: [
          'День 1: Груди + Трицепс',
          'День 2: Спина + Біцепс',
          'День 3: Ноги + Плечі',
          'День 4: Верх тіла',
          'День 5: Низ тіла',
        ],
        strength: [
          'День 1: Присідання (Сила) + Додатково',
          'День 2: Жим лежачи (Сила) + Додатково',
          'День 3: Тяга (Сила) + Додатково',
          'День 4: Жим над головою (Сила)',
        ],
        fat_loss: [
          'День 1: Верх тіла + кардіо',
          'День 2: Низ тіла + кардіо',
          'День 3: Повне тіло',
          'День 4: Повне тіло + HIIT',
        ],
        upper: [
          'День 1: Груди + Трицепс',
          'День 2: Спина + Біцепс',
          'День 3: Плечі + ядро',
        ],
        lower: [
          'День 1: Квадрицепси',
          'День 2: Сідниці/Задня поверхня',
          'День 3: Ноги + кардіо',
        ],
      },
      ru: {
        mass: [
          'День 1: Грудь + Трицепс',
          'День 2: Спина + Бицепс',
          'День 3: Ноги + Плечи',
          'День 4: Верх тела',
          'День 5: Низ тела',
        ],
        strength: [
          'День 1: Присед (Сила) + Доп',
          'День 2: Жим лёжа (Сила) + Доп',
          'День 3: Тяга (Сила) + Доп',
          'День 4: Жим над головой (Сила)',
        ],
        fat_loss: [
          'День 1: Верх тела + кардио',
          'День 2: Низ тела + кардио',
          'День 3: Полное тело',
          'День 4: Полное тело + HIIT',
        ],
        upper: [
          'День 1: Грудь + Трицепс',
          'День 2: Спина + Бицепс',
          'День 3: Плечи + кор',
        ],
        lower: [
          'День 1: Квадрицепсы',
          'День 2: Ягодицы/Задняя поверхность',
          'День 3: Ноги + кардио',
        ],
      },
      en: {
        mass: [
          'Day 1: Chest + Triceps',
          'Day 2: Back + Biceps',
          'Day 3: Legs + Shoulders',
          'Day 4: Upper Body',
          'Day 5: Lower Body',
        ],
        strength: [
          'Day 1: Squat (Strength) + Acc',
          'Day 2: Bench Press (Strength) + Acc',
          'Day 3: Deadlift (Strength) + Acc',
          'Day 4: Overhead Press (Strength)',
        ],
        fat_loss: [
          'Day 1: Upper Body + Cardio',
          'Day 2: Lower Body + Cardio',
          'Day 3: Full Body',
          'Day 4: Full Body + HIIT',
        ],
        upper: [
          'Day 1: Chest + Triceps',
          'Day 2: Back + Biceps',
          'Day 3: Shoulders + Core',
        ],
        lower: [
          'Day 1: Quadriceps',
          'Day 2: Glutes/Hamstrings',
          'Day 3: Legs + Cardio',
        ],
      },
    };
    // Extend templates to support up to 6 days for all goals
    const extendedMassUk = [
      'День 1: Груди + Трицепс',
      'День 2: Спина + Біцепс',
      'День 3: Ноги + Плечі',
      'День 4: Верх тіла (повтор)',
      'День 5: Низ тіла (повтор)',
      'День 6: Плечі + Кор',
    ];
    const extendedMassRu = [
      'День 1: Грудь + Трицепс',
      'День 2: Спина + Бицепс',
      'День 3: Ноги + Плечи',
      'День 4: Верх тела (повтор)',
      'День 5: Низ тела (повтор)',
      'День 6: Плечи + Кор',
    ];
    const extendedMassEn = [
      'Day 1: Chest + Triceps',
      'Day 2: Back + Biceps',
      'Day 3: Legs + Shoulders',
      'Day 4: Upper Body (repeat)',
      'Day 5: Lower Body (repeat)',
      'Day 6: Shoulders + Core',
    ];

    // Replace short mass templates with 6-day versions
    dayTitles.uk.mass = extendedMassUk;
    dayTitles.ru.mass = extendedMassRu;
    dayTitles.en.mass = extendedMassEn;

    // Ensure all goals have at least 6 entries (repeat last day)
    ['uk', 'ru', 'en'].forEach(l => {
      Object.keys(dayTitles[l]).forEach(g => {
        const arr = dayTitles[l][g];
        while (arr.length < 6) {
          arr.push(arr[arr.length - 1]);
        }
      });
    });

    const chosenLang = dayTitles[lang] ? lang : 'uk';
    const templateDays = dayTitles[chosenLang] && dayTitles[chosenLang][goal] ? dayTitles[chosenLang][goal] : dayTitles['uk'][goal] || dayTitles['uk']['mass'];
    const clampedDays = Math.max(2, Math.min(Number(days) || 3, 6));
    // Adjust volume based on experience level
    const experienceSets = {
      beginner: baseSets - 1,
      intermediate: baseSets,
      advanced: baseSets + 1,
    };
    const effectiveSets = (experienceSets[user.experienceLevel] || baseSets) + weightFactor;

    const weekPlan = (templateDays || []).slice(0, clampedDays).map((d, idx) => {
      const musclesByGoal = {
        mass: [
          ['chest', 'arms'],
          ['back', 'arms'],
          ['legs', 'shoulders'],
          ['chest', 'back', 'shoulders'],
          ['legs'],
        ],
        strength: [
          ['legs', 'core'],
          ['chest', 'arms'],
          ['back', 'core'],
          ['shoulders', 'arms'],
        ],
        fat_loss: [
          ['chest', 'back', 'shoulders'],
          ['legs'],
          ['all'],
          ['all'],
        ],
        upper: [
          ['chest', 'arms'],
          ['back', 'arms'],
          ['shoulders', 'core'],
        ],
        lower: [
          ['legs'],
          ['legs'],
          ['legs'],
        ],
      };
      const plan = musclesByGoal[goal] || musclesByGoal['mass'];
      return { day: d, muscles: plan[idx] || plan[0] };
    });

    const defaultSeedExercises = [
      {
        nameKey: 'benchPress',
        muscle: 'chest',
        difficulty: 'medium',
        image: 'https://images.unsplash.com/photo-1584827386916-b5351d3ba34b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      },
      {
        nameKey: 'inclineDumbbellPress',
        muscle: 'chest',
        difficulty: 'medium',
        image: 'https://images.unsplash.com/photo-1584827386916-b5351d3ba34b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      },
      {
        nameKey: 'dumbbellFlyes',
        muscle: 'chest',
        difficulty: 'easy',
        image: 'https://images.unsplash.com/photo-1584827386916-b5351d3ba34b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      },
      {
        nameKey: 'pullups',
        muscle: 'back',
        difficulty: 'hard',
        image: 'https://images.unsplash.com/photo-1573858129122-33bdb25d6950?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      },
      {
        nameKey: 'squats',
        muscle: 'legs',
        difficulty: 'medium',
        image: 'https://images.unsplash.com/photo-1656774950529-44a6153521ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      },
      {
        nameKey: 'dumbbellPress',
        muscle: 'shoulders',
        difficulty: 'easy',
        image: 'https://images.unsplash.com/photo-1584827386916-b5351d3ba34b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      },
      {
        nameKey: 'bicepCurls',
        muscle: 'arms',
        difficulty: 'easy',
        image: 'https://images.unsplash.com/photo-1573858129122-33bdb25d6950?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      },
      {
        nameKey: 'plank',
        muscle: 'abs',
        difficulty: 'easy',
        image: 'https://images.unsplash.com/photo-1656774950529-44a6153521ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      },
      {
        nameKey: 'barbellRows',
        muscle: 'back',
        difficulty: 'medium',
        image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      },
      {
        nameKey: 'latPulldown',
        muscle: 'back',
        difficulty: 'easy',
        image: 'https://images.unsplash.com/photo-1581009137042-c552e485697a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      },
      {
        nameKey: 'romanianDeadlift',
        muscle: 'legs',
        difficulty: 'hard',
        image: 'https://images.unsplash.com/photo-1517964603305-11c0f6f66012?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      },
      {
        nameKey: 'lunges',
        muscle: 'legs',
        difficulty: 'easy',
        image: 'https://images.unsplash.com/photo-1599058917212-d750089bc07d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      },
      {
        nameKey: 'lateralRaises',
        muscle: 'shoulders',
        difficulty: 'easy',
        image: 'https://images.unsplash.com/photo-1599058918144-1ffabb6ab9a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      },
      {
        nameKey: 'uprightRows',
        muscle: 'shoulders',
        difficulty: 'medium',
        image: 'https://images.unsplash.com/photo-1599058917212-d750089bc07d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      },
      {
        nameKey: 'skullCrushers',
        muscle: 'arms',
        difficulty: 'medium',
        image: 'https://images.unsplash.com/photo-1599058917765-4f9e7a1b5b9a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      },
      {
        nameKey: 'hammerCurls',
        muscle: 'arms',
        difficulty: 'easy',
        image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      },
      {
        nameKey: 'crunches',
        muscle: 'abs',
        difficulty: 'easy',
        image: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      },
      {
        nameKey: 'legRaises',
        muscle: 'abs',
        difficulty: 'medium',
        image: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      },
      {
        nameKey: 'burpees',
        muscle: 'all',
        difficulty: 'hard',
        image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      },
      {
        nameKey: 'dumbbellRows',
        muscle: 'back',
        difficulty: 'easy',
        image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      },
      {
        nameKey: 'dumbbellLunges',
        muscle: 'legs',
        difficulty: 'medium',
        image: 'https://images.unsplash.com/photo-1599058917212-d750089bc07d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      },
      {
        nameKey: 'dumbbellCleanPress',
        muscle: 'all',
        difficulty: 'hard',
        image: 'https://images.unsplash.com/photo-1517964603305-11c0f6f66012?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      },
    ];

    let allExercises = await Exercise.find();
    if (!allExercises.length) {
      allExercises = await Exercise.insertMany(defaultSeedExercises);
    }

    const byMuscle = allExercises.reduce((acc, ex) => {
      const m = ex.muscle || 'all';
      if (!acc[m]) acc[m] = [];
      acc[m].push(ex);
      return acc;
    }, {});

    // ── Smart programming knobs ──────────────────────────────────────────────
    const COMPOUND = new Set([
      'benchPress', 'squats', 'romanianDeadlift', 'pullups', 'barbellRows',
      'latPulldown', 'dumbbellPress', 'inclineDumbbellPress', 'lunges',
      'dumbbellLunges', 'dumbbellCleanPress'
    ]);
    const BODYWEIGHT = new Set(['pullups', 'crunches', 'legRaises', 'burpees', 'plank']);

    // Per-goal scheme: sets / rep range / rest (sec)
    const GOAL_CFG = {
      mass:     { sets: 4, reps: '8-12',  rest: 90 },
      strength: { sets: 5, reps: '3-5',   rest: 180 },
      fat_loss: { sets: 3, reps: '12-15', rest: 45 },
      upper:    { sets: 4, reps: '8-12',  rest: 75 },
      lower:    { sets: 4, reps: '8-12',  rest: 90 },
      fitness:  { sets: 3, reps: '10-12', rest: 60 },
    };
    const cfg = GOAL_CFG[goal] || GOAL_CFG.mass;
    const intensityDelta = intensity === 'high' ? 1 : intensity === 'low' ? -1 : 0;
    const expDelta = user.experienceLevel === 'advanced' ? 1 : user.experienceLevel === 'beginner' ? -1 : 0;
    const setsFor = (isCompound) => Math.max(2, Math.min(6, cfg.sets + intensityDelta + expDelta + (isCompound ? 0 : -1)));

    // Pick compounds first, then isolation; deterministic-ish but varied
    const pickSmart = (pool, count, used) => {
      const avail = (pool || []).filter(e => e && e.nameKey && !used.has(e.nameKey));
      avail.sort((a, b) => (COMPOUND.has(b.nameKey) ? 1 : 0) - (COMPOUND.has(a.nameKey) ? 1 : 0) || Math.random() - 0.5);
      const chosen = [];
      for (const e of avail) {
        if (chosen.length >= count) break;
        used.add(e.nameKey);
        chosen.push(e);
      }
      return chosen;
    };

    const generated = weekPlan.map(t => {
      const used = new Set();
      const dayExercises = [];
      const perMuscle = t.muscles.length >= 3 ? 2 : t.muscles.length === 2 ? 3 : 4;
      t.muscles.forEach(m => {
        const pool = byMuscle[m] || (m === 'core' ? byMuscle['abs'] : []) || [];
        const picked = pickSmart(pool, perMuscle, used);
        picked.forEach(ex => {
          const isCompound = COMPOUND.has(ex.nameKey);
          const isBw = BODYWEIGHT.has(ex.nameKey);
          dayExercises.push({
            nameKey: ex.nameKey,
            sets: setsFor(isCompound),
            // Bodyweight/core → rep targets; strength compounds keep low reps
            reps: ex.nameKey === 'plank' ? '30-60' : (isBw && goal !== 'strength' ? '12-20' : cfg.reps),
            rest: isCompound ? cfg.rest : Math.round(cfg.rest * 0.7),
            muscle: m,
            compound: isCompound,
          });
        });
      });
      // Order: compounds first within the day
      dayExercises.sort((a, b) => (b.compound ? 1 : 0) - (a.compound ? 1 : 0));
      return { day: t.day, dayIndex: Number((t.day || '').match(/\d+/)?.[0] || 0) || undefined, exercises: dayExercises };
    });

    // Persist as current program for the user (optional)
    let program = await Program.findOne({ user: req.user.userId });
    if (!program) {
      program = new Program({ user: req.user.userId, name: 'Generated Program', exercises: [] });
    }
    program.exercises = [];
    generated.forEach(day => {
      day.exercises.forEach(ex => {
        program.exercises.push({
          nameKey: ex.nameKey,
          sets: ex.sets,
          reps: ex.reps,
        });
      });
    });
    program.updatedAt = new Date();
    await program.save();

    res.json({
      program: generated,
      meta: {
        goal, days: clampedDays, intensity,
        scheme: cfg.reps, restSec: cfg.rest,
        experience: user.experienceLevel || 'beginner',
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Save generated program template
router.post('/save', auth, async (req, res) => {
  try {
    const { program = [], name = 'My Personal Program' } = req.body || {};
    let doc = await Program.findOne({ user: req.user.userId });
    if (!doc) {
      doc = new Program({ user: req.user.userId, name, exercises: [] });
    }
    doc.name = name;
    doc.exercises = [];
    program.forEach(day => {
      (day.exercises || []).forEach(ex => {
        doc.exercises.push({
          nameKey: ex.nameKey || ex.name,
          sets: typeof ex.sets === 'number' ? ex.sets : 3,
          reps: typeof ex.reps === 'string' ? ex.reps : '10-12'
        });
      });
    });
    doc.updatedAt = new Date();
    await doc.save();
    res.json({ success: true, program: doc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
