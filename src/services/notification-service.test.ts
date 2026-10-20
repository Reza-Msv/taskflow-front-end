import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  notificationService,
  NOTIFICATION_ENDPOINTS,
} from "./notification-service";
import { apiClient } from "./api-client";
import type {
  NotificationListResponse,
  NotificationUnreadCountResponse,
  NotificationResponse,
} from "./generated/api-types";

vi.mock("./api-client", () => ({
  apiClient: vi.fn(),
}));

describe("notificationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches notifications with query params", async () => {
    const mockList: NotificationListResponse = {
      items: [
        {
          id: "notif-1",
          user_id: "u-1",
          type: "task_assigned",
          title: "New Task Assigned",
          message: "You were assigned to TF-101",
          is_read: false,
          created_at: "2026-10-20T10:00:00Z",
          updated_at: "2026-10-20T10:00:00Z",
        },
      ],
      page: 1,
      page_size: 20,
      total: 1,
      unread_count: 1,
    };

    vi.mocked(apiClient).mockResolvedValueOnce(mockList);

    const result = await notificationService.getNotifications({
      page: 1,
      page_size: 20,
      unread_only: true,
    });

    expect(apiClient).toHaveBeenCalledWith(
      `${NOTIFICATION_ENDPOINTS.notifications}?page=1&page_size=20&unread_only=true`,
      { method: "GET" }
    );
    expect(result).toEqual(mockList);
  });

  it("fetches unread count", async () => {
    const mockCount: NotificationUnreadCountResponse = { unread_count: 5 };
    vi.mocked(apiClient).mockResolvedValueOnce(mockCount);

    const result = await notificationService.getUnreadCount();

    expect(apiClient).toHaveBeenCalledWith(
      NOTIFICATION_ENDPOINTS.unreadCount,
      { method: "GET" }
    );
    expect(result.unread_count).toBe(5);
  });

  it("marks single notification as read", async () => {
    const mockNotification: NotificationResponse = {
      id: "notif-1",
      user_id: "u-1",
      type: "task_assigned",
      title: "New Task Assigned",
      message: "You were assigned to TF-101",
      is_read: true,
      created_at: "2026-10-20T10:00:00Z",
      updated_at: "2026-10-20T10:05:00Z",
    };

    vi.mocked(apiClient).mockResolvedValueOnce(mockNotification);

    const result = await notificationService.markAsRead("notif-1");

    expect(apiClient).toHaveBeenCalledWith(
      NOTIFICATION_ENDPOINTS.read("notif-1"),
      { method: "PATCH" }
    );
    expect(result.is_read).toBe(true);
  });

  it("marks all notifications as read", async () => {
    vi.mocked(apiClient).mockResolvedValueOnce(undefined);

    await notificationService.markAllAsRead();

    expect(apiClient).toHaveBeenCalledWith(
      NOTIFICATION_ENDPOINTS.readAll,
      { method: "POST" }
    );
  });
});
