import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrganizationsPage } from "./organizations-page";
import { organizationService } from "@/services/organization-service";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  usePathname: () => "/en/organizations",
}));

describe("OrganizationsPage", () => {
  const sampleOrgs = [
    {
      id: "org-1",
      name: "Acme Corp",
      slug: "acme-corp",
      is_active: true,
      created_at: "2026-10-18T10:00:00Z",
      updated_at: "2026-10-18T10:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders user organizations list from backend", async () => {
    vi.spyOn(organizationService, "getMyOrganizations").mockResolvedValueOnce({
      items: sampleOrgs,
      total: 1,
      page: 1,
      page_size: 50,
    });

    render(<OrganizationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      expect(screen.getByText("acme-corp")).toBeInTheDocument();
    });
  });

  it("shows empty state when user belongs to no organizations", async () => {
    vi.spyOn(organizationService, "getMyOrganizations").mockResolvedValueOnce({
      items: [],
      total: 0,
      page: 1,
      page_size: 50,
    });

    render(<OrganizationsPage />);

    await waitFor(() => {
      expect(screen.getByText("No organizations found")).toBeInTheDocument();
    });
  });

  it("creates a new organization via dialog form", async () => {
    vi.spyOn(organizationService, "getMyOrganizations").mockResolvedValue({
      items: sampleOrgs,
      total: 1,
      page: 1,
      page_size: 50,
    });
    const createSpy = vi
      .spyOn(organizationService, "createOrganization")
      .mockResolvedValueOnce({
        id: "org-new",
        name: "Engineering Corp",
        slug: "engineering-corp",
        is_active: true,
        created_at: "2026-10-18T10:00:00Z",
        updated_at: "2026-10-18T10:00:00Z",
      });

    const user = userEvent.setup();
    render(<OrganizationsPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /new organization/i })
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /new organization/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    const nameInput = screen.getByLabelText(/organization name/i);
    await user.type(nameInput, "Engineering Corp");

    const submitButtons = screen.getAllByRole("button", {
      name: /create organization/i,
    });
    await user.click(submitButtons[submitButtons.length - 1]);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith({
        name: "Engineering Corp",
        slug: "engineering-corp",
      });
    });
  });
});
