const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { startSoloQuiz, submitAnswer, finishSoloQuiz, getUserStats } = require('../controllers/quizController');

router.post('/solo/start', authMiddleware, startSoloQuiz);
router.post('/solo/answer', authMiddleware, submitAnswer);
router.post('/solo/finish', authMiddleware, finishSoloQuiz);
router.get('/stats', authMiddleware, getUserStats);

module.exports = router;