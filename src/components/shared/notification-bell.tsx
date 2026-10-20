"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  CheckCheck,
  MessageSquare,
  AtSign,
  UserCheck,
  RefreshCw,
  BellOff,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications";
import type { NotificationResponse } from "@/services/generated/api-types";
import { cn } from "@/lib/utils";

export interface NotificationBellProps {
  onNotificationClick?: (notification: NotificationResponse) => void;
  className?: string;
}

export function NotificationBell({
  onNotificationClick,
  className,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);

  const {
    notifications,
    unreadCount,
    connectionStatus,
    isLoading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
  } = useRealtimeNotifications({ autoConnect: true, showToasts: true });

  useEffect(() => {
    if (isOpen) {
      loadNotifications(filterUnreadOnly);
    }
  }, [isOpen, filterUnreadOnly, loadNotifications]);

  const handleClickItem = (notification: NotificationResponse) => {
    if (!notification.is_read) {
      markAsRead(notification);
    }
    setIsOpen(false);
    onNotificationClick?.(notification);
  };

  const displayedNotifications = filterUnreadOnly
    ? notifications.filter((n) => !n.is_read)
    : notifications;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "task_assigned":
        return <UserCheck className="h-4 w-4 text-primary" />;
      case "task_mentioned":
        return <AtSign className="h-4 w-4 text-primary" />;
      case "task_comment":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "task_status_changed":
        return <RefreshCw className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const now = new Date();
      const date = new Date(dateStr);
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative h-9 w-9 text-muted-foreground hover:text-foreground",
            className
          )}
          aria-label={`Notifications (${unreadCount} unread)`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground animate-in fade-in zoom-in-75">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-80 sm:w-96 p-0"
        align="end"
        sideOffset={8}
      >
        <DropdownMenuLabel className="flex items-center justify-between border-b border-border/60 px-4 py-3 font-medium">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Notifications</span>
            {connectionStatus === "connected" && (
              <span
                className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"
                title="Real-time WebSocket connected"
              />
            )}
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {unreadCount} unread
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-7 gap-1 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Mark all read</span>
            </Button>
          )}
        </DropdownMenuLabel>

        {/* Filter Bar */}
        <div className="flex items-center gap-1 border-b border-border/40 bg-muted/30 px-3 py-1.5 text-xs">
          <button
            type="button"
            onClick={() => setFilterUnreadOnly(false)}
            className={cn(
              "rounded px-2.5 py-1 font-medium transition-colors",
              !filterUnreadOnly
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilterUnreadOnly(true)}
            className={cn(
              "rounded px-2.5 py-1 font-medium transition-colors",
              filterUnreadOnly
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Notifications List */}
        <div className="max-h-80 overflow-y-auto py-1 divide-y divide-border/30">
          {isLoading && displayedNotifications.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
              <RefreshCw className="mr-2 h-4 w-4 animate-spin text-primary" />
              <span>Loading notifications...</span>
            </div>
          ) : displayedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <BellOff className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-foreground">No notifications</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {filterUnreadOnly
                  ? "You're all caught up with unread items."
                  : "We'll alert you in real time when there are updates on your tasks."}
              </p>
            </div>
          ) : (
            displayedNotifications.map((n) => (
              <div
                key={n.id}
                role="button"
                tabIndex={0}
                onClick={() => handleClickItem(n)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleClickItem(n);
                  }
                }}
                className={cn(
                  "group flex cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/40 focus:bg-accent/40 focus:outline-hidden",
                  !n.is_read && "bg-primary/5 font-medium"
                )}
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary/80">
                  {getNotificationIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {n.title}
                    </p>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {formatRelativeTime(n.created_at)}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground leading-snug">
                    {n.message}
                  </p>
                </div>

                {!n.is_read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(n);
                    }}
                    title="Mark as read"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
