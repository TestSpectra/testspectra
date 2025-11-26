/**
 * Authentication Service
 * Manages user authentication, token storage, and session management
 */

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
  refreshToken: string;
  user: User;
}

const TOKEN_KEY = 'testspectra_access_token';
const REFRESH_TOKEN_KEY = 'testspectra_refresh_token';
const USER_KEY = 'testspectra_user';

export class AuthService {
  private static instance: AuthService;
  private apiUrl: string;

  private constructor() {
    this.apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  }

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
      const response = await fetch(`${this.apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data: LoginResponse = await response.json();
      
      this.setTokens(data.accessToken, data.refreshToken);
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
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
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
   * Refresh access token
   */
  async refreshAccessToken(): Promise<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${this.apiUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      this.setTokens(data.accessToken, data.refreshToken);
      
      return data.accessToken;
    } catch (error) {
      this.logout();
      throw error;
    }
  }

  /**
   * Set tokens in localStorage
   */
  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
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
