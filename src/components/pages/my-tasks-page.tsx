"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  CheckSquare,
  AlertCircle,
  Clock,
  CheckCircle2,
  ListFilter,
  RefreshCw,
  LayoutList,
  LayoutGrid,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shared/page-container";
import { TaskListView } from "@/components/shared/task-list-view";
import { TaskCard } from "@/components/shared/task-card";
import { AdvancedTaskFilters } from "@/components/shared/advanced-task-filters";
import { TaskDetailSheet } from "@/components/shared/task-detail-sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dashboardService } from "@/services/dashboard-service";
import { projectService } from "@/services/project-service";
import { organizationService } from "@/services/organization-service";
import { ApiClientError } from "@/services/api-client";
import { useAuth } from "@/modules/auth/context/auth-context";
import type {
  WorkItemDashboardItem,
  WorkItemListDashboardResponse,
  ProjectResponse,
} from "@/services/generated/api-types";
import type { TaskFilterCriteria } from "@/services/saved-filter-service";
import { toast } from "sonner";

type PresetType = "all" | "overdue" | "due_soon" | "in_progress" | "done";

export function MyTasksPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentLocale = pathname?.split("/")[1] || "en";
  const { user, isAuthenticated } = useAuth();

  const [activePreset, setActivePreset] = useState<PresetType>(
    (searchParams.get("preset") as PresetType) || "all"
  );
  const [viewMode, setViewMode] = useState<"list" | "grid">(
    (searchParams.get("view") as "list" | "grid") || "list"
  );

  // Filter criteria
  const [filters, setFilters] = useState<TaskFilterCriteria>({
    search: searchParams.get("search") || "",
    status: searchParams.get("status") || "all",
    priority: searchParams.get("priority") || "all",
    project_id: searchParams.get("project") || "all",
    due_preset: (searchParams.get("due") as TaskFilterCriteria["due_preset"]) || "all",
    sort_by: searchParams.get("sort_by") || "smart_order",
    sort_dir: (searchParams.get("sort_dir") as "asc" | "desc") || "asc",
  });

  // Data state
  const [tasks, setTasks] = useState<WorkItemDashboardItem[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Summary counts for tabs
  const [summaryCounts, setSummaryCounts] = useState<{
    assigned: number;
    inProgress: number;
    completed: number;
    overdue: number;
  }>({ assigned: 0, inProgress: 0, completed: 0, overdue: 0 });

  // Projects list for filter dropdown
  const [projectOptions, setProjectOptions] = useState<
    { value: string; label: string }[]
  >([]);

  // Task Details Sheet state
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [selectedTaskProject, setSelectedTaskProject] = useState<{
    organizationId: string;
    projectId: string;
  } | null>(null);

  // Load accessible projects for filtering
  useEffect(() => {
    organizationService
      .getMyOrganizations({ page_size: 5 })
      .then(async (orgs) => {
        if (!orgs.items || orgs.items.length === 0) return;
        const allProjOptions: { value: string; label: string }[] = [];
        for (const org of orgs.items) {
          try {
            const res = await projectService.getProjects(org.id, {
              page_size: 50,
            });
            (res.items || []).forEach((p: ProjectResponse) => {
              allProjOptions.push({ value: p.id, label: `${p.name} (${p.key})` });
            });
          } catch {
            // Ignore
          }
        }
        setProjectOptions(allProjOptions);
      })
      .catch(() => {});
  }, []);

  // Fetch summary metrics
  const loadSummary = useCallback(async () => {
    try {
      const summary = await dashboardService.getSummary();
      setSummaryCounts({
        assigned: summary.assigned_tasks_count,
        inProgress: summary.in_progress_tasks_count,
        completed: summary.completed_tasks_count,
        overdue: summary.overdue_tasks_count,
      });
    } catch {
      // Ignored
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // Main task fetcher
  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (activePreset === "overdue" || activePreset === "due_soon") {
        // Use overdue-upcoming endpoint
        const res = await dashboardService.getOverdueUpcoming({
          upcoming_days: activePreset === "due_soon" ? 7 : 30,
          limit: 50,
        });

        let items =
          activePreset === "overdue" ? res.overdue_tasks : res.upcoming_tasks;

        // Apply client filters if present
        if (filters.search?.trim()) {
          const q = filters.search.toLowerCase();
          items = items.filter(
            (t) =>
              t.title.toLowerCase().includes(q) ||
              t.issue_key.toLowerCase().includes(q)
          );
        }
        if (filters.priority && filters.priority !== "all") {
          items = items.filter((t) => t.priority.toLowerCase() === filters.priority?.toLowerCase());
        }
        if (filters.project_id && filters.project_id !== "all") {
          items = items.filter((t) => t.project?.id === filters.project_id);
        }

        setTasks(items);
        setTotalTasks(items.length);
        setTotalPages(1);
        setCurrentPage(1);
      } else {
        // Normal paginated my tasks query
        const queryParams: Parameters<typeof dashboardService.getMyTasks>[0] = {
          page: currentPage,
          page_size: 25,
        };

        if (activePreset === "in_progress") {
          queryParams.status = "in_progress";
        } else if (activePreset === "done") {
          queryParams.status = "done";
        } else if (filters.status && filters.status !== "all") {
          queryParams.status = filters.status;
        }

        if (filters.project_id && filters.project_id !== "all") {
          queryParams.project_id = filters.project_id;
        }

        if (filters.sort_by) {
          queryParams.sort_by = filters.sort_by as
            | "smart_order"
            | "due_date"
            | "priority"
            | "created_at"
            | "updated_at";
        }
        if (filters.sort_dir) {
          queryParams.sort_dir = filters.sort_dir;
        }

        const res: WorkItemListDashboardResponse = await dashboardService.getMyTasks(
          queryParams
        );

        let items = res.items || [];
        if (filters.search?.trim()) {
          const q = filters.search.toLowerCase();
          items = items.filter(
            (t) =>
              t.title.toLowerCase().includes(q) ||
              t.issue_key.toLowerCase().includes(q)
          );
        }
        if (filters.priority && filters.priority !== "all") {
          items = items.filter((t) => t.priority.toLowerCase() === filters.priority?.toLowerCase());
        }

        setTasks(items);
        setTotalTasks(res.total);
        setTotalPages(res.total_pages || Math.ceil(res.total / 25) || 1);
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError && err.status === 401) {
        router.push(`/${currentLocale}/login`);
        return;
      }
      setError(
        err instanceof Error ? err.message : "Failed to load your assigned tasks"
      );
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePreset, filters, currentPage, currentLocale]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handlePresetChange = (preset: string) => {
    setActivePreset(preset as PresetType);
    setCurrentPage(1);
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("preset", preset);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleTaskClick = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.project) {
      setSelectedTaskProject({
        organizationId: task.project.organization_id || "default",
        projectId: task.project.id,
      });
      setDetailTaskId(taskId);
      setIsDetailSheetOpen(true);
    }
  };

  const handleSortChange = (field: string) => {
    let nextDir: "asc" | "desc" = "asc";
    if (filters.sort_by === field) {
      nextDir = filters.sort_dir === "asc" ? "desc" : "asc";
    }
    setFilters((prev) => ({
      ...prev,
      sort_by: field,
      sort_dir: nextDir,
    }));
  };

  return (
    <PageContainer>
      <PageHeader
        title="My Tasks"
        description="All work items assigned to you across your active projects and workspaces"
        actions={
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg border border-border bg-card p-0.5">
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-7 w-7 p-0"
                aria-label="List view"
                title="List view"
              >
                <LayoutList className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-7 w-7 p-0"
                aria-label="Grid view"
                title="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                loadTasks();
                loadSummary();
              }}
              className="gap-1.5 h-8 text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </Button>
          </div>
        }
      />

      {/* Preset Filter Tabs */}
      <div className="mb-4">
        <Tabs value={activePreset} onValueChange={handlePresetChange}>
          <TabsList className="bg-muted/70 p-1">
            <TabsTrigger value="all" className="text-xs gap-1.5">
              <CheckSquare className="h-3.5 w-3.5" />
              <span>Assigned to me</span>
              {summaryCounts.assigned > 0 && (
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                  {summaryCounts.assigned}
                </Badge>
              )}
            </TabsTrigger>

            <TabsTrigger value="overdue" className="text-xs gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-destructive" />
              <span>Overdue</span>
              {summaryCounts.overdue > 0 && (
                <Badge variant="destructive" className="px-1.5 py-0 text-[10px]">
                  {summaryCounts.overdue}
                </Badge>
              )}
            </TabsTrigger>

            <TabsTrigger value="due_soon" className="text-xs gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <span>Due Soon</span>
            </TabsTrigger>

            <TabsTrigger value="in_progress" className="text-xs gap-1.5">
              <span>In Progress</span>
              {summaryCounts.inProgress > 0 && (
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                  {summaryCounts.inProgress}
                </Badge>
              )}
            </TabsTrigger>

            <TabsTrigger value="done" className="text-xs gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>Completed</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Advanced Task Filters */}
      <div className="mb-4">
        <AdvancedTaskFilters
          filters={filters}
          onFiltersChange={(newFilters) => {
            setFilters(newFilters);
            setCurrentPage(1);
          }}
          projectOptions={projectOptions}
          showProjectFilter={true}
          showAssigneeFilter={false} // My Tasks is already scoped to current user
          syncWithUrl={true}
          userId={user?.id}
        />
      </div>

      {/* Main Content Area */}
      {viewMode === "list" ? (
        <TaskListView
          tasks={tasks}
          isLoading={isLoading}
          error={error}
          onRetry={loadTasks}
          onTaskClick={handleTaskClick}
          showProjectColumn={true}
          sortField={filters.sort_by}
          sortDirection={filters.sort_dir}
          onSortChange={handleSortChange}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalTasks}
          onPageChange={setCurrentPage}
        />
      ) : (
        <div className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-36 rounded-xl" />
              ))}
            </div>
          ) : error ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center">
              <AlertCircle className="mb-3 h-10 w-10 text-destructive" />
              <h3 className="text-sm font-semibold text-foreground">
                Failed to load tasks
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">{error}</p>
              <Button size="sm" variant="outline" onClick={loadTasks} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center">
              <CheckCircle2 className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <h3 className="text-sm font-semibold text-foreground">No tasks found</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                You have no tasks matching this criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleTaskClick(task.id)}
                  className="cursor-pointer transition-transform hover:-translate-y-0.5"
                >
                  <TaskCard
                    task={{
                      id: task.id,
                      project_id: task.project?.id || "",
                      organization_id: task.project?.organization_id || "default",
                      sequence_number: 1,
                      issue_key: task.issue_key,
                      type: task.type,
                      title: task.title,
                      status: task.status,
                      priority: task.priority,
                      rank: task.rank,
                      due_date: task.due_date,
                      version: 1,
                      created_at: task.created_at,
                      updated_at: task.updated_at,
                    }}
                    onClick={() => handleTaskClick(task.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Task Details Sheet */}
      {selectedTaskProject && (
        <TaskDetailSheet
          isOpen={isDetailSheetOpen}
          onClose={() => {
            setIsDetailSheetOpen(false);
            setDetailTaskId(null);
            setSelectedTaskProject(null);
          }}
          taskId={detailTaskId}
          organizationId={selectedTaskProject.organizationId}
          projectId={selectedTaskProject.projectId}
          onTaskUpdated={() => {
            loadTasks();
            loadSummary();
          }}
          onTaskDeleted={() => {
            setIsDetailSheetOpen(false);
            setDetailTaskId(null);
            loadTasks();
            loadSummary();
          }}
        />
      )}
    </PageContainer>
  );
}
