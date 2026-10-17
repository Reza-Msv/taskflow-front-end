import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "./auth-context";
import { authService } from "../services/auth-service";
import { ApiClientError } from "@/services/api-client";

function TestConsumer() {
  const { user, isLoading, error, isAuthenticated, login, logout } = useAuth();

  return (
    <div>
      <div data-testid="loading">{isLoading ? "loading" : "ready"}</div>
      <div data-testid="auth">
        {isAuthenticated ? "authenticated" : "unauthenticated"}
      </div>
      <div data-testid="user">{user?.email || "none"}</div>
      <div data-testid="error">{error || "none"}</div>
      <button
        onClick={() =>
          login({ email: "test@taskflow.dev", password: "password" })
        }
      >
        Sign In
      </button>
      <button onClick={() => logout()}>Sign Out</button>
    </div>
  );
}

describe("AuthContext & AuthProvider", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("throws error when useAuth is called outside AuthProvider", () => {
    // Suppress console.error in React for this test
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow(
      "useAuth must be used within an AuthProvider"
    );
    consoleError.mockRestore();
  });

  it("initializes with authenticated user when session exists", async () => {
    vi.spyOn(authService, "getCurrentUser").mockResolvedValueOnce({
      id: "u-100",
      email: "session@taskflow.dev",
      name: "Session User",
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    // Initial state is loading
    expect(screen.getByTestId("loading").textContent).toBe("loading");

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("ready");
    });

    expect(screen.getByTestId("auth").textContent).toBe("authenticated");
    expect(screen.getByTestId("user").textContent).toBe("session@taskflow.dev");
    expect(screen.getByTestId("error").textContent).toBe("none");
  });

  it("initializes as unauthenticated when no session exists", async () => {
    vi.spyOn(authService, "getCurrentUser").mockResolvedValueOnce(null);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("ready");
    });

    expect(screen.getByTestId("auth").textContent).toBe("unauthenticated");
    expect(screen.getByTestId("user").textContent).toBe("none");
  });

  it("handles backend connection failure during initial session check", async () => {
    vi.spyOn(authService, "getCurrentUser").mockRejectedValueOnce(
      new ApiClientError(0, {
        error: {
          code: "BACKEND_UNAVAILABLE",
          message: "Unable to connect to backend",
          request_id: "req_conn",
        },
      })
    );

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("ready");
    });

    expect(screen.getByTestId("auth").textContent).toBe("unauthenticated");
    expect(screen.getByTestId("error").textContent).toBe(
      "Unable to connect to backend"
    );
  });

  it("updates state on successful login and logout", async () => {
    vi.spyOn(authService, "getCurrentUser").mockResolvedValueOnce(null);
    vi.spyOn(authService, "login").mockResolvedValueOnce({
      id: "u-200",
      email: "test@taskflow.dev",
      name: "Test User",
    });
    vi.spyOn(authService, "logout").mockResolvedValueOnce(undefined);

    const user = userEvent.setup();

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("ready");
    });

    // Perform Login
    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Sign In" }));
    });

    expect(screen.getByTestId("auth").textContent).toBe("authenticated");
    expect(screen.getByTestId("user").textContent).toBe("test@taskflow.dev");

    // Perform Logout
    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Sign Out" }));
    });

    expect(screen.getByTestId("auth").textContent).toBe("unauthenticated");
    expect(screen.getByTestId("user").textContent).toBe("none");
  });
});
