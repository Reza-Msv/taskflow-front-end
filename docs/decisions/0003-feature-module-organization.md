# ADR 0003: Feature Module Organization & Three-Layer Composition Architecture

## Status

Accepted (Implemented & Verified)

## Context

As TaskFlow expands with enterprise capabilities (e.g., project boards, knowledge base, team management), the codebase requires a scalable folder organization that prevents monolithic components, avoids circular imports, and clarifies component responsibilities.

We previously identified that domain logic was split across `src/modules/auth/`, route files contained client state, and domain types and services lacked centralized locations.

We must define the architectural layout, codify the three-layer composition pattern, and establish a safe migration path that preserves all existing application behavior.

## Decision

1. **Three-Layer Orchestrator-Component Pattern (Implemented)**:
   - **Layer 1 — Route Handler (`src/app/[locale]/.../page.tsx`)**:
     Thin Server Component responsible for route parameters, metadata, server translations, and loading skeletons. Both Auth and Dashboard workspace routes (`projects/page.tsx`, `board/page.tsx`) are Server Components.
   - **Layer 2 — Page Orchestrator (`src/components/pages/`)**:
     Client orchestrators coordinating filters, dialogs, drawers, layout tabs, and connecting domain state with UI (`LoginPage`, `RegisterPage`, `ProjectsPage`, `ProjectBoardPage`).
   - **Layer 3 — Granular Subcomponents (`src/components/shared/`, `src/components/ui/`, feature subcomponents)**:
     Focused, modular UI subcomponents with single responsibilities.

2. **File Size Guideline (250 Lines Target — Implemented)**:
   - Target maximum of ~250 lines per source file.
   - Modularized candidate components:
     - `src/components/marketing/product-preview-demo.tsx` (reduced from 414 to 128 lines via `demo-data.ts`, `demo-board-view.tsx`, `demo-list-view.tsx`, and `demo-overview-view.tsx`).
     - `src/components/marketing/hero-section.tsx` (reduced from 287 to 162 lines via `hero-mockup.tsx`).
     - `src/modules/auth/components/register-form.tsx` (reduced to 252 lines via `auth-error-banner.tsx`).
   - All source code files in `src/` now comply with the maintainability threshold.

3. **Controlled Barrel Exports (Implemented)**:
   - `src/components/pages/index.ts` provides clean external consumer imports for all page orchestrators.
   - Deep nested barrel re-exports and circular dependency chains are strictly forbidden.

4. **Centralized Types & Services with Bridge Exports (Implemented)**:
   - Domain interfaces are centralized in `src/types/auth.ts`.
   - Domain API services are centralized in `src/services/auth-service.ts`.
   - `src/modules/auth/` maintains non-breaking bridge re-exports to preserve existing imports without disruption.

## Consequences

### Positive

- **Predictable Structure**: Clear location for every concern (routing vs. orchestration vs. leaf UI vs. API service).
- **Safe Evolutionary Refactoring**: Existing production flows continue uninterrupted while providing a clear standard for upcoming feature development.
- **Maintainable Scale**: All source files satisfy the ~250 line maintainability target.

### Trade-offs & Mitigations

- Non-breaking aliases in `src/modules/auth/` remain active to ensure zero regressions across external references; documented in `docs/architecture.md`.
