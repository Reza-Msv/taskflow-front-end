# Frontend Agent Operating Guidelines

This frontend repository follows strict enterprise modular architecture standards. All contributors and AI agents must follow these rules.

## Core Rules

1. **Mandatory Testing after Every Change**:
   - Write unit or component tests in `*.test.ts` or `*.test.tsx` alongside any new or changed code.
   - Run and verify tests using `pnpm run test` before completing any task.
2. **Commit Conventions**:
   - Follow Conventional Commits format enforced by `commitlint.config.mjs`.
3. **Architectural Pillars**:
   - **Functional Programming / Zero OOP**: Prefer plain functions, closures, and plain-object service exports. Avoid custom classes (exception: extending `Error`).
   - **Three-Layer Architecture**: Route Handlers (`src/app/`), Page Orchestrators (`src/components/pages/`), Granular Subcomponents (`src/components/shared/`, `src/components/ui/`).
   - **Server Components First**: Keep `page.tsx` and `layout.tsx` as Server Components by default; isolate `"use client"` to interactive leaves.
   - **Cookie-Based Sessions**: Fast-API backend manages session via `taskflow_session` HttpOnly cookie. Validate session with `GET /api/v1/auth/me`.
4. **Contract Synchronization**:
   - Never write bespoke TypeScript interfaces for backend responses.
   - Synchronize from `http://localhost:8000/api/v1/openapi.json` into `src/services/generated/api-types.ts`.
5. **Code Quality**:
   - Format with `pnpm run format` (Prettier + Tailwind plugin).
   - Check with `pnpm run lint` (ESLint) and `pnpm run type-check` (tsc).
   - Adhere to the ~250 lines per file maintainability guideline.
6. **Design System & Taste**:
   - Build cohesive, restrained, premium UI using established Tailwind tokens.
   - Avoid generic AI dashboard clichés (unnecessary heavy purple gradients, emoji icons as navigation icons, cluttered cards).
   - Ensure clear loading, empty, and error states for all asynchronous components.

## Authoritative Documentation Reference

- Comprehensive Architecture: [`docs/architecture.md`](../docs/architecture.md)
- Development Guidelines: [`docs/frontend-guidelines.md`](../docs/frontend-guidelines.md)
- ADR 0001 (Functional Architecture): [`docs/decisions/0001-functional-architecture.md`](../docs/decisions/0001-functional-architecture.md)
- ADR 0002 (Server Components First): [`docs/decisions/0002-server-components-first.md`](../docs/decisions/0002-server-components-first.md)
- ADR 0003 (Feature Module Organization): [`docs/decisions/0003-feature-module-organization.md`](../docs/decisions/0003-feature-module-organization.md)
- API Integration & Contracts: [`docs/frontend-api-integration.md`](../docs/frontend-api-integration.md)
- Design System: [`docs/design-system.md`](../docs/design-system.md)

## Skills Reference

Skills are located in `.agents/skills/`:

- `frontend-architecture`: Enforces modular folder boundaries and three-layer pattern.
- `nextjs`: Next.js 14/16 App Router patterns.
- `react`: React component standards, hooks, and performance.
- `typescript`: Strict typing rules and contract generation.
- `accessibility`: WCAG 2.1 AA keyboard and contrast rules.
- `frontend-performance`: Bundle size, code-splitting, Core Web Vitals.
- `taste-skill`: Design aesthetics and visual polish.
- `ui-ux-pro-max`: Interaction guidelines, tables, density, and forms.
