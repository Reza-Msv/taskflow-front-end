"use client";

import React from "react";
import {
  CheckCircle2,
  Clock,
  Layers,
  AlertTriangle,
  UserX,
  TrendingUp,
} from "lucide-react";
import type { OverviewMetrics } from "@/services/reports-service";
import { cn } from "@/lib/utils";

export interface ReportsOverviewCardsProps {
  metrics: OverviewMetrics;
  className?: string;
}

export function ReportsOverviewCards({
  metrics,
  className,
}: ReportsOverviewCardsProps) {
  const {
    totalTasks,
    completedTasks,
    openTasks,
    inProgressTasks,
    overdueTasks,
    unassignedTasks,
    completionPercentage,
  } = metrics;

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
        className
      )}
      data-testid="reports-overview-cards"
    >
      {/* 1. Total Tasks */}
      <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Total Tasks</span>
          <Layers className="h-4 w-4 text-primary" aria-hidden="true" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {totalTasks}
          </span>
          <span className="text-xs text-muted-foreground">in scope</span>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          All tasks in current project/filter
        </p>
      </div>

      {/* 2. Completed Tasks */}
      <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Completed</span>
          <CheckCircle2
            className="h-4 w-4 text-emerald-500"
            aria-hidden="true"
          />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold tracking-tight text-emerald-500">
            {completedTasks}
          </span>
          <span className="text-xs text-muted-foreground">delivered</span>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Marked done in this timeframe
        </p>
      </div>

      {/* 3. Open & In Progress */}
      <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>In Progress & Open</span>
          <Clock className="h-4 w-4 text-sky-500" aria-hidden="true" />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {inProgressTasks}
          </span>
          <span className="text-xs text-muted-foreground">active</span>
          <span className="text-xs text-muted-foreground">/</span>
          <span className="text-sm font-semibold text-muted-foreground">
            {openTasks}
          </span>
          <span className="text-xs text-muted-foreground">open</span>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Under active development or queued
        </p>
      </div>

      {/* 4. Overdue Tasks */}
      <div
        className={cn(
          "flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm",
          overdueTasks > 0 &&
            "border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/10"
        )}
      >
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Overdue</span>
          <AlertTriangle
            className={cn(
              "h-4 w-4",
              overdueTasks > 0 ? "text-rose-500" : "text-muted-foreground"
            )}
            aria-hidden="true"
          />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span
            className={cn(
              "text-2xl font-bold tracking-tight",
              overdueTasks > 0 ? "text-rose-500" : "text-foreground"
            )}
          >
            {overdueTasks}
          </span>
          <span className="text-xs text-muted-foreground">past due date</span>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {overdueTasks > 0
            ? "Needs immediate scheduling attention"
            : "No overdue tasks"}
        </p>
      </div>

      {/* 5. Unassigned Tasks */}
      <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Unassigned</span>
          <UserX className="h-4 w-4 text-amber-500" aria-hidden="true" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {unassignedTasks}
          </span>
          <span className="text-xs text-muted-foreground">unallocated</span>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Awaiting team member assignment
        </p>
      </div>

      {/* 6. Completion Percentage */}
      <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Completion Rate</span>
          <TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold tracking-tight text-primary">
            {completionPercentage}%
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.max(0, completionPercentage))}%`,
            }}
            role="progressbar"
            aria-valuenow={completionPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Completion progress"
          />
        </div>
      </div>
    </div>
  );
}
