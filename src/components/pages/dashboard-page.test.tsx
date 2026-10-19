import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DashboardPage } from "./dashboard-page";
import { dashboardService } from "@/services/dashboard-service";
import { ApiClientError } from "@/services/api-client";
import type {
  DashboardSummaryResponse,
  WorkItemListDashboardResponse,
  OverdueUpcomingTasksResponse,
  UserActivityListResponse,
} from "@/services/generated/api-types";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/dashboard",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

const mockSummary: DashboardSummaryResponse = {
  total_projects: 3,
  projects: [
    {
      id: "p1",
      name: "Platform Backend",
      key: "BACK",
      organization_id: "org1",
      is_private: false,
      role: "member",
      total_tasks: 12,
      assigned_tasks: 4,
    },
    {
      id: "p2",
      name: "Web Application",
      key: "WEB",
      organization_id: "org1",
      is_private: false,
      role: "owner",
      total_tasks: 8,
      assigned_tasks: 2,
    },
  ],
  status_counts: {
    todo: 2,
    in_progress: 2,
    done: 1,
  },
  assigned_tasks_count: 5,
  in_progress_tasks_count: 2,
  completed_tasks_count: 1,
  overdue_tasks_count: 1,
};

const mockTasksResponse: WorkItemListDashboardResponse = {
  items: [
    {
      id: "task-1",
      issue_key: "BACK-2",
      type: "task",
      title: "Fix database connection leak",
      status: "in_progress",
      priority: "high",
      due_date: "2026-10-18T10:00:00Z",
      estimated_points: 3,
      rank: "0|hzzzzz:",
      created_at: "2026-10-15T08:00:00Z",
      updated_at: "2026-10-18T09:00:00Z",
      project: {
        id: "p1",
        name: "Platform Backend",
        key: "BACK",
        organization_id: "org1",
        is_private: false,
      },
      is_overdue: true,
    },
    {
      id: "task-2",
      issue_key: "WEB-10",
      type: "task",
      title: "Build user profile page",
      status: "todo",
      priority: "medium",
      due_date: "2026-10-25T12:00:00Z",
      estimated_points: 2,
      rank: "0|hzzzza:",
      created_at: "2026-10-16T08:00:00Z",
      updated_at: "2026-10-16T08:00:00Z",
      project: {
        id: "p2",
        name: "Web Application",
        key: "WEB",
        organization_id: "org1",
        is_private: false,
      },
      is_overdue: false,
    },
  ],
  total: 2,
  page: 1,
  page_size: 10,
  total_pages: 1,
};

const mockOverdueUpcoming: OverdueUpcomingTasksResponse = {
  overdue_tasks: [mockTasksResponse.items[0]],
  upcoming_tasks: [mockTasksResponse.items[1]],
};

const mockActivity: UserActivityListResponse = {
  items: [
    {
      id: "act-1",
      activity_type: "status_change",
      field: "status",
      old_value: "todo",
      new_value: "in_progress",
      created_at: "2026-10-19T05:00:00Z",
      work_item_id: "task-1",
      work_item_key: "BACK-2",
      work_item_title: "Fix database connection leak",
      project_id: "p1",
      project_name: "Platform Backend",
      actor: {
        id: "u-1",
        email: "lead@taskflow.dev",
        full_name: "Jane Lead",
      },
      details: "Changed status from 'todo' to 'in_progress'",
    },
  ],
  total: 1,
  page: 1,
  page_size: 15,
  total_pages: 1,
};

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading skeleton initially and displays full dashboard data when loaded", async () => {
    vi.spyOn(dashboardService, "getSummary").mockResolvedValueOnce(mockSummary);
    vi.spyOn(dashboardService, "getMyTasks").mockResolvedValueOnce(
      mockTasksResponse
    );
    vi.spyOn(dashboardService, "getOverdueUpcoming").mockResolvedValueOnce(
      mockOverdueUpcoming
    );
    vi.spyOn(dashboardService, "getActivity").mockResolvedValueOnce(
      mockActivity
    );

    render(<DashboardPage />);

    // Skeleton should be present during loading
    expect(screen.getByTestId("dashboard-skeleton")).toBeInTheDocument();

    // Wait for data to render
    await waitFor(() => {
      expect(
        screen.queryByTestId("dashboard-skeleton")
      ).not.toBeInTheDocument();
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });

    // 1. Overview Summary Cards
    expect(screen.getByText("Total Projects")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Assigned Tasks")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByTestId("metric-in-progress")).toHaveTextContent(
      "In Progress"
    );
    expect(screen.getByText("Completed Tasks")).toBeInTheDocument();
    expect(screen.getByTestId("metric-overdue-tasks")).toHaveTextContent(
      "Overdue Tasks"
    );

    // 2. Overdue and Upcoming Tasks
    expect(screen.getByText("Upcoming Deadlines")).toBeInTheDocument();
    expect(screen.getByTestId("overdue-task-item")).toBeInTheDocument();
    expect(screen.getByTestId("upcoming-task-item")).toBeInTheDocument();

    // 3. My Assigned Tasks Table
    const taskRows = screen.getAllByTestId("task-row");
    expect(taskRows).toHaveLength(2);
    expect(taskRows[0]).toHaveTextContent("Fix database connection leak");
    expect(taskRows[1]).toHaveTextContent("Build user profile page");

    // 4. Recent Activity
    expect(screen.getByText("Recent Activity")).toBeInTheDocument();
    expect(screen.getByTestId("activity-item")).toBeInTheDocument();
    expect(screen.getByText("Jane Lead")).toBeInTheDocument();
    expect(
      screen.getByText("Changed status from 'todo' to 'in_progress'")
    ).toBeInTheDocument();
  });

  it("renders clean empty states when user has zero tasks, deadlines, and activities", async () => {
    const emptySummary: DashboardSummaryResponse = {
      total_projects: 0,
      projects: [],
      status_counts: {},
      assigned_tasks_count: 0,
      in_progress_tasks_count: 0,
      completed_tasks_count: 0,
      overdue_tasks_count: 0,
    };
    const emptyTasks: WorkItemListDashboardResponse = {
      items: [],
      total: 0,
      page: 1,
      page_size: 10,
      total_pages: 0,
    };
    const emptyOverdueUpcoming: OverdueUpcomingTasksResponse = {
      overdue_tasks: [],
      upcoming_tasks: [],
    };
    const emptyActivity: UserActivityListResponse = {
      items: [],
      total: 0,
      page: 1,
      page_size: 15,
      total_pages: 0,
    };

    vi.spyOn(dashboardService, "getSummary").mockResolvedValueOnce(
      emptySummary
    );
    vi.spyOn(dashboardService, "getMyTasks").mockResolvedValueOnce(emptyTasks);
    vi.spyOn(dashboardService, "getOverdueUpcoming").mockResolvedValueOnce(
      emptyOverdueUpcoming
    );
    vi.spyOn(dashboardService, "getActivity").mockResolvedValueOnce(
      emptyActivity
    );

    render(<DashboardPage />);

    await waitFor(() => {
      expect(
        screen.queryByTestId("dashboard-skeleton")
      ).not.toBeInTheDocument();
    });

    expect(screen.getByTestId("overdue-empty-state")).toBeInTheDocument();
    expect(screen.getByTestId("upcoming-empty-state")).toBeInTheDocument();
    expect(screen.getByTestId("activity-empty-state")).toBeInTheDocument();
    expect(screen.getByText("No tasks found")).toBeInTheDocument();
  });

  it("displays error banner when an API request fails and allows retry", async () => {
    const apiError = new ApiClientError(500, {
      error: {
        code: "SERVER_ERROR",
        message: "Failed to load dashboard metrics from database",
        request_id: "req_test_fail",
      },
    });

    const summarySpy = vi
      .spyOn(dashboardService, "getSummary")
      .mockRejectedValueOnce(apiError)
      .mockResolvedValueOnce(mockSummary);
    vi.spyOn(dashboardService, "getMyTasks").mockResolvedValue(
      mockTasksResponse
    );
    vi.spyOn(dashboardService, "getOverdueUpcoming").mockResolvedValue(
      mockOverdueUpcoming
    );
    vi.spyOn(dashboardService, "getActivity").mockResolvedValue(mockActivity);

    const user = userEvent.setup();
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(
        screen.getByText("Failed to load dashboard metrics from database")
      ).toBeInTheDocument();
    });

    // Retry with Try Again button
    await user.click(screen.getByRole("button", { name: "Try Again" }));

    await waitFor(() => {
      expect(summarySpy).toHaveBeenCalledTimes(2);
      expect(screen.getByText("Total Projects")).toBeInTheDocument();
    });
  });

  it("handles filtering by status and project in My Tasks table", async () => {
    vi.spyOn(dashboardService, "getSummary").mockResolvedValue(mockSummary);
    const getTasksSpy = vi
      .spyOn(dashboardService, "getMyTasks")
      .mockResolvedValue(mockTasksResponse);
    vi.spyOn(dashboardService, "getOverdueUpcoming").mockResolvedValue(
      mockOverdueUpcoming
    );
    vi.spyOn(dashboardService, "getActivity").mockResolvedValue(mockActivity);

    const user = userEvent.setup();
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getAllByTestId("task-row")[0]).toHaveTextContent(
        "Fix database connection leak"
      );
    });

    // Change status filter
    const statusSelect = screen.getByLabelText("Filter tasks by status");
    await user.selectOptions(statusSelect, "in_progress");

    await waitFor(() => {
      expect(getTasksSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "in_progress",
          page: 1,
        })
      );
    });

    // Change project filter
    const projectSelect = screen.getByLabelText("Filter tasks by project");
    await user.selectOptions(projectSelect, "p1");

    await waitFor(() => {
      expect(getTasksSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          project_id: "p1",
          page: 1,
        })
      );
    });
  });
});
