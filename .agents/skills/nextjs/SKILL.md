---
name: nextjs
description: App router conventions, Server vs Client component boundaries, and layouts.
---

# Next.js App Router Skill

## Rules

1. **Server Components First**: Render components on the server by default. Add `"use client"` only when user interaction (events, state, browser APIs) is required.
2. **Metadata & SEO**: Export descriptive `Metadata` on all pages.
3. **Route Groups**: Group routes logically with `(auth)` and `(dashboard)` without affecting the URL structure.
4. **Error & Loading Boundaries**: Provide `error.tsx` and `loading.tsx` in route segments.
