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
  // Example: src/modules/auth/services/auth-service.ts
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
   - Contains minimal JSX and zero direct client state.
2. **Layer 2 — Page Orchestrator (`src/components/pages/<domain>/<feature>-page.tsx`)**:
   - Manages feature-level composition, active tabs, filters, dialog/drawer triggers, and coordinator hooks.
   - Connects domain data/services with view components.
3. **Layer 3 — Granular Subcomponents (`src/components/pages/<domain>/...` or domain blocks)**:
   - Focused, single-responsibility UI components (cards, tables, filter chips, dialog forms).
   - Reusable across feature views; built on accessible primitives in `src/components/ui/`.

#### File Size Guideline

- Aim for a target maximum of **~250 lines per source file** (excluding generated contracts and tests).
- When a component naturally grows beyond 250 lines, plan a safe extraction of subcomponents or helper functions without breaking working behavior.

### Pillar C — Server Components First

_Reference: [ADR 0002: Server Components First Architecture](decisions/0002-server-components-first.md)_

- **Default Server Execution**: Route handlers (`page.tsx`) and layout wrappers (`layout.tsx`) are Server Components by default.
- **Boundary Isolation**: Push `"use client"` down to the interactive leaves (forms, interactive cards, dropdown triggers, drag-and-drop boards).
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
- **Active Session Verification**: Dashboard routes verify session validity against `GET /api/v1/auth/me`. Unauthenticated or expired requests redirect safely to `/[locale]/login?returnUrl=...`.
- **CSRF Token Injection**: State-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`) inspect `taskflow_csrf` cookie and inject the `X-CSRF-Token` header.
- **Contract Synchronization**: Generated OpenAPI types in `src/services/generated/api-types.ts` remain the single source of truth for backend schemas.

---

## 3. Directory Architecture: Current Implementation vs Target Layout

### Current Implementation Structure

The codebase currently organizes domain logic between `src/modules/` and `src/components/`:

```text
src/
├── app/
│   └── [locale]/
│       ├── (dashboard)/
│       │   ├── layout.tsx                # Dashboard layout wrapped in ProtectedRoute
│       │   ├── projects/
│       │   │   ├── page.tsx              # Server route -> ProjectsPage orchestrator
│       │   │   └── [projectId]/
│       │   │       └── board/
│       │   │           └── page.tsx      # Server route -> ProjectBoardPage orchestrator
│       ├── login/
│       │   └── page.tsx                  # Server route -> LoginPage orchestrator (GuestGuard)
│       ├── register/
│       │   └── page.tsx                  # Server route -> RegisterPage orchestrator (GuestGuard)
│       ├── layout.tsx                    # Root layout with i18n & NextIntlClientProvider
│       └── page.tsx                      # Landing / marketing page
├── components/
│   ├── marketing/                        # Hero, interactive preview, features, testimonials
│   ├── pages/                            # Page orchestrators (projects-page, project-board-page)
│   ├── shared/                           # Domain UI blocks (kanban-board, task-card, app-sidebar, app-header)
│   └── ui/                               # shadcn/ui primitives (button, card, dialog, table, input...)
├── hooks/                                # General hooks (use-local-storage, use-media-query, use-mobile)
├── i18n/                                 # next-intl navigation, request, and routing config
├── lib/                                  # Utilities (cn, safe-redirect, logger)
├── messages/                             # i18n dictionaries (en.json, fa.json)
├── modules/
│   └── auth/                             # Auth domain package
│       ├── components/                   # LoginForm, RegisterForm, AuthCard, ProtectedRoute, GuestGuard
│       ├── context/                      # AuthContext & useAuth hook
│       ├── schemas/                      # Zod validation schemas (login, register)
│       ├── services/                     # Functional auth-service.ts
│       └── types/                        # Auth type definitions
├── services/
│   ├── api-client.ts                     # Functional fetch wrapper & ApiClientError
│   └── generated/
│       └── api-types.ts                  # Generated OpenAPI 3.1 backend typings
├── styles/                               # Tailwind tokens and globals.css
└── types/                                # Global project and navigation types
```

### Proposed Target Directory Architecture

For future enterprise modules (e.g., knowledge base, analytics, settings), the target architecture eliminates the nested `src/modules/` directory in favor of direct feature orchestration under `src/components/pages/` paired with centralized `src/services/` and `src/stores/`:

```text
src/
├── app/
│   └── [locale]/
│       ├── (web)/
│       │   ├── (auth)/
│       │   │   ├── login/page.tsx
│       │   │   └── register/page.tsx
│       │   └── (dashboard)/
│       │       └── dashboard/
│       │           ├── projects/page.tsx
│       │           └── enterprise/
│       │               └── knowledge/page.tsx
├── components/
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── login-page.tsx
│   │   │   ├── login-form.tsx
│   │   │   ├── register-page.tsx
│   │   │   ├── register-form.tsx
│   │   │   └── index.ts
│   │   └── data/
│   │       └── knowledge-base/
│   │           ├── knowledge-base-page.tsx
│   │           ├── knowledge-base-filters.tsx
│   │           ├── knowledge-base-file-table.tsx
│   │           └── index.ts
│   ├── shared/
│   └── ui/
├── hooks/
├── lib/
├── services/
│   ├── api-client.ts
│   ├── auth-service.ts
│   └── generated/
├── stores/
└── types/
```

---

## 4. Architectural Status & Verification Matrix

| Area / Feature                   | Architectural State         | Verification Status          | Notes                                                                                                                        |
| :------------------------------- | :-------------------------- | :--------------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| **Functional Programming**       | Implemented & Verified      | 100% tests passing           | Plain object service exports (`authService`), pure transforms, zero classes except `ApiClientError extends Error`.           |
| **Three-Layer Pattern**          | Implemented & Verified      | Fully operational            | Route handlers (`src/app`) -> Page orchestrators (`src/components/pages`) -> UI components (`src/components/shared`, `ui`).  |
| **Server Components First**      | Implemented & Verified      | Build & tests verified       | `page.tsx` files are Server Components; `"use client"` is isolated to interactive leaves.                                    |
| **Cookie Auth & Sessions**       | Implemented & Verified      | Unit & contract tested       | `taskflow_session` HttpOnly cookie, `credentials: "include"`, session check via `GET /api/v1/auth/me`.                       |
| **CSRF Protection**              | Implemented & Verified      | Unit tested                  | `X-CSRF-Token` extracted from cookie and sent on mutating calls.                                                             |
| **Redirect Loop Guard**          | Implemented & Verified      | Unit tested                  | `getSafeReturnUrl()` prevents open redirect and login redirect loops.                                                        |
| **Internationalization (fa/en)** | Implemented & Verified      | Working in UI                | Persian RTL and English LTR supported with dynamic HTML `dir` attribute.                                                     |
| **Internationalization (ru)**    | Proposed (Future Migration) | Backlog                      | Target architecture proposes Russian (`ru`); requires translation dictionaries.                                              |
| **Default Locale as Persian**    | Proposed (Future Migration) | Backlog                      | Current default is `en`; migration requires user-facing routing review.                                                      |
| **Target Route Nesting**         | Proposed (Future Migration) | Backlog                      | Target specifies `(web)/(dashboard)/dashboard/...`; current URLs (`/projects`, `/login`) preserved to avoid breaking routes. |
| **Module Directory Unification** | Partially Implemented       | Stable in `src/modules/auth` | Working auth module preserved; new features follow the three-layer target pattern.                                           |

---

## 5. Safe Phased Migration Roadmap

To transition toward the target directory organization without disrupting ongoing development or introducing regressions:

```
[Phase 1: Architecture & ADRs] -> [Phase 2: Service Re-exports] -> [Phase 3: Module Realignment] -> [Phase 4: Extended Locales]
  (Completed in this task)         (Maintain import stability)    (Migrate UI to components/pages) (Add ru, configure default fa)
```

### Phase 1: Architecture Documentation & ADR Baseline _(Completed)_

- Formalize architectural principles in `docs/architecture.md` and `docs/frontend-guidelines.md`.
- Record ADRs for Functional Programming (0001), Server Components First (0002), and Module Organization (0003).
- Update agent rules in `.agents/AGENTS.md` and `.agents/skills/frontend-architecture/SKILL.md`.

### Phase 2: Service & Schema Centralization _(Future Non-Breaking Step)_

- Re-export `authService` from `src/services/auth-service.ts` while keeping `src/modules/auth/services/auth-service.ts` as a backward-compatible alias.
- Consolidate Zod schemas and TypeScript types into `src/types/` and `src/services/` respectively.
- Run `pnpm run test` and `pnpm run type-check` to guarantee zero import regressions.

### Phase 3: Page & Subcomponent Realignment _(Future Feature Expansion)_

- When building new modules (e.g., Knowledge Base), place orchestrators and granular components directly under `src/components/pages/<domain>/`.
- Safely transition `src/modules/auth/components/` into `src/components/pages/auth/` using barrel re-exports.

### Phase 4: Extended Internationalization _(Future Localization Step)_

- Introduce Russian dictionary `src/messages/ru.json`.
- Add `ru` to `locales` array in `src/i18n/routing.ts`.
- Coordinate user preference storage before changing default locale from `en` to `fa`.
