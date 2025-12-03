/**
 * NotificationToast Component
 * Displays notification as a toast popup in top-right corner
 */

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Notification } from '../services/notification-service';
import { NotificationItem } from './NotificationItem';

interface NotificationToastProps {
  notification: Notification;
  index: number;
  onClose: () => void;
  onClick: () => void;
  duration?: number;
}

export function NotificationToast({ 
  notification,
  index,
  onClose, 
  onClick,
  duration = 5000 
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  
  // Calculate vertical position based on index
  // Each toast is ~120px tall with 8px gap
  const topPosition = 48 + (index * 128); // 48px (top-12) + index * (120px height + 8px gap)

  useEffect(() => {
    // Trigger enter animation
    setTimeout(() => setIsVisible(true), 10);

    // Auto close after duration
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  const handleClick = () => {
    onClick();
    handleClose();
  };

  return (
    <div
      style={{ 
        zIndex: 9999,
        top: `${topPosition}px`
      }}
      className={`
        fixed right-4 w-96
        transition-all duration-300 ease-out
        ${isVisible && !isLeaving 
          ? 'opacity-100 translate-x-0' 
          : 'opacity-0 translate-x-full'
        }
      `}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="relative">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 z-10 p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Notification content */}
          <NotificationItem
            notification={notification}
            onClick={handleClick}
            showUnreadIndicator={false}
            showTimestamp={true}
            compact={false}
          />
        </div>
      </div>
    </div>
  );
}
