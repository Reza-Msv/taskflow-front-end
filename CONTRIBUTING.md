# Contributing to TaskFlow Frontend

Welcome! Please review these guidelines before creating components or updating routes.

## 1. Commit Message Conventions

Commit messages must adhere to [Conventional Commits](https://www.conventionalcommits.org/) and are checked by `commitlint`:

```text
<type>(<scope>): <subject>
```

Allowed types:

- `feat`: A new user-facing feature.
- `fix`: A bug fix.
- `test`: Adding or updating tests.
- `docs`: Documentation updates.
- `refactor`: Code change that neither fixes a bug nor adds a feature.
- `style`: Formatting, missing semicolons, etc.
- `perf`: Performance improvements.
- `build`: Changes to build system or dependencies.
- `ci`: CI configuration changes.
- `chore`: Routine tasks and maintenance.

---

## 2. Mandatory Testing Rule with Vitest

> [!IMPORTANT]
> **Every feature or bugfix MUST include automated tests using Vitest & React Testing Library.**
> After ANY code change, run and verify the test suite:
>
> ```bash
> pnpm run test
> ```
>
> Do not mark tasks complete or open PRs without passing tests.

---

## 3. Formatting, Linting & EditorConfig

- Code style is managed by **Prettier** (`.prettierrc`) with the Tailwind CSS sorting plugin.
- Code quality is enforced by **ESLint** (`.eslintrc.json`) extending Next.js core web vitals and Prettier compatibility.
- Consistent whitespace and character encodings are preserved by `.editorconfig`.

To format and lint your changes:

```bash
pnpm run format
pnpm run lint
```

---

## 4. Component, Design Tokens & State Architecture

- **3-Layer UI Composition**:
  - **Layer 1 (shadcn/ui)**: Reusable accessible primitives (`Button`, `Input`, `Card`, `Dialog`, `Sheet`, `Table`, `Badge`, `Avatar`).
  - **Layer 2 (next-themes)**: Smooth Light, Dark, and System theme switching without hydration flash.
  - **Layer 3 (Magic UI)**: Subdued, purposeful landing page effects (`AnimatedGridPattern`, `BentoGrid`, `NumberTicker`) with `prefers-reduced-motion` compliance.
- **Server Components by Default**: Place `"use client"` only at interactive boundaries (e.g., form fields, modals, interactive boards).
- **Design Tokens & No Hardcoded Colors**: Always consume semantic tokens (`bg-background`, `text-foreground`, `bg-card`, `border-border`, `bg-primary`, `text-primary-foreground`, `ring-ring`). Never hardcode hex colors.
- **No Hand-Crafted API Types**: Always use `pnpm run generate:api` to derive types from backend OpenAPI contracts.
- **Store Boundaries**:
  - `stores/`: Reserved for local client UI states only (e.g. sidebar collapse in `ui-store.ts`, selected rows).
  - Server state MUST use `@tanstack/react-query` or server components. Do not duplicate API data into global stores.

---

## 5. PR Review Checklist

Before opening a pull request:

- [ ] Run `pnpm run test` (All Vitest suites pass)
- [ ] Run `pnpm run type-check` (0 errors)
- [ ] Run `pnpm run lint` (0 warnings or errors)
- [ ] Run `pnpm run format:check` (Properly formatted)
- [ ] Run `pnpm run build` (Production build succeeds)
- [ ] Verify accessibility: forms have accessible labels, buttons have keyboard focus indicators (`focus-visible:ring-2`)
- [ ] Verify both Light and Dark modes render correctly without contrast defects
- [ ] Verify both LTR (English) and RTL (Persian) views layout properly
