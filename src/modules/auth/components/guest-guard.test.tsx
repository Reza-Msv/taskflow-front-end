import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { GuestGuard } from "./guest-guard";
import { AuthProvider } from "../context/auth-context";
import { authService } from "../services/auth-service";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
  usePathname: () => "/en/login",
  useSearchParams: () => new URLSearchParams(),
}));

describe("GuestGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders children for unauthenticated guest user", async () => {
    vi.spyOn(authService, "getCurrentUser").mockResolvedValueOnce(null);

    render(
      <AuthProvider>
        <GuestGuard>
          <div data-testid="guest-form">Login Form</div>
        </GuestGuard>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("guest-form")).toBeInTheDocument();
    });

    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("redirects authenticated user away from login to dashboard", async () => {
    vi.spyOn(authService, "getCurrentUser").mockResolvedValueOnce({
      id: "u-400",
      email: "authenticated@taskflow.dev",
      name: "Riley",
    });

    render(
      <AuthProvider>
        <GuestGuard>
          <div data-testid="guest-form">Login Form</div>
        </GuestGuard>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/en/projects");
    });

    expect(screen.queryByTestId("guest-form")).not.toBeInTheDocument();
  });
});
