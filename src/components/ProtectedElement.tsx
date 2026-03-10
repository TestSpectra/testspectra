import { ReactNode } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { useUser } from '../contexts/UserContext';
import { User } from '../services/auth-service';

interface ProtectedElementProps {
  children: ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  requireAll?: boolean; // If true, require all permissions/roles; if false, require any
  fallback?: ReactNode; // What to show when user doesn't have access
}

/**
 * Component to protect individual UI elements based on user permissions and roles
 */
export function ProtectedElement({
  children,
  requiredPermissions,
  requiredRoles,
  requireAll = false,
  fallback = null,
}: ProtectedElementProps) {
  const { currentUser } = useUser();
  const { hasPermission, hasRole, hasAnyPermission, hasAllPermissions } = usePermissions(currentUser);

  // If user is not authenticated, show fallback
  if (!currentUser) {
    return <>{fallback}</>;
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
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
