const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  source: {
    type: String,
    default: ''
  },
  programId: {
    type: String,
    default: ''
  },
  programTitle: {
    type: String,
    default: ''
  },
  programGoal: {
    type: String,
    default: ''
  },
  programDayIndex: {
    type: Number,
    default: 0
  },
  exercises: [{
    name: String,
    nameKey: String,
    notes: String,
    sets: [{
      weight: Number,
      reps: Number,
      done: Boolean
    }]
  }]
});

module.exports = mongoose.model('Workout', workoutSchema);
