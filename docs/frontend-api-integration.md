# Frontend API Integration & Contracts

## OpenAPI Synchronization

Frontend contracts stay synchronized with the FastAPI backend using `openapi-typescript`:

```bash
pnpm run generate:api
```

This inspects `http://localhost:8000/api/v1/openapi.json` and outputs:

- `src/services/generated/api-types.ts`

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

All errors display structured notifications via `sonner` toast or inline form alerts.
