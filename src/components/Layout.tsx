import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Sidebar } from './Sidebar';
import { NotificationBadge } from './NotificationBadge';
import { useWebSocket } from '../contexts/WebSocketContext';
import { notificationService, Notification } from '../services/notification-service';
import { logDebug } from '../lib/debug';

interface LayoutProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
  currentUser: any;
  onCheckForUpdates?: () => void;
}

export function Layout({ currentView, onViewChange, onLogout, currentUser, onCheckForUpdates }: LayoutProps) {
  const { onMessage } = useWebSocket();
  const [unreadCount, setUnreadCount] = useState(0);

  /**
   * Load initial unread count
   */
  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const response = await notificationService.getNotifications(1, 1, false);
        setUnreadCount(response.unreadCount);
      } catch (error) {
        logDebug(`Failed to load unread count: ${error}`);
      }
    };

    loadUnreadCount();
  }, []);

  /**
   * Listen for WebSocket notification messages
   */
  useEffect(() => {
    const unsubscribe = onMessage((message) => {
      if (message.type === 'notification' && message.payload) {
        logDebug(`Received notification via WebSocket: ${JSON.stringify(message.payload)}`);

        const notification = message.payload as Notification;

        // Increment unread count
        setUnreadCount(prev => prev + 1);

        // Show toast notification
        toast(notification.title, {
          description: notification.message,
          duration: 5000,
          action: notification.relatedEntityId ? {
            label: 'View',
            onClick: () => {
              // Navigate to the related test case
              if (notification.relatedEntityType === 'test_case' && notification.relatedEntityId) {
                window.location.href = `/test-cases/${notification.relatedEntityId}`;
              }
            }
          } : undefined,
        });
      }
    });

    return unsubscribe;
  }, [onMessage]);

  return (
    <div className="flex flex-1 overflow-hidden bg-slate-950 text-slate-100">
      <Sidebar
        currentView={currentView}
        onViewChange={onViewChange}
        onLogout={onLogout}
        currentUser={currentUser}
        onCheckForUpdates={onCheckForUpdates}
      />
      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
