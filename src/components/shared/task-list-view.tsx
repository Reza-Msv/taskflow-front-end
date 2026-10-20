"use client";

import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  AlertCircle,
  FolderKanban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  WorkItemResponse,
  WorkItemDashboardItem,
} from "@/services/generated/api-types";

export type AnyTaskItem = WorkItemResponse | WorkItemDashboardItem;

export interface TaskListViewProps {
  tasks: AnyTaskItem[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onTaskClick: (taskId: string) => void;
  assigneeMap?: Record<string, string>;
  projectMap?: Record<string, { name: string; key: string }>;
  showProjectColumn?: boolean;
  // Sorting
  sortField?: string;
  sortDirection?: "asc" | "desc";
  onSortChange?: (field: string) => void;
  // Pagination
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

export function TaskListView({
  tasks,
  isLoading = false,
  error = null,
  onRetry,
  onTaskClick,
  assigneeMap = {},
  projectMap = {},
  showProjectColumn = false,
  sortField,
  sortDirection = "asc",
  onSortChange,
  currentPage = 1,
  totalPages = 1,
  totalItems,
  pageSize = 25,
  onPageChange,
  className,
}: TaskListViewProps) {
  // Helpers for extracting common fields across WorkItemResponse and WorkItemDashboardItem
  const getProjectId = (t: AnyTaskItem): string => {
    if ("project" in t && t.project?.id) return t.project.id;
    if ("project_id" in t) return t.project_id;
    return "";
  };

  const getProjectName = (t: AnyTaskItem): string => {
    if ("project" in t && t.project?.name) return t.project.name;
    const pid = getProjectId(t);
    return projectMap[pid]?.name || "Project";
  };

  const getProjectKey = (t: AnyTaskItem): string => {
    if ("project" in t && t.project?.key) return t.project.key;
    const pid = getProjectId(t);
    return projectMap[pid]?.key || "";
  };

  const getAssigneeName = (t: AnyTaskItem): string => {
    if ("assignee_id" in t && t.assignee_id) {
      return assigneeMap[t.assignee_id] || "Assigned";
    }
    return "Unassigned";
  };

  const isTaskOverdue = (t: AnyTaskItem): boolean => {
    if ("is_overdue" in t) return Boolean(t.is_overdue);
    if (!t.due_date) return false;
    const status = t.status?.toLowerCase();
    if (status === "done" || status === "completed") return false;
    return new Date(t.due_date) < new Date();
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "urgent":
        return "border-destructive/40 bg-destructive/10 text-destructive";
      case "high":
        return "border-orange-500/40 bg-orange-500/10 text-orange-500";
      case "medium":
        return "border-primary/40 bg-primary/10 text-primary";
      default:
        return "border-muted-foreground/30 bg-muted text-muted-foreground";
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "done" || s === "completed") {
      return (
        <Badge
          variant="outline"
          className="border-emerald-500/40 bg-emerald-500/10 text-emerald-500 text-[11px] capitalize"
        >
          {status.replace("_", " ")}
        </Badge>
      );
    }
    if (s === "in_progress" || s === "inprogress") {
      return (
        <Badge
          variant="outline"
          className="border-primary/40 bg-primary/10 text-primary text-[11px] capitalize"
        >
          {status.replace("_", " ")}
        </Badge>
      );
    }
    if (s === "in_review" || s === "review") {
      return (
        <Badge
          variant="outline"
          className="border-amber-500/40 bg-amber-500/10 text-amber-500 text-[11px] capitalize"
        >
          {status.replace("_", " ")}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="text-[11px] capitalize">
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const renderSortIndicator = (field: string) => {
    if (!onSortChange) return null;
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-muted-foreground/50 ms-1 inline" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3 w-3 text-primary ms-1 inline" />
    ) : (
      <ArrowDown className="h-3 w-3 text-primary ms-1 inline" />
    );
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <Skeleton className="h-9 w-full rounded" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          "flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center",
          className
        )}
      >
        <AlertCircle className="mb-3 h-10 w-10 text-destructive" />
        <h3 className="text-sm font-semibold text-foreground">
          Failed to load tasks
        </h3>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">{error}</p>
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry} className="mt-4">
            Try Again
          </Button>
        )}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div
        className={cn(
          "flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center",
          className
        )}
      >
        <CheckCircle2 className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <h3 className="text-sm font-semibold text-foreground">No tasks found</h3>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          No tasks match the active filters or criteria. Try modifying your search or clear all filters.
        </p>
      </div>
    );
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(startItem + tasks.length - 1, totalItems || tasks.length);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead
                className="w-[120px] cursor-pointer select-none"
                onClick={() => onSortChange && onSortChange("issue_key")}
              >
                <span>Key</span>
                {renderSortIndicator("issue_key")}
              </TableHead>

              <TableHead
                className="min-w-[240px] cursor-pointer select-none"
                onClick={() => onSortChange && onSortChange("title")}
              >
                <span>Title</span>
                {renderSortIndicator("title")}
              </TableHead>

              {showProjectColumn && (
                <TableHead className="w-[160px] select-none">
                  <span>Project</span>
                </TableHead>
              )}

              <TableHead
                className="w-[130px] cursor-pointer select-none"
                onClick={() => onSortChange && onSortChange("status")}
              >
                <span>Status</span>
                {renderSortIndicator("status")}
              </TableHead>

              <TableHead
                className="w-[110px] cursor-pointer select-none"
                onClick={() => onSortChange && onSortChange("priority")}
              >
                <span>Priority</span>
                {renderSortIndicator("priority")}
              </TableHead>

              <TableHead className="w-[150px] select-none">
                <span>Assignee</span>
              </TableHead>

              <TableHead
                className="w-[140px] cursor-pointer select-none"
                onClick={() => onSortChange && onSortChange("due_date")}
              >
                <span>Due Date</span>
                {renderSortIndicator("due_date")}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {tasks.map((task) => {
              const overdue = isTaskOverdue(task);
              const assigneeName = getAssigneeName(task);
              const isUnassigned = assigneeName === "Unassigned";

              return (
                <TableRow
                  key={task.id}
                  onClick={() => onTaskClick(task.id)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onTaskClick(task.id);
                    }
                  }}
                  className="cursor-pointer focus:bg-accent/40 focus:outline-none transition-colors"
                >
                  {/* Issue Key */}
                  <TableCell className="font-mono text-xs font-semibold text-primary">
                    {task.issue_key}
                  </TableCell>

                  {/* Task Title */}
                  <TableCell className="font-medium text-xs text-foreground">
                    <div className="truncate max-w-md font-semibold">
                      {task.title}
                    </div>
                  </TableCell>

                  {/* Project Context */}
                  {showProjectColumn && (
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                        <FolderKanban className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{getProjectName(task)}</span>
                        {getProjectKey(task) && (
                          <Badge variant="outline" className="text-[9px] py-0 px-1 font-mono">
                            {getProjectKey(task)}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  )}

                  {/* Status */}
                  <TableCell>{getStatusBadge(task.status)}</TableCell>

                  {/* Priority */}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] capitalize font-medium py-0 px-2",
                        getPriorityBadgeClass(task.priority)
                      )}
                    >
                      {task.priority}
                    </Badge>
                  </TableCell>

                  {/* Assignee */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5 text-[10px]">
                        <AvatarFallback className="bg-secondary text-secondary-foreground text-[9px] font-semibold">
                          {isUnassigned ? "—" : assigneeName[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={cn(
                          "truncate text-xs max-w-[100px]",
                          isUnassigned ? "text-muted-foreground italic" : "text-foreground font-medium"
                        )}
                      >
                        {assigneeName}
                      </span>
                    </div>
                  </TableCell>

                  {/* Due Date */}
                  <TableCell>
                    {task.due_date ? (
                      <div
                        className={cn(
                          "flex items-center gap-1.5 text-xs font-medium",
                          overdue ? "text-destructive" : "text-muted-foreground"
                        )}
                      >
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {new Date(task.due_date).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year:
                              new Date(task.due_date).getFullYear() !==
                              new Date().getFullYear()
                                ? "numeric"
                                : undefined,
                          })}
                        </span>
                        {overdue && (
                          <Badge
                            variant="destructive"
                            className="text-[9px] px-1 py-0 h-4 uppercase"
                          >
                            Overdue
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground/60">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && onPageChange && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-1 text-xs text-muted-foreground">
          <div>
            Showing <span className="font-medium text-foreground">{startItem}</span> to{" "}
            <span className="font-medium text-foreground">{endItem}</span>
            {totalItems !== undefined && (
              <>
                {" "}of <span className="font-medium text-foreground">{totalItems}</span> tasks
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="h-7 px-2.5 text-xs gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </Button>
            <span className="text-xs font-medium px-2 text-foreground">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="h-7 px-2.5 text-xs gap-1"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
