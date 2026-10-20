import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppSidebar } from "./app-sidebar";
import * as authContextModule from "@/modules/auth/context/auth-context";

import { usePathname } from "next/navigation";

let mockCurrentPathname = "/en/admin/overview";

vi.mock("next/navigation", () => ({
  usePathname: () => mockCurrentPathname,
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
    expect(overviewLink).toHaveAttribute("href", "/en/admin/overview");
    expect(screen.getByRole("link", { name: /users/i })).toHaveAttribute("href", "/en/admin/users");
    const orgLinks = screen.getAllByRole("link", { name: /organizations/i });
    expect(orgLinks.length).toBeGreaterThanOrEqual(1);

    const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
    expect(dashboardLink).toBeInTheDocument();
    expect(dashboardLink).toHaveAttribute("href", "/en/dashboard");

    // Verify active class on current path /admin/overview
    expect(overviewLink).toHaveClass("bg-sidebar-active");
  });

  it("activates only the Kanban Board link and not the Projects link when on /en/projects/default/board", () => {
    mockCurrentPathname = "/en/projects/default/board";

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

    const kanbanLink = screen.getByRole("link", { name: /kanban board/i });
    const projectsLink = screen.getByRole("link", { name: /^projects$/i });

    expect(kanbanLink).toHaveClass("bg-sidebar-active");
    expect(projectsLink).not.toHaveClass("bg-sidebar-active");
  });

  it("renders My Tasks navigation link pointing to /en/my-tasks", () => {
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

    const myTasksLink = screen.getByRole("link", { name: /my tasks/i });
    expect(myTasksLink).toBeInTheDocument();
    expect(myTasksLink).toHaveAttribute("href", "/en/my-tasks");
  });
});
