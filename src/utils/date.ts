
/**
 * Date formatting utilities
 * Provides consistent date formatting across the application
 */

type DateInput = string | number | Date;

/**
 * Format a date to a standard string format (e.g., "October 27, 2023")
 * Defaults to en-US locale
 */
export function formatDate(
  date: DateInput,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
): string {
  if (!date) return '-';
  try {
    const d = new Date(date);
    // Check if date is valid
    if (isNaN(d.getTime())) return String(date);
    return d.toLocaleDateString('en-US', options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return String(date);
  }
}

/**
 * Format a date to include time (e.g., "Oct 27, 2023, 10:30 AM")
 */
export function formatDateTime(
  date: DateInput,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
): string {
  if (!date) return '-';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);
    return d.toLocaleString('en-US', options);
  } catch (error) {
    return String(date);
  }
}

/**
 * Format a date relative to now (e.g., "2 hours ago", "Just now")
 */
export function formatRelativeTime(date: DateInput): string {
  if (!date) return '-';
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);
    
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffMonths < 12) return `${diffMonths} months ago`;
    
    return formatDate(d);
  } catch (error) {
    return String(date);
  }
}
