const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const generateQuizQuestions = async (topic, difficulty, count) => {
  const prompt = `Generate ${count} multiple-choice quiz questions about "${topic}" at ${difficulty} difficulty level.

Return ONLY a valid JSON array, with no extra text, markdown, or explanation. Each object in the array must follow this exact structure:
{
  "question": "string",
  "options": ["string", "string", "string", "string"],
  "correctAnswerIndex": number (0-3),
  "explanation": "short string explaining the correct answer"
}

Make sure questions are factually accurate, options are plausible but only one is correct, and difficulty matches: easy = basic facts, medium = requires some understanding, hard = requires deeper knowledge or reasoning.`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
  });

  const rawText = completion.choices[0].message.content;

  // Clean up in case the model wraps it in markdown code fences
  const cleaned = rawText.replace(/```json|```/g, '').trim();

  try {
    const questions = JSON.parse(cleaned);
    return questions;
  } catch (err) {
    console.error('Failed to parse Groq response as JSON:', rawText);
    throw new Error('AI returned malformed question data');
  }
};

module.exports = { generateQuizQuestions };