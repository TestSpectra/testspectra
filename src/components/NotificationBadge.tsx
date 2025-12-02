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
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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
   * Close panel when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        panelRef.current &&
        buttonRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  /**
   * Toggle panel visibility
   */
  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
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
          className="absolute right-0 top-full mt-2 z-50 shadow-2xl"
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
