import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrganizationProjectsPage } from "./organization-projects-page";
import { projectService } from "@/services/project-service";
import { organizationService } from "@/services/organization-service";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  usePathname: () => "/en/organizations/org-1/projects",
}));

describe("OrganizationProjectsPage", () => {
  const sampleOrg = {
    id: "org-1",
    name: "Acme Corp",
    slug: "acme-corp",
    is_active: true,
    created_at: "2026-10-18T10:00:00Z",
    updated_at: "2026-10-18T10:00:00Z",
  };

  const sampleProjects = [
    {
      id: "proj-1",
      organization_id: "org-1",
      name: "Core Engine",
      key: "CORE",
      description: "Backend microservices",
      is_private: false,
      is_archived: false,
      owner_id: "u-1",
      created_at: "2026-10-18T10:00:00Z",
      updated_at: "2026-10-18T10:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders projects list belonging to organization", async () => {
    vi.spyOn(organizationService, "getMyOrganizations").mockResolvedValueOnce({
      items: [sampleOrg],
      total: 1,
      page: 1,
      page_size: 50,
    });
    vi.spyOn(projectService, "getProjects").mockResolvedValueOnce({
      items: sampleProjects,
      total: 1,
      page: 1,
      page_size: 50,
    });

    render(<OrganizationProjectsPage organizationId="org-1" />);

    await waitFor(() => {
      expect(screen.getByText("Core Engine")).toBeInTheDocument();
      expect(screen.getByText("CORE")).toBeInTheDocument();
      expect(screen.getByText("Backend microservices")).toBeInTheDocument();
    });
  });

  it("creates a new project via dialog", async () => {
    vi.spyOn(organizationService, "getMyOrganizations").mockResolvedValue({
      items: [sampleOrg],
      total: 1,
      page: 1,
      page_size: 50,
    });
    vi.spyOn(projectService, "getProjects").mockResolvedValue({
      items: sampleProjects,
      total: 1,
      page: 1,
      page_size: 50,
    });
    const createSpy = vi
      .spyOn(projectService, "createProject")
      .mockResolvedValueOnce({
        id: "proj-2",
        organization_id: "org-1",
        name: "Web Portal",
        key: "WEB",
        description: "Frontend app",
        is_private: false,
        is_archived: false,
        created_at: "2026-10-18T10:00:00Z",
        updated_at: "2026-10-18T10:00:00Z",
      });

    const user = userEvent.setup();
    render(<OrganizationProjectsPage organizationId="org-1" />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /new project/i })
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /new project/i }));

    const nameInput = screen.getByLabelText(/project name/i);
    await user.type(nameInput, "Web Portal");

    const keyInput = screen.getByLabelText(/issue key prefix/i);
    await user.clear(keyInput);
    await user.type(keyInput, "WEB");

    const submitButtons = screen.getAllByRole("button", {
      name: /create project/i,
    });
    await user.click(submitButtons[submitButtons.length - 1]);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        "org-1",
        expect.objectContaining({
          name: "Web Portal",
          key: "WEB",
        })
      );
    });
  });
});
