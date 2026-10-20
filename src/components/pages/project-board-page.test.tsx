import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProjectBoardPage } from "./project-board-page";
import { taskService } from "@/services/task-service";
import { projectService } from "@/services/project-service";
import type {
  KanbanBoardResponse,
  ProjectResponse,
  ProjectMembershipListResponse,
  WorkItemHistoryListResponse,
} from "@/services/generated/api-types";

// Mock next/navigation
const mockPush = vi.fn();
const mockRouter = {
  push: mockPush,
  replace: vi.fn(),
};
vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("ProjectBoardPage", () => {
  const orgId = "org-uuid-1";
  const projId = "proj-uuid-1";

  const mockProject: ProjectResponse = {
    id: projId,
    organization_id: orgId,
    name: "Mobile App Redesign",
    key: "MAR",
    description: "Redesigning iOS and Android apps",
    is_private: false,
    is_archived: false,
    created_at: "2026-10-19T00:00:00Z",
    updated_at: "2026-10-19T00:00:00Z",
  };

  const mockMembers: ProjectMembershipListResponse = {
    items: [
      {
        id: "mem-1",
        project_id: projId,
        user_id: "user-1",
        role: "admin",
        created_at: "2026-10-19T00:00:00Z",
        updated_at: "2026-10-19T00:00:00Z",
        user: {
          id: "user-1",
          email: "alex@example.com",
          full_name: "Alex Doe",
          is_active: true,
          is_superuser: false,
          created_at: "2026-10-19T00:00:00Z",
          updated_at: "2026-10-19T00:00:00Z",
        },
      },
    ],
    page: 1,
    page_size: 100,
    total: 1,
  };

  const mockBoard: KanbanBoardResponse = {
    project_id: projId,
    total_tasks: 2,
    columns: [
      {
        status: {
          id: "todo",
          name: "To Do",
          category: "todo",
          position: 1,
          is_default: true,
        },
        total_tasks: 1,
        tasks: [
          {
            id: "task-1",
            project_id: projId,
            organization_id: orgId,
            sequence_number: 1,
            issue_key: "MAR-1",
            type: "task",
            title: "Setup Figma Tokens",
            description: "Sync with design team",
            status: "todo",
            priority: "high",
            rank: "0|000001:",
            version: 1,
            assignee_id: "user-1",
            created_at: "2026-10-19T00:00:00Z",
            updated_at: "2026-10-19T00:00:00Z",
          },
        ],
      },
      {
        status: {
          id: "in_progress",
          name: "In Progress",
          category: "in_progress",
          position: 2,
          is_default: false,
        },
        total_tasks: 1,
        tasks: [
          {
            id: "task-2",
            project_id: projId,
            organization_id: orgId,
            sequence_number: 2,
            issue_key: "MAR-2",
            type: "bug",
            title: "Fix Navigation Crash",
            description: null,
            status: "in_progress",
            priority: "urgent",
            rank: "0|000002:",
            version: 1,
            created_at: "2026-10-19T00:00:00Z",
            updated_at: "2026-10-19T00:00:00Z",
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(projectService, "getProject").mockResolvedValue(mockProject);
    vi.spyOn(projectService, "getMembers").mockResolvedValue(mockMembers);
    vi.spyOn(taskService, "getKanbanBoard").mockResolvedValue(mockBoard);
  });

  it("renders kanban board with columns and tasks", async () => {
    render(<ProjectBoardPage organizationId={orgId} projectId={projId} />);

    expect(
      await screen.findByText("Mobile App Redesign Board")
    ).toBeInTheDocument();
    expect(screen.getByText("MAR-1")).toBeInTheDocument();
    expect(screen.getByText("Setup Figma Tokens")).toBeInTheDocument();
    expect(screen.getByText("MAR-2")).toBeInTheDocument();
    expect(screen.getByText("Fix Navigation Crash")).toBeInTheDocument();
  });

  it("creates a new task via task modal", async () => {
    vi.spyOn(taskService, "createTask").mockResolvedValueOnce({
      id: "task-3",
      project_id: projId,
      organization_id: orgId,
      sequence_number: 3,
      issue_key: "MAR-3",
      type: "task",
      title: "Write documentation",
      status: "todo",
      priority: "medium",
      rank: "0|000003:",
      version: 1,
      created_at: "2026-10-19T00:00:00Z",
      updated_at: "2026-10-19T00:00:00Z",
    });

    const user = userEvent.setup();
    render(<ProjectBoardPage organizationId={orgId} projectId={projId} />);

    await screen.findByText("Mobile App Redesign Board");

    const newTaskBtn = screen.getByRole("button", { name: /New Task/i });
    await user.click(newTaskBtn);

    expect(screen.getByText("Create New Task")).toBeInTheDocument();

    const titleInput = screen.getByLabelText(/Title \*/i);
    await user.type(titleInput, "Write documentation");

    const submitBtn = screen.getByRole("button", { name: /^Create Task$/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(taskService.createTask).toHaveBeenCalledWith(
        orgId,
        projId,
        expect.objectContaining({
          title: "Write documentation",
          status: "todo",
        })
      );
    });
  });

  it("opens task history drawer when requested", async () => {
    const mockHistory: WorkItemHistoryListResponse = {
      items: [
        {
          id: "act-1",
          work_item_id: "task-1",
          field: "status",
          old_value: "backlog",
          new_value: "todo",
          created_at: "2026-10-19T10:00:00Z",
          user: {
            id: "user-1",
            email: "alex@example.com",
            full_name: "Alex Doe",
          },
        },
      ],
      page: 1,
      page_size: 50,
      total: 1,
    };

    vi.spyOn(taskService, "getTaskHistory").mockResolvedValueOnce(mockHistory);

    const user = userEvent.setup();
    render(<ProjectBoardPage organizationId={orgId} projectId={projId} />);

    await screen.findByText("Setup Figma Tokens");

    const actionBtn = screen.getByRole("button", {
      name: "Actions for MAR-1",
    });
    await user.click(actionBtn);

    const historyMenuOption = await screen.findByText("View Activity History");
    await user.click(historyMenuOption);

    await waitFor(() => {
      expect(taskService.getTaskHistory).toHaveBeenCalledWith(
        orgId,
        projId,
        "task-1",
        { page_size: 50 }
      );
      expect(screen.getByText("Activity Audit Stream")).toBeInTheDocument();
      expect(screen.getByText("Alex Doe")).toBeInTheDocument();
    });
  });

  it("moves a task to another status using action menu", async () => {
    const firstTask = mockBoard.columns[0]?.tasks?.[0];
    if (!firstTask) throw new Error("Task not found in mock board");

    vi.spyOn(taskService, "moveTask").mockResolvedValueOnce({
      ...firstTask,
      status: "in_progress",
      version: 2,
    });

    const user = userEvent.setup();
    render(<ProjectBoardPage organizationId={orgId} projectId={projId} />);

    await screen.findByText("Setup Figma Tokens");

    const actionBtn = screen.getByRole("button", {
      name: "Actions for MAR-1",
    });
    await user.click(actionBtn);

    const moveOption = await screen.findByText("Move to In Progress");
    await user.click(moveOption);

    await waitFor(() => {
      expect(taskService.moveTask).toHaveBeenCalledWith(
        orgId,
        projId,
        "task-1",
        {
          target_status: "in_progress",
          target_rank: null,
          version: 1,
        }
      );
    });
  });
});
