import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';

const SoloQuizPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const session = location.state?.session;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [result, setResult] = useState(null); // { isCorrect, correctAnswerIndex, explanation }
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);

  const questions = session?.questions || [];
  const currentQuestion = questions[currentIndex];

  // Redirect if no session
  useEffect(() => {
    if (!session) navigate('/dashboard');
  }, [session, navigate]);

  // Timer
  useEffect(() => {
    if (result || finished) return;
    if (timeLeft === 0) {
      handleSubmit(null); // auto-submit with no answer when time runs out
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, result, finished]);

  // Reset timer on new question
  useEffect(() => {
    setTimeLeft(20);
  }, [currentIndex]);

  const handleSubmit = async (selectedIndex) => {
    if (result) return; // already answered
    setSelectedOption(selectedIndex);
    setLoading(true);

    try {
      const res = await api.post('/quiz/solo/answer', {
        sessionId: session.sessionId,
        questionIndex: currentIndex,
        selectedIndex: selectedIndex ?? -1,
      });
      setResult(res.data);
      if (res.data.isCorrect) setScore(res.data.currentScore);
    } catch (err) {
      console.error('Answer submit error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (currentIndex + 1 >= questions.length) {
      // Last question - finish quiz
      try {
        await api.post('/quiz/solo/finish', { sessionId: session.sessionId });
      } catch (err) {
        console.error('Finish error:', err);
      }
      setFinished(true);
      return;
    }
    setCurrentIndex((i) => i + 1);
    setSelectedOption(null);
    setResult(null);
  };

  const getOptionStyle = (index) => {
    if (!result) {
      return {
        ...styles.option,
        ...(selectedOption === index ? styles.optionSelected : {}),
      };
    }
    if (index === result.correctAnswerIndex) return { ...styles.option, ...styles.optionCorrect };
    if (index === selectedOption && !result.isCorrect) return { ...styles.option, ...styles.optionWrong };
    return { ...styles.option, ...styles.optionDisabled };
  };

  // Finished screen
  if (finished) {
    const total = questions.length;
    const percentage = Math.round((score / (total * 10)) * 100);
    return (
      <div style={styles.container}>
        <div style={styles.finishCard}>
          <div style={styles.finishEmoji}>
            {percentage >= 80 ? '🏆' : percentage >= 50 ? '👍' : '💪'}
          </div>
          <h2 style={styles.finishTitle}>Quiz Complete!</h2>
          <div style={styles.scoreCircle}>
            <span style={styles.scoreNumber}>{score}</span>
            <span style={styles.scoreTotal}>/ {total * 10}</span>
          </div>
          <p style={styles.scorePercent}>{percentage}% correct</p>
          <div style={styles.finishButtons}>
            <button style={styles.primaryBtn} onClick={() => navigate('/dashboard')}>
              🏠 Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div style={styles.container}>
      <div style={styles.quizCard}>
        {/* Header */}
        <div style={styles.quizHeader}>
          <span style={styles.progress}>
            Question {currentIndex + 1} / {questions.length}
          </span>
          <div style={{ ...styles.timer, ...(timeLeft <= 5 ? styles.timerDanger : {}) }}>
            ⏱ {timeLeft}s
          </div>
          <span style={styles.scoreDisplay}>Score: {score}</span>
        </div>

        {/* Progress bar */}
        <div style={styles.progressBar}>
          <div style={{
            ...styles.progressFill,
            width: `${((currentIndex) / questions.length) * 100}%`
          }} />
        </div>

        {/* Question */}
        <div style={styles.questionBox}>
          <p style={styles.question}>{currentQuestion.question}</p>
        </div>

        {/* Options */}
        <div style={styles.options}>
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              style={getOptionStyle(index)}
              onClick={() => !result && handleSubmit(index)}
              disabled={!!result || loading}
            >
              <span style={styles.optionLabel}>
                {['A', 'B', 'C', 'D'][index]}
              </span>
              {option}
            </button>
          ))}
        </div>

        {/* Explanation after answer */}
        {result && (
          <div style={{ ...styles.explanation, ...(result.isCorrect ? styles.explanationCorrect : styles.explanationWrong) }}>
            <strong>{result.isCorrect ? '✅ Correct!' : '❌ Wrong!'}</strong>
            <p style={{ marginTop: '6px', fontSize: '14px' }}>{result.explanation}</p>
          </div>
        )}

        {/* Next button */}
        {result && (
          <button style={styles.nextBtn} onClick={handleNext}>
            {currentIndex + 1 >= questions.length ? '🏁 Finish Quiz' : 'Next Question ➡'}
          </button>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  quizCard: {
    background: '#16213e',
    borderRadius: '16px',
    padding: '32px',
    width: '100%',
    maxWidth: '640px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  },
  quizHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  progress: {
    color: '#a8b2d8',
    fontSize: '14px',
  },
  timer: {
    background: '#0f0f1a',
    borderRadius: '20px',
    padding: '6px 16px',
    color: '#a8b2d8',
    fontWeight: 'bold',
    fontSize: '16px',
  },
  timerDanger: {
    color: '#e94560',
    background: '#e9456022',
  },
  scoreDisplay: {
    color: '#a8b2d8',
    fontSize: '14px',
  },
  progressBar: {
    background: '#0f0f1a',
    borderRadius: '4px',
    height: '6px',
    marginBottom: '24px',
    overflow: 'hidden',
  },
  progressFill: {
    background: 'linear-gradient(90deg, #e94560, #c23152)',
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  questionBox: {
    marginBottom: '24px',
  },
  question: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#ffffff',
    lineHeight: '1.5',
  },
  options: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px',
  },
  option: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: '#0f0f1a',
    border: '2px solid #2a2a4a',
    borderRadius: '10px',
    padding: '14px 16px',
    color: '#ffffff',
    fontSize: '15px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s',
  },
  optionSelected: {
    border: '2px solid #e94560',
    background: '#e9456022',
  },
  optionCorrect: {
    border: '2px solid #00c853',
    background: '#00c85322',
    color: '#00c853',
  },
  optionWrong: {
    border: '2px solid #e94560',
    background: '#e9456022',
    color: '#e94560',
  },
  optionDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  optionLabel: {
    background: '#2a2a4a',
    borderRadius: '6px',
    padding: '2px 8px',
    fontSize: '13px',
    fontWeight: 'bold',
    minWidth: '24px',
    textAlign: 'center',
  },
  explanation: {
    borderRadius: '10px',
    padding: '14px',
    marginBottom: '16px',
  },
  explanationCorrect: {
    background: '#00c85322',
    border: '1px solid #00c853',
    color: '#00c853',
  },
  explanationWrong: {
    background: '#e9456022',
    border: '1px solid #e94560',
    color: '#e94560',
  },
  nextBtn: {
    width: '100%',
    background: 'linear-gradient(135deg, #e94560, #c23152)',
    border: 'none',
    borderRadius: '8px',
    padding: '14px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  finishCard: {
    background: '#16213e',
    borderRadius: '16px',
    padding: '48px 32px',
    width: '100%',
    maxWidth: '480px',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  },
  finishEmoji: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  finishTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: '24px',
  },
  scoreCircle: {
    marginBottom: '8px',
  },
  scoreNumber: {
    fontSize: '64px',
    fontWeight: 'bold',
    color: '#e94560',
  },
  scoreTotal: {
    fontSize: '24px',
    color: '#a8b2d8',
  },
  scorePercent: {
    color: '#a8b2d8',
    marginBottom: '32px',
    fontSize: '18px',
  },
  finishButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  primaryBtn: {
    background: 'linear-gradient(135deg, #e94560, #c23152)',
    border: 'none',
    borderRadius: '8px',
    padding: '14px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
};

export default SoloQuizPage;