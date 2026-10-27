"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Clock,
  Play,
  CheckCircle2,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  FolderPlus,
  Plus,
  Sparkles,
  AlertCircle,
  X,
  Target,
  ArrowRight,
  Calculator,
  Kanban,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { scrumService } from "@/services/scrum-service";
import { SprintCreateDialog } from "@/components/scrum/sprint-create-dialog";
import { SprintEditDialog } from "@/components/scrum/sprint-edit-dialog";
import { SprintStartDialog } from "@/components/scrum/sprint-start-dialog";
import { SprintCompleteDialog } from "@/components/scrum/sprint-complete-dialog";
import { SprintRetrospectiveDialog } from "@/components/scrum/sprint-retrospective-dialog";
import { ApiClientError } from "@/services/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type {
  SprintResponse,
  WorkItemResponse,
  ProjectMembershipResponse,
} from "@/services/generated/api-types";

export interface SprintsViewProps {
  organizationId: string;
  projectId: string;
  canManageProject?: boolean;
  canModifyTask?: boolean;
  filterMode?: "all" | "active" | "history";
  onOpenTaskDetails?: (taskId: string) => void;
  onNavigateToBoard?: (sprintId: string) => void;
}

export function SprintsView({
  organizationId,
  projectId,
  canManageProject = true,
  canModifyTask = true,
  filterMode = "all",
  onOpenTaskDetails,
  onNavigateToBoard,
}: SprintsViewProps) {
  const [sprints, setSprints] = useState<SprintResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Expanded sprint tasks cache: sprintId -> WorkItemResponse[]
  const [expandedSprintIds, setExpandedSprintIds] = useState<Set<string>>(new Set());
  const [sprintTasks, setSprintTasks] = useState<Record<string, WorkItemResponse[]>>({});
  const [loadingSprintTasks, setLoadingSprintTasks] = useState<Record<string, boolean>>({});

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [sprintToEdit, setSprintToEdit] = useState<SprintResponse | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [sprintToStart, setSprintToStart] = useState<SprintResponse | null>(null);
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [sprintToComplete, setSprintToComplete] = useState<SprintResponse | null>(null);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [sprintToDelete, setSprintToDelete] = useState<SprintResponse | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sprintForRetro, setSprintForRetro] = useState<SprintResponse | null>(null);
  const [isRetroOpen, setIsRetroOpen] = useState(false);

  const loadSprints = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await scrumService.listSprints(organizationId, projectId);
      setSprints(res.items || []);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError(err.message || "Failed to load sprints");
      } else {
        setError("Network error loading sprints");
      }
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, projectId]);

  useEffect(() => {
    loadSprints();
  }, [loadSprints]);

  // Expand / collapse sprint tasks
  const toggleExpandSprint = async (sprintId: string) => {
    const isExpanded = expandedSprintIds.has(sprintId);
    if (isExpanded) {
      setExpandedSprintIds((prev) => {
        const next = new Set(prev);
        next.delete(sprintId);
        return next;
      });
      return;
    }

    setExpandedSprintIds((prev) => new Set(prev).add(sprintId));

    if (!sprintTasks[sprintId]) {
      setLoadingSprintTasks((prev) => ({ ...prev, [sprintId]: true }));
      try {
        const res = await scrumService.listSprintTasks(
          organizationId,
          projectId,
          sprintId,
          { page_size: 100 }
        );
        setSprintTasks((prev) => ({ ...prev, [sprintId]: res.items || [] }));
      } catch (err) {
        toast.error("Failed to load tasks for this sprint");
      } finally {
        setLoadingSprintTasks((prev) => ({ ...prev, [sprintId]: false }));
      }
    }
  };

  // Remove task from sprint back to backlog
  const handleRemoveTask = async (sprintId: string, taskId: string) => {
    try {
      await scrumService.removeTaskFromSprint(
        organizationId,
        projectId,
        sprintId,
        taskId
      );
      toast.success("Task returned to product backlog");
      // Update local task cache
      setSprintTasks((prev) => ({
        ...prev,
        [sprintId]: (prev[sprintId] || []).filter((t) => t.id !== taskId),
      }));
      loadSprints();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        toast.error(err.message || "Failed to remove task from sprint");
      } else {
        toast.error("Network error removing task");
      }
    }
  };

  // Delete sprint confirmed
  const handleDeleteSprint = async () => {
    if (!sprintToDelete) return;
    setIsDeleting(true);
    try {
      await scrumService.deleteSprint(organizationId, projectId, sprintToDelete.id);
      toast.success(
        `Sprint "${sprintToDelete.name}" deleted. All tasks returned to backlog.`
      );
      setIsDeleteOpen(false);
      setSprintToDelete(null);
      loadSprints();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        toast.error(err.message || "Failed to delete sprint");
      } else {
        toast.error("Network error deleting sprint");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter sprints based on filterMode
  const displayedSprints = sprints.filter((s) => {
    if (filterMode === "active") return s.status === "active";
    if (filterMode === "history") return s.status === "completed" || s.status === "cancelled";
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Sprints Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            {filterMode === "active"
              ? "Active Sprint"
              : filterMode === "history"
                ? "Sprint History"
                : "Project Sprints"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {filterMode === "active"
              ? "Track active sprint velocity, scope, and progress."
              : filterMode === "history"
                ? "Review historical completed and archived iterations."
                : "Manage draft, active, and completed iterations."}
          </p>
        </div>

        {canManageProject && (
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="h-8 gap-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Sprint</span>
          </Button>
        )}
      </div>

      {/* Sprints List */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border p-8 text-center text-destructive">
          <AlertCircle className="mb-2 h-7 w-7" />
          <p className="text-sm font-semibold">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={loadSprints}
            className="mt-3 text-xs"
          >
            Try Again
          </Button>
        </div>
      ) : displayedSprints.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8">
          <EmptyState
            title={
              filterMode === "active"
                ? "No active sprint currently running"
                : filterMode === "history"
                  ? "No sprint history yet"
                  : "No sprints found"
            }
            description={
              filterMode === "active"
                ? "Start a draft sprint to transition it into active progress."
                : filterMode === "history"
                  ? "Completed sprints will appear here once finalized."
                  : "Create your first sprint iteration to organize backlog delivery."
            }
            actionLabel={canManageProject ? "Create New Sprint" : undefined}
            onAction={canManageProject ? () => setIsCreateOpen(true) : undefined}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {displayedSprints.map((sprint) => {
            const isExpanded = expandedSprintIds.has(sprint.id);
            const tasksInSprint = sprintTasks[sprint.id] || [];
            const isLoadingTasks = loadingSprintTasks[sprint.id];
            const percentTasks =
              sprint.total_tasks > 0
                ? Math.round((sprint.completed_tasks / sprint.total_tasks) * 100)
                : 0;
            const percentPoints =
              sprint.total_points > 0
                ? Math.round((sprint.completed_points / sprint.total_points) * 100)
                : 0;

            const statusVariant =
              sprint.status === "active"
                ? "default"
                : sprint.status === "completed"
                  ? "secondary"
                  : "outline";

            return (
              <div
                key={sprint.id}
                className={cn(
                  "overflow-hidden rounded-xl border border-border bg-card transition-all",
                  sprint.status === "active" && "ring-1 ring-primary/30"
                )}
              >
                {/* Sprint Header */}
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleExpandSprint(sprint.id)}
                        className="flex items-center gap-1.5 text-start font-semibold text-foreground hover:text-primary"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span>{sprint.name}</span>
                      </button>

                      <Badge
                        variant={statusVariant}
                        className={cn(
                          "px-2 py-0 text-[10px] capitalize",
                          sprint.status === "active" &&
                            "bg-emerald-600 text-white hover:bg-emerald-700"
                        )}
                      >
                        {sprint.status}
                      </Badge>
                    </div>

                    {sprint.goal && (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Target className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span className="line-clamp-1">{sprint.goal}</span>
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {sprint.start_date
                          ? sprint.start_date.substring(0, 10)
                          : "No start date"}{" "}
                        –{" "}
                        {sprint.end_date
                          ? sprint.end_date.substring(0, 10)
                          : "No end date"}
                      </span>

                      {sprint.completed_at && (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          Completed: {sprint.completed_at.substring(0, 10)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress & Quick Actions */}
                  <div className="flex flex-wrap items-center gap-4 sm:justify-end">
                    {/* Progress indicators */}
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <div className="text-xs font-semibold text-foreground">
                          {sprint.completed_tasks} / {sprint.total_tasks} tasks
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {percentTasks}% complete
                        </div>
                      </div>

                      <div className="border-s border-border ps-3">
                        <div className="text-xs font-semibold text-foreground">
                          {sprint.completed_points} / {sprint.total_points} pts
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {percentPoints}% estimated
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5">
                      {sprint.status === "draft" && canManageProject && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSprintToStart(sprint);
                            setIsStartOpen(true);
                          }}
                          className="h-7 gap-1 bg-emerald-600 px-2.5 text-xs text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          <span>Start</span>
                        </Button>
                      )}

                      {sprint.status === "active" && (
                        <>
                          {onNavigateToBoard && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onNavigateToBoard(sprint.id)}
                              className="h-7 gap-1 px-2.5 text-xs"
                            >
                              <Kanban className="h-3 w-3" />
                              <span>Board</span>
                            </Button>
                          )}

                          {canManageProject && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSprintToComplete(sprint);
                                setIsCompleteOpen(true);
                              }}
                              className="h-7 gap-1 bg-emerald-600 px-2.5 text-xs text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Complete</span>
                            </Button>
                          )}
                        </>
                      )}

                      {/* Dropdown Options */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            aria-label={`Options for ${sprint.name}`}
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          {canManageProject && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSprintToEdit(sprint);
                                setIsEditOpen(true);
                              }}
                              className="gap-2 text-xs"
                            >
                              <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>Edit Details</span>
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem
                            onClick={() => {
                              setSprintForRetro(sprint);
                              setIsRetroOpen(true);
                            }}
                            className="gap-2 text-xs"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                            <span>Retrospective</span>
                          </DropdownMenuItem>

                          {canManageProject && sprint.status === "draft" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSprintToDelete(sprint);
                                  setIsDeleteOpen(true);
                                }}
                                className="gap-2 text-xs text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Delete Sprint</span>
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                {/* Expanded Tasks List */}
                {isExpanded && (
                  <div className="border-t border-border bg-secondary/10 px-4 py-3">
                    <div className="flex items-center justify-between pb-2 text-xs font-semibold text-muted-foreground">
                      <span>Tasks in Sprint ({tasksInSprint.length})</span>
                      <span className="text-[11px] font-normal">
                        Click task to inspect details
                      </span>
                    </div>

                    {isLoadingTasks ? (
                      <div className="space-y-2 py-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    ) : tasksInSprint.length === 0 ? (
                      <div className="py-4 text-center text-xs text-muted-foreground">
                        No tasks assigned to this sprint yet. Add tasks from the Product Backlog.
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {tasksInSprint.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-xs hover:bg-card-hover"
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <span className="font-mono text-[11px] font-medium text-muted-foreground">
                                {task.issue_key}
                              </span>
                              <button
                                type="button"
                                onClick={() => onOpenTaskDetails?.(task.id)}
                                className="truncate font-medium text-foreground hover:underline"
                              >
                                {task.title}
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  task.status === "done"
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-[10px] capitalize"
                              >
                                {task.status}
                              </Badge>

                              {task.estimated_points != null && (
                                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
                                  {task.estimated_points} pts
                                </span>
                              )}

                              {canModifyTask && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTask(sprint.id, task.id)}
                                  className="text-muted-foreground hover:text-destructive"
                                  title="Return task to Backlog"
                                  aria-label={`Remove ${task.issue_key} from sprint`}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <SprintCreateDialog
        isOpen={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        organizationId={organizationId}
        projectId={projectId}
        onCreated={() => loadSprints()}
      />

      <SprintEditDialog
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
        organizationId={organizationId}
        projectId={projectId}
        sprint={sprintToEdit}
        onUpdated={() => loadSprints()}
      />

      <SprintStartDialog
        isOpen={isStartOpen}
        onOpenChange={setIsStartOpen}
        organizationId={organizationId}
        projectId={projectId}
        sprint={sprintToStart}
        onStarted={() => loadSprints()}
      />

      <SprintCompleteDialog
        isOpen={isCompleteOpen}
        onOpenChange={setIsCompleteOpen}
        organizationId={organizationId}
        projectId={projectId}
        sprint={sprintToComplete}
        availableSprints={sprints}
        onCompleted={() => loadSprints()}
      />

      <SprintRetrospectiveDialog
        isOpen={isRetroOpen}
        onOpenChange={setIsRetroOpen}
        organizationId={organizationId}
        projectId={projectId}
        sprint={sprintForRetro}
      />

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title={`Delete Sprint "${sprintToDelete?.name}"?`}
        description="Are you sure you want to delete this sprint? All tasks currently assigned to this sprint will be safely returned to the Product Backlog. This action cannot be undone."
        confirmLabel={isDeleting ? "Deleting..." : "Delete Sprint"}
        isDestructive={true}
        onConfirm={handleDeleteSprint}
      />
    </div>
  );
}
