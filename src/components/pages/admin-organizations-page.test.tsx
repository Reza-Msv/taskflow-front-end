import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminOrganizationsPage } from "./admin-organizations-page";
import { adminService } from "@/services/admin-service";

describe("AdminOrganizationsPage", () => {
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

  it("renders organizations list from backend", async () => {
    vi.spyOn(adminService, "getOrganizations").mockResolvedValueOnce({
      items: sampleOrgs,
      total: 1,
      page: 1,
      page_size: 10,
    });

    render(<AdminOrganizationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      expect(screen.getByText("acme-corp")).toBeInTheDocument();
    });
  });

  it("opens create organization dialog and submits form", async () => {
    vi.spyOn(adminService, "getOrganizations").mockResolvedValue({
      items: sampleOrgs,
      total: 1,
      page: 1,
      page_size: 10,
    });
    const createSpy = vi
      .spyOn(adminService, "createOrganization")
      .mockResolvedValueOnce({
        id: "org-2",
        name: "Beta Inc",
        slug: "beta-inc",
        is_active: true,
        created_at: "2026-10-18T10:00:00Z",
        updated_at: "2026-10-18T10:00:00Z",
      });

    const user = userEvent.setup();
    render(<AdminOrganizationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Create Organization")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Create Organization"));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText("Acme Corp"), "Beta Inc");

    const submitButtons = screen.getAllByRole("button", {
      name: "Create Organization",
    });
    // The dialog submit button
    await user.click(submitButtons[submitButtons.length - 1]);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Beta Inc",
          slug: "beta-inc",
        })
      );
    });
  });
});
