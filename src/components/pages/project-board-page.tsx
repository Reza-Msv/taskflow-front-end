"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, Plus, RefreshCw, AlertCircle } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shared/page-container";
import { KanbanBoard } from "@/components/shared/kanban-board";
import { FilterBar } from "@/components/shared/filter-bar";
import { TaskModal } from "@/components/shared/task-modal";
import { TaskHistoryDrawer } from "@/components/shared/task-history-drawer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { taskService } from "@/services/task-service";
import { projectService } from "@/services/project-service";
import { ApiClientError } from "@/services/api-client";
import { toast } from "sonner";
import type {
  KanbanBoardResponse,
  WorkItemResponse,
  WorkItemCreateRequest,
  WorkItemUpdateRequest,
  WorkItemActivityResponse,
  ProjectResponse,
  ProjectMembershipResponse,
} from "@/services/generated/api-types";

export interface ProjectBoardPageProps {
  organizationId: string;
  projectId: string;
}

export function ProjectBoardPage({
  organizationId,
  projectId,
}: ProjectBoardPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = pathname?.split("/")[1] || "en";

  const [board, setBoard] = useState<KanbanBoardResponse | null>(null);
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [members, setMembers] = useState<ProjectMembershipResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Task Modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<WorkItemResponse | null>(
    null
  );
  const [modalDefaultStatus, setModalDefaultStatus] = useState("todo");
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  // Task History Drawer state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyTask, setHistoryTask] = useState<WorkItemResponse | null>(null);
  const [activities, setActivities] = useState<WorkItemActivityResponse[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [boardData, projectData, membersData] = await Promise.all([
        taskService.getKanbanBoard(organizationId, projectId),
        projectService.getProject(organizationId, projectId),
        projectService.getMembers(organizationId, projectId, {
          page_size: 100,
        }),
      ]);
      setBoard(boardData);
      setProject(projectData);
      setMembers(membersData.items || []);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (err.status === 401) {
          router.push(`/${currentLocale}/login`);
          return;
        }
        setError(err.message);
      } else {
        setError("Failed to load project board");
      }
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, projectId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load task activity history
  const loadTaskHistory = async (task: WorkItemResponse) => {
    setHistoryTask(task);
    setIsHistoryOpen(true);
    setIsLoadingHistory(true);
    try {
      const res = await taskService.getTaskHistory(
        organizationId,
        projectId,
        task.id,
        { page_size: 50 }
      );
      setActivities(res.items || []);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to load activity history");
      }
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Optimistic Move Handler with rollback on error
  const handleMoveTask = async (
    task: WorkItemResponse,
    targetStatus: string,
    targetRank?: string | null
  ) => {
    if (!board) return;

    // Snapshot current state for rollback
    const previousBoard = JSON.parse(
      JSON.stringify(board)
    ) as KanbanBoardResponse;

    // Optimistically update board columns
    const updatedColumns = (board.columns || []).map((col) => {
      // Remove task if present in this column
      const currentTasks = col.tasks || [];
      const filteredTasks = currentTasks.filter((t) => t.id !== task.id);

      // If this is target column, append the moved task with updated status
      if (col.status.id === targetStatus) {
        const updatedTask: WorkItemResponse = {
          ...task,
          status: targetStatus,
          rank: targetRank || task.rank,
          version: (task.version || 1) + 1,
        };
        return {
          ...col,
          tasks: [...filteredTasks, updatedTask],
          total_tasks: filteredTasks.length + 1,
        };
      }

      return {
        ...col,
        tasks: filteredTasks,
        total_tasks: filteredTasks.length,
      };
    });

    setBoard({
      ...board,
      columns: updatedColumns,
    });

    try {
      const updated = await taskService.moveTask(
        organizationId,
        projectId,
        task.id,
        {
          status: targetStatus,
          rank: targetRank,
          version: task.version,
        }
      );
      // Synchronize latest server version & details
      setBoard((currentBoard) => {
        if (!currentBoard) return currentBoard;
        return {
          ...currentBoard,
          columns: (currentBoard.columns || []).map((col) => ({
            ...col,
            tasks: (col.tasks || []).map((t) =>
              t.id === task.id ? updated : t
            ),
          })),
        };
      });
      toast.success(`Moved ${task.issue_key} to ${targetStatus}`);
    } catch (err: unknown) {
      // Rollback to snapshot
      setBoard(previousBoard);

      if (err instanceof ApiClientError) {
        if (err.status === 409) {
          toast.error(
            "Conflict: This task was updated by someone else. Refreshing board."
          );
          loadData();
          return;
        }
        if (err.status === 400) {
          toast.error(`Transition disallowed: ${err.message}`);
          return;
        }
        toast.error(err.message);
      } else {
        toast.error("Failed to move task");
      }
    }
  };

  // Create Task Handler
  const handleCreateTask = async (data: WorkItemCreateRequest) => {
    setIsSubmittingTask(true);
    try {
      const created = await taskService.createTask(
        organizationId,
        projectId,
        data
      );
      toast.success(`Task ${created.issue_key} created`);
      loadData();
    } finally {
      setIsSubmittingTask(false);
    }
  };

  // Update Task Handler
  const handleUpdateTask = async (
    taskId: string,
    data: WorkItemUpdateRequest
  ) => {
    setIsSubmittingTask(true);
    try {
      const updated = await taskService.updateTask(
        organizationId,
        projectId,
        taskId,
        data
      );
      toast.success(`Task ${updated.issue_key} updated`);
      loadData();
    } catch (err: unknown) {
      if (err instanceof ApiClientError && err.status === 409) {
        toast.error("Conflict: Task was modified by another user. Reloading.");
        loadData();
      }
      throw err;
    } finally {
      setIsSubmittingTask(false);
    }
  };

  // Delete Task Handler
  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskService.deleteTask(organizationId, projectId, taskId);
      toast.success("Task deleted");
      loadData();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to delete task");
      }
    }
  };

  // Build assignee name map for display
  const assigneeMap: Record<string, string> = {};
  const memberOptions = members.map((m) => {
    const name = m.user?.full_name || m.user?.email || "Unknown User";
    assigneeMap[m.user_id] = name;
    return {
      userId: m.user_id,
      name,
    };
  });

  // Extract available statuses
  const availableStatuses = (board?.columns || []).map((c) => ({
    id: c.status.id,
    name: c.status.name,
  }));

  // Filter tasks in board according to search and status filter
  const filteredBoard: KanbanBoardResponse = board
    ? {
        ...board,
        columns: (board.columns || [])
          .filter((col) =>
            statusFilter === "all" ? true : col.status.id === statusFilter
          )
          .map((col) => ({
            ...col,
            tasks: (col.tasks || []).filter((t) => {
              if (!search.trim()) return true;
              const q = search.toLowerCase();
              return (
                t.title.toLowerCase().includes(q) ||
                t.issue_key.toLowerCase().includes(q) ||
                (t.description && t.description.toLowerCase().includes(q))
              );
            }),
          })),
      }
    : { project_id: projectId, columns: [], total_tasks: 0 };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-96 rounded-xl" />
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error || !board) {
    return (
      <PageContainer>
        <div className="flex min-h-[350px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center">
          <AlertCircle className="mb-3 h-10 w-10 text-destructive" />
          <h2 className="text-lg font-semibold text-foreground">
            Failed to Load Board
          </h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {error || "Kanban board data could not be retrieved."}
          </p>
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push(
                  `/${currentLocale}/organizations/${organizationId}/projects/${projectId}`
                )
              }
            >
              Back to Project
            </Button>
            <Button size="sm" onClick={loadData}>
              Try Again
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-4">
        <Link
          href={`/${currentLocale}/organizations/${organizationId}/projects/${projectId}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to {project?.name || "Project"}</span>
        </Link>
      </div>

      <PageHeader
        title={`${project?.name || "Project"} Board`}
        description={`Key [${project?.key || ""}] • ${board.total_tasks} active work items`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              className="gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setSelectedTask(null);
                setModalDefaultStatus(board.columns[0]?.status.id || "todo");
                setIsTaskModalOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>New Task</span>
            </Button>
          </div>
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusOptions={[
          { value: "all", label: "All Columns" },
          ...availableStatuses.map((s) => ({ value: s.id, label: s.name })),
        ]}
      />

      <div className="mt-4">
        <KanbanBoard
          board={filteredBoard}
          assigneeMap={assigneeMap}
          onTaskClick={(task) => {
            setSelectedTask(task);
            setIsTaskModalOpen(true);
          }}
          onAddTask={(statusId) => {
            setSelectedTask(null);
            setModalDefaultStatus(statusId);
            setIsTaskModalOpen(true);
          }}
          onMoveTask={handleMoveTask}
          onViewHistory={(task) => loadTaskHistory(task)}
        />
      </div>

      {/* Task Create / Edit Dialog */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        defaultStatus={modalDefaultStatus}
        members={memberOptions}
        availableStatuses={availableStatuses}
        onSubmitCreate={handleCreateTask}
        onSubmitUpdate={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        isSubmitting={isSubmittingTask}
      />

      {/* Activity History Drawer */}
      <TaskHistoryDrawer
        task={historyTask}
        isOpen={isHistoryOpen}
        onClose={() => {
          setIsHistoryOpen(false);
          setHistoryTask(null);
        }}
        activities={activities}
        isLoading={isLoadingHistory}
        onRefresh={() => historyTask && loadTaskHistory(historyTask)}
      />
    </PageContainer>
  );
}
