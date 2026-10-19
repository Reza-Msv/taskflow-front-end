import { apiClient } from "@/services/api-client";
import type {
  DashboardSummaryResponse,
  WorkItemListDashboardResponse,
  OverdueUpcomingTasksResponse,
  UserActivityListResponse,
} from "@/services/generated/api-types";

export interface DashboardTasksQueryParams {
  page?: number;
  page_size?: number;
  status?: string;
  project_id?: string;
  due_date_from?: string;
  due_date_to?: string;
  sort_by?:
    "smart_order" | "due_date" | "priority" | "created_at" | "updated_at";
  sort_dir?: "asc" | "desc";
}

export interface OverdueUpcomingQueryParams {
  upcoming_days?: number;
  limit?: number;
}

export interface ActivityQueryParams {
  page?: number;
  page_size?: number;
}

export const DASHBOARD_ENDPOINTS = {
  summary: "/api/v1/dashboard/summary",
  tasks: "/api/v1/dashboard/tasks",
  overdueUpcoming: "/api/v1/dashboard/tasks/overdue-upcoming",
  activity: "/api/v1/dashboard/activity",
} as const;

export const dashboardService = {
  /**
   * Fetch aggregated summary metrics for the authenticated user
   */
  async getSummary(): Promise<DashboardSummaryResponse> {
    return apiClient<DashboardSummaryResponse>(DASHBOARD_ENDPOINTS.summary, {
      method: "GET",
    });
  },

  /**
   * Fetch paginated and filtered tasks assigned to the user
   */
  async getMyTasks(
    params: DashboardTasksQueryParams = {}
  ): Promise<WorkItemListDashboardResponse> {
    const searchParams = new URLSearchParams();
    if (params.page !== undefined) {
      searchParams.set("page", params.page.toString());
    }
    if (params.page_size !== undefined) {
      searchParams.set("page_size", params.page_size.toString());
    }
    if (params.status?.trim()) {
      searchParams.set("status", params.status.trim());
    }
    if (params.project_id?.trim()) {
      searchParams.set("project_id", params.project_id.trim());
    }
    if (params.due_date_from?.trim()) {
      searchParams.set("due_date_from", params.due_date_from.trim());
    }
    if (params.due_date_to?.trim()) {
      searchParams.set("due_date_to", params.due_date_to.trim());
    }
    if (params.sort_by) {
      searchParams.set("sort_by", params.sort_by);
    }
    if (params.sort_dir) {
      searchParams.set("sort_dir", params.sort_dir);
    }

    const query = searchParams.toString();
    const url = query
      ? `${DASHBOARD_ENDPOINTS.tasks}?${query}`
      : DASHBOARD_ENDPOINTS.tasks;

    return apiClient<WorkItemListDashboardResponse>(url, {
      method: "GET",
    });
  },

  /**
   * Fetch grouped overdue and upcoming tasks
   */
  async getOverdueUpcoming(
    params: OverdueUpcomingQueryParams = {}
  ): Promise<OverdueUpcomingTasksResponse> {
    const searchParams = new URLSearchParams();
    if (params.upcoming_days !== undefined) {
      searchParams.set("upcoming_days", params.upcoming_days.toString());
    }
    if (params.limit !== undefined) {
      searchParams.set("limit", params.limit.toString());
    }

    const query = searchParams.toString();
    const url = query
      ? `${DASHBOARD_ENDPOINTS.overdueUpcoming}?${query}`
      : DASHBOARD_ENDPOINTS.overdueUpcoming;

    return apiClient<OverdueUpcomingTasksResponse>(url, {
      method: "GET",
    });
  },

  /**
   * Fetch recent user activity stream
   */
  async getActivity(
    params: ActivityQueryParams = {}
  ): Promise<UserActivityListResponse> {
    const searchParams = new URLSearchParams();
    if (params.page !== undefined) {
      searchParams.set("page", params.page.toString());
    }
    if (params.page_size !== undefined) {
      searchParams.set("page_size", params.page_size.toString());
    }

    const query = searchParams.toString();
    const url = query
      ? `${DASHBOARD_ENDPOINTS.activity}?${query}`
      : DASHBOARD_ENDPOINTS.activity;

    return apiClient<UserActivityListResponse>(url, {
      method: "GET",
    });
  },
};
