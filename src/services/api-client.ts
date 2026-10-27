export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    request_id: string;
  };
}

export class ApiClientError extends Error {
  public code: string;
  public details: Record<string, unknown>;
  public requestId: string;
  public status: number;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.error.message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = payload.error.code;
    this.details = payload.error.details || {};
    this.requestId = payload.error.request_id;
  }
}

const RAW_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, "");

let inMemoryCsrfToken: string | null = null;

export function setCsrfToken(token: string | null): void {
  inMemoryCsrfToken = token;
}

export function getCsrfToken(): string | null {
  if (typeof document !== "undefined") {
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith("taskflow_csrf="));
    if (match) {
      return decodeURIComponent(match.split("=")[1]);
    }
  }
  return inMemoryCsrfToken;
}

type UnauthorizedCallback = () => void;
const unauthorizedListeners = new Set<UnauthorizedCallback>();

export function onUnauthorized(callback: UnauthorizedCallback): () => void {
  unauthorizedListeners.add(callback);
  return () => {
    unauthorizedListeners.delete(callback);
  };
}

export function notifyUnauthorized(): void {
  unauthorizedListeners.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.error("Error in unauthorized listener", e);
    }
  });
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // Inject CSRF token for mutating requests when available
  const method = (options.method || "GET").toUpperCase();
  if (
    ["POST", "PUT", "PATCH", "DELETE"].includes(method) &&
    !headers.has("X-CSRF-Token")
  ) {
    const csrf = getCsrfToken();
    if (csrf) {
      headers.set("X-CSRF-Token", csrf);
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch (err: unknown) {
    if (err instanceof ApiClientError) {
      throw err;
    }
    // Re-throw deliberate AbortError so cancellation does not trigger backend unavailable alerts
    if (
      (err instanceof DOMException && err.name === "AbortError") ||
      (err instanceof Error && err.name === "AbortError")
    ) {
      throw err;
    }
    throw new ApiClientError(0, {
      error: {
        code: "BACKEND_UNAVAILABLE",
        message:
          "Unable to connect to the backend server. Please verify the API is running.",
        request_id: "req_network_error",
      },
    });
  }

  if (!response.ok) {
    // Notify session listeners on 401 Unauthorized for authenticated endpoints
    if (
      response.status === 401 &&
      !endpoint.includes("/auth/login") &&
      !endpoint.includes("/auth/register")
    ) {
      notifyUnauthorized();
    }

    let payload: ApiErrorPayload;
    try {
      payload = await response.json();
    } catch {
      payload = {
        error: {
          code: "HTTP_ERROR",
          message: response.statusText || "An unexpected error occurred",
          request_id: response.headers.get("X-Request-ID") || "req_unknown",
        },
      };
    }
    throw new ApiClientError(response.status, payload);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json();
  if (
    data &&
    typeof data === "object" &&
    "csrf_token" in data &&
    typeof (data as { csrf_token: unknown }).csrf_token === "string"
  ) {
    setCsrfToken((data as { csrf_token: string }).csrf_token);
  }
  return data;
}
