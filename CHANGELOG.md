# Changelog

All notable changes to the TaskFlow frontend application will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Step 1] - 2026-10-17

### Added - Authentication Frontend & Session Management

#### 1. Architecture & Domain Module (`src/modules/auth`)

- **Domain Types (`src/modules/auth/types/auth-types.ts`)**:
  - Defined strict TypeScript contracts for `AuthUser`, `LoginCredentials`, `RegisterCredentials`, `AuthState`, and `AuthContextValue`.
- **Validation Schemas (`src/modules/auth/schemas/auth-schemas.ts`)**:
  - Implemented Zod schemas for login and registration forms, including email format validation, required fields, and password confirmation matching.
- **API Service Layer (`src/modules/auth/services/auth-service.ts`)**:
  - Integrated with FastAPI backend endpoints (`/api/v1/auth/login`, `/api/v1/auth/register`, `/api/v1/auth/logout`, `/api/v1/users/me`).
  - Enforced `credentials: "include"` for HttpOnly cookie session management (`taskflow_session`).
  - Prohibited storage of passwords or long-lived authentication tokens in `localStorage` or `sessionStorage`.
  - Structured error translation for 401 unauthenticated, 404 endpoint not yet implemented, 409 conflict, and backend-down network failures without faking successful authentication.
- **Session State Management (`src/modules/auth/context/auth-context.tsx`)**:
  - Created `AuthProvider` and `useAuth()` hook managing reactive session lifecycle, user state, loading states, and error propagation without infinite redirect loops.

#### 2. UI Components & Route Orchestrators

- **Brand Auth Card (`src/modules/auth/components/auth-card.tsx`)**:
  - Responsive container honoring TaskFlow black and orange branding (`#111111` and `#FF6A00`), logo mark, navigation back to home, and language toggle.
- **Login Form (`src/modules/auth/components/login-form.tsx`)**:
  - React Hook Form with Zod resolver, email field, toggleable password visibility (eye/eye-off icons), loading spinner, and accessible error alert banner.
- **Register Form (`src/modules/auth/components/register-form.tsx`)**:
  - Full registration form with name, email, password, and confirmation fields, matching password validation, loading indicators, and error alert banners.
- **Route Protection & Guards**:
  - `ProtectedRoute` (`src/modules/auth/components/protected-route.tsx`): Wraps dashboard layouts, displays an accessible skeleton during initial session probes, and redirects unauthenticated users to login with safe callback parameter.
  - `GuestGuard` (`src/modules/auth/components/guest-guard.tsx`): Automatically redirects authenticated visitors away from login/register pages to their intended safe destination or dashboard.
- **Route Pages**:
  - Created thin route segments `src/app/[locale]/login/page.tsx` and `src/app/[locale]/register/page.tsx`.
  - Created page orchestrators `src/components/pages/login-page.tsx` and `src/components/pages/register-page.tsx`.

#### 3. Security & Open Redirect Prevention

- **Safe Redirection Utility (`src/lib/safe-redirect.ts`)**:
  - Sanitizes redirect targets, preventing open redirect and XSS vectors (`//evil.com`, `/\evil.com`, `javascript:`, data URIs, and external protocols).
  - Preserves internal relative routes and locale prefixes (`/[locale]/projects/...`).

#### 4. Header & Navigation Updates

- **User Profile & Logout (`src/components/shared/app-header.tsx`)**:
  - Added user initials avatar with Radix dropdown menu displaying user name, email, settings link, and logout action.
  - Displays "Sign In" button when unauthenticated.

#### 5. Internationalization & Design Tokens

- **Localization (`src/messages/en.json`, `src/messages/fa.json`)**:
  - Added full English and Persian (RTL) translations for all authentication forms, validation messages, and session alerts.
- **Global Provider (`src/app/[locale]/layout.tsx`)**:
  - Injected `AuthProvider` and mounted `Toaster` for sonner feedback.

#### 6. Environment & Backend Contract Documentation

- **`.env.example`**:
  - Documented `NEXT_PUBLIC_API_BASE_URL="http://localhost:8000"`.
- **`docs/auth-backend-contract-status.md`**:
  - Comprehensive report on backend contract requirements, HttpOnly cookie expectations, and identified missing identity router endpoints in the FastAPI backend.

#### 7. Automated Testing & Verification

- Added 49 new unit and component tests (bringing the total suite to **58 passing tests** across 12 files):
  - `src/lib/safe-redirect.test.ts` (8 tests)
  - `src/modules/auth/schemas/auth-schemas.test.ts` (8 tests)
  - `src/modules/auth/services/auth-service.test.ts` (12 tests)
  - `src/modules/auth/context/auth-context.test.tsx` (5 tests)
  - `src/modules/auth/components/login-form.test.tsx` (5 tests)
  - `src/modules/auth/components/register-form.test.tsx` (4 tests)
  - `src/modules/auth/components/protected-route.test.tsx` (3 tests)
  - `src/modules/auth/components/guest-guard.test.tsx` (2 tests)
  - `src/components/shared/app-header.test.tsx` (2 tests)
- Verified with `pnpm run format:check`, `pnpm run type-check`, `pnpm run test`, and `pnpm run build`.
