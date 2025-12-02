/**
 * WebSocket Context Provider
 * Provides WebSocket connection state and functionality throughout the app
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { websocketService, WebSocketMessage } from '../services/websocket-service';
import { authService } from '../services/auth-service';
import { logDebug } from '../lib/debug';

interface WebSocketContextValue {
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  onMessage: (callback: (message: WebSocketMessage) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextValue | undefined>(undefined);

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [isConnected, setIsConnected] = useState(false);

  /**
   * Connect to WebSocket using current auth token
   */
  const connect = useCallback(async () => {
    const token = authService.getAccessToken();
    if (!token) {
      logDebug('WebSocket connect: No auth token available');
      return;
    }

    try {
      await websocketService.connect(token);
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setIsConnected(false);
    }
  }, []);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    websocketService.disconnect();
    setIsConnected(false);
  }, []);

  /**
   * Register message callback
   */
  const onMessage = useCallback((callback: (message: WebSocketMessage) => void) => {
    return websocketService.onMessage(callback);
  }, []);

  /**
   * Auto-connect when user is authenticated
   */
  useEffect(() => {
    const isAuthenticated = authService.isAuthenticated();
    
    if (isAuthenticated && !isConnected) {
      logDebug('WebSocketProvider: Auto-connecting');
      connect();
    }

    // Cleanup on unmount
    return () => {
      if (isConnected) {
        logDebug('WebSocketProvider: Disconnecting on unmount');
        disconnect();
      }
    };
  }, []); // Only run on mount/unmount

  /**
   * Monitor connection state
   */
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const actuallyConnected = websocketService.isConnected();
      if (actuallyConnected !== isConnected) {
        setIsConnected(actuallyConnected);
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [isConnected]);

  const value: WebSocketContextValue = {
    isConnected,
    connect,
    disconnect,
    onMessage,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

/**
 * Hook to access WebSocket context
 */
export function useWebSocket(): WebSocketContextValue {
  const context = useContext(WebSocketContext);
  
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  
  return context;
}
