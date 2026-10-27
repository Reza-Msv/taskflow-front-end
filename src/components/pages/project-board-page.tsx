"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  RefreshCw,
  AlertCircle,
  Kanban,
  LayoutList,
  Layers,
  Calendar as CalendarNavIcon,
  GitBranch,
  Flag,
  BarChart3,
  GitMerge,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shared/page-container";
import { KanbanBoard } from "@/components/shared/kanban-board";
import { FilterBar } from "@/components/shared/filter-bar";
import { AdvancedTaskFilters } from "@/components/shared/advanced-task-filters";
import { TaskListView } from "@/components/shared/task-list-view";
import { TaskModal } from "@/components/shared/task-modal";
import { TaskDetailSheet } from "@/components/shared/task-detail-sheet";
import { BulkTaskActionsBar } from "@/components/shared/bulk-task-actions-bar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { taskService } from "@/services/task-service";

// Dynamic imports for heavy or optional views to reduce initial route bundle
const CalendarView = dynamic(
  () => import("@/components/shared/calendar-view").then((m) => m.CalendarView),
  {
    loading: () => <Skeleton className="h-[600px] w-full rounded-xl" />,
  }
);

const TimelineView = dynamic(
  () => import("@/components/shared/timeline-view").then((m) => m.TimelineView),
  {
    loading: () => <Skeleton className="h-[600px] w-full rounded-xl" />,
  }
);

const MilestoneModal = dynamic(() =>
  import("@/components/shared/milestone-modal").then((m) => m.MilestoneModal)
);

const TaskHistoryDrawer = dynamic(() =>
  import("@/components/shared/task-history-drawer").then(
    (m) => m.TaskHistoryDrawer
  )
);

const WorkflowConfigDialog = dynamic(() =>
  import("@/components/workflow/workflow-config-dialog").then(
    (m) => m.WorkflowConfigDialog
  )
);
import { projectService } from "@/services/project-service";
import { ApiClientError } from "@/services/api-client";
import { toast } from "sonner";
import type { TaskFilterCriteria } from "@/services/saved-filter-service";
import type {
  KanbanBoardResponse,
  WorkItemResponse,
  WorkItemCreateRequest,
  WorkItemUpdateRequest,
  WorkItemActivityResponse,
  ProjectResponse,
  ProjectMembershipResponse,
} from "@/services/generated/api-types";

export type ProjectViewMode = "board" | "list" | "calendar" | "timeline";

export interface ProjectBoardPageProps {
  organizationId: string;
  projectId: string;
  initialViewMode?: ProjectViewMode;
}

export function ProjectBoardPage({
  organizationId,
  projectId,
  initialViewMode,
}: ProjectBoardPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = pathname?.split("/")[1] || "en";

  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<ProjectViewMode>(
    (searchParams.get("view") as ProjectViewMode) || initialViewMode || "board"
  );

  const [board, setBoard] = useState<KanbanBoardResponse | null>(null);
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [members, setMembers] = useState<ProjectMembershipResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Milestone Modal state
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [selectedMilestoneDate, setSelectedMilestoneDate] = useState<
    Date | undefined
  >(undefined);

  // Filters (Kanban view)
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Advanced Filters (List view)
  const [listFilters, setListFilters] = useState<TaskFilterCriteria>({
    search: searchParams.get("search") || "",
    status: searchParams.get("status") || "all",
    priority: searchParams.get("priority") || "all",
    assignee_id: searchParams.get("assignee") || "all",
    due_preset:
      (searchParams.get("due") as TaskFilterCriteria["due_preset"]) || "all",
    sort_by: searchParams.get("sort_by") || "issue_key",
    sort_dir: (searchParams.get("sort_dir") as "asc" | "desc") || "asc",
  });
  const [listPage, setListPage] = useState(1);

  // Task Modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<WorkItemResponse | null>(
    null
  );
  const [modalDefaultStatus, setModalDefaultStatus] = useState("todo");
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  // Workflow Dialog state
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);

  // List View Multi-selection for bulk actions
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    new Set()
  );

  // Task Detail Sheet state (Phase 4)
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);

  // Task History Drawer state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyTask, setHistoryTask] = useState<WorkItemResponse | null>(null);
  const [activities, setActivities] = useState<WorkItemActivityResponse[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const boardRequestIdRef = useRef(0);

  const loadData = useCallback(async () => {
    const curReqId = ++boardRequestIdRef.current;
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
      if (curReqId === boardRequestIdRef.current) {
        setBoard(boardData);
        setProject(projectData);
        setMembers(membersData.items || []);
      }
    } catch (err: unknown) {
      if (curReqId === boardRequestIdRef.current) {
        if (err instanceof ApiClientError) {
          if (err.status === 401) {
            router.push(`/${currentLocale}/login`);
            return;
          }
          setError(err.message);
        } else {
          setError("Failed to load project board");
        }
      }
    } finally {
      if (curReqId === boardRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [organizationId, projectId, router, currentLocale]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open task if 'task' parameter is present in URL
  useEffect(() => {
    const taskParam = searchParams.get("task");
    if (taskParam) {
      setDetailTaskId(taskParam);
      setIsDetailSheetOpen(true);
    }
  }, [searchParams]);

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

    // Snapshot current state for rollback (efficient reference preservation)
    const previousBoard = board;

    // Optimistically update board columns without expensive deep JSON serialization
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

  // Build assignee name map for display (memoized)
  const { assigneeMap, memberOptions } = useMemo(() => {
    const map: Record<string, string> = {};
    const opts = members.map((m) => {
      const name = m.user?.full_name || m.user?.email || "Unknown User";
      map[m.user_id] = name;
      return {
        userId: m.user_id,
        name,
      };
    });
    return { assigneeMap: map, memberOptions: opts };
  }, [members]);

  // Extract available statuses
  const availableStatuses = useMemo(
    () =>
      (board?.columns || []).map((c) => ({
        id: c.status.id,
        name: c.status.name,
      })),
    [board?.columns]
  );

  // Filter tasks in board according to search and status filter (Kanban view)
  const filteredBoard: KanbanBoardResponse = useMemo(() => {
    if (!board) return { project_id: projectId, columns: [], total_tasks: 0 };
    return {
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
    };
  }, [board, projectId, statusFilter, search]);

  // Filter tasks for List view
  const allBoardTasks: WorkItemResponse[] = useMemo(
    () => (board?.columns || []).flatMap((col) => col.tasks || []),
    [board?.columns]
  );

  const filteredListTasks = useMemo(() => {
    const tasks = allBoardTasks.filter((t) => {
      if (listFilters.search?.trim()) {
        const q = listFilters.search.toLowerCase();
        const matches =
          t.title.toLowerCase().includes(q) ||
          t.issue_key.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q));
        if (!matches) return false;
      }
      if (listFilters.status && listFilters.status !== "all") {
        if (t.status !== listFilters.status) return false;
      }
      if (listFilters.priority && listFilters.priority !== "all") {
        if (t.priority?.toLowerCase() !== listFilters.priority.toLowerCase()) {
          return false;
        }
      }
      if (listFilters.assignee_id && listFilters.assignee_id !== "all") {
        if (t.assignee_id !== listFilters.assignee_id) return false;
      }
      if (listFilters.due_preset && listFilters.due_preset !== "all") {
        const now = new Date();
        if (listFilters.due_preset === "overdue") {
          if (!t.due_date || new Date(t.due_date) >= now) return false;
        } else if (listFilters.due_preset === "due_soon") {
          if (!t.due_date) return false;
          const due = new Date(t.due_date);
          const inSevenDays = new Date(now.getTime() + 7 * 86400000);
          if (due < now || due > inSevenDays) return false;
        } else if (listFilters.due_preset === "no_due_date") {
          if (t.due_date) return false;
        }
      }
      return true;
    });

    return tasks.sort((a, b) => {
      const dir = listFilters.sort_dir === "desc" ? -1 : 1;
      if (listFilters.sort_by === "title") {
        return a.title.localeCompare(b.title) * dir;
      }
      if (listFilters.sort_by === "status") {
        return a.status.localeCompare(b.status) * dir;
      }
      if (listFilters.sort_by === "priority") {
        return (a.priority || "").localeCompare(b.priority || "") * dir;
      }
      if (listFilters.sort_by === "due_date") {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return (
          (new Date(a.due_date).getTime() - new Date(b.due_date).getTime()) *
          dir
        );
      }
      return a.issue_key.localeCompare(b.issue_key) * dir;
    });
  }, [allBoardTasks, listFilters]);

  const listPageSize = 25;
  const listTotalPages = Math.max(
    1,
    Math.ceil(filteredListTasks.length / listPageSize)
  );
  const paginatedListTasks = useMemo(() => {
    return filteredListTasks.slice(
      (listPage - 1) * listPageSize,
      listPage * listPageSize
    );
  }, [filteredListTasks, listPage]);

  const handleViewModeChange = (mode: ProjectViewMode) => {
    setViewMode(mode);
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("view", mode);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleCreateMilestone = async (data: {
    title: string;
    due_date: string;
    description?: string;
  }) => {
    try {
      await taskService.createMilestone(organizationId, projectId, data);
      toast.success(`Milestone "${data.title}" created`);
      loadData();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to create milestone");
      }
      throw err;
    }
  };

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
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg border border-border bg-card p-0.5">
              <Button
                variant={viewMode === "board" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => handleViewModeChange("board")}
                className="h-7 gap-1.5 px-2.5 text-xs"
                title="Board View"
              >
                <Kanban className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Board</span>
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => handleViewModeChange("list")}
                className="h-7 gap-1.5 px-2.5 text-xs"
                title="List View"
              >
                <LayoutList className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">List</span>
              </Button>
              <Button
                variant={viewMode === "calendar" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => handleViewModeChange("calendar")}
                className="h-7 gap-1.5 px-2.5 text-xs"
                title="Calendar View"
              >
                <CalendarNavIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Calendar</span>
              </Button>
              <Button
                variant={viewMode === "timeline" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => handleViewModeChange("timeline")}
                className="h-7 gap-1.5 px-2.5 text-xs"
                title="Timeline & Gantt View"
              >
                <GitBranch className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Timeline</span>
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedMilestoneDate(new Date());
                setIsMilestoneModalOpen(true);
              }}
              className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
              title="Add Project Milestone"
            >
              <Flag className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Milestone</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push(
                  `/${currentLocale}/organizations/${organizationId}/projects/${projectId}/scrum`
                )
              }
              className="gap-1.5"
            >
              <Layers className="h-3.5 w-3.5 text-primary" />
              <span className="hidden sm:inline">Scrum & Sprints</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push(
                  `/${currentLocale}/organizations/${organizationId}/projects/${projectId}/reports`
                )
              }
              className="gap-1.5"
              title="Reports & Analytics"
            >
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
              <span className="hidden sm:inline">Reports</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsWorkflowModalOpen(true)}
              className="gap-1.5"
              title="Workflow & Lifecycle Rules"
            >
              <GitMerge className="h-3.5 w-3.5 text-primary" />
              <span className="hidden sm:inline">Workflow & Rules</span>
            </Button>
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

      {viewMode === "board" && (
        <>
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
                setDetailTaskId(task.id);
                setIsDetailSheetOpen(true);
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
        </>
      )}

      {viewMode === "list" && (
        <div className="space-y-4">
          <AdvancedTaskFilters
            filters={listFilters}
            onFiltersChange={(f) => {
              setListFilters(f);
              setListPage(1);
            }}
            statusOptions={[
              { value: "all", label: "All Statuses" },
              ...availableStatuses.map((s) => ({ value: s.id, label: s.name })),
            ]}
            assigneeOptions={members.map((m) => ({
              value: m.user_id,
              label: m.user?.full_name || m.user?.email || "User",
            }))}
            showAssigneeFilter={true}
            showProjectFilter={false}
            syncWithUrl={true}
          />

          <TaskListView
            tasks={paginatedListTasks}
            onTaskClick={(taskId) => {
              setDetailTaskId(taskId);
              setIsDetailSheetOpen(true);
            }}
            selectable={true}
            selectedTaskIds={selectedTaskIds}
            onSelectionChange={setSelectedTaskIds}
            assigneeMap={assigneeMap}
            sortField={listFilters.sort_by}
            sortDirection={listFilters.sort_dir}
            onSortChange={(field) => {
              const nextDir =
                listFilters.sort_by === field && listFilters.sort_dir === "asc"
                  ? "desc"
                  : "asc";
              setListFilters((prev) => ({
                ...prev,
                sort_by: field,
                sort_dir: nextDir,
              }));
            }}
            currentPage={listPage}
            totalPages={listTotalPages}
            totalItems={filteredListTasks.length}
            pageSize={listPageSize}
            onPageChange={setListPage}
          />

          {/* Floating Bulk Actions Bar */}
          {selectedTaskIds.size > 0 && (
            <BulkTaskActionsBar
              organizationId={organizationId}
              projectId={projectId}
              selectedTasks={allBoardTasks.filter((t) =>
                selectedTaskIds.has(t.id)
              )}
              availableStatuses={availableStatuses}
              members={members}
              onClearSelection={() => setSelectedTaskIds(new Set())}
              onOperationComplete={() => loadData()}
            />
          )}
        </div>
      )}

      {viewMode === "calendar" && (
        <CalendarView
          tasks={allBoardTasks}
          assigneeMap={assigneeMap}
          availableStatuses={availableStatuses}
          members={memberOptions}
          onTaskClick={(taskId) => {
            setDetailTaskId(taskId);
            setIsDetailSheetOpen(true);
          }}
          onCreateTask={(date) => {
            setSelectedTask(null);
            setModalDefaultStatus(board.columns[0]?.status.id || "todo");
            setIsTaskModalOpen(true);
          }}
        />
      )}

      {viewMode === "timeline" && (
        <TimelineView
          tasks={allBoardTasks}
          assigneeMap={assigneeMap}
          availableStatuses={availableStatuses}
          members={memberOptions}
          onTaskClick={(taskId) => {
            setDetailTaskId(taskId);
            setIsDetailSheetOpen(true);
          }}
          onCreateTask={() => {
            setSelectedTask(null);
            setModalDefaultStatus(board.columns[0]?.status.id || "todo");
            setIsTaskModalOpen(true);
          }}
          onCreateMilestone={() => {
            setSelectedMilestoneDate(new Date());
            setIsMilestoneModalOpen(true);
          }}
        />
      )}

      {/* Task Create / Edit Dialog */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        defaultStatus={modalDefaultStatus}
        projectId={projectId}
        members={memberOptions}
        availableStatuses={availableStatuses}
        onSubmitCreate={handleCreateTask}
        onSubmitUpdate={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        isSubmitting={isSubmittingTask}
      />

      {/* Project Milestone Create / Edit Dialog */}
      <MilestoneModal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
        onSubmit={handleCreateMilestone}
        defaultDate={selectedMilestoneDate}
      />

      {/* Task Details & Collaboration Sheet (Phase 4) */}
      <TaskDetailSheet
        isOpen={isDetailSheetOpen}
        onClose={() => {
          setIsDetailSheetOpen(false);
          setDetailTaskId(null);
        }}
        taskId={detailTaskId}
        organizationId={organizationId}
        projectId={projectId}
        onTaskUpdated={() => loadData()}
        onTaskDeleted={() => loadData()}
        members={memberOptions}
        availableStatuses={availableStatuses}
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

      {/* Workflow & Lifecycle Configuration Dialog */}
      <WorkflowConfigDialog
        isOpen={isWorkflowModalOpen}
        onClose={() => setIsWorkflowModalOpen(false)}
        organizationId={organizationId}
        projectId={projectId}
        projectName={project?.name}
        initialStatuses={(board?.columns || []).map((c) => c.status)}
      />
    </PageContainer>
  );
}
