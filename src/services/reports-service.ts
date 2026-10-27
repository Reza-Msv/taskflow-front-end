import { projectService } from "@/services/project-service";
import { taskService } from "@/services/task-service";
import { scrumService } from "@/services/scrum-service";
import type {
  ProjectResponse,
  ProjectMembershipResponse,
  WorkItemResponse,
  SprintResponse,
  SprintBurndownResponse,
  ProjectVelocityResponse,
} from "@/services/generated/api-types";

export type TrendInterval = "daily" | "weekly" | "monthly";

export type DateRangePreset = "7d" | "14d" | "30d" | "90d" | "all" | "custom";

export interface DateRangeFilter {
  preset: DateRangePreset;
  from?: string; // ISO date string YYYY-MM-DD
  to?: string; // ISO date string YYYY-MM-DD
}

export interface OverviewMetrics {
  totalTasks: number;
  completedTasks: number;
  openTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  unassignedTasks: number;
  completionPercentage: number;
}

export interface TrendDataPoint {
  key: string;
  label: string;
  timestamp: number;
  created: number;
  completed: number;
  cumulativeCompleted: number;
}

export interface MemberWorkload {
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: string;
  assignedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completedTasks: number;
}

export interface WorkloadReport {
  members: MemberWorkload[];
  unassignedTasks: number;
}

export interface ProjectReportsData {
  project: ProjectResponse;
  members: ProjectMembershipResponse[];
  tasks: WorkItemResponse[];
  sprints: SprintResponse[];
  velocity: ProjectVelocityResponse | null;
  metrics: OverviewMetrics;
  trends: TrendDataPoint[];
  workload: WorkloadReport;
}

/**
 * Resolves preset into concrete `from` and `to` strings (YYYY-MM-DD).
 */
export function resolveDateRange(
  range: DateRangeFilter,
  now: Date = new Date()
): {
  from?: string;
  to?: string;
} {
  if (range.preset === "all") {
    return { from: undefined, to: undefined };
  }

  if (range.preset === "custom") {
    return { from: range.from, to: range.to };
  }

  const toDate = new Date(now);
  const fromDate = new Date(now);

  switch (range.preset) {
    case "7d":
      fromDate.setDate(toDate.getDate() - 7);
      break;
    case "14d":
      fromDate.setDate(toDate.getDate() - 14);
      break;
    case "30d":
      fromDate.setDate(toDate.getDate() - 30);
      break;
    case "90d":
      fromDate.setDate(toDate.getDate() - 90);
      break;
  }

  return {
    from: fromDate.toISOString().split("T")[0],
    to: toDate.toISOString().split("T")[0],
  };
}

/**
 * Validates date range. Returns an error message if invalid, or null if valid.
 */
export function validateDateRange(from?: string, to?: string): string | null {
  if (!from || !to) return null;
  const fromTime = new Date(from).getTime();
  const toTime = new Date(to).getTime();
  if (Number.isNaN(fromTime) || Number.isNaN(toTime)) {
    return "Please enter valid date values.";
  }
  if (fromTime > toTime) {
    return "Start date cannot be after end date.";
  }
  return null;
}

/**
 * Filters tasks based on date range.
 * If range has `from` or `to`, checks whether the task was created or due within the range.
 */
export function filterTasksByDateRange(
  tasks: WorkItemResponse[],
  from?: string,
  to?: string
): WorkItemResponse[] {
  if (!from && !to) return tasks;

  const fromTime = from ? new Date(`${from}T00:00:00Z`).getTime() : -Infinity;
  const toTime = to ? new Date(`${to}T23:59:59.999Z`).getTime() : Infinity;

  return tasks.filter((task) => {
    const createdTime = new Date(task.created_at).getTime();
    const dueTime = task.due_date ? new Date(task.due_date).getTime() : null;

    // Task matches if either created in range or due in range
    const createdInRange = createdTime >= fromTime && createdTime <= toTime;
    const dueInRange =
      dueTime !== null && dueTime >= fromTime && dueTime <= toTime;

    return createdInRange || dueInRange;
  });
}

/**
 * Calculates high-level overview metrics from tasks.
 */
export function calculateOverviewMetrics(
  tasks: WorkItemResponse[],
  now: Date = new Date()
): OverviewMetrics {
  const total = tasks.length;
  let completed = 0;
  let open = 0;
  let inProgress = 0;
  let overdue = 0;
  let unassigned = 0;

  const nowTime = now.getTime();

  for (const task of tasks) {
    const isDone =
      task.status.toLowerCase() === "done" ||
      (task as unknown as { is_completed?: boolean }).is_completed === true;

    if (isDone) {
      completed++;
    } else {
      const statusLower = task.status.toLowerCase();
      if (
        statusLower === "in_progress" ||
        statusLower === "in-progress" ||
        statusLower === "review" ||
        statusLower === "testing"
      ) {
        inProgress++;
      } else {
        open++;
      }

      // Check overdue for incomplete tasks
      if (task.due_date) {
        const dueTime = new Date(task.due_date).getTime();
        if (dueTime < nowTime) {
          overdue++;
        }
      }
    }

    if (!task.assignee_id) {
      unassigned++;
    }
  }

  const completionPercentage =
    total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    totalTasks: total,
    completedTasks: completed,
    openTasks: open,
    inProgressTasks: inProgress,
    overdueTasks: overdue,
    unassignedTasks: unassigned,
    completionPercentage,
  };
}

/**
 * Computes time-series trend data aggregated by day, week, or month.
 */
export function calculateCompletionTrends(
  tasks: WorkItemResponse[],
  interval: TrendInterval = "daily",
  from?: string,
  to?: string
): TrendDataPoint[] {
  if (tasks.length === 0) return [];

  // Determine chronological boundary
  const timestamps = tasks.map((t) => new Date(t.created_at).getTime());
  const minTime = from
    ? new Date(`${from}T00:00:00Z`).getTime()
    : Math.min(...timestamps);
  const maxTime = to
    ? new Date(`${to}T23:59:59Z`).getTime()
    : Math.max(Date.now(), ...timestamps);

  if (minTime > maxTime) return [];

  // Bucket map: key -> { created: number, completed: number, timestamp: number, label: string }
  const buckets = new Map<
    string,
    {
      key: string;
      label: string;
      timestamp: number;
      created: number;
      completed: number;
    }
  >();

  const getBucketKey = (
    date: Date
  ): { key: string; label: string; timestamp: number } => {
    if (interval === "monthly") {
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, "0");
      const key = `${y}-${m}`;
      const label = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      });
      const timestamp = Date.UTC(y, date.getUTCMonth(), 1);
      return { key, label, timestamp };
    }

    if (interval === "weekly") {
      // Find start of week (Sunday)
      const d = new Date(date);
      const day = d.getUTCDay();
      d.setUTCDate(d.getUTCDate() - day);
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, "0");
      const dayStr = String(d.getUTCDate()).padStart(2, "0");
      const key = `${y}-${m}-${dayStr}`;
      const label = `Wk of ${d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      })}`;
      const timestamp = Date.UTC(y, d.getUTCMonth(), d.getUTCDate());
      return { key, label, timestamp };
    }

    // Default: daily
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    const key = `${y}-${m}-${d}`;
    const label = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
    const timestamp = Date.UTC(y, date.getUTCMonth(), date.getUTCDate());
    return { key, label, timestamp };
  };

  // Populate continuous empty buckets to ensure uniform X-axis
  const stepDays = interval === "monthly" ? 30 : interval === "weekly" ? 7 : 1;
  const cursor = new Date(minTime);
  while (cursor.getTime() <= maxTime) {
    const { key, label, timestamp } = getBucketKey(cursor);
    if (!buckets.has(key)) {
      buckets.set(key, { key, label, timestamp, created: 0, completed: 0 });
    }
    cursor.setUTCDate(cursor.getUTCDate() + stepDays);
  }

  // Ensure last point bucket is included
  const lastBucket = getBucketKey(new Date(maxTime));
  if (!buckets.has(lastBucket.key)) {
    buckets.set(lastBucket.key, { ...lastBucket, created: 0, completed: 0 });
  }

  // Populate data from real tasks
  for (const task of tasks) {
    const createdDate = new Date(task.created_at);
    const {
      key: createdKey,
      label: createdLabel,
      timestamp: createdTs,
    } = getBucketKey(createdDate);

    if (buckets.has(createdKey)) {
      buckets.get(createdKey)!.created += 1;
    } else {
      buckets.set(createdKey, {
        key: createdKey,
        label: createdLabel,
        timestamp: createdTs,
        created: 1,
        completed: 0,
      });
    }

    const isDone =
      task.status.toLowerCase() === "done" ||
      (task as unknown as { is_completed?: boolean }).is_completed === true;
    if (isDone) {
      const completedDate = new Date(task.updated_at || task.created_at);
      const {
        key: completedKey,
        label: completedLabel,
        timestamp: completedTs,
      } = getBucketKey(completedDate);

      if (buckets.has(completedKey)) {
        buckets.get(completedKey)!.completed += 1;
      } else {
        buckets.set(completedKey, {
          key: completedKey,
          label: completedLabel,
          timestamp: completedTs,
          created: 0,
          completed: 1,
        });
      }
    }
  }

  // Sort chronologically and compute running cumulative completed
  const sortedPoints = Array.from(buckets.values()).sort(
    (a, b) => a.timestamp - b.timestamp
  );

  let cumulative = 0;
  return sortedPoints.map((point) => {
    cumulative += point.completed;
    return {
      key: point.key,
      label: point.label,
      timestamp: point.timestamp,
      created: point.created,
      completed: point.completed,
      cumulativeCompleted: cumulative,
    };
  });
}

/**
 * Computes workload distribution per team member and unassigned tasks.
 */
export function calculateTeamWorkload(
  members: ProjectMembershipResponse[],
  tasks: WorkItemResponse[],
  now: Date = new Date()
): WorkloadReport {
  const nowTime = now.getTime();
  const memberMap = new Map<string, MemberWorkload>();

  for (const m of members) {
    const name = m.user?.full_name || m.user?.email || "Team Member";
    memberMap.set(m.user_id, {
      userId: m.user_id,
      name,
      email: m.user?.email || "",
      avatarUrl: (m.user as { avatar_url?: string | null })?.avatar_url || null,
      role: m.role,
      assignedTasks: 0,
      inProgressTasks: 0,
      overdueTasks: 0,
      completedTasks: 0,
    });
  }

  let unassigned = 0;

  for (const task of tasks) {
    if (!task.assignee_id) {
      unassigned++;
      continue;
    }

    let memberStats = memberMap.get(task.assignee_id);
    if (!memberStats) {
      // User is assigned a task but might not be in the direct project members list
      const fallbackName = `User (${task.assignee_id.slice(0, 8)})`;
      memberStats = {
        userId: task.assignee_id,
        name: fallbackName,
        email: "",
        role: "member",
        assignedTasks: 0,
        inProgressTasks: 0,
        overdueTasks: 0,
        completedTasks: 0,
      };
      memberMap.set(task.assignee_id, memberStats);
    }

    memberStats.assignedTasks += 1;

    const isDone =
      task.status.toLowerCase() === "done" ||
      (task as unknown as { is_completed?: boolean }).is_completed === true;
    if (isDone) {
      memberStats.completedTasks += 1;
    } else {
      const statusLower = task.status.toLowerCase();
      if (
        statusLower === "in_progress" ||
        statusLower === "in-progress" ||
        statusLower === "review" ||
        statusLower === "testing"
      ) {
        memberStats.inProgressTasks += 1;
      }

      if (task.due_date && new Date(task.due_date).getTime() < nowTime) {
        memberStats.overdueTasks += 1;
      }
    }
  }

  // Sort members by total assigned tasks descending
  const sortedMembers = Array.from(memberMap.values()).sort(
    (a, b) => b.assignedTasks - a.assignedTasks
  );

  return {
    members: sortedMembers,
    unassignedTasks: unassigned,
  };
}

/**
 * Escapes a cell value for RFC 4180 CSV compliance.
 */
function escapeCsvValue(
  val: string | number | boolean | null | undefined
): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converts array of rows into a valid CSV string.
 */
export function buildCsvString(
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
): string {
  const headerLine = headers.map(escapeCsvValue).join(",");
  const rowLines = rows.map((r) => r.map(escapeCsvValue).join(","));
  return [headerLine, ...rowLines].join("\r\n");
}

/**
 * Triggers browser download for a CSV string.
 */
export function triggerCsvDownload(csvContent: string, filename: string): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates and downloads Overview & Tasks CSV.
 */
export function exportTasksOverviewCsv(
  project: ProjectResponse,
  tasks: WorkItemResponse[],
  metrics: OverviewMetrics,
  dateRange: { from?: string; to?: string }
): void {
  const nowStr = new Date().toISOString().split("T")[0];
  const filename = `taskflow-${project.key.toLowerCase()}-reports-overview-${nowStr}.csv`;

  const headers = [
    "Issue Key",
    "Title",
    "Type",
    "Status",
    "Priority",
    "Assignee ID",
    "Estimated Points",
    "Due Date",
    "Created At",
    "Updated At",
  ];

  const rows = tasks.map((t) => [
    t.issue_key,
    t.title,
    t.type,
    t.status,
    t.priority,
    t.assignee_id || "Unassigned",
    t.estimated_points ?? "",
    t.due_date ? t.due_date.split("T")[0] : "",
    t.created_at.split("T")[0],
    t.updated_at ? t.updated_at.split("T")[0] : "",
  ]);

  const summaryHeader = [
    "--- Summary Metrics ---",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ];
  const summaryRows = [
    ["Total Tasks", metrics.totalTasks, "", "", "", "", "", "", "", ""],
    ["Completed Tasks", metrics.completedTasks, "", "", "", "", "", "", "", ""],
    ["Open Tasks", metrics.openTasks, "", "", "", "", "", "", "", ""],
    [
      "In Progress Tasks",
      metrics.inProgressTasks,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    ["Overdue Tasks", metrics.overdueTasks, "", "", "", "", "", "", "", ""],
    [
      "Unassigned Tasks",
      metrics.unassignedTasks,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "Completion %",
      `${metrics.completionPercentage}%`,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "Date Filter From",
      dateRange.from || "All Time",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "Date Filter To",
      dateRange.to || "All Time",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    ["Exported At", nowStr, "", "", "", "", "", "", "", ""],
  ];

  const content = buildCsvString(headers, [
    ...rows,
    summaryHeader,
    ...summaryRows,
  ]);
  triggerCsvDownload(content, filename);
}

/**
 * Generates and downloads Team Workload CSV.
 */
export function exportTeamWorkloadCsv(
  project: ProjectResponse,
  workload: WorkloadReport
): void {
  const nowStr = new Date().toISOString().split("T")[0];
  const filename = `taskflow-${project.key.toLowerCase()}-team-workload-${nowStr}.csv`;

  const headers = [
    "Member Name",
    "Email",
    "Role",
    "Assigned Tasks",
    "In Progress Tasks",
    "Overdue Tasks",
    "Completed Tasks",
  ];

  const rows = workload.members.map((m) => [
    m.name,
    m.email,
    m.role,
    m.assignedTasks,
    m.inProgressTasks,
    m.overdueTasks,
    m.completedTasks,
  ]);

  // Unassigned row
  rows.push([
    "Unassigned Tasks",
    "-",
    "-",
    workload.unassignedTasks,
    "-",
    "-",
    "-",
  ]);

  const content = buildCsvString(headers, rows);
  triggerCsvDownload(content, filename);
}

/**
 * Generates and downloads Sprint Burndown CSV.
 */
export function exportSprintBurndownCsv(
  project: ProjectResponse,
  burndown: SprintBurndownResponse
): void {
  const nowStr = new Date().toISOString().split("T")[0];
  const sprintSlug = burndown.sprint_name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-");
  const filename = `taskflow-${project.key.toLowerCase()}-sprint-${sprintSlug}-burndown-${nowStr}.csv`;

  const headers = [
    "Date",
    "Remaining Story Points",
    "Ideal Story Points",
    "Completed Story Points",
    "Remaining Tasks",
    "Ideal Tasks",
    "Completed Tasks",
    "Data Available",
    "Notes",
  ];

  const rows = burndown.data_points.map((p) => [
    p.date,
    p.remaining_story_points ?? "",
    p.ideal_story_points ?? "",
    p.completed_story_points,
    p.remaining_tasks ?? "",
    p.ideal_tasks ?? "",
    p.completed_tasks,
    p.data_available ? "Yes" : "No",
    p.notes || "",
  ]);

  const content = buildCsvString(headers, rows);
  triggerCsvDownload(content, filename);
}

/**
 * Main Reports Service
 */
export const reportsService = {
  /**
   * Fetches and aggregates complete reporting data for a project.
   */
  async getProjectReportsData(
    orgId: string,
    projectId: string,
    dateRange: DateRangeFilter,
    interval: TrendInterval = "daily"
  ): Promise<ProjectReportsData> {
    const { from, to } = resolveDateRange(dateRange);

    // Fetch project details, members, tasks, and sprints concurrently
    const [project, membersRes, tasksRes, sprintsRes, velocityRes] =
      await Promise.all([
        projectService.getProject(orgId, projectId),
        projectService.getMembers(orgId, projectId, { page_size: 100 }),
        taskService.getTasks(orgId, projectId, {
          page_size: 100, // retrieve task sample up to 100
          due_date_from: from,
          due_date_to: to,
        }),
        scrumService
          .listSprints(orgId, projectId)
          .catch(() => ({ items: [], total: 0 })),
        scrumService.getProjectVelocity(orgId, projectId).catch(() => null),
      ]);

    const tasks = tasksRes.items || [];
    const members = membersRes.items || [];
    const sprints = sprintsRes.items || [];

    const metrics = calculateOverviewMetrics(tasks);
    const trends = calculateCompletionTrends(tasks, interval, from, to);
    const workload = calculateTeamWorkload(members, tasks);

    return {
      project,
      members,
      tasks,
      sprints,
      velocity: velocityRes,
      metrics,
      trends,
      workload,
    };
  },
};
