const Redis = require('ioredis');
const { generateQuizQuestions } = require('./groqService');

const redis = new Redis(process.env.REDIS_URL);

const getQuestions = async (topic, difficulty, count) => {
  const cacheKey = `questions:${topic.toLowerCase().trim()}:${difficulty}:${count}`;

  // Check cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log('Serving questions from Redis cache');
    return JSON.parse(cached);
  }

  // Cache miss - call Groq
  console.log('Cache miss - generating fresh questions via Groq');
  const questions = await generateQuizQuestions(topic, difficulty, count);

  // Store in cache with 24 hour expiry (86400 seconds)
  await redis.set(cacheKey, JSON.stringify(questions), 'EX', 86400);

  return questions;
};

module.exports = { getQuestions };