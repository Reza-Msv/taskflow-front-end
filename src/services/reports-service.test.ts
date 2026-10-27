import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  calculateOverviewMetrics,
  calculateCompletionTrends,
  calculateTeamWorkload,
  filterTasksByDateRange,
  resolveDateRange,
  validateDateRange,
  buildCsvString,
  reportsService,
} from "./reports-service";
import { projectService } from "@/services/project-service";
import { taskService } from "@/services/task-service";
import { scrumService } from "@/services/scrum-service";
import type {
  ProjectResponse,
  ProjectMembershipResponse,
  WorkItemResponse,
  SprintResponse,
  ProjectVelocityResponse,
} from "@/services/generated/api-types";

describe("reports-service", () => {
  const fixedNow = new Date("2026-10-27T12:00:00Z");

  const sampleTasks: WorkItemResponse[] = [
    {
      id: "t-1",
      project_id: "p-1",
      organization_id: "o-1",
      sequence_number: 1,
      issue_key: "PROJ-1",
      type: "task",
      title: "Completed Task 1",
      status: "done",
      priority: "high",
      created_at: "2026-10-20T10:00:00Z",
      updated_at: "2026-10-22T15:00:00Z",
      assignee_id: "u-1",
      rank: "0|hzzzzz:",
      version: 1,
    },
    {
      id: "t-2",
      project_id: "p-1",
      organization_id: "o-1",
      sequence_number: 2,
      issue_key: "PROJ-2",
      type: "task",
      title: "In Progress Task",
      status: "in_progress",
      priority: "medium",
      created_at: "2026-10-21T09:00:00Z",
      updated_at: "2026-10-21T09:00:00Z",
      due_date: "2026-10-25T00:00:00Z", // Overdue relative to fixedNow
      assignee_id: "u-1",
      rank: "0|hzzzzz:",
      version: 1,
    },
    {
      id: "t-3",
      project_id: "p-1",
      organization_id: "o-1",
      sequence_number: 3,
      issue_key: "PROJ-3",
      type: "task",
      title: "Open Unassigned Task",
      status: "todo",
      priority: "low",
      created_at: "2026-10-25T11:00:00Z",
      updated_at: "2026-10-25T11:00:00Z",
      due_date: "2026-10-30T00:00:00Z", // Upcoming
      assignee_id: null,
      rank: "0|hzzzzz:",
      version: 1,
    },
    {
      id: "t-4",
      project_id: "p-1",
      organization_id: "o-1",
      sequence_number: 4,
      issue_key: "PROJ-4",
      type: "task",
      title: "Review Task Member 2",
      status: "review",
      priority: "urgent",
      created_at: "2026-10-26T08:00:00Z",
      updated_at: "2026-10-26T08:00:00Z",
      assignee_id: "u-2",
      rank: "0|hzzzzz:",
      version: 1,
    },
  ];

  const sampleMembers: ProjectMembershipResponse[] = [
    {
      id: "pm-1",
      project_id: "p-1",
      user_id: "u-1",
      role: "admin",
      created_at: "2026-10-01T00:00:00Z",
      updated_at: "2026-10-01T00:00:00Z",
      user: {
        id: "u-1",
        email: "alice@taskflow.dev",
        full_name: "Alice Engineer",
        is_active: true,
        is_superuser: false,
        created_at: "2026-10-01T00:00:00Z",
        updated_at: "2026-10-01T00:00:00Z",
      },
    },
    {
      id: "pm-2",
      project_id: "p-1",
      user_id: "u-2",
      role: "member",
      created_at: "2026-10-01T00:00:00Z",
      updated_at: "2026-10-01T00:00:00Z",
      user: {
        id: "u-2",
        email: "bob@taskflow.dev",
        full_name: "Bob Developer",
        is_active: true,
        is_superuser: false,
        created_at: "2026-10-01T00:00:00Z",
        updated_at: "2026-10-01T00:00:00Z",
      },
    },
  ];

  describe("resolveDateRange & validateDateRange", () => {
    it("resolves presets accurately", () => {
      const now = new Date("2026-10-27T00:00:00Z");
      const r7 = resolveDateRange({ preset: "7d" }, now);
      expect(r7.to).toBe("2026-10-27");
      expect(r7.from).toBe("2026-10-20");

      const rAll = resolveDateRange({ preset: "all" }, now);
      expect(rAll.from).toBeUndefined();
      expect(rAll.to).toBeUndefined();

      const rCustom = resolveDateRange(
        { preset: "custom", from: "2026-10-01", to: "2026-10-15" },
        now
      );
      expect(rCustom.from).toBe("2026-10-01");
      expect(rCustom.to).toBe("2026-10-15");
    });

    it("validates start date before end date", () => {
      expect(validateDateRange("2026-10-01", "2026-10-10")).toBeNull();
      expect(validateDateRange("2026-10-10", "2026-10-01")).toContain(
        "Start date cannot be after end date"
      );
      expect(validateDateRange("invalid", "2026-10-01")).toContain(
        "Please enter valid date values"
      );
    });
  });

  describe("calculateOverviewMetrics", () => {
    it("computes accurate counts and percentages", () => {
      const metrics = calculateOverviewMetrics(sampleTasks, fixedNow);
      expect(metrics.totalTasks).toBe(4);
      expect(metrics.completedTasks).toBe(1);
      expect(metrics.openTasks).toBe(1); // t-3
      expect(metrics.inProgressTasks).toBe(2); // t-2 (in_progress), t-4 (review)
      expect(metrics.overdueTasks).toBe(1); // t-2 (due 2026-10-25 < fixedNow)
      expect(metrics.unassignedTasks).toBe(1); // t-3
      expect(metrics.completionPercentage).toBe(25); // 1 / 4 = 25%
    });

    it("handles zero tasks gracefully without division by zero", () => {
      const metrics = calculateOverviewMetrics([]);
      expect(metrics.totalTasks).toBe(0);
      expect(metrics.completedTasks).toBe(0);
      expect(metrics.completionPercentage).toBe(0);
    });
  });

  describe("calculateCompletionTrends", () => {
    it("groups daily points chronologically and accumulates completed count", () => {
      const trends = calculateCompletionTrends(sampleTasks, "daily");
      expect(trends.length).toBeGreaterThan(0);

      // Verify that timestamps are sorted in ascending order
      for (let i = 1; i < trends.length; i++) {
        expect(trends[i].timestamp).toBeGreaterThanOrEqual(
          trends[i - 1].timestamp
        );
      }

      // Check final cumulative completed count equals total completed tasks
      const lastPoint = trends[trends.length - 1];
      expect(lastPoint.cumulativeCompleted).toBe(1);
    });

    it("supports weekly and monthly intervals", () => {
      const weeklyTrends = calculateCompletionTrends(sampleTasks, "weekly");
      expect(weeklyTrends.length).toBeGreaterThan(0);

      const monthlyTrends = calculateCompletionTrends(sampleTasks, "monthly");
      expect(monthlyTrends.length).toBeGreaterThan(0);
    });

    it("returns empty array when tasks are empty", () => {
      expect(calculateCompletionTrends([], "daily")).toEqual([]);
    });
  });

  describe("calculateTeamWorkload", () => {
    it("aggregates assignments, overdue, and completed per member", () => {
      const workload = calculateTeamWorkload(
        sampleMembers,
        sampleTasks,
        fixedNow
      );
      expect(workload.unassignedTasks).toBe(1);
      expect(workload.members).toHaveLength(2);

      const alice = workload.members.find((m) => m.userId === "u-1");
      expect(alice).toBeDefined();
      expect(alice?.assignedTasks).toBe(2);
      expect(alice?.completedTasks).toBe(1);
      expect(alice?.inProgressTasks).toBe(1);
      expect(alice?.overdueTasks).toBe(1);

      const bob = workload.members.find((m) => m.userId === "u-2");
      expect(bob).toBeDefined();
      expect(bob?.assignedTasks).toBe(1);
      expect(bob?.inProgressTasks).toBe(1);
      expect(bob?.completedTasks).toBe(0);
    });

    it("tracks unassigned tasks properly", () => {
      const workload = calculateTeamWorkload([], sampleTasks, fixedNow);
      expect(workload.unassignedTasks).toBe(1);
    });
  });

  describe("filterTasksByDateRange", () => {
    it("filters tasks within range correctly", () => {
      const filtered = filterTasksByDateRange(
        sampleTasks,
        "2026-10-24",
        "2026-10-27"
      );
      // t-2 due on 2026-10-25
      // t-3 created on 2026-10-25
      // t-4 created on 2026-10-26
      expect(filtered.map((t) => t.id)).toContain("t-2");
      expect(filtered.map((t) => t.id)).toContain("t-3");
      expect(filtered.map((t) => t.id)).toContain("t-4");
      expect(filtered.map((t) => t.id)).not.toContain("t-1");
    });
  });

  describe("buildCsvString", () => {
    it("escapes quotes, commas, and newlines properly", () => {
      const headers = ["Title", "Notes", "Count"];
      const rows = [
        ['Task with "quotes"', "Hello, World", 5],
        ["Simple", "Line 1\nLine 2", 10],
      ];
      const csv = buildCsvString(headers, rows);
      expect(csv).toContain('"Task with ""quotes"""');
      expect(csv).toContain('"Hello, World"');
      expect(csv).toContain('"Line 1\nLine 2"');
    });
  });

  describe("reportsService.getProjectReportsData", () => {
    it("fetches data concurrently and integrates all metrics", async () => {
      const mockProject: ProjectResponse = {
        id: "p-1",
        organization_id: "o-1",
        name: "Test Project",
        key: "TEST",
        description: null,
        is_private: false,
        is_archived: false,
        owner_id: "u-1",
        created_at: "2026-10-01T00:00:00Z",
        updated_at: "2026-10-01T00:00:00Z",
      };

      vi.spyOn(projectService, "getProject").mockResolvedValue(mockProject);
      vi.spyOn(projectService, "getMembers").mockResolvedValue({
        items: sampleMembers,
        total: 2,
        page: 1,
        page_size: 100,
      });
      vi.spyOn(taskService, "getTasks").mockResolvedValue({
        items: sampleTasks,
        total: 4,
        page: 1,
        page_size: 100,
      });
      vi.spyOn(scrumService, "listSprints").mockResolvedValue({
        items: [],
        total: 0,
      });
      vi.spyOn(scrumService, "getProjectVelocity").mockResolvedValue({
        project_id: "p-1",
        completed_sprints_count: 0,
        average_velocity_points: 0,
        average_velocity_tasks: 0,
        sprints: [],
        policy_notes: "Completed sprints only",
      });

      const data = await reportsService.getProjectReportsData(
        "o-1",
        "p-1",
        { preset: "all" },
        "daily"
      );

      expect(data.project.name).toBe("Test Project");
      expect(data.metrics.totalTasks).toBe(4);
      expect(data.trends.length).toBeGreaterThan(0);
      expect(data.workload.members).toHaveLength(2);
      expect(data.velocity?.average_velocity_points).toBe(0);
    });
  });
});
