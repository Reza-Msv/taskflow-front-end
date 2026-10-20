import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectDetailsPage } from "./project-details-page";
import { projectService } from "@/services/project-service";
import { organizationService } from "@/services/organization-service";
import * as authContextModule from "@/modules/auth/context/auth-context";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  usePathname: () => "/en/organizations/org-1/projects/proj-1",
}));

describe("ProjectDetailsPage", () => {
  const sampleProject = {
    id: "proj-1",
    organization_id: "org-1",
    name: "Core Engine",
    key: "CORE",
    description: "Backend microservices",
    is_private: false,
    is_archived: false,
    owner_id: "u-lead",
    created_at: "2026-10-18T10:00:00Z",
    updated_at: "2026-10-18T10:00:00Z",
  };

  const sampleProjectMembers = [
    {
      id: "pm-1",
      project_id: "proj-1",
      user_id: "u-lead",
      role: "admin",
      created_at: "2026-10-18T10:00:00Z",
      updated_at: "2026-10-18T10:00:00Z",
      user: {
        id: "u-lead",
        email: "lead@example.com",
        full_name: "Tech Lead",
        is_active: true,
        is_superuser: false,
        created_at: "2026-10-18T10:00:00Z",
        updated_at: "2026-10-18T10:00:00Z",
      },
    },
  ];

  const sampleOrgMembers = [
    {
      id: "om-1",
      organization_id: "org-1",
      user_id: "u-lead",
      role: "admin",
      is_active: true,
      created_at: "2026-10-18T10:00:00Z",
      updated_at: "2026-10-18T10:00:00Z",
      user: {
        id: "u-lead",
        email: "lead@example.com",
        full_name: "Tech Lead",
        is_active: true,
        is_superuser: false,
        created_at: "2026-10-18T10:00:00Z",
        updated_at: "2026-10-18T10:00:00Z",
      },
    },
    {
      id: "om-2",
      organization_id: "org-1",
      user_id: "u-eligible",
      role: "member",
      is_active: true,
      created_at: "2026-10-18T10:00:00Z",
      updated_at: "2026-10-18T10:00:00Z",
      user: {
        id: "u-eligible",
        email: "dev@example.com",
        full_name: "Dev Colleague",
        is_active: true,
        is_superuser: false,
        created_at: "2026-10-18T10:00:00Z",
        updated_at: "2026-10-18T10:00:00Z",
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(authContextModule, "useAuth").mockReturnValue({
      user: {
        id: "u-lead",
        email: "lead@example.com",
        name: "Tech Lead",
        is_superuser: false,
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
  });

  it("renders project details and member list", async () => {
    vi.spyOn(projectService, "getProject").mockResolvedValueOnce(sampleProject);
    vi.spyOn(projectService, "getMembers").mockResolvedValueOnce({
      items: sampleProjectMembers,
      total: 1,
    });
    vi.spyOn(organizationService, "getMembers").mockResolvedValueOnce({
      items: sampleOrgMembers,
      total: 2,
    });

    render(<ProjectDetailsPage organizationId="org-1" projectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByText("Core Engine")).toBeInTheDocument();
      expect(screen.getByText("Tech Lead")).toBeInTheDocument();
    });
  });

  it("adds eligible organization member to project", async () => {
    vi.spyOn(projectService, "getProject").mockResolvedValue(sampleProject);
    vi.spyOn(projectService, "getMembers").mockResolvedValue({
      items: sampleProjectMembers,
      total: 1,
    });
    vi.spyOn(organizationService, "getMembers").mockResolvedValue({
      items: sampleOrgMembers,
      total: 2,
    });
    const addSpy = vi.spyOn(projectService, "addMember").mockResolvedValueOnce({
      id: "pm-2",
      project_id: "proj-1",
      user_id: "u-eligible",
      role: "viewer",
      created_at: "2026-10-18T10:00:00Z",
      updated_at: "2026-10-18T10:00:00Z",
    });

    const user = userEvent.setup();
    render(<ProjectDetailsPage organizationId="org-1" projectId="proj-1" />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /add member/i })
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /add member/i }));

    const selectMember = screen.getByLabelText(/organization member/i);
    await user.selectOptions(selectMember, "u-eligible");

    const selectRole = screen.getByLabelText(/project role/i);
    await user.selectOptions(selectRole, "viewer");

    await user.click(screen.getByRole("button", { name: /add to project/i }));

    await waitFor(() => {
      expect(addSpy).toHaveBeenCalledWith("org-1", "proj-1", {
        user_id: "u-eligible",
        role: "viewer",
      });
    });
  });
});
