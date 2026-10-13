# Frontend Architecture & Composition Guide

## 1. Three-Tier Composition Pattern

TaskFlow views follow a strict 3-tier layering to maintain clean separation of concerns and maintainability:

1. **Route Level (`src/app/[locale]/...`)**:
   - Manages URL parameters, dynamic routing, metadata, and loading skeletons.
   - Leverages Server Components by default.
2. **Page Orchestrator Level (`src/components/pages/...` or route views)**:
   - Coordinates filters, tab selections, dialog states, and sub-module layouts.
3. **Domain Modules & Shared Product Components (`src/modules/...`, `src/components/shared/...`)**:
   - Reusable domain blocks (e.g., `ProjectCard`, `TaskCard`, `KanbanBoard`, `FilterBar`, `AppSidebar`, `AppHeader`).
   - Built on top of headless accessible primitives in `src/components/ui/`.

---

## 2. The 3-Layer UI Component Architecture

To guarantee consistency, performance, and accessibility, components are grouped into three distinct architectural layers:

```
+-------------------------------------------------------+
|                TaskFlow Design System                 |
|       Colors · Typography · Spacing · Radius · CSS    |
+-------------------------------------------------------+
   |                        |                        |
   v                        v                        v
[ Layer 1: shadcn/ui ]  [ Layer 2: next-themes ] [ Layer 3: Magic UI ]
Core Primitives        Theme Management         Selective Effects
(Button, Card, Form...) (Light / Dark / System)  (Landing Hero, Bento)
   \                        |                        /
    +-----------------------+-----------------------+
                            |
                            v
               [ Application Components ]
   (ProjectCard, TaskCard, ScrumBoards, DataTables...)
```

- **Layer 1 (shadcn/ui Primitives)**:
  - Accessible, customizable components (`Button`, `Card`, `Input`, `Dialog`, `Sheet`, `Table`, `Badge`, `Avatar`, `Tabs`, `Skeleton`).
  - Governed by CSS variables; never uses hardcoded hex colors.
- **Layer 2 (next-themes Engine)**:
  - Automatic synchronization between Light, Dark, and System preferences.
  - Zero hydration flash via `suppressHydrationWarning` and semantic token binding.
- **Layer 3 (Magic UI Selective Motion)**:
  - Restricted strictly to public marketing and landing pages (`AnimatedGridPattern`, `BentoGrid`, `NumberTicker`).
  - Prohibited in high-density operational dashboard workspaces to maintain speed and focus.
  - Honors `prefers-reduced-motion`.

---

## 3. Design Tokens & Theme Integration

All styles inherit from CSS custom variables configured in `src/styles/globals.css` and exposed via `tailwind.config.ts`.

- **Brand Core**: `Near Black (#111111)` & `Task Orange (#FF6A00)`.
- **Button System**: Standardized 40px height with 8px radius, accessible 2px focus ring (`focus-visible:ring-2`), and dedicated loading spinner behavior preventing duplicate submissions.
- **Responsive Workspace**: Persistent 240px desktop sidebar (collapsible to 68px) and accessible mobile sheet drawer (`min(320px, 85vw)`).

See [`docs/design-system.md`](file:///Users/reza/Desktop/taskflow-project/taskflow-front-end/docs/design-system.md) for full token tables, status colors, and typography scales.
