const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { startSoloQuiz, submitAnswer, finishSoloQuiz } = require('../controllers/quizController');

router.post('/solo/start', authMiddleware, startSoloQuiz);
router.post('/solo/answer', authMiddleware, submitAnswer);
router.post('/solo/finish', authMiddleware, finishSoloQuiz);

module.exports = router;