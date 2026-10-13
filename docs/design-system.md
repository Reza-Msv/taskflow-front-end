# Design System & UI Tokens

## 1. Brand Philosophy & Identity

TaskFlow follows a focused, high-contrast, modern design system built around **Near Black** and **Task Orange**:

- **Brand Core**:
  - `Near Black` (`#111111`): Logo, primary typography, high-priority iconography.
  - `Task Orange` (`#FF6A00`): Primary actions, brand accents, progress indicators, active interactive highlights.
- **Light Mode**: Clean white and soft neutral surfaces (`#FFFFFF`, `#FAFAFA`, `#F5F5F5`).
- **Dark Mode**: Deep black and refined charcoal surfaces (`#111111`, `#151515`, `#1C1C1C`, `#262626`).
- **Accent Stability**: Brand orange remains persistent across both light and dark themes; foregrounds, surface backgrounds, and borders adapt systematically.
- **Strict Consistency**: No ad-hoc or hardcoded hex colors across components; all components derive styling from design tokens.

---

## 2. UI Component Architecture (The 3-Layer System)

TaskFlow interfaces are built upon a strict **3-Layer Composition**:

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

### Layer 1: shadcn/ui (Core Component Library)

- **Forms & Actions**: `Button`, `Input`, `Textarea`, `Select`, `Checkbox`, `Radio Group`, `Switch`, `Label`, `Form`.
- **Content & Data Display**: `Card`, `Badge`, `Avatar`, `Table`, `Skeleton`, `Progress`, `Separator`.
- **Navigation & Layout**: `Sidebar`, `Breadcrumb`, `Tabs`, `Navigation Menu`, `Dropdown Menu`, `Command`.
- **Interactions & Feedback**: `Dialog`, `Alert Dialog`, `Sheet`, `Popover`, `Tooltip`, `Sonner`.
- **Architectural Law**: Custom enterprise features (e.g., Kanban boards) compose these primitives into standardized domain components (`ProjectCard`, `TaskCard`) rather than rebuilding raw card styling inside every page.

### Layer 2: next-themes (Theme Management Engine)

- Zero layout shift or flash of unstyled content via `suppressHydrationWarning` on `<html>`.
- Dynamic color switching governed exclusively by semantic CSS tokens (`bg-background`, `text-foreground`, `border-border`, `bg-card`).
- Automatic synchronization across System preference, Light, and Dark modes.

### Layer 3: Magic UI (Selective & High-Impact Visuals)

- **Target Areas**: Strictly reserved for public Landing Page sections (Hero & feature showcases).
- **Allowed Patterns**:
  - `Animated Grid Pattern`: Subdued background mesh on Hero, low opacity, no visual noise.
  - `Bento Grid`: Feature breakdown displaying product capabilities in varied card formats.
  - `Blur Fade / Text Animate`: Tasteful staggered entrance for the hero headline with `prefers-reduced-motion` fallbacks.
  - `Number Ticker`: Authentic delivery statistics (e.g., closed tickets, uptime metrics).
- **Dashboard Prohibition**: High-density operational dashboards prioritize speed, focus, and low latency. Persistent particle animations and intense layout motion are prohibited in dashboard workspaces.

---

## 2. Core Color Tokens

### 2.1 Brand Base

| Token              | Hex       | HSL Equivalent | Usage                                    |
| ------------------ | --------- | -------------- | ---------------------------------------- |
| `brand-near-black` | `#111111` | `0 0% 6.7%`    | Logos, dark surfaces, high-contrast text |
| `brand-orange`     | `#FF6A00` | `25 100% 50%`  | Primary actions, branding, progress      |

### 2.2 Backgrounds & Surfaces

| Token                       | Light Mode | Dark Mode | Usage                                |
| --------------------------- | ---------- | --------- | ------------------------------------ |
| `background`                | `#FFFFFF`  | `#111111` | Application base background          |
| `foreground`                | `#171717`  | `#F5F5F5` | Default text and primary icons       |
| `card`                      | `#FFFFFF`  | `#1C1C1C` | Cards, panels, elevated sections     |
| `card-foreground`           | `#171717`  | `#F5F5F5` | Text within cards                    |
| `popover`                   | `#FFFFFF`  | `#222222` | Menus, dropdowns, popovers           |
| `popover-foreground`        | `#171717`  | `#F5F5F5` | Text within popovers                 |
| `sidebar`                   | `#FAFAFA`  | `#151515` | Global navigation sidebar background |
| `sidebar-foreground`        | `#262626`  | `#E5E5E5` | Sidebar navigation labels and icons  |
| `sidebar-active`            | `#FFF0E6`  | `#332116` | Active navigation item background    |
| `sidebar-active-foreground` | `#9A3412`  | `#FF8533` | Active navigation item text/icon     |

### 2.3 Secondary Surfaces & Typography

| Token                  | Light Mode | Dark Mode | Usage                                             |
| ---------------------- | ---------- | --------- | ------------------------------------------------- |
| `secondary`            | `#F5F5F5`  | `#262626` | Secondary button and pill backgrounds             |
| `secondary-foreground` | `#262626`  | `#F5F5F5` | Secondary text                                    |
| `muted`                | `#F5F5F5`  | `#262626` | Disabled states, subtle section fills             |
| `muted-foreground`     | `#737373`  | `#A3A3A3` | Captions, metadata, helper text                   |
| `accent`               | `#FFF0E6`  | `#332116` | Highlighted subtle pills and active item backings |
| `accent-foreground`    | `#9A3412`  | `#FF8533` | Text on subtle accent pills                       |
| `subtle`               | `#FAFAFA`  | `#181818` | Ultra-subtle table headers and zebra strips       |
| `placeholder`          | `#A3A3A3`  | `#737373` | Form inputs placeholder text                      |
| `inverse`              | `#171717`  | `#F5F5F5` | Inverted surface backing                          |
| `inverse-foreground`   | `#FFFFFF`  | `#111111` | Inverted foreground text                          |

---

## 3. Button Component Specifications

TaskFlow implements five standardized button variants:

### 3.1 Primary Button (`variant="default"`)

Used for critical actions: **Create project**, **Add task**, **Save**, primary modal confirmations.

- **Background**: `#FF6A00` (identical across Light and Dark)
- **Foreground**: `#111111`
- **Hover**: `#E85D00`
- **Active**: `#CC5200`
- **Disabled**: `#F5B080` (or `opacity-50`)
- **Height**: Standard `40px` (`h-10`), Small `32px` (`h-8`), Large `48px` (`h-12`)
- **Horizontal Padding**: `12px–20px` (`px-4`)
- **Border Radius**: `8px` (`rounded-lg`)

### 3.2 Secondary Button (`variant="secondary"`)

Used for secondary actions: **Cancel**, dismissals, non-primary triggers.

- **Light Mode**: Background `#F5F5F5`, Foreground `#262626`, Border `#E5E5E5`, Hover `#EAEAEA`
- **Dark Mode**: Background `#262626`, Foreground `#F5F5F5`, Border `#3A3A3A`, Hover `#333333`

### 3.3 Outline Button (`variant="outline"`)

Used for alternative actions: **View details**, filters, secondary exports.

- **Light Mode**: Background `#FFFFFF`, Foreground `#262626`, Border `#D4D4D4`, Hover `#F5F5F5`
- **Dark Mode**: Background `#111111`, Foreground `#F5F5F5`, Border `#404040`, Hover `#262626`

### 3.4 Ghost Button (`variant="ghost"`)

Used for low-emphasis triggers, sidebar items, and table action menus (`...`).

- **Light Mode**: Background `transparent`, Foreground `#262626`, Hover `#F5F5F5`
- **Dark Mode**: Background `transparent`, Foreground `#E5E5E5`, Hover `#262626`

### 3.5 Destructive Button (`variant="destructive"`)

Used for high-consequence actions: **Delete**, revoke access, terminate sprint.

- **Light Mode**: Background `#DC2626`, Foreground `#FFFFFF`, Hover `#B91C1C`
- **Dark Mode**: Background `#F87171`, Foreground `#111111`, Hover `#EF4444`

---

## 4. Typography System

### 4.1 Typeface Selection

- **Primary Font**: **Inter** (`font-sans`) — High legibility across dashboards, tables, form fields, and English copy.
- **Alternative / Monospace**: Modern system sans / monospace for issue keys (`WEB-12`) and commit hashes.
- **Persian Typography (RTL)**: Inherits standard sans without negative letter spacing to preserve natural cursive glyph connections.

### 4.2 Standard Type Scale

| Role               | Size   | Rem        | Weight         | Line Height | Letter Spacing | Example Usage                                    |
| ------------------ | ------ | ---------- | -------------- | ----------- | -------------- | ------------------------------------------------ |
| **Display / Hero** | `56px` | `3.5rem`   | 700 (Bold)     | `1.1`       | `-0.04em`      | Landing Hero: _Plan work. Ship faster._          |
| **H1**             | `36px` | `2.25rem`  | 700 (Bold)     | `1.2`       | `-0.025em`     | Page Titles: _Your projects, organized._         |
| **H2**             | `30px` | `1.875rem` | 600 (Semibold) | `1.25`      | `-0.02em`      | Section Titles: _Project overview_               |
| **H3**             | `24px` | `1.5rem`   | 600 (Semibold) | `1.3`       | `-0.015em`     | Card & Panel Headings: _Recent activity_         |
| **H4**             | `20px` | `1.25rem`  | 600 (Semibold) | `1.35`      | `-0.01em`      | Modal Subsections: _Task details_                |
| **Body**           | `14px` | `0.875rem` | 400 (Regular)  | `1.5`       | `normal`       | Dashboard Base Text: _Manage tasks, projects..._ |
| **Body Large**     | `16px` | `1.0rem`   | 400 (Regular)  | `1.5`       | `normal`       | Long explanatory paragraphs / Docs               |
| **Small / Helper** | `12px` | `0.75rem`  | 400 (Regular)  | `1.4`       | `normal`       | Timestamps & Captions: _Updated 5m ago_          |
| **Button / Label** | `14px` | `0.875rem` | 500 (Medium)   | `1.25`      | `normal`       | Form labels & interactive buttons                |

> **Dashboard Rule**: Dashboard body copy defaults strictly to `14px` (with `12px` reserved for timestamps/helper labels). `16px` is reserved for readable explanatory articles and marketing text.

### 4.3 Responsive Typography Scale

| Element                | Mobile (<640px) | Tablet (640–1023px) | Desktop (≥1024px) | Tailwind / CSS Rule                                        |
| ---------------------- | --------------- | ------------------- | ----------------- | ---------------------------------------------------------- |
| **Landing Hero**       | `36px`          | `48px`              | `56–64px`         | `clamp(2.25rem, 5vw, 4rem)` (`hero-title`)                 |
| **Page Title (H1)**    | `26px`          | `30px`              | `36px`            | `text-[26px] md:text-[30px] lg:text-4xl font-bold`         |
| **Section Title (H2)** | `22px`          | `26px`              | `30px`            | `text-[22px] md:text-[26px] lg:text-[30px] font-semibold`  |
| **Card Title**         | `16px`          | `18px`              | `18px`            | `text-base md:text-lg font-semibold`                       |
| **Body Text**          | `14px`          | `14px`              | `14–16px`         | `text-sm lg:text-sm` (dashboard), `lg:text-base` (landing) |
| **Form Label**         | `13px`          | `14px`              | `14px`            | `text-[13px] md:text-sm font-medium`                       |
| **Button Text**        | `14px`          | `14px`              | `14px`            | `text-sm font-medium`                                      |
| **Caption / Small**    | `12px`          | `12px`              | `12px`            | `text-xs text-muted-foreground`                            |

---

## 5. Spacing System (4px Base Grid)

All layout paddings, margins, and gaps adhere to a consistent 4px multiplier:

| Token      | Pixels | Rem       | Usage                                                 |
| ---------- | ------ | --------- | ----------------------------------------------------- |
| `space-1`  | `4px`  | `0.25rem` | Micro spacing, badge internal padding                 |
| `space-2`  | `8px`  | `0.5rem`  | Icon to text gap, compact stack                       |
| `space-3`  | `12px` | `0.75rem` | Form element inner gaps                               |
| `space-4`  | `16px` | `1rem`    | Standard component spacing, mobile card padding       |
| `space-5`  | `20px` | `1.25rem` | Intermediate container gutters                        |
| `space-6`  | `24px` | `1.5rem`  | Desktop card padding, panel gutters                   |
| `space-8`  | `32px` | `2rem`    | Distance between major sections, desktop page padding |
| `space-12` | `48px` | `3rem`    | Large separation blocks                               |
| `space-16` | `64px` | `4rem`    | Landing page section padding                          |
| `space-24` | `96px` | `6rem`    | Massive landing page hero padding                     |

> **Spacing Hierarchy Law**:
> `Padding inside card (16–24px)` < `Gap between cards (16–32px)` < `Gap between sections (48–64px)`.

---

## 6. Borders, Form Inputs & Radius Rules

### 6.1 Geometric Radius Standards

| Component               | Radius Value             | Tailwind Class                     |
| ----------------------- | ------------------------ | ---------------------------------- |
| **Button / Input**      | `8px`                    | `rounded-lg` (`var(--radius)`)     |
| **Card / Panel**        | `12px`                   | `rounded-xl` (`var(--radius-lg)`)  |
| **Dialog / Modal**      | `16px`                   | `rounded-2xl` (`var(--radius-xl)`) |
| **Hero / Feature Card** | `20–24px`                | `rounded-3xl`                      |
| **Badge**               | `6px` or `9999px` (Pill) | `rounded-md` or `rounded-full`     |
| **Avatar**              | `9999px` (Full Circle)   | `rounded-full`                     |

### 6.2 Borders & Inputs

| Token              | Light Mode | Dark Mode | Description                                       |
| ------------------ | ---------- | --------- | ------------------------------------------------- |
| `border`           | `#E5E5E5`  | `#333333` | Standard 1px solid container/divider line         |
| `border-strong`    | `#D4D4D4`  | `#404040` | 1px solid accentuated border with higher contrast |
| `border-subtle`    | `#F0F0F0`  | `#262626` | Hairline dividers                                 |
| `input`            | `#D4D4D4`  | `#3A3A3A` | Form field outline border                         |
| `input-background` | `#FFFFFF`  | `#1C1C1C` | Input and textarea surface fill                   |
| `input-hover`      | `#A3A3A3`  | `#525252` | Border color when hovered                         |
| `focus-ring`       | `#FF6A00`  | `#FF8533` | 2px solid ring with 2px offset                    |
| `selection`        | `#FFE0CC`  | `#663414` | Text and item selection backdrop                  |

### Input Heights & Form Rules:

- Standard Input Height: `40px` (`h-10`)
- Compact Form Input: `36px` (`h-9`)
- Large / Hero Form Input: `44–48px` (`h-11` to `h-12`)
- Border visibility: Default borders must remain gentle and not compete with card content.

---

## 7. Cards, Tables & Responsive Layouts

### 7.1 Card Dimensions & Padding

- **Desktop Padding**: `24px` (`p-6`)
- **Mobile Padding**: `16px` (`p-4`)
- **Internal Item Spacing**: `8px–16px`
- **Sizing Rule**: Do not lock fixed heights on dashboard panels; width is dictated by Grid/Flex, allowing natural content expansion.

### 7.2 Tables & Modals

| Token                | Light Mode         | Dark Mode          | Details                           |
| -------------------- | ------------------ | ------------------ | --------------------------------- |
| `card-background`    | `#FFFFFF`          | `#1C1C1C`          | Base surface                      |
| `card-border`        | `#E5E5E5`          | `#333333`          | Edge definition                   |
| `card-hover`         | `#FAFAFA`          | `#222222`          | Hover surface transition          |
| `card-selected`      | `#FFF7F0`          | `#2A1D15`          | Selected task / active board card |
| `table-header`       | `#FAFAFA`          | `#181818`          | Sticky or header table rows       |
| `table-row-hover`    | `#F5F5F5`          | `#222222`          | Row mouseover state               |
| `table-divider`      | `#EEEEEE`          | `#2D2D2D`          | Row divider line                  |
| `modal-background`   | `#FFFFFF`          | `#1C1C1C`          | Dialog modal dialog window        |
| `modal-overlay`      | `rgba(0,0,0,0.40)` | `rgba(0,0,0,0.70)` | Backdrop blur overlay             |
| `tooltip-background` | `#171717`          | `#F5F5F5`          | Floating popover tooltip          |
| `tooltip-foreground` | `#FFFFFF`          | `#171717`          | Floating tooltip label            |

---

## 8. Responsive Breakpoints & Layout Architecture

TaskFlow uses standard Tailwind breakpoints:

| Breakpoint  | Width              | Layout Behavior                                                                |
| ----------- | ------------------ | ------------------------------------------------------------------------------ |
| **default** | `<640px` (Mobile)  | Single column, top Header + drawer menu, stacked stat cards, scrollable tables |
| **sm**      | `640px`            | Flexible stacked forms and adaptive lists                                      |
| **md**      | `768px` (Tablet)   | 2-column stat cards, collapsible navigation sidebar                            |
| **lg**      | `1024px` (Desktop) | Persistent 240px sidebar, multi-column dashboard, full Kanban boards           |
| **xl**      | `1280px`           | Wide desktop layout with expanded table columns                                |
| **2xl**     | `1536px`           | Contained max-width for marketing; maximized canvas for Kanban & Gantt         |

### 8.1 Page Dimensions & Padding Limits

| Area                       | Dimension Specification                                              |
| -------------------------- | -------------------------------------------------------------------- |
| **Landing Page Container** | `max-w-[1200px]` to `max-w-[1280px]` centered                        |
| **Hero Copy Width**        | Max `700px–800px` (`max-w-2xl` to `max-w-3xl`)                       |
| **Dashboard Main Content** | `w-full min-w-0` (prevent horizontal overflow; avoid `100vw`)        |
| **Dashboard Padding**      | Mobile `16px` (`p-4`), Tablet `24px` (`p-6`), Desktop `32px` (`p-8`) |
| **Auth / Login Forms**     | Max width `400px–440px` (`max-w-md`)                                 |
| **Small Dialog**           | `400px–480px`                                                        |
| **Medium Dialog**          | `560px–640px`                                                        |
| **Desktop Sidebar**        | Expanded `240px`, Collapsed `64px–72px`                              |
| **Dashboard Header**       | `56px–64px` (`h-14` to `h-16`)                                       |

---

## 9. Iconography & Media Standards

### 9.1 Icons (Lucide React)

- **16px** (`h-4 w-4`): Inline table metadata, badges, compact status items.
- **18px**: Standard button action icons.
- **20px** (`h-5 w-5`): Primary navigation & sidebar icons.
- **24px** (`h-6 w-6`): Section titles & empty state headers.
- **32–48px** (`h-8 w-8` to `h-12 w-12`): Hero feature illustrations and prominent empty states.
- **Stroke Width**: Standardized at `1.75px–2px`.

### 9.2 Media & Images

- **Hero Image**: `16:9` or `3:2` aspect ratio (`aspect-video`).
- **Product Screenshots**: `16:10` or `16:9` with subtle border and `shadow-md`.
- **Avatars**: `32px` (`h-8 w-8`) or `40px` (`h-10 w-10`), fully rounded (`rounded-full`).
- **Project Thumbnails**: `48px–64px` (`h-12 w-12` to `h-16 w-16`).
- **Rules**: Always use `next/image` with explicit width/height or `fill` with aspect ratios to prevent layout shifts.

---

## 10. Elevation, Shadows, Motion & Transitions

| Property                  | Value                                                                        | Tailwind / CSS                                                |
| ------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Card Shadow (Normal)**  | Minimal or none                                                              | `shadow-none` or `shadow-sm`                                  |
| **Dropdown / Popover**    | `0 8px 24px rgba(0,0,0,0.12)` (light) / `0 8px 24px rgba(0,0,0,0.35)` (dark) | `shadow-popover`                                              |
| **Focus Ring**            | `2px` ring + `2px` offset                                                    | `ring-2 ring-ring ring-offset-2 ring-offset-background`       |
| **Hover Transition**      | `150ms ease`                                                                 | `transition-all duration-150 ease-in-out`                     |
| **Dialog / Modal Motion** | `150ms–200ms ease`                                                           | `animate-in fade-in zoom-in-95 duration-150`                  |
| **Reduced Motion**        | Honor system setting                                                         | `@media (prefers-reduced-motion: reduce)` disables transition |

---

## 11. Status, Kanban & Chart Colors

### 11.1 Status Badges & Alerts

| Status          | Light Text | Light Badge Bg | Dark Text | Dark Badge Bg |
| --------------- | ---------- | -------------- | --------- | ------------- |
| **Success**     | `#166534`  | `#DCFCE7`      | `#86EFAC` | `#16351F`     |
| **Warning**     | `#92400E`  | `#FEF3C7`      | `#FDE047` | `#3A2B10`     |
| **Destructive** | `#991B1B`  | `#FEE2E2`      | `#FCA5A5` | `#3B1D1D`     |
| **Info**        | `#1E40AF`  | `#DBEAFE`      | `#93C5FD` | `#172B45`     |
| **Neutral**     | `#404040`  | `#F5F5F5`      | `#D4D4D4` | `#262626`     |

### 11.2 Kanban Workflow States

| Status          | Light Mode | Dark Mode | Application                            |
| --------------- | ---------- | --------- | -------------------------------------- |
| **Backlog**     | `#737373`  | `#A3A3A3` | Rail dot / pill badge                  |
| **Todo**        | `#2563EB`  | `#60A5FA` | Rail dot / pill badge                  |
| **In Progress** | `#FF6A00`  | `#FF8533` | Brand accent dot / active status badge |
| **In Review**   | `#7C3AED`  | `#A78BFA` | Rail dot / pill badge                  |
| **Done**        | `#16A34A`  | `#4ADE80` | Rail dot / success status badge        |
| **Blocked**     | `#DC2626`  | `#F87171` | Rail dot / warning status badge        |

### 11.3 Dashboard Chart Colors

| Token     | Light Value | Dark Value | Usage                                   |
| --------- | ----------- | ---------- | --------------------------------------- |
| `chart-1` | `#FF6A00`   | `#FF6A00`  | Primary metric / active sprint progress |
| `chart-2` | `#525252`   | `#A3A3A3`  | Secondary / neutral baseline data       |
| `chart-3` | `#2563EB`   | `#60A5FA`  | Third series / scope addition           |
| `chart-4` | `#16A34A`   | `#4ADE80`  | Completed scope / velocity trend        |
| `chart-5` | `#7C3AED`   | `#A78BFA`  | Fifth series / estimates                |
