import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Layout from '../components/Layout';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'solo');
  const [stats, setStats] = useState({ totalPlayed: 0, bestScore: 0, uniqueTopics: 0 });

  const [soloTopic, setSoloTopic] = useState('');
  const [soloDifficulty, setSoloDifficulty] = useState('medium');
  const [soloCount, setSoloCount] = useState(5);
  const [soloLoading, setSoloLoading] = useState(false);
  const [soloError, setSoloError] = useState('');

  const [roomTopic, setRoomTopic] = useState('');
  const [roomDifficulty, setRoomDifficulty] = useState('medium');
  const [roomCount, setRoomCount] = useState(5);
  const [roomTime, setRoomTime] = useState(15);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');

  // URL change hone pe tab update karo
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  // Stats fetch karo
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/quiz/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Stats fetch error:', err);
      }
    };
    fetchStats();
  }, []);

  const handleSoloStart = async () => {
    if (!soloTopic.trim()) { setSoloError('Please enter a topic'); return; }
    setSoloLoading(true); setSoloError('');
    try {
      const res = await api.post('/quiz/solo/start', { topic: soloTopic, difficulty: soloDifficulty, count: soloCount });
      navigate('/solo', { state: { session: res.data } });
    } catch (err) {
      setSoloError(err.response?.data?.message || 'Failed to start quiz');
    } finally { setSoloLoading(false); }
  };

  const handleCreateRoom = async () => {
    if (!roomTopic.trim()) { setCreateError('Please enter a topic'); return; }
    setCreateLoading(true); setCreateError('');
    try {
      const res = await api.post('/room/create', { topic: roomTopic, difficulty: roomDifficulty, questionCount: roomCount, timePerQuestion: roomTime });
      navigate('/room/lobby', { state: { roomCode: res.data.roomCode, isHost: true } });
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create room');
    } finally { setCreateLoading(false); }
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) { setJoinError('Please enter a room code'); return; }
    setJoinLoading(true); setJoinError('');
    try {
      await api.post('/room/join', { roomCode: joinCode.toUpperCase() });
      navigate('/room/lobby', { state: { roomCode: joinCode.toUpperCase(), isHost: false } });
    } catch (err) {
      setJoinError(err.response?.data?.message || 'Failed to join room');
    } finally { setJoinLoading(false); }
  };

  return (
    <Layout>
      <div style={styles.pageHeader}>
        <h1 style={styles.greeting}>Good to see you, {user?.username} 👋</h1>
        <p style={styles.subtitle}>What would you like to forge today?</p>
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Quizzes played</div>
          <div style={styles.statValue}>{stats.totalPlayed}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Best score</div>
          <div style={styles.statValue}>{stats.bestScore}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Topics explored</div>
          <div style={styles.statValue}>{stats.uniqueTopics}</div>
        </div>
      </div>

      <div style={styles.tabs}>
        {['solo', 'create', 'join'].map((tab) => (
          <button
            key={tab}
            style={{ ...styles.tab, ...(activeTab === tab ? styles.tabActive : {}) }}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'solo' ? '🧠 Solo Quiz' : tab === 'create' ? '🎮 Create Room' : '🚪 Join Room'}
          </button>
        ))}
      </div>

      {activeTab === 'solo' && (
        <div style={styles.card}>
          <div style={styles.cardAccent} />
          <h2 style={styles.cardTitle}>Start a solo quiz</h2>
          <p style={styles.cardDesc}>AI generates fresh questions on any topic you choose</p>
          {soloError && <div style={styles.error}>{soloError}</div>}
          <label style={styles.label}>Topic</label>
          <input
            style={styles.input}
            type="text"
            placeholder="e.g. World War 2, Python, Cricket..."
            value={soloTopic}
            onChange={(e) => setSoloTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSoloStart()}
          />
          <div style={styles.row}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Difficulty</label>
              <select style={styles.select} value={soloDifficulty} onChange={(e) => setSoloDifficulty(e.target.value)}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Questions</label>
              <select style={styles.select} value={soloCount} onChange={(e) => setSoloCount(Number(e.target.value))}>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
              </select>
            </div>
          </div>
          <button style={styles.primaryBtn} onClick={handleSoloStart} disabled={soloLoading}>
            {soloLoading ? '⏳ Generating questions...' : '🚀 Start quiz'}
          </button>
        </div>
      )}

      {activeTab === 'create' && (
        <div style={styles.card}>
          <div style={{ ...styles.cardAccent, background: 'var(--purple-primary)' }} />
          <h2 style={styles.cardTitle}>Create a multiplayer room</h2>
          <p style={styles.cardDesc}>Host a live quiz for your friends</p>
          {createError && <div style={styles.error}>{createError}</div>}
          <label style={styles.label}>Topic</label>
          <input
            style={styles.input}
            type="text"
            placeholder="Enter a topic..."
            value={roomTopic}
            onChange={(e) => setRoomTopic(e.target.value)}
          />
          <div style={styles.row}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Difficulty</label>
              <select style={styles.select} value={roomDifficulty} onChange={(e) => setRoomDifficulty(e.target.value)}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Questions</label>
              <select style={styles.select} value={roomCount} onChange={(e) => setRoomCount(Number(e.target.value))}>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
              </select>
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Time / question</label>
              <select style={styles.select} value={roomTime} onChange={(e) => setRoomTime(Number(e.target.value))}>
                <option value={10}>10s</option>
                <option value={15}>15s</option>
                <option value={20}>20s</option>
                <option value={30}>30s</option>
              </select>
            </div>
          </div>
          <button style={{ ...styles.primaryBtn, background: 'var(--purple-primary)' }} onClick={handleCreateRoom} disabled={createLoading}>
            {createLoading ? '⏳ Creating room...' : '🎮 Create room'}
          </button>
        </div>
      )}

      {activeTab === 'join' && (
        <div style={styles.card}>
          <div style={{ ...styles.cardAccent, background: '#888780' }} />
          <h2 style={styles.cardTitle}>Join a room</h2>
          <p style={styles.cardDesc}>Enter the 6-character room code shared by the host</p>
          {joinError && <div style={styles.error}>{joinError}</div>}
          <label style={styles.label}>Room code</label>
          <input
            style={{ ...styles.input, textTransform: 'uppercase', letterSpacing: '8px', fontSize: '28px', textAlign: 'center', fontWeight: '600' }}
            type="text"
            placeholder="XXXXXX"
            maxLength={6}
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          />
          <button style={{ ...styles.primaryBtn, background: '#444441' }} onClick={handleJoinRoom} disabled={joinLoading}>
            {joinLoading ? '⏳ Joining...' : '🚪 Join room'}
          </button>
        </div>
      )}
    </Layout>
  );
};

const styles = {
  pageHeader: { marginBottom: '28px' },
  greeting: { fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' },
  subtitle: { fontSize: '14px', color: 'var(--text-muted)' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '28px' },
  statCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px 20px' },
  statLabel: { fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' },
  statValue: { fontSize: '28px', fontWeight: '600', color: 'var(--text-primary)' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '20px' },
  tab: { padding: '8px 20px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500', cursor: 'pointer' },
  tabActive: { background: 'var(--green-light)', border: '1px solid var(--green-primary)', color: 'var(--green-dark)' },
  card: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '28px', maxWidth: '600px', position: 'relative', overflow: 'hidden' },
  cardAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--green-primary)' },
  cardTitle: { fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' },
  cardDesc: { fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' },
  error: { background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', color: '#dc2626', fontSize: '13px' },
  label: { display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' },
  input: { width: '100%', background: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', marginBottom: '16px', boxSizing: 'border-box' },
  row: { display: 'flex', gap: '12px', marginBottom: '16px' },
  fieldGroup: { flex: 1, display: 'flex', flexDirection: 'column' },
  select: { background: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' },
  primaryBtn: { width: '100%', background: 'var(--green-primary)', border: 'none', borderRadius: '8px', padding: '12px', color: '#ffffff', fontSize: '14px', fontWeight: '500', cursor: 'pointer', marginTop: '4px' },
};

export default DashboardPage;