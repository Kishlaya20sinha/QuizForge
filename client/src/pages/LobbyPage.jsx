import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

let socket;

const LobbyPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const roomCode = location.state?.roomCode;
  const isHost = location.state?.isHost;

  const [players, setPlayers] = useState([]);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!roomCode) { navigate('/dashboard'); return; }

    socket = io('http://localhost:5000');

    socket.on('connect', () => {
      socket.emit('join_room', {
        roomCode,
        userId: user.id,
        username: user.username,
      });
    });

    socket.on('players_updated', ({ players }) => {
      setPlayers(players);
    });

    socket.on('new_question', () => {
      navigate('/multiplayer', { state: { roomCode, isHost } });
    });

    socket.on('error_message', ({ message }) => {
      setError(message);
      setStarting(false);
    });

    return () => { socket.disconnect(); };
  }, [roomCode]);

  const handleStartGame = () => {
    setStarting(true);
    socket.emit('start_game', { roomCode });
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Top accent */}
        <div style={styles.accent} />

        {/* Logo */}
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>Q</div>
          <span style={styles.logoText}>QuizForge</span>
        </div>

        <h1 style={styles.title}>Waiting room</h1>
        <p style={styles.subtitle}>Share the code below with friends to join</p>

        {/* Room code */}
        <div style={styles.codeBox}>
          <p style={styles.codeLabel}>Room code</p>
          <p style={styles.code}>{roomCode}</p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {/* Players */}
        <div style={styles.playersSection}>
          <p style={styles.playersLabel}>Players joined ({players.length})</p>
          <div style={styles.playersList}>
            {players.length === 0 && (
              <p style={styles.emptyText}>Waiting for players...</p>
            )}
            {players.map((player, index) => (
              <div key={player.userId} style={styles.playerRow}>
                <div style={styles.playerAvatar}>
                  {player.username.charAt(0).toUpperCase()}
                </div>
                <span style={styles.playerName}>{player.username}</span>
                {index === 0 && <span style={styles.hostBadge}>Host</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        {isHost ? (
          <button
            style={{
              ...styles.primaryBtn,
              ...(starting ? styles.btnDisabled : {}),
            }}
            onClick={handleStartGame}
            disabled={starting || players.length < 1}
          >
            {starting ? '⏳ Starting...' : '🚀 Start game'}
          </button>
        ) : (
          <div style={styles.waitingBox}>
            <div style={styles.spinner} />
            <p style={styles.waitingText}>Waiting for host to start...</p>
          </div>
        )}

        <button style={styles.leaveBtn} onClick={() => navigate('/dashboard')}>
          Leave room
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
    padding: '36px',
    width: '100%',
    maxWidth: '460px',
    position: 'relative',
    overflow: 'hidden',
  },
  accent: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '4px',
    background: 'var(--green-primary)',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '20px',
  },
  logoIcon: {
    width: '28px',
    height: '28px',
    background: 'var(--green-primary)',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: '600',
    fontSize: '14px',
  },
  logoText: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  title: {
    fontSize: '22px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    marginBottom: '24px',
  },
  codeBox: {
    background: 'var(--bg-page)',
    border: '1.5px solid var(--green-primary)',
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center',
    marginBottom: '20px',
  },
  codeLabel: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    marginBottom: '8px',
  },
  code: {
    fontSize: '36px',
    fontWeight: '700',
    color: 'var(--green-primary)',
    letterSpacing: '10px',
  },
  error: {
    background: '#fef2f2',
    border: '1px solid #fca5a5',
    borderRadius: '8px',
    padding: '10px 14px',
    marginBottom: '16px',
    color: '#dc2626',
    fontSize: '13px',
  },
  playersSection: {
    marginBottom: '20px',
  },
  playersLabel: {
    fontSize: '12px',
    fontWeight: '500',
    color: 'var(--text-secondary)',
    marginBottom: '10px',
  },
  playersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  playerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'var(--bg-page)',
    borderRadius: '8px',
    padding: '10px 14px',
    border: '1px solid var(--border)',
  },
  playerAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'var(--green-light)',
    color: 'var(--green-dark)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600',
    flexShrink: 0,
  },
  playerName: {
    flex: 1,
    fontSize: '14px',
    color: 'var(--text-primary)',
  },
  hostBadge: {
    background: 'var(--green-light)',
    color: 'var(--green-dark)',
    fontSize: '11px',
    fontWeight: '500',
    padding: '2px 10px',
    borderRadius: '20px',
    border: '1px solid var(--green-primary)',
  },
  emptyText: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    textAlign: 'center',
    padding: '12px',
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
    marginBottom: '10px',
  },
  btnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  waitingBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '14px',
    marginBottom: '10px',
    background: 'var(--bg-page)',
    borderRadius: '8px',
    border: '1px solid var(--border)',
  },
  spinner: {
    width: '18px',
    height: '18px',
    border: '2px solid var(--border)',
    borderTop: '2px solid var(--green-primary)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  waitingText: {
    fontSize: '13px',
    color: 'var(--text-muted)',
  },
  leaveBtn: {
    width: '100%',
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '10px',
    color: 'var(--text-muted)',
    fontSize: '13px',
    cursor: 'pointer',
  },
};

export default LobbyPage;