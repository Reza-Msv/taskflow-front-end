import { apiClient } from "@/services/api-client";
import type {
  ProjectResponse,
  ProjectListResponse,
  ProjectCreateRequest,
  ProjectUpdateRequest,
  ProjectMembershipResponse,
  ProjectMembershipListResponse,
  AddProjectMembershipRequest,
  UpdateProjectMembershipRoleRequest,
  MessageResponse,
} from "@/services/generated/api-types";

export interface ProjectQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  is_archived?: boolean;
}

export interface ProjectMembersQueryParams {
  page?: number;
  page_size?: number;
}

export const PROJECT_ENDPOINTS = {
  projects: (orgId: string) =>
    `/api/v1/organizations/${encodeURIComponent(orgId)}/projects`,
  project: (orgId: string, projectId: string) =>
    `/api/v1/organizations/${encodeURIComponent(orgId)}/projects/${encodeURIComponent(projectId)}`,
  members: (orgId: string, projectId: string) =>
    `/api/v1/organizations/${encodeURIComponent(orgId)}/projects/${encodeURIComponent(projectId)}/members`,
  member: (orgId: string, projectId: string, userId: string) =>
    `/api/v1/organizations/${encodeURIComponent(orgId)}/projects/${encodeURIComponent(projectId)}/members/${encodeURIComponent(userId)}`,
} as const;

export const projectService = {
  /**
   * List projects in organization visible to user
   */
  async getProjects(
    orgId: string,
    params: ProjectQueryParams = {}
  ): Promise<ProjectListResponse> {
    const searchParams = new URLSearchParams();
    if (params.page !== undefined) {
      searchParams.set("page", params.page.toString());
    }
    if (params.page_size !== undefined) {
      searchParams.set("page_size", params.page_size.toString());
    }
    if (params.search?.trim()) {
      searchParams.set("search", params.search.trim());
    }
    if (params.is_archived !== undefined) {
      searchParams.set("is_archived", String(params.is_archived));
    }

    const query = searchParams.toString();
    const url = query
      ? `${PROJECT_ENDPOINTS.projects(orgId)}?${query}`
      : PROJECT_ENDPOINTS.projects(orgId);

    return apiClient<ProjectListResponse>(url, {
      method: "GET",
    });
  },

  /**
   * Create a project in the organization (creator becomes owner & admin)
   */
  async createProject(
    orgId: string,
    payload: ProjectCreateRequest
  ): Promise<ProjectResponse> {
    return apiClient<ProjectResponse>(PROJECT_ENDPOINTS.projects(orgId), {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Retrieve project details
   */
  async getProject(orgId: string, projectId: string): Promise<ProjectResponse> {
    return apiClient<ProjectResponse>(
      PROJECT_ENDPOINTS.project(orgId, projectId),
      {
        method: "GET",
      }
    );
  },

  /**
   * Update project metadata or archive status
   */
  async updateProject(
    orgId: string,
    projectId: string,
    payload: ProjectUpdateRequest
  ): Promise<ProjectResponse> {
    return apiClient<ProjectResponse>(
      PROJECT_ENDPOINTS.project(orgId, projectId),
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * Delete project
   */
  async deleteProject(
    orgId: string,
    projectId: string
  ): Promise<MessageResponse> {
    return apiClient<MessageResponse>(
      PROJECT_ENDPOINTS.project(orgId, projectId),
      {
        method: "DELETE",
      }
    );
  },

  /**
   * List project members
   */
  async getMembers(
    orgId: string,
    projectId: string,
    params: ProjectMembersQueryParams = {}
  ): Promise<ProjectMembershipListResponse> {
    const searchParams = new URLSearchParams();
    if (params.page !== undefined) {
      searchParams.set("page", params.page.toString());
    }
    if (params.page_size !== undefined) {
      searchParams.set("page_size", params.page_size.toString());
    }

    const query = searchParams.toString();
    const url = query
      ? `${PROJECT_ENDPOINTS.members(orgId, projectId)}?${query}`
      : PROJECT_ENDPOINTS.members(orgId, projectId);

    return apiClient<ProjectMembershipListResponse>(url, {
      method: "GET",
    });
  },

  /**
   * Add organization member to project
   */
  async addMember(
    orgId: string,
    projectId: string,
    payload: AddProjectMembershipRequest
  ): Promise<ProjectMembershipResponse> {
    return apiClient<ProjectMembershipResponse>(
      PROJECT_ENDPOINTS.members(orgId, projectId),
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * Update project member role
   */
  async updateMemberRole(
    orgId: string,
    projectId: string,
    userId: string,
    payload: UpdateProjectMembershipRoleRequest
  ): Promise<ProjectMembershipResponse> {
    return apiClient<ProjectMembershipResponse>(
      PROJECT_ENDPOINTS.member(orgId, projectId, userId),
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * Remove member from project
   */
  async removeMember(
    orgId: string,
    projectId: string,
    userId: string
  ): Promise<MessageResponse> {
    return apiClient<MessageResponse>(
      PROJECT_ENDPOINTS.member(orgId, projectId, userId),
      {
        method: "DELETE",
      }
    );
  },
};
