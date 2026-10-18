/**
 * Auto-generated API types from backend OpenAPI contract
 */

export interface AddMembershipRequest {
  user_id: string;
  role?: "owner" | "admin" | "member" | "guest" | "viewer";
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

export interface HTTPValidationError {
  detail?: ValidationError[];
}

export interface HealthResponse {
  status: string;
  version: string;
  environment: string;
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
  role?: "owner" | "admin" | "member" | "guest" | "viewer" | null;
  is_active?: boolean | null;
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
