import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BulkTaskActionsBar } from "./bulk-task-actions-bar";
import { taskService } from "@/services/task-service";
import type { WorkItemResponse, ProjectMembershipResponse } from "@/services/generated/api-types";

vi.mock("@/services/task-service", () => ({
  taskService: {
    moveTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => (
    <button type="button" onClick={onClick} data-testid="dropdown-item">
      {children}
    </button>
  ),
  DropdownMenuLabel: ({ children }: any) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
}));

describe("BulkTaskActionsBar", () => {
  const mockTasks: WorkItemResponse[] = [
    {
      id: "task-1",
      organization_id: "org-1",
      project_id: "proj-1",
      issue_key: "PROJ-1",
      sequence_number: 1,
      title: "Task 1",
      status: "todo",
      priority: "medium",
      type: "task",
      version: 1,
      rank: "0|hzzzzz:",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "task-2",
      organization_id: "org-1",
      project_id: "proj-1",
      issue_key: "PROJ-2",
      sequence_number: 2,
      title: "Task 2",
      status: "todo",
      priority: "high",
      type: "task",
      version: 1,
      rank: "0|hzzzzz:",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const mockMembers: ProjectMembershipResponse[] = [
    {
      id: "mem-1",
      project_id: "proj-1",
      user_id: "user-1",
      role: "member",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: {
        id: "user-1",
        email: "alice@example.com",
        full_name: "Alice Adams",
        is_active: true,
        is_superuser: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    },
  ];

  const defaultProps = {
    organizationId: "org-1",
    projectId: "proj-1",
    selectedTasks: mockTasks,
    onClearSelection: vi.fn(),
    onOperationComplete: vi.fn(),
    members: mockMembers,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders selected tasks count and action buttons", () => {
    render(<BulkTaskActionsBar {...defaultProps} />);

    expect(screen.getByText("2 Selected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Move Status/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Set Priority/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Assign$/i })).toBeInTheDocument();
    expect(screen.getByTitle("Delete Selected Tasks")).toBeInTheDocument();
  });

  it("does not render when no tasks are selected", () => {
    const { container } = render(<BulkTaskActionsBar {...defaultProps} selectedTasks={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("handles bulk status move", async () => {
    vi.mocked(taskService.moveTask).mockResolvedValue({} as any);

    render(<BulkTaskActionsBar {...defaultProps} />);

    const moveBtn = screen.getByRole("button", { name: /Move Status/i });
    fireEvent.pointerDown(moveBtn, { button: 0 });
    fireEvent.keyDown(moveBtn, { key: "Enter" });

    const doneOption = await screen.findByText("Done");
    fireEvent.click(doneOption);

    await waitFor(() => {
      expect(taskService.moveTask).toHaveBeenCalledTimes(2);
      expect(defaultProps.onOperationComplete).toHaveBeenCalled();
      expect(defaultProps.onClearSelection).toHaveBeenCalled();
    });
  });

  it("handles bulk priority change", async () => {
    vi.mocked(taskService.updateTask).mockResolvedValue({} as any);

    render(<BulkTaskActionsBar {...defaultProps} />);

    const priorityBtn = screen.getByRole("button", { name: /Set Priority/i });
    fireEvent.pointerDown(priorityBtn, { button: 0 });
    fireEvent.keyDown(priorityBtn, { key: "Enter" });

    const urgentOption = await screen.findByText("urgent");
    fireEvent.click(urgentOption);

    await waitFor(() => {
      expect(taskService.updateTask).toHaveBeenCalledTimes(2);
      expect(defaultProps.onOperationComplete).toHaveBeenCalled();
    });
  });

  it("handles bulk delete with confirmation", async () => {
    vi.mocked(taskService.deleteTask).mockResolvedValue(undefined);

    render(<BulkTaskActionsBar {...defaultProps} />);

    const deleteBtn = screen.getByTitle("Delete Selected Tasks");
    fireEvent.click(deleteBtn);

    expect(screen.getByText("Delete Selected Tasks?")).toBeInTheDocument();
    const confirmBtn = screen.getByRole("button", { name: "Delete Tasks" });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(taskService.deleteTask).toHaveBeenCalledTimes(2);
      expect(defaultProps.onOperationComplete).toHaveBeenCalled();
    });
  });

  it("calls onClearSelection when clear button is clicked", () => {
    render(<BulkTaskActionsBar {...defaultProps} />);

    const clearBtn = screen.getByTitle("Clear Selection");
    fireEvent.click(clearBtn);

    expect(defaultProps.onClearSelection).toHaveBeenCalled();
  });
});
