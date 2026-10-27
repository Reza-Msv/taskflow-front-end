import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationBell } from "./notification-bell";
import { notificationService } from "@/services/notification-service";
import type { NotificationResponse } from "@/services/generated/api-types";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  usePathname: () => "/en/dashboard",
}));

vi.mock("@/modules/auth/context/auth-context", () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true,
    user: { id: "user-1", email: "user@example.com" },
  })),
}));

vi.mock("@/services/notification-service", () => ({
  notificationService: {
    getUnreadCount: vi.fn(),
    getNotifications: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const mockNotifications: NotificationResponse[] = [
  {
    id: "notif-1",
    user_id: "user-1",
    type: "task_mentioned",
    title: "Mentioned in TF-101",
    message: "@John please review this task",
    resource_type: "task",
    resource_id: "task-101",
    organization_id: "org-1",
    is_read: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    actor: {
      id: "actor-1",
      email: "jane@example.com",
      full_name: "Jane Doe",
    },
  },
  {
    id: "notif-2",
    user_id: "user-1",
    type: "task_assigned",
    title: "Assigned to TF-42",
    message: "You were assigned to task TF-42",
    resource_type: "task",
    resource_id: "task-42",
    organization_id: "org-1",
    is_read: true,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

describe("NotificationBell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(notificationService.getUnreadCount).mockResolvedValue({
      unread_count: 3,
    });
    vi.mocked(notificationService.getNotifications).mockResolvedValue({
      items: mockNotifications,
      total: 5,
      page: 1,
      page_size: 20,
      unread_count: 1,
    });
    vi.mocked(notificationService.markAsRead).mockResolvedValue({
      ...mockNotifications[0],
      is_read: true,
    });
    vi.mocked(notificationService.markAllAsRead).mockResolvedValue({
      message: "Marked all read",
    });
  });

  it("renders the notification bell and displays the unread badge", async () => {
    render(<NotificationBell />);

    expect(
      screen.getByRole("button", { name: /notifications/i })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("3")).toBeInTheDocument();
    });
    expect(notificationService.getUnreadCount).toHaveBeenCalledTimes(1);
  });

  it("opens popover and fetches notifications on click", async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);

    const bellBtn = screen.getByRole("button", { name: /notifications/i });
    await user.click(bellBtn);

    await waitFor(() => {
      expect(notificationService.getNotifications).toHaveBeenCalledWith({
        page: 1,
        page_size: 20,
        unread_only: false,
      });
    });

    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("Mentioned in TF-101")).toBeInTheDocument();
    expect(screen.getByText("Assigned to TF-42")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  it("filters unread notifications when clicking unread tab", async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);

    await user.click(screen.getByRole("button", { name: /notifications/i }));
    await waitFor(() => {
      expect(screen.getByText("Notifications")).toBeInTheDocument();
    });

    const unreadTab = screen.getByRole("button", { name: /unread/i });
    await user.click(unreadTab);

    await waitFor(() => {
      expect(notificationService.getNotifications).toHaveBeenCalledWith({
        page: 1,
        page_size: 20,
        unread_only: true,
      });
    });
  });

  it("marks individual notification as read", async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);

    await user.click(screen.getByRole("button", { name: /notifications/i }));
    await waitFor(() => {
      expect(screen.getByText("Mentioned in TF-101")).toBeInTheDocument();
    });

    const markReadBtn = screen.getByTitle("Mark as read");
    await user.click(markReadBtn);

    await waitFor(() => {
      expect(notificationService.markAsRead).toHaveBeenCalledWith("notif-1");
    });
  });

  it("marks all notifications as read", async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);

    await user.click(screen.getByRole("button", { name: /notifications/i }));
    await waitFor(() => {
      expect(screen.getByText("Mark all read")).toBeInTheDocument();
    });

    const markAllBtn = screen.getByText("Mark all read");
    await user.click(markAllBtn);

    await waitFor(() => {
      expect(notificationService.markAllAsRead).toHaveBeenCalled();
    });
  });

  it("triggers onNotificationClick callback when clicking a notification item", async () => {
    const onNotificationClick = vi.fn();
    const user = userEvent.setup();
    render(<NotificationBell onNotificationClick={onNotificationClick} />);

    await user.click(screen.getByRole("button", { name: /notifications/i }));
    await waitFor(() => {
      expect(screen.getByText("Mentioned in TF-101")).toBeInTheDocument();
    });

    const notifItem = screen.getByText("Mentioned in TF-101");
    await user.click(notifItem);

    expect(onNotificationClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: "notif-1" })
    );
  });

  it("navigates to task route on click when onNotificationClick is not provided", async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);

    await user.click(screen.getByRole("button", { name: /notifications/i }));
    await waitFor(() => {
      expect(screen.getByText("Mentioned in TF-101")).toBeInTheDocument();
    });

    const notifItem = screen.getByText("Mentioned in TF-101");
    await user.click(notifItem);

    expect(mockPush).toHaveBeenCalledWith("/en/my-tasks?search=TF-101");
  });

  it("displays Load More button when more items exist and handles loadMore click", async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);

    await user.click(screen.getByRole("button", { name: /notifications/i }));
    await waitFor(() => {
      expect(screen.getByText("Load more notifications")).toBeInTheDocument();
    });

    const loadMoreBtn = screen.getByText("Load more notifications");
    await user.click(loadMoreBtn);

    await waitFor(() => {
      expect(notificationService.getNotifications).toHaveBeenCalledWith({
        page: 2,
        page_size: 20,
        unread_only: false,
      });
    });
  });

  it("renders error state with retry button when initial fetch fails", async () => {
    vi.mocked(notificationService.getNotifications).mockRejectedValueOnce(
      new Error("Failed to load notifications")
    );

    const user = userEvent.setup();
    render(<NotificationBell />);

    await user.click(screen.getByRole("button", { name: /notifications/i }));

    await waitFor(() => {
      expect(
        screen.getAllByText("Failed to load notifications").length
      ).toBeGreaterThanOrEqual(1);
      expect(
        screen.getByRole("button", { name: /retry/i })
      ).toBeInTheDocument();
    });

    // Retry
    vi.mocked(notificationService.getNotifications).mockResolvedValueOnce({
      items: mockNotifications,
      total: 2,
      page: 1,
      page_size: 20,
      unread_count: 1,
    });

    await user.click(screen.getByRole("button", { name: /retry/i }));

    await waitFor(() => {
      expect(screen.getByText("Mentioned in TF-101")).toBeInTheDocument();
    });
  });
});
