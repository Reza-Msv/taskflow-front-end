import { describe, it, expect, vi, beforeEach } from "vitest";
import { scrumService, SCRUM_ENDPOINTS } from "./scrum-service";
import { apiClient } from "./api-client";
import type {
  SprintResponse,
  SprintListResponse,
  BacklogSummaryResponse,
  SprintSummaryResponse,
  SprintBurndownResponse,
  ProjectVelocityResponse,
  SprintRetrospectiveResponse,
  WorkItemResponse,
  WorkItemListResponse,
} from "./generated/api-types";

vi.mock("./api-client", () => ({
  apiClient: vi.fn(),
}));

describe("scrumService", () => {
  const mockOrgId = "org-123";
  const mockProjectId = "proj-456";
  const mockSprintId = "sprint-789";
  const mockTaskId = "task-abc";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getBacklog", () => {
    it("fetches backlog with default params", async () => {
      const mockResponse: BacklogSummaryResponse = {
        total_tasks: 2,
        total_points: 13,
        unestimated_tasks: 1,
        items: [],
        page: 1,
        page_size: 25,
        total: 2,
      };

      vi.mocked(apiClient).mockResolvedValueOnce(mockResponse);

      const result = await scrumService.getBacklog(mockOrgId, mockProjectId);

      expect(apiClient).toHaveBeenCalledWith(
        SCRUM_ENDPOINTS.backlog(mockOrgId, mockProjectId),
        { method: "GET" }
      );
      expect(result).toEqual(mockResponse);
    });

    it("appends query filters when provided", async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({
        total_tasks: 1,
        total_points: 5,
        unestimated_tasks: 0,
        items: [],
        page: 2,
        page_size: 10,
        total: 1,
      });

      await scrumService.getBacklog(mockOrgId, mockProjectId, {
        priority: "urgent",
        status: "todo",
        search: "auth",
        page: 2,
        page_size: 10,
        sort_by: "rank",
        sort_dir: "asc",
      });

      const calledUrl = vi.mocked(apiClient).mock.calls[0][0];
      expect(calledUrl).toContain("priority=urgent");
      expect(calledUrl).toContain("status=todo");
      expect(calledUrl).toContain("search=auth");
      expect(calledUrl).toContain("page=2");
      expect(calledUrl).toContain("page_size=10");
      expect(calledUrl).toContain("sort_by=rank");
      expect(calledUrl).toContain("sort_dir=asc");
    });
  });

  describe("moveTasksToBacklog", () => {
    it("posts task_ids to backlogTasks endpoint", async () => {
      const mockItems: WorkItemResponse[] = [];
      vi.mocked(apiClient).mockResolvedValueOnce(mockItems);

      const result = await scrumService.moveTasksToBacklog(mockOrgId, mockProjectId, {
        task_ids: [mockTaskId],
      });

      expect(apiClient).toHaveBeenCalledWith(
        SCRUM_ENDPOINTS.backlogTasks(mockOrgId, mockProjectId),
        {
          method: "POST",
          body: JSON.stringify({ task_ids: [mockTaskId] }),
        }
      );
      expect(result).toEqual(mockItems);
    });
  });

  describe("reorderBacklog", () => {
    it("puts reordered task sequence to backlogReorder endpoint", async () => {
      const mockItems: WorkItemResponse[] = [];
      vi.mocked(apiClient).mockResolvedValueOnce(mockItems);

      const result = await scrumService.reorderBacklog(mockOrgId, mockProjectId, {
        ordered_task_ids: ["t1", "t2", "t3"],
      });

      expect(apiClient).toHaveBeenCalledWith(
        SCRUM_ENDPOINTS.backlogReorder(mockOrgId, mockProjectId),
        {
          method: "PUT",
          body: JSON.stringify({ ordered_task_ids: ["t1", "t2", "t3"] }),
        }
      );
      expect(result).toEqual(mockItems);
    });
  });

  describe("createSprint", () => {
    it("posts new sprint payload", async () => {
      const mockSprint: SprintResponse = {
        id: mockSprintId,
        project_id: mockProjectId,
        name: "Sprint 1",
        status: "draft",
        total_tasks: 0,
        completed_tasks: 0,
        total_points: 0,
        completed_points: 0,
        created_at: "2026-10-27T00:00:00Z",
        updated_at: "2026-10-27T00:00:00Z",
      };

      vi.mocked(apiClient).mockResolvedValueOnce(mockSprint);

      const result = await scrumService.createSprint(mockOrgId, mockProjectId, {
        name: "Sprint 1",
        goal: "Sprint goal",
      });

      expect(apiClient).toHaveBeenCalledWith(
        SCRUM_ENDPOINTS.sprints(mockOrgId, mockProjectId),
        {
          method: "POST",
          body: JSON.stringify({ name: "Sprint 1", goal: "Sprint goal" }),
        }
      );
      expect(result).toEqual(mockSprint);
    });
  });

  describe("listSprints", () => {
    it("lists sprints with status filter", async () => {
      const mockList: SprintListResponse = { items: [], total: 0 };
      vi.mocked(apiClient).mockResolvedValueOnce(mockList);

      const result = await scrumService.listSprints(mockOrgId, mockProjectId, {
        status: "draft",
      });

      expect(apiClient).toHaveBeenCalledWith(
        `${SCRUM_ENDPOINTS.sprints(mockOrgId, mockProjectId)}?status=draft`,
        { method: "GET" }
      );
      expect(result).toEqual(mockList);
    });
  });

  describe("startSprint and completeSprint", () => {
    it("starts a sprint (draft -> active)", async () => {
      const mockSprint: SprintResponse = {
        id: mockSprintId,
        project_id: mockProjectId,
        name: "Sprint 1",
        status: "active",
        total_tasks: 2,
        completed_tasks: 0,
        total_points: 8,
        completed_points: 0,
        created_at: "2026-10-27T00:00:00Z",
        updated_at: "2026-10-27T00:00:00Z",
      };

      vi.mocked(apiClient).mockResolvedValueOnce(mockSprint);

      const result = await scrumService.startSprint(mockOrgId, mockProjectId, mockSprintId, {
        goal: "Execution phase",
      });

      expect(apiClient).toHaveBeenCalledWith(
        SCRUM_ENDPOINTS.sprintStart(mockOrgId, mockProjectId, mockSprintId),
        {
          method: "POST",
          body: JSON.stringify({ goal: "Execution phase" }),
        }
      );
      expect(result).toEqual(mockSprint);
    });

    it("completes a sprint with rollover strategy", async () => {
      const mockSprint: SprintResponse = {
        id: mockSprintId,
        project_id: mockProjectId,
        name: "Sprint 1",
        status: "completed",
        total_tasks: 2,
        completed_tasks: 2,
        total_points: 8,
        completed_points: 8,
        created_at: "2026-10-27T00:00:00Z",
        updated_at: "2026-10-27T00:00:00Z",
      };

      vi.mocked(apiClient).mockResolvedValueOnce(mockSprint);

      const result = await scrumService.completeSprint(
        mockOrgId,
        mockProjectId,
        mockSprintId,
        {
          move_unfinished_to: "backlog",
        }
      );

      expect(apiClient).toHaveBeenCalledWith(
        SCRUM_ENDPOINTS.sprintComplete(mockOrgId, mockProjectId, mockSprintId),
        {
          method: "POST",
          body: JSON.stringify({ move_unfinished_to: "backlog" }),
        }
      );
      expect(result).toEqual(mockSprint);
    });
  });

  describe("task membership and estimation", () => {
    it("assigns tasks to sprint", async () => {
      vi.mocked(apiClient).mockResolvedValueOnce([]);

      await scrumService.assignTasksToSprint(mockOrgId, mockProjectId, mockSprintId, {
        task_ids: [mockTaskId],
      });

      expect(apiClient).toHaveBeenCalledWith(
        SCRUM_ENDPOINTS.sprintTasks(mockOrgId, mockProjectId, mockSprintId),
        {
          method: "POST",
          body: JSON.stringify({ task_ids: [mockTaskId] }),
        }
      );
    });

    it("removes a task from sprint back to backlog", async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({ id: mockTaskId, sprint_id: null });

      await scrumService.removeTaskFromSprint(
        mockOrgId,
        mockProjectId,
        mockSprintId,
        mockTaskId
      );

      expect(apiClient).toHaveBeenCalledWith(
        SCRUM_ENDPOINTS.sprintTask(mockOrgId, mockProjectId, mockSprintId, mockTaskId),
        { method: "DELETE" }
      );
    });

    it("estimates story points for a task", async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({
        id: mockTaskId,
        estimated_points: 5.0,
      });

      await scrumService.estimateTask(mockOrgId, mockProjectId, mockTaskId, {
        estimated_points: 5.0,
      });

      expect(apiClient).toHaveBeenCalledWith(
        SCRUM_ENDPOINTS.taskEstimate(mockOrgId, mockProjectId, mockTaskId),
        {
          method: "POST",
          body: JSON.stringify({ estimated_points: 5.0 }),
        }
      );
    });
  });

  describe("reports and metrics", () => {
    it("fetches sprint summary", async () => {
      const mockSummary: SprintSummaryResponse = {
        sprint_id: mockSprintId,
        sprint_name: "Sprint 1",
        project_id: mockProjectId,
        status: "active",
        total_task_count: 5,
        completed_task_count: 3,
        incomplete_task_count: 2,
        remaining_task_count: 2,
        total_estimated_points: 20,
        completed_points: 12,
        remaining_points: 8,
        unestimated_task_count: 0,
        completion_percentage_tasks: 60,
        completion_percentage_points: 60,
      };

      vi.mocked(apiClient).mockResolvedValueOnce(mockSummary);

      const result = await scrumService.getSprintSummary(
        mockOrgId,
        mockProjectId,
        mockSprintId
      );

      expect(apiClient).toHaveBeenCalledWith(
        SCRUM_ENDPOINTS.sprintSummary(mockOrgId, mockProjectId, mockSprintId),
        { method: "GET" }
      );
      expect(result).toEqual(mockSummary);
    });

    it("fetches sprint burndown time series", async () => {
      const mockBurndown: SprintBurndownResponse = {
        sprint_id: mockSprintId,
        sprint_name: "Sprint 1",
        status: "active",
        total_story_points: 20,
        total_tasks: 5,
        data_points: [],
        metric_types: ["story_points", "task_count"],
        reconstruction_policy: "Audit based",
      };

      vi.mocked(apiClient).mockResolvedValueOnce(mockBurndown);

      const result = await scrumService.getSprintBurndown(
        mockOrgId,
        mockProjectId,
        mockSprintId
      );

      expect(apiClient).toHaveBeenCalledWith(
        SCRUM_ENDPOINTS.sprintBurndown(mockOrgId, mockProjectId, mockSprintId),
        { method: "GET" }
      );
      expect(result).toEqual(mockBurndown);
    });

    it("fetches historical project velocity", async () => {
      const mockVelocity: ProjectVelocityResponse = {
        project_id: mockProjectId,
        completed_sprints_count: 2,
        average_velocity_points: 15,
        average_velocity_tasks: 4,
        sprints: [],
        policy_notes: "Only completed sprints",
      };

      vi.mocked(apiClient).mockResolvedValueOnce(mockVelocity);

      const result = await scrumService.getProjectVelocity(mockOrgId, mockProjectId);

      expect(apiClient).toHaveBeenCalledWith(
        SCRUM_ENDPOINTS.projectVelocity(mockOrgId, mockProjectId),
        { method: "GET" }
      );
      expect(result).toEqual(mockVelocity);
    });
  });

  describe("retrospectives", () => {
    it("fetches and saves sprint retrospective", async () => {
      const mockRetro: SprintRetrospectiveResponse = {
        id: "retro-1",
        sprint_id: mockSprintId,
        what_went_well: "Fast delivery",
        what_could_be_improved: "Fewer meetings",
        action_items: "Automate tests",
        created_at: "2026-10-27T00:00:00Z",
        updated_at: "2026-10-27T00:00:00Z",
      };

      vi.mocked(apiClient).mockResolvedValueOnce(mockRetro);

      const resGet = await scrumService.getSprintRetrospective(
        mockOrgId,
        mockProjectId,
        mockSprintId
      );
      expect(resGet).toEqual(mockRetro);

      vi.mocked(apiClient).mockResolvedValueOnce(mockRetro);
      const resSave = await scrumService.saveSprintRetrospective(
        mockOrgId,
        mockProjectId,
        mockSprintId,
        { what_went_well: "Fast delivery" }
      );
      expect(resSave).toEqual(mockRetro);
    });
  });
});
