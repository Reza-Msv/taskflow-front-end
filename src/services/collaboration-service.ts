import { apiClient } from "@/services/api-client";
import type {
  WorkItemCommentResponse,
  WorkItemCommentListResponse,
  CommentCreateRequest,
  CommentUpdateRequest,
  MentionableUserResponse,
} from "@/services/generated/api-types";

export interface CommentQueryParams {
  page?: number;
  page_size?: number;
}

export const COLLABORATION_ENDPOINTS = {
  comments: (orgId: string, projectId: string, taskId: string) =>
    `/api/v1/organizations/${encodeURIComponent(orgId)}/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}/comments`,
  comment: (
    orgId: string,
    projectId: string,
    taskId: string,
    commentId: string
  ) =>
    `/api/v1/organizations/${encodeURIComponent(orgId)}/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}/comments/${encodeURIComponent(commentId)}`,
  mentionableMembers: (orgId: string, projectId: string, taskId: string) =>
    `/api/v1/organizations/${encodeURIComponent(orgId)}/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}/mentionable-members`,
} as const;

export const collaborationService = {
  /**
   * List paginated comments for a task
   */
  async getComments(
    orgId: string,
    projectId: string,
    taskId: string,
    params: CommentQueryParams = {}
  ): Promise<WorkItemCommentListResponse> {
    const searchParams = new URLSearchParams();
    if (params.page !== undefined) {
      searchParams.set("page", params.page.toString());
    }
    if (params.page_size !== undefined) {
      searchParams.set("page_size", params.page_size.toString());
    }

    const query = searchParams.toString();
    const url = query
      ? `${COLLABORATION_ENDPOINTS.comments(orgId, projectId, taskId)}?${query}`
      : COLLABORATION_ENDPOINTS.comments(orgId, projectId, taskId);

    return apiClient<WorkItemCommentListResponse>(url, {
      method: "GET",
    });
  },

  /**
   * Create a new comment on a task (with structured mentions)
   */
  async createComment(
    orgId: string,
    projectId: string,
    taskId: string,
    payload: CommentCreateRequest
  ): Promise<WorkItemCommentResponse> {
    return apiClient<WorkItemCommentResponse>(
      COLLABORATION_ENDPOINTS.comments(orgId, projectId, taskId),
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * Update an existing comment
   */
  async updateComment(
    orgId: string,
    projectId: string,
    taskId: string,
    commentId: string,
    payload: CommentUpdateRequest
  ): Promise<WorkItemCommentResponse> {
    return apiClient<WorkItemCommentResponse>(
      COLLABORATION_ENDPOINTS.comment(orgId, projectId, taskId, commentId),
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * Delete a comment
   */
  async deleteComment(
    orgId: string,
    projectId: string,
    taskId: string,
    commentId: string
  ): Promise<void> {
    await apiClient<void>(
      COLLABORATION_ENDPOINTS.comment(orgId, projectId, taskId, commentId),
      {
        method: "DELETE",
      }
    );
  },

  /**
   * Get eligible members for @-mention autocomplete
   */
  async getMentionableMembers(
    orgId: string,
    projectId: string,
    taskId: string,
    search?: string
  ): Promise<MentionableUserResponse[]> {
    const searchParams = new URLSearchParams();
    if (search && search.trim()) {
      searchParams.set("search", search.trim());
    }

    const query = searchParams.toString();
    const url = query
      ? `${COLLABORATION_ENDPOINTS.mentionableMembers(orgId, projectId, taskId)}?${query}`
      : COLLABORATION_ENDPOINTS.mentionableMembers(orgId, projectId, taskId);

    return apiClient<MentionableUserResponse[]>(url, {
      method: "GET",
    });
  },
};
