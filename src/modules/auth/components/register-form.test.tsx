import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { RegisterForm } from "./register-form";
import { AuthProvider } from "../context/auth-context";
import { authService } from "../services/auth-service";
import { ApiClientError } from "@/services/api-client";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const pushMock = vi.fn();
const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
  usePathname: () => "/en/register",
  useSearchParams: () => new URLSearchParams(),
}));

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(authService, "getCurrentUser").mockResolvedValue(null);
  });

  it("renders email, password, confirm password, submit button, and links", async () => {
    render(
      <AuthProvider>
        <RegisterForm />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^create account$/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      "/en/login"
    );
    expect(
      screen.getByRole("link", { name: /terms of service/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /privacy policy/i })
    ).toBeInTheDocument();
  });

  it("validates that passwords must match", async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <RegisterForm />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    await user.type(
      screen.getByLabelText(/email address/i),
      "sam@taskflow.dev"
    );
    await user.type(screen.getByLabelText(/^password/i), "password123");
    await user.type(
      screen.getByLabelText(/confirm password/i),
      "mismatchPassword"
    );
    await user.click(screen.getByRole("button", { name: /^create account$/i }));

    await waitFor(() => {
      expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    });
  });

  it("displays server error banner when registration fails", async () => {
    vi.spyOn(authService, "register").mockRejectedValueOnce(
      new ApiClientError(409, {
        error: {
          code: "USER_ALREADY_EXISTS",
          message: "An account with this email address already exists.",
          request_id: "req_err_reg_1",
        },
      })
    );

    const user = userEvent.setup();

    render(
      <AuthProvider>
        <RegisterForm />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    await user.type(
      screen.getByLabelText(/email address/i),
      "sam@taskflow.dev"
    );
    await user.type(screen.getByLabelText(/^password/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /^create account$/i }));

    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent(
        "An account with this email address already exists."
      );
    });
  });

  it("redirects to login with registered query on successful registration instead of dashboard", async () => {
    vi.spyOn(authService, "register").mockResolvedValueOnce({
      id: "u-101",
      email: "sam@taskflow.dev",
      full_name: "sam",
      name: "sam",
    });

    const user = userEvent.setup();

    render(
      <AuthProvider>
        <RegisterForm />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    await user.type(
      screen.getByLabelText(/email address/i),
      "sam@taskflow.dev"
    );
    await user.type(screen.getByLabelText(/^password/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /^create account$/i }));

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith({
        full_name: "sam",
        email: "sam@taskflow.dev",
        password: "password123",
        confirmPassword: "password123",
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Account created successfully! Please sign in with your credentials."
      );
      expect(pushMock).toHaveBeenCalledWith("/en/login");
      expect(pushMock).not.toHaveBeenCalledWith("/en/projects");
    });
  });
});
