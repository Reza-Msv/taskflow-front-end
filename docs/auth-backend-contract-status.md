# TaskFlow Authentication: Frontend & Backend Contract Status

## 1. Overview & Current Status

This document details the authentication integration between the `taskflow-front-end` client (Next.js 16 App Router) and the `taskflow-back-end` API (FastAPI).

### Verification Summary

- **Frontend Architecture**: Implemented following the 3-tier structure (`app/[locale]/`, `components/pages/`, `modules/auth/`, `components/ui/`).
- **UI & Validation**: Completed with React Hook Form, Zod schema validation, dark/light themes, RTL/LTR localization (EN/FA), loading states, and error alerts.
- **Session Security**: Fully credentialed with `credentials: "include"`. Zero tokens or credentials stored in `localStorage` or `sessionStorage`.
- **Backend Service State**: The backend repository on branch `feature/auth` currently only has the system liveness endpoint (`GET /api/v1/health`) mounted. The identity domain endpoints have **not yet been implemented or exposed in the API router**.
- **End-to-End Status**: UI and client state handling are verified with 58 automated tests; end-to-end integration is pending backend endpoint implementation.

---

## 2. API Contract Specification & Backend Expectations

Based on the backend `PRD.md` (Section 2.1 "Identity & Access Management") and `core/config.py`:

### 2.1 Configuration & Cookie Contract

- **Session Cookie Name**: `taskflow_session` (as specified in `taskflow.core.config.Settings.SESSION_COOKIE_NAME`).
- **Cookie Attributes**:
  - `HttpOnly: true` (strictly inaccessible to JavaScript)
  - `SameSite: "lax"` (or `"strict"`)
  - `Secure: false` (in development), `true` (in production)
- **CORS Requirements**:
  - `Access-Control-Allow-Credentials: true`
  - `Access-Control-Allow-Origin: http://localhost:3000`

### 2.2 Endpoints Required from Backend

#### 1. Sign In (`POST /api/v1/auth/login`)

- **Request Body (`application/json`)**:
  ```json
  {
    "email": "user@taskflow.dev",
    "password": "SecurePassword123!"
  }
  ```
- **Success Response (`200 OK`)**:
  - Header: `Set-Cookie: taskflow_session=<session_id>; HttpOnly; Path=/; SameSite=Lax`
  - Body:
    ```json
    {
      "user": {
        "id": "0192e2b3-...",
        "email": "user@taskflow.dev",
        "name": "Jane Doe"
      }
    }
    ```
- **Error Responses**:
  - `401 Unauthorized`:
    ```json
    {
      "error": {
        "code": "INVALID_CREDENTIALS",
        "message": "The email or password you entered is incorrect.",
        "request_id": "req_..."
      }
    }
    ```
  - `422 Unprocessable Entity`: standard FastAPI validation error.

#### 2. User Registration (`POST /api/v1/auth/register`)

- **Request Body (`application/json`)**:
  ```json
  {
    "full_name": "Jane Doe",
    "email": "user@taskflow.dev",
    "password": "SecurePassword123!"
  }
  ```
- **Success Response (`201 Created` or `200 OK`)**:
  - Header: `Set-Cookie: taskflow_session=...; HttpOnly; Path=/; SameSite=Lax`
  - Body:
    ```json
    {
      "user": {
        "id": "0192e2b3-...",
        "email": "user@taskflow.dev",
        "full_name": "Jane Doe"
      }
    }
    ```
- **Error Responses**:
  - `409 Conflict`:
    ```json
    {
      "error": {
        "code": "USER_ALREADY_EXISTS",
        "message": "An account with this email address already exists.",
        "request_id": "req_..."
      }
    }
    ```

#### 3. Current Session / User Profile (`GET /api/v1/users/me`)

- **Request**: Cookie header with `taskflow_session`.
- **Success Response (`200 OK`)**:
  ```json
  {
    "id": "0192e2b3-...",
    "email": "user@taskflow.dev",
    "name": "Jane Doe"
  }
  ```
- **Unauthenticated Response (`401 Unauthorized`)**:
  ```json
  {
    "error": {
      "code": "UNAUTHENTICATED",
      "message": "Authentication required",
      "request_id": "req_..."
    }
  }
  ```

#### 4. Sign Out (`POST /api/v1/auth/logout`)

- **Request**: Cookie header with `taskflow_session`.
- **Success Response (`200 OK` or `204 No Content`)**:
  - Header: `Set-Cookie: taskflow_session=; Max-Age=0; Path=/; HttpOnly`

---

## 3. Frontend Implementation Details

1. **`src/services/api-client.ts`**:
   - Configured with `credentials: "include"` on every request.
   - Throws typed `ApiClientError` with parsed backend error envelopes.
   - Catches connection and network aborts cleanly with code `BACKEND_UNAVAILABLE` (status 0).
2. **`src/modules/auth/services/auth-service.ts`**:
   - Exposes `login()`, `register()`, `getCurrentUser()`, and `logout()`.
   - Never fakes successful authentication when the backend returns 404, 401, or fails.
3. **`src/modules/auth/context/auth-context.tsx`**:
   - Initializes session on mount.
   - Manages `user`, `isLoading`, `error`, `isAuthenticated`.
   - Never enters redirect loops when unauthenticated or backend is offline.
4. **`src/lib/safe-redirect.ts`**:
   - Enforces strict relative-path redirects, rejecting `//`, `/\`, `:`, and external hosts.
5. **`src/modules/auth/components/protected-route.tsx`**:
   - Guards all routes inside `src/app/[locale]/(dashboard)`.
   - Displays dashboard loading skeleton while session status is resolving.
   - Safely redirects unauthenticated visitors to `/[locale]/login?redirect=...`.
6. **`src/modules/auth/components/guest-guard.tsx`**:
   - Prevents authenticated users from seeing login/register, sending them to their destination or `/projects`.

---

## 4. Integration Verification & Next Steps

When the backend identity endpoints are implemented in `src/taskflow/api/v1/endpoints/`:

1. Start the FastAPI backend:
   ```bash
   uvicorn taskflow.main:app --host 0.0.0.0 --port 8000 --reload
   ```
2. Run contract sync:
   ```bash
   pnpm run generate:api
   ```
3. Run end-to-end user registration, login, session persistence, and logout in the browser against `http://localhost:3000`.
