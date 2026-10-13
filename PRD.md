# Product Requirements Document (PRD) — TaskFlow Frontend App

**Application:** `taskflow-front-end`  
**Architecture:** Next.js 16 App Router (with React 19), TypeScript strict mode, Tailwind CSS, shadcn/ui, next-themes, Magic UI, Zustand, TanStack Query, next-intl  
**Version:** 1.0.0-baseline  
**Status:** Design System & UI Architecture Verified  
**AI Dependency:** Strictly Out of Scope

---

## 1. Executive Summary & Purpose

`taskflow-front-end` provides the enterprise user interface for TaskFlow. Designed for high operational density, speed, accessibility, and visual polish, it delivers:

- Fast task inspection and Kanban card transitions.
- Sprint planning, backlog refinement, and burndown visualizations.
- Organization and project management dashboards.
- Multi-language support (English and Persian with complete RTL layout).

### Core Architectural Rules:

1. **Contract-First Synchronization**: All API shapes and DTOs are generated via `pnpm run generate:api` from backend OpenAPI 3.1. No hand-written mock types.
2. **Authoritative Backend Security**: The frontend displays permission hints (disabling unauthorized buttons), but the backend remains the sole authoritative gatekeeper.
3. **Server State vs UI State Separation**: Server-side data is managed by `@tanstack/react-query` or native React Server Components. `Zustand` is reserved strictly for local transient client state (e.g. sidebar toggle in `ui-store.ts`, board filter preferences).
4. **Three-Tier Component Hierarchy**:
   - `src/app/`: Route segments and thin orchestrators.
   - `src/components/pages/`: Page orchestrators.
   - `src/modules/`: Domain UI modules (`projects/`, `work-items/`, `scrum/`).
   - `src/components/shared/`: Cross-feature UI blocks (`AppSidebar`, `AppHeader`, `ProjectCard`, `TaskCard`, `KanbanBoard`, `FilterBar`, `ConfirmDialog`).
   - `src/components/ui/`: Headless design primitives (shadcn/ui).
5. **Three-Layer UI System**:
   - **Layer 1 (shadcn/ui)**: Standard accessible UI building blocks.
   - **Layer 2 (next-themes)**: Fluid Dark, Light, and System theme switching without hydration flash.
   - **Layer 3 (Magic UI)**: Subdued, selective animations reserved strictly for public marketing sections.

---

## 2. Key Modules & Views

### 2.1 Authentication & Onboarding (`src/modules/auth`)

- Login with session/cookie handling.
- Invitation token acceptance screen (`/invite/[token]`).
- Password reset workflows.

### 2.2 Organization & Project Shell (`src/components/shared`)

- Global responsive sidebar: persistent 240px desktop mode, collapsible to 68px, and accessible mobile Sheet drawer (`min(320px, 85vw)`).
- Application header: 56px height, theme toggle, mobile drawer trigger, global search, and notification indicators.
- User profile menu and dark/light theme toggle.

### 2.3 Work Items & Kanban Board (`src/modules/work-items`, `src/modules/boards`, `src/components/shared`)

- Column-based boards mapped to workflow states (`todo`, `inprogress`, `inreview`, `done`).
- Multi-column desktop grid with responsive mobile column tab switcher to prevent horizontal page overflow.
- Distinct status rail indicator on task cards (`TaskCard`) using semantic tokens rather than filling entire card backgrounds.
- Work item detail drawer with Markdown comments, labels, assignees, and real-time activity feed.

### 2.4 Scrum Management (`src/modules/scrum`)

- Backlog refinement view with item re-ordering and estimation badges.
- Active sprint view with sprint goal, remaining days, and burndown chart.
- Sprint completion modal with carry-over choices for incomplete items.

---

## 3. Current Implementation Status

| Feature / Domain        | Status       | Details                                                                                 |
| ----------------------- | ------------ | --------------------------------------------------------------------------------------- |
| **Design Token System** | **Complete** | Centralized in `globals.css` with Near Black (`#111111`) & Task Orange (`#FF6A00`)      |
| **Theme Engine**        | **Complete** | `next-themes` (0.4.6) supporting Light, Dark, System, zero hydration warning            |
| **Responsive Shell**    | **Complete** | `AppSidebar` (240px/68px), `AppHeader` (56px), mobile Sheet drawer (`min(320px, 85vw)`) |
| **Button System**       | **Complete** | Primary 40px/8px, Secondary, Outline, Ghost, Destructive, Loading, Focus ring           |
| **Board & Projects UI** | **Complete** | Responsive `KanbanBoard`, `ProjectCard`, `TaskCard`, `FilterBar`                        |
| **Runtime & Framework** | **Complete** | Next.js 16.4.0, React 19.3.0, TypeScript 7.0.2, Tailwind CSS 3.4.19                     |
| **Test & Validation**   | **Complete** | Vitest (7 passing tests), TypeScript strict (0 errors), Next build (passing)            |
