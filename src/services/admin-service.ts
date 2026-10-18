import { apiClient } from "@/services/api-client";
import type {
  AdminOverviewResponse,
  UserListResponse,
  UserResponse,
  UserUpdateAdminRequest,
  OrganizationListResponse,
  OrganizationResponse,
  OrganizationCreateRequest,
  OrganizationUpdateRequest,
  OrganizationMembershipListResponse,
  OrganizationMembershipResponse,
  AddMembershipRequest,
  UpdateMembershipRoleRequest,
  MessageResponse,
} from "@/services/generated/api-types";

export interface UserQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
  is_superuser?: boolean;
}

export interface OrganizationQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
}

export const ADMIN_ENDPOINTS = {
  overview: "/api/v1/admin/overview",
  users: "/api/v1/admin/users",
  user: (userId: string) => `/api/v1/admin/users/${encodeURIComponent(userId)}`,
  organizations: "/api/v1/admin/organizations",
  organization: (orgId: string) =>
    `/api/v1/admin/organizations/${encodeURIComponent(orgId)}`,
  members: (orgId: string) =>
    `/api/v1/admin/organizations/${encodeURIComponent(orgId)}/members`,
  member: (orgId: string, userId: string) =>
    `/api/v1/admin/organizations/${encodeURIComponent(orgId)}/members/${encodeURIComponent(userId)}`,
} as const;

export const adminService = {
  /**
   * Fetch aggregated system metrics for the admin overview
   */
  async getOverview(): Promise<AdminOverviewResponse> {
    return apiClient<AdminOverviewResponse>(ADMIN_ENDPOINTS.overview, {
      method: "GET",
    });
  },

  /**
   * Fetch paginated list of users with optional filtering and search
   */
  async getUsers(params: UserQueryParams = {}): Promise<UserListResponse> {
    const searchParams = new URLSearchParams();
    if (params.page !== undefined)
      searchParams.set("page", params.page.toString());
    if (params.page_size !== undefined)
      searchParams.set("page_size", params.page_size.toString());
    if (params.search?.trim()) searchParams.set("search", params.search.trim());
    if (params.is_active !== undefined)
      searchParams.set("is_active", String(params.is_active));
    if (params.is_superuser !== undefined)
      searchParams.set("is_superuser", String(params.is_superuser));

    const queryString = searchParams.toString();
    const url = queryString
      ? `${ADMIN_ENDPOINTS.users}?${queryString}`
      : ADMIN_ENDPOINTS.users;

    return apiClient<UserListResponse>(url, {
      method: "GET",
    });
  },

  /**
   * Fetch details for a specific user
   */
  async getUser(userId: string): Promise<UserResponse> {
    return apiClient<UserResponse>(ADMIN_ENDPOINTS.user(userId), {
      method: "GET",
    });
  },

  /**
   * Update user details or active/superuser status
   */
  async updateUser(
    userId: string,
    payload: UserUpdateAdminRequest
  ): Promise<UserResponse> {
    return apiClient<UserResponse>(ADMIN_ENDPOINTS.user(userId), {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Fetch paginated list of organizations
   */
  async getOrganizations(
    params: OrganizationQueryParams = {}
  ): Promise<OrganizationListResponse> {
    const searchParams = new URLSearchParams();
    if (params.page !== undefined)
      searchParams.set("page", params.page.toString());
    if (params.page_size !== undefined)
      searchParams.set("page_size", params.page_size.toString());
    if (params.search?.trim()) searchParams.set("search", params.search.trim());
    if (params.is_active !== undefined)
      searchParams.set("is_active", String(params.is_active));

    const queryString = searchParams.toString();
    const url = queryString
      ? `${ADMIN_ENDPOINTS.organizations}?${queryString}`
      : ADMIN_ENDPOINTS.organizations;

    return apiClient<OrganizationListResponse>(url, {
      method: "GET",
    });
  },

  /**
   * Create a new organization
   */
  async createOrganization(
    payload: OrganizationCreateRequest
  ): Promise<OrganizationResponse> {
    return apiClient<OrganizationResponse>(ADMIN_ENDPOINTS.organizations, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Fetch details for a specific organization
   */
  async getOrganization(orgId: string): Promise<OrganizationResponse> {
    return apiClient<OrganizationResponse>(
      ADMIN_ENDPOINTS.organization(orgId),
      {
        method: "GET",
      }
    );
  },

  /**
   * Update organization name or active status
   */
  async updateOrganization(
    orgId: string,
    payload: OrganizationUpdateRequest
  ): Promise<OrganizationResponse> {
    return apiClient<OrganizationResponse>(
      ADMIN_ENDPOINTS.organization(orgId),
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * List members of an organization
   */
  async getOrganizationMembers(
    orgId: string
  ): Promise<OrganizationMembershipListResponse> {
    return apiClient<OrganizationMembershipListResponse>(
      ADMIN_ENDPOINTS.members(orgId),
      {
        method: "GET",
      }
    );
  },

  /**
   * Add a user to an organization
   */
  async addOrganizationMember(
    orgId: string,
    payload: AddMembershipRequest
  ): Promise<OrganizationMembershipResponse> {
    return apiClient<OrganizationMembershipResponse>(
      ADMIN_ENDPOINTS.members(orgId),
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * Update a member's role or status
   */
  async updateOrganizationMember(
    orgId: string,
    userId: string,
    payload: UpdateMembershipRoleRequest
  ): Promise<OrganizationMembershipResponse> {
    return apiClient<OrganizationMembershipResponse>(
      ADMIN_ENDPOINTS.member(orgId, userId),
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * Remove a member from an organization
   */
  async removeOrganizationMember(
    orgId: string,
    userId: string
  ): Promise<MessageResponse> {
    return apiClient<MessageResponse>(ADMIN_ENDPOINTS.member(orgId, userId), {
      method: "DELETE",
    });
  },
};
