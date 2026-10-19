/**
 * Auto-generated API types from backend OpenAPI contract
 */

export type OrganizationRole =
  "owner" | "admin" | "member" | "guest" | "viewer";
export type ProjectRole = "admin" | "member" | "viewer";

export interface AddMembershipRequest {
  user_id: string;
  role?: OrganizationRole;
}

export interface AddProjectMembershipRequest {
  user_id: string;
  role?: ProjectRole;
}

export interface AdminOverviewResponse {
  total_users: number;
  active_users: number;
  total_organizations: number;
  active_organizations: number;
  total_projects: number;
}

export interface AuthResponse {
  user: UserResponse;
  csrf_token: string;
  message?: string;
}

export interface CreateInvitationRequest {
  email: string;
  role?: OrganizationRole;
}

export interface HTTPValidationError {
  detail?: ValidationError[];
}

export interface HealthResponse {
  status: string;
  version: string;
  environment: string;
}

export interface InvitationListResponse {
  items: InvitationResponse[];
  total: number;
}

export interface InvitationResponse {
  id: string;
  organization_id: string;
  email: string;
  role: string;
  token: string;
  invited_by_id?: string | null;
  expires_at: string;
  accepted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface MessageResponse {
  message: string;
}

export interface OrganizationCreateRequest {
  name: string;
  slug: string;
}

export interface OrganizationListResponse {
  items: OrganizationResponse[];
  page: number;
  page_size: number;
  total: number;
}

export interface OrganizationMembershipListResponse {
  items: OrganizationMembershipResponse[];
  page?: number;
  page_size?: number;
  total: number;
}

export interface OrganizationMembershipResponse {
  id: string;
  organization_id: string;
  user_id: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user?: UserResponse | null;
}

export interface OrganizationResponse {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationUpdateRequest {
  name?: string | null;
  is_active?: boolean | null;
}

export interface ProjectBrief {
  id: string;
  name: string;
  key: string;
  is_private: boolean;
  role: string;
}

export interface ProjectCreateRequest {
  name: string;
  key: string;
  description?: string | null;
  is_private?: boolean;
}

export interface ProjectListResponse {
  items: ProjectResponse[];
  page: number;
  page_size: number;
  total: number;
}

export interface ProjectMembershipListResponse {
  items: ProjectMembershipResponse[];
  page?: number;
  page_size?: number;
  total: number;
}

export interface ProjectMembershipResponse {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  created_at: string;
  updated_at: string;
  user?: UserResponse | null;
}

export interface ProjectResponse {
  id: string;
  organization_id: string;
  name: string;
  key: string;
  description?: string | null;
  is_private: boolean;
  is_archived: boolean;
  owner_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  key: string;
  organization_id: string;
  is_private: boolean;
  role: string;
  total_tasks?: number;
  assigned_tasks?: number;
}

export interface ProjectUpdateRequest {
  name?: string | null;
  description?: string | null;
  is_private?: boolean | null;
  is_archived?: boolean | null;
  owner_id?: string | null;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface RegisterResponse {
  user: UserResponse;
  message?: string;
}

export interface UpdateMembershipRoleRequest {
  role?: OrganizationRole | null;
  is_active?: boolean | null;
}

export interface UpdateProjectMembershipRoleRequest {
  role: ProjectRole;
}

export interface UserListResponse {
  items: UserResponse[];
  page: number;
  page_size: number;
  total: number;
}

export interface UserResponse {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserUpdateAdminRequest {
  full_name?: string | null;
  is_active?: boolean | null;
  is_superuser?: boolean | null;
}

export interface ValidationError {
  loc: unknown[];
  msg: string;
  type: string;
  input?: unknown;
  ctx?: unknown;
}
