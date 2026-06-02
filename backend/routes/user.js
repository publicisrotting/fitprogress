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

    // Mock dashboard data - replace with real aggregations later
    const dashboardData = {
      user: {
        name: user.name,
        picture: user.picture,
        weight: user.weight,
        stats: user.stats || { workouts: 0, achievements: 0, streak: 0 }
      },
      stats: {
        totalReps: 1250, // Mock
        workoutsThisMonth: user.stats?.workouts || 0,
        weekStreak: [
          { completed: true }, { completed: false }, { completed: true }, 
          { completed: true }, { completed: false }, { completed: false }, { completed: false }
        ]
      },
      todayWorkouts: [] // Add real workout logic here
    };

    res.json(dashboardData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  const { name, age, gender, weight, height, goal } = req.body;

  // Build profile object
  const profileFields = {};
  if (name) profileFields.name = name;
  if (age) profileFields.age = age;
  if (gender) profileFields.gender = gender;
  if (weight) profileFields.weight = weight;
  if (height) profileFields.height = height;
  if (goal) profileFields.goal = goal;

  try {
    let user = await User.findById(req.user.userId);

    if (user) {
      // Update
      user = await User.findByIdAndUpdate(
        req.user.userId,
        { $set: profileFields },
        { new: true }
      ).select('-password');

      return res.json(user);
    } else {
      return res.status(404).json({ msg: 'User not found' });
    }
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
