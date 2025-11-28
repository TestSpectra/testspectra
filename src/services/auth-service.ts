/**
 * Authentication Service
 * Manages user authentication, token storage, and session management
 */

import { getApiUrl } from '../lib/config';
import { logDebug } from '../lib/debug';

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

export interface LoginResponse {
  accessToken: string;
  user: User;
}

const TOKEN_KEY = 'testspectra_access_token';
const USER_KEY = 'testspectra_user';

export class AuthService {
  private static instance: AuthService;
  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Login user with email and password
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const apiUrl = await getApiUrl();
      logDebug(`AUTH login POST ${apiUrl}/auth/login`);
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        logDebug(`AUTH login failed with status ${response.status}`);
        throw new Error('Invalid credentials');
      }

      const data: LoginResponse = await response.json();
      logDebug('AUTH login success');

      this.setToken(data.accessToken);
      this.setUser(data.user);

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken() && !!this.getCurrentUser();
  }

  /**
   * Set token in localStorage
   */
  private setToken(accessToken: string): void {
    localStorage.setItem(TOKEN_KEY, accessToken);
  }

  /**
   * Set user in localStorage
   */
  private setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  /**
   * Update user data in localStorage
   */
  updateUserData(userData: Partial<User>): User {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error('No user logged in');
    }

    const updatedUser = { ...currentUser, ...userData };
    this.setUser(updatedUser);
    return updatedUser;
  }

  /**
   * Check if user has permission
   */
  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    return (
      user.basePermissions.includes(permission) ||
      user.specialPermissions.includes(permission)
    );
  }

  /**
   * Check if user has role
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    return user.role === role;
  }
}

export const authService = AuthService.getInstance();
