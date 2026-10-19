import { apiClient } from "@/services/api-client";
import type {
  OrganizationResponse,
  OrganizationListResponse,
  OrganizationCreateRequest,
  OrganizationUpdateRequest,
  OrganizationMembershipResponse,
  OrganizationMembershipListResponse,
  AddMembershipRequest,
  UpdateMembershipRoleRequest,
  CreateInvitationRequest,
  InvitationResponse,
  InvitationListResponse,
  MessageResponse,
} from "@/services/generated/api-types";

export interface OrganizationQueryParams {
  page?: number;
  page_size?: number;
}

export interface OrganizationMembersQueryParams {
  page?: number;
  page_size?: number;
}

export const ORGANIZATION_ENDPOINTS = {
  organizations: "/api/v1/organizations",
  organization: (orgId: string) =>
    `/api/v1/organizations/${encodeURIComponent(orgId)}`,
  members: (orgId: string) =>
    `/api/v1/organizations/${encodeURIComponent(orgId)}/members`,
  member: (orgId: string, userId: string) =>
    `/api/v1/organizations/${encodeURIComponent(orgId)}/members/${encodeURIComponent(userId)}`,
  invitations: (orgId: string) =>
    `/api/v1/organizations/${encodeURIComponent(orgId)}/invitations`,
  acceptInvitation: (token: string) =>
    `/api/v1/organizations/invitations/accept?token=${encodeURIComponent(token)}`,
} as const;

export const organizationService = {
  /**
   * List organizations the authenticated user belongs to
   */
  async getMyOrganizations(
    params: OrganizationQueryParams = {}
  ): Promise<OrganizationListResponse> {
    const searchParams = new URLSearchParams();
    if (params.page !== undefined) {
      searchParams.set("page", params.page.toString());
    }
    if (params.page_size !== undefined) {
      searchParams.set("page_size", params.page_size.toString());
    }

    const query = searchParams.toString();
    const url = query
      ? `${ORGANIZATION_ENDPOINTS.organizations}?${query}`
      : ORGANIZATION_ENDPOINTS.organizations;

    return apiClient<OrganizationListResponse>(url, {
      method: "GET",
    });
  },

  /**
   * Create an organization (creator becomes owner)
   */
  async createOrganization(
    payload: OrganizationCreateRequest
  ): Promise<OrganizationResponse> {
    return apiClient<OrganizationResponse>(
      ORGANIZATION_ENDPOINTS.organizations,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * Retrieve organization details by ID
   */
  async getOrganization(orgId: string): Promise<OrganizationResponse> {
    return apiClient<OrganizationResponse>(
      ORGANIZATION_ENDPOINTS.organization(orgId),
      {
        method: "GET",
      }
    );
  },

  /**
   * Update organization details (owner, admin)
   */
  async updateOrganization(
    orgId: string,
    payload: OrganizationUpdateRequest
  ): Promise<OrganizationResponse> {
    return apiClient<OrganizationResponse>(
      ORGANIZATION_ENDPOINTS.organization(orgId),
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * Delete organization and cascades (owner only)
   */
  async deleteOrganization(orgId: string): Promise<MessageResponse> {
    return apiClient<MessageResponse>(
      ORGANIZATION_ENDPOINTS.organization(orgId),
      {
        method: "DELETE",
      }
    );
  },

  /**
   * List organization members
   */
  async getMembers(
    orgId: string,
    params: OrganizationMembersQueryParams = {}
  ): Promise<OrganizationMembershipListResponse> {
    const searchParams = new URLSearchParams();
    if (params.page !== undefined) {
      searchParams.set("page", params.page.toString());
    }
    if (params.page_size !== undefined) {
      searchParams.set("page_size", params.page_size.toString());
    }

    const query = searchParams.toString();
    const url = query
      ? `${ORGANIZATION_ENDPOINTS.members(orgId)}?${query}`
      : ORGANIZATION_ENDPOINTS.members(orgId);

    return apiClient<OrganizationMembershipListResponse>(url, {
      method: "GET",
    });
  },

  /**
   * Directly add a user to the organization (owner, admin; cannot assign owner)
   */
  async addMember(
    orgId: string,
    payload: AddMembershipRequest
  ): Promise<OrganizationMembershipResponse> {
    return apiClient<OrganizationMembershipResponse>(
      ORGANIZATION_ENDPOINTS.members(orgId),
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * Update a member's role or status (owner, admin; cannot modify owner or promote to owner)
   */
  async updateMemberRole(
    orgId: string,
    userId: string,
    payload: UpdateMembershipRoleRequest
  ): Promise<OrganizationMembershipResponse> {
    return apiClient<OrganizationMembershipResponse>(
      ORGANIZATION_ENDPOINTS.member(orgId, userId),
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * Remove member from organization (self or owner/admin; protected against removing last owner)
   */
  async removeMember(orgId: string, userId: string): Promise<MessageResponse> {
    return apiClient<MessageResponse>(
      ORGANIZATION_ENDPOINTS.member(orgId, userId),
      {
        method: "DELETE",
      }
    );
  },

  /**
   * Create an email invitation (owner, admin)
   */
  async createInvitation(
    orgId: string,
    payload: CreateInvitationRequest
  ): Promise<InvitationResponse> {
    return apiClient<InvitationResponse>(
      ORGANIZATION_ENDPOINTS.invitations(orgId),
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * List pending invitations (owner, admin)
   */
  async getInvitations(orgId: string): Promise<InvitationListResponse> {
    return apiClient<InvitationListResponse>(
      ORGANIZATION_ENDPOINTS.invitations(orgId),
      {
        method: "GET",
      }
    );
  },

  /**
   * Accept an invitation using secure token
   */
  async acceptInvitation(
    token: string
  ): Promise<OrganizationMembershipResponse> {
    return apiClient<OrganizationMembershipResponse>(
      ORGANIZATION_ENDPOINTS.acceptInvitation(token),
      {
        method: "POST",
      }
    );
  },
};
