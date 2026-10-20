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
  organization_id?: string;
  is_private: boolean;
  role?: string;
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
  name?: string;
  avatar_url?: string | null;
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

// ==========================================
// Task Management & Kanban Board Interfaces
// ==========================================

export type WorkItemType = "task" | "bug" | "story" | "epic" | "subtask";
export type WorkItemPriority = "lowest" | "low" | "medium" | "high" | "urgent";

export interface WorkItemResponse {
  id: string;
  project_id: string;
  organization_id: string;
  sequence_number: number;
  issue_key: string;
  type: WorkItemType | string;
  title: string;
  description?: string | null;
  status: string;
  priority: WorkItemPriority | string;
  parent_id?: string | null;
  reporter_id?: string | null;
  assignee_id?: string | null;
  sprint_id?: string | null;
  rank: string;
  due_date?: string | null;
  estimated_points?: number | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface WorkItemListResponse {
  items: WorkItemResponse[];
  page: number;
  page_size: number;
  total: number;
  total_pages?: number;
}

export interface WorkItemCreateRequest {
  title: string;
  description?: string | null;
  type?: WorkItemType | string;
  priority?: WorkItemPriority | string;
  status?: string | null;
  assignee_id?: string | null;
  parent_id?: string | null;
  due_date?: string | null;
  estimated_points?: number | null;
  rank?: string | null;
}

export interface WorkItemUpdateRequest {
  title?: string | null;
  description?: string | null;
  priority?: WorkItemPriority | string | null;
  assignee_id?: string | null;
  parent_id?: string | null;
  due_date?: string | null;
  estimated_points?: number | null;
  version?: number | null;
}

export interface TaskStatusMoveRequest {
  status: string;
  rank?: string | null;
  version?: number | null;
}

export interface WorkflowStatusResponse {
  id: string;
  project_id?: string | null;
  name: string;
  category: "todo" | "in_progress" | "done" | "cancelled" | string;
  position: number;
  is_default: boolean;
}

export interface KanbanColumn {
  status: WorkflowStatusResponse;
  tasks?: WorkItemResponse[];
  total_tasks: number;
}

export interface KanbanBoardResponse {
  project_id: string;
  columns: KanbanColumn[];
  total_tasks: number;
}

export interface WorkItemActivityResponse {
  id: string;
  work_item_id: string;
  user_id?: string | null;
  field: string;
  field_name?: string;
  activity_type?: string;
  old_value?: string | null;
  new_value?: string | null;
  created_at: string;
  user?: UserActivityActor | null;
}

export interface WorkItemHistoryListResponse {
  items: WorkItemActivityResponse[];
  page: number;
  page_size: number;
  total: number;
  total_pages?: number;
}

// ==========================================
// Phase 4: Collaboration, Checklists & Attachments
// ==========================================

export interface UserBrief {
  id: string;
  email: string;
  full_name: string;
  name?: string;
  avatar_url?: string | null;
}

export interface MentionableUserResponse {
  id: string;
  email: string;
  full_name: string;
  name?: string;
  avatar_url?: string | null;
  role?: string | null;
}

export interface CommentMentionResponse {
  id: string;
  comment_id: string;
  user_id: string;
  created_at: string;
  user?: UserBrief | null;
}

export interface WorkItemCommentResponse {
  id: string;
  work_item_id: string;
  author_id?: string | null;
  content: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  author?: UserBrief | null;
  mentions: CommentMentionResponse[];
}

export interface WorkItemCommentListResponse {
  items: WorkItemCommentResponse[];
  page: number;
  page_size: number;
  total: number;
}

export interface CommentCreateRequest {
  content: string;
  mentioned_user_ids?: string[];
}

export interface CommentUpdateRequest {
  content: string;
  mentioned_user_ids?: string[];
}

export interface ChecklistItemResponse {
  id: string;
  work_item_id: string;
  title: string;
  is_completed: boolean;
  position: number;
  assignee_id?: string | null;
  assignee?: UserActivityActor | null;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItemCreateRequest {
  title: string;
  assignee_id?: string | null;
  position?: number | null;
}

export interface ChecklistItemUpdateRequest {
  title?: string | null;
  is_completed?: boolean | null;
  position?: number | null;
  assignee_id?: string | null;
}

export interface ChecklistListResponse {
  items: ChecklistItemResponse[];
  total: number;
}

export interface AttachmentResponse {
  id: string;
  work_item_id: string;
  uploader_id?: string | null;
  file_name: string;
  filename?: string;
  file_size: number;
  content_type: string;
  storage_path: string;
  created_at: string;
  uploader?: UserActivityActor | null;
}

export interface AttachmentListResponse {
  items: AttachmentResponse[];
  total: number;
}

export interface SubtaskCreateRequest {
  title: string;
  description?: string | null;
  priority?: WorkItemPriority | string;
  status?: string | null;
  assignee_id?: string | null;
  due_date?: string | null;
  estimated_points?: number | null;
}

export interface WorkItemDetailResponse extends WorkItemResponse {
  project?: ProjectBrief | null;
  reporter?: UserActivityActor | null;
  assignee?: UserActivityActor | null;
  subtasks: WorkItemResponse[];
  checklists: ChecklistItemResponse[];
  attachments: AttachmentResponse[];
  subtasks_count: number;
  completed_subtasks_count?: number;
  checklists_count: number;
  completed_checklists_count: number;
  attachments_count: number;
  comments_count: number;
}

export interface NotificationResponse {
  id: string;
  user_id: string;
  actor_id?: string | null;
  organization_id?: string | null;
  type: string;
  title: string;
  message: string;
  resource_type?: string | null;
  resource_id?: string | null;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  actor?: UserBrief | null;
}

export interface NotificationListResponse {
  items: NotificationResponse[];
  page: number;
  page_size: number;
  total: number;
  unread_count: number;
}

export interface NotificationUnreadCountResponse {
  unread_count: number;
}


