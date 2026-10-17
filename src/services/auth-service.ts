import { apiClient, ApiClientError, setCsrfToken } from "./api-client";
import type {
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
} from "@/types/auth";

export const AUTH_ENDPOINTS = {
  login: "/api/v1/auth/login",
  register: "/api/v1/auth/register",
  logout: "/api/v1/auth/logout",
  currentUser: "/api/v1/auth/me",
} as const;

/**
 * Authentication service interacting directly with the FastAPI backend.
 * Uses credentialed requests (cookies) exclusively.
 * Does NOT store passwords or authentication tokens in localStorage or sessionStorage.
 */
export const authService = {
  /**
   * Submit login credentials to authenticate a user.
   * Expects backend to set HttpOnly session cookie (taskflow_session).
   */
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    try {
      const response = await apiClient<AuthUser | { user: AuthUser }>(
        AUTH_ENDPOINTS.login,
        {
          method: "POST",
          body: JSON.stringify(credentials),
        }
      );

      // Extract user from payload regardless of whether backend nests under .user
      if ("user" in response && response.user) {
        return response.user;
      }
      return response as AuthUser;
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.status === 404) {
          throw new ApiClientError(404, {
            error: {
              code: "AUTH_ENDPOINT_UNAVAILABLE",
              message:
                "The backend authentication endpoint (POST /api/v1/auth/login) is not yet mounted in the API router.",
              request_id: err.requestId,
            },
          });
        }
        if (err.status === 401) {
          throw new ApiClientError(401, {
            error: {
              code: "INVALID_CREDENTIALS",
              message: "The email or password you entered is incorrect.",
              request_id: err.requestId,
            },
          });
        }
      }
      throw err;
    }
  },

  /**
   * Submit registration data to create a new user account.
   * Does NOT treat registration as an active session: explicitly clears any issued session.
   */
  async register(credentials: RegisterCredentials): Promise<AuthUser> {
    try {
      const {
        confirmPassword: _confirmPassword,
        name,
        full_name,
        ...rest
      } = credentials;
      const payload = {
        ...rest,
        full_name: full_name ?? name ?? "",
      };
      const response = await apiClient<AuthUser | { user: AuthUser }>(
        AUTH_ENDPOINTS.register,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      // Invalidate any session issued upon registration to ensure the user must explicitly sign in
      try {
        await authService.logout();
      } catch {
        // Ignore logout errors if session was not issued
      }

      if ("user" in response && response.user) {
        return response.user;
      }
      return response as AuthUser;
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.status === 404) {
          throw new ApiClientError(404, {
            error: {
              code: "AUTH_ENDPOINT_UNAVAILABLE",
              message:
                "The backend registration endpoint (POST /api/v1/auth/register) is not yet mounted in the API router.",
              request_id: err.requestId,
            },
          });
        }
        if (err.status === 409) {
          throw new ApiClientError(409, {
            error: {
              code: "USER_ALREADY_EXISTS",
              message: "An account with this email address already exists.",
              request_id: err.requestId,
            },
          });
        }
      }
      throw err;
    }
  },

  /**
   * Check for an active session with the backend.
   * Returns AuthUser if authenticated, or null if unauthenticated / endpoint not ready.
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const response = await apiClient<AuthUser | { user: AuthUser }>(
        AUTH_ENDPOINTS.currentUser,
        {
          method: "GET",
        }
      );

      if ("user" in response && response.user) {
        return response.user;
      }
      return response as AuthUser;
    } catch (err) {
      if (err instanceof ApiClientError) {
        // 401 or 403 means user is simply not logged in
        if (err.status === 401 || err.status === 403) {
          return null;
        }
        // 404 means the user endpoint is not yet mounted on backend
        if (err.status === 404) {
          return null;
        }
        // Backend unavailable (status 0) should be reported
        if (err.status === 0 || err.code === "BACKEND_UNAVAILABLE") {
          throw err;
        }
      }
      return null;
    }
  },

  /**
   * Terminate current session on the backend.
   */
  async logout(): Promise<void> {
    try {
      await apiClient<void>(AUTH_ENDPOINTS.logout, {
        method: "POST",
      });
    } catch (err) {
      // Log failure but let caller clear local state
      console.warn("Logout request failed on server:", err);
    } finally {
      setCsrfToken(null);
    }
  },
};
