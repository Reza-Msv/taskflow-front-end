"use client";

import React from "react";
import {
  MessageSquare,
  Paperclip,
  MoveRight,
  History,
  MoreVertical,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { WorkItemResponse } from "@/services/generated/api-types";

export type KanbanStatus =
  "backlog" | "todo" | "inprogress" | "inreview" | "done" | "blocked" | string;

export interface TaskCardProps {
  task: WorkItemResponse;
  assigneeName?: string;
  commentsCount?: number;
  attachmentsCount?: number;
  isSelected?: boolean;
  availableStatuses?: { id: string; name: string }[];
  onClick?: () => void;
  onMoveToStatus?: (newStatus: string) => void;
  onViewHistory?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

const statusIndicatorColors: Record<string, string> = {
  backlog: "bg-kanban-backlog",
  todo: "bg-kanban-todo",
  inprogress: "bg-kanban-inprogress",
  in_progress: "bg-kanban-inprogress",
  inreview: "bg-kanban-inreview",
  in_review: "bg-kanban-inreview",
  done: "bg-kanban-done",
  blocked: "bg-kanban-blocked",
};

export function TaskCard({
  task,
  assigneeName,
  commentsCount = 0,
  attachmentsCount = 0,
  isSelected = false,
  availableStatuses = [],
  onClick,
  onMoveToStatus,
  onViewHistory,
  onDragStart,
  onDragEnd,
}: TaskCardProps) {
  const priorityVariant =
    task.priority === "urgent"
      ? "destructive"
      : task.priority === "high"
        ? "warning"
        : "secondary";

  return (
    <Card
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={cn(
        "group relative cursor-grab select-none border border-border bg-card p-3 text-card-foreground shadow-none transition-all duration-150 hover:border-border-strong hover:bg-card-hover focus:outline-none focus:ring-2 focus:ring-primary/40 active:cursor-grabbing",
        isSelected &&
          "border-primary/50 bg-card-selected ring-1 ring-primary/40"
      )}
    >
      {/* 3px Status rail indicator on the side */}
      <div
        className={cn(
          "absolute bottom-3 start-0 top-3 w-1 rounded-e",
          statusIndicatorColors[task.status] || "bg-muted"
        )}
      />

      <div className="space-y-2 ps-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono font-medium text-muted-foreground transition-colors group-hover:text-primary">
            {task.issue_key}
          </span>

          <div className="flex items-center gap-1.5">
            <Badge
              variant={priorityVariant}
              className="px-1.5 py-0 text-[10px] capitalize"
            >
              {task.priority}
            </Badge>

            {/* Quick Actions Menu (accessible alternative to drag-and-drop) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Actions for ${task.issue_key}`}
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {onViewHistory && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewHistory();
                    }}
                    className="gap-2 text-xs"
                  >
                    <History className="h-3.5 w-3.5" />
                    <span>View Activity History</span>
                  </DropdownMenuItem>
                )}
                {availableStatuses
                  .filter((s) => s.id !== task.status)
                  .map((s) => (
                    <DropdownMenuItem
                      key={s.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveToStatus?.(s.id);
                      }}
                      className="gap-2 text-xs"
                    >
                      <MoveRight className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Move to {s.name}</span>
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
          {task.title}
        </p>

        <div className="flex items-center justify-between border-t border-border-subtle pt-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {task.estimated_points != null && (
              <span className="rounded bg-muted px-1 font-mono text-[10px] font-semibold text-muted-foreground">
                {task.estimated_points} pts
              </span>
            )}
            {commentsCount > 0 && (
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                <span>{commentsCount}</span>
              </span>
            )}
            {attachmentsCount > 0 && (
              <span className="flex items-center gap-1">
                <Paperclip className="h-3 w-3" />
                <span>{attachmentsCount}</span>
              </span>
            )}
          </div>

          {assigneeName ? (
            <div
              className="flex h-5 w-5 items-center justify-center rounded-full border border-border bg-secondary text-[10px] font-semibold text-foreground"
              title={assigneeName}
            >
              {assigneeName.charAt(0).toUpperCase()}
            </div>
          ) : (
            <span className="text-[10px] italic text-muted-foreground/60">
              Unassigned
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
