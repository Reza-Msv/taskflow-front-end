# TaskFlow Frontend Architecture Specification

> **Status**: Living Architectural Specification  
> **App Router**: Next.js 16 (React 19)  
> **Type System**: Strict TypeScript  
> **State & Primitives**: Zustand & shadcn/ui  
> **Backend Synchronization**: OpenAPI 3.1 & FastAPI  
> **Internationalization**: next-intl (Bidirectional LTR/RTL)

---

## 1. Executive Summary & Core Stack

TaskFlow is an enterprise project and task management frontend designed for speed, accessibility, and high data density. The application connects to a Python FastAPI backend using cookie-based session authentication and strict contract generation.

### Technology Stack Overview

| Category                 | Primary Technology             | Responsibility                                                  |
| :----------------------- | :----------------------------- | :-------------------------------------------------------------- |
| **Framework**            | Next.js 16 (App Router)        | Server-side rendering, streaming, routing, and route protection |
| **UI Library**           | React 19                       | Declarative component composition and hooks                     |
| **Language**             | TypeScript (Strict Mode)       | Static type safety and compile-time contract enforcement        |
| **Styling**              | Tailwind CSS & CSS Variables   | Restrained design tokens, dark/light theme switching            |
| **Component Primitives** | shadcn/ui (Radix UI)           | Headless, accessible (WCAG 2.1 AA) atomic UI components         |
| **State Management**     | React Context & Zustand        | Client UI state, modals, drawers, and ephemeral preferences     |
| **Internationalization** | next-intl                      | Bidirectional localization (Persian RTL, English LTR)           |
| **Validation**           | Zod                            | Runtime form validation and schema validation                   |
| **Test Runner**          | Vitest & React Testing Library | Fast unit and component test suites                             |

---

## 2. Core Architectural Pillars

### Pillar A — Functional Programming & Zero Custom Classes

_Reference: [ADR 0001: Functional Programming Architecture](decisions/0001-functional-architecture.md)_

The codebase strictly enforces functional composition over object-oriented class hierarchies:

- **No Stateful Classes**: Custom application classes, class-based controllers, and singletons are prohibited.
- **Plain-Object Service Exports**: Services are exported as plain objects containing pure or async functions:
  ```typescript
  // src/services/auth-service.ts
  export const authService = {
    login,
    register,
    getCurrentUser,
    logout,
  };
  ```
- **Factory Functions**: Use factory functions (e.g., `createApiError()`, `createColumnDefs()`) instead of constructors or builders.
- **Closures & Pure Transforms**: Encapsulate private state inside function closures; perform data transformations with pure functions.
- **Legitimate Exceptions**: Extending native `Error` (e.g., `class ApiClientError extends Error` in `src/services/api-client.ts`) is explicitly permitted to preserve standard stack traces, HTTP error metadata, and runtime `instanceof` handling.

### Pillar B — Three-Layer Orchestrator-Component Pattern

_Reference: [ADR 0003: Feature Module Organization](decisions/0003-feature-module-organization.md)_

To avoid monolithic components and ensure clear separation of concerns, features are structured into three distinct tiers:

1. **Layer 1 — Route Handler (`src/app/[locale]/.../page.tsx`)**:
   - Thin Server Component.
   - Responsible for URL parameters, OpenGraph metadata, server prefetching, and route skeletons.
   - Example: `src/app/[locale]/(dashboard)/projects/page.tsx` renders `<ProjectsPage />` without client hooks in the route file.
2. **Layer 2 — Page Orchestrator (`src/components/pages/...`)**:
   - Manages feature-level composition, active tabs, filters, dialog/drawer triggers, and coordinator hooks.
   - Fully exported via `src/components/pages/index.ts` (`LoginPage`, `RegisterPage`, `ProjectsPage`, `ProjectBoardPage`).
3. **Layer 3 — Granular Subcomponents (`src/components/shared/`, `src/components/ui/`, feature subcomponents)**:
   - Focused, single-responsibility UI components (cards, tables, filter chips, dialog forms).
   - Reusable across feature views; built on accessible primitives in `src/components/ui/`.

#### File Size Guideline

- All source files aim for a maximum of **~250 lines** (excluding generated contracts and tests).
- Marketing components (`hero-section.tsx`, `product-preview-demo.tsx`) and auth components (`register-form.tsx`) have been decomposed into modular subcomponents to satisfy this maintainability target.

### Pillar C — Server Components First

_Reference: [ADR 0002: Server Components First Architecture](decisions/0002-server-components-first.md)_

- **Default Server Execution**: Route handlers (`page.tsx`) and layout wrappers (`layout.tsx`) are Server Components across all public and authenticated routes.
- **Boundary Isolation**: Push `"use client"` down to the interactive leaves (page orchestrators, forms, interactive cards, dropdown triggers, drag-and-drop boards).
- **Client Guards**: Route authentication guards (`<ProtectedRoute>` and `<GuestGuard>`) wrap client components or orchestrators without converting outer layout trees to client code.
- **Preservation Rule**: Never remove `"use client"` if the file relies on React hooks, event listeners, or browser APIs.

### Pillar D — Internationalization & Localization (next-intl)

- **Bidirectional Support**: Supports Persian (`fa`) with right-to-left (`rtl`) layout and English (`en`) with left-to-right (`ltr`) layout.
- **Dynamic Directionality**: Document root sets `dir="rtl"` or `dir="ltr"` and `lang` dynamically based on route parameters:
  ```tsx
  // src/app/[locale]/layout.tsx
  const direction = locale === "fa" ? "rtl" : "ltr";
  ```
- **Dictionary Separation**: Locale JSON files (`src/messages/en.json`, `src/messages/fa.json`) are structured by feature namespaces (`auth`, `navigation`, `dashboard`, `common`).

### Pillar E — Authentication, Session Security & Backend Contract

_Reference: [`docs/frontend-api-integration.md`](frontend-api-integration.md)_

- **Cookie-Based Sessions**: Fast-API backend manages session state via `taskflow_session` as an `HttpOnly`, `SameSite=Lax` cookie.
- **Zero Local Token Storage**: Sensitive tokens are never written to `localStorage` or `sessionStorage`.
- **Automatic Credentials**: All requests through `apiClient` include `credentials: "include"`.
- **Active Session Verification**: Dashboard routes verify session validity against `GET /api/v1/auth/me`. Unauthenticated or expired requests redirect safely to `/[locale]/login?redirect=...`.
- **CSRF Token Injection**: State-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`) inspect `taskflow_csrf` cookie and inject the `X-CSRF-Token` header.
- **Contract Synchronization**: Generated OpenAPI types in `src/services/generated/api-types.ts` remain the single source of truth for backend schemas.

---

## 3. Directory Architecture: Implemented Reality

The codebase is organized into clean functional tiers:

```text
src/
├── app/
│   └── [locale]/
│       ├── (dashboard)/
│       │   ├── layout.tsx                # Server Component layout wrapped in ProtectedRoute
│       │   ├── projects/
│       │   │   ├── page.tsx              # Server Component -> renders ProjectsPage
│       │   │   └── [projectId]/
│       │   │       └── board/
│       │   │           └── page.tsx      # Server Component -> renders ProjectBoardPage
│       ├── login/
│       │   └── page.tsx                  # Server Component -> renders LoginPage
│       ├── register/
│       │   └── page.tsx                  # Server Component -> renders RegisterPage
│       ├── layout.tsx                    # Root layout with i18n & NextIntlClientProvider
│       └── page.tsx                      # Landing / marketing page
├── components/
│   ├── marketing/                        # Hero, HeroMockup, ProductPreviewDemo (modular sub-views)
│   ├── pages/                            # Page orchestrators (ProjectsPage, ProjectBoardPage, LoginPage, RegisterPage)
│   │   ├── index.ts                      # Barrel export for page orchestrators
│   │   ├── login-page.tsx
│   │   ├── register-page.tsx
│   │   ├── projects-page.tsx
│   │   └── project-board-page.tsx
│   ├── shared/                           # Domain UI blocks (kanban-board, task-card, app-sidebar, app-header)
│   └── ui/                               # shadcn/ui primitives (button, card, dialog, table, input...)
├── hooks/                                # General hooks (use-local-storage, use-media-query, use-mobile)
├── i18n/                                 # next-intl navigation, request, and routing config
├── lib/                                  # Utilities (cn, safe-redirect, logger)
├── messages/                             # i18n dictionaries (en.json, fa.json)
├── modules/
│   └── auth/                             # Auth domain package (backward-compatible aliases)
│       ├── components/                   # LoginForm, RegisterForm, AuthCard, AuthErrorBanner, ProtectedRoute, GuestGuard
│       ├── context/                      # AuthContext & useAuth hook
│       ├── schemas/                      # Zod validation schemas (login, register)
│       ├── services/                     # Re-exports from @/services/auth-service
│       └── types/                        # Re-exports from @/types/auth
├── services/
│   ├── api-client.ts                     # Functional fetch wrapper & ApiClientError
│   ├── auth-service.ts                   # Centralized functional authService & AUTH_ENDPOINTS
│   └── generated/
│       └── api-types.ts                  # Generated OpenAPI 3.1 backend typings
├── styles/                               # Tailwind tokens and globals.css
└── types/                                # Centralized domain interfaces
    └── auth.ts                           # AuthUser, LoginCredentials, RegisterCredentials, AuthState
```

---

## 4. Architectural Status & Verification Matrix

| Area / Feature                   | Architectural State         | Verification Status           | Notes                                                                                                                                                 |
| :------------------------------- | :-------------------------- | :---------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Functional Programming**       | Implemented & Verified      | 100% tests passing            | Plain object service exports (`authService` in `src/services/auth-service.ts`), pure transforms, zero classes except `ApiClientError extends Error`.  |
| **Three-Layer Pattern**          | Implemented & Verified      | 100% operational              | Layer 1 (Server route handlers in `src/app`) -> Layer 2 (Page orchestrators in `src/components/pages`) -> Layer 3 (Granular UI components).           |
| **Server Components First**      | Implemented & Verified      | 100% operational              | All `page.tsx` routes in `src/app/` are Server Components; client state isolated to `src/components/pages/` orchestrators and leaves.                 |
| **Modularity & 250-Line Target** | Implemented & Verified      | All source files <= 252 lines | `product-preview-demo.tsx` reduced from 414 to 128 lines; `hero-section.tsx` reduced from 287 to 162 lines; `register-form.tsx` reduced to 252 lines. |
| **Centralized Services & Types** | Implemented & Verified      | Verified with 0 type errors   | `src/services/auth-service.ts` and `src/types/auth.ts` active with non-breaking re-exports in `src/modules/auth/`.                                    |
| **Cookie Auth & Sessions**       | Implemented & Verified      | Unit & contract tested        | `taskflow_session` HttpOnly cookie, `credentials: "include"`, session check via `GET /api/v1/auth/me`.                                                |
| **CSRF Protection**              | Implemented & Verified      | Unit tested                   | `X-CSRF-Token` extracted from cookie and sent on mutating calls.                                                                                      |
| **Redirect Loop Guard**          | Implemented & Verified      | Unit tested                   | `getSafeReturnUrl()` prevents open redirect and login redirect loops.                                                                                 |
| **Internationalization (fa/en)** | Implemented & Verified      | Working in UI                 | Persian RTL and English LTR supported with dynamic HTML `dir` attribute.                                                                              |
| **Internationalization (ru)**    | Proposed (Future Migration) | Backlog                       | Target architecture proposes Russian (`ru`); requires translation dictionaries.                                                                       |
| **Default Locale as Persian**    | Proposed (Future Migration) | Backlog                       | Current default is `en`; migration requires user-facing routing review.                                                                               |

---

## 5. Completed & Remaining Migration Roadmap

```
[Phase 1: Architecture & ADR Baseline] -> [Phase 2: Services, Types & Server Components] -> [Phase 3: Extended Locales (ru)]
            (COMPLETED)                                     (COMPLETED)                                   (BACKLOG)
```

### Phase 1: Architecture Documentation & ADR Baseline _(Completed)_

- Formalized architectural principles in `docs/architecture.md` and `docs/frontend-guidelines.md`.
- Recorded ADRs 0001, 0002, and 0003.
- Updated agent rules in `AGENTS.md` and `.agents/skills/frontend-architecture/SKILL.md`.

### Phase 2: Centralized Services, Page Orchestrators & Server Components _(Completed)_

- Centralized domain types in `src/types/auth.ts` and API service in `src/services/auth-service.ts`.
- Extracted Page Orchestrators into `src/components/pages/projects-page.tsx`, `project-board-page.tsx`, and `index.ts`.
- Converted `src/app/[locale]/(dashboard)/projects/page.tsx` and `board/page.tsx` to Server Components.
- Modularized large files (`hero-section.tsx`, `product-preview-demo.tsx`, `register-form.tsx`).
- Maintained 100% backward compatibility via alias re-exports in `src/modules/auth/`.

### Phase 3: Extended Internationalization _(Future Localization Step)_

- Introduce Russian dictionary `src/messages/ru.json`.
- Add `ru` to `locales` array in `src/i18n/routing.ts`.
- Coordinate user preference storage before changing default locale from `en` to `fa`.
