import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: '⊞' },
  { label: 'Solo quiz', path: '/dashboard?tab=solo', icon: '🧠' },
  { label: 'Multiplayer', path: '/dashboard?tab=create', icon: '🎮' },
];

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
const isActive = location.pathname + location.search === item.path ||
  (item.path === '/dashboard' && location.pathname === '/dashboard' && !location.search);
  const initials = user?.username?.charAt(0).toUpperCase() || 'U';

  return (
    <div style={styles.wrapper}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        {/* Logo */}
        <div style={styles.logoArea}>
          <div style={styles.logoIcon}>Q</div>
          <div>
            <div style={styles.logoText}>QuizForge</div>
            <div style={styles.logoSub}>AI Quiz Platform</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={styles.nav}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                style={{
                  ...styles.navItem,
                  ...(isActive ? styles.navItemActive : {}),
                }}
                onClick={() => navigate(item.path)}
              >
                <span style={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User info at bottom */}
        <div style={styles.userArea}>
          <div style={styles.divider} />
          <div style={styles.userInfo}>
            <div style={styles.avatar}>{initials}</div>
            <div>
              <div style={styles.username}>{user?.username}</div>
              <button style={styles.logoutBtn} onClick={handleLogout}>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main style={styles.main}>
        {children}
      </main>
    </div>
  );
};

const styles = {
  wrapper: {
    display: 'flex',
    minHeight: '100vh',
    background: 'var(--bg-page)',
  },
  sidebar: {
    width: 'var(--sidebar-width)',
    background: 'var(--bg-card)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    zIndex: 100,
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '20px 16px',
    borderBottom: '1px solid var(--border)',
  },
  logoIcon: {
    width: '32px',
    height: '32px',
    background: 'var(--green-primary)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontWeight: '600',
    fontSize: '16px',
    flexShrink: 0,
  },
  logoText: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  logoSub: {
    fontSize: '10px',
    color: 'var(--text-muted)',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '16px 12px',
    flex: 1,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: '13px',
    fontWeight: '400',
    textAlign: 'left',
    width: '100%',
    transition: 'all 0.15s',
  },
  navItemActive: {
    background: 'var(--green-light)',
    color: 'var(--green-dark)',
    fontWeight: '500',
  },
  navIcon: {
    fontSize: '16px',
    width: '20px',
    textAlign: 'center',
  },
  userArea: {
    padding: '12px',
  },
  divider: {
    height: '1px',
    background: 'var(--border)',
    marginBottom: '12px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'var(--green-light)',
    color: 'var(--green-dark)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: '600',
    flexShrink: 0,
  },
  username: {
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--text-primary)',
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '11px',
    padding: 0,
    cursor: 'pointer',
  },
  main: {
    marginLeft: 'var(--sidebar-width)',
    flex: 1,
    padding: '32px',
    minHeight: '100vh',
  },
};

export default Layout;