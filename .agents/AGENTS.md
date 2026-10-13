# Frontend Agent Operating Guidelines

This frontend repository follows strict enterprise modular architecture standards. All contributors and AI agents must follow these rules.

## Core Rules

1. **Mandatory Testing after Every Change**:
   - Write unit or component tests in `*.test.ts` or `*.test.tsx` alongside any new or changed code.
   - Run and verify tests using `pnpm run test` before completing any task.
2. **Commit Conventions**:
   - Follow Conventional Commits format enforced by `commitlint.config.mjs`.
3. **Three-Tier Architecture**:
   - `src/app/`: Thin route orchestrators only.
   - `src/components/pages/`: Page composition and layout orchestrators.
   - `src/modules/`: Domain UI components and forms.
   - `src/components/ui/`: Accessible shadcn/ui primitives.
4. **Contract Synchronization**:
   - Never write bespoke TypeScript interfaces for backend responses.
   - Synchronize from `http://localhost:8000/api/v1/openapi.json` into `src/services/generated/api-types.ts`.
5. **Code Quality**:
   - Format with `pnpm run format` (Prettier + Tailwind plugin).
   - Check with `pnpm run lint` (ESLint) and `pnpm run type-check` (tsc).
   - Ensure EditorConfig rules (`.editorconfig`) are honored.
6. **Design System & Taste**:
   - Build cohesive, restrained, premium UI using established Tailwind tokens.
   - Avoid generic AI dashboard clichés (unnecessary heavy purple gradients, emoji icons as navigation icons, cluttered cards).
   - Ensure clear loading, empty, and error states for all asynchronous components.

## Skills Reference

Skills are located in `.agents/skills/`:

- `frontend-architecture`: Enforces modular folder boundaries.
- `nextjs`: Next.js 14 App Router patterns.
- `react`: React component standards, hooks, and performance.
- `typescript`: Strict typing rules and contract generation.
- `accessibility`: WCAG 2.1 AA keyboard and contrast rules.
- `frontend-performance`: Bundle size, code-splitting, Core Web Vitals.
- `taste-skill`: Design aesthetics and visual polish.
- `ui-ux-pro-max`: Interaction guidelines, tables, density, and forms.
