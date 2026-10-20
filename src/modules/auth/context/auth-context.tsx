"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { authService } from "../services/auth-service";
import type {
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
  AuthContextValue,
} from "../types/auth-types";
import { ApiClientError, onUnauthorized } from "@/services/api-client";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const inFlightPromiseRef = useRef<Promise<AuthUser | null> | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshSession = useCallback(async (): Promise<AuthUser | null> => {
    if (inFlightPromiseRef.current) {
      return inFlightPromiseRef.current;
    }

    const promise = (async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        setError(null);
        return currentUser;
      } catch (err) {
        if (err instanceof ApiClientError) {
          setError(err.message);
        } else {
          setError("Unable to authenticate with backend server.");
        }
        setUser(null);
        return null;
      } finally {
        setIsLoading(false);
        inFlightPromiseRef.current = null;
      }
    })();

    inFlightPromiseRef.current = promise;
    return promise;
  }, []);

  // Listen for global 401 unauthorized notifications from apiClient
  useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      setUser(null);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const authenticatedUser = await authService.login(credentials);
        setUser(authenticatedUser);
      } catch (err) {
        const message =
          err instanceof ApiClientError
            ? err.message
            : "An unexpected error occurred during sign in.";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const register = useCallback(
    async (credentials: RegisterCredentials): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        await authService.register(credentials);
        // Do NOT treat registration as an active session
        setUser(null);
      } catch (err) {
        const message =
          err instanceof ApiClientError
            ? err.message
            : "An unexpected error occurred during account creation.";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      // Clear client state regardless of server logout response
      setUser(null);
      setError(null);
      setIsLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      error,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      refreshSession,
      clearError,
    }),
    [
      user,
      isLoading,
      error,
      login,
      register,
      logout,
      refreshSession,
      clearError,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useOptionalAuth(): AuthContextValue | null {
  return useContext(AuthContext) ?? null;
}

