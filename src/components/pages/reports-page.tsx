"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useTransition,
  useRef,
} from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Layers,
  Users,
  AlertCircle,
  RefreshCw,
  FolderKanban,
  FileSpreadsheet,
  Download,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shared/page-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportsOverviewCards } from "@/components/reports/reports-overview-cards";
import { CompletionTrendsChart } from "@/components/reports/completion-trends-chart";
import { TeamWorkloadTable } from "@/components/reports/team-workload-table";
import { SprintReportsSection } from "@/components/reports/sprint-reports-section";
import { ReportsFilterBar } from "@/components/reports/reports-filter-bar";
import { projectService } from "@/services/project-service";
import { organizationService } from "@/services/organization-service";
import {
  reportsService,
  exportTasksOverviewCsv,
  exportTeamWorkloadCsv,
  type DateRangeFilter,
  type DateRangePreset,
  type TrendInterval,
  type ProjectReportsData,
} from "@/services/reports-service";
import { ApiClientError } from "@/services/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ProjectResponse } from "@/services/generated/api-types";

export interface ReportsPageProps {
  organizationId?: string;
  projectId?: string;
  initialTab?: "overview" | "sprints" | "workload";
}

export function ReportsPage({
  organizationId: propOrgId,
  projectId: propProjectId,
  initialTab = "overview",
}: ReportsPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentLocale = pathname?.split("/")[1] || "en";

  const [isPending, startTransition] = useTransition();

  // URL state reading
  const urlOrgId = searchParams.get("org") || propOrgId || "";
  const urlProjectId = searchParams.get("project") || propProjectId || "";
  const urlTab =
    (searchParams.get("tab") as "overview" | "sprints" | "workload" | null) ||
    initialTab;
  const urlRange =
    (searchParams.get("range") as DateRangePreset | null) || "30d";
  const urlFrom = searchParams.get("from") || undefined;
  const urlTo = searchParams.get("to") || undefined;
  const urlInterval =
    (searchParams.get("interval") as TrendInterval | null) || "daily";

  const [organizationId, setOrganizationId] = useState<string>(urlOrgId);
  const [projectId, setProjectId] = useState<string>(urlProjectId);
  const [activeTab, setActiveTab] = useState<
    "overview" | "sprints" | "workload"
  >(urlTab);
  const [dateRange, setDateRange] = useState<DateRangeFilter>({
    preset: urlRange,
    from: urlFrom,
    to: urlTo,
  });
  const [interval, setInterval] = useState<TrendInterval>(urlInterval);

  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [reportData, setReportData] = useState<ProjectReportsData | null>(null);

  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState(false);

  // Sync state to URL without full page reload
  const updateUrlParams = useCallback(
    (newParams: Record<string, string | undefined>) => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams?.toString() || "");
        Object.entries(newParams).forEach(([key, val]) => {
          if (val === undefined || val === "") {
            params.delete(key);
          } else {
            params.set(key, val);
          }
        });
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  // 1. Initial Load: Organizations & Projects discovery
  useEffect(() => {
    let isMounted = true;
    async function loadAccessibleProjects() {
      setIsLoadingProjects(true);
      setError(null);
      try {
        let activeOrg = organizationId;
        if (!activeOrg) {
          const orgRes = await organizationService.getMyOrganizations({
            page_size: 1,
          });
          if (orgRes.items.length > 0) {
            activeOrg = orgRes.items[0].id;
            setOrganizationId(activeOrg);
          }
        }

        if (activeOrg) {
          const projRes = await projectService.getProjects(activeOrg, {
            page_size: 100,
          });
          if (!isMounted) return;
          const accessibleProjects = projRes.items || [];
          setProjects(accessibleProjects);

          if (!projectId && accessibleProjects.length > 0) {
            const defaultProjId = accessibleProjects[0].id;
            setProjectId(defaultProjId);
          }
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        if (err instanceof ApiClientError && err.status === 403) {
          setPermissionError(true);
        } else {
          setError("Failed to discover accessible projects.");
        }
      } finally {
        if (isMounted) setIsLoadingProjects(false);
      }
    }

    loadAccessibleProjects();
    return () => {
      isMounted = false;
    };
  }, [organizationId, projectId]);

  const reportsRequestIdRef = useRef(0);

  // 2. Load Reports Data for selected project and date range
  const loadReports = useCallback(async () => {
    if (!organizationId || !projectId) return;

    const curReqId = ++reportsRequestIdRef.current;
    setIsLoadingReports(true);
    setError(null);
    setPermissionError(false);

    try {
      const data = await reportsService.getProjectReportsData(
        organizationId,
        projectId,
        dateRange,
        interval
      );
      if (curReqId === reportsRequestIdRef.current) {
        setReportData(data);
      }
    } catch (err: unknown) {
      if (curReqId === reportsRequestIdRef.current) {
        if (err instanceof ApiClientError) {
          if (err.status === 403 || err.status === 404) {
            setPermissionError(true);
          } else {
            setError(err.message || "Failed to load project reports.");
          }
        } else {
          setError("Network error while retrieving reports data.");
        }
      }
    } finally {
      if (curReqId === reportsRequestIdRef.current) {
        setIsLoadingReports(false);
      }
    }
  }, [organizationId, projectId, dateRange, interval]);

  useEffect(() => {
    if (organizationId && projectId) {
      loadReports();
    }
  }, [organizationId, projectId, dateRange, interval, loadReports]);

  // Handlers for Filters
  const handleProjectChange = (newProjectId: string) => {
    setProjectId(newProjectId);
    updateUrlParams({ project: newProjectId });
  };

  const handleDateRangeChange = (newRange: DateRangeFilter) => {
    setDateRange(newRange);
    updateUrlParams({
      range: newRange.preset,
      from: newRange.from,
      to: newRange.to,
    });
  };

  const handleIntervalChange = (newInterval: TrendInterval) => {
    setInterval(newInterval);
    updateUrlParams({ interval: newInterval });
  };

  const handleTabChange = (tab: string) => {
    const validTab = tab as "overview" | "sprints" | "workload";
    setActiveTab(validTab);
    updateUrlParams({ tab: validTab });
  };

  // CSV Export Actions
  const handleExportOverview = () => {
    if (!reportData) return;
    try {
      exportTasksOverviewCsv(
        reportData.project,
        reportData.tasks,
        reportData.metrics,
        { from: dateRange.from, to: dateRange.to }
      );
      toast.success("Tasks & Overview CSV exported successfully");
    } catch {
      toast.error("Failed to export overview CSV");
    }
  };

  const handleExportWorkload = () => {
    if (!reportData) return;
    try {
      exportTeamWorkloadCsv(reportData.project, reportData.workload);
      toast.success("Team Workload CSV exported successfully");
    } catch {
      toast.error("Failed to export team workload CSV");
    }
  };

  return (
    <PageContainer>
      {/* Breadcrumb Header */}
      <div className="mb-4">
        {propProjectId ? (
          <Link
            href={`/${currentLocale}/organizations/${organizationId}/projects/${projectId}`}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Project</span>
          </Link>
        ) : (
          <Link
            href={`/${currentLocale}/dashboard`}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Dashboard</span>
          </Link>
        )}
      </div>

      {/* Page Title */}
      <PageHeader
        title={
          reportData
            ? `Reports & Analytics • ${reportData.project.name} (${reportData.project.key})`
            : "Reports & Analytics"
        }
        description="Comprehensive project health, agile burndown progress, time-series velocity trends, and team workload distribution."
      />

      {/* Permission Denied Error State */}
      {permissionError ? (
        <div className="flex min-h-[350px] flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <AlertCircle className="mb-3 h-10 w-10 text-destructive" />
          <h3 className="text-base font-semibold text-foreground">
            Access Denied
          </h3>
          <p className="mt-1 max-w-md text-xs text-muted-foreground">
            You do not have permission to view reporting analytics for this
            project, or the project was not found.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/${currentLocale}/projects`)}
            className="mt-4 text-xs"
          >
            Return to Projects
          </Button>
        </div>
      ) : error ? (
        /* General API Error State */
        <div className="flex min-h-[350px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center">
          <AlertCircle className="mb-3 h-10 w-10 text-destructive" />
          <h3 className="text-base font-semibold text-foreground">
            Failed to Load Reports
          </h3>
          <p className="mt-1 max-w-md text-xs text-muted-foreground">{error}</p>
          <Button
            size="sm"
            onClick={loadReports}
            className="mt-4 gap-1.5 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry</span>
          </Button>
        </div>
      ) : projects.length === 0 && !isLoadingProjects ? (
        /* Empty Projects State */
        <div className="flex min-h-[350px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center">
          <FolderKanban className="mb-3 h-10 w-10 text-muted-foreground/60" />
          <h3 className="text-base font-semibold text-foreground">
            No Projects Available
          </h3>
          <p className="mt-1 max-w-md text-xs text-muted-foreground">
            Create a project or request access to an existing organization to
            view reports and metrics.
          </p>
          <Button
            size="sm"
            onClick={() => router.push(`/${currentLocale}/projects`)}
            className="mt-4 text-xs"
          >
            Explore Projects
          </Button>
        </div>
      ) : (
        /* Main Reports Interface */
        <div className="space-y-6">
          {/* Filter Bar (Projects, Date Presets, Custom Date, CSV Export, Refresh) */}
          <ReportsFilterBar
            projects={projects}
            selectedProjectId={projectId}
            onProjectChange={handleProjectChange}
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            onRefresh={loadReports}
            onExportOverview={handleExportOverview}
            onExportWorkload={handleExportWorkload}
            isLoading={isLoadingReports}
          />

          {isLoadingReports || !reportData ? (
            /* Skeleton Loading State */
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
              <Skeleton className="h-80 w-full rounded-xl" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          ) : (
            /* Loaded Reports View with Tabs */
            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="space-y-6"
            >
              <TabsList className="border border-border bg-muted/40 p-1">
                <TabsTrigger
                  value="overview"
                  className="gap-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>Overview & Trends</span>
                </TabsTrigger>
                <TabsTrigger
                  value="sprints"
                  className="gap-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Sprint Reports</span>
                </TabsTrigger>
                <TabsTrigger
                  value="workload"
                  className="gap-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Team Workload</span>
                </TabsTrigger>
              </TabsList>

              {/* 1. Overview & Trends Tab */}
              <TabsContent value="overview" className="space-y-6 outline-none">
                <ReportsOverviewCards metrics={reportData.metrics} />

                <CompletionTrendsChart
                  trends={reportData.trends}
                  interval={interval}
                  onIntervalChange={handleIntervalChange}
                  isLoading={isLoadingReports}
                />
              </TabsContent>

              {/* 2. Sprint Reports Tab */}
              <TabsContent value="sprints" className="space-y-6 outline-none">
                <SprintReportsSection
                  project={reportData.project}
                  sprints={reportData.sprints}
                  velocity={reportData.velocity}
                />
              </TabsContent>

              {/* 3. Team Workload Tab */}
              <TabsContent value="workload" className="space-y-6 outline-none">
                <TeamWorkloadTable workload={reportData.workload} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      )}
    </PageContainer>
  );
}
