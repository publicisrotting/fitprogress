const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  nameKey: {
    type: String,
    required: true,
    unique: true
  },
  muscle: {
    type: String,
    enum: ['chest', 'back', 'legs', 'shoulders', 'arms', 'abs', 'all'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  image: {
    type: String,
    required: true
  },
  // Optional fields for direct content (fallback or future use)
  name: String,
  description: String,
  instructions: [String]
});

module.exports = mongoose.model('Exercise', exerciseSchema);
