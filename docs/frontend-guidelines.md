# TaskFlow Frontend Development Guidelines

This document establishes the mandatory engineering standards, file conventions, state management rules, and quality practices for all developers and AI agents working on the TaskFlow frontend repository.

---

## 1. Coding Standards & Functional Architecture

TaskFlow enforces a functional programming approach across the entire frontend:

### Functional Composition

- **Zero Custom Classes**: Prohibit the use of `class`, custom OOP controllers, singletons, and inheritance hierarchies.
- **Plain-Object Service Exports**: Group related API and domain methods as plain objects containing pure or asynchronous functions:
  ```typescript
  // Preferred pattern (src/services/auth-service.ts)
  export const authService = {
    login,
    register,
    getCurrentUser,
    logout,
  };
  ```
- **Factory Functions**: Use factory functions instead of class builders for creating dynamic configurations or models.
- **Pure Transformations**: Isolate data mapping and calculation logic into pure, testable functions with zero side effects.
- **Legitimate Exceptions**: Custom error classes that extend the JavaScript `Error` (such as `ApiClientError` in `src/services/api-client.ts`) are allowed to preserve native stack traces and `instanceof` checks.

---

## 2. File Organization & 250-Line Maintainability Target

To keep code reviews efficient and maintain high readability:

- **Maximum File Size Target**: Source code files should aim for a maximum of **~250 lines** (excluding generated contracts and test suites).
- **Maintainability Target, Not Dogma**: Do not prematurely fragment cohesive logic into unnatural one-line micro-files.
- **Decomposition Best Practices**:
  The following files were previously over 250 lines and have been decomposed into focused subcomponents:
  1. `src/components/marketing/product-preview-demo.tsx`: Reduced from 414 to 128 lines by extracting `demo-data.ts`, `demo-board-view.tsx`, `demo-list-view.tsx`, and `demo-overview-view.tsx`.
  2. `src/components/marketing/hero-section.tsx`: Reduced from 287 to 162 lines by extracting `hero-mockup.tsx`.
  3. `src/modules/auth/components/register-form.tsx`: Reduced to 252 lines by extracting `auth-error-banner.tsx`.

### Three-Layer Structure

1. **Route Handlers (`src/app/`)**: Thin Server Components for URL routing, metadata, and data prefetching. Never embed client state (`useState`, `useEffect`) directly in route handlers.
2. **Page Orchestrators (`src/components/pages/`)**: Composition wrappers coordinating filters, drawers, dialogs, and hooks. Exported via `src/components/pages/index.ts`.
3. **Subcomponents (`src/components/shared/` & `src/components/ui/`)**: Single-responsibility visual components built on shadcn/ui.

---

## 3. TypeScript Strictness & API Contracts

- **No `any`**: The use of `any` is strictly prohibited. Use `unknown` with runtime type narrowing or Zod schemas.
- **Centralized Types**: Domain models reside in `src/types/` (e.g. `src/types/auth.ts`).
- **OpenAPI Single Source of Truth**:
  Synchronize contracts from the running FastAPI backend using:
  ```bash
  pnpm run generate:api
  ```
  Generated typings reside in `src/services/generated/api-types.ts`. Never manually duplicate backend response interfaces.
- **Discriminated Unions**: Represent multi-state views (e.g., `idle | loading | success | error`) using tagged unions for exhaustive pattern matching.
- **Strict Null Checks**: Always handle optional properties explicitly.

---

## 4. State Management Guidelines

| State Scope                | Recommended Mechanism           | Usage Guidelines                                                                         |
| :------------------------- | :------------------------------ | :--------------------------------------------------------------------------------------- |
| **Server State**           | Server Components / Fetch       | Direct async data retrieval in Server Components or dedicated service calls.             |
| **Global Client UI State** | Zustand (`src/stores/`)         | Ephemeral UI state such as open drawers, global search palette, or active panel toggles. |
| **Feature / Form State**   | React Hook Form & React Context | Form inputs, step wizards, and auth session state.                                       |
| **Local State**            | React `useState` / `useReducer` | Component-scoped toggles, tooltips, and disclosure states.                               |

> [!CAUTION]
> **Anti-Pattern**: Never store full database entities or duplicate entire backend collections in Zustand. Keep client stores focused strictly on client UI state.

---

## 5. Accessibility (WCAG 2.1 AA) & Design System Polish

### Accessibility Requirements

- **Keyboard Navigation**: Every interactive control must be focusable via `Tab` and actionable with `Enter` or `Space`.
- **Focus Rings**: Standardized accessible 2px focus ring (`focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`).
- **Semantic HTML**: Use native semantic elements (`<nav>`, `<header>`, `<main>`, `<article>`, `<button>`) instead of nested `<div>` wrappers.
- **ARIA Attributes**: Apply `aria-label`, `aria-expanded`, and `aria-describedby` where visual context alone is insufficient. Form errors must have `role="alert"`.

### Design System Taste

- **Restrained Visual Aesthetics**: Avoid generic AI dashboard clichés (heavy saturated purple/violet gradients, random emoji icons as navigation icons, overcrowded cards).
- **Semantic Tokens**: Always use semantic Tailwind classes (`bg-background`, `text-foreground`, `border-border`, `bg-primary`, `text-muted-foreground`). Never hardcode hex codes in components.
- **Async Component States**: Every component that loads asynchronous data must provide:
  1. **Loading State**: Accessible skeleton or spinner preventing layout shift.
  2. **Empty State**: Clear explanation with an actionable next step button.
  3. **Error State**: Non-destructive error message with a retry trigger.

---

## 6. Error Handling & API Resilience

- **ApiClientError Standard**: All backend HTTP failures must throw `ApiClientError` containing HTTP status, backend error code, and request ID.
- **Network Resilience**: When the backend server is unreachable, `apiClient` catches the error and provides a structured `BACKEND_UNAVAILABLE` error object.
- **User Notifications**:
  - Critical form failures: Render an inline accessible alert banner with `role="alert"`.
  - Non-blocking confirmations and minor errors: Trigger `sonner` toast alerts.

---

## 7. Mandatory Verification & Regression Prevention

Every pull request or agent modification must verify all checks before declaring completion:

1. **Unit & Component Tests**:
   ```bash
   pnpm run test
   ```
   Must pass 100% of tests. Any new or modified feature must include corresponding `*.test.ts` or `*.test.tsx` files.
2. **TypeScript Compilation**:
   ```bash
   pnpm run type-check
   ```
   Must compile cleanly with zero errors (`tsc --noEmit`).
3. **Linting & Code Formatting**:
   ```bash
   pnpm run format:check
   ```
   Must conform to Prettier formatting and ESLint rules.
4. **Commit Conventions**:
   Commit messages must strictly adhere to the Conventional Commits specification (e.g., `feat(auth): ...`, `fix(api): ...`, `docs(arch): ...`).
