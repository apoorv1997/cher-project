import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../lib/auth';
import { useMe } from '../hooks/useMe';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const token = auth.getAccess();
  const location = useLocation();
  const { data: me, isLoading } = useMe(!!token);

  if (!token  && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) return <div style={{ padding: 16 }}>Loading…</div>;

  return <>{children}</>;
};
