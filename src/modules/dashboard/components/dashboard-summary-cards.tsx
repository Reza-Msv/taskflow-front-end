import React from "react";
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ListTodo,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardSummaryResponse } from "@/services/generated/api-types";

interface DashboardSummaryCardsProps {
  summary: DashboardSummaryResponse;
}

export function DashboardSummaryCards({ summary }: DashboardSummaryCardsProps) {
  const cards = [
    {
      title: "Total Projects",
      value: summary.total_projects,
      subtitle: "Active accessible workspaces",
      icon: FolderKanban,
      iconClass: "bg-primary/10 text-primary",
      testId: "metric-total-projects",
    },
    {
      title: "Assigned Tasks",
      value: summary.assigned_tasks_count,
      subtitle: "Total assigned work items",
      icon: ListTodo,
      iconClass: "bg-secondary text-foreground",
      testId: "metric-assigned-tasks",
    },
    {
      title: "In Progress",
      value: summary.in_progress_tasks_count,
      subtitle: "Currently being developed",
      icon: Clock,
      iconClass: "bg-status-info-bg text-status-info-foreground",
      testId: "metric-in-progress",
    },
    {
      title: "Completed Tasks",
      value: summary.completed_tasks_count,
      subtitle: "Finished and resolved items",
      icon: CheckCircle2,
      iconClass: "bg-status-success-bg text-status-success-foreground",
      testId: "metric-completed-tasks",
    },
    {
      title: "Overdue Tasks",
      value: summary.overdue_tasks_count,
      subtitle: "Past deadline & incomplete",
      icon: AlertTriangle,
      iconClass:
        summary.overdue_tasks_count > 0
          ? "bg-status-destructive-bg text-status-destructive-foreground"
          : "bg-secondary text-muted-foreground",
      highlight: summary.overdue_tasks_count > 0,
      testId: "metric-overdue-tasks",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.title}
            data-testid={card.testId}
            className={`transition-colors hover:border-border-strong ${
              card.highlight ? "border-status-destructive-bg/60" : ""
            }`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.iconClass}`}
              >
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {card.value}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {card.subtitle}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
