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

export interface ProjectBrief {
  id: string;
  name: string;
  key: string;
  organization_id: string;
  is_private: boolean;
}

export interface ProjectSummary {
  id: string;
  name: string;
  key: string;
  organization_id: string;
  is_private: boolean;
  role: string;
  total_tasks: number;
  assigned_tasks: number;
}

export interface DashboardSummaryResponse {
  total_projects: number;
  projects: ProjectSummary[];
  status_counts: Record<string, number>;
  assigned_tasks_count: number;
  in_progress_tasks_count: number;
  completed_tasks_count: number;
  overdue_tasks_count: number;
}

export interface WorkItemDashboardItem {
  id: string;
  issue_key: string;
  type: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  estimated_points: number | null;
  rank: string;
  created_at: string;
  updated_at: string;
  project: ProjectBrief;
  is_overdue: boolean;
}

export interface WorkItemListDashboardResponse {
  items: WorkItemDashboardItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface OverdueUpcomingTasksResponse {
  overdue_tasks: WorkItemDashboardItem[];
  upcoming_tasks: WorkItemDashboardItem[];
}

export interface UserActivityActor {
  id: string;
  email: string;
  full_name: string;
}

export interface UserActivityItem {
  id: string;
  activity_type: string;
  field?: string | null;
  old_value?: string | null;
  new_value?: string | null;
  created_at: string;
  work_item_id?: string | null;
  work_item_key?: string | null;
  work_item_title?: string | null;
  project_id?: string | null;
  project_name?: string | null;
  actor?: UserActivityActor | null;
  details?: string | null;
}

export interface UserActivityListResponse {
  items: UserActivityItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
