import React from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { formatShortDate } from "@/lib/date-utils";
import { ChevronLeft, ChevronRight, CheckSquare } from "lucide-react";
import type {
  WorkItemDashboardItem,
  ProjectSummary,
} from "@/services/generated/api-types";

interface MyTasksTableProps {
  tasks: WorkItemDashboardItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  selectedStatus?: string;
  selectedProjectId?: string;
  sortBy?:
    "smart_order" | "due_date" | "priority" | "created_at" | "updated_at";
  sortDir?: "asc" | "desc";
  projects: ProjectSummary[];
  onPageChange: (newPage: number) => void;
  onStatusChange: (status: string) => void;
  onProjectChange: (projectId: string) => void;
  onSortChange: (
    sortBy:
      "smart_order" | "due_date" | "priority" | "created_at" | "updated_at",
    sortDir: "asc" | "desc"
  ) => void;
  locale?: string;
}

function getPriorityVariant(
  priority: string
): "destructive" | "warning" | "secondary" | "neutral" {
  switch (priority.toLowerCase()) {
    case "urgent":
      return "destructive";
    case "high":
      return "warning";
    case "medium":
      return "secondary";
    default:
      return "neutral";
  }
}

function getStatusVariant(
  status: string
): "success" | "info" | "warning" | "secondary" | "neutral" {
  switch (status.toLowerCase()) {
    case "done":
    case "completed":
      return "success";
    case "in_progress":
    case "inprogress":
      return "info";
    case "todo":
      return "secondary";
    case "blocked":
      return "warning";
    default:
      return "neutral";
  }
}

function formatDueDate(dueDate: string | null): string {
  return formatShortDate(dueDate);
}

export function MyTasksTable({
  tasks,
  total,
  page,
  pageSize,
  totalPages,
  selectedStatus = "",
  selectedProjectId = "",
  sortBy = "smart_order",
  sortDir = "asc",
  projects,
  onPageChange,
  onStatusChange,
  onProjectChange,
  onSortChange,
  locale = "en",
}: MyTasksTableProps) {
  const statusOptions = [
    { label: "All Statuses", value: "" },
    { label: "To Do", value: "todo" },
    { label: "In Progress", value: "in_progress" },
    { label: "Done", value: "done" },
  ];

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            aria-label="Filter tasks by status"
            className="h-9 rounded-md border border-input bg-card px-3 text-xs font-medium text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Project Filter */}
          <select
            value={selectedProjectId}
            onChange={(e) => onProjectChange(e.target.value)}
            aria-label="Filter tasks by project"
            className="h-9 rounded-md border border-input bg-card px-3 text-xs font-medium text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All Projects</option>
            {projects.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.name} ({proj.key})
              </option>
            ))}
          </select>

          {/* Sort By Filter */}
          <select
            value={`${sortBy}:${sortDir}`}
            onChange={(e) => {
              const [sb, sd] = e.target.value.split(":") as [
                (
                  | "smart_order"
                  | "due_date"
                  | "priority"
                  | "created_at"
                  | "updated_at"
                ),
                "asc" | "desc",
              ];
              onSortChange(sb, sd);
            }}
            aria-label="Sort tasks by"
            className="h-9 rounded-md border border-input bg-card px-3 text-xs font-medium text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="smart_order:asc">Smart Order (Priority)</option>
            <option value="due_date:asc">Due Date (Earliest first)</option>
            <option value="due_date:desc">Due Date (Latest first)</option>
            <option value="priority:asc">Priority (Highest first)</option>
            <option value="created_at:desc">Newest First</option>
            <option value="updated_at:desc">Recently Updated</option>
          </select>
        </div>

        <div className="text-xs text-muted-foreground">
          Showing {tasks.length} of {total} assigned tasks
        </div>
      </div>

      {/* Table or Empty State */}
      {tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks found"
          description={
            selectedStatus || selectedProjectId
              ? "No assigned tasks match the selected filters. Try resetting the filters."
              : "You have no tasks assigned to you across your projects."
          }
        />
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Key</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="w-[180px]">Project</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[100px]">Priority</TableHead>
                <TableHead className="w-[140px]">Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id} data-testid="task-row">
                  <TableCell className="font-mono text-xs font-semibold">
                    <Link
                      href={`/${locale}/projects/${task.project.id}/board`}
                      className="text-primary hover:underline"
                    >
                      {task.issue_key}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-[280px] truncate text-xs font-medium text-foreground">
                    <Link
                      href={`/${locale}/projects/${task.project.id}/board`}
                      className="hover:text-primary hover:underline"
                      title={task.title}
                    >
                      {task.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {task.project.name}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusVariant(task.status)}
                      className="text-[10px] capitalize"
                    >
                      {task.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getPriorityVariant(task.priority)}
                      className="text-[10px] capitalize"
                    >
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs ${
                        task.is_overdue
                          ? "font-semibold text-status-destructive-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {formatDueDate(task.due_date)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(page - 1)}
                  disabled={page <= 1}
                  className="h-8 gap-1 px-2.5 text-xs"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Previous</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="h-8 gap-1 px-2.5 text-xs"
                  aria-label="Next page"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
