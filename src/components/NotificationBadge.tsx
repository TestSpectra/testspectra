/**
 * NotificationBadge Component
 * Displays unread notification count and toggles NotificationPanel
 */

import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Badge } from './ui/badge';
import { NotificationPanel } from './NotificationPanel';

interface NotificationBadgeProps {
  unreadCount: number;
  onUnreadCountChange?: (count: number) => void;
}

export function NotificationBadge({ unreadCount, onUnreadCountChange }: NotificationBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localUnreadCount, setLocalUnreadCount] = useState(unreadCount);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  /**
   * Sync local unread count with prop
   */
  useEffect(() => {
    setLocalUnreadCount(unreadCount);
  }, [unreadCount]);

  /**
   * Handle unread count changes from NotificationPanel
   */
  const handleUnreadCountChange = (count: number) => {
    setLocalUnreadCount(count);
    onUnreadCountChange?.(count);
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
          {localUnreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-xs"
            >
              {localUnreadCount > 99 ? '99+' : localUnreadCount}
            </Badge>
          )}
        </button>
      </div>

      {isOpen && (
        <div
          ref={panelRef}
          className="fixed z-50 shadow-2xl w-110"
          style={{
            top: `${panelPosition.top}px`,
            right: `${panelPosition.right}px`,
          }}
        >
          <NotificationPanel
            onClose={() => setIsOpen(false)}
            onUnreadCountChange={handleUnreadCountChange}
          />
        </div>
      )}
    </>
  );
}
