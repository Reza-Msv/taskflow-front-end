import { describe, it, expect, vi, beforeEach } from "vitest";
import { authService, AUTH_ENDPOINTS } from "./auth-service";
import * as apiClientModule from "@/services/api-client";
import { ApiClientError } from "@/services/api-client";

describe("authService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("login", () => {
    it("successfully logs in and returns the user", async () => {
      const mockUser = { id: "u-1", email: "user@taskflow.dev", name: "Alex" };
      vi.spyOn(apiClientModule, "apiClient").mockResolvedValueOnce({
        user: mockUser,
      });

      const user = await authService.login({
        email: "user@taskflow.dev",
        password: "password123",
      });

      expect(user).toEqual(mockUser);
      expect(apiClientModule.apiClient).toHaveBeenCalledWith(
        AUTH_ENDPOINTS.login,
        {
          method: "POST",
          body: JSON.stringify({
            email: "user@taskflow.dev",
            password: "password123",
          }),
        }
      );
    });

    it("translates 401 into INVALID_CREDENTIALS error", async () => {
      vi.spyOn(apiClientModule, "apiClient").mockRejectedValueOnce(
        new ApiClientError(401, {
          error: {
            code: "UNAUTHORIZED",
            message: "Unauthorized",
            request_id: "req_test_1",
          },
        })
      );

      await expect(
        authService.login({
          email: "user@taskflow.dev",
          password: "wrongPassword",
        })
      ).rejects.toThrow("The email or password you entered is incorrect.");
    });

    it("translates 404 into AUTH_ENDPOINT_UNAVAILABLE error", async () => {
      vi.spyOn(apiClientModule, "apiClient").mockRejectedValueOnce(
        new ApiClientError(404, {
          error: {
            code: "NOT_FOUND",
            message: "Not found",
            request_id: "req_test_2",
          },
        })
      );

      await expect(
        authService.login({
          email: "user@taskflow.dev",
          password: "password123",
        })
      ).rejects.toThrow(
        "The backend authentication endpoint (POST /api/v1/auth/login) is not yet mounted in the API router."
      );
    });

    it("propagates BACKEND_UNAVAILABLE errors", async () => {
      vi.spyOn(apiClientModule, "apiClient").mockRejectedValueOnce(
        new ApiClientError(0, {
          error: {
            code: "BACKEND_UNAVAILABLE",
            message: "Unable to connect to backend",
            request_id: "req_test_3",
          },
        })
      );

      await expect(
        authService.login({
          email: "user@taskflow.dev",
          password: "password123",
        })
      ).rejects.toThrow("Unable to connect to backend");
    });
  });

  describe("register", () => {
    it("successfully registers, maps full_name in request payload, and returns user", async () => {
      const mockBackendResponse = {
        user: {
          id: "u-2",
          email: "new@taskflow.dev",
          full_name: "Sam Smith",
        },
        csrf_token: "csrf_token_123",
        message: "User registered successfully",
      };
      vi.spyOn(apiClientModule, "apiClient").mockResolvedValueOnce(
        mockBackendResponse
      );

      const user = await authService.register({
        full_name: "Sam Smith",
        email: "new@taskflow.dev",
        password: "password123",
        confirmPassword: "password123",
      });

      expect(apiClientModule.apiClient).toHaveBeenCalledWith(
        AUTH_ENDPOINTS.register,
        {
          method: "POST",
          body: JSON.stringify({
            email: "new@taskflow.dev",
            password: "password123",
            full_name: "Sam Smith",
          }),
        }
      );

      expect(user).toEqual(mockBackendResponse.user);
    });

    it("maps legacy name field to full_name in payload if provided", async () => {
      const mockUser = {
        id: "u-3",
        email: "legacy@taskflow.dev",
        full_name: "Legacy User",
      };
      vi.spyOn(apiClientModule, "apiClient").mockResolvedValueOnce({
        user: mockUser,
      });

      await authService.register({
        name: "Legacy User",
        email: "legacy@taskflow.dev",
        password: "password123",
      } as unknown as Parameters<typeof authService.register>[0]);

      expect(apiClientModule.apiClient).toHaveBeenCalledWith(
        AUTH_ENDPOINTS.register,
        {
          method: "POST",
          body: JSON.stringify({
            email: "legacy@taskflow.dev",
            password: "password123",
            full_name: "Legacy User",
          }),
        }
      );
    });

    it("translates 409 conflict into USER_ALREADY_EXISTS error", async () => {
      vi.spyOn(apiClientModule, "apiClient").mockRejectedValueOnce(
        new ApiClientError(409, {
          error: {
            code: "CONFLICT",
            message: "Already exists",
            request_id: "req_test_4",
          },
        })
      );

      await expect(
        authService.register({
          full_name: "Sam",
          email: "exists@taskflow.dev",
          password: "password123",
        })
      ).rejects.toThrow("An account with this email address already exists.");
    });
  });

  describe("getCurrentUser", () => {
    it("returns user when authenticated", async () => {
      const mockUser = { id: "u-1", email: "user@taskflow.dev" };
      vi.spyOn(apiClientModule, "apiClient").mockResolvedValueOnce(mockUser);

      const user = await authService.getCurrentUser();
      expect(user).toEqual(mockUser);
    });

    it("returns null on 401 unauthenticated", async () => {
      vi.spyOn(apiClientModule, "apiClient").mockRejectedValueOnce(
        new ApiClientError(401, {
          error: {
            code: "UNAUTHORIZED",
            message: "Not logged in",
            request_id: "req_test_5",
          },
        })
      );

      const user = await authService.getCurrentUser();
      expect(user).toBeNull();
    });

    it("returns null on 404 endpoint not found", async () => {
      vi.spyOn(apiClientModule, "apiClient").mockRejectedValueOnce(
        new ApiClientError(404, {
          error: {
            code: "NOT_FOUND",
            message: "Not found",
            request_id: "req_test_6",
          },
        })
      );

      const user = await authService.getCurrentUser();
      expect(user).toBeNull();
    });

    it("throws when backend is completely unavailable (status 0)", async () => {
      vi.spyOn(apiClientModule, "apiClient").mockRejectedValueOnce(
        new ApiClientError(0, {
          error: {
            code: "BACKEND_UNAVAILABLE",
            message: "Backend down",
            request_id: "req_test_7",
          },
        })
      );

      await expect(authService.getCurrentUser()).rejects.toThrow(
        "Backend down"
      );
    });
  });

  describe("logout", () => {
    it("calls logout endpoint cleanly", async () => {
      const spy = vi
        .spyOn(apiClientModule, "apiClient")
        .mockResolvedValueOnce(undefined);

      await authService.logout();
      expect(spy).toHaveBeenCalledWith(AUTH_ENDPOINTS.logout, {
        method: "POST",
      });
    });

    it("handles logout server failure gracefully without throwing", async () => {
      vi.spyOn(apiClientModule, "apiClient").mockRejectedValueOnce(
        new ApiClientError(500, {
          error: {
            code: "SERVER_ERROR",
            message: "Failed",
            request_id: "req_test_8",
          },
        })
      );

      await expect(authService.logout()).resolves.toBeUndefined();
    });
  });
});
