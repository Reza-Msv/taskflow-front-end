import { describe, it, expect } from "vitest";
import { getSafeRedirectPath } from "./safe-redirect";

describe("getSafeRedirectPath", () => {
  it("returns fallback when redirect is null, undefined, or empty", () => {
    expect(getSafeRedirectPath(null, "en")).toBe("/en/projects");
    expect(getSafeRedirectPath(undefined, "en")).toBe("/en/projects");
    expect(getSafeRedirectPath("", "en")).toBe("/en/projects");
    expect(getSafeRedirectPath("   ", "en")).toBe("/en/projects");
  });

  it("returns custom fallback when specified", () => {
    expect(getSafeRedirectPath(null, "fa", "/dashboard")).toBe("/fa/dashboard");
    expect(getSafeRedirectPath(null, "en", "settings")).toBe("/en/settings");
  });

  it("preserves safe relative path with locale prefix", () => {
    expect(getSafeRedirectPath("/en/projects/tf-core/board", "en")).toBe(
      "/en/projects/tf-core/board"
    );
    expect(getSafeRedirectPath("/fa/projects/123", "fa")).toBe(
      "/fa/projects/123"
    );
  });

  it("prepends locale if relative path lacks locale prefix", () => {
    expect(getSafeRedirectPath("/projects/tf-core/board", "en")).toBe(
      "/en/projects/tf-core/board"
    );
    expect(getSafeRedirectPath("/settings?tab=profile", "fa")).toBe(
      "/fa/settings?tab=profile"
    );
  });

  it("blocks protocol-relative URLs (open redirect vector //evil.com)", () => {
    expect(getSafeRedirectPath("//evil.com", "en")).toBe("/en/projects");
    expect(getSafeRedirectPath("//evil.com/phish", "en")).toBe("/en/projects");
    expect(getSafeRedirectPath("/\\evil.com", "en")).toBe("/en/projects");
    expect(getSafeRedirectPath("\\evil.com", "en")).toBe("/en/projects");
  });

  it("blocks absolute URLs (http:// and https://)", () => {
    expect(getSafeRedirectPath("https://attacker.com", "en")).toBe(
      "/en/projects"
    );
    expect(getSafeRedirectPath("http://localhost:8000/docs", "en")).toBe(
      "/en/projects"
    );
  });

  it("blocks javascript: and other pseudo-protocols", () => {
    expect(getSafeRedirectPath("javascript:alert(1)", "en")).toBe(
      "/en/projects"
    );
    expect(getSafeRedirectPath("/javascript:alert(1)", "en")).toBe(
      "/en/projects"
    );
    expect(getSafeRedirectPath("data:text/html,<h1>hacked</h1>", "en")).toBe(
      "/en/projects"
    );
  });

  it("preserves query parameters on safe paths", () => {
    expect(getSafeRedirectPath("/en/projects?filter=active", "en")).toBe(
      "/en/projects?filter=active"
    );
  });

  it("prevents redirect loops by returning fallback when target is login or register", () => {
    expect(getSafeRedirectPath("/en/login", "en")).toBe("/en/projects");
    expect(getSafeRedirectPath("/login", "en")).toBe("/en/projects");
    expect(getSafeRedirectPath("/fa/login", "fa")).toBe("/fa/projects");
    expect(getSafeRedirectPath("/en/register", "en")).toBe("/en/projects");
    expect(getSafeRedirectPath("/register", "fa")).toBe("/fa/projects");
  });
});
