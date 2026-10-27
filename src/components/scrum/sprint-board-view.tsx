"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Kanban,
  Calendar,
  Target,
  Plus,
  RefreshCw,
  AlertCircle,
  FolderPlus,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { TaskCard } from "@/components/shared/task-card";
import { scrumService } from "@/services/scrum-service";
import { taskService } from "@/services/task-service";
import { ApiClientError } from "@/services/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type {
  SprintResponse,
  WorkItemResponse,
  ProjectMembershipResponse,
} from "@/services/generated/api-types";

export interface SprintBoardViewProps {
  organizationId: string;
  projectId: string;
  activeSprint: SprintResponse | null;
  availableSprints: SprintResponse[];
  members: ProjectMembershipResponse[];
  canModifyTask?: boolean;
  onOpenTaskDetails?: (taskId: string) => void;
  onNavigateToBacklog?: () => void;
  onSprintSelected?: (sprintId: string) => void;
}

const statusIndicatorColors: Record<string, string> = {
  todo: "bg-kanban-todo",
  in_progress: "bg-kanban-inprogress",
  inprogress: "bg-kanban-inprogress",
  in_review: "bg-kanban-inreview",
  inreview: "bg-kanban-inreview",
  done: "bg-kanban-done",
  blocked: "bg-kanban-blocked",
};

const DEFAULT_COLUMNS = [
  { id: "todo", name: "To Do" },
  { id: "in_progress", name: "In Progress" },
  { id: "done", name: "Done" },
];

export function SprintBoardView({
  organizationId,
  projectId,
  activeSprint,
  availableSprints,
  members,
  canModifyTask = true,
  onOpenTaskDetails,
  onNavigateToBacklog,
  onSprintSelected,
}: SprintBoardViewProps) {
  const [selectedSprintId, setSelectedSprintId] = useState<string>(
    activeSprint?.id || availableSprints[0]?.id || ""
  );
  const [tasks, setTasks] = useState<WorkItemResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drag and drop states
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  // Search filter inside sprint board
  const [filterSearch, setFilterSearch] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("all");

  useEffect(() => {
    if (activeSprint) {
      setSelectedSprintId(activeSprint.id);
    } else if (availableSprints.length > 0 && !selectedSprintId) {
      setSelectedSprintId(availableSprints[0].id);
    }
  }, [activeSprint, availableSprints]);

  const currentSprint =
    availableSprints.find((s) => s.id === selectedSprintId) || activeSprint;

  const loadSprintTasks = useCallback(async () => {
    if (!selectedSprintId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await scrumService.listSprintTasks(
        organizationId,
        projectId,
        selectedSprintId,
        { page_size: 200 }
      );
      setTasks(res.items || []);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError(err.message || "Failed to load sprint board tasks");
      } else {
        setError("Network error loading sprint tasks");
      }
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, projectId, selectedSprintId]);

  useEffect(() => {
    loadSprintTasks();
  }, [loadSprintTasks]);

  // Handle task status move (via drag or dropdown)
  const handleMoveTaskStatus = async (
    task: WorkItemResponse,
    newStatus: string
  ) => {
    if (task.status === newStatus) return;

    // Optimistic update
    const previousTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    );

    try {
      await taskService.moveTask(organizationId, projectId, task.id, {
        status: newStatus,
      });
      toast.success(`${task.issue_key} moved to ${newStatus}`);
    } catch (err: unknown) {
      setTasks(previousTasks);
      if (err instanceof ApiClientError) {
        toast.error(err.message || "Failed to update task status");
      } else {
        toast.error("Network error while updating task status");
      }
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, task: WorkItemResponse) => {
    if (!canModifyTask) return;
    e.dataTransfer.setData("text/plain", task.id);
    e.dataTransfer.effectAllowed = "move";
    setDraggedTaskId(task.id);
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    if (!canModifyTask) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumnId !== colId) {
      setDragOverColumnId(colId);
    }
  };

  const handleDrop = (e: React.DragEvent, colId: string) => {
    if (!canModifyTask) return;
    e.preventDefault();
    setDragOverColumnId(null);
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    setDraggedTaskId(null);

    if (!taskId) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (task.status !== colId) {
      handleMoveTaskStatus(task, colId);
    }
  };

  // Assignee map for quick name resolution
  const assigneeMap: Record<string, string> = {};
  members.forEach((m) => {
    assigneeMap[m.user_id] = m.user?.full_name || m.user?.email || m.user_id;
  });

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (filterSearch.trim()) {
      const q = filterSearch.toLowerCase();
      const match =
        t.title.toLowerCase().includes(q) ||
        t.issue_key.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filterAssignee !== "all" && t.assignee_id !== filterAssignee) {
      return false;
    }
    return true;
  });

  if (!currentSprint) {
    return (
      <div className="rounded-xl border border-border bg-card p-8">
        <EmptyState
          title="No sprint selected"
          description="There are currently no active or draft sprints in this project."
          actionLabel={onNavigateToBacklog ? "Go to Product Backlog" : undefined}
          onAction={onNavigateToBacklog}
        />
      </div>
    );
  }

  // Calculate completed metrics
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const completedPoints = tasks
    .filter((t) => t.status === "done")
    .reduce((sum, t) => sum + (t.estimated_points || 0), 0);
  const totalPoints = tasks.reduce(
    (sum, t) => sum + (t.estimated_points || 0),
    0
  );
  const progressPercent =
    totalPoints > 0
      ? Math.round((completedPoints / totalPoints) * 100)
      : tasks.length > 0
        ? Math.round((completedTasks / tasks.length) * 100)
        : 0;

  return (
    <div className="space-y-4">
      {/* Sprint Context Card */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              {availableSprints.length > 1 ? (
                <select
                  value={selectedSprintId}
                  onChange={(e) => {
                    setSelectedSprintId(e.target.value);
                    onSprintSelected?.(e.target.value);
                  }}
                  className="rounded-md border border-border bg-background px-2.5 py-1 text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  aria-label="Select sprint"
                >
                  {availableSprints.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.status})
                    </option>
                  ))}
                </select>
              ) : (
                <h2 className="text-base font-semibold text-foreground">
                  {currentSprint.name}
                </h2>
              )}

              <Badge
                variant={currentSprint.status === "active" ? "default" : "secondary"}
                className={cn(
                  "text-[10px] capitalize",
                  currentSprint.status === "active" &&
                    "bg-emerald-600 text-white hover:bg-emerald-700"
                )}
              >
                {currentSprint.status}
              </Badge>
            </div>

            {currentSprint.goal && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Target className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span>{currentSprint.goal}</span>
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-0.5 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {currentSprint.start_date
                  ? currentSprint.start_date.substring(0, 10)
                  : "No start"}{" "}
                –{" "}
                {currentSprint.end_date
                  ? currentSprint.end_date.substring(0, 10)
                  : "No end"}
              </span>
              <span>•</span>
              <span>
                {completedTasks} of {tasks.length} tasks completed
              </span>
              <span>•</span>
              <span>
                {completedPoints} of {totalPoints} story points completed
              </span>
            </div>
          </div>

          {/* Quick Progress Bar */}
          <div className="flex min-w-[200px] flex-col gap-1.5 sm:max-w-xs">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-muted-foreground">Sprint Completion</span>
              <span className="text-foreground">{progressPercent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Filter bar inside board */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Search sprint tasks..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="h-7 w-44 rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />

            {members.length > 0 && (
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="h-7 rounded-md border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadSprintTasks}
              disabled={isLoading}
              className="h-7 gap-1 px-2 text-xs"
            >
              <RefreshCw
                className={cn("h-3 w-3", isLoading && "animate-spin")}
              />
              <span>Refresh</span>
            </Button>

            {onNavigateToBacklog && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onNavigateToBacklog}
                className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Layers className="h-3 w-3" />
                <span>Manage Backlog</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Board Columns Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Skeleton className="h-96 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border p-8 text-center text-destructive">
          <AlertCircle className="mb-2 h-7 w-7" />
          <p className="text-sm font-semibold">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={loadSprintTasks}
            className="mt-3 text-xs"
          >
            Try Again
          </Button>
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8">
          <EmptyState
            title="Sprint has no tasks"
            description="Assign tasks from the Product Backlog into this sprint to start tracking board flow."
            actionLabel={onNavigateToBacklog ? "Assign from Backlog" : undefined}
            onAction={onNavigateToBacklog}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {DEFAULT_COLUMNS.map((col) => {
            const colTasks = filteredTasks.filter(
              (t) =>
                t.status === col.id ||
                (col.id === "in_progress" &&
                  (t.status === "inprogress" ||
                    t.status === "in_review" ||
                    t.status === "inreview"))
            );
            const colPoints = colTasks.reduce(
              (sum, t) => sum + (t.estimated_points || 0),
              0
            );
            const dotColor = statusIndicatorColors[col.id] || "bg-muted";

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={() => setDragOverColumnId(null)}
                onDrop={(e) => handleDrop(e, col.id)}
                className={cn(
                  "flex flex-col rounded-xl border border-border bg-kanban-column p-3 transition-colors",
                  dragOverColumnId === col.id &&
                    "border-primary/50 bg-secondary/70 ring-2 ring-primary/30"
                )}
              >
                {/* Column Header */}
                <div className="mb-3 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2.5 w-2.5 rounded-full", dotColor)} />
                    <span className="text-xs font-semibold text-foreground">
                      {col.name}
                    </span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {colTasks.length}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-muted-foreground">
                    {colPoints} pts
                  </span>
                </div>

                {/* Task Cards in Column */}
                <div className="flex-1 space-y-2">
                  {colTasks.length === 0 ? (
                    <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border/60 text-xs text-muted-foreground/60">
                      Drop tasks here
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        assigneeName={
                          task.assignee_id
                            ? assigneeMap[task.assignee_id]
                            : undefined
                        }
                        availableStatuses={DEFAULT_COLUMNS}
                        onClick={() => onOpenTaskDetails?.(task.id)}
                        onMoveToStatus={(newStatus) =>
                          handleMoveTaskStatus(task, newStatus)
                        }
                        onDragStart={(e) => handleDragStart(e, task)}
                        onDragEnd={() => setDraggedTaskId(null)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
