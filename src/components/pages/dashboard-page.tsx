"use client";

import React, { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { RefreshCw, AlertCircle } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shared/page-container";
import { Button } from "@/components/ui/button";
import { dashboardService } from "@/services/dashboard-service";
import { ApiClientError } from "@/services/api-client";
import { DashboardSummaryCards } from "@/modules/dashboard/components/dashboard-summary-cards";
import { OverdueUpcomingSection } from "@/modules/dashboard/components/overdue-upcoming-section";
import { MyTasksTable } from "@/modules/dashboard/components/my-tasks-table";
import { RecentActivitySection } from "@/modules/dashboard/components/recent-activity-section";
import { DashboardSkeleton } from "@/modules/dashboard/components/dashboard-skeleton";
import type {
  DashboardSummaryResponse,
  WorkItemListDashboardResponse,
  OverdueUpcomingTasksResponse,
  UserActivityListResponse,
} from "@/services/generated/api-types";

export function DashboardPage() {
  const pathname = usePathname();
  const currentLocale = pathname?.split("/")[1] || "en";

  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [tasksResponse, setTasksResponse] =
    useState<WorkItemListDashboardResponse | null>(null);
  const [overdueUpcoming, setOverdueUpcoming] =
    useState<OverdueUpcomingTasksResponse | null>(null);
  const [activityResponse, setActivityResponse] =
    useState<UserActivityListResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination for My Tasks
  const [taskPage, setTaskPage] = useState(1);
  const [taskStatus, setTaskStatus] = useState("");
  const [taskProjectId, setTaskProjectId] = useState("");
  const [taskSortBy, setTaskSortBy] = useState<
    "smart_order" | "due_date" | "priority" | "created_at" | "updated_at"
  >("smart_order");
  const [taskSortDir, setTaskSortDir] = useState<"asc" | "desc">("asc");

  // Load summary, overdue/upcoming, and activity
  const loadDashboardData = useCallback(async () => {
    try {
      const [sum, ovUp, act] = await Promise.all([
        dashboardService.getSummary(),
        dashboardService.getOverdueUpcoming({ upcoming_days: 7 }),
        dashboardService.getActivity({ page: 1, page_size: 15 }),
      ]);
      setSummary(sum);
      setOverdueUpcoming(ovUp);
      setActivityResponse(act);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Unable to load dashboard data. Please try again.");
      }
    }
  }, []);

  // Load My Tasks with filters and pagination
  const loadTasks = useCallback(async () => {
    try {
      const data = await dashboardService.getMyTasks({
        page: taskPage,
        page_size: 10,
        status: taskStatus || undefined,
        project_id: taskProjectId || undefined,
        sort_by: taskSortBy,
        sort_dir: taskSortDir,
      });
      setTasksResponse(data);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Failed to fetch assigned tasks.");
      }
    }
  }, [taskPage, taskStatus, taskProjectId, taskSortBy, taskSortDir]);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [sum, ovUp, act, tasks] = await Promise.all([
          dashboardService.getSummary(),
          dashboardService.getOverdueUpcoming({ upcoming_days: 7 }),
          dashboardService.getActivity({ page: 1, page_size: 15 }),
          dashboardService.getMyTasks({
            page: 1,
            page_size: 10,
            sort_by: "smart_order",
            sort_dir: "asc",
          }),
        ]);
        if (!cancelled) {
          setSummary(sum);
          setOverdueUpcoming(ovUp);
          setActivityResponse(act);
          setTasksResponse(tasks);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiClientError) {
            setError(err.message);
          } else {
            setError("Unable to load dashboard data. Please try again.");
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  // Refetch tasks when filter/sort/page changes
  const isMountedRef = React.useRef(false);
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }
    loadTasks();
  }, [loadTasks]);

  // Refresh trigger
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const [sum, ovUp, act, tasks] = await Promise.all([
        dashboardService.getSummary(),
        dashboardService.getOverdueUpcoming({ upcoming_days: 7 }),
        dashboardService.getActivity({ page: 1, page_size: 15 }),
        dashboardService.getMyTasks({
          page: taskPage,
          page_size: 10,
          status: taskStatus || undefined,
          project_id: taskProjectId || undefined,
          sort_by: taskSortBy,
          sort_dir: taskSortDir,
        }),
      ]);
      setSummary(sum);
      setOverdueUpcoming(ovUp);
      setActivityResponse(act);
      setTasksResponse(tasks);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Unable to refresh dashboard. Please try again.");
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStatusChange = (status: string) => {
    setTaskStatus(status);
    setTaskPage(1);
  };

  const handleProjectChange = (projectId: string) => {
    setTaskProjectId(projectId);
    setTaskPage(1);
  };

  const handleSortChange = (
    sortBy:
      "smart_order" | "due_date" | "priority" | "created_at" | "updated_at",
    sortDir: "asc" | "desc"
  ) => {
    setTaskSortBy(sortBy);
    setTaskSortDir(sortDir);
    setTaskPage(1);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Monitor your active assigned tasks, approaching deadlines, and recent activity."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                isLoading || isRefreshing ? "animate-spin" : ""
              }`}
            />
            <span>Refresh</span>
          </Button>
        }
      />

      {/* Global Error Banner */}
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-8">
          {/* Section 1: Dashboard Overview Summary Cards */}
          {summary && <DashboardSummaryCards summary={summary} />}

          {/* Section 2: Overdue & Upcoming Tasks */}
          {overdueUpcoming && (
            <OverdueUpcomingSection
              overdueTasks={overdueUpcoming.overdue_tasks}
              upcomingTasks={overdueUpcoming.upcoming_tasks}
              locale={currentLocale}
            />
          )}

          {/* Section 3: My Assigned Tasks Table */}
          <div className="space-y-3">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              My Assigned Tasks
            </h2>
            <MyTasksTable
              tasks={tasksResponse?.items || []}
              total={tasksResponse?.total || 0}
              page={tasksResponse?.page || 1}
              pageSize={tasksResponse?.page_size || 10}
              totalPages={tasksResponse?.total_pages || 1}
              selectedStatus={taskStatus}
              selectedProjectId={taskProjectId}
              sortBy={taskSortBy}
              sortDir={taskSortDir}
              projects={summary?.projects || []}
              onPageChange={setTaskPage}
              onStatusChange={handleStatusChange}
              onProjectChange={handleProjectChange}
              onSortChange={handleSortChange}
              locale={currentLocale}
            />
          </div>

          {/* Section 4: Recent Activity */}
          <RecentActivitySection
            activities={activityResponse?.items || []}
            locale={currentLocale}
          />
        </div>
      )}
    </PageContainer>
  );
}
