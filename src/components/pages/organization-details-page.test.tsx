import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrganizationDetailsPage } from "./organization-details-page";
import { organizationService } from "@/services/organization-service";
import * as authContextModule from "@/modules/auth/context/auth-context";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe("OrganizationDetailsPage", () => {
  const sampleOrg = {
    id: "org-123",
    name: "Acme Corp",
    slug: "acme-corp",
    is_active: true,
    created_at: "2026-10-18T10:00:00Z",
    updated_at: "2026-10-18T10:00:00Z",
  };

  const sampleMembers = [
    {
      id: "m-1",
      organization_id: "org-123",
      user_id: "u-owner",
      role: "owner",
      is_active: true,
      created_at: "2026-10-18T10:00:00Z",
      updated_at: "2026-10-18T10:00:00Z",
      user: {
        id: "u-owner",
        email: "owner@acme.com",
        full_name: "Alice Owner",
        is_active: true,
        is_superuser: false,
        created_at: "2026-10-18T10:00:00Z",
        updated_at: "2026-10-18T10:00:00Z",
      },
    },
    {
      id: "m-2",
      organization_id: "org-123",
      user_id: "u-member",
      role: "member",
      is_active: true,
      created_at: "2026-10-18T10:00:00Z",
      updated_at: "2026-10-18T10:00:00Z",
      user: {
        id: "u-member",
        email: "bob@acme.com",
        full_name: "Bob Dev",
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

  it("renders organization details and member list", async () => {
    vi.spyOn(organizationService, "getOrganization").mockResolvedValueOnce(
      sampleOrg
    );
    vi.spyOn(organizationService, "getMembers").mockResolvedValueOnce({
      items: sampleMembers,
      total: 2,
    });
    vi.spyOn(organizationService, "getInvitations").mockResolvedValueOnce({
      items: [],
      total: 0,
    });

    render(<OrganizationDetailsPage organizationId="org-123" />);

    await waitFor(() => {
      expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      expect(screen.getByText("Alice Owner")).toBeInTheDocument();
      expect(screen.getByText("Bob Dev")).toBeInTheDocument();
    });
  });

  it("allows inviting a new member via email", async () => {
    vi.spyOn(organizationService, "getOrganization").mockResolvedValue(
      sampleOrg
    );
    vi.spyOn(organizationService, "getMembers").mockResolvedValue({
      items: sampleMembers,
      total: 2,
    });
    vi.spyOn(organizationService, "getInvitations").mockResolvedValue({
      items: [],
      total: 0,
    });
    const inviteSpy = vi
      .spyOn(organizationService, "createInvitation")
      .mockResolvedValueOnce({
        id: "inv-1",
        organization_id: "org-123",
        email: "newmember@acme.com",
        role: "member",
        token: "secret_token_123",
        expires_at: "2026-11-01T00:00:00Z",
        created_at: "2026-10-18T10:00:00Z",
        updated_at: "2026-10-18T10:00:00Z",
      });

    const user = userEvent.setup();
    render(<OrganizationDetailsPage organizationId="org-123" />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /invite by email/i })
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /invite by email/i }));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/user email/i) as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: "newmember@acme.com" } });

    const form = emailInput.closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(inviteSpy).toHaveBeenCalledWith("org-123", {
        email: "newmember@acme.com",
        role: "member",
      });
      expect(screen.getByDisplayValue("secret_token_123")).toBeInTheDocument();
    });
  });
});
