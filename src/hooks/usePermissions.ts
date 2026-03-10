import { useCallback } from 'react';
import { ROLE_CONFIG, formatPermissionsApi, Role } from '../utils/permissions';
import { User } from '../services/auth-service';

/**
 * Hook for checking user permissions and role-based access control
 */
export function usePermissions(user: User | null | undefined) {
  // Get user's combined permissions (base permissions from role + special permissions)
  const getUserPermissions = useCallback(() => {
    if (!user) return [];
    
    const basePermissions = user.basePermissions;
    const specialPermissions = user.specialPermissions || [];
    
    // Convert display permissions to backend keys for comparison
    const allPermissions = [
      ...formatPermissionsApi(basePermissions),
      ...specialPermissions
    ];
    
    return [...new Set(allPermissions)]; // Remove duplicates
  }, [user]);

  /**
   * Check if user has a specific permission
   */
  const hasPermission = useCallback((permission: string) => {
    const userPermissions = getUserPermissions();
    return userPermissions.includes(permission);
  }, [getUserPermissions]);

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = useCallback((permissions: string[]) => {
    return permissions.some(permission => hasPermission(permission));
  }, [hasPermission]);

  /**
   * Check if user has all of the specified permissions
   */
  const hasAllPermissions = useCallback((permissions: string[]) => {
    return permissions.every(permission => hasPermission(permission));
  }, [hasPermission]);

  /**
   * Check if user has a specific role
   */
  const hasRole = useCallback((role: string) => {
    return user?.role === role;
  }, [user]);

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = useCallback((roles: string[]) => {
    return user?.role && roles.includes(user?.role);
  }, [user]);

  /**
   * Get role configuration for the current user
   */
  const getRoleConfig = useCallback(() => {
    if (!user) return null;
    return ROLE_CONFIG[user.role as Role] || null;
  }, [user]);

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    getRoleConfig,
    getUserPermissions,
  };
}
