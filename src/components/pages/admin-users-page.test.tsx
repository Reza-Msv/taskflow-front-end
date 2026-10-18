import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminUsersPage } from "./admin-users-page";
import { adminService } from "@/services/admin-service";
import * as authContextModule from "@/modules/auth/context/auth-context";

describe("AdminUsersPage", () => {
  const currentAdmin = {
    id: "admin-1",
    email: "admin@example.com",
    full_name: "Admin Boss",
    is_active: true,
    is_superuser: true,
  };

  const sampleUsers = [
    {
      id: "admin-1",
      email: "admin@example.com",
      full_name: "Admin Boss",
      is_active: true,
      is_superuser: true,
      created_at: "2026-10-18T10:00:00Z",
      updated_at: "2026-10-18T10:00:00Z",
    },
    {
      id: "user-2",
      email: "alice@example.com",
      full_name: "Alice Smith",
      is_active: true,
      is_superuser: false,
      created_at: "2026-10-18T11:00:00Z",
      updated_at: "2026-10-18T11:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(authContextModule, "useAuth").mockReturnValue({
      user: currentAdmin,
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

  it("renders user table with data from backend", async () => {
    vi.spyOn(adminService, "getUsers").mockResolvedValueOnce({
      items: sampleUsers,
      total: 2,
      page: 1,
      page_size: 10,
    });

    render(<AdminUsersPage />);

    await waitFor(() => {
      expect(screen.getByText("Alice Smith")).toBeInTheDocument();
      expect(screen.getByText("alice@example.com")).toBeInTheDocument();
      expect(screen.getByText("Admin Boss")).toBeInTheDocument();
    });
  });

  it("handles search and status filtering", async () => {
    const getUsersSpy = vi.spyOn(adminService, "getUsers").mockResolvedValue({
      items: [sampleUsers[1]],
      total: 1,
      page: 1,
      page_size: 10,
    });

    const user = userEvent.setup();
    render(<AdminUsersPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search users/i)).toBeInTheDocument();
    });

    // Type search
    await user.type(screen.getByPlaceholderText(/search users/i), "alice");

    await waitFor(() => {
      expect(getUsersSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "alice",
        })
      );
    });

    // Click Inactive filter
    await user.click(screen.getByRole("button", { name: "Inactive" }));

    await waitFor(() => {
      expect(getUsersSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: false,
        })
      );
    });
  });

  it("disables deactivating own account and allows deactivating other users", async () => {
    vi.spyOn(adminService, "getUsers").mockResolvedValue({
      items: sampleUsers,
      total: 2,
      page: 1,
      page_size: 10,
    });

    const updateUserSpy = vi
      .spyOn(adminService, "updateUser")
      .mockResolvedValue({
        ...sampleUsers[1],
        is_active: false,
      });

    const user = userEvent.setup();
    render(<AdminUsersPage />);

    await waitFor(() => {
      expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    });

    // Buttons: 2 rows with Deactivate buttons
    const deactivateButtons = screen.getAllByRole("button", {
      name: /deactivate/i,
    });
    // First is admin (self) -> disabled
    expect(deactivateButtons[0]).toBeDisabled();

    // Second is Alice -> enabled
    expect(deactivateButtons[1]).not.toBeDisabled();
    await user.click(deactivateButtons[1]);

    expect(updateUserSpy).toHaveBeenCalledWith("user-2", {
      is_active: false,
    });
  });
});
