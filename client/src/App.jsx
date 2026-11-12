import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import AuditLogs from './pages/AuditLogs.jsx';
import Customers from './pages/Customers.jsx';
import Vehicles from './pages/Vehicles.jsx';
import Repairs from './pages/Repairs.jsx';
import Users from './pages/Users.jsx';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RequireRole({ roles, children }) {
  const { user } = useAuth();
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function FullScreen() {
  return <div className="grid min-h-screen place-items-center text-muted">Checking session…</div>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<Dashboard />} />
        <Route path="repairs" element={<Repairs />} />
        <Route path="vehicles" element={<Vehicles />} />
        <Route path="customers" element={<Customers />} />
        <Route path="users" element={<RequireRole roles={['admin']}><Users /></RequireRole>} />
        <Route path="audit" element={<RequireRole roles={['admin', 'manager']}><AuditLogs /></RequireRole>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
