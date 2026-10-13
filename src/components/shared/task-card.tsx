import React from "react";
import { MessageSquare, Paperclip, MoreHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type KanbanStatus =
  "backlog" | "todo" | "inprogress" | "inreview" | "done" | "blocked";

export interface TaskCardProps {
  id: string;
  issueKey: string;
  title: string;
  status: KanbanStatus;
  priority?: "low" | "medium" | "high" | "urgent";
  assigneeName?: string;
  commentsCount?: number;
  attachmentsCount?: number;
  isSelected?: boolean;
  onClick?: () => void;
}

const statusIndicatorColors: Record<KanbanStatus, string> = {
  backlog: "bg-kanban-backlog",
  todo: "bg-kanban-todo",
  inprogress: "bg-kanban-inprogress",
  inreview: "bg-kanban-inreview",
  done: "bg-kanban-done",
  blocked: "bg-kanban-blocked",
};

export function TaskCard({
  issueKey,
  title,
  status,
  priority = "medium",
  assigneeName,
  commentsCount = 0,
  attachmentsCount = 0,
  isSelected = false,
  onClick,
}: TaskCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "relative cursor-grab select-none border border-border bg-card p-3 text-card-foreground shadow-none transition-all duration-150 hover:border-border-strong hover:bg-card-hover active:cursor-grabbing",
        isSelected && "border-primary/50 bg-card-selected"
      )}
    >
      {/* 3px Status rail indicator on the side */}
      <div
        className={cn(
          "absolute bottom-3 start-0 top-3 w-1 rounded-e",
          statusIndicatorColors[status] || "bg-muted"
        )}
      />

      <div className="space-y-2 ps-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono font-medium text-muted-foreground transition-colors hover:text-primary">
            {issueKey}
          </span>
          <Badge
            variant={
              priority === "urgent"
                ? "destructive"
                : priority === "high"
                  ? "warning"
                  : "secondary"
            }
            className="px-1.5 py-0 text-[10px] capitalize"
          >
            {priority}
          </Badge>
        </div>

        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
          {title}
        </p>

        <div className="flex items-center justify-between border-t border-border-subtle pt-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
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

          {assigneeName && (
            <div
              className="flex h-5 w-5 items-center justify-center rounded-full border border-border bg-secondary text-[10px] font-semibold text-foreground"
              title={assigneeName}
            >
              {assigneeName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
