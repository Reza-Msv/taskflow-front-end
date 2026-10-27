"use client";

import React from "react";
import {
  Link2,
  Unlink,
  Network,
  AlertCircle,
  X,
  ChevronRight,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { WorkItemResponse } from "@/services/generated/api-types";

export interface TaskDependenciesTabProps {
  parentTask: WorkItemResponse | null;
  isLoadingParent: boolean;
  projectTasksList: WorkItemResponse[];
  isLoadingProjectTasks: boolean;
  selectedPredecessorId: string;
  isUpdatingDependency: boolean;
  dependencyError: string | null;
  subtasks: WorkItemResponse[];
  newSubtaskTitle: string;
  isAddingSubtask: boolean;
  onClearDependencyError: () => void;
  onSelectPredecessorId: (id: string) => void;
  onSetPredecessor: (predecessorId: string) => void;
  onRemovePredecessor: () => void;
  onNavigateToTask: (task: WorkItemResponse) => void;
  onSubtaskTitleChange: (title: string) => void;
  onAddSubtask: (e: React.FormEvent) => void;
}

export function TaskDependenciesTab({
  parentTask,
  isLoadingParent,
  projectTasksList,
  isLoadingProjectTasks,
  selectedPredecessorId,
  isUpdatingDependency,
  dependencyError,
  subtasks,
  newSubtaskTitle,
  isAddingSubtask,
  onClearDependencyError,
  onSelectPredecessorId,
  onSetPredecessor,
  onRemovePredecessor,
  onNavigateToTask,
  onSubtaskTitleChange,
  onAddSubtask,
}: TaskDependenciesTabProps) {
  return (
    <div className="space-y-6">
      {/* Error Alert if Circular or Invalid */}
      {dependencyError && (
        <div className="flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Dependency Validation Failed</p>
            <p className="mt-0.5 text-destructive/90">{dependencyError}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClearDependencyError}
            className="h-5 w-5 text-destructive hover:bg-destructive/20"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Predecessors Section ("Blocked by") */}
      <div className="space-y-3 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Predecessor (Blocked By)
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">
            {parentTask ? "1 dependency" : "0 dependencies"}
          </span>
        </div>

        <p className="text-xs text-muted-foreground">
          This task cannot start or complete until its predecessor work item is
          resolved.
        </p>

        {isLoadingParent ? (
          <Skeleton className="h-14 w-full rounded-lg" />
        ) : parentTask ? (
          <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-3">
            <div
              onClick={() => onNavigateToTask(parentTask)}
              className="flex cursor-pointer items-center gap-3 transition-colors hover:text-primary"
            >
              <Badge variant="outline" className="font-mono text-xs">
                {parentTask.issue_key}
              </Badge>
              <div>
                <p className="text-xs font-semibold text-foreground">
                  {parentTask.title}
                </p>
                <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="capitalize">{parentTask.status}</span>
                  {parentTask.priority && (
                    <>
                      <span>•</span>
                      <span className="capitalize">{parentTask.priority}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              disabled={isUpdatingDependency}
              onClick={onRemovePredecessor}
              className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10"
              title="Remove predecessor dependency"
            >
              <Unlink className="h-3.5 w-3.5" />
              <span>Unlink</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
              No predecessor linked. This task is currently unblocked.
            </div>

            <div className="flex items-center gap-2">
              <select
                aria-label="Select predecessor task"
                value={selectedPredecessorId}
                onChange={(e) => onSelectPredecessorId(e.target.value)}
                className="h-8 flex-1 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                disabled={isUpdatingDependency || isLoadingProjectTasks}
              >
                <option value="">Select a predecessor task...</option>
                {projectTasksList.map((pt) => (
                  <option key={pt.id} value={pt.id}>
                    [{pt.issue_key}] {pt.title} ({pt.status})
                  </option>
                ))}
              </select>

              <Button
                size="sm"
                disabled={
                  !selectedPredecessorId ||
                  isUpdatingDependency ||
                  isLoadingProjectTasks
                }
                onClick={() => onSetPredecessor(selectedPredecessorId)}
                className="h-8 gap-1 bg-primary px-3 text-xs text-primary-foreground"
              >
                <Link2 className="h-3.5 w-3.5" />
                <span>Link</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Successors Section ("Blocks") */}
      <div className="space-y-3 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Successors (Blocks)
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">
            {subtasks.length} {subtasks.length === 1 ? "task" : "tasks"}
          </span>
        </div>

        <p className="text-xs text-muted-foreground">
          Work items that depend on this task before they can finish.
        </p>

        <div className="space-y-1.5">
          {subtasks.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
              No successor tasks. This task does not block other work items.
            </div>
          ) : (
            subtasks.map((st) => (
              <div
                key={st.id}
                onClick={() => onNavigateToTask(st)}
                className="group flex cursor-pointer items-center justify-between rounded-lg border border-border/60 bg-background/60 p-2.5 transition-colors hover:border-primary/50 hover:bg-card-hover"
              >
                <div className="flex items-center gap-2.5">
                  <Badge variant="outline" className="font-mono text-xs">
                    {st.issue_key}
                  </Badge>
                  <div>
                    <span className="text-xs font-medium text-foreground group-hover:text-primary">
                      {st.title}
                    </span>
                    <div className="text-[10px] capitalize text-muted-foreground">
                      {st.status} • {st.priority || "Normal"}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
              </div>
            ))
          )}
        </div>

        {/* Add Successor / Subtask input */}
        <form onSubmit={onAddSubtask} className="mt-3 flex items-center gap-2">
          <Input
            value={newSubtaskTitle}
            onChange={(e) => onSubtaskTitleChange(e.target.value)}
            placeholder="Add child successor task..."
            className="h-8 text-xs"
            disabled={isAddingSubtask}
          />
          <Button
            type="submit"
            size="sm"
            className="h-8 gap-1 px-3 text-xs"
            disabled={!newSubtaskTitle.trim() || isAddingSubtask}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
