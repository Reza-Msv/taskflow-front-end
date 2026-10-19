import React from "react";
import Link from "next/link";
import { AlertCircle, Clock, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatShortDate } from "@/lib/date-utils";
import type { WorkItemDashboardItem } from "@/services/generated/api-types";

interface OverdueUpcomingSectionProps {
  overdueTasks: WorkItemDashboardItem[];
  upcomingTasks: WorkItemDashboardItem[];
  locale?: string;
}

function formatTaskDate(dateString: string | null): string {
  if (!dateString) return "No deadline";
  return formatShortDate(dateString);
}

function getPriorityBadgeVariant(
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

export function OverdueUpcomingSection({
  overdueTasks,
  upcomingTasks,
  locale = "en",
}: OverdueUpcomingSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Overdue Section */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-status-destructive-bg text-status-destructive-foreground">
              <AlertCircle className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                Overdue Tasks
              </CardTitle>
              <p className="text-[11px] text-muted-foreground">
                Incomplete tasks past their scheduled due date
              </p>
            </div>
          </div>
          <Badge
            variant={overdueTasks.length > 0 ? "destructive" : "secondary"}
            className="text-[11px]"
          >
            {overdueTasks.length}
          </Badge>
        </CardHeader>
        <CardContent>
          {overdueTasks.length === 0 ? (
            <div
              data-testid="overdue-empty-state"
              className="flex min-h-[140px] flex-col items-center justify-center rounded-lg border border-dashed border-border/80 p-6 text-center"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-status-success-bg/30 text-status-success-foreground">
                <Clock className="h-4 w-4" />
              </div>
              <p className="mt-2 text-xs font-medium text-foreground">
                No overdue tasks
              </p>
              <p className="text-[11px] text-muted-foreground">
                Great job! All your assigned tasks are on track.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {overdueTasks.map((task) => (
                <div
                  key={task.id}
                  data-testid="overdue-task-item"
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-card p-3 transition-colors hover:border-border-strong hover:bg-card-hover"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <Link
                        href={`/${locale}/projects/${task.project.id}/board`}
                        className="font-mono text-[11px] font-semibold text-primary hover:underline"
                      >
                        {task.issue_key}
                      </Link>
                      <span className="text-[11px] text-muted-foreground">
                        • {task.project.name}
                      </span>
                    </div>
                    <p className="truncate text-xs font-medium text-foreground">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-status-destructive-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Due {formatTaskDate(task.due_date)}</span>
                    </div>
                  </div>
                  <Badge
                    variant={getPriorityBadgeVariant(task.priority)}
                    className="shrink-0 text-[10px] capitalize"
                  >
                    {task.priority}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Section */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-status-warning-bg text-status-warning-foreground">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                Upcoming Deadlines
              </CardTitle>
              <p className="text-[11px] text-muted-foreground">
                Tasks due within the next 7 days
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="text-[11px]">
            {upcomingTasks.length}
          </Badge>
        </CardHeader>
        <CardContent>
          {upcomingTasks.length === 0 ? (
            <div
              data-testid="upcoming-empty-state"
              className="flex min-h-[140px] flex-col items-center justify-center rounded-lg border border-dashed border-border/80 p-6 text-center"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                <Calendar className="h-4 w-4" />
              </div>
              <p className="mt-2 text-xs font-medium text-foreground">
                No upcoming deadlines
              </p>
              <p className="text-[11px] text-muted-foreground">
                You have no tasks approaching due dates in the next 7 days.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingTasks.map((task) => (
                <div
                  key={task.id}
                  data-testid="upcoming-task-item"
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-card p-3 transition-colors hover:border-border-strong hover:bg-card-hover"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <Link
                        href={`/${locale}/projects/${task.project.id}/board`}
                        className="font-mono text-[11px] font-semibold text-primary hover:underline"
                      >
                        {task.issue_key}
                      </Link>
                      <span className="text-[11px] text-muted-foreground">
                        • {task.project.name}
                      </span>
                    </div>
                    <p className="truncate text-xs font-medium text-foreground">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Due {formatTaskDate(task.due_date)}</span>
                    </div>
                  </div>
                  <Badge
                    variant={getPriorityBadgeVariant(task.priority)}
                    className="shrink-0 text-[10px] capitalize"
                  >
                    {task.priority}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
