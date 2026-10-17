import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterForm } from "./register-form";
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
  usePathname: () => "/en/register",
  useSearchParams: () => new URLSearchParams(),
}));

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(authService, "getCurrentUser").mockResolvedValue(null);
  });

  it("renders all registration fields and switch link to login", async () => {
    render(
      <AuthProvider>
        <RegisterForm />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^create account$/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      "/en/login"
    );
  });

  it("validates that passwords must match", async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <RegisterForm />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/full name/i), "Sam Smith");
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
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/full name/i), "Sam Smith");
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

  it("redirects to safe path on successful registration", async () => {
    vi.spyOn(authService, "register").mockResolvedValueOnce({
      id: "u-101",
      email: "sam@taskflow.dev",
      name: "Sam Smith",
    });

    const user = userEvent.setup();

    render(
      <AuthProvider>
        <RegisterForm />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/full name/i), "Sam Smith");
    await user.type(
      screen.getByLabelText(/email address/i),
      "sam@taskflow.dev"
    );
    await user.type(screen.getByLabelText(/^password/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /^create account$/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/en/projects");
    });
  });
});
