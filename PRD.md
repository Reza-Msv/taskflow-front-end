# Product Requirements Document (PRD) — TaskFlow Frontend App

**Application:** `taskflow-front-end`  
**Architecture:** Next.js 14 App Router, TypeScript strict mode, Tailwind CSS, shadcn/ui, Zustand, TanStack Query, next-intl  
**Version:** 1.0.0-draft  
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
3. **Server State vs UI State Separation**: Server-side data is managed by `@tanstack/react-query` or native React Server Components. `Zustand` is reserved strictly for local transient client state (e.g. sidebar toggle, board filter preferences).
4. **Three-Tier Component Hierarchy**:
   - `src/app/`: Route segments and thin orchestrators.
   - `src/components/pages/`: Page orchestrators.
   - `src/modules/`: Domain UI modules (`projects/`, `work-items/`, `scrum/`).
   - `src/components/ui/`: Headless design primitives (shadcn/ui).

---

## 2. Key Modules & Views

### 2.1 Authentication & Onboarding (`src/modules/auth`)

- Login with session/cookie handling.
- Invitation token acceptance screen (`/invite/[token]`).
- Password reset workflows.

### 2.2 Organization & Project Shell (`src/components/shared`)

- Global collapsible sidebar with multi-tenant organization switcher.
- Breadcrumb navigation and project context header.
- User profile menu and dark/light theme toggle.

### 2.3 Work Items & Kanban Board (`src/modules/work-items`, `src/modules/boards`)

- Column-based boards mapped to workflow states (`todo`, `in_progress`, `done`).
- Optimistic drag-and-drop state updates with automatic rollback on server error.
- Work item detail drawer with Markdown comments, labels, assignees, and real-time activity feed.

### 2.4 Scrum Management (`src/modules/scrum`)

- Backlog refinement view with item re-ordering and estimation badges.
- Active sprint view with sprint goal, remaining days, and burndown chart.
- Sprint completion modal with carry-over choices for incomplete items.

---

## 3. UI/UX Standards

- Accessible keyboard navigation (WCAG 2.1 AA compliant).
- Dark/light mode support using Tailwind CSS variables.
- Responsive design tailored for high-density desktop workflows and mobile inspections.
