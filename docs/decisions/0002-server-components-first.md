# ADR 0002: Server Components First & Client Boundary Isolation

## Status

Accepted

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

3. **Client Boundary Isolation Pattern**:
   - Feature page routes (e.g., `src/app/[locale]/register/page.tsx`) remain thin Server Components that render a dedicated client-side orchestrator (e.g., `RegisterPage` from `src/components/pages/register-page.tsx`) or domain form.
   - Route protection and session verification are encapsulated within client guards (e.g., `<ProtectedRoute>` and `<GuestGuard>`) without converting the outer root layout into a client component.

4. **Rule of Preservation**:
   - Never remove `"use client"` from a working component without verifying that it contains zero hooks, event handlers, or browser APIs.

## Consequences

### Positive

- **Reduced Bundle Footprint**: Server component code, markdown parsers, and server-side utilities are excluded from the client JavaScript bundle.
- **Improved Performance**: Faster hydration and immediate rendering of static structural elements.
- **Clear Separation**: Server data retrieval and client state orchestration remain cleanly demarcated.

### Trade-offs & Mitigations

- Developers must understand the serialization boundary (props passed from Server Components to Client Components must be serializable).
- Client providers (theme, auth, toast notifications) must be encapsulated in thin wrapper components mounted in the root layout.
