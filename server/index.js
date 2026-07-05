require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const Redis = require('ioredis');
const { Server } = require('socket.io');

const authRoutes = require('./routes/authRoutes');
const quizRoutes = require('./routes/quizRoutes');
const roomRoutes = require('./routes/roomRoutes');
const authMiddleware = require('./middleware/authMiddleware');
const Room = require('./models/Room');
const { getQuestions } = require('./services/questionService');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('QuizForge backend is running');
});

app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/room', roomRoutes);

app.get('/api/protected-test', authMiddleware, (req, res) => {
  res.json({ message: `Hello ${req.user.username}, your token is valid!` });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

const redis = new Redis(process.env.REDIS_URL);

redis.on('connect', () => {
  console.log('Redis connected');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

const activeTimers = {};

const sendNextQuestion = async (roomCode) => {
  const roomStateKey = `room:${roomCode}:state`;
  const questionsKey = `room:${roomCode}:questions`;

  const state = await redis.hgetall(roomStateKey);
  const questionsRaw = await redis.get(questionsKey);
  const questions = JSON.parse(questionsRaw);

  const nextIndex = parseInt(state.currentQuestionIndex) + 1;

  if (nextIndex >= questions.length) {
    const leaderboardKey = `room:${roomCode}:leaderboard`;
    const topScores = await redis.zrevrange(leaderboardKey, 0, -1, 'WITHSCORES');

    const leaderboard = [];
    for (let i = 0; i < topScores.length; i += 2) {
      leaderboard.push({ username: topScores[i], score: parseInt(topScores[i + 1]) });
    }

    await redis.hset(roomStateKey, { status: 'completed' });

    const room = await Room.findOne({ roomCode });
    if (room) {
      room.status = 'completed';
      await room.save();
    }

    io.to(roomCode).emit('game_over', { leaderboard });
    delete activeTimers[roomCode];
    return;
  }

  await redis.hset(roomStateKey, { currentQuestionIndex: nextIndex.toString() });

  const nextQuestion = questions[nextIndex];
  const room = await Room.findOne({ roomCode });

  io.to(roomCode).emit('new_question', {
    questionIndex: nextIndex,
    totalQuestions: questions.length,
    question: nextQuestion.question,
    options: nextQuestion.options,
    timeLimit: room.timePerQuestion,
  });

  const leaderboardKey = `room:${roomCode}:leaderboard`;
  const topScores = await redis.zrevrange(leaderboardKey, 0, 9, 'WITHSCORES');
  const leaderboard = [];
  for (let i = 0; i < topScores.length; i += 2) {
    leaderboard.push({ username: topScores[i], score: parseInt(topScores[i + 1]) });
  }
  io.to(roomCode).emit('leaderboard_update', { leaderboard });

  activeTimers[roomCode] = setTimeout(() => {
    sendNextQuestion(roomCode);
  }, room.timePerQuestion * 1000);
};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join_room', async ({ roomCode, userId, username }) => {
    const normalizedRoomCode = roomCode.toUpperCase();
    socket.join(normalizedRoomCode);
    socket.data.roomCode = normalizedRoomCode;
    socket.data.userId = userId;
    socket.data.username = username;

    const playersKey = `room:${normalizedRoomCode}:players`;
    await redis.hset(playersKey, userId, username);
    await redis.expire(playersKey, 7200);

    console.log(`${username} joined room ${normalizedRoomCode} (socket: ${socket.id})`);

    const players = await redis.hgetall(playersKey);
    const playerList = Object.entries(players).map(([id, name]) => ({ userId: id, username: name }));

    io.to(normalizedRoomCode).emit('players_updated', { players: playerList });
  });

  socket.on('start_game', async ({ roomCode }) => {
    try {
      const normalizedRoomCode = roomCode.toUpperCase();

      const room = await Room.findOne({ roomCode: normalizedRoomCode });
      if (!room) {
        socket.emit('error_message', { message: 'Room not found' });
        return;
      }

      if (room.host.toString() !== socket.data.userId) {
        socket.emit('error_message', { message: 'Only the host can start the game' });
        return;
      }

      const questions = await getQuestions(room.topic, room.difficulty, room.questionCount);

      const roomStateKey = `room:${normalizedRoomCode}:state`;
      await redis.hset(roomStateKey, {
        status: 'in-progress',
        currentQuestionIndex: '0',
      });
      await redis.set(`room:${normalizedRoomCode}:questions`, JSON.stringify(questions), 'EX', 7200);

      room.status = 'in-progress';
      await room.save();

      const firstQuestion = questions[0];
      io.to(normalizedRoomCode).emit('new_question', {
        questionIndex: 0,
        totalQuestions: questions.length,
        question: firstQuestion.question,
        options: firstQuestion.options,
        timeLimit: room.timePerQuestion,
      });

      activeTimers[normalizedRoomCode] = setTimeout(() => {
        sendNextQuestion(normalizedRoomCode);
      }, room.timePerQuestion * 1000);

      console.log(`Game started in room ${normalizedRoomCode}`);
    } catch (err) {
      console.error('start_game error:', err);
      socket.emit('error_message', { message: 'Failed to start game' });
    }
  });

  socket.on('submit_answer', async ({ roomCode, questionIndex, selectedIndex }) => {
    try {
      const normalizedRoomCode = roomCode.toUpperCase();
      const questionsKey = `room:${normalizedRoomCode}:questions`;
      const questionsRaw = await redis.get(questionsKey);
      const questions = JSON.parse(questionsRaw);

      const question = questions[questionIndex];
      if (!question) {
        socket.emit('error_message', { message: 'Invalid question' });
        return;
      }

      const isCorrect = question.correctAnswerIndex === selectedIndex;
      const points = isCorrect ? 10 : 0;

      if (isCorrect) {
        const leaderboardKey = `room:${normalizedRoomCode}:leaderboard`;
        await redis.zincrby(leaderboardKey, points, socket.data.username);
        await redis.expire(leaderboardKey, 7200);
      }

      socket.emit('answer_result', {
        isCorrect,
        correctAnswerIndex: question.correctAnswerIndex,
        explanation: question.explanation,
      });
    } catch (err) {
      console.error('submit_answer error:', err);
      socket.emit('error_message', { message: 'Failed to submit answer' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});