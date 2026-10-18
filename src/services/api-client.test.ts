import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  apiClient,
  ApiClientError,
  setCsrfToken,
  getCsrfToken,
  onUnauthorized,
} from "./api-client";

describe("apiClient", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    setCsrfToken(null);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("always enforces credentials: 'include'", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: "ok" }),
    });
    global.fetch = fetchMock;

    await apiClient("/api/v1/health");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/v1/health",
      expect.objectContaining({
        credentials: "include",
      })
    );
  });

  it("attaches X-CSRF-Token on mutating requests when CSRF token is available", async () => {
    setCsrfToken("csrf-secret-token-123");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: "updated" }),
    });
    global.fetch = fetchMock;

    await apiClient("/api/v1/projects", {
      method: "POST",
      body: JSON.stringify({ name: "New Project" }),
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/projects"),
      expect.objectContaining({
        method: "POST",
        headers: expect.any(Headers),
      })
    );

    const callHeaders = fetchMock.mock.calls[0][1]?.headers as Headers;
    expect(callHeaders.get("X-CSRF-Token")).toBe("csrf-secret-token-123");
  });

  it("captures csrf_token from JSON response body", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        user: { id: "1" },
        csrf_token: "new-server-csrf-456",
      }),
    });
    global.fetch = fetchMock;

    await apiClient("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "test@taskflow.dev", password: "pwd" }),
    });

    expect(getCsrfToken()).toBe("new-server-csrf-456");
  });

  it("notifies unauthorized listeners on 401 for authenticated endpoints", async () => {
    const unauthorizedSpy = vi.fn();
    const unsubscribe = onUnauthorized(unauthorizedSpy);

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      headers: new Headers(),
      json: async () => ({
        error: {
          code: "UNAUTHORIZED",
          message: "Session expired",
          request_id: "req_unauth_1",
        },
      }),
    });
    global.fetch = fetchMock;

    await expect(apiClient("/api/v1/auth/me")).rejects.toThrow(ApiClientError);

    expect(unauthorizedSpy).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});
