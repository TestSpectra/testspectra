/**
 * NotificationPanel Component
 * Displays list of notifications with pagination and actions
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { notificationService, Notification } from '../services/notification-service';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { navigateToNotification } from '../lib/notification-navigation';
import { NotificationItem } from './NotificationItem';

interface NotificationPanelProps {
  onClose?: () => void;
  onUnreadCountChange?: (count: number) => void;
  isOpen?: boolean;
  style?: any;
}

export function NotificationPanel({ onClose, onUnreadCountChange, isOpen = true }: NotificationPanelProps) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
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

      // Navigate using utility function
      navigateToNotification({
        type: notification.type,
        relatedEntityType: notification.relatedEntityType,
        relatedEntityId: notification.relatedEntityId,
      }, navigate);

      onClose?.();
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
   * Load notifications on mount
   */
  useEffect(() => {
    loadNotifications(1);
  }, [isOpen]);

  /**
   * Handle animation state
   */
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  const hasMore = page * pageSize < total;
  const hasPrevious = page > 1;

  return (
    <div
      className={`
        w-full
        transition-all duration-300 ease-in-out
        ${isOpen && isAnimating ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'}
      `}
    >
      <Card className="w-full gap-0! bg-slate-900 border-slate-800">
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
                  className="text-slate-400 hover:text-slate-200 hover:bg-slate-950/60 cursor-pointer"
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
                  className="text-slate-400 hover:text-slate-200 hover:bg-slate-950/60 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 pb-0!">
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
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    showTimestamp={true}
                  />
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Pagination */}
          {total > pageSize && (
            <div className="p-3 border-t border-slate-800 flex items-center justify-center gap-2">
              <button
                onClick={() => loadNotifications(page - 1)}
                disabled={!hasPrevious || loading}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs text-slate-500 min-w-[80px] text-center">
                {page} / {Math.ceil(total / pageSize)}
              </span>

              <button
                onClick={() => loadNotifications(page + 1)}
                disabled={!hasMore || loading}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
