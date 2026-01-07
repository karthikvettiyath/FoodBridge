import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import DonorDashboard from './pages/DonorDashboard';
import NGODashboard from './pages/NGODashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { useContext } from 'react';
import './App.css';

// Role-based Dashboard Switcher
const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);

  if (user?.role === 'DONOR') {
    return <DonorDashboard />;
  }
  if (user?.role === 'NGO') {
    return <NGODashboard />;
  }
  if (user?.role === 'VOLUNTEER') {
    return <VolunteerDashboard />;
  }
  if (user?.role === 'ADMIN') {
    return <AdminDashboard />;
  }

  // Fallback for other roles (until we build them)
  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2rem 0', borderBottom: '1px solid var(--border)' }}>
        <h1 style={{ color: 'var(--primary)', fontSize: '1.5rem', marginBottom: 0 }}>FoodBridge</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>Welcome, <strong style={{ color: 'var(--secondary)' }}>{user?.name}</strong> ({user?.role})</span>
          <button onClick={logout} className="btn" style={{ backgroundColor: 'var(--surface-hover)', fontSize: '0.875rem', padding: '0.5rem 1rem' }}>Logout</button>
        </div>
      </header>
      <main style={{ padding: '3rem 0', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '3rem', maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Dashboard Coming Soon</h2>
          <p className="text-muted" style={{ fontSize: '1.1rem' }}>
            We are currently building the <strong>{user?.role}</strong> specific features.
            <br />
            Stay tuned for updates!
          </p>
        </div>
      </main>
    </div>
  );
};

// Protected Route Wrapper
const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="flex-center" style={{ height: '100vh' }}>Loading...</div>;

  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
