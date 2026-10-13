# TaskFlow Frontend

> Enterprise work and project management UI built with Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, shadcn/ui, next-themes, Magic UI, TanStack Query, Zustand, Vitest, and next-intl.

## Features

- **Modern App Router Architecture**: Fast server components with minimal client bundle overhead.
- **TaskFlow Design Token System**: Unified color, surface, and elevation tokens built around **Near Black (`#111111`)** and **Task Orange (`#FF6A00`)**.
- **Three-Layer UI System**:
  - **shadcn/ui**: Accessible, headless core primitives (`Button`, `Card`, `Input`, `Dialog`, `Sheet`, `Table`, `Badge`, `Avatar`).
  - **next-themes**: Seamless Light, Dark, and System theme synchronization with zero hydration flash.
  - **Magic UI**: Restrained, accessible effects (`AnimatedGridPattern`, `BentoGrid`, `NumberTicker`) strictly reserved for public marketing/landing sections.
- **Contract-First Typing**: Strongly typed API client generated directly from FastAPI OpenAPI schema.
- **Responsive Workspace**:
  - Persistent 240px desktop sidebar with 68px collapsed mode.
  - Compact mobile header and accessible slide-out Sheet drawer (`min(320px, 85vw)`).
  - Responsive multi-column Kanban board with mobile column tab selectors.
- **Dual Operating Modes**: Full support for both Scrum sprints and Kanban flow.
- **Automated Testing Suite**: Fast, reliable unit & component tests using **Vitest** and **React Testing Library**.
- **Code Quality & Consistency**: Enforced via **ESLint**, **Prettier** (with Tailwind sorting), **EditorConfig**, and **Commitlint**.
- **Internationalization (i18n)**: Out-of-the-box English (LTR) and Persian (RTL) support.

---

## Getting Started

### 1. Prerequisites

- Node.js 18+ (Node 22 recommended)
- `pnpm` (v9 or v10) or `npm`

### 2. Installation

```bash
pnpm install
```

### 3. Environment Configuration

```bash
cp .env.example .env.local
```

### 4. Running the Dev Server

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### 5. Synchronizing Backend API Types

Ensure the backend API is running on `http://localhost:8000`, then run:

```bash
pnpm run generate:api
```

This generates `src/services/generated/api-types.ts`.

---

## Design System Documentation

Refer to [`docs/design-system.md`](file:///Users/reza/Desktop/taskflow-project/taskflow-front-end/docs/design-system.md) for full specifications:

- **Brand & Theme Tokens**: Backgrounds, surfaces, cards, and borders in Light and Dark modes.
- **Button Standards**: Primary (`#FF6A00`), Secondary, Outline, Ghost, and Destructive specifications.
- **Typography & 4px Spacing Grid**: Font scales, responsive clamp rules, and padding standards.
- **Elevation & Radius Rules**: 8px (inputs/buttons), 12px (cards), 16px (dialogs).
- **Status & Kanban Colors**: Rail indicator colors for Kanban workflow columns (`backlog`, `todo`, `inprogress`, `inreview`, `done`, `blocked`).

---

## Quality & Testing Commands

```bash
# Run tests with Vitest (Mandatory after every change)
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run tests with code coverage report
pnpm run test:coverage

# Lint with ESLint
pnpm run lint
pnpm run lint:fix

# Format with Prettier
pnpm run format
pnpm run format:check

# Type check TypeScript
pnpm run type-check

# Production build
pnpm run build
```
