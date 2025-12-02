/**
 * NotificationPanel Component
 * Displays list of notifications with pagination and actions
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Clock, X } from 'lucide-react';
import { notificationService, Notification } from '../services/notification-service';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';

interface NotificationPanelProps {
  onClose?: () => void;
  onUnreadCountChange?: (count: number) => void;
}

export function NotificationPanel({ onClose, onUnreadCountChange }: NotificationPanelProps) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 20;

  /**
   * Load notifications from API
   */
  const loadNotifications = async (pageNum: number = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await notificationService.getNotifications(pageNum, pageSize, false);
      setNotifications(response.notifications);
      setTotal(response.total);
      setUnreadCount(response.unreadCount);
      setPage(pageNum);
      
      // Notify parent of unread count change
      onUnreadCountChange?.(response.unreadCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Mark notification as read and navigate to related test case
   */
  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (!notification.isRead) {
        await notificationService.markAsRead(notification.id);
        // Update local state
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );
        const newUnreadCount = Math.max(0, unreadCount - 1);
        setUnreadCount(newUnreadCount);
        
        // Notify parent of unread count change
        onUnreadCountChange?.(newUnreadCount);
      }

      // Navigate to related test case if available
      if (notification.relatedEntityType === 'test_case' && notification.relatedEntityId) {
        navigate(`/test-cases/${notification.relatedEntityId}`);
        onClose?.();
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  /**
   * Mark all notifications as read
   */
  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      
      // Notify parent of unread count change
      onUnreadCountChange?.(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all as read');
    }
  };

  /**
   * Format timestamp for display
   */
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

  /**
   * Get notification icon based on type
   */
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'review_approved':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'review_needs_revision':
        return <Clock className="w-4 h-4 text-orange-500" />;
      default:
        return <Bell className="w-4 h-4 text-blue-500" />;
    }
  };

  /**
   * Load notifications on mount
   */
  useEffect(() => {
    loadNotifications(1);
  }, []);

  const hasMore = page * pageSize < total;
  const hasPrevious = page > 1;

  return (
    <Card className="w-full max-w-md bg-slate-900 border-slate-800">
      <CardHeader className="border-b border-slate-800">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-slate-100 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-slate-400 hover:text-slate-200"
              >
                <CheckCheck className="w-4 h-4 mr-1" />
                Mark all read
              </Button>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {error && (
          <div className="p-4 text-sm text-red-400 bg-red-500/10 border-b border-slate-800">
            {error}
          </div>
        )}

        <ScrollArea className="h-[500px]">
          {loading && notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No notifications yet</p>
              <p className="text-sm mt-1">You'll be notified about test case reviews</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full p-4 text-left transition-colors hover:bg-slate-800/50 ${
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
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(notification.createdAt)}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Pagination */}
        {total > pageSize && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadNotifications(page - 1)}
              disabled={!hasPrevious || loading}
              className="text-slate-300"
            >
              Previous
            </Button>
            <span className="text-sm text-slate-400">
              Page {page} of {Math.ceil(total / pageSize)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadNotifications(page + 1)}
              disabled={!hasMore || loading}
              className="text-slate-300"
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
