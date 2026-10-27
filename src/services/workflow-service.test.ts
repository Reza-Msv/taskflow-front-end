import { describe, it, expect, vi, beforeEach } from "vitest";
import { workflowService, WORKFLOW_POLICIES } from "./workflow-service";
import { taskService } from "./task-service";
import type { WorkflowStatusResponse } from "./generated/api-types";

vi.mock("./task-service", () => ({
  taskService: {
    getKanbanBoard: vi.fn(),
  },
}));

describe("workflowService", () => {
  const mockStatuses: WorkflowStatusResponse[] = [
    {
      id: "status-1",
      name: "To Do",
      category: "todo",
      position: 1,
      is_default: true,
    },
    {
      id: "status-2",
      name: "In Progress",
      category: "in_progress",
      position: 2,
      is_default: false,
    },
    {
      id: "status-3",
      name: "Done",
      category: "done",
      position: 3,
      is_default: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches project workflow statuses from kanban board columns", async () => {
    vi.mocked(taskService.getKanbanBoard).mockResolvedValueOnce({
      project_id: "proj-1",
      total_tasks: 3,
      columns: [
        { status: mockStatuses[0], total_tasks: 1 },
        { status: mockStatuses[1], total_tasks: 1 },
        { status: mockStatuses[2], total_tasks: 1 },
      ],
    });

    const result = await workflowService.getProjectWorkflowStatuses("org-1", "proj-1");
    expect(result).toHaveLength(3);
    expect(result[0].name).toBe("To Do");
    expect(result[1].name).toBe("In Progress");
    expect(result[2].name).toBe("Done");
  });

  it("groups statuses correctly by category", () => {
    const grouped = workflowService.groupStatusesByCategory(mockStatuses);
    expect(grouped.todo).toHaveLength(1);
    expect(grouped.in_progress).toHaveLength(1);
    expect(grouped.done).toHaveLength(1);
    expect(grouped.review).toHaveLength(0);
  });

  it("computes transition matrix between project statuses", () => {
    const matrix = workflowService.computeTransitionMatrix(mockStatuses);
    // 3 statuses * 2 targets each = 6 transition combinations
    expect(matrix).toHaveLength(6);
    const reopenRule = matrix.find(
      (r) => r.fromStatusName === "Done" && r.toStatusName === "To Do"
    );
    expect(reopenRule).toBeDefined();
    expect(reopenRule?.isAllowed).toBe(true);
    expect(reopenRule?.policyNotes).toContain("Reopens completed work item");
  });

  it("validates status transitions via canTransition", () => {
    const valid = workflowService.canTransition("To Do", "In Progress", mockStatuses);
    expect(valid.allowed).toBe(true);

    const same = workflowService.canTransition("To Do", "To Do", mockStatuses);
    expect(same.allowed).toBe(true);

    const invalid = workflowService.canTransition("To Do", "Non-Existent", mockStatuses);
    expect(invalid.allowed).toBe(false);
    expect(invalid.reason).toContain("Target status 'Non-Existent' is not configured");
  });

  it("exports standard governance policies", () => {
    expect(WORKFLOW_POLICIES.length).toBeGreaterThan(0);
    expect(WORKFLOW_POLICIES.some((p) => p.key === "optimistic_locking")).toBe(true);
    expect(WORKFLOW_POLICIES.some((p) => p.key === "dag_cycle_prevention")).toBe(true);
  });
});
