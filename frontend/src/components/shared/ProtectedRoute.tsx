import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Spinner from '../ui/Spinner';

import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: string[];
}

/**
 * Protects a route by requiring authentication and optionally a set of roles.
 * If unauthenticated → redirect to /login
 * If lacks required role → redirect to /unauthorized (or dashboard)
 */
export default function ProtectedRoute({ children, roles = [] }: ProtectedRouteProps) {
  const { isAuthenticated, hasAnyRole, user } = useAuth();
  const location = useLocation();

  // Still resolving auth state
  if (user === undefined) {
    return <Spinner label="Đang xác thực..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles.length > 0 && !hasAnyRole(roles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
