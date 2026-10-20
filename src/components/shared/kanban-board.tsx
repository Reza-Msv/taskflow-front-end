"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { TaskCard } from "@/components/shared/task-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  KanbanBoardResponse,
  WorkItemResponse,
} from "@/services/generated/api-types";

export interface KanbanBoardProps {
  board: KanbanBoardResponse;
  assigneeMap?: Record<string, string>;
  onTaskClick?: (task: WorkItemResponse) => void;
  onAddTask?: (columnStatusId: string) => void;
  onMoveTask?: (
    task: WorkItemResponse,
    targetStatus: string,
    targetRank?: string | null
  ) => void;
  onViewHistory?: (task: WorkItemResponse) => void;
  className?: string;
}

const statusDotColors: Record<string, string> = {
  todo: "bg-kanban-todo",
  in_progress: "bg-kanban-inprogress",
  inprogress: "bg-kanban-inprogress",
  in_review: "bg-kanban-inreview",
  inreview: "bg-kanban-inreview",
  done: "bg-kanban-done",
  backlog: "bg-kanban-backlog",
  blocked: "bg-kanban-blocked",
};

export function KanbanBoard({
  board,
  assigneeMap = {},
  onTaskClick,
  onAddTask,
  onMoveTask,
  onViewHistory,
  className,
}: KanbanBoardProps) {
  const columns = board?.columns || [];
  const [selectedColumnMobile, setSelectedColumnMobile] = useState<string>(
    columns[0]?.status?.id || ""
  );
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  const availableStatuses = columns.map(
    (col: KanbanBoardResponse["columns"][number]) => ({
      id: col.status.id,
      name: col.status.name,
    })
  );

  const findTaskById = (taskId: string): WorkItemResponse | undefined => {
    for (const col of columns) {
      const tasks = col.tasks || [];
      const match = tasks.find((t: WorkItemResponse) => t.id === taskId);
      if (match) return match;
    }
    return undefined;
  };

  const handleDragStart = (e: React.DragEvent, task: WorkItemResponse) => {
    e.dataTransfer.setData("text/plain", task.id);
    e.dataTransfer.effectAllowed = "move";
    setDraggedTaskId(task.id);
  };

  const handleDragOver = (e: React.DragEvent, columnStatusId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumnId !== columnStatusId) {
      setDragOverColumnId(columnStatusId);
    }
  };

  const handleDragLeave = (columnStatusId: string) => {
    if (dragOverColumnId === columnStatusId) {
      setDragOverColumnId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, columnStatusId: string) => {
    e.preventDefault();
    setDragOverColumnId(null);
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    setDraggedTaskId(null);

    if (!taskId) return;
    const task = findTaskById(taskId);
    if (!task) return;

    if (task.status !== columnStatusId) {
      onMoveTask?.(task, columnStatusId, null);
    }
  };

  return (
    <div className={cn("flex w-full min-w-0 flex-col gap-4", className)}>
      {/* Mobile Column Selector Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-border pb-1 md:hidden">
        {columns.map((col: KanbanBoardResponse["columns"][number]) => {
          const colTasks = col.tasks || [];
          const isSelected = selectedColumnMobile === col.status.id;
          const dotColor =
            statusDotColors[col.status.category] ||
            statusDotColors[col.status.id] ||
            "bg-muted";

          return (
            <button
              key={col.status.id}
              onClick={() => setSelectedColumnMobile(col.status.id)}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                isSelected
                  ? "bg-secondary font-semibold text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", dotColor)} />
              <span>{col.status.name}</span>
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {colTasks.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Board Columns Grid */}
      <div
        className={cn(
          "grid w-full min-w-0 grid-cols-1 gap-4",
          columns.length === 1 && "grid-cols-1",
          columns.length === 2 && "md:grid-cols-2",
          columns.length === 3 && "md:grid-cols-3",
          columns.length >= 4 && "md:grid-cols-2 lg:grid-cols-4"
        )}
      >
        {columns.map((col: KanbanBoardResponse["columns"][number]) => {
          const colTasks = col.tasks || [];
          const isHiddenOnMobile = selectedColumnMobile !== col.status.id;
          const isDragOver = dragOverColumnId === col.status.id;
          const dotColor =
            statusDotColors[col.status.category] ||
            statusDotColors[col.status.id] ||
            "bg-muted";

          return (
            <div
              key={col.status.id}
              onDragOver={(e) => handleDragOver(e, col.status.id)}
              onDragLeave={() => handleDragLeave(col.status.id)}
              onDrop={(e) => handleDrop(e, col.status.id)}
              className={cn(
                "flex min-h-[480px] flex-col rounded-xl border bg-subtle/50 p-3 transition-colors",
                isDragOver
                  ? "border-primary/60 bg-primary/5 ring-2 ring-primary/20"
                  : "border-border",
                isHiddenOnMobile && "hidden md:flex"
              )}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", dotColor)} />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    {col.status.name}
                  </h3>
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {colTasks.length}
                  </span>
                </div>
                {onAddTask && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={() => onAddTask(col.status.id)}
                    aria-label={`Add task to ${col.status.name}`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              {/* Task Cards List */}
              <div className="flex-1 space-y-2.5 overflow-y-auto pt-3">
                {colTasks.length === 0 ? (
                  <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border-subtle text-xs text-muted-foreground">
                    No tasks in {col.status.name}
                  </div>
                ) : (
                  colTasks.map((task: WorkItemResponse) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      assigneeName={
                        task.assignee_id
                          ? assigneeMap[task.assignee_id]
                          : undefined
                      }
                      availableStatuses={availableStatuses}
                      onClick={() => onTaskClick?.(task)}
                      onMoveToStatus={(newStatus) =>
                        onMoveTask?.(task, newStatus, null)
                      }
                      onViewHistory={() => onViewHistory?.(task)}
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
    </div>
  );
}
