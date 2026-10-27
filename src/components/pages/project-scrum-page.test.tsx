import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectScrumPage } from "./project-scrum-page";
import { projectService } from "@/services/project-service";
import { scrumService } from "@/services/scrum-service";
import * as authContextModule from "@/modules/auth/context/auth-context";
import type {
  ProjectResponse,
  ProjectMembershipResponse,
  SprintResponse,
  BacklogSummaryResponse,
  SprintBurndownResponse,
  ProjectVelocityResponse,
} from "@/services/generated/api-types";

const { pushMock, replaceMock, routerMock } = vi.hoisted(() => {
  const push = vi.fn();
  const replace = vi.fn();
  return {
    pushMock: push,
    replaceMock: replace,
    routerMock: {
      push,
      replace,
    },
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  usePathname: () => "/en/organizations/org-1/projects/proj-1/scrum",
  useSearchParams: () => new URLSearchParams(),
}));

describe("ProjectScrumPage", () => {
  const sampleProject: ProjectResponse = {
    id: "proj-1",
    organization_id: "org-1",
    name: "Scrum Engine",
    key: "SCRUM",
    description: "Agile delivery project",
    is_private: false,
    is_archived: false,
    owner_id: "user-lead",
    created_at: "2026-10-27T00:00:00Z",
    updated_at: "2026-10-27T00:00:00Z",
  };

  const sampleMembers: ProjectMembershipResponse[] = [
    {
      id: "pm-1",
      project_id: "proj-1",
      user_id: "user-lead",
      role: "admin",
      created_at: "2026-10-27T00:00:00Z",
      updated_at: "2026-10-27T00:00:00Z",
      user: {
        id: "user-lead",
        email: "lead@taskflow.dev",
        full_name: "Scrum Lead",
        is_active: true,
        is_superuser: false,
        created_at: "2026-10-27T00:00:00Z",
        updated_at: "2026-10-27T00:00:00Z",
      },
    },
  ];

  const sampleSprints: SprintResponse[] = [
    {
      id: "sprint-1",
      project_id: "proj-1",
      name: "Sprint 1 - In Progress",
      goal: "Ship auth and backlog",
      status: "active",
      start_date: "2026-10-20T00:00:00Z",
      end_date: "2026-11-03T00:00:00Z",
      total_tasks: 4,
      completed_tasks: 2,
      total_points: 16,
      completed_points: 8,
      created_at: "2026-10-20T00:00:00Z",
      updated_at: "2026-10-20T00:00:00Z",
    },
    {
      id: "sprint-2",
      project_id: "proj-1",
      name: "Sprint 2 - Next Iteration",
      goal: "Billing and notifications",
      status: "draft",
      start_date: "2026-11-04T00:00:00Z",
      end_date: "2026-11-18T00:00:00Z",
      total_tasks: 0,
      completed_tasks: 0,
      total_points: 0,
      completed_points: 0,
      created_at: "2026-10-27T00:00:00Z",
      updated_at: "2026-10-27T00:00:00Z",
    },
  ];

  const sampleBacklog: BacklogSummaryResponse = {
    total_tasks: 3,
    total_points: 13,
    unestimated_tasks: 1,
    items: [
      {
        id: "task-1",
        project_id: "proj-1",
        organization_id: "org-1",
        sequence_number: 1,
        issue_key: "SCRUM-1",
        type: "story",
        title: "Setup OAuth2 flow",
        status: "todo",
        priority: "high",
        rank: "0|000001:",
        estimated_points: 5,
        version: 1,
        created_at: "2026-10-27T00:00:00Z",
        updated_at: "2026-10-27T00:00:00Z",
      },
      {
        id: "task-2",
        project_id: "proj-1",
        organization_id: "org-1",
        sequence_number: 2,
        issue_key: "SCRUM-2",
        type: "task",
        title: "Database index tuning",
        status: "todo",
        priority: "urgent",
        rank: "0|000002:",
        estimated_points: 8,
        version: 1,
        created_at: "2026-10-27T00:00:00Z",
        updated_at: "2026-10-27T00:00:00Z",
      },
      {
        id: "task-3",
        project_id: "proj-1",
        organization_id: "org-1",
        sequence_number: 3,
        issue_key: "SCRUM-3",
        type: "task",
        title: "Write documentation",
        status: "todo",
        priority: "low",
        rank: "0|000003:",
        estimated_points: null,
        version: 1,
        created_at: "2026-10-27T00:00:00Z",
        updated_at: "2026-10-27T00:00:00Z",
      },
    ],
    page: 1,
    page_size: 50,
    total: 3,
  };

  const sampleBurndown: SprintBurndownResponse = {
    sprint_id: "sprint-1",
    sprint_name: "Sprint 1 - In Progress",
    status: "active",
    total_story_points: 16,
    total_tasks: 4,
    data_points: [
      {
        date: "2026-10-20",
        remaining_story_points: 16,
        remaining_tasks: 4,
        completed_story_points: 0,
        completed_tasks: 0,
        ideal_story_points: 16,
        ideal_tasks: 4,
        is_historical_reconstructed: false,
        data_available: true,
      },
      {
        date: "2026-10-21",
        remaining_story_points: 8,
        remaining_tasks: 2,
        completed_story_points: 8,
        completed_tasks: 2,
        ideal_story_points: 12,
        ideal_tasks: 3,
        is_historical_reconstructed: true,
        data_available: true,
      },
    ],
    metric_types: ["story_points", "task_count"],
    reconstruction_policy: "Audit based reconstruction",
  };

  const sampleVelocity: ProjectVelocityResponse = {
    project_id: "proj-1",
    completed_sprints_count: 1,
    average_velocity_points: 12,
    average_velocity_tasks: 3,
    sprints: [
      {
        sprint_id: "sprint-0",
        sprint_name: "Sprint 0 - Inception",
        committed_points: 15,
        completed_points: 12,
        committed_tasks: 4,
        completed_tasks: 3,
      },
    ],
    policy_notes: "Only completed sprints included",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(authContextModule, "useAuth").mockReturnValue({
      user: {
        id: "user-lead",
        email: "lead@taskflow.dev",
        full_name: "Scrum Lead",
        is_superuser: false,
        is_active: true,
        created_at: "2026-10-27T00:00:00Z",
      },
      isLoading: false,
      isAuthenticated: true,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshSession: vi.fn(),
      clearError: vi.fn(),
    });

    vi.spyOn(projectService, "getProject").mockResolvedValue(sampleProject);
    vi.spyOn(projectService, "getMembers").mockResolvedValue({
      items: sampleMembers,
      total: 1,
      page: 1,
      page_size: 100,
    });
    vi.spyOn(scrumService, "listSprints").mockResolvedValue({
      items: sampleSprints,
      total: 2,
    });
    vi.spyOn(scrumService, "getBacklog").mockResolvedValue(sampleBacklog);
    vi.spyOn(scrumService, "listSprintTasks").mockResolvedValue({
      items: sampleBacklog.items,
      total: 3,
      page: 1,
      page_size: 50,
    });
    vi.spyOn(scrumService, "getSprintSummary").mockResolvedValue({
      sprint_id: "sprint-1",
      sprint_name: "Sprint 1",
      project_id: "proj-1",
      status: "active",
      total_task_count: 4,
      completed_task_count: 2,
      incomplete_task_count: 2,
      remaining_task_count: 2,
      total_estimated_points: 16,
      completed_points: 8,
      remaining_points: 8,
      unestimated_task_count: 1,
      completion_percentage_tasks: 50,
      completion_percentage_points: 50,
    });
    vi.spyOn(scrumService, "getSprintBurndown").mockResolvedValue(sampleBurndown);
    vi.spyOn(scrumService, "getProjectVelocity").mockResolvedValue(sampleVelocity);
  });

  it("renders Scrum Workspace with project name and header actions", async () => {
    render(<ProjectScrumPage organizationId="org-1" projectId="proj-1" />);

    expect(await screen.findByText(/Scrum Engine • Scrum Workspace/i)).toBeInTheDocument();
    expect(screen.getByText(/Prefix Key: \[SCRUM\]/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /New Sprint/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /New Task/i })).toBeInTheDocument();
  });

  it("renders Product Backlog tab by default with metrics and tasks", async () => {
    render(<ProjectScrumPage organizationId="org-1" projectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByText("Setup OAuth2 flow")).toBeInTheDocument();
    });

    expect(screen.getByText("Database index tuning")).toBeInTheDocument();
    expect(screen.getByText("Write documentation")).toBeInTheDocument();

    // Check story point estimates
    expect(screen.getByText("5 pts")).toBeInTheDocument();
    expect(screen.getByText("8 pts")).toBeInTheDocument();

    // Check aggregated metrics in backlog
    expect(screen.getByText("13 pts")).toBeInTheDocument();
  });

  it("allows switching to All Sprints tab", async () => {
    const user = userEvent.setup();
    render(<ProjectScrumPage organizationId="org-1" projectId="proj-1" />);

    await screen.findByText(/Scrum Engine • Scrum Workspace/i);

    const sprintsTab = screen.getByRole("button", { name: /All Sprints/i });
    await user.click(sprintsTab);

    await waitFor(() => {
      expect(screen.getByText("Sprint 1 - In Progress")).toBeInTheDocument();
    });
    expect(screen.getByText("Sprint 2 - Next Iteration")).toBeInTheDocument();
  });

  it("allows switching to Reports & Velocity tab", async () => {
    const user = userEvent.setup();
    render(<ProjectScrumPage organizationId="org-1" projectId="proj-1" />);

    await screen.findByText(/Scrum Engine • Scrum Workspace/i);

    const reportsTab = screen.getByRole("button", { name: /Reports & Velocity/i });
    await user.click(reportsTab);

    await waitFor(() => {
      expect(screen.getByText(/Sprint Burndown Chart/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Historical Team Velocity/i)).toBeInTheDocument();
    expect(screen.getAllByText(/12 pts/i)[0]).toBeInTheDocument();
  });

  it("renders error state when project loading fails", async () => {
    vi.spyOn(projectService, "getProject").mockRejectedValueOnce(
      new Error("Project not found")
    );

    render(<ProjectScrumPage organizationId="org-1" projectId="proj-1" />);

    expect(
      await screen.findByText(/Network error while loading scrum workspace/i)
    ).toBeInTheDocument();
  });
});
