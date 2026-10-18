import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppSidebar } from "./app-sidebar";
import * as authContextModule from "@/modules/auth/context/auth-context";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/admin/overview",
}));

describe("AppSidebar Admin Navigation", () => {
  it("does not render admin navigation items for regular users", () => {
    vi.spyOn(authContextModule, "useAuth").mockReturnValue({
      user: {
        id: "u-1",
        email: "user@test.com",
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

    render(<AppSidebar />);

    expect(screen.queryByText("Administration")).not.toBeInTheDocument();
    expect(screen.queryByText("Overview")).not.toBeInTheDocument();
  });

  it("renders admin navigation items with active state for superusers", () => {
    vi.spyOn(authContextModule, "useAuth").mockReturnValue({
      user: {
        id: "u-admin",
        email: "admin@test.com",
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

    render(<AppSidebar />);

    expect(screen.getByText("Administration")).toBeInTheDocument();
    const overviewLink = screen.getByRole("link", { name: /overview/i });
    expect(overviewLink).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /users/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /organizations/i })
    ).toBeInTheDocument();

    // Verify active class on current path /admin/overview
    expect(overviewLink).toHaveClass("bg-sidebar-active");
  });
});
