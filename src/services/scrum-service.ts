import { apiClient } from "@/services/api-client";
import type {
  SprintResponse,
  SprintListResponse,
  SprintCreateRequest,
  SprintUpdateRequest,
  SprintStartRequest,
  SprintCompleteRequest,
  SprintAssignTasksRequest,
  BacklogMoveTasksRequest,
  BacklogReorderRequest,
  BacklogSummaryResponse,
  EstimateTaskRequest,
  SprintSummaryResponse,
  SprintBurndownResponse,
  ProjectVelocityResponse,
  SprintRetrospectiveRequest,
  SprintRetrospectiveResponse,
  WorkItemResponse,
  WorkItemListResponse,
} from "@/services/generated/api-types";

export interface BacklogQueryParams {
  status?: string;
  priority?: string;
  assignee_id?: string;
  type?: string;
  search?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
}

export interface SprintListQueryParams {
  status?: string;
}

export interface SprintTasksQueryParams {
  page?: number;
  page_size?: number;
}

export const SCRUM_ENDPOINTS = {
  backlog: (orgId: string, projectId: string) =>
    `/api/v1/organizations/${encodeURIComponent(orgId)}/projects/${encodeURIComponent(projectId)}/backlog`,
  backlogTasks: (orgId: string, projectId: string) =>
    `/api/v1/organizations/${encodeURIComponent(orgId)}/projects/${encodeURIComponent(projectId)}/backlog/tasks`,
  backlogReorder: (orgId: string, projectId: string) =>
    `/api/v1/organizations/${encodeURIComponent(orgId)}/projects/${encodeURIComponent(projectId)}/backlog/reorder`,
  sprints: (orgId: string, projectId: string) =>
    `/api/v1/organizations/${encodeURIComponent(orgId)}/projects/${encodeURIComponent(projectId)}/sprints`,
  sprint: (orgId: string, projectId: string, sprintId: string) =>
    `/api/v1/organizations/${encodeURIComponent(orgId)}/projects/${encodeURIComponent(projectId)}/sprints/${encodeURIComponent(sprintId)}`,
  sprintStart: (orgId: string, projectId: string, sprintId: string) =>
    `/api/v1/organizations/${encodeURIComponent(orgId)}/projects/${encodeURIComponent(projectId)}/sprints/${encodeURIComponent(sprintId)}/start`,
  sprintComplete: (orgId: string, projectId: string, sprintId: string) =>
    `/api/v1/organizations/${encodeURIComponent(orgId)}/projects/${encodeURIComponent(projectId)}/sprints/${encodeURIComponent(sprintId)}/complete`,
  sprintTasks: (orgId: string, projectId: string, sprintId: string) =>
    `/api/v1/organizations/${encodeURIComponent(orgId)}/projects/${encodeURIComponent(projectId)}/sprints/${encodeURIComponent(sprintId)}/tasks`,
  sprintTask: (orgId: string, projectId: string, sprintId: string, taskId: string) =>
    `/api/v1/organizations/${encodeURIComponent(orgId)}/projects/${encodeURIComponent(projectId)}/sprints/${encodeURIComponent(sprintId)}/tasks/${encodeURIComponent(taskId)}`,
  taskEstimate: (orgId: string, projectId: string, taskId: string) =>
    `/api/v1/organizations/${encodeURIComponent(orgId)}/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}/estimate`,
  sprintSummary: (orgId: string, projectId: string, sprintId: string) =>
    `/api/v1/organizations/${encodeURIComponent(orgId)}/projects/${encodeURIComponent(projectId)}/sprints/${encodeURIComponent(sprintId)}/summary`,
  sprintBurndown: (orgId: string, projectId: string, sprintId: string) =>
    `/api/v1/organizations/${encodeURIComponent(orgId)}/projects/${encodeURIComponent(projectId)}/sprints/${encodeURIComponent(sprintId)}/burndown`,
  projectVelocity: (orgId: string, projectId: string) =>
    `/api/v1/organizations/${encodeURIComponent(orgId)}/projects/${encodeURIComponent(projectId)}/sprints/velocity`,
  sprintRetrospective: (orgId: string, projectId: string, sprintId: string) =>
    `/api/v1/organizations/${encodeURIComponent(orgId)}/projects/${encodeURIComponent(projectId)}/sprints/${encodeURIComponent(sprintId)}/retrospective`,
} as const;

export const scrumService = {
  /**
   * Retrieve Product Backlog tasks with aggregated metrics
   */
  async getBacklog(
    orgId: string,
    projectId: string,
    params: BacklogQueryParams = {}
  ): Promise<BacklogSummaryResponse> {
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
    if (params.priority?.trim()) {
      searchParams.set("priority", params.priority.trim());
    }
    if (params.assignee_id?.trim()) {
      searchParams.set("assignee_id", params.assignee_id.trim());
    }
    if (params.type?.trim()) {
      searchParams.set("type", params.type.trim());
    }
    if (params.search?.trim()) {
      searchParams.set("search", params.search.trim());
    }
    if (params.sort_by?.trim()) {
      searchParams.set("sort_by", params.sort_by.trim());
    }
    if (params.sort_dir) {
      searchParams.set("sort_dir", params.sort_dir);
    }

    const query = searchParams.toString();
    const url = query
      ? `${SCRUM_ENDPOINTS.backlog(orgId, projectId)}?${query}`
      : SCRUM_ENDPOINTS.backlog(orgId, projectId);

    return apiClient<BacklogSummaryResponse>(url, {
      method: "GET",
    });
  },

  /**
   * Move tasks back to Product Backlog (unassigning from sprints)
   */
  async moveTasksToBacklog(
    orgId: string,
    projectId: string,
    payload: BacklogMoveTasksRequest
  ): Promise<WorkItemResponse[]> {
    return apiClient<WorkItemResponse[]>(
      SCRUM_ENDPOINTS.backlogTasks(orgId, projectId),
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * Reprioritize and reorder Product Backlog tasks
   */
  async reorderBacklog(
    orgId: string,
    projectId: string,
    payload: BacklogReorderRequest
  ): Promise<WorkItemResponse[]> {
    return apiClient<WorkItemResponse[]>(
      SCRUM_ENDPOINTS.backlogReorder(orgId, projectId),
      {
        method: "PUT",
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * Create a new sprint in draft status
   */
  async createSprint(
    orgId: string,
    projectId: string,
    payload: SprintCreateRequest
  ): Promise<SprintResponse> {
    return apiClient<SprintResponse>(
      SCRUM_ENDPOINTS.sprints(orgId, projectId),
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * List sprints belonging to a project
   */
  async listSprints(
    orgId: string,
    projectId: string,
    params: SprintListQueryParams = {}
  ): Promise<SprintListResponse> {
    const searchParams = new URLSearchParams();
    if (params.status?.trim()) {
      searchParams.set("status", params.status.trim());
    }
    const query = searchParams.toString();
    const url = query
      ? `${SCRUM_ENDPOINTS.sprints(orgId, projectId)}?${query}`
      : SCRUM_ENDPOINTS.sprints(orgId, projectId);

    return apiClient<SprintListResponse>(url, {
      method: "GET",
    });
  },

  /**
   * Retrieve single sprint details
   */
  async getSprint(
    orgId: string,
    projectId: string,
    sprintId: string
  ): Promise<SprintResponse> {
    return apiClient<SprintResponse>(
      SCRUM_ENDPOINTS.sprint(orgId, projectId, sprintId),
      {
        method: "GET",
      }
    );
  },

  /**
   * Update mutable sprint attributes
   */
  async updateSprint(
    orgId: string,
    projectId: string,
    sprintId: string,
    payload: SprintUpdateRequest
  ): Promise<SprintResponse> {
    return apiClient<SprintResponse>(
      SCRUM_ENDPOINTS.sprint(orgId, projectId, sprintId),
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * Delete sprint safely (all tasks returned to backlog)
   */
  async deleteSprint(
    orgId: string,
    projectId: string,
    sprintId: string
  ): Promise<{ message: string }> {
    return apiClient<{ message: string }>(
      SCRUM_ENDPOINTS.sprint(orgId, projectId, sprintId),
      {
        method: "DELETE",
      }
    );
  },

  /**
   * Start a sprint (draft -> active)
   */
  async startSprint(
    orgId: string,
    projectId: string,
    sprintId: string,
    payload: SprintStartRequest = {}
  ): Promise<SprintResponse> {
    return apiClient<SprintResponse>(
      SCRUM_ENDPOINTS.sprintStart(orgId, projectId, sprintId),
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * Complete an active sprint (active -> completed)
   */
  async completeSprint(
    orgId: string,
    projectId: string,
    sprintId: string,
    payload: SprintCompleteRequest
  ): Promise<SprintResponse> {
    return apiClient<SprintResponse>(
      SCRUM_ENDPOINTS.sprintComplete(orgId, projectId, sprintId),
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * List tasks assigned to a specific sprint
   */
  async listSprintTasks(
    orgId: string,
    projectId: string,
    sprintId: string,
    params: SprintTasksQueryParams = {}
  ): Promise<WorkItemListResponse> {
    const searchParams = new URLSearchParams();
    if (params.page !== undefined) {
      searchParams.set("page", params.page.toString());
    }
    if (params.page_size !== undefined) {
      searchParams.set("page_size", params.page_size.toString());
    }
    const query = searchParams.toString();
    const url = query
      ? `${SCRUM_ENDPOINTS.sprintTasks(orgId, projectId, sprintId)}?${query}`
      : SCRUM_ENDPOINTS.sprintTasks(orgId, projectId, sprintId);

    return apiClient<WorkItemListResponse>(url, {
      method: "GET",
    });
  },

  /**
   * Assign tasks to a sprint
   */
  async assignTasksToSprint(
    orgId: string,
    projectId: string,
    sprintId: string,
    payload: SprintAssignTasksRequest
  ): Promise<WorkItemResponse[]> {
    return apiClient<WorkItemResponse[]>(
      SCRUM_ENDPOINTS.sprintTasks(orgId, projectId, sprintId),
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * Remove a task from a sprint (returning to backlog)
   */
  async removeTaskFromSprint(
    orgId: string,
    projectId: string,
    sprintId: string,
    taskId: string
  ): Promise<WorkItemResponse> {
    return apiClient<WorkItemResponse>(
      SCRUM_ENDPOINTS.sprintTask(orgId, projectId, sprintId, taskId),
      {
        method: "DELETE",
      }
    );
  },

  /**
   * Estimate story points for a task
   */
  async estimateTask(
    orgId: string,
    projectId: string,
    taskId: string,
    payload: EstimateTaskRequest
  ): Promise<WorkItemResponse> {
    return apiClient<WorkItemResponse>(
      SCRUM_ENDPOINTS.taskEstimate(orgId, projectId, taskId),
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * Get sprint progress and points summary
   */
  async getSprintSummary(
    orgId: string,
    projectId: string,
    sprintId: string
  ): Promise<SprintSummaryResponse> {
    return apiClient<SprintSummaryResponse>(
      SCRUM_ENDPOINTS.sprintSummary(orgId, projectId, sprintId),
      {
        method: "GET",
      }
    );
  },

  /**
   * Get sprint burndown data series
   */
  async getSprintBurndown(
    orgId: string,
    projectId: string,
    sprintId: string
  ): Promise<SprintBurndownResponse> {
    return apiClient<SprintBurndownResponse>(
      SCRUM_ENDPOINTS.sprintBurndown(orgId, projectId, sprintId),
      {
        method: "GET",
      }
    );
  },

  /**
   * Get project velocity across completed sprints
   */
  async getProjectVelocity(
    orgId: string,
    projectId: string
  ): Promise<ProjectVelocityResponse> {
    return apiClient<ProjectVelocityResponse>(
      SCRUM_ENDPOINTS.projectVelocity(orgId, projectId),
      {
        method: "GET",
      }
    );
  },

  /**
   * Retrieve retrospective for a sprint
   */
  async getSprintRetrospective(
    orgId: string,
    projectId: string,
    sprintId: string
  ): Promise<SprintRetrospectiveResponse | null> {
    return apiClient<SprintRetrospectiveResponse | null>(
      SCRUM_ENDPOINTS.sprintRetrospective(orgId, projectId, sprintId),
      {
        method: "GET",
      }
    );
  },

  /**
   * Save or update sprint retrospective
   */
  async saveSprintRetrospective(
    orgId: string,
    projectId: string,
    sprintId: string,
    payload: SprintRetrospectiveRequest
  ): Promise<SprintRetrospectiveResponse> {
    return apiClient<SprintRetrospectiveResponse>(
      SCRUM_ENDPOINTS.sprintRetrospective(orgId, projectId, sprintId),
      {
        method: "PUT",
        body: JSON.stringify(payload),
      }
    );
  },
};
