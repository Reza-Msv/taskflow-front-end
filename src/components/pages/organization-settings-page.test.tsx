import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { OrganizationSettingsPage } from "./organization-settings-page";
import { organizationService } from "@/services/organization-service";
import * as authContextModule from "@/modules/auth/context/auth-context";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  usePathname: () => "/en/organizations/org-test/settings",
}));

describe("OrganizationSettingsPage", () => {
  const sampleOrg = {
    id: "org-test",
    name: "Acme Cloud",
    slug: "acme-cloud",
    is_active: true,
    created_at: "2026-10-10T10:00:00Z",
    updated_at: "2026-10-10T10:00:00Z",
  };

  const sampleMembers = [
    {
      id: "mem-1",
      organization_id: "org-test",
      user_id: "u-owner",
      role: "owner",
      is_active: true,
      created_at: "2026-10-10T10:00:00Z",
      updated_at: "2026-10-10T10:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(authContextModule, "useAuth").mockReturnValue({
      user: {
        id: "u-owner",
        email: "owner@acme.com",
        name: "Alice Owner",
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

  it("loads and displays settings page with organization name and breadcrumb", async () => {
    vi.spyOn(organizationService, "getOrganization").mockResolvedValueOnce(
      sampleOrg
    );
    vi.spyOn(organizationService, "getMembers").mockResolvedValueOnce({
      items: sampleMembers,
      total: 1,
    });

    render(<OrganizationSettingsPage organizationId="org-test" />);

    await waitFor(() => {
      expect(screen.getByText("Settings: Acme Cloud")).toBeInTheDocument();
      expect(screen.getByText("Back to Acme Cloud")).toBeInTheDocument();
      expect(screen.getByLabelText(/workspace display name/i)).toHaveValue(
        "Acme Cloud"
      );
    });
  });

  it("handles loading error gracefully with retry button", async () => {
    vi.spyOn(organizationService, "getOrganization").mockRejectedValueOnce(
      new Error("Server unreachable")
    );
    vi.spyOn(organizationService, "getMembers").mockResolvedValueOnce({
      items: [],
      total: 0,
    });

    render(<OrganizationSettingsPage organizationId="org-test" />);

    await waitFor(() => {
      expect(
        screen.getByText(/network error while loading workspace settings/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /try again/i })
      ).toBeInTheDocument();
    });
  });
});
