import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ProtectedRoute } from "./protected-route";
import { AuthProvider } from "../context/auth-context";
import { authService } from "../services/auth-service";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
  usePathname: () => "/en/projects/tf-core/board",
}));

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading skeleton while session is initializing", () => {
    // Hangs the promise
    vi.spyOn(authService, "getCurrentUser").mockImplementation(
      () => new Promise(() => {})
    );

    render(
      <AuthProvider>
        <ProtectedRoute>
          <div data-testid="protected-content">Secret Dashboard</div>
        </ProtectedRoute>
      </AuthProvider>
    );

    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-label",
      "Loading workspace..."
    );
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  it("redirects unauthenticated user to login with safe redirect query parameter", async () => {
    vi.spyOn(authService, "getCurrentUser").mockResolvedValueOnce(null);

    render(
      <AuthProvider>
        <ProtectedRoute>
          <div data-testid="protected-content">Secret Dashboard</div>
        </ProtectedRoute>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(
        `/en/login?redirect=${encodeURIComponent("/en/projects/tf-core/board")}`
      );
    });

    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  it("renders children when user is authenticated", async () => {
    vi.spyOn(authService, "getCurrentUser").mockResolvedValueOnce({
      id: "u-300",
      email: "engineer@taskflow.dev",
      name: "Morgan",
    });

    render(
      <AuthProvider>
        <ProtectedRoute>
          <div data-testid="protected-content">Secret Dashboard</div>
        </ProtectedRoute>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });

    expect(replaceMock).not.toHaveBeenCalled();
  });
});
