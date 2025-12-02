/**
 * NotificationBadge Component
 * Displays unread notification count and toggles NotificationPanel
 */

import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from './ui/button';
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
      
      // Check if click is outside the entire container (button + panel)
      if (containerRef.current && !containerRef.current.contains(target)) {
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

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggle}
        className="relative text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {localUnreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-xs"
          >
            {localUnreadCount > 99 ? '99+' : localUnreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 z-50 shadow-2xl w-110"
        >
          <NotificationPanel 
            onClose={() => setIsOpen(false)}
            onUnreadCountChange={handleUnreadCountChange}
          />
        </div>
      )}
    </div>
  );
}
