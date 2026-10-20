"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { notificationService } from "@/services/notification-service";
import {
  NotificationWebSocketClient,
  WebSocketConnectionStatus,
} from "@/services/notification-websocket-client";
import type { NotificationResponse } from "@/services/generated/api-types";
import { toast } from "sonner";

export interface UseRealtimeNotificationsOptions {
  autoConnect?: boolean;
  showToasts?: boolean;
}

export function useRealtimeNotifications({
  autoConnect = true,
  showToasts = true,
}: UseRealtimeNotificationsOptions = {}) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] =
    useState<WebSocketConnectionStatus>("disconnected");

  const wsClientRef = useRef<NotificationWebSocketClient | null>(null);

  // Fetch initial or updated unread count via REST
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationService.getUnreadCount();
      setUnreadCount(res.unread_count);
    } catch {
      // Silently catch unauthorized or network disconnects
    }
  }, []);

  // Fetch paginated notifications list via REST
  const loadNotifications = useCallback(
    async (unreadOnly = false) => {
      setIsLoading(true);
      try {
        const res = await notificationService.getNotifications({
          page: 1,
          page_size: 30,
          unread_only: unreadOnly,
        });

        // Deduplicate and merge with current items
        setNotifications((prev) => {
          const map = new Map<string, NotificationResponse>();
          // Existing items
          prev.forEach((item) => map.set(item.id, item));
          // Server items override
          res.items.forEach((item) => map.set(item.id, item));
          return Array.from(map.values()).sort(
            (a, b) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        });

        setUnreadCount(res.unread_count);
      } catch {
        toast.error("Failed to load notifications");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Reconcile missed notifications after reconnecting
  const handleReconnect = useCallback(async () => {
    await fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Mark single notification as read
  const markAsRead = useCallback(async (notification: NotificationResponse) => {
    if (notification.is_read) return;

    // Optimistic local update
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notification.id ? { ...n, is_read: true } : n
      )
    );
    setUnreadCount((c) => Math.max(0, c - 1));

    try {
      await notificationService.markAsRead(notification.id);
    } catch {
      // Rollback on server error
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, is_read: false } : n
        )
      );
      setUnreadCount((c) => c + 1);
      toast.error("Failed to mark notification as read");
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      await notificationService.markAllAsRead();
      toast.success("All notifications marked as read");
    } catch {
      await fetchUnreadCount();
      toast.error("Failed to mark all as read");
    }
  }, [fetchUnreadCount]);

  // Initialize WebSocket connection and lifecycle
  useEffect(() => {
    if (!autoConnect) return;

    const client = new NotificationWebSocketClient({
      onReconnect: handleReconnect,
    });
    wsClientRef.current = client;

    // Track status
    const unsubscribeStatus = client.onStatusChange((status) => {
      setConnectionStatus(status);
    });

    // Subscribe to real-time events
    const unsubscribeEvents = client.subscribe((event, data) => {
      if (event === "notification_created" && data) {
        const notif = data as NotificationResponse;

        setNotifications((prev) => {
          // Avoid duplicate notification entries
          if (prev.some((n) => n.id === notif.id)) return prev;
          return [notif, ...prev];
        });

        setUnreadCount((c) => c + 1);

        if (showToasts) {
          toast.info(notif.title, {
            description: notif.message,
          });
        }
      } else if (event === "notification_read" && data) {
        const { id } = data;
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } else if (event === "notifications_all_read") {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    });

    // Connect socket
    client.connect();

    // Initial unread count fetch
    fetchUnreadCount();

    return () => {
      unsubscribeStatus();
      unsubscribeEvents();
      client.disconnect();
      wsClientRef.current = null;
    };
  }, [autoConnect, showToasts, handleReconnect, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    connectionStatus,
    isLoading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    refresh: fetchUnreadCount,
  };
}
