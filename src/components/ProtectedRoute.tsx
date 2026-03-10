import { Navigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { usePermissions } from '../hooks/usePermissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  requireAll?: boolean; // If true, require all permissions/roles; if false, require any
  fallbackPath?: string;
}

/**
 * Component to protect routes based on user permissions and roles
 */
export function ProtectedRoute({
  children,
  requiredPermissions,
  requiredRoles,
  requireAll = false,
  fallbackPath = '/login',
}: ProtectedRouteProps) {
  const { currentUser } = useUser();
  const { hasPermission, hasRole, hasAnyPermission, hasAllPermissions, hasAnyRole } = usePermissions(currentUser);

  // If user is not authenticated, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Check role permissions
  let hasRoleAccess = true;
  if (requiredRoles?.length && requiredRoles.length > 0) {
    if (requireAll) {
      hasRoleAccess = requiredRoles.every(role => currentUser?.role === role);
    } else {
      hasRoleAccess = requiredRoles.includes(currentUser?.role || '');
    }
  }

  // Check permission permissions
  let hasPermissionAccess = true;
  if (requiredPermissions?.length && requiredPermissions.length > 0) {
    if (requireAll) {
      hasPermissionAccess = hasAllPermissions(requiredPermissions);
    } else {
      hasPermissionAccess = hasAnyPermission(requiredPermissions);
    }
  }

  // Grant access if both role and permission checks pass
  const hasAccess = hasRoleAccess && hasPermissionAccess;

  if (!hasAccess) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}
