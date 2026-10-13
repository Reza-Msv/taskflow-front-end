# Frontend Architecture & Composition Guide

## Three-Tier Composition

TaskFlow views follow a strict 3-tier layering:

1. **Route Level (`src/app/[locale]/...`)**:
   - Manages URL parameters, dynamic routing, metadata, and loading skeletons.
2. **Page Orchestrator Level (`src/components/pages/...`)**:
   - Coordinates filters, tab selections, and sub-module layouts.
3. **Domain Modules (`src/modules/...`)**:
   - Self-contained UI components (e.g., `modules/work-items/task-card.tsx`).

## Design Tokens & Theme

All styles inherit from CSS custom variables configured in `src/styles/globals.css`. Support for both light and dark modes is automatic via Tailwind `dark:` variants.
