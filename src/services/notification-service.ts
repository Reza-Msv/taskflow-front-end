import { apiClient } from "@/services/api-client";
import type {
  NotificationResponse,
  NotificationListResponse,
  NotificationUnreadCountResponse,
} from "@/services/generated/api-types";

export interface NotificationQueryParams {
  page?: number;
  page_size?: number;
  unread_only?: boolean;
}

export const NOTIFICATION_ENDPOINTS = {
  notifications: "/api/v1/notifications",
  unreadCount: "/api/v1/notifications/unread-count",
  read: (id: string) => `/api/v1/notifications/${encodeURIComponent(id)}/read`,
  readAll: "/api/v1/notifications/read-all",
} as const;

export const notificationService = {
  /**
   * List paginated notifications for current user
   */
  async getNotifications(
    params: NotificationQueryParams = {}
  ): Promise<NotificationListResponse> {
    const searchParams = new URLSearchParams();
    if (params.page !== undefined) {
      searchParams.set("page", params.page.toString());
    }
    if (params.page_size !== undefined) {
      searchParams.set("page_size", params.page_size.toString());
    }
    if (params.unread_only !== undefined) {
      searchParams.set("unread_only", params.unread_only.toString());
    }

    const query = searchParams.toString();
    const url = query
      ? `${NOTIFICATION_ENDPOINTS.notifications}?${query}`
      : NOTIFICATION_ENDPOINTS.notifications;

    return apiClient<NotificationListResponse>(url, {
      method: "GET",
    });
  },

  /**
   * Get unread notification badge count
   */
  async getUnreadCount(): Promise<NotificationUnreadCountResponse> {
    return apiClient<NotificationUnreadCountResponse>(
      NOTIFICATION_ENDPOINTS.unreadCount,
      {
        method: "GET",
      }
    );
  },

  /**
   * Mark single notification as read
   */
  async markAsRead(id: string): Promise<NotificationResponse> {
    return apiClient<NotificationResponse>(NOTIFICATION_ENDPOINTS.read(id), {
      method: "PATCH",
    });
  },

  /**
   * Mark all user notifications as read
   */
  async markAllAsRead(): Promise<void> {
    await apiClient<void>(NOTIFICATION_ENDPOINTS.readAll, {
      method: "POST",
    });
  },
};
