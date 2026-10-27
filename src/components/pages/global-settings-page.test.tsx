import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { GlobalSettingsPage } from "./global-settings-page";
import { organizationService } from "@/services/organization-service";
import * as authContextModule from "@/modules/auth/context/auth-context";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/settings",
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("GlobalSettingsPage", () => {
  const sampleOrgs = [
    {
      id: "org-1",
      name: "Acme HQ",
      slug: "acme-hq",
      is_active: true,
      created_at: "2026-10-10T10:00:00Z",
      updated_at: "2026-10-10T10:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(authContextModule, "useAuth").mockReturnValue({
      user: {
        id: "u-1",
        email: "alice@acme.com",
        name: "Alice Engineer",
        is_superuser: true,
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

  it("renders user profile information and workspaces list", async () => {
    vi.spyOn(organizationService, "getMyOrganizations").mockResolvedValueOnce({
      items: sampleOrgs,
      total: 1,
      page: 1,
      page_size: 50,
    });

    render(<GlobalSettingsPage />);

    expect(
      screen.getByText("Settings & Workspace Preferences")
    ).toBeInTheDocument();
    expect(screen.getByText("Alice Engineer")).toBeInTheDocument();
    expect(screen.getByText("alice@acme.com")).toBeInTheDocument();
    expect(screen.getByText("Platform Superuser")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Acme HQ")).toBeInTheDocument();
      expect(screen.getByText("acme-hq")).toBeInTheDocument();
    });
  });

  it("renders empty state when user belongs to no workspaces", async () => {
    vi.spyOn(organizationService, "getMyOrganizations").mockResolvedValueOnce({
      items: [],
      total: 0,
      page: 1,
      page_size: 50,
    });

    render(<GlobalSettingsPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/You do not belong to any workspaces yet/i)
      ).toBeInTheDocument();
    });
  });
});
