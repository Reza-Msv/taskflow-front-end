import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema } from "./auth-schemas";

describe("loginSchema", () => {
  it("validates valid login credentials", () => {
    const result = loginSchema.safeParse({
      email: "user@taskflow.dev",
      password: "securePassword123!",
    });
    expect(result.success).toBe(true);
  });

  it("fails on empty email", () => {
    const result = loginSchema.safeParse({
      email: "",
      password: "password123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Email is required");
    }
  });

  it("fails on invalid email format", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Please enter a valid email address"
      );
    }
  });

  it("fails on empty password", () => {
    const result = loginSchema.safeParse({
      email: "user@taskflow.dev",
      password: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Password is required");
    }
  });
});

describe("registerSchema", () => {
  it("validates valid registration data", () => {
    const result = registerSchema.safeParse({
      full_name: "Alex Vance",
      email: "alex@taskflow.dev",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("fails when passwords do not match", () => {
    const result = registerSchema.safeParse({
      full_name: "Alex Vance",
      email: "alex@taskflow.dev",
      password: "password123",
      confirmPassword: "password456",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const matchIssue = result.error.issues.find(
        (issue) => issue.path[0] === "confirmPassword"
      );
      expect(matchIssue?.message).toBe("Passwords do not match");
    }
  });

  it("fails when password is shorter than 8 characters", () => {
    const result = registerSchema.safeParse({
      full_name: "Alex Vance",
      email: "alex@taskflow.dev",
      password: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const pwdIssue = result.error.issues.find(
        (issue) => issue.path[0] === "password"
      );
      expect(pwdIssue?.message).toBe("Password must be at least 8 characters");
    }
  });

  it("fails on empty full name", () => {
    const result = registerSchema.safeParse({
      full_name: "",
      email: "alex@taskflow.dev",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Full name is required");
    }
  });

  it("fails when full name exceeds 255 characters", () => {
    const result = registerSchema.safeParse({
      full_name: "a".repeat(256),
      email: "alex@taskflow.dev",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Full name must be less than 255 characters"
      );
    }
  });
});
