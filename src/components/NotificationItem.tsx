/**
 * NotificationItem Component
 * Reusable notification item display
 * Used in NotificationPanel list and as popup toast
 */

import { Clock, CheckCircle, XCircle, Bell, RefreshCw } from 'lucide-react';
import { Notification } from '../services/notification-service';

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
  showTimestamp?: boolean;
  compact?: boolean;
}

export function NotificationItem({ 
  notification, 
  onClick, 
  showTimestamp = true,
  compact = false 
}: NotificationItemProps) {
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'review_approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'review_needs_revision':
        return <XCircle className="w-4 h-4 text-orange-500" />;
      case 'test_case_created':
        return <Bell className="w-4 h-4 text-blue-500" />;
      case 'test_case_revised':
        return <RefreshCw className="w-4 h-4 text-purple-500" />;
      default:
        return <Bell className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left transition-colors ${
        compact 
          ? 'p-3 hover:bg-slate-800/50' 
          : 'p-4 hover:bg-slate-800/50'
      } ${
        !notification.isRead ? 'bg-slate-800/30' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1 shrink-0">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className={`text-sm font-medium ${
              !notification.isRead ? 'text-slate-100' : 'text-slate-300'
            }`}>
              {notification.title}
            </h4>
            {!notification.isRead && (
              <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1" />
            )}
          </div>
          <p className="text-sm text-slate-400 mb-2">
            {notification.message}
          </p>
          {showTimestamp && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              {formatTimestamp(notification.createdAt)}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
