import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useRealtimeNotifications } from "./use-realtime-notifications";
import { notificationService } from "@/services/notification-service";
import { resetSharedNotificationWebSocketClient } from "@/services/notification-websocket-client";
import type { NotificationResponse } from "@/services/generated/api-types";

// Mock notificationService
vi.mock("@/services/notification-service", () => ({
  notificationService: {
    getUnreadCount: vi.fn(),
    getNotifications: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  },
}));

vi.mock("@/modules/auth/context/auth-context", () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true,
    user: { id: "user-1", email: "user@example.com" },
  })),
}));

vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

let currentMockSocketInstance: MockWebSocket | null = null;

// Mock WebSocket
class MockWebSocket {
  public static OPEN = 1;
  public static CONNECTING = 0;
  public static CLOSED = 3;

  public url: string;
  public readyState: number = MockWebSocket.CONNECTING;
  public onopen: (() => void) | null = null;
  public onclose: ((event: { code: number; reason: string }) => void) | null =
    null;
  public onmessage: ((event: { data: string }) => void) | null = null;
  public onerror: ((err: any) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    currentMockSocketInstance = this;
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.();
    }, 10);
  }

  public send(): void {}
  public close(): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ code: 1000, reason: "Normal" });
  }

  public receive(data: object): void {
    this.onmessage?.({ data: JSON.stringify(data) });
  }
}

describe("useRealtimeNotifications", () => {
  let originalWebSocket: any;

  beforeEach(() => {
    vi.clearAllMocks();
    resetSharedNotificationWebSocketClient();
    originalWebSocket = (globalThis as any).WebSocket;
    (globalThis as any).WebSocket = MockWebSocket;
    currentMockSocketInstance = null;

    vi.mocked(notificationService.getUnreadCount).mockResolvedValue({
      unread_count: 2,
    });
    vi.mocked(notificationService.getNotifications).mockResolvedValue({
      items: [
        {
          id: "notif-1",
          user_id: "user-1",
          type: "task_assigned",
          title: "Assigned Task",
          message: "Task assigned to you",
          is_read: false,
          created_at: "2026-10-20T10:00:00Z",
          updated_at: "2026-10-20T10:00:00Z",
        },
      ],
      total: 3,
      page: 1,
      page_size: 20,
      unread_count: 2,
    });
  });

  afterEach(() => {
    (globalThis as any).WebSocket = originalWebSocket;
    resetSharedNotificationWebSocketClient();
  });

  it("initializes connection, fetches unread count, and updates status", async () => {
    const { result } = renderHook(() => useRealtimeNotifications());

    await waitFor(() => {
      expect(result.current.unreadCount).toBe(2);
      expect(result.current.connectionStatus).toBe("connected");
    });
  });

  it("handles pagination via loadNotifications and loadMore", async () => {
    const { result } = renderHook(() =>
      useRealtimeNotifications({ pageSize: 1 })
    );

    await act(async () => {
      await result.current.loadNotifications(false);
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.total).toBe(3);
    expect(result.current.hasMore).toBe(true);

    vi.mocked(notificationService.getNotifications).mockResolvedValueOnce({
      items: [
        {
          id: "notif-2",
          user_id: "user-1",
          type: "task_comment",
          title: "New Comment",
          message: "A comment was added",
          is_read: false,
          created_at: "2026-10-20T09:00:00Z",
        },
      ],
      total: 3,
      page: 2,
      page_size: 1,
      unread_count: 2,
    });

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.notifications).toHaveLength(2);
    expect(result.current.page).toBe(2);
  });

  it("handles real-time notification_created event and suppresses duplicates", async () => {
    const { result } = renderHook(() => useRealtimeNotifications());

    await waitFor(() => {
      expect(result.current.connectionStatus).toBe("connected");
    });

    const newNotification: NotificationResponse = {
      id: "notif-realtime-1",
      user_id: "user-1",
      type: "task_mentioned",
      title: "Mentioned in comment",
      message: "@John please look at this",
      is_read: false,
      created_at: "2026-10-20T12:00:00Z",
    };

    // Simulate incoming WS message
    act(() => {
      currentMockSocketInstance?.receive({
        event: "notification_created",
        data: newNotification,
      });
    });

    expect(
      result.current.notifications.some((n) => n.id === "notif-realtime-1")
    ).toBe(true);
    expect(result.current.unreadCount).toBe(3);

    // Duplicate event should be ignored
    act(() => {
      currentMockSocketInstance?.receive({
        event: "notification_created",
        data: newNotification,
      });
    });

    expect(
      result.current.notifications.filter((n) => n.id === "notif-realtime-1")
    ).toHaveLength(1);
  });

  it("handles notification_read and notifications_all_read events from socket", async () => {
    const { result } = renderHook(() => useRealtimeNotifications());

    await waitFor(() => {
      expect(result.current.connectionStatus).toBe("connected");
    });

    await act(async () => {
      await result.current.loadNotifications();
    });

    expect(result.current.notifications[0].is_read).toBe(false);

    // Simulate notification_read
    act(() => {
      currentMockSocketInstance?.receive({
        event: "notification_read",
        data: { id: "notif-1", user_id: "user-1", is_read: true },
      });
    });

    expect(result.current.notifications[0].is_read).toBe(true);

    // Simulate notifications_all_read
    act(() => {
      currentMockSocketInstance?.receive({
        event: "notifications_all_read",
        data: { user_id: "user-1", marked_count: 2 },
      });
    });

    expect(result.current.unreadCount).toBe(0);
  });

  it("marks all notifications as read optimistically and via service", async () => {
    vi.mocked(notificationService.markAllAsRead).mockResolvedValue({
      message: "Marked all read",
    });

    const { result } = renderHook(() => useRealtimeNotifications());

    await waitFor(() => {
      expect(result.current.unreadCount).toBe(2);
    });

    await act(async () => {
      await result.current.markAllAsRead();
    });

    expect(result.current.unreadCount).toBe(0);
    expect(notificationService.markAllAsRead).toHaveBeenCalled();
  });

  it("handles error and retry when loading notifications fails", async () => {
    vi.mocked(notificationService.getNotifications).mockRejectedValueOnce(
      new Error("Network Error")
    );

    const { result } = renderHook(() => useRealtimeNotifications());

    await act(async () => {
      await result.current.loadNotifications();
    });

    expect(result.current.error).toBe("Network Error");

    // Retry should clear error and reload
    vi.mocked(notificationService.getNotifications).mockResolvedValueOnce({
      items: [],
      total: 0,
      page: 1,
      page_size: 20,
      unread_count: 0,
    });

    await act(async () => {
      await result.current.retry();
    });

    expect(result.current.error).toBeNull();
  });
});
