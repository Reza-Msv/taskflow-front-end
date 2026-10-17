---
name: frontend-architecture
description: Enforce three-tier Next.js App Router modular directory boundaries, functional programming, and component responsibilities.
---

# Frontend Architecture Skill

## Purpose

Enforce strict modular directory boundaries, Server Components First policies, functional service architectures, and prevent component bloat and spaghetti imports across routes and domains.

## Architectural Boundaries

1. **Layer 1 — Route Handlers (`src/app/[locale]/...`)**:
   - Thin Server Components for dynamic route segments, metadata, server prefetching, and layout shells.
   - Never embed complex interactive UI or stateful business logic directly in route files.

2. **Layer 2 — Page Orchestrators (`src/components/pages/<domain>/`)**:
   - Assembles views by composing domain components, managing filter state, modals, tabs, and integrating domain services.
   - Coordinates with client-side guards (`<ProtectedRoute>`, `<GuestGuard>`) where necessary.

3. **Layer 3 — Granular Subcomponents & Shared Blocks (`src/components/shared/`, `src/components/ui/`, `src/modules/`)**:
   - `src/components/ui/`: Atomic visual primitives (shadcn/ui). No domain logic, no API calls.
   - `src/components/shared/`: Shared workspace components (e.g. `kanban-board.tsx`, `task-card.tsx`, `app-header.tsx`, `app-sidebar.tsx`).
   - `src/modules/<domain>/`: Encapsulated domain logic and forms (e.g. `auth/`). Target for gradual realignment per ADR 0003.

4. **Services & Contracts (`src/services/`)**:
   - Centralized functional API services (e.g. `api-client.ts`, `auth-service.ts`).
   - OpenAPI 3.1 contracts generated into `src/services/generated/api-types.ts`.
   - Zero custom OOP classes; plain object exports with functions.

5. **Client Stores (`src/stores/`)**:
   - Ephemeral UI state only (Zustand). Never store full database entities or duplicate server collections.

## Key Rules & Anti-Patterns

- **Functional Programming**: Prohibit custom OOP classes (only exception is subclassing `Error`).
- **File Size Target**: Maximum ~250 lines per source file target.
- **Server Components First**: Keep `page.tsx` and `layout.tsx` as Server Components; push `"use client"` to interactive leaves.
- **Cookie Sessions & Auth**: Validate sessions via `GET /api/v1/auth/me` with `credentials: "include"` and `X-CSRF-Token` on mutations.
- **Anti-Pattern**: Writing direct `fetch` calls in leaf components without using `apiClient`.
- **Anti-Pattern**: Storing entire database entities in Zustand.
- **Anti-Pattern**: Circular dependencies between modules or deep barrel file chains.

## Authoritative Documentation

- [`docs/architecture.md`](../../docs/architecture.md)
- [`docs/frontend-guidelines.md`](../../docs/frontend-guidelines.md)
- [`docs/decisions/0001-functional-architecture.md`](../../docs/decisions/0001-functional-architecture.md)
- [`docs/decisions/0002-server-components-first.md`](../../docs/decisions/0002-server-components-first.md)
- [`docs/decisions/0003-feature-module-organization.md`](../../docs/decisions/0003-feature-module-organization.md)
