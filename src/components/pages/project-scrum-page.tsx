"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Layers,
  Kanban,
  Calendar,
  BarChart3,
  Plus,
  RefreshCw,
  AlertCircle,
  FolderKanban,
  Target,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shared/page-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BacklogView } from "@/components/scrum/backlog-view";
import { SprintsView } from "@/components/scrum/sprints-view";
import { SprintBoardView } from "@/components/scrum/sprint-board-view";
import { SprintMetricsView } from "@/components/scrum/sprint-metrics-view";
import { SprintCreateDialog } from "@/components/scrum/sprint-create-dialog";
import { TaskModal } from "@/components/shared/task-modal";
import { TaskDetailSheet } from "@/components/shared/task-detail-sheet";
import { projectService } from "@/services/project-service";
import { scrumService } from "@/services/scrum-service";
import { taskService } from "@/services/task-service";
import { useAuth } from "@/modules/auth/context/auth-context";
import { ApiClientError } from "@/services/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type {
  ProjectResponse,
  ProjectMembershipResponse,
  SprintResponse,
  WorkItemResponse,
  WorkItemCreateRequest,
} from "@/services/generated/api-types";

export interface ProjectScrumPageProps {
  organizationId: string;
  projectId: string;
  initialTab?: "backlog" | "board" | "sprints" | "metrics";
}

export function ProjectScrumPage({
  organizationId,
  projectId,
  initialTab = "backlog",
}: ProjectScrumPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentLocale = pathname?.split("/")[1] || "en";
  const { user } = useAuth();

  const tabParam =
    (searchParams.get("tab") as
      "backlog" | "board" | "sprints" | "metrics" | null) || initialTab;
  const [activeTab, setActiveTab] = useState<
    "backlog" | "board" | "sprints" | "metrics"
  >(tabParam);

  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [members, setMembers] = useState<ProjectMembershipResponse[]>([]);
  const [sprints, setSprints] = useState<SprintResponse[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialogs
  const [isCreateSprintOpen, setIsCreateSprintOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  // Task Details Slideout Sheet
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);

  // Sync activeTab when query param changes
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Open task if 'task' parameter in URL
  useEffect(() => {
    const taskParam = searchParams.get("task");
    if (taskParam) {
      setSelectedTaskId(taskParam);
      setIsDetailSheetOpen(true);
    }
  }, [searchParams]);

  const loadPageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [projData, membersData, sprintsData] = await Promise.all([
        projectService.getProject(organizationId, projectId),
        projectService.getMembers(organizationId, projectId, {
          page_size: 100,
        }),
        scrumService.listSprints(organizationId, projectId),
      ]);

      setProject(projData);
      setMembers(membersData.items || []);
      setSprints(sprintsData.items || []);

      const myMembership = membersData.items?.find(
        (m) => m.user_id === user?.id
      );
      if (myMembership) {
        setCurrentUserRole(myMembership.role);
      } else if (user?.is_superuser) {
        setCurrentUserRole("admin");
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (err.status === 401) {
          router.push(`/${currentLocale}/login`);
          return;
        }
        setError(err.message || "Failed to load scrum workspace");
      } else {
        setError("Network error while loading scrum workspace");
      }
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, projectId, user?.id, user?.is_superuser]);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  const canManageProject =
    currentUserRole === "admin" ||
    project?.owner_id === user?.id ||
    user?.is_superuser;

  const canModifyTask = currentUserRole !== "viewer" || canManageProject;

  const activeSprint = sprints.find((s) => s.status === "active") || null;

  // Handle Tab Switch
  const handleTabChange = (
    newTab: "backlog" | "board" | "sprints" | "metrics"
  ) => {
    setActiveTab(newTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", newTab);
    router.replace(`${pathname}?${params.toString()}`);
  };

  // Handle Create Task submission directly into Backlog
  const handleCreateTask = async (data: WorkItemCreateRequest) => {
    setIsSubmittingTask(true);
    try {
      await taskService.createTask(organizationId, projectId, data);
      toast.success("Task created in Product Backlog");
      setIsTaskModalOpen(false);
      loadPageData();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        toast.error(err.message || "Failed to create task");
      } else {
        toast.error("Network error while creating task");
      }
    } finally {
      setIsSubmittingTask(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </PageContainer>
    );
  }

  if (error || !project) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10 p-8 text-center text-destructive">
          <AlertCircle className="mb-2 h-8 w-8" />
          <p className="font-semibold">
            {error || "Project not found or private."}
          </p>
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push(
                  `/${currentLocale}/organizations/${organizationId}/projects`
                )
              }
            >
              Back to Projects
            </Button>
            <Button size="sm" onClick={loadPageData}>
              Try Again
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Navigation Breadcrumb */}
      <div className="mb-3 flex items-center justify-between text-xs">
        <Link
          href={`/${currentLocale}/organizations/${organizationId}/projects/${projectId}`}
          className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Project Overview</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={`/${currentLocale}/organizations/${organizationId}/projects/${projectId}/board`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <FolderKanban className="h-3.5 w-3.5" />
            <span>Kanban Board</span>
          </Link>
        </div>
      </div>

      {/* Header */}
      <PageHeader
        title={`${project.name} • Scrum Workspace`}
        description={`Prefix Key: [${project.key}] • Agile sprint planning, product backlog refinement, and burndown analytics.`}
        actions={
          <div className="flex items-center gap-2">
            {canManageProject && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreateSprintOpen(true)}
                className="h-8 gap-1.5 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Sprint</span>
              </Button>
            )}

            {canModifyTask && (
              <Button
                size="sm"
                onClick={() => setIsTaskModalOpen(true)}
                className="h-8 gap-1.5 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Task</span>
              </Button>
            )}
          </div>
        }
      />

      {/* Scrum Navigation Tabs */}
      <div className="mb-4 flex items-center justify-between border-b border-border pb-1">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => handleTabChange("backlog")}
            className={cn(
              "flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-medium transition-all",
              activeTab === "backlog"
                ? "border-primary font-semibold text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Layers className="h-4 w-4" />
            <span>Product Backlog</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("board")}
            className={cn(
              "flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-medium transition-all",
              activeTab === "board"
                ? "border-primary font-semibold text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Kanban className="h-4 w-4" />
            <span>Active Sprint Board</span>
            {activeSprint && (
              <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                Active
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("sprints")}
            className={cn(
              "flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-medium transition-all",
              activeTab === "sprints"
                ? "border-primary font-semibold text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Calendar className="h-4 w-4" />
            <span>All Sprints</span>
            <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {sprints.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("metrics")}
            className={cn(
              "flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-medium transition-all",
              activeTab === "metrics"
                ? "border-primary font-semibold text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Reports & Velocity</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              router.push(
                `/${currentLocale}/organizations/${organizationId}/projects/${projectId}/reports`
              )
            }
            className="h-8 gap-1.5 text-xs"
            title="Open Full Project Analytics"
          >
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">Analytics</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={loadPageData}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Reload Scrum Workspace"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Tab View Content */}
      <div className="mt-2">
        {activeTab === "backlog" && (
          <BacklogView
            organizationId={organizationId}
            projectId={projectId}
            sprints={sprints}
            members={members}
            canModifyTask={canModifyTask}
            onOpenTaskDetails={(taskId) => {
              setSelectedTaskId(taskId);
              setIsDetailSheetOpen(true);
            }}
            onCreateTask={() => setIsTaskModalOpen(true)}
            onSprintUpdated={loadPageData}
          />
        )}

        {activeTab === "board" && (
          <SprintBoardView
            organizationId={organizationId}
            projectId={projectId}
            activeSprint={activeSprint}
            availableSprints={sprints}
            members={members}
            canModifyTask={canModifyTask}
            onOpenTaskDetails={(taskId) => {
              setSelectedTaskId(taskId);
              setIsDetailSheetOpen(true);
            }}
            onNavigateToBacklog={() => handleTabChange("backlog")}
          />
        )}

        {activeTab === "sprints" && (
          <SprintsView
            organizationId={organizationId}
            projectId={projectId}
            canManageProject={canManageProject}
            canModifyTask={canModifyTask}
            filterMode="all"
            onOpenTaskDetails={(taskId) => {
              setSelectedTaskId(taskId);
              setIsDetailSheetOpen(true);
            }}
            onNavigateToBoard={() => handleTabChange("board")}
          />
        )}

        {activeTab === "metrics" && (
          <SprintMetricsView
            organizationId={organizationId}
            projectId={projectId}
            availableSprints={sprints}
            activeSprint={activeSprint}
          />
        )}
      </div>

      {/* Modals & Slideouts */}
      <SprintCreateDialog
        isOpen={isCreateSprintOpen}
        onOpenChange={setIsCreateSprintOpen}
        organizationId={organizationId}
        projectId={projectId}
        onCreated={() => loadPageData()}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        defaultStatus="todo"
        members={members.map((m) => ({
          userId: m.user_id,
          name: m.user?.full_name || m.user?.email || m.user_id,
        }))}
        availableStatuses={[
          { id: "todo", name: "To Do" },
          { id: "in_progress", name: "In Progress" },
          { id: "done", name: "Done" },
        ]}
        onSubmitCreate={handleCreateTask}
        onSubmitUpdate={async () => {}}
        isSubmitting={isSubmittingTask}
      />

      <TaskDetailSheet
        isOpen={isDetailSheetOpen}
        onClose={() => {
          setIsDetailSheetOpen(false);
          setSelectedTaskId(null);
        }}
        taskId={selectedTaskId}
        organizationId={organizationId}
        projectId={projectId}
        onTaskUpdated={() => loadPageData()}
        onTaskDeleted={() => {
          setIsDetailSheetOpen(false);
          loadPageData();
        }}
        members={members.map((m) => ({
          userId: m.user_id,
          name: m.user?.full_name || m.user?.email || m.user_id,
        }))}
        availableStatuses={[
          { id: "todo", name: "To Do" },
          { id: "in_progress", name: "In Progress" },
          { id: "done", name: "Done" },
        ]}
      />
    </PageContainer>
  );
}
