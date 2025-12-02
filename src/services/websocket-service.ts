/**
 * WebSocket Service
 * Manages WebSocket connection for real-time notifications
 */

import { getApiUrl } from '../lib/config';
import { logDebug } from '../lib/debug';

export interface WebSocketMessage {
  type: 'notification' | 'ping' | 'pong';
  payload?: any;
}

type MessageCallback = (message: WebSocketMessage) => void;

export class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private messageCallbacks: MessageCallback[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private reconnectTimer: number | null = null;
  private isIntentionallyClosed = false;
  private pingInterval: number | null = null;

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * Connect to WebSocket server with JWT authentication
   */
  async connect(token: string): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      logDebug('WebSocket already connected');
      return;
    }

    this.token = token;
    this.isIntentionallyClosed = false;

    try {
      const apiUrl = await getApiUrl();
      // Convert HTTP(S) URL to WS(S) URL and add token as query parameter
      const wsUrl = apiUrl.replace(/^http/, 'ws') + '/ws?token=' + encodeURIComponent(token);
      
      logDebug(`WebSocket connecting to ${wsUrl.replace(/token=[^&]+/, 'token=***')}`);
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        logDebug('WebSocket connected');
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;

        // Start ping interval to keep connection alive
        this.startPingInterval();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          logDebug(`WebSocket message received: ${message.type}`);
          
          // Handle pong responses
          if (message.type === 'pong') {
            return;
          }

          // Notify all registered callbacks
          this.messageCallbacks.forEach(callback => {
            try {
              callback(message);
            } catch (error) {
              console.error('Error in WebSocket message callback:', error);
            }
          });
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = (event) => {
        logDebug(`WebSocket closed: code=${event.code}, reason=${event.reason}`);
        this.stopPingInterval();
        
        // Attempt reconnection if not intentionally closed
        if (!this.isIntentionallyClosed) {
          this.scheduleReconnect();
        }
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      throw error;
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.isIntentionallyClosed = true;
    this.stopPingInterval();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      logDebug('WebSocket disconnecting');
      this.ws.close();
      this.ws = null;
    }

    this.token = null;
    this.reconnectAttempts = 0;
  }

  /**
   * Register a callback for incoming messages
   */
  onMessage(callback: MessageCallback): () => void {
    this.messageCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.messageCallbacks.indexOf(callback);
      if (index > -1) {
        this.messageCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Send a message through WebSocket
   */
  send(message: WebSocketMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket is not connected, cannot send message');
      return;
    }

    try {
      this.ws.send(JSON.stringify(message));
      logDebug(`WebSocket message sent: ${message.type}`);
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    if (this.reconnectTimer) {
      return; // Already scheduled
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    logDebug(`WebSocket reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      if (this.token && !this.isIntentionallyClosed) {
        this.connect(this.token).catch(error => {
          console.error('Reconnection failed:', error);
        });
      }
    }, delay);
  }

  /**
   * Start sending periodic ping messages
   */
  private startPingInterval(): void {
    this.stopPingInterval();
    
    // Send ping every 30 seconds
    this.pingInterval = window.setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: 'ping' });
      }
    }, 30000);
  }

  /**
   * Stop sending ping messages
   */
  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}

export const websocketService = WebSocketService.getInstance();
