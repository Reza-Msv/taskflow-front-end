export type ViewMode = "board" | "list" | "overview";

export interface SampleTask {
  id: string;
  title: string;
  status: "In Progress" | "To Do" | "Done";
  statusColor: string;
  priority: string;
  assignee: string;
  sprint: string;
  type: string;
}

export const sampleTasks: SampleTask[] = [
  {
    id: "TF-101",
    title: "Set up multi-tenant organization context middleware",
    status: "In Progress",
    statusColor: "text-brand-orange bg-brand-orange/10 border-brand-orange/20",
    priority: "P1 High",
    assignee: "Alex R.",
    sprint: "Sprint 14",
    type: "Task",
  },
  {
    id: "TF-102",
    title: "Optimistic concurrency version check in WorkItems domain",
    status: "In Progress",
    statusColor: "text-brand-orange bg-brand-orange/10 border-brand-orange/20",
    priority: "P1 High",
    assignee: "Elena M.",
    sprint: "Sprint 14",
    type: "Story",
  },
  {
    id: "TF-103",
    title: "Deterministic issue sequence counters on project creation",
    status: "To Do",
    statusColor: "text-status-info bg-status-info/10 border-status-info/20",
    priority: "P2 Medium",
    assignee: "Marcus T.",
    sprint: "Sprint 14",
    type: "Bug",
  },
  {
    id: "TF-104",
    title: "Synchronize openapi.json with Next.js client types",
    status: "Done",
    statusColor:
      "text-status-success bg-status-success/10 border-status-success/20",
    priority: "P3 Low",
    assignee: "Sarah K.",
    sprint: "Sprint 14",
    type: "Task",
  },
  {
    id: "TF-105",
    title: "Implement Argon2id password hash verification",
    status: "Done",
    statusColor:
      "text-status-success bg-status-success/10 border-status-success/20",
    priority: "P1 High",
    assignee: "Elena M.",
    sprint: "Sprint 14",
    type: "Task",
  },
];
