import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AcceptInvitationPage } from "./accept-invitation-page";
import { organizationService } from "@/services/organization-service";
import { ApiClientError } from "@/services/api-client";
import * as authContextModule from "@/modules/auth/context/auth-context";

const pushMock = vi.fn();
let mockTokenParam: string | null = null;

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  usePathname: () => "/en/invitations/accept",
  useSearchParams: () => ({
    get: (param: string) => (param === "token" ? mockTokenParam : null),
  }),
}));

describe("AcceptInvitationPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTokenParam = null;
    vi.spyOn(authContextModule, "useAuth").mockReturnValue({
      user: {
        id: "u-invited",
        email: "invitee@example.com",
        name: "New Invitee",
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

  it("pre-fills invitation token from search params", () => {
    mockTokenParam = "sample-token-abc";
    render(<AcceptInvitationPage />);

    expect(
      screen.getByText("Accept Workspace Invitation")
    ).toBeInTheDocument();
    const tokenInput = screen.getByLabelText(/invitation token/i) as HTMLInputElement;
    expect(tokenInput.value).toBe("sample-token-abc");
  });

  it("accepts valid token and redirects to organization", async () => {
    const acceptSpy = vi
      .spyOn(organizationService, "acceptInvitation")
      .mockResolvedValueOnce({
        id: "mem-new",
        organization_id: "org-accepted-123",
        user_id: "u-invited",
        role: "member",
        is_active: true,
        created_at: "2026-10-25T10:00:00Z",
        updated_at: "2026-10-25T10:00:00Z",
      });

    const user = userEvent.setup();
    render(<AcceptInvitationPage />);

    const tokenInput = screen.getByLabelText(/invitation token/i);
    await user.type(tokenInput, "token-manual-123");

    const submitBtn = screen.getByRole("button", { name: /accept & join/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(acceptSpy).toHaveBeenCalledWith("token-manual-123");
      expect(pushMock).toHaveBeenCalledWith(
        "/en/organizations/org-accepted-123"
      );
    });
  });

  it("displays error message if token is invalid or expired", async () => {
    vi.spyOn(organizationService, "acceptInvitation").mockRejectedValueOnce(
      new ApiClientError(400, {
        error: {
          code: "INVITATION_EXPIRED",
          message: "The invitation token has expired or is invalid.",
          request_id: "req-123",
        },
      })
    );

    const user = userEvent.setup();
    render(<AcceptInvitationPage />);

    const tokenInput = screen.getByLabelText(/invitation token/i);
    await user.type(tokenInput, "invalid-token");

    const submitBtn = screen.getByRole("button", { name: /accept & join/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText("The invitation token has expired or is invalid.")
      ).toBeInTheDocument();
    });
  });
});
