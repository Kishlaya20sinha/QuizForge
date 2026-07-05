const mongoose = require('mongoose');

const quizSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  topic: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  questions: { type: Array, required: true },
  currentQuestionIndex: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
  answers: { type: Array, default: [] }, // tracks each answer given
  status: { type: String, enum: ['in-progress', 'completed'], default: 'in-progress' },
}, { timestamps: true });

module.exports = mongoose.model('QuizSession', quizSessionSchema);