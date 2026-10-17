import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./login-form";
import { AuthProvider } from "../context/auth-context";
import { authService } from "../services/auth-service";
import { ApiClientError } from "@/services/api-client";

const pushMock = vi.fn();
const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
  usePathname: () => "/en/login",
  useSearchParams: () => new URLSearchParams(),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(authService, "getCurrentUser").mockResolvedValue(null);
  });

  it("renders email, password, submit button and link to register", async () => {
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^sign in$/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign up/i })).toHaveAttribute(
      "href",
      "/en/register"
    );
  });

  it("displays validation errors when submitting empty form", async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /^sign in$/i })
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    await waitFor(() => {
      expect(screen.getByText("Email is required")).toBeInTheDocument();
      expect(screen.getByText("Password is required")).toBeInTheDocument();
    });
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText(/^password/i);
    expect(passwordInput).toHaveAttribute("type", "password");

    const toggleButton = screen.getByRole("button", { name: /show password/i });
    await user.click(toggleButton);

    expect(passwordInput).toHaveAttribute("type", "text");

    const hideButton = screen.getByRole("button", { name: /hide password/i });
    await user.click(hideButton);

    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("displays server error banner when API returns error", async () => {
    vi.spyOn(authService, "login").mockRejectedValueOnce(
      new ApiClientError(401, {
        error: {
          code: "INVALID_CREDENTIALS",
          message: "The email or password you entered is incorrect.",
          request_id: "req_err_1",
        },
      })
    );

    const user = userEvent.setup();

    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    await user.type(
      screen.getByLabelText(/email address/i),
      "user@taskflow.dev"
    );
    await user.type(screen.getByLabelText(/^password/i), "wrongpass");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent(
        "The email or password you entered is incorrect."
      );
    });
  });

  it("submits valid credentials and navigates to safe redirect path on success", async () => {
    vi.spyOn(authService, "login").mockResolvedValueOnce({
      id: "u-99",
      email: "user@taskflow.dev",
      name: "Alex",
    });

    const user = userEvent.setup();

    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    await user.type(
      screen.getByLabelText(/email address/i),
      "user@taskflow.dev"
    );
    await user.type(screen.getByLabelText(/^password/i), "password123");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/en/projects");
    });
  });
});
