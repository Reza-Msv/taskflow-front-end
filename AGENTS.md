# TaskFlow Frontend Agent Guidelines & Architectural Standards

All contributors and AI agents operating on this repository must strictly adhere to the standards and architectural pillars defined here and in [`docs/architecture.md`](docs/architecture.md).

---

## 1. Absolute Constraints — Zero Regressions

1. **Preserve Working Application Behavior**: Do not break, rewrite, or alter working UI, business logic, authentication behavior, API contracts, or user workflows.
2. **Mandatory Testing after Every Change**:
   - Write unit or component tests (`*.test.ts` or `*.test.tsx`) alongside any new or changed code.
   - Run and verify all test suites using `pnpm run test` before completing any task.
3. **No Unwarranted File Deletion or Monolithic Refactoring**:
   - Do not move, rename, or delete existing files unless strictly necessary and verified safe.
   - Preserve existing working directories (`src/modules/auth/`, `src/components/pages/`, etc.).
4. **Strict Truth in Reporting**: Never claim a test, build, or type check passed without actually running and inspecting the terminal output.

---

## 2. Architectural Pillars

- **Pillar A — Functional Programming / Zero Custom OOP Classes**:
  - Prefer plain functions, closures, and factory functions over classes.
  - Export services as plain objects containing async/pure methods.
  - Exception: Subclassing `Error` (e.g. `ApiClientError extends Error`) is explicitly permitted.
  - _Reference: [ADR 0001: Functional Programming Architecture](docs/decisions/0001-functional-architecture.md)_
- **Pillar B — Three-Layer Orchestrator-Component Pattern**:
  - Layer 1: Route Handler (`src/app/[locale]/.../page.tsx`) — Server Component.
  - Layer 2: Page Orchestrator (`src/components/pages/...`) — Feature state & layout coordinator.
  - Layer 3: Granular Subcomponents (`src/components/shared/`, `src/components/ui/`) — Single-responsibility UI.
  - Aim for ~250 lines max per source file as a maintainability target.
  - _Reference: [ADR 0003: Feature Module Organization](docs/decisions/0003-feature-module-organization.md)_
- **Pillar C — Server Components First**:
  - Keep `page.tsx` and `layout.tsx` as Server Components by default.
  - Push `"use client"` down to interactive leaves (forms, buttons, modals, boards).
  - _Reference: [ADR 0002: Server Components First Architecture](docs/decisions/0002-server-components-first.md)_
- **Pillar D — Internationalization (next-intl)**:
  - Preserve bidirectional support (Persian RTL, English LTR).
  - Maintain localized route segments and dictionary files (`src/messages/`).
- **Pillar E — Cookie Sessions & API Security**:
  - Fast-API backend manages session via `taskflow_session` HttpOnly cookie.
  - Requests must use `credentials: "include"`.
  - Mutating requests must send `X-CSRF-Token` header extracted from `taskflow_csrf` cookie.
  - Session verification uses `GET /api/v1/auth/me`.
  - _Reference: [Frontend API Integration](docs/frontend-api-integration.md)_

---

## 3. Mandatory Quality & Verification Commands

Before completing any task, execute and verify:

```bash
pnpm run test          # Run Vitest test suites (100% pass required)
pnpm run type-check     # Run TypeScript type check (zero errors required)
pnpm run lint           # Run ESLint checks
pnpm run format:check   # Run Prettier style check
```

---

## 4. Documentation Index

- [`docs/architecture.md`](docs/architecture.md): Full architectural specification, stack overview, and migration roadmap.
- [`docs/frontend-guidelines.md`](docs/frontend-guidelines.md): Coding rules, 250-line guideline, TypeScript strictness, and state management.
- [`docs/decisions/0001-functional-architecture.md`](docs/decisions/0001-functional-architecture.md): ADR 0001 — Functional Architecture.
- [`docs/decisions/0002-server-components-first.md`](docs/decisions/0002-server-components-first.md): ADR 0002 — Server Components First.
- [`docs/decisions/0003-feature-module-organization.md`](docs/decisions/0003-feature-module-organization.md): ADR 0003 — Feature Module Organization.
- [`docs/frontend-api-integration.md`](docs/frontend-api-integration.md): API client, cookie sessions, and error handling.
- [`docs/design-system.md`](docs/design-system.md): Tailwind tokens, colors, typography, and component styling.
