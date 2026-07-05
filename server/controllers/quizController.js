const QuizSession = require('../models/QuizSession');
const { getQuestions } = require('../services/questionService');
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL);

// Start a new solo quiz
exports.startSoloQuiz = async (req, res) => {
  try {
    const { topic, difficulty, count } = req.body;

    if (!topic || !difficulty || !count) {
      return res.status(400).json({ message: 'topic, difficulty, and count are required' });
    }

    const questions = await getQuestions(topic, difficulty, count);

    const session = new QuizSession({
      user: req.user.userId,
      topic,
      difficulty,
      questions,
    });

    await session.save();

    // Send questions WITHOUT correct answers to the frontend (prevent cheating via dev tools)
    const sanitizedQuestions = questions.map((q, idx) => ({
      index: idx,
      question: q.question,
      options: q.options,
    }));

    res.status(201).json({
      sessionId: session._id,
      totalQuestions: questions.length,
      questions: sanitizedQuestions,
    });
  } catch (err) {
    console.error('Start solo quiz error:', err);
    res.status(500).json({ message: 'Failed to start quiz' });
  }
};

// Submit an answer for a question
exports.submitAnswer = async (req, res) => {
  try {
    const { sessionId, questionIndex, selectedIndex } = req.body;

    const session = await QuizSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not your session' });
    }

    const question = session.questions[questionIndex];
    if (!question) {
      return res.status(400).json({ message: 'Invalid question index' });
    }

    const isCorrect = question.correctAnswerIndex === selectedIndex;

    if (isCorrect) {
      session.score += 10; // simple flat scoring for now
    }

    session.answers.push({ questionIndex, selectedIndex, isCorrect });
    await session.save();

    res.status(200).json({
      isCorrect,
      correctAnswerIndex: question.correctAnswerIndex,
      explanation: question.explanation,
      currentScore: session.score,
    });
  } catch (err) {
    console.error('Submit answer error:', err);
    res.status(500).json({ message: 'Failed to submit answer' });
  }
};

// Finish the quiz
exports.finishSoloQuiz = async (req, res) => {
  try {
    const { sessionId } = req.body;

    const session = await QuizSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not your session' });
    }

    session.status = 'completed';
    await session.save();

    // Update leaderboard in Redis (sorted set)
    const leaderboardKey = `leaderboard:solo:${session.topic.toLowerCase().trim()}:${session.difficulty}`;
    await redis.zadd(leaderboardKey, session.score, req.user.username);

    // Get top 10 for this topic/difficulty
    const topScores = await redis.zrevrange(leaderboardKey, 0, 9, 'WITHSCORES');

    res.status(200).json({
      message: 'Quiz completed',
      finalScore: session.score,
      totalQuestions: session.questions.length,
    });
  } catch (err) {
    console.error('Finish solo quiz error:', err);
    res.status(500).json({ message: 'Failed to finish quiz' });
  }
};