"use client";

import React, { useState } from "react";
import {
  History,
  Clock,
  User,
  ArrowRight,
  Filter,
  RefreshCw,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  WorkItemResponse,
  WorkItemActivityResponse,
} from "@/services/generated/api-types";

export interface TaskHistoryDrawerProps {
  task: WorkItemResponse | null;
  isOpen: boolean;
  onClose: () => void;
  activities: WorkItemActivityResponse[];
  isLoading: boolean;
  onRefresh: () => void;
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

export function TaskHistoryDrawer({
  task,
  isOpen,
  onClose,
  activities,
  isLoading,
  onRefresh,
}: TaskHistoryDrawerProps) {
  const [filterField, setFilterField] = useState<string>("all");

  if (!task) return null;

  const filteredActivities =
    filterField === "all"
      ? activities
      : activities.filter((act) => act.field === filterField);

  const availableFields = Array.from(
    new Set(activities.map((a) => a.field).filter(Boolean))
  );

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              <SheetTitle className="text-base font-semibold">
                Activity Audit Stream
              </SheetTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={onRefresh}
              disabled={isLoading}
              aria-label="Refresh activity log"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
          <SheetDescription className="text-xs text-muted-foreground">
            Audit history for{" "}
            <span className="font-mono font-medium text-foreground">
              {task.issue_key}
            </span>{" "}
            — {task.title}
          </SheetDescription>
        </SheetHeader>

        {/* Filter Bar */}
        {availableFields.length > 0 && (
          <div className="my-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="flex items-center gap-1 font-medium text-muted-foreground">
              <Filter className="h-3 w-3" /> Filter:
            </span>
            <button
              onClick={() => setFilterField("all")}
              className={`rounded-md px-2 py-0.5 text-xs transition-colors ${
                filterField === "all"
                  ? "bg-primary font-medium text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              All ({activities.length})
            </button>
            {availableFields.map((field) => {
              const count = activities.filter((a) => a.field === field).length;
              return (
                <button
                  key={field}
                  onClick={() => setFilterField(field as string)}
                  className={`rounded-md px-2 py-0.5 text-xs capitalize transition-colors ${
                    filterField === field
                      ? "bg-primary font-medium text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {field} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Audit Timeline */}
        <div className="mt-4 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-border-subtle p-4 text-center">
              <Clock className="mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">
                No activity history found
              </p>
            </div>
          ) : (
            <div className="relative space-y-4 pl-6 before:absolute before:bottom-2 before:left-2 before:top-2 before:w-0.5 before:bg-border">
              {filteredActivities.map((act) => {
                const formattedDate = act.created_at
                  ? formatDate(act.created_at)
                  : "Unknown date";
                const actorName =
                  act.actor?.full_name ||
                  act.actor?.email ||
                  act.user?.full_name ||
                  act.user?.email ||
                  "System";

                return (
                  <div key={act.id} className="group relative text-xs">
                    {/* Timeline Node Dot */}
                    <div className="absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-background bg-primary ring-1 ring-border" />

                    <div className="rounded-lg border border-border bg-card p-3 shadow-none">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span>{actorName}</span>
                        </span>
                        <span className="text-[10px]">{formattedDate}</span>
                      </div>

                      <div className="mt-1.5 font-medium text-foreground">
                        <Badge
                          variant="outline"
                          className="mr-1.5 text-[10px] capitalize"
                        >
                          Updated
                        </Badge>
                        {act.field && (
                          <span className="font-mono text-muted-foreground">
                            [{act.field}]
                          </span>
                        )}
                      </div>

                      {/* Before / After diff */}
                      {(act.old_value !== null || act.new_value !== null) && (
                        <div className="mt-2 flex items-center gap-2 rounded bg-muted/60 p-1.5 font-mono text-[11px]">
                          <span className="max-w-[120px] truncate text-muted-foreground line-through">
                            {act.old_value || "(empty)"}
                          </span>
                          <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                          <span className="max-w-[120px] truncate font-semibold text-foreground">
                            {act.new_value || "(cleared)"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
