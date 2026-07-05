import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('solo'); // 'solo' | 'create' | 'join'

  // Solo quiz state
  const [soloTopic, setSoloTopic] = useState('');
  const [soloDifficulty, setSoloDifficulty] = useState('medium');
  const [soloCount, setSoloCount] = useState(5);
  const [soloLoading, setSoloLoading] = useState(false);
  const [soloError, setSoloError] = useState('');

  // Create room state
  const [roomTopic, setRoomTopic] = useState('');
  const [roomDifficulty, setRoomDifficulty] = useState('medium');
  const [roomCount, setRoomCount] = useState(5);
  const [roomTime, setRoomTime] = useState(15);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Join room state
  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');

  const handleSoloStart = async () => {
    if (!soloTopic.trim()) {
      setSoloError('Please enter a topic');
      return;
    }
    setSoloLoading(true);
    setSoloError('');
    try {
      const res = await api.post('/quiz/solo/start', {
        topic: soloTopic,
        difficulty: soloDifficulty,
        count: soloCount,
      });
      navigate('/solo', { state: { session: res.data } });
    } catch (err) {
      setSoloError(err.response?.data?.message || 'Failed to start quiz');
    } finally {
      setSoloLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!roomTopic.trim()) {
      setCreateError('Please enter a topic');
      return;
    }
    setCreateLoading(true);
    setCreateError('');
    try {
      const res = await api.post('/room/create', {
        topic: roomTopic,
        difficulty: roomDifficulty,
        questionCount: roomCount,
        timePerQuestion: roomTime,
      });
      navigate('/room/lobby', { state: { roomCode: res.data.roomCode, isHost: true } });
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create room');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) {
      setJoinError('Please enter a room code');
      return;
    }
    setJoinLoading(true);
    setJoinError('');
    try {
      await api.post('/room/join', { roomCode: joinCode.toUpperCase() });
      navigate('/room/lobby', { state: { roomCode: joinCode.toUpperCase(), isHost: false } });
    } catch (err) {
      setJoinError(err.response?.data?.message || 'Failed to join room');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.logo}>⚡ QuizForge</h1>
        <div style={styles.userInfo}>
          <span style={styles.username}>👤 {user?.username}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Main content */}
      <div style={styles.content}>
        <h2 style={styles.welcome}>Welcome back, {user?.username}! 🎯</h2>
        <p style={styles.subtitle}>What would you like to do today?</p>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(activeTab === 'solo' ? styles.activeTab : {}) }}
            onClick={() => setActiveTab('solo')}
          >
            🧠 Solo Quiz
          </button>
          <button
            style={{ ...styles.tab, ...(activeTab === 'create' ? styles.activeTab : {}) }}
            onClick={() => setActiveTab('create')}
          >
            🎮 Create Room
          </button>
          <button
            style={{ ...styles.tab, ...(activeTab === 'join' ? styles.activeTab : {}) }}
            onClick={() => setActiveTab('join')}
          >
            🚪 Join Room
          </button>
        </div>

        {/* Solo Quiz Tab */}
        {activeTab === 'solo' && (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Start a Solo Quiz</h3>
            <p style={styles.cardDesc}>AI will generate fresh questions on any topic you choose</p>

            {soloError && <div style={styles.error}>{soloError}</div>}

            <input
              style={styles.input}
              type="text"
              placeholder="Enter a topic (e.g. World War 2, Python, Cricket...)"
              value={soloTopic}
              onChange={(e) => setSoloTopic(e.target.value)}
            />

            <div style={styles.row}>
              <div style={styles.selectGroup}>
                <label style={styles.label}>Difficulty</label>
                <select
                  style={styles.select}
                  value={soloDifficulty}
                  onChange={(e) => setSoloDifficulty(e.target.value)}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div style={styles.selectGroup}>
                <label style={styles.label}>Questions</label>
                <select
                  style={styles.select}
                  value={soloCount}
                  onChange={(e) => setSoloCount(Number(e.target.value))}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                </select>
              </div>
            </div>

            <button
              style={styles.primaryBtn}
              onClick={handleSoloStart}
              disabled={soloLoading}
            >
              {soloLoading ? '⏳ Generating questions...' : '🚀 Start Solo Quiz'}
            </button>
          </div>
        )}

        {/* Create Room Tab */}
        {activeTab === 'create' && (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Create a Multiplayer Room</h3>
            <p style={styles.cardDesc}>Host a live quiz for your friends</p>

            {createError && <div style={styles.error}>{createError}</div>}

            <input
              style={styles.input}
              type="text"
              placeholder="Enter a topic..."
              value={roomTopic}
              onChange={(e) => setRoomTopic(e.target.value)}
            />

            <div style={styles.row}>
              <div style={styles.selectGroup}>
                <label style={styles.label}>Difficulty</label>
                <select
                  style={styles.select}
                  value={roomDifficulty}
                  onChange={(e) => setRoomDifficulty(e.target.value)}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div style={styles.selectGroup}>
                <label style={styles.label}>Questions</label>
                <select
                  style={styles.select}
                  value={roomCount}
                  onChange={(e) => setRoomCount(Number(e.target.value))}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                </select>
              </div>
              <div style={styles.selectGroup}>
                <label style={styles.label}>Time/Question</label>
                <select
                  style={styles.select}
                  value={roomTime}
                  onChange={(e) => setRoomTime(Number(e.target.value))}
                >
                  <option value={10}>10s</option>
                  <option value={15}>15s</option>
                  <option value={20}>20s</option>
                  <option value={30}>30s</option>
                </select>
              </div>
            </div>

            <button
              style={styles.primaryBtn}
              onClick={handleCreateRoom}
              disabled={createLoading}
            >
              {createLoading ? '⏳ Creating room...' : '🎮 Create Room'}
            </button>
          </div>
        )}

        {/* Join Room Tab */}
        {activeTab === 'join' && (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Join a Room</h3>
            <p style={styles.cardDesc}>Enter the 6-character room code to join</p>

            {joinError && <div style={styles.error}>{joinError}</div>}

            <input
              style={{ ...styles.input, textTransform: 'uppercase', letterSpacing: '4px', fontSize: '24px', textAlign: 'center' }}
              type="text"
              placeholder="XXXXXX"
              maxLength={6}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            />

            <button
              style={styles.primaryBtn}
              onClick={handleJoinRoom}
              disabled={joinLoading}
            >
              {joinLoading ? '⏳ Joining...' : '🚪 Join Room'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 32px',
    background: '#16213e',
    boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
  },
  logo: {
    fontSize: '24px',
    color: '#e94560',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  username: {
    color: '#a8b2d8',
    fontSize: '14px',
  },
  logoutBtn: {
    background: 'transparent',
    border: '1px solid #e94560',
    borderRadius: '8px',
    padding: '6px 16px',
    color: '#e94560',
    cursor: 'pointer',
    fontSize: '14px',
  },
  content: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  welcome: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#ffffff',
  },
  subtitle: {
    color: '#a8b2d8',
    marginBottom: '32px',
    fontSize: '16px',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
  },
  tab: {
    flex: 1,
    padding: '12px',
    background: '#16213e',
    border: '1px solid #2a2a4a',
    borderRadius: '8px',
    color: '#a8b2d8',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  activeTab: {
    background: '#e94560',
    border: '1px solid #e94560',
    color: '#ffffff',
  },
  card: {
    background: '#16213e',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#ffffff',
  },
  cardDesc: {
    color: '#a8b2d8',
    marginBottom: '24px',
    fontSize: '14px',
  },
  error: {
    background: '#ff000022',
    border: '1px solid #ff4444',
    borderRadius: '8px',
    padding: '10px',
    marginBottom: '16px',
    color: '#ff4444',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    background: '#0f0f1a',
    border: '1px solid #2a2a4a',
    borderRadius: '8px',
    padding: '12px 16px',
    color: '#ffffff',
    fontSize: '16px',
    outline: 'none',
    marginBottom: '16px',
    boxSizing: 'border-box',
  },
  row: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
  },
  selectGroup: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    color: '#a8b2d8',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  select: {
    background: '#0f0f1a',
    border: '1px solid #2a2a4a',
    borderRadius: '8px',
    padding: '10px',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none',
  },
  primaryBtn: {
    width: '100%',
    background: 'linear-gradient(135deg, #e94560, #c23152)',
    border: 'none',
    borderRadius: '8px',
    padding: '14px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '8px',
  },
};

export default DashboardPage;