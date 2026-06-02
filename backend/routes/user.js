const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer config for avatar upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + Math.round(Math.random() * 1E9);
    cb(null, 'user-' + req.user.userId + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images are allowed'));
  }
});

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    if (user.isPremium && user.premiumExpiresAt && user.premiumExpiresAt < new Date()) {
      user.isPremium = false;
      user.premiumExpiresAt = null;
      await user.save();
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Dashboard Data Endpoint
router.get('/dashboard', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    if (user.isPremium && user.premiumExpiresAt && user.premiumExpiresAt < new Date()) {
      user.isPremium = false;
      user.premiumExpiresAt = null;
      await user.save();
    }

    const Workout = require('../models/Workout');

    // Real workout aggregations
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    const dayOfWeek = startOfToday.getDay(); // 0=Sun
    const daysFromMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
    startOfWeek.setDate(startOfToday.getDate() - daysFromMonday);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [allWorkouts, todayWorkoutDocs] = await Promise.all([
      Workout.find({ user: req.user.userId }).select('date exercises duration name programGoal programDayIndex programTitle source').lean(),
      Workout.find({ user: req.user.userId, date: { $gte: startOfToday } }).lean()
    ]);

    // Total reps across all workouts
    let totalReps = 0;
    allWorkouts.forEach(w => {
      (w.exercises || []).forEach(ex => {
        (ex.sets || []).forEach(s => { totalReps += (s.reps || 0); });
      });
    });

    // Workouts this month
    const workoutsThisMonth = allWorkouts.filter(w => new Date(w.date) >= startOfMonth).length;

    // Week streak — one entry per day Mon-Sun
    const weekStreak = [];
    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(startOfWeek);
      dayStart.setDate(startOfWeek.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);
      const dateStr = dayStart.toISOString().split('T')[0];
      const completed = allWorkouts.some(w => {
        const d = new Date(w.date);
        return d >= dayStart && d < dayEnd;
      });
      weekStreak.push({ date: dateStr, completed });
    }

    // Update streak counter
    let streakCount = 0;
    const checkDate = new Date(startOfToday);
    while (true) {
      const dayStart = new Date(checkDate);
      const dayEnd = new Date(checkDate);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const hasWorkout = allWorkouts.some(w => {
        const d = new Date(w.date);
        return d >= dayStart && d < dayEnd;
      });
      if (!hasWorkout) break;
      streakCount++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    if (user.stats.streak !== streakCount) {
      user.stats.streak = streakCount;
      await user.save();
    }

    const dashboardData = {
      user: {
        name: user.name,
        picture: user.picture,
        weight: user.weight,
        stats: { workouts: user.stats?.workouts || 0, achievements: user.stats?.achievements || 0, streak: streakCount }
      },
      stats: {
        totalReps,
        workoutsThisMonth,
        weekStreak
      },
      todayWorkouts: todayWorkoutDocs.map(w => ({
        _id: w._id,
        name: w.name,
        details: `${(w.exercises || []).length} exercises`,
        completed: false
      }))
    };

    res.json(dashboardData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  const { name, age, gender, weight, height, goal, experienceLevel, injuries } = req.body;

  const profileFields = {};
  if (name !== undefined) profileFields.name = name;
  if (age !== undefined) profileFields.age = Number(age) || undefined;
  if (gender !== undefined) profileFields.gender = gender;
  if (weight !== undefined) {
    const w = Number(weight);
    if (w > 0 && w < 500) {
      profileFields.weight = w;
      profileFields.$push = { bodyWeightHistory: { date: new Date(), weight: w } };
    }
  }
  if (height !== undefined) profileFields.height = Number(height) || undefined;
  if (goal !== undefined) profileFields.goal = goal;
  if (experienceLevel !== undefined && ['beginner', 'intermediate', 'advanced'].includes(experienceLevel)) {
    profileFields.experienceLevel = experienceLevel;
  }
  if (injuries !== undefined) profileFields.injuries = String(injuries).slice(0, 500);

  try {
    const push = profileFields.$push;
    delete profileFields.$push;
    const updateOp = { $set: profileFields };
    if (push) updateOp.$push = push;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updateOp,
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ msg: 'User not found' });
    return res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.put('/email', auth, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email і пароль обовʼязкові' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.password) {
      return res.status(400).json({ message: 'Неможливо змінити email для Google-акаунту' });
    }

    const isMatch = await bcrypt.compare(String(password), user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Невірний пароль' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
    if (existingUser) {
      return res.status(400).json({ message: 'Користувач з таким email вже існує' });
    }

    user.email = normalizedEmail;
    await user.save();

    res.json({ success: true, email: user.email });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Поточний та новий пароль обовʼязкові' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.password) {
      return res.status(400).json({ message: 'Неможливо змінити пароль для Google-акаунту' });
    }

    const isMatch = await bcrypt.compare(String(currentPassword), user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Невірний поточний пароль' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(String(newPassword), salt);
    await user.save();

    res.json({ success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

// Upload avatar
router.post('/avatar', [auth, upload.single('avatar')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Delete old avatar if exists and not external (google)
    if (user.picture && !user.picture.startsWith('http')) {
      // Logic to delete old file could be added here
    }

    // Construct URL (assuming server serves 'uploads' statically)
    const protocol = req.protocol;
    const host = req.get('host');
    const imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    user.picture = imageUrl;
    await user.save();

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Buy Premium (Mock)
router.post('/premium/buy', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.isPremium = true;
    // Set expiration to 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    user.premiumExpiresAt = expiresAt;

    await user.save();

    res.json({ 
      success: true, 
      isPremium: true, 
      premiumExpiresAt: user.premiumExpiresAt 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Cancel Premium
router.post('/premium/cancel', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.isPremium = false;
    user.premiumExpiresAt = null;

    await user.save();

    res.json({ 
      success: true, 
      isPremium: false,
      msg: 'Premium subscription cancelled'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/settings', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('language theme units');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json({
      language: user.language,
      theme: user.theme,
      units: user.units
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.put('/settings', auth, async (req, res) => {
  const { language, theme, units } = req.body || {};

  const allowedLanguages = new Set(['en', 'ru', 'uk']);
  const allowedThemes = new Set(['light', 'dark']);
  const allowedUnits = new Set(['metric', 'imperial']);

  const update = {};
  if (language !== undefined) {
    if (!allowedLanguages.has(language)) {
      return res.status(400).json({ msg: 'Invalid language' });
    }
    update.language = language;
  }
  if (theme !== undefined) {
    if (!allowedThemes.has(theme)) {
      return res.status(400).json({ msg: 'Invalid theme' });
    }
    update.theme = theme;
  }
  if (units !== undefined) {
    if (!allowedUnits.has(units)) {
      return res.status(400).json({ msg: 'Invalid units' });
    }
    update.units = units;
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: update },
      { new: true }
    ).select('language theme units');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({
      language: user.language,
      theme: user.theme,
      units: user.units
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
