---
name: frontend-architecture
description: Enforce three-tier Next.js App Router modular directory boundaries and component responsibilities.
---

# Frontend Architecture Skill

## Purpose

Prevent component bloat, spaghetti imports, and blurred responsibilities across routes and domains.

## Directory Boundaries

- `src/app/[locale]/`: Only handles route segments, layout wrappers, and server data prefetching. Never embed 500-line UI implementations here.
- `src/components/pages/`: Assembles pages by orchestrating domain modules and view filters.
- `src/modules/<domain>/`: Contains business UI (e.g. `work-items/task-card.tsx`, `scrum/sprint-planning-board.tsx`).
- `src/components/ui/`: Atomic visual primitives (shadcn/ui). No domain logic or API calls.
- `src/services/`: Typed API client and generated OpenAPI contracts.
- `src/stores/`: Pure client UI state only (Zustand).

## Anti-Patterns

- Writing direct `fetch` calls in leaf components.
- Storing entire database entities in Zustand.
- Circular dependencies between modules.
