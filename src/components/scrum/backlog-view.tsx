"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Search,
  Plus,
  ArrowUpDown,
  MoveUp,
  MoveDown,
  Layers,
  Calculator,
  AlertCircle,
  CheckCircle2,
  MoreVertical,
  Calendar,
  User,
  Filter,
  RefreshCw,
  FolderPlus,
  ArrowRightCircle,
  Flag,
  UserCheck,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { taskService } from "@/services/task-service";
import {
  scrumService,
  type BacklogQueryParams,
} from "@/services/scrum-service";
import { TaskEstimateDialog } from "@/components/scrum/task-estimate-dialog";
import { ApiClientError } from "@/services/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type {
  WorkItemResponse,
  SprintResponse,
  ProjectMembershipResponse,
} from "@/services/generated/api-types";

export interface BacklogViewProps {
  organizationId: string;
  projectId: string;
  sprints: SprintResponse[];
  members: ProjectMembershipResponse[];
  canModifyTask?: boolean;
  onOpenTaskDetails?: (taskId: string) => void;
  onCreateTask?: () => void;
  onSprintUpdated?: () => void;
}

export function BacklogView({
  organizationId,
  projectId,
  sprints,
  members,
  canModifyTask = true,
  onOpenTaskDetails,
  onCreateTask,
  onSprintUpdated,
}: BacklogViewProps) {
  const [tasks, setTasks] = useState<WorkItemResponse[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [unestimatedTasks, setUnestimatedTasks] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Selected tasks for bulk operations
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    new Set()
  );
  const [isAssigning, setIsAssigning] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Request sequence ref to discard stale responses
  const backlogRequestIdRef = useRef(0);

  // Task estimate dialog state
  const [taskToEstimate, setTaskToEstimate] = useState<WorkItemResponse | null>(
    null
  );
  const [isEstimateOpen, setIsEstimateOpen] = useState(false);

  const loadBacklog = useCallback(async () => {
    const curReqId = ++backlogRequestIdRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const params: BacklogQueryParams = {
        page,
        page_size: pageSize,
        sort_by: sortBy,
        sort_dir: sortDir,
      };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (priorityFilter !== "all") params.priority = priorityFilter;
      if (typeFilter !== "all") params.type = typeFilter;
      if (statusFilter !== "all") params.status = statusFilter;
      if (assigneeFilter !== "all") params.assignee_id = assigneeFilter;

      const res = await scrumService.getBacklog(
        organizationId,
        projectId,
        params
      );
      if (curReqId === backlogRequestIdRef.current) {
        setTasks(res.items || []);
        setTotalTasks(res.total_tasks || 0);
        setTotalPoints(res.total_points || 0);
        setUnestimatedTasks(res.unestimated_tasks || 0);
      }
    } catch (err: unknown) {
      if (curReqId === backlogRequestIdRef.current) {
        if (err instanceof ApiClientError) {
          setError(err.message || "Failed to load product backlog");
        } else {
          setError("Network error loading product backlog");
        }
      }
    } finally {
      if (curReqId === backlogRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [
    organizationId,
    projectId,
    page,
    debouncedSearch,
    priorityFilter,
    typeFilter,
    statusFilter,
    assigneeFilter,
    sortBy,
    sortDir,
  ]);

  useEffect(() => {
    loadBacklog();
  }, [loadBacklog]);

  // Multi-select toggle
  const toggleSelectTask = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedTaskIds.size === tasks.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(tasks.map((t) => t.id)));
    }
  };

  // Bulk Handlers
  const handleBulkStatusChange = async (newStatus: string) => {
    const selectedList = tasks.filter((t) => selectedTaskIds.has(t.id));
    if (!selectedList.length) return;
    setIsProcessingBulk(true);
    let successCount = 0;
    const errors: string[] = [];

    for (const task of selectedList) {
      try {
        await taskService.moveTask(organizationId, projectId, task.id, {
          status: newStatus,
          version: task.version,
        });
        successCount++;
      } catch (err: unknown) {
        if (err instanceof ApiClientError) {
          errors.push(`${task.issue_key}: ${err.message}`);
        } else {
          errors.push(`${task.issue_key}: Failed`);
        }
      }
    }

    setIsProcessingBulk(false);
    if (successCount === selectedList.length) {
      toast.success(`Moved ${successCount} task(s) to ${newStatus}`);
    } else {
      toast.warning(`Moved ${successCount}/${selectedList.length} tasks.`, {
        description: errors[0],
      });
    }
    setSelectedTaskIds(new Set());
    loadBacklog();
  };

  const handleBulkPriorityChange = async (
    priority: "lowest" | "low" | "medium" | "high" | "urgent"
  ) => {
    const selectedList = tasks.filter((t) => selectedTaskIds.has(t.id));
    if (!selectedList.length) return;
    setIsProcessingBulk(true);
    let successCount = 0;

    for (const task of selectedList) {
      try {
        await taskService.updateTask(organizationId, projectId, task.id, {
          priority,
          version: task.version,
        });
        successCount++;
      } catch {
        // Continue
      }
    }

    setIsProcessingBulk(false);
    toast.success(
      `Updated priority to ${priority} for ${successCount} task(s)`
    );
    setSelectedTaskIds(new Set());
    loadBacklog();
  };

  const handleBulkAssigneeChange = async (assigneeId: string | null) => {
    const selectedList = tasks.filter((t) => selectedTaskIds.has(t.id));
    if (!selectedList.length) return;
    setIsProcessingBulk(true);
    let successCount = 0;

    for (const task of selectedList) {
      try {
        await taskService.updateTask(organizationId, projectId, task.id, {
          assignee_id: assigneeId,
          version: task.version,
        });
        successCount++;
      } catch {
        // Continue
      }
    }

    setIsProcessingBulk(false);
    toast.success(
      assigneeId
        ? `Assigned ${successCount} task(s)`
        : `Unassigned ${successCount} task(s)`
    );
    setSelectedTaskIds(new Set());
    loadBacklog();
  };

  const handleBulkDelete = async () => {
    const selectedList = tasks.filter((t) => selectedTaskIds.has(t.id));
    if (!selectedList.length) return;
    setIsProcessingBulk(true);
    let successCount = 0;

    for (const task of selectedList) {
      try {
        await taskService.deleteTask(organizationId, projectId, task.id);
        successCount++;
      } catch {
        // Continue
      }
    }

    setIsProcessingBulk(false);
    setIsDeleteConfirmOpen(false);
    toast.success(`Deleted ${successCount} task(s)`);
    setSelectedTaskIds(new Set());
    loadBacklog();
  };

  // Assign tasks to a sprint
  const handleAssignToSprint = async (sprintId: string, taskIds: string[]) => {
    if (!taskIds.length) return;
    setIsAssigning(true);
    try {
      await scrumService.assignTasksToSprint(
        organizationId,
        projectId,
        sprintId,
        {
          task_ids: taskIds,
        }
      );
      const sprint = sprints.find((s) => s.id === sprintId);
      toast.success(
        `Assigned ${taskIds.length} task(s) to ${sprint ? sprint.name : "sprint"}`
      );
      setSelectedTaskIds(new Set());
      loadBacklog();
      onSprintUpdated?.();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        toast.error(err.message || "Failed to assign tasks to sprint");
      } else {
        toast.error("Network error while assigning tasks to sprint");
      }
    } finally {
      setIsAssigning(false);
    }
  };

  // Reorder task up or down
  const handleMoveTaskOrder = async (
    taskIndex: number,
    direction: "up" | "down"
  ) => {
    const targetIndex = direction === "up" ? taskIndex - 1 : taskIndex + 1;
    if (targetIndex < 0 || targetIndex >= tasks.length) return;

    const newOrder = [...tasks];
    const temp = newOrder[taskIndex];
    newOrder[taskIndex] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    // Optimistically update
    setTasks(newOrder);
    setIsReordering(true);

    try {
      await scrumService.reorderBacklog(organizationId, projectId, {
        ordered_task_ids: newOrder.map((t) => t.id),
      });
      toast.success("Backlog priorities updated");
    } catch (err: unknown) {
      toast.error("Failed to persist backlog order");
      loadBacklog();
    } finally {
      setIsReordering(false);
    }
  };

  const activeOrDraftSprints = sprints.filter(
    (s) => s.status === "draft" || s.status === "active"
  );

  return (
    <div className="space-y-4">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 text-card-foreground">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Backlog Tasks</span>
            <Layers className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {totalTasks}
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Eligible unassigned work items
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 text-card-foreground">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Total Estimated Points</span>
            <Calculator className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {totalPoints} pts
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Aggregated story points
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 text-card-foreground">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Unestimated Items</span>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {unestimatedTasks}
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Tasks requiring team estimation
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search backlog..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-8 ps-8 text-xs"
            />
          </div>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            className="h-8 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Filter by priority"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="lowest">Lowest</option>
          </select>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="h-8 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Filter by type"
          >
            <option value="all">All Types</option>
            <option value="story">Story</option>
            <option value="task">Task</option>
            <option value="bug">Bug</option>
            <option value="epic">Epic</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-8 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>

          {/* Assignee filter */}
          {members.length > 0 && (
            <select
              value={assigneeFilter}
              onChange={(e) => {
                setAssigneeFilter(e.target.value);
                setPage(1);
              }}
              className="h-8 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="Filter by assignee"
            >
              <option value="all">All Assignees</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.user?.full_name || m.user?.email || m.user_id}
                </option>
              ))}
            </select>
          )}

          {/* Sort order */}
          <select
            value={`${sortBy}:${sortDir}`}
            onChange={(e) => {
              const [sb, sd] = e.target.value.split(":");
              setSortBy(sb);
              setSortDir(sd as "asc" | "desc");
              setPage(1);
            }}
            className="h-8 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Sort order"
          >
            <option value="rank:asc">Rank (Ascending)</option>
            <option value="rank:desc">Rank (Descending)</option>
            <option value="created_at:desc">Newest First</option>
            <option value="created_at:asc">Oldest First</option>
            <option value="priority:desc">Priority (High to Low)</option>
            <option value="title:asc">Title (A-Z)</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadBacklog}
            disabled={isLoading}
            className="h-8 gap-1.5 px-2.5 text-xs"
            title="Refresh Backlog"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", isLoading && "animate-spin")}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          {canModifyTask && onCreateTask && (
            <Button
              size="sm"
              onClick={onCreateTask}
              className="h-8 gap-1.5 px-3 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Task</span>
            </Button>
          )}
        </div>
      </div>

      {/* Multi-Select Floating Action Bar */}
      {selectedTaskIds.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/10 px-4 py-2.5 text-xs animate-in fade-in">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span>{selectedTaskIds.size} task(s) selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {activeOrDraftSprints.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    disabled={isAssigning || isProcessingBulk}
                    className="h-7 gap-1.5 text-xs"
                  >
                    <FolderPlus className="h-3.5 w-3.5" />
                    <span>Add to Sprint</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-xs">
                    Choose Destination Sprint
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {activeOrDraftSprints.map((s) => (
                    <DropdownMenuItem
                      key={s.id}
                      onClick={() =>
                        handleAssignToSprint(s.id, Array.from(selectedTaskIds))
                      }
                      className="justify-between text-xs"
                    >
                      <span className="truncate">{s.name}</span>
                      <Badge
                        variant={
                          s.status === "active" ? "default" : "secondary"
                        }
                        className="text-[10px] capitalize"
                      >
                        {s.status}
                      </Badge>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Bulk Status */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isProcessingBulk}
                  className="h-7 gap-1 text-xs"
                >
                  <ArrowRightCircle className="h-3.5 w-3.5 text-primary" />
                  <span>Status</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel className="text-xs">
                  Change Status
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleBulkStatusChange("todo")}
                  className="cursor-pointer text-xs"
                >
                  To Do
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleBulkStatusChange("in_progress")}
                  className="cursor-pointer text-xs"
                >
                  In Progress
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleBulkStatusChange("done")}
                  className="cursor-pointer text-xs"
                >
                  Done
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Bulk Priority */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isProcessingBulk}
                  className="h-7 gap-1 text-xs"
                >
                  <Flag className="h-3.5 w-3.5 text-orange-500" />
                  <span>Priority</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuLabel className="text-xs">
                  Set Priority
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(["urgent", "high", "medium", "low", "lowest"] as const).map(
                  (p) => (
                    <DropdownMenuItem
                      key={p}
                      onClick={() => handleBulkPriorityChange(p)}
                      className="cursor-pointer text-xs capitalize"
                    >
                      {p}
                    </DropdownMenuItem>
                  )
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Bulk Assignee */}
            {members.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isProcessingBulk}
                    className="h-7 gap-1 text-xs"
                  >
                    <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Assign</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="max-h-52 w-52 overflow-y-auto"
                >
                  <DropdownMenuLabel className="text-xs">
                    Assign Member
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleBulkAssigneeChange(null)}
                    className="cursor-pointer text-xs text-muted-foreground"
                  >
                    Unassigned
                  </DropdownMenuItem>
                  {members.map((m) => (
                    <DropdownMenuItem
                      key={m.user_id}
                      onClick={() => handleBulkAssigneeChange(m.user_id)}
                      className="cursor-pointer text-xs"
                    >
                      {m.user?.full_name || m.user?.email || m.user_id}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Bulk Delete */}
            <Button
              variant="ghost"
              size="icon"
              disabled={isProcessingBulk}
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
              title="Delete Selected Tasks"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTaskIds(new Set())}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Backlog Items List */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-destructive">
            <AlertCircle className="mb-2 h-7 w-7" />
            <p className="text-sm font-semibold">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={loadBacklog}
              className="mt-3 text-xs"
            >
              Try Again
            </Button>
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title="No backlog tasks found"
              description={
                search || priorityFilter !== "all" || typeFilter !== "all"
                  ? "No tasks match your current filter criteria."
                  : "All project work is currently assigned to sprints, or no tasks have been created yet."
              }
              actionLabel={
                canModifyTask && onCreateTask
                  ? "Create Backlog Task"
                  : undefined
              }
              onAction={
                canModifyTask && onCreateTask ? onCreateTask : undefined
              }
            />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {/* Table Header */}
            <div className="flex items-center gap-3 bg-secondary/40 px-3 py-2 text-[11px] font-semibold text-muted-foreground">
              <input
                type="checkbox"
                checked={
                  tasks.length > 0 && selectedTaskIds.size === tasks.length
                }
                onChange={toggleSelectAll}
                className="h-3.5 w-3.5 rounded border-border"
                aria-label="Select all tasks"
              />
              <span className="w-6 text-center">#</span>
              <span className="w-20">Key</span>
              <span className="flex-1">Title</span>
              <span className="hidden sm:inline-block sm:w-20">Type</span>
              <span className="hidden md:inline-block md:w-20">Priority</span>
              <span className="hidden md:inline-block md:w-28">Assignee</span>
              <span className="w-16 text-center">Points</span>
              <span className="w-16 text-right">Actions</span>
            </div>

            {/* Rows */}
            {tasks.map((task, idx) => {
              const isSelected = selectedTaskIds.has(task.id);
              const assignee = members.find(
                (m) => m.user_id === task.assignee_id
              );
              const assigneeName =
                assignee?.user?.full_name || assignee?.user?.email;

              return (
                <div
                  key={task.id}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2.5 text-xs transition-colors hover:bg-card-hover",
                    isSelected && "bg-card-selected"
                  )}
                >
                  {/* Select Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectTask(task.id)}
                    className="h-3.5 w-3.5 rounded border-border"
                    aria-label={`Select ${task.issue_key}`}
                  />

                  {/* Ordering Controls */}
                  <div className="flex w-6 flex-col items-center">
                    {canModifyTask && sortBy === "rank" && (
                      <div className="flex flex-col gap-0.5 opacity-40 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => handleMoveTaskOrder(idx, "up")}
                          disabled={idx === 0 || isReordering}
                          className="hover:text-primary disabled:opacity-20"
                          title="Move up"
                        >
                          <MoveUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveTaskOrder(idx, "down")}
                          disabled={idx === tasks.length - 1 || isReordering}
                          className="hover:text-primary disabled:opacity-20"
                          title="Move down"
                        >
                          <MoveDown className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Issue Key */}
                  <span className="w-20 font-mono text-[11px] font-medium text-muted-foreground group-hover:text-primary">
                    {task.issue_key}
                  </span>

                  {/* Title */}
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => onOpenTaskDetails?.(task.id)}
                      className="truncate text-start font-medium text-foreground hover:underline"
                    >
                      {task.title}
                    </button>
                  </div>

                  {/* Type */}
                  <span className="hidden sm:inline-block sm:w-20">
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {task.type}
                    </Badge>
                  </span>

                  {/* Priority */}
                  <span className="hidden md:inline-block md:w-20">
                    <Badge
                      variant={
                        task.priority === "urgent"
                          ? "destructive"
                          : task.priority === "high"
                            ? "warning"
                            : "secondary"
                      }
                      className="text-[10px] capitalize"
                    >
                      {task.priority}
                    </Badge>
                  </span>

                  {/* Assignee */}
                  <div className="hidden items-center gap-1.5 truncate text-[11px] text-muted-foreground md:flex md:w-28">
                    {assigneeName ? (
                      <>
                        <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-secondary text-[9px] font-semibold text-foreground">
                          {assigneeName.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate">{assigneeName}</span>
                      </>
                    ) : (
                      <span className="italic text-muted-foreground/60">
                        Unassigned
                      </span>
                    )}
                  </div>

                  {/* Story Points */}
                  <div className="w-16 text-center">
                    {canModifyTask ? (
                      <button
                        type="button"
                        onClick={() => {
                          setTaskToEstimate(task);
                          setIsEstimateOpen(true);
                        }}
                        className={cn(
                          "rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold transition-colors hover:ring-1 hover:ring-primary",
                          task.estimated_points != null
                            ? "bg-secondary text-foreground"
                            : "border border-dashed border-border text-muted-foreground hover:bg-secondary/50"
                        )}
                        title="Click to estimate points"
                      >
                        {task.estimated_points != null
                          ? `${task.estimated_points} pts`
                          : "–"}
                      </button>
                    ) : (
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {task.estimated_points != null
                          ? `${task.estimated_points} pts`
                          : "–"}
                      </span>
                    )}
                  </div>

                  {/* Actions Dropdown */}
                  <div className="w-16 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          aria-label={`Actions for ${task.issue_key}`}
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => onOpenTaskDetails?.(task.id)}
                          className="text-xs"
                        >
                          View Task Details
                        </DropdownMenuItem>

                        {canModifyTask && (
                          <DropdownMenuItem
                            onClick={() => {
                              setTaskToEstimate(task);
                              setIsEstimateOpen(true);
                            }}
                            className="text-xs"
                          >
                            Estimate Story Points
                          </DropdownMenuItem>
                        )}

                        {canModifyTask && activeOrDraftSprints.length > 0 && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-[10px] text-muted-foreground">
                              Add to Sprint
                            </DropdownMenuLabel>
                            {activeOrDraftSprints.map((s) => (
                              <DropdownMenuItem
                                key={s.id}
                                onClick={() =>
                                  handleAssignToSprint(s.id, [task.id])
                                }
                                className="text-xs"
                              >
                                {s.name}
                              </DropdownMenuItem>
                            ))}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Task Estimate Dialog */}
      <TaskEstimateDialog
        isOpen={isEstimateOpen}
        onOpenChange={setIsEstimateOpen}
        organizationId={organizationId}
        projectId={projectId}
        task={taskToEstimate}
        onEstimated={(updated) => {
          setTasks((prev) =>
            prev.map((t) => (t.id === updated.id ? updated : t))
          );
          loadBacklog();
        }}
      />

      {/* Bulk Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title="Delete Selected Backlog Tasks?"
        description={`Are you sure you want to permanently delete ${selectedTaskIds.size} task(s)? This action cannot be undone.`}
        confirmLabel={isProcessingBulk ? "Deleting..." : "Delete Tasks"}
        isDestructive={true}
        onConfirm={handleBulkDelete}
      />
    </div>
  );
}
