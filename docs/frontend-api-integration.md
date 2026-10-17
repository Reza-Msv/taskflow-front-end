# Frontend API Integration & Contracts

## OpenAPI Synchronization

Frontend contracts stay synchronized with the FastAPI backend using `openapi-typescript`:

```bash
pnpm run generate:api
```

This inspects `http://localhost:8000/api/v1/openapi.json` and outputs:

- `src/services/generated/api-types.ts`

---

## Credentialed Requests & Cookie Sessions

All requests sent through `apiClient` automatically enforce credentialed mode:

```typescript
credentials: "include";
```

- **Session Cookie**: `taskflow_session` is managed by FastAPI as an `HttpOnly` cookie.
- **Client Security**: JavaScript never attempts to read or write the session cookie directly, and sensitive credentials/tokens are never stored in `localStorage` or `sessionStorage`.

---

## Error Handling

Every failed request throws an instance of `ApiClientError`:

```typescript
try {
  const data = await apiClient<ProjectResponse>("/api/v1/projects/123");
} catch (err) {
  if (err instanceof ApiClientError) {
    console.error(`Error Code: ${err.code}, Request ID: ${err.requestId}`);
  }
}
```

- **Server Error Payloads**: Automatically parsed from backend `{ error: { code, message, details, request_id } }` structures.
- **Network Failures & Unreachable Backend**: When the API server is unavailable or connection is refused, `apiClient` catches the network error and throws `ApiClientError(0, { error: { code: "BACKEND_UNAVAILABLE", ... } })`.
- **UI Notifications**: Errors are presented to users via inline accessible alert banners (`role="alert"`) or non-intrusive `sonner` toasts.

For detailed authentication contract specifications and pending backend identity endpoints, refer to [`docs/auth-backend-contract-status.md`](auth-backend-contract-status.md).
