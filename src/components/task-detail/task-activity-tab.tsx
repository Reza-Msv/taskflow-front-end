"use client";

import React from "react";
import { Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTimeAgo } from "@/lib/date-utils";
import type { WorkItemActivityResponse } from "@/services/generated/api-types";

export interface TaskActivityTabProps {
  activities: WorkItemActivityResponse[];
  isLoadingActivities: boolean;
  formatRelativeTime?: (dateStr?: string | null) => string;
}

export function TaskActivityTab({
  activities,
  isLoadingActivities,
  formatRelativeTime = formatTimeAgo,
}: TaskActivityTabProps) {
  if (isLoadingActivities) {
    return (
      <div className="space-y-3 py-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <p className="py-6 text-center text-xs italic text-muted-foreground">
        No activity recorded yet
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {activities.map((act) => (
        <div
          key={act.id}
          className="flex items-start gap-3 rounded-md border border-border/40 p-2.5 text-xs"
        >
          <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <div className="flex-1 space-y-0.5">
            <p className="text-foreground">
              <span className="font-semibold text-primary">
                {act.user?.full_name || act.user?.name || "System"}
              </span>{" "}
              {(act.activity_type || act.field || "Updated").replace(/_/g, " ")}
              :{" "}
              <span className="font-medium">{act.field_name || act.field}</span>
            </p>
            {(act.old_value || act.new_value) && (
              <p className="text-[11px] text-muted-foreground">
                {act.old_value && (
                  <span className="line-through">{act.old_value}</span>
                )}
                {act.old_value && act.new_value && " → "}
                {act.new_value && (
                  <span className="font-medium text-foreground">
                    {act.new_value}
                  </span>
                )}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground">
              {formatRelativeTime(act.created_at)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
