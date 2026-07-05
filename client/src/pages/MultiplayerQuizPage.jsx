import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const MultiplayerQuizPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const roomCode = location.state?.roomCode;
  const isHost = location.state?.isHost;
  const socketRef = useRef(null);

  const [question, setQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [timeLimit, setTimeLimit] = useState(15);
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedOption, setSelectedOption] = useState(null);
  const [result, setResult] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!roomCode) { navigate('/dashboard'); return; }

    const socket = io('http://localhost:5000');
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_room', { roomCode, userId: user.id, username: user.username });
    });

    socket.on('new_question', (data) => {
      setQuestion(data);
      setQuestionIndex(data.questionIndex);
      setTotalQuestions(data.totalQuestions);
      setTimeLimit(data.timeLimit);
      setTimeLeft(data.timeLimit);
      setSelectedOption(null);
      setResult(null);
    });

    socket.on('answer_result', (data) => {
      setResult(data);
      if (data.isCorrect) setScore((prev) => prev + 10);
    });

    socket.on('leaderboard_update', (data) => {
      setLeaderboard(data.leaderboard);
    });

    socket.on('game_over', (data) => {
      navigate('/game-over', { state: { leaderboard: data.leaderboard, roomCode } });
    });

    return () => socket.disconnect();
  }, [roomCode]);

  useEffect(() => {
    if (!question || result) return;
    if (timeLeft <= 0) return;
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, question, result]);

  const handleAnswer = (selectedIndex) => {
    if (result || selectedOption !== null) return;
    setSelectedOption(selectedIndex);
    socketRef.current.emit('submit_answer', { roomCode, questionIndex, selectedIndex });
  };

  const getOptionStyle = (index) => {
    if (!result) {
      return { ...styles.option, ...(selectedOption === index ? styles.optionSelected : {}) };
    }
    if (index === result.correctAnswerIndex) return { ...styles.option, ...styles.optionCorrect };
    if (index === selectedOption && !result.isCorrect) return { ...styles.option, ...styles.optionWrong };
    return { ...styles.option, ...styles.optionDim };
  };

  if (!question) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingBox}>
          <div style={styles.spinner} />
          <p style={{ color: 'var(--text-muted)', marginTop: '12px', fontSize: '14px' }}>
            Loading game...
          </p>
        </div>
      </div>
    );
  }

  const timerPercent = (timeLeft / timeLimit) * 100;

  return (
    <div style={styles.page}>
      <div style={styles.layout}>
        {/* Quiz card */}
        <div style={styles.quizCard}>
          <div style={styles.quizHeader}>
            <span style={styles.progressText}>
              Question {questionIndex + 1} / {totalQuestions}
            </span>
            <div style={{
              ...styles.timerBadge,
              ...(timeLeft <= 5 ? styles.timerDanger : {}),
            }}>
              ⏱ {timeLeft}s
            </div>
            <span style={styles.scoreBadge}>Score: {score}</span>
          </div>

          <div style={styles.timerBarBg}>
            <div style={{
              ...styles.timerBarFill,
              width: `${timerPercent}%`,
              background: timeLeft <= 5 ? '#dc2626' : 'var(--green-primary)',
              transition: 'width 1s linear',
            }} />
          </div>

          <p style={styles.question}>{question.question}</p>

          <div style={styles.options}>
            {question.options.map((option, index) => (
              <button
                key={index}
                style={getOptionStyle(index)}
                onClick={() => handleAnswer(index)}
                disabled={!!result || selectedOption !== null}
              >
                <span style={styles.optionLabel}>{['A', 'B', 'C', 'D'][index]}</span>
                <span>{option}</span>
              </button>
            ))}
          </div>

          {result && (
            <div style={{
              ...styles.explanation,
              ...(result.isCorrect ? styles.explanationCorrect : styles.explanationWrong),
            }}>
              <strong>{result.isCorrect ? '✅ Correct!' : '❌ Wrong!'}</strong>
              <p style={{ marginTop: '6px', fontSize: '13px' }}>{result.explanation}</p>
              <p style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                Next question loading automatically...
              </p>
            </div>
          )}

          {!result && selectedOption !== null && (
            <div style={styles.waitingBox}>
              <div style={styles.spinner} />
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Answer submitted...
              </span>
            </div>
          )}
        </div>

        {/* Leaderboard sidebar */}
        {leaderboard.length > 0 && (
          <div style={styles.leaderboardCard}>
            <p style={styles.leaderboardTitle}>🏆 Leaderboard</p>
            {leaderboard.map((entry, index) => (
              <div key={entry.username} style={{
                ...styles.leaderboardRow,
                ...(entry.username === user.username ? styles.leaderboardSelf : {}),
              }}>
                <span style={styles.leaderboardRank}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                </span>
                <span style={styles.leaderboardName}>{entry.username}</span>
                <span style={styles.leaderboardScore}>{entry.score}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg-page)',
    padding: '24px',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  layout: {
    display: 'flex',
    gap: '20px',
    width: '100%',
    maxWidth: '900px',
    alignItems: 'flex-start',
    marginTop: '20px',
  },
  quizCard: {
    flex: 1,
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    padding: '32px',
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
    marginBottom: '12px',
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
  waitingBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px',
    background: 'var(--bg-page)',
    borderRadius: '8px',
    border: '1px solid var(--border)',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid var(--border)',
    borderTop: '2px solid var(--green-primary)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
  },
  leaderboardCard: {
    width: '200px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    padding: '20px',
    flexShrink: 0,
  },
  leaderboardTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '12px',
  },
  leaderboardRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 10px',
    borderRadius: '8px',
    marginBottom: '6px',
    background: 'var(--bg-page)',
  },
  leaderboardSelf: {
    background: 'var(--green-light)',
    border: '1px solid var(--green-primary)',
  },
  leaderboardRank: {
    fontSize: '14px',
    minWidth: '20px',
  },
  leaderboardName: {
    flex: 1,
    fontSize: '12px',
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  leaderboardScore: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--green-dark)',
  },
};

export default MultiplayerQuizPage;