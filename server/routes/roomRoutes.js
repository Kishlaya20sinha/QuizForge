const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { createRoom, joinRoom, getRoomPlayers } = require('../controllers/roomController');

router.post('/create', authMiddleware, createRoom);
router.post('/join', authMiddleware, joinRoom);
router.get('/:roomCode/players', authMiddleware, getRoomPlayers);

module.exports = router;