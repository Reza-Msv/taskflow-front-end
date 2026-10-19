import { describe, it, expect, vi, beforeEach } from "vitest";
import { dashboardService, DASHBOARD_ENDPOINTS } from "./dashboard-service";
import * as apiClientModule from "./api-client";
import type {
  DashboardSummaryResponse,
  WorkItemListDashboardResponse,
  OverdueUpcomingTasksResponse,
  UserActivityListResponse,
} from "./generated/api-types";

describe("dashboardService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("calls getSummary on the correct endpoint", async () => {
    const mockSummary: DashboardSummaryResponse = {
      total_projects: 2,
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
      ],
      status_counts: { todo: 2, in_progress: 1, done: 1 },
      assigned_tasks_count: 4,
      in_progress_tasks_count: 1,
      completed_tasks_count: 1,
      overdue_tasks_count: 1,
    };

    const apiClientSpy = vi
      .spyOn(apiClientModule, "apiClient")
      .mockResolvedValueOnce(mockSummary);

    const result = await dashboardService.getSummary();

    expect(apiClientSpy).toHaveBeenCalledWith(DASHBOARD_ENDPOINTS.summary, {
      method: "GET",
    });
    expect(result).toEqual(mockSummary);
  });

  it("calls getMyTasks with query parameters formatted correctly", async () => {
    const mockTaskList: WorkItemListDashboardResponse = {
      items: [],
      total: 0,
      page: 1,
      page_size: 10,
      total_pages: 0,
    };

    const apiClientSpy = vi
      .spyOn(apiClientModule, "apiClient")
      .mockResolvedValueOnce(mockTaskList);

    const result = await dashboardService.getMyTasks({
      page: 2,
      page_size: 10,
      status: "in_progress",
      project_id: "proj-123",
      due_date_from: "2026-10-01T00:00:00Z",
      due_date_to: "2026-10-31T23:59:59Z",
      sort_by: "smart_order",
      sort_dir: "asc",
    });

    expect(apiClientSpy).toHaveBeenCalledWith(
      `${DASHBOARD_ENDPOINTS.tasks}?page=2&page_size=10&status=in_progress&project_id=proj-123&due_date_from=2026-10-01T00%3A00%3A00Z&due_date_to=2026-10-31T23%3A59%3A59Z&sort_by=smart_order&sort_dir=asc`,
      { method: "GET" }
    );
    expect(result).toEqual(mockTaskList);
  });

  it("calls getOverdueUpcoming with upcoming_days and limit parameters", async () => {
    const mockOverdueUpcoming: OverdueUpcomingTasksResponse = {
      overdue_tasks: [],
      upcoming_tasks: [],
    };

    const apiClientSpy = vi
      .spyOn(apiClientModule, "apiClient")
      .mockResolvedValueOnce(mockOverdueUpcoming);

    const result = await dashboardService.getOverdueUpcoming({
      upcoming_days: 14,
      limit: 10,
    });

    expect(apiClientSpy).toHaveBeenCalledWith(
      `${DASHBOARD_ENDPOINTS.overdueUpcoming}?upcoming_days=14&limit=10`,
      { method: "GET" }
    );
    expect(result).toEqual(mockOverdueUpcoming);
  });

  it("calls getActivity with page and page_size parameters", async () => {
    const mockActivity: UserActivityListResponse = {
      items: [],
      total: 0,
      page: 1,
      page_size: 25,
      total_pages: 0,
    };

    const apiClientSpy = vi
      .spyOn(apiClientModule, "apiClient")
      .mockResolvedValueOnce(mockActivity);

    const result = await dashboardService.getActivity({
      page: 1,
      page_size: 25,
    });

    expect(apiClientSpy).toHaveBeenCalledWith(
      `${DASHBOARD_ENDPOINTS.activity}?page=1&page_size=25`,
      { method: "GET" }
    );
    expect(result).toEqual(mockActivity);
  });
});
