import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WorkspaceTeamsView } from "./workspace-teams-view";
import type {
  OrganizationResponse,
  OrganizationMembershipResponse,
  ProjectResponse,
} from "@/services/generated/api-types";

describe("WorkspaceTeamsView", () => {
  const sampleOrg: OrganizationResponse = {
    id: "org-200",
    name: "Platform Workspace",
    slug: "platform-ws",
    is_active: true,
    created_at: "2026-10-10T10:00:00Z",
    updated_at: "2026-10-10T10:00:00Z",
  };

  const sampleMembers: OrganizationMembershipResponse[] = [
    {
      id: "m-1",
      organization_id: "org-200",
      user_id: "u-1",
      role: "owner",
      is_active: true,
      created_at: "2026-10-10T10:00:00Z",
      updated_at: "2026-10-10T10:00:00Z",
    },
    {
      id: "m-2",
      organization_id: "org-200",
      user_id: "u-2",
      role: "admin",
      is_active: true,
      created_at: "2026-10-10T10:00:00Z",
      updated_at: "2026-10-10T10:00:00Z",
    },
    {
      id: "m-3",
      organization_id: "org-200",
      user_id: "u-3",
      role: "member",
      is_active: true,
      created_at: "2026-10-10T10:00:00Z",
      updated_at: "2026-10-10T10:00:00Z",
    },
    {
      id: "m-4",
      organization_id: "org-200",
      user_id: "u-4",
      role: "viewer",
      is_active: true,
      created_at: "2026-10-10T10:00:00Z",
      updated_at: "2026-10-10T10:00:00Z",
    },
  ];

  const sampleProjects: ProjectResponse[] = [
    {
      id: "proj-10",
      organization_id: "org-200",
      name: "Frontend Application",
      key: "FRONT",
      description: "Next.js web client",
      is_private: false,
      is_archived: false,
      owner_id: "u-1",
      created_at: "2026-10-11T10:00:00Z",
      updated_at: "2026-10-11T10:00:00Z",
    },
    {
      id: "proj-20",
      organization_id: "org-200",
      name: "Core API",
      key: "CORE",
      description: "FastAPI services",
      is_private: true,
      is_archived: false,
      owner_id: "u-2",
      created_at: "2026-10-12T10:00:00Z",
      updated_at: "2026-10-12T10:00:00Z",
    },
  ];

  it("renders team metrics and architectural overview", () => {
    render(
      <WorkspaceTeamsView
        organization={sampleOrg}
        members={sampleMembers}
        projects={sampleProjects}
        currentUserRole="owner"
      />
    );

    // Architectural notice
    expect(
      screen.getByText("Workspace & Cross-Functional Team Architecture")
    ).toBeInTheDocument();

    // Metrics
    expect(screen.getByText("Total Team Members")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument(); // total members
    expect(screen.getByText("Active Project Teams")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument(); // 2 active projects
    expect(screen.getByText("Core Contributors")).toBeInTheDocument();
    expect(screen.getByText("Guests & Viewers")).toBeInTheDocument();
  });

  it("renders project team rosters table with project keys and details", () => {
    render(
      <WorkspaceTeamsView
        organization={sampleOrg}
        members={sampleMembers}
        projects={sampleProjects}
        currentUserRole="owner"
      />
    );

    expect(screen.getByText("Project Team Rosters")).toBeInTheDocument();
    expect(screen.getByText("FRONT")).toBeInTheDocument();
    expect(screen.getByText("Frontend Application")).toBeInTheDocument();
    expect(screen.getByText("CORE")).toBeInTheDocument();
    expect(screen.getByText("Core API")).toBeInTheDocument();
    expect(screen.getByText("Private Team")).toBeInTheDocument();
  });

  it("renders empty state message when no projects exist", () => {
    render(
      <WorkspaceTeamsView
        organization={sampleOrg}
        members={sampleMembers}
        projects={[]}
        currentUserRole="member"
      />
    );

    expect(
      screen.getByText(/No projects currently exist in this workspace/i)
    ).toBeInTheDocument();
  });
});
