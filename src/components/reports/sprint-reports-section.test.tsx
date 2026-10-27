import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { SprintReportsSection } from "./sprint-reports-section";
import { scrumService } from "@/services/scrum-service";
import type {
  ProjectResponse,
  SprintResponse,
  SprintSummaryResponse,
  SprintBurndownResponse,
  ProjectVelocityResponse,
} from "@/services/generated/api-types";

describe("SprintReportsSection", () => {
  const sampleProject: ProjectResponse = {
    id: "proj-1",
    organization_id: "org-1",
    name: "Agile Project",
    key: "AGL",
    description: null,
    is_private: false,
    is_archived: false,
    owner_id: "u-1",
    created_at: "2026-10-01T00:00:00Z",
    updated_at: "2026-10-01T00:00:00Z",
  };

  const sampleSprints: SprintResponse[] = [
    {
      id: "sprint-1",
      project_id: "proj-1",
      name: "Sprint 1",
      goal: "Ship MVP",
      status: "active",
      start_date: "2026-10-15T00:00:00Z",
      end_date: "2026-10-29T00:00:00Z",
      total_tasks: 12,
      completed_tasks: 8,
      total_points: 30,
      completed_points: 20,
      created_at: "2026-10-10T00:00:00Z",
      updated_at: "2026-10-10T00:00:00Z",
    },
  ];

  const sampleSummary: SprintSummaryResponse = {
    sprint_id: "sprint-1",
    sprint_name: "Sprint 1",
    project_id: "proj-1",
    status: "active",
    start_date: "2026-10-15T00:00:00Z",
    end_date: "2026-10-29T00:00:00Z",
    completed_at: null,
    total_task_count: 12,
    completed_task_count: 8,
    incomplete_task_count: 4,
    remaining_task_count: 4,
    total_estimated_points: 30,
    completed_points: 20,
    remaining_points: 10,
    unestimated_task_count: 1,
    completion_percentage_tasks: 66.7,
    completion_percentage_points: 66.7,
  };

  const sampleBurndown: SprintBurndownResponse = {
    sprint_id: "sprint-1",
    sprint_name: "Sprint 1",
    start_date: "2026-10-15T00:00:00Z",
    end_date: "2026-10-29T00:00:00Z",
    status: "active",
    total_story_points: 30,
    total_tasks: 12,
    data_points: [
      {
        date: "2026-10-15",
        remaining_story_points: 30,
        ideal_story_points: 30,
        completed_story_points: 0,
        remaining_tasks: 12,
        ideal_tasks: 12,
        completed_tasks: 0,
        is_historical_reconstructed: false,
        data_available: true,
      },
      {
        date: "2026-10-16",
        remaining_story_points: 25,
        ideal_story_points: 27.5,
        completed_story_points: 5,
        remaining_tasks: 10,
        ideal_tasks: 11,
        completed_tasks: 2,
        is_historical_reconstructed: true,
        data_available: true,
      },
    ],
    metric_types: ["story_points", "task_count"],
    reconstruction_policy:
      "Reconstructed strictly from WorkItemActivity event logs",
  };

  const sampleVelocity: ProjectVelocityResponse = {
    project_id: "proj-1",
    completed_sprints_count: 1,
    average_velocity_points: 25,
    average_velocity_tasks: 8,
    sprints: [
      {
        sprint_id: "sprint-0",
        sprint_name: "Sprint 0",
        start_date: "2026-10-01T00:00:00Z",
        end_date: "2026-10-14T00:00:00Z",
        completed_at: "2026-10-14T18:00:00Z",
        committed_points: 30,
        completed_points: 25,
        committed_tasks: 10,
        completed_tasks: 8,
      },
    ],
    policy_notes:
      "Only fully completed sprints are included in velocity calculations.",
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders sprint summary, burndown, and velocity data", async () => {
    vi.spyOn(scrumService, "getSprintSummary").mockResolvedValue(sampleSummary);
    vi.spyOn(scrumService, "getSprintBurndown").mockResolvedValue(
      sampleBurndown
    );

    render(
      <SprintReportsSection
        project={sampleProject}
        sprints={sampleSprints}
        velocity={sampleVelocity}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Sprint Burndown Chart")).toBeInTheDocument();
    });

    expect(screen.getByText("Historical Team Velocity")).toBeInTheDocument();
    expect(screen.getByText("25 pts")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Reconstructed strictly from WorkItemActivity event logs"
      )
    ).toBeInTheDocument();
  });

  it("renders empty state when project has no sprints", () => {
    render(
      <SprintReportsSection
        project={sampleProject}
        sprints={[]}
        velocity={null}
      />
    );

    expect(
      screen.getByText("No Sprints Configured for This Project")
    ).toBeInTheDocument();
  });

  it("allows switching burndown metric between story points and tasks", async () => {
    vi.spyOn(scrumService, "getSprintSummary").mockResolvedValue(sampleSummary);
    vi.spyOn(scrumService, "getSprintBurndown").mockResolvedValue(
      sampleBurndown
    );

    render(
      <SprintReportsSection
        project={sampleProject}
        sprints={sampleSprints}
        velocity={sampleVelocity}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Story Points" })
      ).toBeInTheDocument();
    });

    const taskButton = screen.getByRole("button", { name: "Task Count" });
    fireEvent.click(taskButton);
    expect(taskButton).toHaveClass("bg-primary");
  });
});
