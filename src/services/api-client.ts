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

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
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

  return response.json();
}
