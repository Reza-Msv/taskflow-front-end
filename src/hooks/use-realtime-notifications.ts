"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { notificationService } from "@/services/notification-service";
import {
  NotificationWebSocketClient,
  WebSocketConnectionStatus,
  getSharedNotificationWebSocketClient,
} from "@/services/notification-websocket-client";
import { useAuth } from "@/modules/auth/context/auth-context";
import type {
  NotificationResponse,
  NotificationCreatedWsPayload,
  NotificationReadWsPayload,
  NotificationsAllReadWsPayload,
} from "@/services/generated/api-types";
import { toast } from "sonner";

export interface UseRealtimeNotificationsOptions {
  autoConnect?: boolean;
  showToasts?: boolean;
  pageSize?: number;
}

export function useRealtimeNotifications({
  autoConnect = true,
  showToasts = true,
  pageSize = 20,
}: UseRealtimeNotificationsOptions = {}) {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationResponse[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [connectionStatus, setConnectionStatus] =
    useState<WebSocketConnectionStatus>("disconnected");

  const wsClientRef = useRef<NotificationWebSocketClient | null>(null);
  const currentUnreadFilterRef = useRef(false);

  // Fetch initial or updated unread count via REST
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationService.getUnreadCount();
      setUnreadCount(res.unread_count);
    } catch {
      // Silently catch unauthorized or network disconnects
    }
  }, [isAuthenticated]);

  // Fetch paginated notifications list via REST (Page 1)
  const loadNotifications = useCallback(
    async (unreadOnly = false) => {
      if (!isAuthenticated) return;
      currentUnreadFilterRef.current = unreadOnly;
      setIsLoading(true);
      setError(null);
      try {
        const res = await notificationService.getNotifications({
          page: 1,
          page_size: pageSize,
          unread_only: unreadOnly,
        });

        setNotifications(res.items);
        setTotal(res.total);
        setPage(1);
        setUnreadCount(res.unread_count);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Failed to load notifications";
        setError(msg);
        toast.error("Failed to load notifications");
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, pageSize]
  );

  // Load next page of notifications
  const loadMore = useCallback(
    async (unreadOnly = currentUnreadFilterRef.current) => {
      if (!isAuthenticated || isLoadingMore || isLoading) return;
      if (notifications.length >= total) return;

      setIsLoadingMore(true);
      setError(null);
      const nextPage = page + 1;
      try {
        const res = await notificationService.getNotifications({
          page: nextPage,
          page_size: pageSize,
          unread_only: unreadOnly,
        });

        setNotifications((prev) => {
          const map = new Map<string, NotificationResponse>();
          prev.forEach((item) => map.set(item.id, item));
          res.items.forEach((item) => map.set(item.id, item));
          return Array.from(map.values()).sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );
        });

        setPage(nextPage);
        setTotal(res.total);
        setUnreadCount(res.unread_count);
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "Failed to load more notifications";
        setError(msg);
        toast.error("Failed to load more notifications");
      } finally {
        setIsLoadingMore(false);
      }
    },
    [
      isAuthenticated,
      isLoadingMore,
      isLoading,
      notifications.length,
      total,
      page,
      pageSize,
    ]
  );

  // Reconcile missed notifications after reconnecting
  const handleReconnect = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      await fetchUnreadCount();
      // Re-fetch current notifications list to catch any missed while disconnected
      const res = await notificationService.getNotifications({
        page: 1,
        page_size: pageSize,
        unread_only: currentUnreadFilterRef.current,
      });

      setNotifications((prev) => {
        const map = new Map<string, NotificationResponse>();
        // Keep existing loaded items
        prev.forEach((item) => map.set(item.id, item));
        // Server items take precedence
        res.items.forEach((item) => map.set(item.id, item));
        return Array.from(map.values()).sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
      setTotal(res.total);
      setUnreadCount(res.unread_count);
    } catch {
      // Catch silently on transient network blip
    }
  }, [isAuthenticated, fetchUnreadCount, pageSize]);

  // Mark single notification as read
  const markAsRead = useCallback(async (notification: NotificationResponse) => {
    if (notification.is_read) return;

    // Optimistic local update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
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

  // Retry loading state
  const retry = useCallback(async () => {
    setError(null);
    await Promise.all([
      fetchUnreadCount(),
      loadNotifications(currentUnreadFilterRef.current),
    ]);
  }, [fetchUnreadCount, loadNotifications]);

  // Initialize WebSocket connection and lifecycle
  useEffect(() => {
    if (!autoConnect || !isAuthenticated) {
      if (wsClientRef.current) {
        wsClientRef.current.disconnect();
        wsClientRef.current = null;
      }
      setConnectionStatus("disconnected");
      return;
    }

    const client = getSharedNotificationWebSocketClient({
      onReconnect: handleReconnect,
    });
    wsClientRef.current = client;

    // Track status
    const unsubscribeStatus = client.onStatusChange((status) => {
      setConnectionStatus(status);
    });

    // Subscribe to real-time events
    const unsubscribeEvents = client.subscribe((event, rawData) => {
      if (event === "notification_created" && rawData) {
        const notif = rawData as NotificationCreatedWsPayload;

        setNotifications((prev) => {
          // Avoid duplicate notification entries
          if (prev.some((n) => n.id === notif.id)) return prev;
          return [notif, ...prev];
        });

        setTotal((t) => t + 1);
        setUnreadCount((c) => c + 1);

        if (showToasts) {
          toast.info(notif.title, {
            description: notif.message,
          });
        }
      } else if (event === "notification_read" && rawData) {
        const { id } = rawData as NotificationReadWsPayload;
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
    };
  }, [
    autoConnect,
    isAuthenticated,
    showToasts,
    handleReconnect,
    fetchUnreadCount,
  ]);

  const hasMore = notifications.length < total;

  return {
    notifications,
    unreadCount,
    connectionStatus,
    isLoading,
    isLoadingMore,
    hasMore,
    total,
    page,
    error,
    loadNotifications,
    loadMore,
    markAsRead,
    markAllAsRead,
    refresh: fetchUnreadCount,
    retry,
  };
}
