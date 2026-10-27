import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { WorkflowConfigDialog } from "./workflow-config-dialog";
import { workflowService } from "@/services/workflow-service";

vi.mock("@/services/workflow-service", () => ({
  workflowService: {
    getProjectWorkflowStatuses: vi.fn(),
    groupStatusesByCategory: vi.fn().mockReturnValue({
      todo: [{ id: "1", name: "To Do", category: "todo", position: 1, is_default: true }],
      in_progress: [{ id: "2", name: "In Progress", category: "in_progress", position: 2 }],
      done: [{ id: "3", name: "Done", category: "done", position: 3 }],
    }),
    computeTransitionMatrix: vi.fn().mockReturnValue([
      {
        fromStatusId: "1",
        fromStatusName: "To Do",
        toStatusId: "2",
        toStatusName: "In Progress",
        isAllowed: true,
        policyNotes: "Transition from To Do to In Progress",
      },
      {
        fromStatusId: "2",
        fromStatusName: "In Progress",
        toStatusId: "3",
        toStatusName: "Done",
        isAllowed: true,
        policyNotes: "Transition from In Progress to Done",
      },
    ]),
  },
  WORKFLOW_POLICIES: [
    {
      key: "optimistic_locking",
      title: "Optimistic Concurrency Control",
      description: "Prevents conflicting concurrent updates.",
      enforcement: "strict_db",
      status: "active",
    },
  ],
}));

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children }: any) => <div data-testid="tabs">{children}</div>,
  TabsList: ({ children }: any) => <div data-testid="tabs-list" role="tablist">{children}</div>,
  TabsTrigger: ({ children, onClick }: any) => (
    <button type="button" role="tab" onClick={onClick} data-testid="tabs-trigger">
      {children}
    </button>
  ),
  TabsContent: ({ children }: any) => <div data-testid="tabs-content">{children}</div>,
}));

describe("WorkflowConfigDialog", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    organizationId: "org-1",
    projectId: "proj-1",
    projectName: "Mobile App",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(workflowService.getProjectWorkflowStatuses).mockResolvedValue([
      { id: "1", name: "To Do", category: "todo", position: 1, is_default: true },
      { id: "2", name: "In Progress", category: "in_progress", position: 2, is_default: false },
    ]);
  });

  it("renders workflow stages tab by default", async () => {
    render(<WorkflowConfigDialog {...defaultProps} />);

    expect(screen.getByText("Workflow & Lifecycle Configuration")).toBeInTheDocument();
    expect(screen.getByText(/Inspect workflow stages/)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText("To Do").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("In Progress").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Initial Default")).toBeInTheDocument();
    });
  });

  it("switches to transitions tab and shows matrix rules", async () => {
    render(
      <WorkflowConfigDialog
        {...defaultProps}
        initialStatuses={[
          { id: "1", name: "To Do", category: "todo", position: 1, is_default: true },
          { id: "2", name: "In Progress", category: "in_progress", position: 2, is_default: false },
        ]}
      />
    );

    const transitionsTab = screen.getByRole("tab", { name: /Transition Matrix/i });
    fireEvent.click(transitionsTab);

    expect(screen.getByText(/Lifecycle Transition Validation/i)).toBeInTheDocument();
    expect(screen.getByText("Transition from To Do to In Progress")).toBeInTheDocument();
  });

  it("switches to automations tab and shows active policies", async () => {
    render(
      <WorkflowConfigDialog
        {...defaultProps}
        initialStatuses={[
          { id: "1", name: "To Do", category: "todo", position: 1, is_default: true },
        ]}
      />
    );

    const governanceTab = screen.getByRole("tab", { name: /Automations & Rules/i });
    fireEvent.click(governanceTab);

    expect(screen.getByText("Optimistic Concurrency Control")).toBeInTheDocument();
    expect(screen.getByText("Strict Concurrency")).toBeInTheDocument();
  });

  it("calls onClose when Close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <WorkflowConfigDialog
        {...defaultProps}
        onClose={onClose}
        initialStatuses={[
          { id: "1", name: "To Do", category: "todo", position: 1, is_default: true },
        ]}
      />
    );

    const closeBtns = screen.getAllByRole("button", { name: "Close" });
    fireEvent.click(closeBtns[0]);
    expect(onClose).toHaveBeenCalled();
  });
});
