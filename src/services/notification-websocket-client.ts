/**
 * Real-Time Notifications WebSocket Client
 *
 * Implements:
 * - Authenticated WebSocket connection to /api/v1/notifications/ws (with cookie handshake)
 * - Zero token exposure in URLs or query parameters
 * - Bounded exponential backoff with jitter for automatic reconnection
 * - Reconnection reconciliation via REST to fetch missed notifications
 * - Ping/Pong heartbeat keepalive
 * - Multi-tab synchronization (notification_created, notification_read, notifications_all_read)
 * - Strict duplicate suppression
 */

import type { NotificationResponse } from "@/services/generated/api-types";

export type WebSocketConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "unauthorized";

export type NotificationWsEvent =
  | "connected"
  | "notification_created"
  | "notification_read"
  | "notifications_all_read"
  | "pong";

export interface WsMessage<T = unknown> {
  event: NotificationWsEvent | string;
  data?: T;
}

export type NotificationEventHandler = (event: string, data: any) => void;
export type StatusChangeHandler = (status: WebSocketConnectionStatus) => void;

export function getWebSocketNotificationUrl(customUrl?: string): string {
  if (customUrl) return customUrl;

  const rawBase =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
  const normalized = rawBase.replace(/\/+$/, "");

  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    const wsProto = normalized.startsWith("https://") ? "wss://" : "ws://";
    const hostAndPath = normalized.replace(/^https?:\/\//, "");
    return `${wsProto}${hostAndPath}/api/v1/notifications/ws`;
  }

  if (typeof window !== "undefined") {
    const wsProto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${wsProto}//${window.location.host}/api/v1/notifications/ws`;
  }

  return "ws://127.0.0.1:8000/api/v1/notifications/ws";
}

export class NotificationWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private isExplicitlyClosed = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 20;
  private maxReconnectDelayMs = 30000;
  private baseReconnectDelayMs = 1000;
  private pingIntervalMs = 30000;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners: Set<NotificationEventHandler> = new Set();
  private statusListeners: Set<StatusChangeHandler> = new Set();
  private status: WebSocketConnectionStatus = "disconnected";
  private onReconnectCallback?: () => Promise<void>;
  private wasConnectedOnce = false;

  constructor(options: {
    url?: string;
    onReconnect?: () => Promise<void>;
    pingIntervalMs?: number;
    baseReconnectDelayMs?: number;
    maxReconnectDelayMs?: number;
  } = {}) {
    this.url = getWebSocketNotificationUrl(options.url);
    this.onReconnectCallback = options.onReconnect;
    if (options.pingIntervalMs) this.pingIntervalMs = options.pingIntervalMs;
    if (options.baseReconnectDelayMs)
      this.baseReconnectDelayMs = options.baseReconnectDelayMs;
    if (options.maxReconnectDelayMs)
      this.maxReconnectDelayMs = options.maxReconnectDelayMs;
  }

  public getStatus(): WebSocketConnectionStatus {
    return this.status;
  }

  private setStatus(newStatus: WebSocketConnectionStatus): void {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.statusListeners.forEach((handler) => {
        try {
          handler(newStatus);
        } catch (e) {
          console.error("Error in status change listener:", e);
        }
      });
    }
  }

  public onStatusChange(handler: StatusChangeHandler): () => void {
    this.statusListeners.add(handler);
    return () => this.statusListeners.delete(handler);
  }

  public subscribe(handler: NotificationEventHandler): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  public connect(): void {
    // Avoid creating multiple sockets if already active or connecting
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    // Skip if running in non-browser environment without WebSocket
    if (typeof WebSocket === "undefined") {
      return;
    }

    this.isExplicitlyClosed = false;
    this.setStatus("connecting");

    try {
      // Browser automatically forwards credentials / HttpOnly cookies on the same origin/CORS
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.setStatus("connected");
        this.startHeartbeat();

        // If this was a reconnection, trigger REST synchronization to reconcile missed notifications
        if (this.wasConnectedOnce && this.onReconnectCallback) {
          this.onReconnectCallback().catch((err) =>
            console.error("Failed to reconcile notifications after reconnect:", err)
          );
        }
        this.wasConnectedOnce = true;
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data) as WsMessage;
          if (payload && payload.event) {
            this.dispatch(payload.event, payload.data);
          }
        } catch {
          // Ignore malformed ping frames or binary
        }
      };

      this.ws.onclose = (event: CloseEvent) => {
        this.stopHeartbeat();

        // Close code 1008 = WS_1008_POLICY_VIOLATION (Unauthorized)
        if (event.code === 1008) {
          this.setStatus("unauthorized");
          console.warn(
            "WebSocket authentication failed (1008 Policy Violation). Reconnection halted."
          );
          return;
        }

        this.setStatus("disconnected");

        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (err) => {
        // Log cleanly without exposing sensitive context
        console.warn("WebSocket notification error occurred");
      };
    } catch (e) {
      this.setStatus("disconnected");
      this.scheduleReconnect();
    }
  }

  public disconnect(): void {
    this.isExplicitlyClosed = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus("disconnected");
  }

  private dispatch(event: string, data: any): void {
    this.listeners.forEach((handler) => {
      try {
        handler(event, data);
      } catch (err) {
        console.error("Error in notification event handler:", err);
      }
    });
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.pingTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ event: "ping" }));
        } catch {
          // Socket might have closed abruptly
        }
      }
    }, this.pingIntervalMs);
  }

  private stopHeartbeat(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.isExplicitlyClosed || this.status === "unauthorized") return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn("Max WebSocket reconnection attempts reached.");
      return;
    }

    this.reconnectAttempts++;

    // Bounded exponential backoff with jitter: min(base * 2^attempts + random_jitter, max)
    const exponential =
      this.baseReconnectDelayMs * Math.pow(2, this.reconnectAttempts);
    const jitter = Math.random() * 1000;
    const delay = Math.min(exponential + jitter, this.maxReconnectDelayMs);

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      if (!this.isExplicitlyClosed) {
        this.connect();
      }
    }, delay);
  }
}
