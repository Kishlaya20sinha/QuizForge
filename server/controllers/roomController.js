const Room = require('../models/Room');
const generateRoomCode = require('../utils/generateRoomCode');
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL);

// Create a room (host only)
exports.createRoom = async (req, res) => {
  try {
    const { topic, difficulty, questionCount, timePerQuestion } = req.body;

    if (!topic || !difficulty || !questionCount) {
      return res.status(400).json({ message: 'topic, difficulty, and questionCount are required' });
    }

    let roomCode;
    let exists = true;

    // Keep generating until we get a code that isn't already in use
    while (exists) {
      roomCode = generateRoomCode();
      exists = await Room.findOne({ roomCode });
    }

    const room = new Room({
      roomCode,
      host: req.user.userId,
      topic,
      difficulty,
      questionCount,
      timePerQuestion: timePerQuestion || 20,
    });

    await room.save();

    // Initialize room state in Redis - stores live player list and game state
    const roomStateKey = `room:${roomCode}:state`;
    await redis.hset(roomStateKey, {
      status: 'waiting',
      currentQuestionIndex: '-1',
      hostId: req.user.userId,
    });
    await redis.expire(roomStateKey, 7200); // auto cleanup after 2 hours if abandoned

    res.status(201).json({
      message: 'Room created',
      roomCode,
      roomId: room._id,
    });
  } catch (err) {
    console.error('Create room error:', err);
    res.status(500).json({ message: 'Failed to create room' });
  }
};

// Join a room (any authenticated user)
exports.joinRoom = async (req, res) => {
  try {
    const { roomCode } = req.body;

    if (!roomCode) {
      return res.status(400).json({ message: 'roomCode is required' });
    }

    const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.status !== 'waiting') {
      return res.status(400).json({ message: 'This game has already started or ended' });
    }

    // Add player to Redis room player list (hash: playerId -> username)
    const playersKey = `room:${room.roomCode}:players`;
    await redis.hset(playersKey, req.user.userId, req.user.username);
    await redis.expire(playersKey, 7200);

    res.status(200).json({
      message: 'Joined room',
      roomCode: room.roomCode,
      topic: room.topic,
      difficulty: room.difficulty,
      questionCount: room.questionCount,
    });
  } catch (err) {
    console.error('Join room error:', err);
    res.status(500).json({ message: 'Failed to join room' });
  }
};

// Get current players in a room (used by waiting room screen)
exports.getRoomPlayers = async (req, res) => {
  try {
    const { roomCode } = req.params;

    const playersKey = `room:${roomCode.toUpperCase()}:players`;
    const players = await redis.hgetall(playersKey);

    // players comes back as { userId: username, userId: username, ... }
    const playerList = Object.entries(players).map(([userId, username]) => ({
      userId,
      username,
    }));

    res.status(200).json({ players: playerList });
  } catch (err) {
    console.error('Get room players error:', err);
    res.status(500).json({ message: 'Failed to fetch players' });
  }
};