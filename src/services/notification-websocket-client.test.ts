import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  NotificationWebSocketClient,
  getWebSocketNotificationUrl,
} from "./notification-websocket-client";

// Mock WebSocket
class MockWebSocket {
  public static OPEN = 1;
  public static CONNECTING = 0;
  public static CLOSING = 2;
  public static CLOSED = 3;

  public url: string;
  public readyState: number = MockWebSocket.CONNECTING;
  public onopen: (() => void) | null = null;
  public onclose: ((event: { code: number; reason: string }) => void) | null =
    null;
  public onmessage: ((event: { data: string }) => void) | null = null;
  public onerror: ((err: any) => void) | null = null;
  public sentMessages: string[] = [];

  constructor(url: string) {
    this.url = url;
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.();
    }, 10);
  }

  public send(msg: string): void {
    this.sentMessages.push(msg);
  }

  public close(code = 1000, reason = "Normal Closure"): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ code, reason });
  }

  // Helper to simulate receiving message from server
  public receive(data: object): void {
    this.onmessage?.({ data: JSON.stringify(data) });
  }
}

describe("NotificationWebSocketClient", () => {
  let originalWebSocket: any;

  beforeEach(() => {
    vi.useFakeTimers();
    originalWebSocket = (globalThis as any).WebSocket;
    (globalThis as any).WebSocket = MockWebSocket;
  });

  afterEach(() => {
    (globalThis as any).WebSocket = originalWebSocket;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("getWebSocketNotificationUrl", () => {
    it("converts http API URL to ws WebSocket URL", () => {
      const url = getWebSocketNotificationUrl();
      expect(url).toMatch(
        /^ws:\/\/127\.0\.0\.1:8000\/api\/v1\/notifications\/ws$/
      );
    });

    it("respects custom URL when provided", () => {
      const custom = "wss://custom.domain.com/ws";
      expect(getWebSocketNotificationUrl(custom)).toBe(custom);
    });
  });

  describe("connection lifecycle and messaging", () => {
    it("connects and dispatches connected status and events", async () => {
      const client = new NotificationWebSocketClient({
        pingIntervalMs: 10000,
      });

      const events: Array<{ event: string; data: any }> = [];
      client.subscribe((event, data) => {
        events.push({ event, data });
      });

      const statusChanges: string[] = [];
      client.onStatusChange((status) => {
        statusChanges.push(status);
      });

      expect(client.getStatus()).toBe("disconnected");

      client.connect();
      expect(client.getStatus()).toBe("connecting");

      // Advance timers to trigger onopen
      vi.advanceTimersByTime(20);
      expect(client.getStatus()).toBe("connected");

      // Simulate incoming event
      const mockWs = (client as any).ws as MockWebSocket;
      expect(mockWs).toBeDefined();

      mockWs.receive({
        event: "connected",
        data: { user_id: "user-123", timestamp: "2026-10-20T00:00:00Z" },
      });

      expect(events).toContainEqual({
        event: "connected",
        data: { user_id: "user-123", timestamp: "2026-10-20T00:00:00Z" },
      });

      client.disconnect();
      expect(client.getStatus()).toBe("disconnected");
    });

    it("dispatches notification_created, notification_read, and notifications_all_read", async () => {
      const client = new NotificationWebSocketClient();
      const events: Array<{ event: string; data: any }> = [];
      client.subscribe((event, data) => events.push({ event, data }));

      client.connect();
      vi.advanceTimersByTime(20);

      const mockWs = (client as any).ws as MockWebSocket;

      // 1. notification_created
      mockWs.receive({
        event: "notification_created",
        data: {
          id: "notif-1",
          type: "task_assigned",
          title: "New Task Assigned",
          message: "You were assigned to task TASK-100",
        },
      });

      // 2. notification_read
      mockWs.receive({
        event: "notification_read",
        data: { id: "notif-1", user_id: "user-1" },
      });

      // 3. notifications_all_read
      mockWs.receive({
        event: "notifications_all_read",
        data: { user_id: "user-1" },
      });

      expect(events).toHaveLength(3);
      expect(events[0].event).toBe("notification_created");
      expect(events[0].data.id).toBe("notif-1");
      expect(events[1].event).toBe("notification_read");
      expect(events[2].event).toBe("notifications_all_read");

      client.disconnect();
    });

    it("sends ping heartbeat frames periodically", async () => {
      const client = new NotificationWebSocketClient({
        pingIntervalMs: 5000,
      });

      client.connect();
      vi.advanceTimersByTime(20);

      const mockWs = (client as any).ws as MockWebSocket;
      expect(mockWs.sentMessages).toHaveLength(0);

      // Advance by 5000ms
      vi.advanceTimersByTime(5000);
      expect(mockWs.sentMessages).toContainEqual(
        JSON.stringify({ event: "ping" })
      );

      client.disconnect();
    });
  });

  describe("reconnection and error handling", () => {
    it("halts reconnection when receiving close code 1008 (Policy Violation / Unauthorized)", async () => {
      const client = new NotificationWebSocketClient();
      client.connect();
      vi.advanceTimersByTime(20);

      const mockWs = (client as any).ws as MockWebSocket;

      // Server closes with 1008 Unauthorized
      mockWs.close(1008, "Unauthorized");

      expect(client.getStatus()).toBe("unauthorized");

      // Advance time by 10s; should NOT attempt reconnect
      vi.advanceTimersByTime(10000);
      expect(client.getStatus()).toBe("unauthorized");
    });

    it("reconnects with exponential backoff on abrupt disconnection and triggers onReconnect callback", async () => {
      const onReconnect = vi.fn().mockResolvedValue(undefined);
      const client = new NotificationWebSocketClient({
        baseReconnectDelayMs: 500,
        maxReconnectDelayMs: 5000,
        onReconnect,
      });

      client.connect();
      vi.advanceTimersByTime(20);
      expect(client.getStatus()).toBe("connected");
      expect(onReconnect).not.toHaveBeenCalled();

      const mockWs = (client as any).ws as MockWebSocket;

      // Socket disconnects abruptly (code 1006 / network lost)
      mockWs.close(1006, "Abrupt disconnect");
      expect(client.getStatus()).toBe("disconnected");

      // Advance backoff time so reconnection establishes
      vi.advanceTimersByTime(3000);

      expect(client.getStatus()).toBe("connected");
      expect(onReconnect).toHaveBeenCalledTimes(1);

      client.disconnect();
    });

    it("pauses reconnect when offline and resumes when coming back online", async () => {
      const client = new NotificationWebSocketClient({
        baseReconnectDelayMs: 200,
        maxReconnectDelayMs: 2000,
      });

      client.connect();
      vi.advanceTimersByTime(20);
      expect(client.getStatus()).toBe("connected");

      // Trigger offline event
      window.dispatchEvent(new Event("offline"));
      expect(client.getStatus()).toBe("disconnected");

      // Trigger online event
      window.dispatchEvent(new Event("online"));
      expect(client.getStatus()).toBe("connecting");

      vi.advanceTimersByTime(20);
      expect(client.getStatus()).toBe("connected");

      client.disconnect();
    });
  });
});
