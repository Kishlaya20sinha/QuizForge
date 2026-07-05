import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GameOverPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const leaderboard = location.state?.leaderboard || [];

  const medalColors = {
    0: { bg: '#fefce8', border: '#fbbf24', text: '#92400e' },
    1: { bg: '#f8fafc', border: '#94a3b8', text: '#475569' },
    2: { bg: '#fff7ed', border: '#fb923c', text: '#9a3412' },
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.accent} />

        <div style={styles.trophy}>🏆</div>
        <h1 style={styles.title}>Game over!</h1>
        <p style={styles.subtitle}>Final leaderboard</p>

        <div style={styles.leaderboard}>
          {leaderboard.length === 0 && (
            <p style={styles.emptyText}>No scores recorded</p>
          )}
          {leaderboard.map((entry, index) => {
            const medal = medalColors[index];
            const isSelf = entry.username === user?.username;
            return (
              <div key={entry.username} style={{
                ...styles.row,
                ...(medal ? { background: medal.bg, border: `1px solid ${medal.border}` } : {}),
                ...(isSelf && !medal ? styles.rowSelf : {}),
              }}>
                <span style={styles.rank}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                </span>
                <span style={{
                  ...styles.name,
                  ...(medal ? { color: medal.text, fontWeight: '600' } : {}),
                }}>
                  {entry.username}
                  {isSelf && <span style={styles.youBadge}>you</span>}
                </span>
                <span style={{
                  ...styles.score,
                  ...(medal ? { color: medal.text } : {}),
                }}>
                  {entry.score} pts
                </span>
              </div>
            );
          })}
        </div>

        <button style={styles.primaryBtn} onClick={() => navigate('/dashboard')}>
          Back to dashboard
        </button>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg-page)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    padding: '40px',
    width: '100%',
    maxWidth: '460px',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  accent: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '4px',
    background: 'var(--green-primary)',
  },
  trophy: {
    fontSize: '52px',
    marginBottom: '12px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    marginBottom: '24px',
  },
  leaderboard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '24px',
    textAlign: 'left',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'var(--bg-page)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '12px 16px',
  },
  rowSelf: {
    background: 'var(--green-light)',
    border: '1px solid var(--green-primary)',
  },
  rank: {
    fontSize: '18px',
    minWidth: '28px',
  },
  name: {
    flex: 1,
    fontSize: '14px',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  youBadge: {
    background: 'var(--green-light)',
    color: 'var(--green-dark)',
    fontSize: '10px',
    padding: '1px 8px',
    borderRadius: '20px',
    border: '1px solid var(--green-primary)',
  },
  score: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text-secondary)',
  },
  emptyText: {
    color: 'var(--text-muted)',
    fontSize: '13px',
    padding: '20px',
    textAlign: 'center',
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
};

export default GameOverPage;