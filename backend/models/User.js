const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: false
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  picture: {
    type: String,
    default: ''
  },
  name: {
    type: String,
    default: ''
  },
  stats: {
    workouts: { type: Number, default: 0 },
    achievements: { type: Number, default: 0 },
    streak: { type: Number, default: 0 }
  },
  age: { type: Number },
  gender: { type: String, enum: ['Чоловік', 'Жінка'], default: 'Чоловік' },
  weight: { type: Number },
  height: { type: Number },
  goal: { type: String },
  createdAt: {
    type: Date,
    default: Date.now
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  isPremium: {
    type: Boolean,
    default: false
  },
  premiumExpiresAt: {
    type: Date
  },
  language: {
    type: String,
    enum: ['en', 'ru', 'uk'],
    default: 'uk'
  },
  theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'dark'
  },
  units: {
    type: String,
    enum: ['metric', 'imperial'],
    default: 'metric'
  }
});

module.exports = mongoose.model('User', userSchema);
