import { projectService } from "@/services/project-service";
import { taskService } from "@/services/task-service";
import { organizationService } from "@/services/organization-service";
import { dashboardService } from "@/services/dashboard-service";
import type {
  ProjectResponse,
  WorkItemResponse,
  WorkItemDashboardItem,
} from "@/services/generated/api-types";

export interface ProjectSearchResult {
  id: string;
  name: string;
  key: string;
  organizationId: string;
  isPrivate?: boolean;
}

export interface TaskSearchResult {
  id: string;
  title: string;
  issueKey: string;
  status: string;
  priority: string;
  projectId: string;
  organizationId?: string;
  projectName?: string;
  projectKey?: string;
  dueDate?: string | null;
}

export interface GlobalSearchResults {
  projects: ProjectSearchResult[];
  tasks: TaskSearchResult[];
}

export interface GlobalSearchOptions {
  organizationId?: string;
  projectId?: string;
  limit?: number;
}

export const searchService = {
  /**
   * Search across accessible projects and tasks using backend endpoints.
   * If organizationId is not provided, it falls back to the user's primary organization.
   */
  async globalSearch(
    query: string,
    options: GlobalSearchOptions = {}
  ): Promise<GlobalSearchResults> {
    const trimmed = query.trim();
    if (!trimmed) {
      return { projects: [], tasks: [] };
    }

    const limit = options.limit || 10;
    let orgId = options.organizationId;

    // If no orgId is passed, look up the user's first available organization
    if (!orgId) {
      try {
        const orgs = await organizationService.getMyOrganizations({ page_size: 1 });
        if (orgs.items && orgs.items.length > 0) {
          orgId = orgs.items[0].id;
        }
      } catch {
        // Continue with whatever is available
      }
    }

    const projectsPromise: Promise<ProjectSearchResult[]> = (async () => {
      if (!orgId) return [];
      try {
        const res = await projectService.getProjects(orgId, {
          search: trimmed,
          page_size: limit,
        });
        return (res.items || []).map((p: ProjectResponse) => ({
          id: p.id,
          name: p.name,
          key: p.key,
          organizationId: p.organization_id,
          isPrivate: p.is_private,
        }));
      } catch {
        return [];
      }
    })();

    const tasksPromise: Promise<TaskSearchResult[]> = (async () => {
      // If a specific project is selected, search tasks within that project
      if (orgId && options.projectId) {
        try {
          const res = await taskService.getTasks(orgId, options.projectId, {
            search: trimmed,
            page_size: limit,
          });
          return (res.items || []).map((t: WorkItemResponse) => ({
            id: t.id,
            title: t.title,
            issueKey: t.issue_key,
            status: t.status,
            priority: t.priority,
            projectId: t.project_id,
            organizationId: t.organization_id || orgId,
            dueDate: t.due_date,
          }));
        } catch {
          return [];
        }
      }

      // Otherwise, search user's assigned tasks from dashboard service
      try {
        const res = await dashboardService.getMyTasks({
          page_size: 50,
        });
        const q = trimmed.toLowerCase();
        const matches = (res.items || [])
          .filter(
            (t: WorkItemDashboardItem) =>
              t.title.toLowerCase().includes(q) ||
              t.issue_key.toLowerCase().includes(q)
          )
          .slice(0, limit);

        return matches.map((t: WorkItemDashboardItem) => ({
          id: t.id,
          title: t.title,
          issueKey: t.issue_key,
          status: t.status,
          priority: t.priority,
          projectId: t.project.id,
          organizationId: t.project.organization_id || orgId,
          projectName: t.project.name,
          projectKey: t.project.key,
          dueDate: t.due_date,
        }));
      } catch {
        return [];
      }
    })();

    const [projects, tasks] = await Promise.all([projectsPromise, tasksPromise]);

    return {
      projects,
      tasks,
    };
  },
};
