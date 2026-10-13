"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import {
  TaskCard,
  TaskCardProps,
  KanbanStatus,
} from "@/components/shared/task-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface KanbanColumn {
  id: KanbanStatus;
  title: string;
  dotColor: string;
}

const defaultColumns: KanbanColumn[] = [
  { id: "todo", title: "To Do", dotColor: "bg-kanban-todo" },
  { id: "inprogress", title: "In Progress", dotColor: "bg-kanban-inprogress" },
  { id: "inreview", title: "In Review", dotColor: "bg-kanban-inreview" },
  { id: "done", title: "Done", dotColor: "bg-kanban-done" },
];

export function KanbanBoard({
  tasks,
  columns = defaultColumns,
  onTaskClick,
  onAddTask,
  className,
}: {
  tasks: TaskCardProps[];
  columns?: KanbanColumn[];
  onTaskClick?: (taskId: string) => void;
  onAddTask?: (columnId: KanbanStatus) => void;
  className?: string;
}) {
  const [selectedColumnMobile, setSelectedColumnMobile] =
    useState<KanbanStatus>("todo");

  return (
    <div className={cn("flex w-full min-w-0 flex-col gap-4", className)}>
      {/* Mobile Column Selector Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-border pb-1 md:hidden">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          const isSelected = selectedColumnMobile === col.id;
          return (
            <button
              key={col.id}
              onClick={() => setSelectedColumnMobile(col.id)}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                isSelected
                  ? "bg-secondary font-semibold text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", col.dotColor)} />
              <span>{col.title}</span>
              <span className="py-0.2 rounded-full bg-muted px-1.5 text-[10px] text-muted-foreground">
                {colTasks.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Board Columns Grid */}
      <div className="grid w-full min-w-0 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          const isHiddenOnMobile = selectedColumnMobile !== col.id;

          return (
            <div
              key={col.id}
              className={cn(
                "flex min-h-[450px] flex-col rounded-xl border border-border bg-subtle/50 p-3",
                isHiddenOnMobile && "hidden md:flex"
              )}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", col.dotColor)} />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    {col.title}
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
                    onClick={() => onAddTask(col.id)}
                    aria-label={`Add task to ${col.title}`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              {/* Task Cards List */}
              <div className="flex-1 space-y-2.5 overflow-y-auto pt-3">
                {colTasks.length === 0 ? (
                  <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border-subtle text-xs text-muted-foreground">
                    No tasks
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      {...task}
                      onClick={() => onTaskClick?.(task.id)}
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
