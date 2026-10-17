# TaskFlow Frontend

> Enterprise work and project management UI built with Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, shadcn/ui, next-themes, Magic UI, TanStack Query, Zustand, Vitest, and next-intl.

## Features

- **Modern App Router Architecture**: Fast server components with minimal client bundle overhead.
- **Authentication & Session Security**:
  - Secure HttpOnly cookie session handling (`taskflow_session`) via credentialed requests (`credentials: "include"`).
  - Zero sensitive tokens or passwords stored in `localStorage` or `sessionStorage`.
  - Professional, responsive Login and Registration views with React Hook Form and Zod validation.
  - Route-level protection (`ProtectedRoute`) with accessible loading skeletons and open-redirect defense.
  - User profile menu in header with one-click logout action.
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
- **Automated Testing Suite**: Fast, reliable unit & component tests using **Vitest** and **React Testing Library** (58 passing tests).
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

Ensure `NEXT_PUBLIC_API_BASE_URL` points to your backend instance (default: `http://localhost:8000`).

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

## Documentation

- [`docs/design-system.md`](docs/design-system.md): Colors, typography, spacing, and button specifications.
- [`docs/frontend-architecture.md`](docs/frontend-architecture.md): Three-tier composition guidelines and module boundaries.
- [`docs/frontend-api-integration.md`](docs/frontend-api-integration.md): API client conventions and error handling.
- [`docs/auth-backend-contract-status.md`](docs/auth-backend-contract-status.md): Authentication endpoints, cookie specifications, and contract integration status.
- [`CHANGELOG.md`](CHANGELOG.md): Record of project evolution and milestones.

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
