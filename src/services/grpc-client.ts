/**
 * gRPC Client for TestSpectra Backend Services
 * 
 * This client uses Tauri's HTTP client to communicate with gRPC services.
 * Since gRPC-web is not natively supported in browsers, we use Tauri's invoke
 * to make gRPC calls from the Rust backend.
 */

import { invoke } from '@tauri-apps/api/core';

const GRPC_SERVER_URL = 'http://localhost:50051';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  basePermissions: string[];
  specialPermissions: string[];
  joinedDate: string;
  lastActive: string;
  gitUsername?: string;
  gitEmail?: string;
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
}

export interface UpdateUserRequest {
  token: string;
  userId: string;
  name?: string;
  email?: string;
  password?: string;
  role?: string;
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
  private serverUrl: string;

  constructor(serverUrl: string = GRPC_SERVER_URL) {
    this.serverUrl = serverUrl;
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await invoke<LoginResponse>('grpc_login', {
        serverUrl: this.serverUrl,
        email,
        password,
      });
      return response;
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
      const response = await invoke<{ user: User }>('grpc_get_current_user', {
        serverUrl: this.serverUrl,
        token,
      });
      return response.user;
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
      const response = await invoke<ListUsersResponse>('grpc_list_users', {
        serverUrl: this.serverUrl,
        ...request,
      });
      return response;
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
      const response = await invoke<{ user: User }>('grpc_create_user', {
        serverUrl: this.serverUrl,
        ...request,
      });
      return response.user;
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
      const response = await invoke<{ user: User }>('grpc_update_user', {
        serverUrl: this.serverUrl,
        ...request,
      });
      return response.user;
    } catch (error) {
      console.error('Update user failed:', error);
      throw new Error('Failed to update user.');
    }
  }

  /**
   * Delete user
   */
  async deleteUser(token: string, userId: string): Promise<void> {
    try {
      await invoke('grpc_delete_user', {
        serverUrl: this.serverUrl,
        token,
        userId,
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
    status: 'active' | 'inactive'
  ): Promise<User> {
    try {
      const response = await invoke<{ user: User }>('grpc_update_user_status', {
        serverUrl: this.serverUrl,
        token,
        userId,
        status,
      });
      return response.user;
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
      const response = await invoke<{ user: User }>('grpc_grant_special_permissions', {
        serverUrl: this.serverUrl,
        token,
        userId,
        permissions,
      });
      return response.user;
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
      const response = await invoke<{ user: User }>('grpc_revoke_special_permissions', {
        serverUrl: this.serverUrl,
        token,
        userId,
        permissions,
      });
      return response.user;
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
      const response = await invoke<{ accessToken: string; refreshToken: string }>(
        'grpc_refresh_token',
        {
          serverUrl: this.serverUrl,
          refreshToken,
        }
      );
      return response;
    } catch (error) {
      console.error('Refresh token failed:', error);
      throw new Error('Failed to refresh token.');
    }
  }
}

// Export singleton instance
export const userServiceClient = new UserServiceClient();
