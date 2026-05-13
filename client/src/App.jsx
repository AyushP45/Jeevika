import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import WorkerDashboard from './pages/WorkerDashboard';
import EmployerDashboard from './pages/EmployerDashboard';
import AdminPanel from './pages/AdminPanel';
import Wallet from './pages/Wallet';
import JobDetail from './pages/JobDetail';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  const getDashboardRedirect = () => {
    if (!user) return '/login';
    if (user.role === 'worker') return '/worker';
    if (user.role === 'employer') return '/employer';
    if (user.role === 'admin') return '/admin';
    return '/';
  };

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={user ? <Navigate to={getDashboardRedirect()} /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={getDashboardRedirect()} /> : <Register />} />
      <Route path="/dashboard" element={<Navigate to={getDashboardRedirect()} />} />
      <Route path="/worker" element={<ProtectedRoute roles={['worker']}><WorkerDashboard /></ProtectedRoute>} />
      <Route path="/employer" element={<ProtectedRoute roles={['employer']}><EmployerDashboard /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminPanel /></ProtectedRoute>} />
      <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
      <Route path="/jobs/:id" element={<ProtectedRoute><JobDetail /></ProtectedRoute>} />
    </Routes>
  );
}
