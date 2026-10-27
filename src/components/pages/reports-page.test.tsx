import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReportsPage } from "./reports-page";
import { projectService } from "@/services/project-service";
import { organizationService } from "@/services/organization-service";
import { reportsService } from "@/services/reports-service";
import { ApiClientError } from "@/services/api-client";
import type { ProjectResponse } from "@/services/generated/api-types";
import type { ProjectReportsData } from "@/services/reports-service";

const { routerMock } = vi.hoisted(() => {
  const push = vi.fn();
  const replace = vi.fn();
  return {
    routerMock: {
      push,
      replace,
    },
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  usePathname: () => "/en/reports",
  useSearchParams: () => new URLSearchParams(),
}));

describe("ReportsPage", () => {
  const sampleProject: ProjectResponse = {
    id: "p-1",
    organization_id: "org-1",
    name: "Analytics Core",
    key: "ANA",
    description: "Core analytics engine",
    is_private: false,
    is_archived: false,
    owner_id: "u-1",
    created_at: "2026-10-01T00:00:00Z",
    updated_at: "2026-10-01T00:00:00Z",
  };

  const sampleReportsData: ProjectReportsData = {
    project: sampleProject,
    members: [],
    tasks: [],
    sprints: [],
    velocity: null,
    metrics: {
      totalTasks: 20,
      completedTasks: 10,
      openTasks: 5,
      inProgressTasks: 5,
      overdueTasks: 2,
      unassignedTasks: 1,
      completionPercentage: 50,
    },
    trends: [
      {
        key: "2026-10-25",
        label: "Oct 25",
        timestamp: 1792886400000,
        created: 5,
        completed: 2,
        cumulativeCompleted: 2,
      },
    ],
    workload: {
      members: [],
      unassignedTasks: 1,
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders page header and reports overview cards successfully", async () => {
    vi.spyOn(organizationService, "getMyOrganizations").mockResolvedValue({
      items: [
        {
          id: "org-1",
          name: "Org 1",
          slug: "org-1",
          is_active: true,
          created_at: "",
          updated_at: "",
        },
      ],
      total: 1,
      page: 1,
      page_size: 1,
    });
    vi.spyOn(projectService, "getProjects").mockResolvedValue({
      items: [sampleProject],
      total: 1,
      page: 1,
      page_size: 100,
    });
    vi.spyOn(reportsService, "getProjectReportsData").mockResolvedValue(
      sampleReportsData
    );

    render(<ReportsPage organizationId="org-1" projectId="p-1" />);

    expect(screen.getByText("Reports & Analytics")).toBeInTheDocument();

    await waitFor(
      () => {
        expect(screen.getByText("Total Tasks")).toBeInTheDocument();
        expect(screen.getByText("50%")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("handles permission denied error (403) gracefully", async () => {
    vi.spyOn(organizationService, "getMyOrganizations").mockResolvedValue({
      items: [
        {
          id: "org-1",
          name: "Org 1",
          slug: "org-1",
          is_active: true,
          created_at: "",
          updated_at: "",
        },
      ],
      total: 1,
      page: 1,
      page_size: 1,
    });
    vi.spyOn(projectService, "getProjects").mockResolvedValue({
      items: [sampleProject],
      total: 1,
      page: 1,
      page_size: 100,
    });
    vi.spyOn(reportsService, "getProjectReportsData").mockRejectedValue(
      new ApiClientError(403, {
        error: {
          code: "FORBIDDEN",
          message: "Access denied",
          request_id: "req-1",
        },
      })
    );

    render(<ReportsPage organizationId="org-1" projectId="p-1" />);

    await waitFor(() => {
      expect(screen.getByText("Access Denied")).toBeInTheDocument();
    });
  });

  it("handles empty project list cleanly", async () => {
    vi.spyOn(organizationService, "getMyOrganizations").mockResolvedValue({
      items: [
        {
          id: "org-1",
          name: "Org 1",
          slug: "org-1",
          is_active: true,
          created_at: "",
          updated_at: "",
        },
      ],
      total: 1,
      page: 1,
      page_size: 1,
    });
    vi.spyOn(projectService, "getProjects").mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      page_size: 100,
    });

    render(<ReportsPage organizationId="org-1" />);

    await waitFor(() => {
      expect(screen.getByText("No Projects Available")).toBeInTheDocument();
    });
  });

  it("allows switching between report tabs", async () => {
    const user = userEvent.setup();
    vi.spyOn(organizationService, "getMyOrganizations").mockResolvedValue({
      items: [
        {
          id: "org-1",
          name: "Org 1",
          slug: "org-1",
          is_active: true,
          created_at: "",
          updated_at: "",
        },
      ],
      total: 1,
      page: 1,
      page_size: 1,
    });
    vi.spyOn(projectService, "getProjects").mockResolvedValue({
      items: [sampleProject],
      total: 1,
      page: 1,
      page_size: 100,
    });
    vi.spyOn(reportsService, "getProjectReportsData").mockResolvedValue(
      sampleReportsData
    );

    render(<ReportsPage organizationId="org-1" projectId="p-1" />);

    await waitFor(() => {
      expect(screen.getByText("Overview & Trends")).toBeInTheDocument();
    });

    // Switch to Team Workload tab
    const workloadTab = screen.getByRole("tab", { name: /team workload/i });
    await user.click(workloadTab);

    await waitFor(() => {
      expect(screen.getByTestId("team-workload-table")).toBeInTheDocument();
    });

    // Switch to Sprint Reports tab
    const sprintsTab = screen.getByRole("tab", { name: /sprint reports/i });
    await user.click(sprintsTab);

    await waitFor(() => {
      expect(screen.getByTestId("sprint-reports-empty")).toBeInTheDocument();
    });
  });
});
