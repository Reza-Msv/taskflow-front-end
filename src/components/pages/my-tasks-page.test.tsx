import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MyTasksPage } from "./my-tasks-page";
import { dashboardService } from "@/services/dashboard-service";
import { organizationService } from "@/services/organization-service";
import { projectService } from "@/services/project-service";

const mockReplace = vi.fn();
const mockPush = vi.fn();
const mockRouter = {
  push: mockPush,
  replace: mockReplace,
};

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/en/my-tasks",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/modules/auth/context/auth-context", () => ({
  useAuth: () => ({
    user: { id: "user-123", email: "user@example.com", name: "Alex Mercer" },
    isAuthenticated: true,
  }),
}));

vi.mock("@/services/dashboard-service");
vi.mock("@/services/organization-service");
vi.mock("@/services/project-service");

// Mock TaskDetailSheet to test integration
vi.mock("@/components/shared/task-detail-sheet", () => ({
  TaskDetailSheet: ({ isOpen, taskId, onClose }: any) =>
    isOpen ? (
      <div data-testid="task-detail-sheet">
        <span>Detail Sheet Task: {taskId}</span>
        <button onClick={onClose}>Close Detail</button>
      </div>
    ) : null,
}));

describe("MyTasksPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(organizationService.getMyOrganizations).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      page_size: 1,
    });

    vi.mocked(dashboardService.getSummary).mockResolvedValue({
      total_projects: 2,
      projects: [],
      status_counts: { todo: 3, in_progress: 2, done: 5 },
      assigned_tasks_count: 5,
      in_progress_tasks_count: 2,
      completed_tasks_count: 5,
      overdue_tasks_count: 1,
    });

    vi.mocked(dashboardService.getMyTasks).mockResolvedValue({
      items: [
        {
          id: "task-assigned-1",
          issue_key: "MY-101",
          type: "task",
          title: "Prepare Sprint Review Slides",
          status: "in_progress",
          priority: "high",
          due_date: "2026-11-20T00:00:00Z",
          estimated_points: 3,
          rank: "0|hzzzzz:",
          created_at: "2026-10-18T00:00:00Z",
          updated_at: "2026-10-19T00:00:00Z",
          project: {
            id: "proj-1",
            name: "Core Platform",
            key: "CORE",
            organization_id: "org-1",
            is_private: false,
          },
          is_overdue: false,
        },
      ],
      total: 1,
      page: 1,
      page_size: 25,
      total_pages: 1,
    });

    vi.mocked(dashboardService.getOverdueUpcoming).mockResolvedValue({
      overdue_tasks: [
        {
          id: "task-overdue-1",
          issue_key: "OVER-1",
          type: "bug",
          title: "Fix critical auth bug",
          status: "todo",
          priority: "urgent",
          due_date: "2026-10-01T00:00:00Z",
          estimated_points: null,
          rank: "0|hzzzzz:",
          created_at: "",
          updated_at: "",
          project: {
            id: "proj-1",
            name: "Core Platform",
            key: "CORE",
            organization_id: "org-1",
            is_private: false,
          },
          is_overdue: true,
        },
      ],
      upcoming_tasks: [],
    });
  });

  it("fetches and renders tasks assigned to authenticated user", async () => {
    render(<MyTasksPage />);

    expect(screen.getByText("My Tasks")).toBeInTheDocument();
    expect(await screen.findByText("Prepare Sprint Review Slides")).toBeInTheDocument();
    expect(screen.getByText("MY-101")).toBeInTheDocument();
    expect(dashboardService.getMyTasks).toHaveBeenCalled();
  });

  it("switches to Overdue tab and loads overdue tasks", async () => {
    const user = userEvent.setup();

    render(<MyTasksPage />);

    await screen.findByText("Prepare Sprint Review Slides");

    const overdueTab = screen.getByRole("tab", { name: /overdue/i });
    await user.click(overdueTab);

    await waitFor(() => {
      expect(dashboardService.getOverdueUpcoming).toHaveBeenCalledWith({
        upcoming_days: 30,
        limit: 50,
      });
    });

    expect(await screen.findByText("Fix critical auth bug")).toBeInTheDocument();
    expect(screen.getByText("OVER-1")).toBeInTheDocument();
  });

  it("opens TaskDetailSheet when a task row is clicked", async () => {
    const user = userEvent.setup();

    render(<MyTasksPage />);

    const taskTitle = await screen.findByText("Prepare Sprint Review Slides");
    await user.click(taskTitle);

    expect(await screen.findByTestId("task-detail-sheet")).toBeInTheDocument();
    expect(screen.getByText(/detail sheet task: task-assigned-1/i)).toBeInTheDocument();
  });

  it("toggles between List view and Grid view", async () => {
    const user = userEvent.setup();

    render(<MyTasksPage />);

    await screen.findByText("Prepare Sprint Review Slides");

    const gridBtn = screen.getByRole("button", { name: /grid view/i });
    await user.click(gridBtn);

    expect(await screen.findByText("Prepare Sprint Review Slides")).toBeInTheDocument();

    const listBtn = screen.getByRole("button", { name: /list view/i });
    await user.click(listBtn);

    expect(await screen.findByText("Prepare Sprint Review Slides")).toBeInTheDocument();
  });

  it("displays error state and retries fetch when retry button is clicked", async () => {
    const user = userEvent.setup();

    vi.mocked(dashboardService.getMyTasks).mockRejectedValueOnce(
      new Error("Database connection error")
    );

    render(<MyTasksPage />);

    expect(await screen.findByText("Database connection error")).toBeInTheDocument();

    const retryBtn = screen.getByRole("button", { name: /try again/i });
    await user.click(retryBtn);

    expect(dashboardService.getMyTasks).toHaveBeenCalledTimes(2);
  });
});
