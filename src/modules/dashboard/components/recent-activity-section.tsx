import React from "react";
import Link from "next/link";
import {
  Activity,
  Clock,
  FileEdit,
  UserCheck,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatTimeAgo } from "@/lib/date-utils";
import type { UserActivityItem } from "@/services/generated/api-types";

interface RecentActivitySectionProps {
  activities: UserActivityItem[];
  locale?: string;
}

function getActivityIcon(type: string) {
  switch (type.toLowerCase()) {
    case "status_change":
      return <Activity className="h-3.5 w-3.5 text-primary" />;
    case "assignment":
      return <UserCheck className="h-3.5 w-3.5 text-status-info-foreground" />;
    case "comment":
      return (
        <MessageSquare className="h-3.5 w-3.5 text-status-warning-foreground" />
      );
    default:
      return <FileEdit className="h-3.5 w-3.5 text-muted-foreground" />;
  }
}

function formatRelativeTime(dateString: string): string {
  return formatTimeAgo(dateString);
}

export function RecentActivitySection({
  activities,
  locale = "en",
}: RecentActivitySectionProps) {
  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-primary">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold text-foreground">
              Recent Activity
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">
              Audit stream of recent events and updates
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="text-[11px]">
          {activities.length} Events
        </Badge>
      </CardHeader>

      <CardContent>
        {activities.length === 0 ? (
          <div
            data-testid="activity-empty-state"
            className="flex min-h-[140px] flex-col items-center justify-center rounded-lg border border-dashed border-border/80 p-6 text-center"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <Clock className="h-4 w-4" />
            </div>
            <p className="mt-2 text-xs font-medium text-foreground">
              No recent activity
            </p>
            <p className="text-[11px] text-muted-foreground">
              Events such as status changes and assignments will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((item) => (
              <div
                key={item.id}
                data-testid="activity-item"
                className="flex items-start gap-3 rounded-lg border border-border/60 bg-card p-3 transition-colors hover:border-border-strong hover:bg-card-hover"
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary">
                  {getActivityIcon(item.activity_type)}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="font-semibold text-foreground">
                      {item.actor?.full_name || "System"}
                    </span>
                    <span className="text-muted-foreground">
                      {item.details || `updated ${item.field || "task"}`}
                    </span>
                    {item.work_item_key && item.project_id && (
                      <Link
                        href={`/${locale}/projects/${item.project_id}/board`}
                        className="font-mono text-[11px] font-semibold text-primary hover:underline"
                      >
                        ({item.work_item_key})
                      </Link>
                    )}
                  </div>

                  {item.work_item_title && (
                    <p className="truncate text-[11px] text-muted-foreground">
                      {item.work_item_title}
                    </p>
                  )}

                  <p className="text-[10px] text-muted-foreground/80">
                    {formatRelativeTime(item.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
