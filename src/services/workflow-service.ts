import { taskService } from "@/services/task-service";
import type {
  WorkflowStatusResponse,
} from "@/services/generated/api-types";

export interface WorkflowTransitionRule {
  fromStatusId: string;
  fromStatusName: string;
  toStatusId: string;
  toStatusName: string;
  isAllowed: boolean;
  policyNotes?: string;
}

export interface WorkflowGovernancePolicy {
  key: string;
  title: string;
  description: string;
  enforcement: "server" | "client_guard" | "strict_db";
  status: "active" | "planned";
}

export const WORKFLOW_POLICIES: WorkflowGovernancePolicy[] = [
  {
    key: "optimistic_locking",
    title: "Optimistic Concurrency Control",
    description:
      "Prevents conflicting concurrent updates. Every task version is incremented and verified on status transitions.",
    enforcement: "strict_db",
    status: "active",
  },
  {
    key: "dag_cycle_prevention",
    title: "DAG Dependency Cycle Detection",
    description:
      "Strict acyclic graph enforcement ensures tasks cannot form circular blocking relationships.",
    enforcement: "server",
    status: "active",
  },
  {
    key: "auto_completion_timestamp",
    title: "Automated Completion Timestamping",
    description:
      "Moving a task to a 'Done' or 'Completed' status automatically sets the UTC completed_at timestamp; reopening clears it.",
    enforcement: "server",
    status: "active",
  },
  {
    key: "activity_audit_trail",
    title: "Comprehensive Audit Logging",
    description:
      "All status changes, field mutations, attachments, and checklist modifications are immutably logged to task history.",
    enforcement: "server",
    status: "active",
  },
  {
    key: "dependency_lifecycle_guard",
    title: "Blocked Predecessor Guard",
    description:
      "Warns and guards when attempting to mark a work item completed while its predecessor is still unresolved.",
    enforcement: "client_guard",
    status: "active",
  },
];

export const workflowService = {
  /**
   * Fetch all configured workflow statuses for a project via the kanban board
   */
  async getProjectWorkflowStatuses(
    orgId: string,
    projectId: string
  ): Promise<WorkflowStatusResponse[]> {
    const board = await taskService.getKanbanBoard(orgId, projectId);
    return (board.columns || []).map((col) => col.status);
  },

  /**
   * Group statuses by standard lifecycle category
   */
  groupStatusesByCategory(
    statuses: WorkflowStatusResponse[]
  ): Record<string, WorkflowStatusResponse[]> {
    const groups: Record<string, WorkflowStatusResponse[]> = {
      todo: [],
      in_progress: [],
      review: [],
      done: [],
      cancelled: [],
    };

    for (const st of statuses) {
      const cat = (st.category || "todo").toLowerCase();
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(st);
    }

    return groups;
  },

  /**
   * Compute matrix of standard transitions between project statuses
   */
  computeTransitionMatrix(
    statuses: WorkflowStatusResponse[]
  ): WorkflowTransitionRule[] {
    const rules: WorkflowTransitionRule[] = [];

    for (const from of statuses) {
      for (const to of statuses) {
        if (from.id === to.id) continue;

        const isBackwardFromDone =
          from.category === "done" && to.category === "todo";

        rules.push({
          fromStatusId: from.id,
          fromStatusName: from.name,
          toStatusId: to.id,
          toStatusName: to.name,
          isAllowed: true,
          policyNotes: isBackwardFromDone
            ? "Reopens completed work item (clears completed_at)"
            : `Transition from ${from.name} to ${to.name}`,
        });
      }
    }

    return rules;
  },

  /**
   * Check if transition is valid
   */
  canTransition(
    fromStatus: string,
    toStatus: string,
    statuses: WorkflowStatusResponse[]
  ): { allowed: boolean; reason?: string } {
    if (fromStatus === toStatus) {
      return { allowed: true };
    }

    const toObj = statuses.find(
      (s) =>
        s.id === toStatus ||
        s.name.toLowerCase() === toStatus.toLowerCase() ||
        s.category.toLowerCase() === toStatus.toLowerCase()
    );

    if (!toObj) {
      return {
        allowed: false,
        reason: `Target status '${toStatus}' is not configured for this project.`,
      };
    }

    return { allowed: true };
  },
};
