# ADR 0002: Server Components First & Client Boundary Isolation

## Status

Accepted (Implemented & Verified)

## Context

Next.js App Router provides React Server Components (RSC) as the default execution model. Prematurely marking route handlers or layout files with `"use client"` forces the entire subtree into the client bundle, ballooning bundle size, degrading First Contentful Paint (FCP) and Time to Interactive (TTI), and preventing server-side streaming and SEO optimization.

TaskFlow requires clear rules on where server/client boundaries must be drawn.

## Decision

We enforce a **Server Components First** architectural model across all routes:

1. **Server Components by Default**:
   - Every `page.tsx`, `layout.tsx`, `loading.tsx`, and `error.tsx` file must be a Server Component unless interactive features at the route root strictly require client-side execution.
   - Server Components handle server-side translations, OpenGraph metadata generation, server prefetching, and structural layout composition.

2. **Push `"use client"` to the Leaves**:
   - Add `"use client"` only to components that require:
     - React hooks (`useState`, `useEffect`, `useCallback`, `useContext`, etc.).
     - Browser-only APIs (`window`, `localStorage`, `document`, events).
     - User interactions (forms, buttons with click handlers, modal triggers, drag-and-drop).
   - Keep client boundaries as close to the interactive leaf node as practical.

3. **Client Boundary Isolation Pattern (Implemented)**:
   - **Authentication Routes**: `src/app/[locale]/login/page.tsx` and `src/app/[locale]/register/page.tsx` are thin Server Components that render `LoginPage` and `RegisterPage` client orchestrators from `src/components/pages/`.
   - **Dashboard Routes**: `src/app/[locale]/(dashboard)/projects/page.tsx` and `src/app/[locale]/(dashboard)/projects/[projectId]/board/page.tsx` are thin Server Components that render `ProjectsPage` and `ProjectBoardPage` client orchestrators from `src/components/pages/`.
   - Route protection and session verification are encapsulated within client guards (e.g., `<ProtectedRoute>` and `<GuestGuard>`) without converting outer layout trees into client components.

4. **Rule of Preservation**:
   - Never remove `"use client"` from a working component without verifying that it contains zero hooks, event handlers, or browser APIs.

## Consequences

### Positive

- **Reduced Bundle Footprint**: Server component code, markdown parsers, and server-side utilities are excluded from the client JavaScript bundle.
- **Improved Performance**: Faster hydration and immediate rendering of static structural elements.
- **Clear Separation**: Server data retrieval and client state orchestration remain cleanly demarcated across both public marketing, auth, and dashboard workspace routes.

### Trade-offs & Mitigations

- Developers must understand the serialization boundary (props passed from Server Components to Client Components must be serializable).
- Client providers (theme, auth, toast notifications) must be encapsulated in thin wrapper components mounted in the root layout.
