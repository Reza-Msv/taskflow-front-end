import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchService } from "./search-service";
import { projectService } from "@/services/project-service";
import { taskService } from "@/services/task-service";
import { organizationService } from "@/services/organization-service";
import { dashboardService } from "@/services/dashboard-service";

vi.mock("@/services/project-service");
vi.mock("@/services/task-service");
vi.mock("@/services/organization-service");
vi.mock("@/services/dashboard-service");

describe("searchService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty results for whitespace or empty query without calling APIs", async () => {
    const res = await searchService.globalSearch("   ");
    expect(res.projects).toEqual([]);
    expect(res.tasks).toEqual([]);
    expect(projectService.getProjects).not.toHaveBeenCalled();
    expect(dashboardService.getMyTasks).not.toHaveBeenCalled();
  });

  it("performs global search across projects and assigned tasks", async () => {
    vi.mocked(organizationService.getMyOrganizations).mockResolvedValue({
      items: [
        {
          id: "org-1",
          name: "Acme Corp",
          slug: "acme",
          is_active: true,
          created_at: "",
          updated_at: "",
        },
      ],
      total: 1,
      page: 1,
      page_size: 1,
    });

    vi.mocked(projectService.getProjects).mockResolvedValue({
      items: [
        {
          id: "p-1",
          organization_id: "org-1",
          name: "Auth Refactor",
          key: "AUTH",
          description: "Auth system upgrade",
          is_private: false,
          is_archived: false,
          created_at: "",
          updated_at: "",
        },
      ],
      total: 1,
      page: 1,
      page_size: 10,
    });

    vi.mocked(dashboardService.getMyTasks).mockResolvedValue({
      items: [
        {
          id: "t-1",
          issue_key: "AUTH-10",
          type: "task",
          title: "Fix Token Expiration",
          status: "in_progress",
          priority: "high",
          due_date: "2026-11-01T00:00:00Z",
          estimated_points: null,
          rank: "0|hzzzzz:",
          created_at: "",
          updated_at: "",
          project: {
            id: "p-1",
            name: "Auth Refactor",
            key: "AUTH",
            organization_id: "org-1",
            is_private: false,
          },
          is_overdue: false,
        },
      ],
      total: 1,
      page: 1,
      page_size: 50,
      total_pages: 1,
    });

    const res = await searchService.globalSearch("Token", {
      organizationId: "org-1",
    });

    expect(projectService.getProjects).toHaveBeenCalledWith("org-1", {
      search: "Token",
      page_size: 10,
    });
    expect(res.tasks).toHaveLength(1);
    expect(res.tasks[0].title).toBe("Fix Token Expiration");
    expect(res.tasks[0].issueKey).toBe("AUTH-10");
  });

  it("searches tasks within a specific project if projectId option is supplied", async () => {
    vi.mocked(projectService.getProjects).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      page_size: 10,
    });

    vi.mocked(taskService.getTasks).mockResolvedValue({
      items: [
        {
          id: "task-spec",
          project_id: "p-specific",
          organization_id: "org-1",
          sequence_number: 5,
          issue_key: "SPEC-5",
          type: "task",
          title: "Specific Project Task",
          status: "todo",
          priority: "urgent",
          rank: "0|hzzzzz:",
          version: 1,
          created_at: "",
          updated_at: "",
        },
      ],
      total: 1,
      page: 1,
      page_size: 10,
    });

    const res = await searchService.globalSearch("Specific", {
      organizationId: "org-1",
      projectId: "p-specific",
    });

    expect(taskService.getTasks).toHaveBeenCalledWith("org-1", "p-specific", {
      search: "Specific",
      page_size: 10,
    });
    expect(res.tasks).toHaveLength(1);
    expect(res.tasks[0].issueKey).toBe("SPEC-5");
  });

  it("handles project service failure gracefully and still returns task matches", async () => {
    vi.mocked(projectService.getProjects).mockRejectedValue(new Error("Network failure"));
    vi.mocked(dashboardService.getMyTasks).mockResolvedValue({
      items: [
        {
          id: "t-fail",
          issue_key: "OK-1",
          type: "task",
          title: "Matching Task",
          status: "done",
          priority: "low",
          due_date: null,
          estimated_points: null,
          rank: "0|hzzzzz:",
          created_at: "",
          updated_at: "",
          project: {
            id: "p-1",
            name: "P1",
            key: "P1",
            organization_id: "org-1",
            is_private: false,
          },
          is_overdue: false,
        },
      ],
      total: 1,
      page: 1,
      page_size: 50,
      total_pages: 1,
    });

    const res = await searchService.globalSearch("Matching", {
      organizationId: "org-1",
    });

    expect(res.projects).toEqual([]);
    expect(res.tasks).toHaveLength(1);
    expect(res.tasks[0].title).toBe("Matching Task");
  });
});
