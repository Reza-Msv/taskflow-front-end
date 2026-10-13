# TaskFlow Frontend

> Enterprise work and project management UI built with Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Zustand, Vitest, and next-intl.

## Features
- **Modern App Router Architecture**: Fast server components with minimal client bundle overhead.
- **Contract-First Typing**: Strongly typed API client generated directly from FastAPI OpenAPI schema.
- **Accessible Design Primitives**: Built on top of Radix UI and shadcn/ui.
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
