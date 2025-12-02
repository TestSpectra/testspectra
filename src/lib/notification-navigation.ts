/**
 * Notification Navigation Utility
 * Handles navigation based on notification type and related entity
 */

import { NotificationType } from '../services/notification-service';

export interface NavigationParams {
  type: NotificationType;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

/**
 * Get navigation path based on notification type
 */
export function getNotificationNavigationPath(params: NavigationParams): string | null {
  const { type, relatedEntityType, relatedEntityId } = params;

  if (relatedEntityType !== 'test_case' || !relatedEntityId) {
    return null;
  }

  switch (type) {
    case 'test_case_created':
      // New test case → go to review page
      return `/review-queue/review/${relatedEntityId}`;
    
    case 'test_case_revised':
      // Revised test case → go to re-review page
      return `/review-queue/re-review/${relatedEntityId}`;
    
    case 'review_needs_revision':
      // Needs revision → go to test case detail
      return `/test-cases/${relatedEntityId}`;
    
    case 'review_approved':
      // Approved → go to test case detail
      return `/test-cases/${relatedEntityId}`;
    
    default:
      return null;
  }
}

/**
 * Navigate to notification target
 * Can be used with window.location.href or react-router navigate
 */
export function navigateToNotification(
  params: NavigationParams,
  navigate?: (path: string) => void
): void {
  const path = getNotificationNavigationPath(params);
  
  if (!path) {
    return;
  }

  if (navigate) {
    // Use react-router navigate if provided
    navigate(path);
  } else {
    // Fallback to window.location
    window.location.href = path;
  }
}
