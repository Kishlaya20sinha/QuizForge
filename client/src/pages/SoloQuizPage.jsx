import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';

const SoloQuizPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const session = location.state?.session;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);

  const questions = session?.questions || [];
  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    if (!session) navigate('/dashboard');
  }, [session, navigate]);

  useEffect(() => {
    if (result || finished) return;
    if (timeLeft === 0) { handleSubmit(null); return; }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, result, finished]);

  useEffect(() => {
    setTimeLeft(20);
  }, [currentIndex]);

  const handleSubmit = async (selectedIndex) => {
    if (result) return;
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
      return { ...styles.option, ...(selectedOption === index ? styles.optionSelected : {}) };
    }
    if (index === result.correctAnswerIndex) return { ...styles.option, ...styles.optionCorrect };
    if (index === selectedOption && !result.isCorrect) return { ...styles.option, ...styles.optionWrong };
    return { ...styles.option, ...styles.optionDim };
  };

  if (finished) {
    const total = questions.length;
    const percentage = Math.round((score / (total * 10)) * 100);
    return (
      <div style={styles.fullPage}>
        <div style={styles.finishCard}>
          <div style={styles.finishEmoji}>
            {percentage >= 80 ? '🏆' : percentage >= 50 ? '👍' : '💪'}
          </div>
          <h2 style={styles.finishTitle}>Quiz complete!</h2>
          <div style={styles.scoreBig}>
            <span style={styles.scoreNum}>{score}</span>
            <span style={styles.scoreMax}>/ {total * 10}</span>
          </div>
          <p style={styles.scorePercent}>{percentage}% correct</p>
          <button style={styles.primaryBtn} onClick={() => navigate('/dashboard')}>
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const timerPercent = (timeLeft / 20) * 100;

  return (
    <div style={styles.fullPage}>
      <div style={styles.quizCard}>
        {/* Header */}
        <div style={styles.quizHeader}>
          <span style={styles.progressText}>
            Question {currentIndex + 1} / {questions.length}
          </span>
          <div style={{ ...styles.timerBadge, ...(timeLeft <= 5 ? styles.timerDanger : {}) }}>
            ⏱ {timeLeft}s
          </div>
          <span style={styles.scoreBadge}>Score: {score}</span>
        </div>

        {/* Timer bar */}
        <div style={styles.timerBarBg}>
          <div style={{
            ...styles.timerBarFill,
            width: `${timerPercent}%`,
            background: timeLeft <= 5 ? '#dc2626' : 'var(--green-primary)',
            transition: 'width 1s linear',
          }} />
        </div>

        {/* Question */}
        <p style={styles.question}>{currentQuestion.question}</p>

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
              <span>{option}</span>
            </button>
          ))}
        </div>

        {/* Explanation */}
        {result && (
          <div style={{
            ...styles.explanation,
            ...(result.isCorrect ? styles.explanationCorrect : styles.explanationWrong),
          }}>
            <strong>{result.isCorrect ? '✅ Correct!' : '❌ Wrong!'}</strong>
            <p style={{ marginTop: '6px', fontSize: '13px' }}>{result.explanation}</p>
          </div>
        )}

        {/* Next button */}
        {result && (
          <button style={styles.primaryBtn} onClick={handleNext}>
            {currentIndex + 1 >= questions.length ? 'Finish quiz' : 'Next question →'}
          </button>
        )}
      </div>
    </div>
  );
};

const styles = {
  fullPage: {
    minHeight: '100vh',
    background: 'var(--bg-page)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  quizCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    padding: '32px',
    width: '100%',
    maxWidth: '620px',
  },
  quizHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  progressText: {
    fontSize: '13px',
    color: 'var(--text-muted)',
  },
  timerBadge: {
    background: 'var(--green-light)',
    color: 'var(--green-dark)',
    borderRadius: '20px',
    padding: '4px 14px',
    fontSize: '14px',
    fontWeight: '500',
  },
  timerDanger: {
    background: '#fef2f2',
    color: '#dc2626',
  },
  scoreBadge: {
    fontSize: '13px',
    color: 'var(--text-muted)',
  },
  timerBarBg: {
    background: 'var(--bg-page)',
    borderRadius: '4px',
    height: '5px',
    marginBottom: '24px',
    overflow: 'hidden',
  },
  timerBarFill: {
    height: '100%',
    borderRadius: '4px',
  },
  question: {
    fontSize: '19px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    lineHeight: '1.5',
    marginBottom: '20px',
  },
  options: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '20px',
  },
  option: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'var(--bg-page)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '14px 16px',
    color: 'var(--text-primary)',
    fontSize: '14px',
    cursor: 'pointer',
    textAlign: 'left',
  },
  optionSelected: {
    border: '1.5px solid var(--green-primary)',
    background: 'var(--green-light)',
  },
  optionCorrect: {
    border: '1.5px solid #16a34a',
    background: '#f0fdf4',
    color: '#15803d',
  },
  optionWrong: {
    border: '1.5px solid #dc2626',
    background: '#fef2f2',
    color: '#dc2626',
  },
  optionDim: {
    opacity: 0.45,
    cursor: 'not-allowed',
  },
  optionLabel: {
    background: 'var(--border)',
    borderRadius: '6px',
    padding: '2px 8px',
    fontSize: '12px',
    fontWeight: '600',
    minWidth: '22px',
    textAlign: 'center',
    color: 'var(--text-secondary)',
    flexShrink: 0,
  },
  explanation: {
    borderRadius: '10px',
    padding: '14px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  explanationCorrect: {
    background: '#f0fdf4',
    border: '1px solid #86efac',
    color: '#15803d',
  },
  explanationWrong: {
    background: '#fef2f2',
    border: '1px solid #fca5a5',
    color: '#dc2626',
  },
  primaryBtn: {
    width: '100%',
    background: 'var(--green-primary)',
    border: 'none',
    borderRadius: '8px',
    padding: '12px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  finishCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    padding: '48px 40px',
    maxWidth: '420px',
    width: '100%',
    textAlign: 'center',
  },
  finishEmoji: {
    fontSize: '56px',
    marginBottom: '16px',
  },
  finishTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '20px',
  },
  scoreBig: {
    marginBottom: '8px',
  },
  scoreNum: {
    fontSize: '56px',
    fontWeight: '700',
    color: 'var(--green-primary)',
  },
  scoreMax: {
    fontSize: '20px',
    color: 'var(--text-muted)',
  },
  scorePercent: {
    fontSize: '16px',
    color: 'var(--text-muted)',
    marginBottom: '32px',
  },
};

export default SoloQuizPage;