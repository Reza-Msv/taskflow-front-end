import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppHeader } from "./app-header";
import { AuthProvider } from "@/modules/auth/context/auth-context";
import { authService } from "@/modules/auth/services/auth-service";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  usePathname: () => "/en/projects",
}));

describe("AppHeader Auth Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Sign In button when unauthenticated", async () => {
    vi.spyOn(authService, "getCurrentUser").mockResolvedValueOnce(null);

    render(
      <AuthProvider>
        <AppHeader title="Projects" />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Sign In" })).toBeInTheDocument();
    });
  });

  it("renders user avatar and performs logout when authenticated", async () => {
    vi.spyOn(authService, "getCurrentUser").mockResolvedValueOnce({
      id: "u-500",
      email: "engineer@taskflow.dev",
      name: "Morgan Lee",
    });
    vi.spyOn(authService, "logout").mockResolvedValueOnce(undefined);

    const user = userEvent.setup();

    render(
      <AuthProvider>
        <AppHeader title="Projects" />
      </AuthProvider>
    );

    // Wait for session to resolve
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Open user menu" })
      ).toBeInTheDocument();
    });

    // Open dropdown menu
    await user.click(screen.getByRole("button", { name: "Open user menu" }));

    // Verify user details
    expect(screen.getByText("Morgan Lee")).toBeInTheDocument();
    expect(screen.getByText("engineer@taskflow.dev")).toBeInTheDocument();

    // Click Log Out
    const logoutItem = screen.getByText("Log Out");
    await user.click(logoutItem);

    await waitFor(() => {
      expect(authService.logout).toHaveBeenCalled();
      expect(pushMock).toHaveBeenCalledWith("/en/login");
    });
  });
});
