import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminGuard } from "./admin-guard";
import * as authContextModule from "@/modules/auth/context/auth-context";

const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: vi.fn(),
  }),
  usePathname: () => "/en/admin/overview",
}));

describe("AdminGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading skeleton while verifying auth", () => {
    vi.spyOn(authContextModule, "useAuth").mockReturnValue({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshSession: vi.fn().mockImplementation(() => new Promise(() => {})),
      clearError: vi.fn(),
    });

    render(
      <AdminGuard>
        <div>Protected Admin Content</div>
      </AdminGuard>
    );

    expect(
      screen.getByRole("status", {
        name: /Verifying administrative permissions/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Protected Admin Content")
    ).not.toBeInTheDocument();
  });

  it("redirects unauthenticated user to login", async () => {
    vi.spyOn(authContextModule, "useAuth").mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshSession: vi.fn().mockResolvedValue(null),
      clearError: vi.fn(),
    });

    render(
      <AdminGuard>
        <div>Protected Admin Content</div>
      </AdminGuard>
    );

    // Wait for the verification promise
    await vi.waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        "/en/login?redirect=%2Fen%2Fadmin%2Foverview"
      );
    });
    expect(
      screen.queryByText("Protected Admin Content")
    ).not.toBeInTheDocument();
  });

  it("shows forbidden state for authenticated non-admin user", async () => {
    const regularUser = {
      id: "u-1",
      email: "user@example.com",
      full_name: "Regular User",
      is_active: true,
      is_superuser: false,
    };

    vi.spyOn(authContextModule, "useAuth").mockReturnValue({
      user: regularUser,
      isLoading: false,
      isAuthenticated: true,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshSession: vi.fn().mockResolvedValue(regularUser),
      clearError: vi.fn(),
    });

    render(
      <AdminGuard>
        <div>Protected Admin Content</div>
      </AdminGuard>
    );

    await vi.waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Access Denied")).toBeInTheDocument();
    });

    expect(
      screen.queryByText("Protected Admin Content")
    ).not.toBeInTheDocument();
  });

  it("renders children for verified superuser", async () => {
    const superUser = {
      id: "u-admin",
      email: "admin@example.com",
      full_name: "Admin User",
      is_active: true,
      is_superuser: true,
    };

    vi.spyOn(authContextModule, "useAuth").mockReturnValue({
      user: superUser,
      isLoading: false,
      isAuthenticated: true,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshSession: vi.fn().mockResolvedValue(superUser),
      clearError: vi.fn(),
    });

    render(
      <AdminGuard>
        <div>Protected Admin Content</div>
      </AdminGuard>
    );

    await vi.waitFor(() => {
      expect(screen.getByText("Protected Admin Content")).toBeInTheDocument();
    });
  });
});
