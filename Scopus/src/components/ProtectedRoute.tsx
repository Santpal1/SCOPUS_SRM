import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredLevels?: number[]; // If not provided, just checks authentication
  fallback?: string; // Redirect path if access denied
}

/**
 * ProtectedRoute component for role-based access control
 * 
 * Access Levels:
 * 1 = Admin - Full access
 * 2 = Faculty - Full access to all faculty data
 * 3 = Faculty - Restricted access (own data only)
 * 
 * @example
 * // Admin only
 * <ProtectedRoute requiredLevels={[1]}>
 *   <AdminPage />
 * </ProtectedRoute>
 * 
 * @example
 * // Faculty only (both level 2 and 3)
 * <ProtectedRoute requiredLevels={[2, 3]}>
 *   <FacultyPage />
 * </ProtectedRoute>
 * 
 * @example
 * // Any authenticated user
 * <ProtectedRoute>
 *   <DashboardPage />
 * </ProtectedRoute>
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredLevels,
  fallback = '/login'
}) => {
  const { isAuthenticated, loading, user, hasAccess } = useAuth();

  // Show loading state
  if (loading) {
    return <div>Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={fallback} replace />;
  }

  // Check required access levels if specified
  if (requiredLevels && !hasAccess(requiredLevels)) {
    // Show unauthorized message or redirect to home
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>Your access level ({user?.accessLevel}) doesn't have permission to view this page.</p>
        <p>Required levels: {requiredLevels.join(', ')}</p>
        <a href="/">Go back to home</a>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
