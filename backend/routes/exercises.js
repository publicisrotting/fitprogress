const express = require('express');
const router = express.Router();
const Exercise = require('../models/Exercise');
const auth = require('../middleware/auth');

// Initial seed data based on frontend hardcoded data
const seedExercises = [
  {
    nameKey: 'benchPress',
    muscle: 'chest',
    difficulty: 'medium',
    image: 'https://images.unsplash.com/photo-1584827386916-b5351d3ba34b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxneW0lMjB3b3Jrb3V0JTIwZXhlcmNpc2V8ZW58MXx8fHwxNzY0NTkxMzYwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
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
    image: 'https://images.unsplash.com/photo-1573858129122-33bdb25d6950?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwZHVtYmJlbGwlMjB0cmFpbmluZ3xlbnwxfHx8fDE3NjQ2NjY4Nzd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  },
  {
    nameKey: 'squats',
    muscle: 'legs',
    difficulty: 'medium',
    image: 'https://images.unsplash.com/photo-1656774950529-44a6153521ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXJiZWxsJTIwc3RyZW5ndGglMjB0cmFpbmluZ3xlbnwxfHx8fDE3NjQ2NjY4Nzd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
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
    image: 'https://images.unsplash.com/photo-1573858129122-33bdb25d6950?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwZHVtYmJlbGwlMjB0cmFpbmluZ3xlbnwxfHx8fDE3NjQ2NjY4Nzd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  },
  {
    nameKey: 'plank',
    muscle: 'abs',
    difficulty: 'easy',
    image: 'https://images.unsplash.com/photo-1656774950529-44a6153521ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXJiZWxsJTIwc3RyZW5ndGglMjB0cmFpbmluZ3xlbnwxfHx8fDE3NjQ2NjY4Nzd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
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

// Get all exercises (public)
router.get('/', async (req, res) => {
  try {
    let exercises = await Exercise.find();
    
    if (exercises.length === 0) {
      exercises = await Exercise.insertMany(seedExercises);
    } else {
      const existing = new Set(exercises.map(e => e.nameKey));
      const missing = seedExercises.filter(s => !existing.has(s.nameKey));
      if (missing.length) {
        await Exercise.insertMany(missing, { ordered: false }).catch(() => {});
        exercises = await Exercise.find();
      }
    }
    
    res.json(exercises);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get exercise by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      return res.status(404).json({ msg: 'Exercise not found' });
    }
    res.json(exercise);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Exercise not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
