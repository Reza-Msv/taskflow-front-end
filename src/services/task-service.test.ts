import { describe, it, expect, vi, beforeEach } from "vitest";
import { taskService, TASK_ENDPOINTS } from "./task-service";
import { apiClient } from "./api-client";
import type {
  KanbanBoardResponse,
  WorkItemResponse,
  WorkItemListResponse,
  WorkItemHistoryListResponse,
} from "./generated/api-types";

vi.mock("./api-client", () => ({
  apiClient: vi.fn(),
}));

describe("taskService", () => {
  const mockOrgId = "org-123";
  const mockProjectId = "proj-456";
  const mockTaskId = "task-789";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getKanbanBoard", () => {
    it("fetches the kanban board with columns and tasks", async () => {
      const mockKanban: KanbanBoardResponse = {
        project_id: mockProjectId,
        total_tasks: 1,
        columns: [
          {
            status: {
              id: "status-1",
              name: "To Do",
              category: "todo",
              position: 1,
              is_default: true,
            },
            total_tasks: 1,
            tasks: [
              {
                id: mockTaskId,
                project_id: mockProjectId,
                organization_id: mockOrgId,
                sequence_number: 1,
                issue_key: "PROJ-1",
                type: "task",
                title: "Test Task",
                status: "todo",
                priority: "medium",
                rank: "0|000001:",
                version: 1,
                created_at: "2026-10-19T10:00:00Z",
                updated_at: "2026-10-19T10:00:00Z",
              },
            ],
          },
        ],
      };

      vi.mocked(apiClient).mockResolvedValueOnce(mockKanban);

      const result = await taskService.getKanbanBoard(mockOrgId, mockProjectId);

      expect(apiClient).toHaveBeenCalledWith(
        TASK_ENDPOINTS.kanban(mockOrgId, mockProjectId),
        { method: "GET" }
      );
      expect(result).toEqual(mockKanban);
    });
  });

  describe("getTasks", () => {
    it("queries tasks with search parameters", async () => {
      const mockList: WorkItemListResponse = {
        items: [],
        total: 0,
        page: 1,
        page_size: 20,
        total_pages: 0,
      };

      vi.mocked(apiClient).mockResolvedValueOnce(mockList);

      const result = await taskService.getTasks(mockOrgId, mockProjectId, {
        status: "todo",
        priority: "high",
        search: "login",
        page: 2,
        page_size: 10,
      });

      expect(apiClient).toHaveBeenCalledWith(
        expect.stringContaining("status=todo"),
        { method: "GET" }
      );
      expect(apiClient).toHaveBeenCalledWith(
        expect.stringContaining("priority=high"),
        { method: "GET" }
      );
      expect(apiClient).toHaveBeenCalledWith(
        expect.stringContaining("search=login"),
        { method: "GET" }
      );
      expect(result).toEqual(mockList);
    });
  });

  describe("getTask", () => {
    it("retrieves a single task", async () => {
      const mockTask: WorkItemResponse = {
        id: mockTaskId,
        project_id: mockProjectId,
        organization_id: mockOrgId,
        sequence_number: 1,
        issue_key: "PROJ-1",
        type: "task",
        title: "Test Task",
        status: "todo",
        priority: "medium",
        rank: "0|000001:",
        version: 1,
        created_at: "2026-10-19T10:00:00Z",
        updated_at: "2026-10-19T10:00:00Z",
      };

      vi.mocked(apiClient).mockResolvedValueOnce(mockTask);

      const result = await taskService.getTask(
        mockOrgId,
        mockProjectId,
        mockTaskId
      );

      expect(apiClient).toHaveBeenCalledWith(
        TASK_ENDPOINTS.task(mockOrgId, mockProjectId, mockTaskId),
        { method: "GET" }
      );
      expect(result).toEqual(mockTask);
    });
  });

  describe("createTask", () => {
    it("creates a new task", async () => {
      const payload = {
        title: "New Task",
        description: "Task description",
        priority: "high",
        status: "todo",
      };
      const createdTask: WorkItemResponse = {
        id: mockTaskId,
        project_id: mockProjectId,
        organization_id: mockOrgId,
        sequence_number: 2,
        issue_key: "PROJ-2",
        type: "task",
        title: "New Task",
        status: "todo",
        priority: "high",
        rank: "0|000002:",
        version: 1,
        created_at: "2026-10-19T10:00:00Z",
        updated_at: "2026-10-19T10:00:00Z",
      };

      vi.mocked(apiClient).mockResolvedValueOnce(createdTask);

      const result = await taskService.createTask(
        mockOrgId,
        mockProjectId,
        payload
      );

      expect(apiClient).toHaveBeenCalledWith(
        TASK_ENDPOINTS.tasks(mockOrgId, mockProjectId),
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
      expect(result).toEqual(createdTask);
    });
  });

  describe("updateTask", () => {
    it("updates task fields with version check", async () => {
      const payload = {
        title: "Updated Task",
        version: 1,
      };
      const updatedTask: WorkItemResponse = {
        id: mockTaskId,
        project_id: mockProjectId,
        organization_id: mockOrgId,
        sequence_number: 1,
        issue_key: "PROJ-1",
        type: "task",
        title: "Updated Task",
        status: "todo",
        priority: "medium",
        rank: "0|000001:",
        version: 2,
        created_at: "2026-10-19T10:00:00Z",
        updated_at: "2026-10-19T10:00:00Z",
      };

      vi.mocked(apiClient).mockResolvedValueOnce(updatedTask);

      const result = await taskService.updateTask(
        mockOrgId,
        mockProjectId,
        mockTaskId,
        payload
      );

      expect(apiClient).toHaveBeenCalledWith(
        TASK_ENDPOINTS.task(mockOrgId, mockProjectId, mockTaskId),
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        }
      );
      expect(result).toEqual(updatedTask);
    });
  });

  describe("moveTask", () => {
    it("moves task to new status column and rank", async () => {
      const payload = {
        status: "in_progress",
        rank: "0|000002:",
        version: 1,
      };
      const movedTask: WorkItemResponse = {
        id: mockTaskId,
        project_id: mockProjectId,
        organization_id: mockOrgId,
        sequence_number: 1,
        issue_key: "PROJ-1",
        type: "task",
        title: "Test Task",
        status: "in_progress",
        priority: "medium",
        version: 2,
        rank: "0|000002:",
        created_at: "2026-10-19T10:00:00Z",
        updated_at: "2026-10-19T10:00:00Z",
      };

      vi.mocked(apiClient).mockResolvedValueOnce(movedTask);

      const result = await taskService.moveTask(
        mockOrgId,
        mockProjectId,
        mockTaskId,
        payload
      );

      expect(apiClient).toHaveBeenCalledWith(
        TASK_ENDPOINTS.move(mockOrgId, mockProjectId, mockTaskId),
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
      expect(result).toEqual(movedTask);
    });
  });

  describe("deleteTask", () => {
    it("deletes a task", async () => {
      vi.mocked(apiClient).mockResolvedValueOnce(undefined);

      await taskService.deleteTask(mockOrgId, mockProjectId, mockTaskId);

      expect(apiClient).toHaveBeenCalledWith(
        TASK_ENDPOINTS.task(mockOrgId, mockProjectId, mockTaskId),
        {
          method: "DELETE",
        }
      );
    });
  });

  describe("getTaskHistory", () => {
    it("fetches activity history for task", async () => {
      const mockHistory: WorkItemHistoryListResponse = {
        items: [
          {
            id: "act-1",
            work_item_id: mockTaskId,
            field: "status",
            old_value: "todo",
            new_value: "in_progress",
            created_at: "2026-10-19T10:30:00Z",
            user: {
              id: "user-1",
              email: "dev@example.com",
              full_name: "Lead Developer",
            },
          },
        ],
        total: 1,
        page: 1,
        page_size: 20,
        total_pages: 1,
      };

      vi.mocked(apiClient).mockResolvedValueOnce(mockHistory);

      const result = await taskService.getTaskHistory(
        mockOrgId,
        mockProjectId,
        mockTaskId,
        { page: 1, page_size: 20 }
      );

      expect(apiClient).toHaveBeenCalledWith(
        TASK_ENDPOINTS.history(mockOrgId, mockProjectId, mockTaskId) +
          "?page=1&page_size=20",
        {
          method: "GET",
        }
      );
      expect(result).toEqual(mockHistory);
    });
  });

  describe("Phase 4 task details and collaboration", () => {
    it("fetches comprehensive task detail", async () => {
      const mockDetail = {
        id: mockTaskId,
        title: "Detailed Task",
        subtasks: [],
        checklists: [],
        attachments: [],
        subtasks_count: 0,
        checklists_count: 0,
        completed_checklists_count: 0,
        attachments_count: 0,
        comments_count: 0,
      };

      vi.mocked(apiClient).mockResolvedValueOnce(mockDetail);

      const result = await taskService.getTaskDetail(
        mockOrgId,
        mockProjectId,
        mockTaskId
      );

      expect(apiClient).toHaveBeenCalledWith(
        TASK_ENDPOINTS.task(mockOrgId, mockProjectId, mockTaskId),
        { method: "GET" }
      );
      expect(result).toEqual(mockDetail);
    });

    it("manages checklist items", async () => {
      const mockItem = {
        id: "check-1",
        work_item_id: mockTaskId,
        title: "Test checklist",
        is_completed: false,
        position: 0,
      };

      vi.mocked(apiClient).mockResolvedValueOnce({ items: [mockItem], total: 1 });
      const list = await taskService.getChecklists(
        mockOrgId,
        mockProjectId,
        mockTaskId
      );
      expect(list.items).toHaveLength(1);

      vi.mocked(apiClient).mockResolvedValueOnce(mockItem);
      const created = await taskService.createChecklistItem(
        mockOrgId,
        mockProjectId,
        mockTaskId,
        { title: "Test checklist" }
      );
      expect(created.title).toBe("Test checklist");

      vi.mocked(apiClient).mockResolvedValueOnce({
        ...mockItem,
        is_completed: true,
      });
      const updated = await taskService.updateChecklistItem(
        mockOrgId,
        mockProjectId,
        mockTaskId,
        "check-1",
        { is_completed: true }
      );
      expect(updated.is_completed).toBe(true);

      vi.mocked(apiClient).mockResolvedValueOnce(undefined);
      await taskService.deleteChecklistItem(
        mockOrgId,
        mockProjectId,
        mockTaskId,
        "check-1"
      );
      expect(apiClient).toHaveBeenCalledWith(
        TASK_ENDPOINTS.checklist(mockOrgId, mockProjectId, mockTaskId, "check-1"),
        { method: "DELETE" }
      );
    });

    it("creates subtasks", async () => {
      const mockSubtask = {
        id: "sub-1",
        title: "Child subtask",
        parent_id: mockTaskId,
      };

      vi.mocked(apiClient).mockResolvedValueOnce(mockSubtask);
      const created = await taskService.createSubtask(
        mockOrgId,
        mockProjectId,
        mockTaskId,
        { title: "Child subtask" }
      );

      expect(apiClient).toHaveBeenCalledWith(
        TASK_ENDPOINTS.subtasks(mockOrgId, mockProjectId, mockTaskId),
        {
          method: "POST",
          body: JSON.stringify({ title: "Child subtask" }),
        }
      );
      expect(created.title).toBe("Child subtask");
    });

    it("uploads and deletes attachments", async () => {
      const mockAttachment = {
        id: "att-1",
        file_name: "design.png",
        file_size: 1024,
      };

      vi.mocked(apiClient).mockResolvedValueOnce(mockAttachment);
      const file = new File(["dummy content"], "design.png", {
        type: "image/png",
      });

      const uploaded = await taskService.uploadAttachment(
        mockOrgId,
        mockProjectId,
        mockTaskId,
        file
      );

      expect(uploaded.file_name).toBe("design.png");

      vi.mocked(apiClient).mockResolvedValueOnce(undefined);
      await taskService.deleteAttachment(
        mockOrgId,
        mockProjectId,
        mockTaskId,
        "att-1"
      );

      expect(apiClient).toHaveBeenCalledWith(
        TASK_ENDPOINTS.attachment(mockOrgId, mockProjectId, mockTaskId, "att-1"),
        { method: "DELETE" }
      );
    });
  });
});
