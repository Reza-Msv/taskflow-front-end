import { apiClient } from "@/services/api-client";
import type {
  WorkItemResponse,
  WorkItemListResponse,
  WorkItemCreateRequest,
  WorkItemUpdateRequest,
  TaskStatusMoveRequest,
  KanbanBoardResponse,
  WorkItemHistoryListResponse,
} from "@/services/generated/api-types";

export interface TaskQueryParams {
  status?: string;
  assignee_id?: string;
  priority?: string;
  type?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface TaskHistoryQueryParams {
  page?: number;
  page_size?: number;
}

export const TASK_ENDPOINTS = {
  tasks: (orgId: string, projectId: string) =>
    `/api/v1/organizations/${encodeURIComponent(orgId)}/projects/${encodeURIComponent(projectId)}/tasks`,
  task: (orgId: string, projectId: string, taskId: string) =>
    `/api/v1/organizations/${encodeURIComponent(orgId)}/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}`,
  kanban: (orgId: string, projectId: string) =>
    `/api/v1/organizations/${encodeURIComponent(orgId)}/projects/${encodeURIComponent(projectId)}/kanban`,
  move: (orgId: string, projectId: string, taskId: string) =>
    `/api/v1/organizations/${encodeURIComponent(orgId)}/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}/move`,
  history: (orgId: string, projectId: string, taskId: string) =>
    `/api/v1/organizations/${encodeURIComponent(orgId)}/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}/history`,
} as const;

export const taskService = {
  /**
   * Get kanban board with columns and ordered tasks
   */
  async getKanbanBoard(
    orgId: string,
    projectId: string
  ): Promise<KanbanBoardResponse> {
    return apiClient<KanbanBoardResponse>(
      TASK_ENDPOINTS.kanban(orgId, projectId),
      {
        method: "GET",
      }
    );
  },

  /**
   * List tasks for a project with optional filters and pagination
   */
  async getTasks(
    orgId: string,
    projectId: string,
    params: TaskQueryParams = {}
  ): Promise<WorkItemListResponse> {
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
    if (params.assignee_id?.trim()) {
      searchParams.set("assignee_id", params.assignee_id.trim());
    }
    if (params.priority?.trim()) {
      searchParams.set("priority", params.priority.trim());
    }
    if (params.type?.trim()) {
      searchParams.set("type", params.type.trim());
    }
    if (params.search?.trim()) {
      searchParams.set("search", params.search.trim());
    }

    const query = searchParams.toString();
    const url = query
      ? `${TASK_ENDPOINTS.tasks(orgId, projectId)}?${query}`
      : TASK_ENDPOINTS.tasks(orgId, projectId);

    return apiClient<WorkItemListResponse>(url, {
      method: "GET",
    });
  },

  /**
   * Get single task details
   */
  async getTask(
    orgId: string,
    projectId: string,
    taskId: string
  ): Promise<WorkItemResponse> {
    return apiClient<WorkItemResponse>(
      TASK_ENDPOINTS.task(orgId, projectId, taskId),
      {
        method: "GET",
      }
    );
  },

  /**
   * Create a new task in project
   */
  async createTask(
    orgId: string,
    projectId: string,
    payload: WorkItemCreateRequest
  ): Promise<WorkItemResponse> {
    return apiClient<WorkItemResponse>(TASK_ENDPOINTS.tasks(orgId, projectId), {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Update task fields (with optimistic concurrency check via version)
   */
  async updateTask(
    orgId: string,
    projectId: string,
    taskId: string,
    payload: WorkItemUpdateRequest
  ): Promise<WorkItemResponse> {
    return apiClient<WorkItemResponse>(
      TASK_ENDPOINTS.task(orgId, projectId, taskId),
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * Move task across kanban columns or reorder rank
   */
  async moveTask(
    orgId: string,
    projectId: string,
    taskId: string,
    payload: TaskStatusMoveRequest
  ): Promise<WorkItemResponse> {
    return apiClient<WorkItemResponse>(
      TASK_ENDPOINTS.move(orgId, projectId, taskId),
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * Delete task
   */
  async deleteTask(
    orgId: string,
    projectId: string,
    taskId: string
  ): Promise<void> {
    await apiClient<void>(TASK_ENDPOINTS.task(orgId, projectId, taskId), {
      method: "DELETE",
    });
  },

  /**
   * Get task audit history
   */
  async getTaskHistory(
    orgId: string,
    projectId: string,
    taskId: string,
    params: TaskHistoryQueryParams = {}
  ): Promise<WorkItemHistoryListResponse> {
    const searchParams = new URLSearchParams();
    if (params.page !== undefined) {
      searchParams.set("page", params.page.toString());
    }
    if (params.page_size !== undefined) {
      searchParams.set("page_size", params.page_size.toString());
    }

    const query = searchParams.toString();
    const url = query
      ? `${TASK_ENDPOINTS.history(orgId, projectId, taskId)}?${query}`
      : TASK_ENDPOINTS.history(orgId, projectId, taskId);

    return apiClient<WorkItemHistoryListResponse>(url, {
      method: "GET",
    });
  },
};
