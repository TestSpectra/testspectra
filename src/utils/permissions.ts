// Permission mapping from backend DB values to human-readable display text
export const PERMISSION_DISPLAY_MAP: Record<string, string> = {
  // Backend programmatic keys -> Frontend display text
  manage_users: 'Manage users and roles',
  manage_qa_team: 'Manage QA team members',
  full_test_case_access: 'Full access to all test cases',
  create_edit_test_cases: 'Create and edit test cases',
  execute_all_tests: 'Execute manual and automated tests',
  execute_automated_tests: 'Execute automated tests',
  record_test_results: 'Record test results',
  manage_configurations: 'Manage configurations',
  manage_test_configurations: 'Manage test configurations',
  review_approve_test_cases: 'Review and approve test cases',
  export_reports: 'Export reports',
  manage_integrations: 'Manage integrations (Git, Jira, etc)',
  view_all_data: 'View all data',
};

// Reverse mapping for API calls (display text -> backend keys)
export const PERMISSION_API_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(PERMISSION_DISPLAY_MAP).map(([key, value]) => [value, key])
);

/**
 * Convert backend permission keys to display text
 */
export function formatPermissionDisplay(permission: string): string {
  return PERMISSION_DISPLAY_MAP[permission] || permission;
}

/**
 * Convert display text to backend permission keys
 */
export function formatPermissionApi(displayText: string): string {
  return PERMISSION_API_MAP[displayText] || displayText;
}

/**
 * Convert array of backend permissions to display text
 */
export function formatPermissionsDisplay(permissions: string[]): string[] {
  return permissions.map(p => formatPermissionDisplay(p));
}

/**
 * Convert array of display permissions to backend keys
 */
export function formatPermissionsApi(displayPermissions: string[]): string[] {
  return displayPermissions.map(p => formatPermissionApi(p));
}

// Role configuration with display info and permissions
export const ROLE_CONFIG = {
  admin: {
    label: 'Admin',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    description: 'Full system access and user management',
    permissions: [
      'View all data',
      'Manage users and roles',
      'Full access to all test cases',
      'Execute manual and automated tests',
      'Manage configurations',
      'Export reports',
      'Manage integrations (Git, Jira, etc)',
    ],
  },
  qa_lead: {
    label: 'QA Lead',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    description: 'Lead QA team and manage test strategies',
    permissions: [
      'View all data',
      'Manage QA team members',
      'Full access to all test cases',
      'Execute manual and automated tests',
      'Manage test configurations',
      'Export reports',
    ],
  },
  qa_engineer: {
    label: 'QA Engineer',
    color: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    description: 'Create and execute test cases',
    permissions: [
      'View all data',
      'Create and edit test cases',
      'Execute manual and automated tests',
      'Record test results',
    ],
  },
  developer: {
    label: 'Developer',
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    description: 'Execute automated tests and manage configurations',
    permissions: [
      'View all data',
      'Execute automated tests',
    ],
  },
  product_manager: {
    label: 'Product Manager',
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    description: 'View test coverage and quality metrics',
    permissions: [
      'View all data',
      'Export reports',
    ],
  },
  ui_ux_designer: {
    label: 'UI/UX Designer',
    color: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    description: 'Generate test cases and view run history',
    permissions: [
      'View all data',
      'Full access to all test cases',
      'Export reports',
    ],
  },
  viewer: {
    label: 'Viewer',
    color: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    description: 'Read-only access to test information',
    permissions: [
      'View all data',
    ],
  },
};

export type Role = keyof typeof ROLE_CONFIG;
