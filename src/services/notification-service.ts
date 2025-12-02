/**
 * Notification Service
 * Manages notification operations via backend API
 */

import { authService } from "./auth-service";
import { getApiUrl } from "../lib/config";

// Notification types
export type NotificationType = 'review_approved' | 'review_needs_revision' | 'test_case_created' | 'test_case_revised';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

class NotificationService {
  private static instance: NotificationService;
  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private getAuthHeaders(): HeadersInit {
    const token = authService.getAccessToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  /**
   * Get notifications for current user with pagination
   */
  async getNotifications(
    page: number = 1,
    pageSize: number = 20,
    unreadOnly: boolean = false
  ): Promise<NotificationListResponse> {
    const apiUrl = await getApiUrl();
    const queryParams = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      unreadOnly: unreadOnly.toString(),
    });

    const response = await fetch(`${apiUrl}/notifications?${queryParams}`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Failed to fetch notifications" }));
      throw new Error(error.error || "Failed to fetch notifications");
    }

    return response.json();
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const apiUrl = await getApiUrl();
    const response = await fetch(`${apiUrl}/notifications/${notificationId}/read`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Failed to mark notification as read" }));
      throw new Error(error.error || "Failed to mark notification as read");
    }
  }

  /**
   * Mark all notifications as read for current user
   */
  async markAllAsRead(): Promise<void> {
    const apiUrl = await getApiUrl();
    const response = await fetch(`${apiUrl}/notifications/mark-all-read`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Failed to mark all notifications as read" }));
      throw new Error(error.error || "Failed to mark all notifications as read");
    }
  }
}

export const notificationService = NotificationService.getInstance();
