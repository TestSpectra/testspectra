/**
 * NotificationBadge Component
 * Displays unread notification count and toggles NotificationPanel
 * Fetches notification count internally and listens to WebSocket for real-time updates
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { NotificationPanel } from './NotificationPanel';
import { NotificationToast } from './NotificationToast';
import { notificationService, Notification } from '../services/notification-service';
import { websocketService, WebSocketMessage } from '../services/websocket-service';
import { navigateToNotification } from '../lib/notification-navigation';

interface NotificationBadgeProps {
  userId?: string;
}

interface ToastNotification extends Notification {
  toastId: string;
}

export function NotificationBadge({ userId }: NotificationBadgeProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastNotifications, setToastNotifications] = useState<ToastNotification[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  /**
   * Fetch initial unread count
   * Refetch when userId changes (user login/logout/switch)
   */
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await notificationService.getNotifications(1, 1, false);
        setUnreadCount(response.unreadCount);
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
        // Reset count on error (e.g., user logged out)
        setUnreadCount(0);
      }
    };

    if (userId) {
      fetchUnreadCount();
    } else {
      // Reset count when no user
      setUnreadCount(0);
    }
  }, [userId]);

  /**
   * Listen to WebSocket for new notifications
   */
  useEffect(() => {
    const handleWebSocketMessage = (message: WebSocketMessage) => {
      if (message.type === 'notification' && message.payload) {
        const notification = message.payload as Notification;

        // Increment unread count when new notification arrives
        setUnreadCount(prev => prev + 1);

        // Add toast notification to stack (prepend to show newest first)
        const toastNotification: ToastNotification = {
          ...notification,
          toastId: `${notification.id}-${Date.now()}`, // Unique ID for toast
        };

        setToastNotifications(prev => [toastNotification, ...prev]);
      }
    };

    const unsubscribe = websocketService.onMessage(handleWebSocketMessage);

    return () => {
      unsubscribe();
    };
  }, []);

  /**
   * Remove toast from stack
   */
  const removeToast = (toastId: string) => {
    setToastNotifications(prev => prev.filter(t => t.toastId !== toastId));
  };

  /**
   * Handle unread count changes from NotificationPanel
   */
  const handleUnreadCountChange = (count: number) => {
    setUnreadCount(count);
  };

  /**
   * Close panel when clicking outside or pressing Escape
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Check if click is outside both the button and the panel
      const isOutsideButton = containerRef.current && !containerRef.current.contains(target);
      const isOutsidePanel = panelRef.current && !panelRef.current.contains(target);

      if (isOutsideButton && isOutsidePanel) {
        setIsOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    // Add a small delay to prevent immediate closing when opening
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  /**
   * Toggle panel visibility
   */
  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  /**
   * Calculate panel position based on button position
   */
  const [panelPosition, setPanelPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPanelPosition({
        top: rect.bottom + 8, // 8px gap below button
        right: window.innerWidth - rect.right, // Align right edge with button
      });
    }
  }, [isOpen]);

  return (
    <>
      <div ref={containerRef} className="relative">
        <button
          onClick={handleToggle}
          className="relative p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
        </button>
      </div>

      <div
        ref={panelRef}
        className={`fixed rounded-2xl shadow-2xl w-110 ${isOpen ? "visible z-50" : "invisible -z-1"}`}
        style={{
          top: `${panelPosition.top}px`,
          right: `${panelPosition.right}px`,
        }}
      >
        <NotificationPanel
          key={userId} // Force re-render when user changes
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onUnreadCountChange={handleUnreadCountChange}
        />
      </div>

      {/* Toast notification popups - stacked */}
      {toastNotifications.map((toast, index) => (
        <NotificationToast
          key={toast.toastId}
          notification={toast}
          index={index}
          onClose={() => removeToast(toast.toastId)}
          onClick={() => {
            navigateToNotification({
              type: toast.type,
              relatedEntityType: toast.relatedEntityType,
              relatedEntityId: toast.relatedEntityId,
            }, navigate);
            removeToast(toast.toastId);
          }}
        />
      ))}
    </>
  );
}
