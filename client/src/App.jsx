import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import SoloQuizPage from './pages/SoloQuizPage';
import LobbyPage from './pages/LobbyPage';
import MultiplayerQuizPage from './pages/MultiplayerQuizPage';
import GameOverPage from './pages/GameOverPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/solo" element={
          <ProtectedRoute>
            <SoloQuizPage />
          </ProtectedRoute>
        } />
        <Route path="/room/lobby" element={
          <ProtectedRoute>
            <LobbyPage />
          </ProtectedRoute>
        } />
        <Route path="/multiplayer" element={
          <ProtectedRoute>
            <MultiplayerQuizPage />
          </ProtectedRoute>
        } />
        <Route path="/game-over" element={
          <ProtectedRoute>
            <GameOverPage />
          </ProtectedRoute>
        } />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;