# ADR 0003: Feature Module Organization & Three-Layer Composition Architecture

## Status

Accepted

## Context

As TaskFlow expands with enterprise capabilities (e.g., project boards, knowledge base, team management), the codebase requires a scalable folder organization that prevents monolithic components, avoids circular imports, and clarifies component responsibilities.

Currently, the repository implements features across:

- `src/modules/auth/`: Encapsulating auth components, context, schemas, services, and types.
- `src/components/pages/`: Containing page-level orchestrators (`projects-page.tsx`, `project-board-page.tsx`).
- `src/components/shared/`: Containing shared workspace items (`kanban-board.tsx`, `task-card.tsx`, `app-header.tsx`, `app-sidebar.tsx`).
- `src/components/ui/`: Atomic shadcn/ui primitives.
- `src/services/`: Shared HTTP clients (`api-client.ts`) and generated OpenAPI typings (`api-types.ts`).

We must define the target architectural layout, codify the three-layer composition pattern, and establish a safe migration path that preserves all existing application behavior.

## Decision

1. **Three-Layer Orchestrator-Component Pattern**:
   For all new and migrated features, code is organized into three distinct layers:
   - **Layer 1 — Route Handler (`src/app/[locale]/.../page.tsx`)**:
     Thin Server Component responsible for route parameters, metadata, server translations, and loading skeletons.
   - **Layer 2 — Page Orchestrator (`src/components/pages/<domain>/<feature>-page.tsx`)**:
     Client or composite component orchestrating filters, dialogs, drawers, layout tabs, and connecting domain state with UI.
   - **Layer 3 — Granular Subcomponents (`src/components/pages/<domain>/...` or domain blocks)**:
     Focused, modular UI subcomponents (tables, filter bars, upload dialogs, detail cards) with single responsibilities.

2. **File Size Guideline (250 Lines Target)**:
   - Target maximum of ~250 lines per source file (excluding generated types and tests).
   - This guideline is a maintainability goal for new components. Existing files that exceed this target must not be prematurely refactored unless accompanied by dedicated regression tests.

3. **Controlled Barrel Exports**:
   - Feature directories may provide an `index.ts` for clean external consumer imports.
   - Deep nested barrel re-exports and circular dependency chains are strictly forbidden.

4. **Coexistence & Safe Migration Strategy**:
   - **Zero Regressions Rule**: Existing implementations in `src/modules/auth/` remain active and fully tested.
   - **Bridge Exports**: When domain services or types are migrated toward centralized locations (`src/services/`, `src/types/`), backward-compatible re-exports will be maintained to avoid breaking existing import paths.
   - **Target Architecture Alignment**: Future modules (e.g., enterprise knowledge base, analytics) must follow the target directory structure directly:
     ```text
     src/
     ├── app/[locale]/(web)/(dashboard)/...
     ├── components/
     │   ├── pages/
     │   │   └── <domain>/
     │   │       ├── <feature>-page.tsx
     │   │       ├── <feature>-filters.tsx
     │   │       └── index.ts
     │   ├── shared/
     │   └── ui/
     ├── services/
     ├── stores/
     ├── lib/
     └── types/
     ```

## Consequences

### Positive

- **Predictable Structure**: Clear location for every concern (routing vs. orchestration vs. leaf UI vs. API service).
- **Safe Evolutionary Refactoring**: Existing production flows continue uninterrupted while providing a clear standard for upcoming feature development.
- **Maintainable Scale**: 250-line target keeps code reviews focused and prevents god-components.

### Trade-offs & Mitigations

- Dual presence of `src/modules/` (existing auth domain) and `src/components/pages/` during the transition period; documented with explicit migration stages in `docs/architecture.md`.
