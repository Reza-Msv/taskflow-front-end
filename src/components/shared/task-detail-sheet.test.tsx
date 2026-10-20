import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TaskDetailSheet } from "./task-detail-sheet";
import { taskService } from "@/services/task-service";
import { collaborationService } from "@/services/collaboration-service";
import type {
  WorkItemDetailResponse,
  WorkItemCommentResponse,
  MentionableUserResponse,
  WorkItemActivityResponse,
} from "@/services/generated/api-types";

// Mock services
vi.mock("@/services/task-service", () => ({
  taskService: {
    getTaskDetail: vi.fn(),
    updateTask: vi.fn(),
    moveTask: vi.fn(),
    deleteTask: vi.fn(),
    createChecklistItem: vi.fn(),
    updateChecklistItem: vi.fn(),
    deleteChecklistItem: vi.fn(),
    createSubtask: vi.fn(),
    uploadAttachment: vi.fn(),
    deleteAttachment: vi.fn(),
    getAttachmentDownloadUrl: vi.fn(
      (orgId, projId, taskId, attId) =>
        `/api/v1/organizations/${orgId}/projects/${projId}/tasks/${taskId}/attachments/${attId}/download`
    ),
    getTaskHistory: vi.fn(),
  },
}));

vi.mock("@/services/collaboration-service", () => ({
  collaborationService: {
    getComments: vi.fn(),
    createComment: vi.fn(),
    updateComment: vi.fn(),
    deleteComment: vi.fn(),
    getMentionableMembers: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockOrgId = "org-1";
const mockProjId = "proj-1";
const mockTaskId = "task-100";

const mockTaskDetail: WorkItemDetailResponse = {
  id: mockTaskId,
  organization_id: mockOrgId,
  project_id: mockProjId,
  parent_id: null,
  sequence_number: 100,
  issue_key: "PROJ-100",
  title: "Implement Authentication Flow",
  description: "Set up OAuth and JWT session handling.",
  type: "task",
  status: "in_progress",
  priority: "high",
  assignee_id: "user-1",
  reporter_id: "user-2",
  rank: "0|hzzzzz:",
  version: 2,
  estimated_points: 5,
  due_date: "2026-11-01T00:00:00Z",
  created_at: "2026-10-15T10:00:00Z",
  updated_at: "2026-10-16T12:00:00Z",
  reporter: {
    id: "user-2",
    email: "reporter@example.com",
    full_name: "Jane Reporter",
    name: "Jane Reporter",
    avatar_url: null,
  },
  assignee: {
    id: "user-1",
    email: "assignee@example.com",
    full_name: "John Assignee",
    name: "John Assignee",
    avatar_url: null,
  },
  checklists: [
    {
      id: "chk-1",
      work_item_id: mockTaskId,
      title: "Write unit tests",
      is_completed: true,
      position: 0,
      assignee_id: null,
      created_at: "2026-10-15T10:00:00Z",
      updated_at: "2026-10-15T11:00:00Z",
    },
    {
      id: "chk-2",
      work_item_id: mockTaskId,
      title: "Verify refresh tokens",
      is_completed: false,
      position: 1,
      assignee_id: null,
      created_at: "2026-10-15T10:00:00Z",
      updated_at: "2026-10-15T10:00:00Z",
    },
  ],
  subtasks: [
    {
      id: "sub-1",
      organization_id: mockOrgId,
      project_id: mockProjId,
      parent_id: mockTaskId,
      sequence_number: 101,
      issue_key: "PROJ-101",
      title: "Create Auth Context",
      type: "subtask",
      status: "done",
      priority: "medium",
      rank: "0|hzzzza:",
      version: 1,
      created_at: "2026-10-15T10:00:00Z",
      updated_at: "2026-10-15T12:00:00Z",
    },
  ],
  attachments: [
    {
      id: "att-1",
      work_item_id: mockTaskId,
      file_name: "architecture-diagram.png",
      filename: "architecture-diagram.png",
      file_size: 204800,
      content_type: "image/png",
      storage_path: "/storage/architecture-diagram.png",
      uploader_id: "user-1",
      created_at: "2026-10-15T10:00:00Z",
    },
  ],
  comments_count: 1,
  checklists_count: 2,
  completed_checklists_count: 1,
  subtasks_count: 1,
  completed_subtasks_count: 1,
  attachments_count: 1,
};

const mockComments: WorkItemCommentResponse[] = [
  {
    id: "com-1",
    work_item_id: mockTaskId,
    author_id: "user-1",
    content: "Please check this out @Jane Reporter for review",
    is_edited: false,
    created_at: "2026-10-15T14:00:00Z",
    updated_at: "2026-10-15T14:00:00Z",
    author: {
      id: "user-1",
      email: "assignee@example.com",
      full_name: "John Assignee",
      name: "John Assignee",
      avatar_url: null,
    },
    mentions: [
      {
        id: "men-1",
        comment_id: "com-1",
        user_id: "user-2",
        created_at: "2026-10-15T14:00:00Z",
      },
    ],
  },
];

const mockMentionableMembers: MentionableUserResponse[] = [
  {
    id: "user-2",
    full_name: "Jane Reporter",
    name: "Jane Reporter",
    email: "reporter@example.com",
    avatar_url: null,
  },
  {
    id: "user-3",
    full_name: "Alice Designer",
    name: "Alice Designer",
    email: "alice@example.com",
    avatar_url: null,
  },
];

const mockActivities: WorkItemActivityResponse[] = [
  {
    id: "act-1",
    work_item_id: mockTaskId,
    user_id: "user-1",
    field: "status",
    activity_type: "field_updated",
    field_name: "status",
    old_value: "todo",
    new_value: "in_progress",
    created_at: "2026-10-16T12:00:00Z",
    user: {
      id: "user-1",
      email: "assignee@example.com",
      full_name: "John Assignee",
      name: "John Assignee",
    },
  },
];

describe("TaskDetailSheet", () => {
  const members = [
    { userId: "user-1", name: "John Assignee" },
    { userId: "user-2", name: "Jane Reporter" },
  ];
  const availableStatuses = [
    { id: "todo", name: "To Do" },
    { id: "in_progress", name: "In Progress" },
    { id: "done", name: "Done" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(taskService.getTaskDetail).mockResolvedValue(mockTaskDetail);
    vi.mocked(collaborationService.getComments).mockResolvedValue({
      items: mockComments,
      total: 1,
      page: 1,
      page_size: 50,
    });
    vi.mocked(collaborationService.getMentionableMembers).mockResolvedValue(
      mockMentionableMembers
    );
    vi.mocked(taskService.getTaskHistory).mockResolvedValue({
      items: mockActivities,
      total: 1,
      page: 1,
      page_size: 50,
    });
  });

  it("renders task detail payload with checklists, subtasks, and attachments", async () => {
    render(
      <TaskDetailSheet
        taskId={mockTaskId}
        organizationId={mockOrgId}
        projectId={mockProjId}
        isOpen={true}
        onClose={vi.fn()}
        members={members}
        availableStatuses={availableStatuses}
      />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("PROJ-100")).toBeInTheDocument();
      expect(screen.getByText("Implement Authentication Flow")).toBeInTheDocument();
      expect(
        screen.getByText("Set up OAuth and JWT session handling.")
      ).toBeInTheDocument();
      // Checklists
      expect(screen.getByText("Write unit tests")).toBeInTheDocument();
      expect(screen.getByText("Verify refresh tokens")).toBeInTheDocument();
      // Subtasks
      expect(screen.getByText("PROJ-101")).toBeInTheDocument();
      expect(screen.getByText("Create Auth Context")).toBeInTheDocument();
      // Attachments
      expect(screen.getByText("architecture-diagram.png")).toBeInTheDocument();
      expect(screen.getByText(/200 KB/)).toBeInTheDocument();
    });
  });

  it("adds a checklist item successfully", async () => {
    const user = userEvent.setup();
    const createdChecklist = {
      id: "chk-3",
      work_item_id: mockTaskId,
      title: "Write documentation",
      is_completed: false,
      position: 2,
      assignee_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    vi.mocked(taskService.createChecklistItem).mockResolvedValueOnce(
      createdChecklist
    );

    render(
      <TaskDetailSheet
        taskId={mockTaskId}
        organizationId={mockOrgId}
        projectId={mockProjId}
        isOpen={true}
        onClose={vi.fn()}
        members={members}
        availableStatuses={availableStatuses}
      />
    );

    await screen.findByText("PROJ-100");

    const input = screen.getByPlaceholderText("Add checklist item...");
    await user.type(input, "Write documentation");

    const addBtn = screen.getByRole("button", { name: /add/i });
    await user.click(addBtn);

    await waitFor(() => {
      expect(taskService.createChecklistItem).toHaveBeenCalledWith(
        mockOrgId,
        mockProjId,
        mockTaskId,
        { title: "Write documentation" }
      );
      expect(screen.getByText("Write documentation")).toBeInTheDocument();
    });
  });

  it("toggles checklist item completion", async () => {
    const user = userEvent.setup();
    vi.mocked(taskService.updateChecklistItem).mockResolvedValueOnce({
      ...mockTaskDetail.checklists![1],
      is_completed: true,
    });

    render(
      <TaskDetailSheet
        taskId={mockTaskId}
        organizationId={mockOrgId}
        projectId={mockProjId}
        isOpen={true}
        onClose={vi.fn()}
        members={members}
        availableStatuses={availableStatuses}
      />
    );

    await screen.findByText("Verify refresh tokens");

    const checkboxes = screen.getAllByRole("checkbox");
    // Second checkbox corresponds to "Verify refresh tokens" (uncompleted)
    await user.click(checkboxes[1]);

    await waitFor(() => {
      expect(taskService.updateChecklistItem).toHaveBeenCalledWith(
        mockOrgId,
        mockProjId,
        mockTaskId,
        "chk-2",
        { is_completed: true }
      );
    });
  });

  it("creates a subtask", async () => {
    const user = userEvent.setup();
    const createdSubtask = {
      id: "sub-2",
      organization_id: mockOrgId,
      project_id: mockProjId,
      parent_id: mockTaskId,
      sequence_number: 102,
      issue_key: "PROJ-102",
      title: "Write migration script",
      type: "subtask",
      status: "todo",
      priority: "medium",
      rank: "0|hzzzzb:",
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    vi.mocked(taskService.createSubtask).mockResolvedValueOnce(createdSubtask);

    render(
      <TaskDetailSheet
        taskId={mockTaskId}
        organizationId={mockOrgId}
        projectId={mockProjId}
        isOpen={true}
        onClose={vi.fn()}
        members={members}
        availableStatuses={availableStatuses}
      />
    );

    await screen.findByText("PROJ-100");

    const input = screen.getByPlaceholderText("Create subtask...");
    await user.type(input, "Write migration script");

    const createBtn = screen.getByRole("button", { name: /create/i });
    await user.click(createBtn);

    await waitFor(() => {
      expect(taskService.createSubtask).toHaveBeenCalledWith(
        mockOrgId,
        mockProjId,
        mockTaskId,
        { title: "Write migration script", priority: "medium" }
      );
      expect(screen.getByText("Write migration script")).toBeInTheDocument();
    });
  });

  it("displays comments and posts a new comment with @mentions", async () => {
    const user = userEvent.setup();
    const createdComment: WorkItemCommentResponse = {
      id: "com-2",
      work_item_id: mockTaskId,
      author_id: "user-1",
      content: "All tests passing @Jane Reporter",
      is_edited: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author: {
        id: "user-1",
        email: "assignee@example.com",
        full_name: "John Assignee",
        name: "John Assignee",
      },
      mentions: [],
    };
    vi.mocked(collaborationService.createComment).mockResolvedValueOnce(
      createdComment
    );

    render(
      <TaskDetailSheet
        taskId={mockTaskId}
        organizationId={mockOrgId}
        projectId={mockProjId}
        isOpen={true}
        onClose={vi.fn()}
        members={members}
        availableStatuses={availableStatuses}
      />
    );

    await screen.findByText("PROJ-100");

    // Switch to comments tab
    const commentsTab = screen.getByRole("tab", { name: /comments/i });
    await user.click(commentsTab);

    expect(
      screen.getByText(/Please check this out/i)
    ).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(
      /Write a comment... \(Type @ to mention team members\)/i
    );
    await user.type(textarea, "All tests passing @Jane");

    await waitFor(() => {
      expect(
        collaborationService.getMentionableMembers
      ).toHaveBeenCalledWith(mockOrgId, mockProjId, mockTaskId, "Jane");
    });

    const submitBtn = screen.getByRole("button", { name: /comment/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(collaborationService.createComment).toHaveBeenCalledWith(
        mockOrgId,
        mockProjId,
        mockTaskId,
        expect.objectContaining({
          content: "All tests passing @Jane",
        })
      );
    });
  });

  it("updates task fields like status, priority, and assignee", async () => {
    const user = userEvent.setup();
    const updatedTask = {
      ...mockTaskDetail,
      status: "done",
    };
    vi.mocked(taskService.moveTask).mockResolvedValueOnce(updatedTask);

    render(
      <TaskDetailSheet
        taskId={mockTaskId}
        organizationId={mockOrgId}
        projectId={mockProjId}
        isOpen={true}
        onClose={vi.fn()}
        members={members}
        availableStatuses={availableStatuses}
      />
    );

    await screen.findByText("PROJ-100");

    const statusSelect = screen.getByLabelText("Status");
    await user.selectOptions(statusSelect, "done");

    await waitFor(() => {
      expect(taskService.moveTask).toHaveBeenCalledWith(
        mockOrgId,
        mockProjId,
        mockTaskId,
        { status: "done", version: 2 }
      );
    });
  });
});
