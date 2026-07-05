import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={styles.brand}>
          <div style={styles.logoIcon}>Q</div>
          <span style={styles.logoText}>QuizForge</span>
        </div>
        <h1 style={styles.tagline}>Forge your knowledge,<br />one quiz at a time.</h1>
        <p style={styles.taglineSub}>AI-generated quizzes on any topic. Play solo or challenge friends in real-time multiplayer rooms.</p>
        <div style={styles.features}>
          <div style={styles.featureItem}>
            <span style={styles.featureIcon}>🧠</span>
            <span>AI generates fresh questions instantly</span>
          </div>
          <div style={styles.featureItem}>
            <span style={styles.featureIcon}>⚡</span>
            <span>Real-time multiplayer with live leaderboards</span>
          </div>
          <div style={styles.featureItem}>
            <span style={styles.featureIcon}>📊</span>
            <span>Track your progress across topics</span>
          </div>
        </div>
      </div>

      <div style={styles.right}>
        <div style={styles.card}>
          <h2 style={styles.title}>Welcome back</h2>
          <p style={styles.subtitle}>Sign in to your account</p>

          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Email</label>
              <input
                style={styles.input}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Password</label>
              <input
                style={styles.input}
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button style={styles.btn} type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p style={styles.switchText}>
            Don't have an account?{' '}
            <Link to="/signup" style={styles.link}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    background: 'var(--bg-page)',
  },
  left: {
    flex: 1,
    background: '#1a1a2e',
    padding: '48px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '48px',
  },
  logoIcon: {
    width: '36px',
    height: '36px',
    background: 'var(--green-primary)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: '700',
    fontSize: '18px',
  },
  logoText: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#ffffff',
  },
  tagline: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: '1.3',
    marginBottom: '16px',
  },
  taglineSub: {
    fontSize: '15px',
    color: '#a8b2d8',
    lineHeight: '1.6',
    marginBottom: '40px',
    maxWidth: '400px',
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: '#a8b2d8',
    fontSize: '14px',
  },
  featureIcon: {
    fontSize: '20px',
    width: '28px',
  },
  right: {
    width: '480px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px',
  },
  card: {
    width: '100%',
    maxWidth: '380px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    marginBottom: '28px',
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
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '500',
    color: 'var(--text-secondary)',
  },
  input: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '10px 14px',
    color: 'var(--text-primary)',
    fontSize: '14px',
    outline: 'none',
  },
  btn: {
    background: 'var(--green-primary)',
    border: 'none',
    borderRadius: '8px',
    padding: '12px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    marginTop: '4px',
  },
  switchText: {
    textAlign: 'center',
    marginTop: '20px',
    color: 'var(--text-muted)',
    fontSize: '13px',
  },
  link: {
    color: 'var(--green-primary)',
    textDecoration: 'none',
    fontWeight: '500',
  },
};

export default LoginPage;