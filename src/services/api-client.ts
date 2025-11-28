/**
 * API Client for TestSpectra Backend Services
 * 
 * This client communicates with the backend REST API.
 */

import { getApiUrl } from '../lib/config';
import { logDebug } from '../lib/debug';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  specialPermissions: string[];
  createdAt: string;
  updatedAt: string;
  joinedDate: string;
  lastActive: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface CreateUserRequest {
  token: string;
  name: string;
  email: string;
  password: string;
  role: string;
  specialPermissions?: string[];
}

export interface UpdateUserRequest {
  token: string;
  userId: string;
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  status?: string;
  specialPermissions?: string[];
}

export interface UpdateMyProfileRequest {
  token: string;
  name?: string;
}

export interface ListUsersRequest {
  token: string;
  roleFilter?: string;
  statusFilter?: string;
  page: number;
  pageSize: number;
}

export interface ListUsersResponse {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
}

// Role mappings
export const ROLES = {
  ADMIN: 'admin',
  QA_LEAD: 'qa_lead',
  QA_ENGINEER: 'qa_engineer',
  DEVELOPER: 'developer',
  PRODUCT_MANAGER: 'product_manager',
  UI_UX_DESIGNER: 'ui_ux_designer',
  VIEWER: 'viewer',
} as const;

// Permission mappings
export const PERMISSIONS = {
  MANAGE_USERS: 'manage_users',
  MANAGE_QA_TEAM: 'manage_qa_team',
  FULL_TEST_CASE_ACCESS: 'full_test_case_access',
  CREATE_EDIT_TEST_CASES: 'create_edit_test_cases',
  EXECUTE_ALL_TESTS: 'execute_all_tests',
  EXECUTE_AUTOMATED_TESTS: 'execute_automated_tests',
  RECORD_TEST_RESULTS: 'record_test_results',
  MANAGE_CONFIGURATIONS: 'manage_configurations',
  MANAGE_TEST_CONFIGURATIONS: 'manage_test_configurations',
  REVIEW_APPROVE_TEST_CASES: 'review_approve_test_cases',
  EXPORT_REPORTS: 'export_reports',
  MANAGE_INTEGRATIONS: 'manage_integrations',
} as const;

/**
 * User Service Client
 */
export class UserServiceClient {
  private apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.apiUrl}${endpoint}`;
    const method = options.method ?? 'GET';
    const startedAt = performance.now();

    logDebug(
      `HTTP ${method} ${url} - request` +
        (options.body ? ` body=${typeof options.body === 'string' ? options.body : '[non-string body]'}` : ''),
    );

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const durationMs = performance.now() - startedAt;
    logDebug(`HTTP ${method} ${url} - response status=${response.status} duration=${durationMs.toFixed(0)}ms`);

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: response.statusText ?? `HTTP ${response.status}` }));

      logDebug(`HTTP ${method} ${url} - error body=${JSON.stringify(error)}`);
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    logDebug(`HTTP ${method} ${url} - success`);
    return data;
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      return await this.request<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Login failed. Please check your credentials.');
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(token: string): Promise<User> {
    try {
      return await this.request<User>('/users/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Get current user failed:', error);
      throw new Error('Failed to get current user.');
    }
  }

  /**
   * List users with filters
   */
  async listUsers(request: ListUsersRequest): Promise<ListUsersResponse> {
    try {
      const { token, ...params } = request;
      const queryString = new URLSearchParams({
        page: params.page.toString(),
        pageSize: params.pageSize.toString(),
        ...(params.roleFilter && { roleFilter: params.roleFilter }),
        ...(params.statusFilter && { statusFilter: params.statusFilter }),
      }).toString();

      return await this.request<ListUsersResponse>(`/users?${queryString}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('List users failed:', error);
      throw new Error('Failed to list users.');
    }
  }

  /**
   * Create new user
   */
  async createUser(request: CreateUserRequest): Promise<User> {
    try {
      const { token, ...payload } = request;
      return await this.request<User>('/users', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Create user failed:', error);
      throw new Error('Failed to create user.');
    }
  }

  /**
   * Update user
   */
  async updateUser(request: UpdateUserRequest): Promise<User> {
    try {
      const { token, userId, ...payload } = request;
      return await this.request<User>(`/users/${userId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Update user failed:', error);
      throw new Error('Failed to update user.');
    }
  }

  /**
   * Update current user's profile (name only)
   */
  async updateMyProfile(request: UpdateMyProfileRequest): Promise<User> {
    try {
      const { token, ...payload } = request;
      return await this.request<User>(`/users/me/profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Update profile failed:', error);
      throw new Error('Failed to update profile.');
    }
  }

  /**
   * Delete user
   */
  async deleteUser(token: string, userId: string): Promise<void> {
    try {
      await this.request<void>(`/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Delete user failed:', error);
      throw new Error('Failed to delete user.');
    }
  }

  /**
   * Update user status
   */
  async updateUserStatus(
    token: string,
    userId: string,
    status: string
  ): Promise<User> {
    try {
      return await this.request<User>(`/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
    } catch (error) {
      console.error('Update user status failed:', error);
      throw new Error('Failed to update user status.');
    }
  }

  /**
   * Grant special permissions to user
   */
  async grantSpecialPermissions(
    token: string,
    userId: string,
    permissions: string[]
  ): Promise<User> {
    try {
      return await this.request<User>(`/users/${userId}/permissions/grant`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ permissions }),
      });
    } catch (error) {
      console.error('Grant special permissions failed:', error);
      throw new Error('Failed to grant special permissions.');
    }
  }

  /**
   * Revoke special permissions from user
   */
  async revokeSpecialPermissions(
    token: string,
    userId: string,
    permissions: string[]
  ): Promise<User> {
    try {
      return await this.request<User>(`/users/${userId}/permissions/revoke`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ permissions }),
      });
    } catch (error) {
      console.error('Revoke special permissions failed:', error);
      throw new Error('Failed to revoke special permissions.');
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      return await this.request<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    } catch (error) {
      console.error('Refresh token failed:', error);
      throw new Error('Failed to refresh token.');
    }
  }
}

// Cached singleton instance
let cachedClient: UserServiceClient | null = null;

/**
 * Get or create UserServiceClient instance with runtime API URL
 */
export async function getUserServiceClient(): Promise<UserServiceClient> {
  if (!cachedClient) {
    const apiUrl = await getApiUrl();
    cachedClient = new UserServiceClient(apiUrl);
  }
  return cachedClient;
}
