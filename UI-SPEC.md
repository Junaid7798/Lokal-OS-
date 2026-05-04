---
phase: 1
slug: lokalos-design-system
status: implemented
shadcn_initialized: true
preset: shadcn
created: 2026-05-02
updated: 2026-05-04
implemented: 2026-05-04
document_owner: Design Lead
---

# LokalOS — Design System & Layout Specification

**Document Owner:** Design Lead  
**Last Updated:** May 4, 2026  
**Audience:** Engineers, Designers, Product, QA  
**Status:** Source of truth for all visual decisions

This document defines the complete visual language of LokalOS: the color system, typography, spacing, components, motion, and the two responsive layouts (mobile and desktop) that the product is built on. It is written to be specific enough that an engineer can implement any screen without ambiguity, and aesthetic enough that a designer can extend it without breaking the system.

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Brand & Voice](#2-brand--voice)
3. [Color System](#3-color-system)
4. [Typography](#4-typography)
5. [Spacing, Sizing & Radii](#5-spacing-sizing--radii)
6. [Elevation & Shadows](#6-elevation--shadows)
7. [Motion & Interaction](#7-motion--interaction)
8. [Iconography & Imagery](#8-iconography--imagery)
9. [Component Library](#9-component-library)
10. [Mobile Layout](#10-mobile-layout)
11. [Desktop Layout](#11-desktop-layout)
12. [Responsive Strategy](#12-responsive-strategy)
13. [Accessibility](#13-accessibility)
14. [Dark Mode](#14-dark-mode)
15. [Implementation Tokens](#15-implementation-tokens)
16. [Do's and Don'ts](#16-dos-and-donts)

---

## 1. Design Philosophy

LokalOS is a CRM for ambitious local businesses — cafes, salons, repair shops, clinics. The product is used in two very different contexts:

- **In the field, on a phone**, by a busy owner between customer interactions.
- **At a desk, on a laptop**, when reviewing reports, importing data, or planning campaigns.

Our design must serve both contexts without compromise. We resolve this with three principles:

### 1.1 Quiet Confidence

The interface speaks softly and lets the data lead. We avoid decorative gradients, busy patterns, and dramatic shadows. A premium feel comes from **restraint**, not embellishment — generous whitespace, perfect alignment, deliberate typography, and a single, well-chosen accent color.

### 1.2 Fast and Tactile

Every interaction must feel instant. We design for the 50th percentile phone (mid-tier Android, 4G, one thumb) and ensure the desktop experience scales up rather than the mobile experience scales down. Tap targets are large, transitions are short (150–250ms), and feedback is immediate.

### 1.3 Information-Dense Where It Counts

CRM users live in lists, tables, and dashboards. We do not waste a square pixel on decoration when a user is scanning 200 customers. Density is achieved through tight line-height, small but legible type, and clear separators — never through cramping or removing whitespace.

---

## 2. Brand & Voice

### 2.1 Personality

| Attribute   | We Are                                     | We Are Not                          |
|-------------|--------------------------------------------|-------------------------------------|
| Tone        | Calm, capable, encouraging                 | Loud, salesy, hype-driven           |
| Visual      | Clean, structured, considered              | Trendy, decorative, skeuomorphic    |
| Copy        | Plain English, second person, action-led   | Jargon, exclamation marks, emojis   |
| Density     | High where useful, airy where breathing    | Cramped, or empty for the sake of   |

### 2.2 Logo & Wordmark

- **Wordmark:** "LokalOS" set in Geist Semibold, letter-spacing -0.02em.
- **Mark:** A rounded square (8px radius) with a single capital "L" in white on the primary color. Used at 32×32px in the desktop sidebar and 28×28px in the mobile header.
- **Clear space:** Equal to the height of the "L" on all sides.

---

## 3. Color System

LokalOS uses a **5-color palette**: one brand color, three neutrals, one accent. We do not exceed this without a documented exception.

### 3.1 The Palette

| Role            | Light Mode (OKLCH)         | Hex (approx.) | Usage                                                    |
|-----------------|----------------------------|---------------|----------------------------------------------------------|
| **Primary**     | `oklch(0.52 0.13 165)`     | `#0F766E`     | Brand actions, active nav, links, key data points.       |
| **Primary-Hover** | `oklch(0.46 0.14 165)`   | `#0B5E58`     | Hover state for primary buttons and links.               |
| **Foreground**  | `oklch(0.18 0.005 250)`    | `#1C1F23`     | Primary body text, headings.                             |
| **Muted-Foreground** | `oklch(0.50 0.01 250)`| `#6B7280`     | Secondary text, captions, table column headers.          |
| **Background**  | `oklch(1 0 0)`             | `#FFFFFF`     | App background, card surface.                            |
| **Surface**     | `oklch(0.985 0.003 250)`   | `#FAFAF9`     | Sidebar, inset panels, table row hover.                  |
| **Border**      | `oklch(0.92 0.005 250)`    | `#E7E5E4`     | Hairline dividers, input borders, card outlines.         |
| **Accent**      | `oklch(0.78 0.16 75)`      | `#F59E0B`     | Pro tier badges, loyalty stars, highlights. Sparingly.   |
| **Destructive** | `oklch(0.58 0.22 27)`      | `#DC2626`     | Errors, destructive confirmations only.                  |
| **Success**     | `oklch(0.65 0.16 160)`     | `#16A34A`     | Positive deltas, "active" status, sync confirmations.    |

> **Why teal as primary?** Teal communicates trust and growth without the corporate cliché of blue. It pairs well with both warm neutrals (giving warmth) and amber (giving energy). It is also rare in CRM tooling — most competitors default to blue or purple.

### 3.2 Rules of Use

1. **Primary is for action**, not decoration. A page should never have more than one primary button visible at once.
2. **Accent (amber) is for distinction**, not action. Use it for the Pro plan badge, loyalty milestones, and the "What's New" indicator. Never for buttons.
3. **Destructive is for irreversible actions only** (delete, remove, cancel subscription). Never for warnings or "danger zones" — use muted text + amber border for those.
4. **Backgrounds are layered**, not stacked. From bottom to top: `--background` (page) → `--surface` (sidebar/aside) → `--card` (card surface, same as background but with border) → `--popover` (elevated above card).
5. **Never use pure black** (`#000`). Always use `--foreground` so text inherits the slight warm tint that ties the palette together.

### 3.3 Forbidden Combinations

- Primary text on Accent background (insufficient contrast).
- Destructive on Primary (visual clash).
- Gradients that mix Primary and Accent (opposing temperatures).
- Any color outside the palette without an entry in `globals.css`.

### 3.4 Status Color Mapping

| Status              | Color         | Background tint           | Example                           |
|---------------------|---------------|---------------------------|-----------------------------------|
| Active / Success    | Success-600   | `success-600 / 10%`       | "Active customer" badge           |
| Inactive / Neutral  | Muted         | `muted-foreground / 10%`  | "No recent visits" badge          |
| At-risk / Warning   | Accent-600    | `accent / 12%`            | "Hasn't visited in 30 days" alert |
| Error / Destructive | Destructive   | `destructive / 10%`       | "Sync failed" toast               |

---

## 4. Typography

### 4.1 Type Stack

We use **two families, never more**:

```css
--font-sans: 'Geist', 'Inter', system-ui, -apple-system, sans-serif;
--font-mono: 'Geist Mono', 'JetBrains Mono', ui-monospace, monospace;
```

- **Geist Sans** for all UI, headings, body, and forms.
- **Geist Mono** for numerical data (customer IDs, amounts in tables, timestamps in logs, code blocks).

### 4.2 Type Scale

We use a **modular scale of 1.20 (minor third)** anchored at 16px body. This gives a calm, professional rhythm without dramatic jumps.

| Token         | Size / Line   | Weight     | Tracking  | Use                                       |
|---------------|---------------|------------|-----------|-------------------------------------------|
| `text-display`| 48 / 52       | 600        | -0.025em  | Hero headlines (marketing only).          |
| `text-h1`     | 32 / 40       | 600        | -0.02em   | Page titles ("Customers", "Dashboard").   |
| `text-h2`     | 24 / 32       | 600        | -0.015em  | Section titles, dialog titles.            |
| `text-h3`     | 20 / 28       | 600        | -0.01em   | Card titles, table caption.               |
| `text-h4`     | 16 / 24       | 600        | 0         | Sub-section labels.                       |
| `text-body`   | 14 / 22       | 400        | 0         | **Default UI text.** Tables, forms, body. |
| `text-body-lg`| 16 / 24       | 400        | 0         | Long-form prose, settings descriptions.   |
| `text-caption`| 13 / 18       | 500        | 0.005em   | Helper text under inputs, table headers.   |
| `text-overline`| 11 / 16      | 600        | 0.08em    | UPPERCASE section dividers in sidebar.    |

> **Body is 14px, not 16px.** This is a deliberate choice for an information-dense CRM. Critical reading surfaces (settings prose, empty-state copy, error messages) step up to 16px.

### 4.3 Weight Usage

| Weight | Geist Name | Use                                                     |
|--------|------------|---------------------------------------------------------|
| 400    | Regular    | Body text, table cells.                                 |
| 500    | Medium     | Captions, table headers, button labels at small sizes.  |
| 600    | Semibold   | All headings, strong emphasis, primary button labels.   |
| 700    | Bold       | Avoid. Only used inside the logo wordmark.              |

We **never** use weights below 400 — light weights look cheap on Android and small screens.

### 4.4 Typography Rules

1. **Pair `text-balance` with all headings** so they wrap optically rather than mechanically.
2. **Pair `text-pretty` with body paragraphs** longer than two lines.
3. **Numbers in tables use `font-mono` and `tabular-nums`** so columns align even with varying digit widths.
4. **Maximum line length for prose: 72 characters** (`max-w-prose`).
5. **Never rely on color alone** to convey meaning — pair with weight, icon, or label.

---

## 5. Spacing, Sizing & Radii

### 5.1 Spacing Scale

We use Tailwind's default scale (4px base) with a curated subset for layout consistency:

| Token | Value | Use                                                                |
|-------|-------|--------------------------------------------------------------------|
| `1`   | 4px   | Icon-to-text spacing inside a button.                              |
| `2`   | 8px   | Tight stacks (badge group, breadcrumb separator).                  |
| `3`   | 12px  | Form field internal padding (vertical).                            |
| `4`   | 16px  | **Default gap** between related elements; mobile content padding.  |
| `6`   | 24px  | Default gap between sections within a card.                        |
| `8`   | 32px  | Desktop content padding; gap between major sections.               |
| `12`  | 48px  | Page top padding on desktop; spacing before page footer.           |
| `16`  | 64px  | Hero spacing; rare in app surfaces.                                |

> **Rule:** Always use `gap-*` on flex/grid parents. Never mix `margin` with `gap` on the same element.

### 5.2 Component Sizing

| Element                | Mobile | Desktop | Notes                              |
|------------------------|--------|---------|------------------------------------|
| Header height          | 56px   | 64px    | Sticky, with backdrop blur.        |
| Bottom nav height      | 64px   | —       | Mobile only; safe-area inset.      |
| Sidebar width          | —      | 240px   | Fixed, scrollable.                 |
| Touch target (min)     | 44px   | 36px    | iOS HIG / WCAG minimum.            |
| Input height           | 44px   | 36px    | Larger on mobile for thumb input.  |
| Button height (default)| 40px   | 36px    | `h-10` mobile, `h-9` desktop.      |
| Button height (small)  | 32px   | 28px    |                                    |
| Card padding           | 16px   | 24px    |                                    |
| Dialog max-width       | 100vw  | 540px   | Full-screen on mobile.             |
| Content max-width      | —      | 1280px  | Centered with `mx-auto`.           |

### 5.3 Border Radius

We use a **consistent radius scale** that matches Geist's geometric feel:

| Token       | Value | Use                                       |
|-------------|-------|-------------------------------------------|
| `rounded-sm`  | 4px   | Badges, chips, table row hover indicator. |
| `rounded-md`  | 6px   | Inputs, small buttons.                    |
| `rounded-lg`  | 10px  | **Default for buttons, cards, dialogs.**  |
| `rounded-xl`  | 14px  | Hero cards, onboarding panels.            |
| `rounded-2xl` | 18px  | Mobile sheets, drawers.                   |
| `rounded-full`| ∞     | Avatars, status dots, pill badges.        |

`--radius` is set to **0.625rem (10px)**, which the rest of the scale derives from.

---

## 6. Elevation & Shadows

We use **two shadows total**. More creates visual noise.

| Token         | Value                                                          | Use                              |
|---------------|----------------------------------------------------------------|----------------------------------|
| `shadow-card` | `0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 1px 0 rgb(0 0 0 / 0.02)` | Cards at rest. Subtle.           |
| `shadow-pop`  | `0 8px 24px -4px rgb(0 0 0 / 0.10), 0 4px 8px -2px rgb(0 0 0 / 0.06)` | Popovers, dropdowns, dialogs.    |

We **never** use:
- Inset shadows (looks dated).
- Colored shadows (cheap-feeling).
- Shadows on buttons (use border + background change instead).

Elevation is communicated primarily through **hairline borders** (`1px solid var(--border)`) and **layered backgrounds**, not shadows.

---

## 7. Motion & Interaction

### 7.1 Timing & Easing

| Token         | Duration | Easing                          | Use                                    |
|---------------|----------|---------------------------------|----------------------------------------|
| `duration-fast`   | 120ms | `cubic-bezier(0.4, 0, 0.2, 1)`  | Hover state changes, focus rings.      |
| `duration-base`   | 180ms | `cubic-bezier(0.4, 0, 0.2, 1)`  | **Default.** Buttons, links, inputs.   |
| `duration-medium` | 240ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Sheets, dialogs, accordions.          |
| `duration-slow`   | 320ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Page transitions, mobile drawers.      |

> **Rule:** Anything longer than 320ms feels slow. Anything shorter than 120ms feels janky.

### 7.2 Interaction States

Every interactive element must have visible states for: **default → hover → focus → active → disabled**.

- **Hover:** background shifts to `--accent`, or border darkens by one step.
- **Focus:** 2px `--ring` outline, offset 2px. Always visible on keyboard focus (`:focus-visible`).
- **Active:** background darkens by 4%, transform `scale-[0.98]` for buttons.
- **Disabled:** opacity 0.5, no pointer events, no transitions.

### 7.3 Reduced Motion

All non-essential animation respects `prefers-reduced-motion: reduce`. Replace transitions with instant changes; never replace with opacity-only fades.

---

## 8. Iconography & Imagery

### 8.1 Icons

- **Library:** Lucide Icons exclusively.
- **Sizes:** 16px (inline), 20px (default UI), 24px (mobile bottom nav).
- **Stroke:** 1.75px (Lucide default). Never adjust.
- **Color:** Inherits from text color (`currentColor`).
- **Pairing:** Icon + label is preferred over icon-only. Icon-only is acceptable in toolbars with tooltips.

### 8.2 Illustrations

Illustrations are used sparingly and only for **empty states**, **onboarding**, and **upgrade prompts**. They follow these rules:

- Monochrome line art using Primary color at 60% opacity.
- 2px stroke, rounded line caps.
- Sized at 120px (mobile) or 160px (desktop).
- Never photographic. Never 3D-rendered.

### 8.3 Avatars

- Customer avatars: Initials on a generated pastel background (deterministic from name hash).
- Staff avatars: Photo if uploaded, otherwise initials with the staff member's assigned color.
- Always circular (`rounded-full`).
- Sizes: 24, 32, 40, 56, 80px.

---

## 9. Component Library

LokalOS is built on **shadcn/ui v4** with the modifications below. We do not introduce competing component libraries.

### 9.1 Core Components & Variants

| Component  | Variants                                          | Notes                                    |
|------------|---------------------------------------------------|------------------------------------------|
| Button     | `default`, `secondary`, `outline`, `ghost`, `destructive`, `link` | No "primary" — `default` is primary.     |
| Input      | Default, with `InputGroup` for icons/addons       | Use `InputGroupInput`, never raw Input.  |
| Card       | Default                                           | Always has 1px border, no shadow.        |
| Badge      | `default`, `secondary`, `outline`, `destructive`  | Add `success` and `warning` variants.    |
| Dialog     | Centered, max 540px                               | Full-screen on mobile via `<Sheet>`.     |
| Sheet      | `top`, `right`, `bottom`, `left`                  | Mobile uses `bottom` for primary actions.|
| Table      | shadcn Table                                      | Sticky header, mono numerals.            |
| Tabs       | `default`, `pills`                                | Pills for filter tabs, default for sections. |
| Toast      | shadcn Sonner                                     | Top-right desktop, top-center mobile.    |
| Empty      | shadcn Empty                                      | Always with icon + title + description + action. |

### 9.2 LokalOS-Specific Components

These are documented in `components/` and follow the same design tokens:

- **`<PlanGate>`** — Wraps gated features. Shows a premium lock card with the upgrade CTA when locked.
- **`<StatCard>`** — Headline number + label + delta. Used on dashboard.
- **`<CustomerRow>`** — Optimized list row with avatar, name, sub-info, and action area. Used on customer list.
- **`<ActivityItem>`** — Timeline entry with icon, body, timestamp. Used on customer detail.
- **`<EmptyState>`** — Composed `Empty` with consistent padding and copy structure.

### 9.3 Form Patterns

Every form uses the shadcn **Field** stack:

```tsx
<FieldGroup>
  <Field>
    <FieldLabel>Customer name</FieldLabel>
    <Input {...} />
    <FieldDescription>Used in WhatsApp templates.</FieldDescription>
    <FieldError />
  </Field>
</FieldGroup>
```

We **do not** build forms with raw divs and `space-y-*`.

---

## 10. Mobile Layout

### 10.1 Layout Anatomy

The mobile layout is **single-column, full-bleed**, optimized for one-thumb operation on a 375–428px viewport.

```
┌─────────────────────────────────┐  ← Status bar (OS)
├─────────────────────────────────┤  ← Header (56px)
│  [☰]   Page Title       [👤]    │
├─────────────────────────────────┤
│                                 │
│                                 │
│       Scrollable content        │
│         (16px padding)          │
│                                 │
│                                 │
│                                 │
├─────────────────────────────────┤  ← Bottom nav (64px + safe area)
│  [⌂]  [👥]  [+]   [💬]  [⋯]    │
└─────────────────────────────────┘
```

### 10.2 Header (56px)

- **Left:** Hamburger menu (only when sidebar items overflow bottom nav) OR back chevron on detail screens.
- **Center:** Page title, truncating with ellipsis. Geist Semibold 16px.
- **Right:** Single icon button — usually user/settings or a contextual primary action (e.g., "+ Add" on the customer list).
- **Background:** `bg-background/95` with `backdrop-blur` so content scrolls subtly underneath.
- **Border:** 1px hairline `--border` at the bottom.

### 10.3 Bottom Tab Navigation (64px)

We show **exactly 5 tabs**. Anything beyond is in the hamburger sidebar.

The 5 tabs (in this order):

1. **Dashboard** — `LayoutDashboard` icon.
2. **Customers** — `Users` icon.
3. **Add (Quick Action)** — Primary-colored circular button, raised 8px above the tab bar. Opens a bottom-sheet menu of "Add customer / Record visit / Add appointment".
4. **Follow-ups** — `MessageSquare` icon. Shows red dot when there are pending follow-ups.
5. **More** — `Menu` icon. Opens the full sidebar as a left drawer.

- Active tab: Primary color + filled icon variant.
- Inactive: Muted-foreground + outline icon.
- Label: 11px, Geist Medium, always visible.
- Safe area: `pb-[env(safe-area-inset-bottom)]`.

### 10.4 Content Patterns on Mobile

- **List rows:** Full-width, 72px tall, with avatar (40px) on the left, two-line text in the middle, chevron on the right. Tap target is the entire row.
- **Cards:** Full-width with 16px outer padding, 16px inner padding. No gutter between adjacent cards — separated by an 8px gap.
- **Forms:** Full-width inputs (44px tall), labels above. Submit button is a sticky footer (`fixed bottom-16`) for long forms.
- **Dialogs:** Always render as bottom sheets (`<Sheet side="bottom">`), 90vh max height with a 4px drag handle at the top.
- **Tables:** Tables become **stacked cards** below 768px. Each row becomes a card with key/value pairs.

### 10.5 Mobile-Specific Interactions

- **Pull-to-refresh** on all list views.
- **Swipe-left on customer row** reveals quick actions: Call, WhatsApp, Mark visit.
- **Long-press on a list row** opens a context bottom sheet.
- **FAB-style "+ Add" button** in the bottom nav center for primary creation actions.

---

## 11. Desktop Layout

### 11.1 Layout Anatomy

Desktop is a **three-zone shell**: sidebar (left), header (top), main content (right). Optimized for 1280–1920px viewports.

```
┌────────┬────────────────────────────────────────────────────┐
│        │  Header (64px) — page title, search, staff, user   │
│        ├────────────────────────────────────────────────────┤
│        │                                                    │
│Sidebar │                                                    │
│ 240px  │              Main content area                     │
│        │              (32px padding,                        │
│        │               max-w-7xl centered)                  │
│        │                                                    │
│        │                                                    │
└────────┴────────────────────────────────────────────────────┘
```

### 11.2 Sidebar (240px, fixed)

The sidebar is the **navigational backbone** of the desktop experience.

- **Background:** `--surface` (subtly lighter than main content area).
- **Border:** 1px hairline on the right edge.
- **Top section (64px):** Logo mark + wordmark. Clickable, returns home.
- **Sections:** Grouped per `lib/navigation.ts` — Primary, Engagement, Operations, Analytics, Settings.
- **Section headers:** `text-overline` style (11px, uppercase, tracked, muted). 8px top padding, 4px bottom.
- **Nav items:** 36px tall, 12px horizontal padding, 8px gap between icon and label, `rounded-md`.
  - Icon: 16px, muted-foreground.
  - Label: 14px, Geist Medium.
  - Active state: `bg-primary/10` background, primary-color text and icon, 2px primary-colored bar on the left edge.
  - Hover: `bg-accent`.
- **Bottom section:** Plan badge (e.g., "Free • Upgrade to Pro") with subtle accent-colored background, click to open Upgrade page.
- **Scrollable** if content exceeds viewport, but we design so it rarely does.

### 11.3 Header (64px)

The desktop header is **functional, not decorative**.

- **Background:** `bg-background/80` with `backdrop-blur`. Sticky to top.
- **Left:** Page title (`text-h2` style, 20px Semibold) + breadcrumb when nested (e.g., `Customers / Sarah Chen`).
- **Center:** Global search input (`InputGroup` with search icon, 320px wide, `cmd+k` to focus). Placeholder: "Search customers, visits, leads…".
- **Right:**
  1. Staff selector dropdown (only if business has > 1 staff).
  2. "What's New" bell icon with red dot indicator.
  3. User avatar dropdown (settings, billing, sign out).

### 11.4 Main Content Area

- **Padding:** 32px on all sides (`p-8`).
- **Max width:** 1280px (`max-w-7xl`), centered with `mx-auto`. Long-form pages (settings prose, contracts) use `max-w-3xl`.
- **Vertical rhythm:** 24px gap between sections, 16px between elements within a section.
- **Page header:** H1 title (32px Semibold) + optional subtitle (14px Muted) + right-aligned action buttons. 24px bottom margin.
- **Tabs:** When a page has tabs (e.g., Customer Detail), the tab strip sits directly below the page header with a 1px bottom border that the active tab "punches through".

### 11.5 Desktop-Specific Interactions

- **Cmd+K** opens global search.
- **Cmd+/** opens keyboard shortcut overlay.
- **G then C** = Go to Customers (Linear-style nav shortcuts).
- **Right-click on a customer row** opens a contextual menu.
- **Hover on truncated text** shows a tooltip with full content after 500ms.
- **Drag handles on dashboard widgets** for reordering (Pro plan only).

### 11.6 Tables on Desktop

Tables are first-class citizens on desktop. They follow these rules:

- **Sticky header** when scrolling (top-0 inside a scroll container).
- **Row height:** 48px (44px content + 4px padding).
- **Column headers:** `text-caption` Medium, muted-foreground, with sort arrows when sortable.
- **Row hover:** `bg-surface` background (very subtle).
- **Row selected:** `bg-primary/5` background with `bg-primary` 2px left border.
- **Number columns:** Right-aligned, `font-mono tabular-nums`.
- **Action column:** Right-most, sticky, with an inline `…` menu trigger.
- **Pagination:** Bottom-right, with page size selector (10/25/50/100).

---

## 12. Responsive Strategy

### 12.1 Breakpoints

We follow Tailwind v4 defaults, with one custom break:

| Token  | Min width | Use                                       |
|--------|-----------|-------------------------------------------|
| (default) | 0      | **Mobile.** Full-bleed, bottom nav, single column. |
| `sm`   | 640px     | Larger phones / small tablets. Two-up grids permitted. |
| `md`   | 768px     | Tablets. Cards become 2-column grids.    |
| `lg`   | 1024px    | **Desktop threshold.** Sidebar appears, bottom nav disappears. |
| `xl`   | 1280px    | Wide desktop. Three-column dashboards.   |
| `2xl`  | 1536px    | Wide-screen. Content remains capped at 1280px. |

### 12.2 Layout Switch (lg breakpoint)

The transition between mobile and desktop happens at exactly **1024px**. Below: bottom nav + hamburger drawer. Above: persistent sidebar + full header.

- **Below 1024px:** `<MobileLayout />` is rendered.
- **At/above 1024px:** `<DesktopLayout />` is rendered.
- **Tablet (768–1023px):** Uses the mobile shell but with two-column grids inside content. This is a deliberate choice — tablets used in business settings (countertops, behind a register) behave more like phones than laptops.

### 12.3 Responsive Patterns

| Pattern              | Mobile                | Tablet               | Desktop                  |
|----------------------|-----------------------|----------------------|--------------------------|
| Customer list        | Stacked rows          | Stacked rows         | Table                    |
| Dashboard stats      | 1 column              | 2 columns            | 4 columns                |
| Customer detail      | Stacked tabs          | Stacked tabs         | Side panel (60/40 split) |
| Forms                | Full-width inputs     | Full-width inputs    | Two-column field rows    |
| Dialogs              | Bottom sheet (90vh)   | Bottom sheet         | Centered modal (540px)   |
| Filters              | Bottom-sheet drawer   | Bottom-sheet drawer  | Inline above table       |

### 12.4 The Golden Rule

**Design mobile first.** Every screen begins as a mobile layout. Desktop is achieved by adding columns, sidebars, and density — never by removing features.

---

## 13. Accessibility

### 13.1 Color Contrast

All text/background pairings meet **WCAG AA** (4.5:1 for body, 3:1 for large text). We test combinations at:

- Primary on Background: 7.9:1 ✓
- Foreground on Background: 13.2:1 ✓
- Muted-foreground on Background: 4.7:1 ✓
- Foreground on Surface: 12.8:1 ✓
- Primary-foreground on Primary: 6.1:1 ✓

### 13.2 Focus & Keyboard

- Every interactive element is reachable by Tab in document order.
- Focus rings use `--ring` at 2px offset 2px, **always visible on keyboard focus**.
- Skip link at the very top of the page jumps to `#main-content`.
- Modals trap focus and restore it on close.

### 13.3 Touch Targets

- Mobile: minimum 44×44px tap target (iOS HIG).
- Desktop: minimum 36×36px click target.
- Adjacent tap targets have at least 4px gap.

### 13.4 Semantic Structure

- One `<h1>` per page.
- Headings nest correctly (no h2 → h4).
- Landmarks: `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`.
- ARIA labels on icon-only buttons.
- `aria-current="page"` on active nav items.
- `role="status"` on toasts; `role="alert"` only for destructive errors.

### 13.5 Screen Reader Patterns

- Tables: `<caption>` for context, `<th scope="col">` for column headers.
- Loading states: announce with `aria-live="polite"`.
- Form errors: linked to inputs via `aria-describedby`.
- Decorative icons: `aria-hidden="true"`.

---

## 14. Dark Mode

Dark mode is **first-class**, not an afterthought. It is automatically activated via `prefers-color-scheme: dark` and can be toggled in Settings.

### 14.1 Dark Palette

| Role            | Dark Mode (OKLCH)        | Hex (approx.) | Notes                                  |
|-----------------|--------------------------|---------------|----------------------------------------|
| Background      | `oklch(0.16 0.005 250)`  | `#171819`     | Warm near-black, never pure `#000`.    |
| Surface         | `oklch(0.20 0.005 250)`  | `#1F2123`     | Sidebar, inset panels.                 |
| Card            | `oklch(0.22 0.005 250)`  | `#26282A`     | Cards lift slightly above background.  |
| Foreground      | `oklch(0.96 0.003 250)`  | `#F4F4F5`     | Body text.                             |
| Muted-foreground| `oklch(0.65 0.005 250)`  | `#9CA3AF`     | Secondary text.                        |
| Border          | `oklch(0.28 0.005 250)`  | `#37393B`     | Subtle dividers.                       |
| Primary         | `oklch(0.62 0.13 165)`   | `#14B8A6`     | Slightly brighter for dark backgrounds.|
| Accent          | `oklch(0.82 0.16 75)`    | `#FBBF24`     | Slightly brighter amber.               |
| Destructive     | `oklch(0.65 0.20 27)`    | `#F87171`     | Brighter for legibility on dark.       |

### 14.2 Dark Mode Rules

- Increase contrast slightly versus light mode (foreground is brighter, borders are more visible).
- Brand colors get a small lift in lightness so they "pop" on dark backgrounds.
- No pure black, no pure white — both feel oppressive on OLED screens.
- Shadows are reduced (dark on dark is invisible); rely on borders for elevation.
- Images and illustrations are tested in both modes; never use white-only line art.

---

## 15. Implementation Tokens

These are the canonical token definitions for `app/globals.css`. They map directly to the design above and should be the **only** source of color, type, and radius values in the codebase.

```css
@import 'tailwindcss';

:root {
  /* Color — Primary */
  --primary: oklch(0.52 0.13 165);
  --primary-foreground: oklch(0.985 0 0);
  --primary-hover: oklch(0.46 0.14 165);

  /* Color — Neutrals */
  --background: oklch(1 0 0);
  --foreground: oklch(0.18 0.005 250);
  --surface: oklch(0.985 0.003 250);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.18 0.005 250);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.18 0.005 250);
  --muted: oklch(0.97 0.003 250);
  --muted-foreground: oklch(0.50 0.01 250);
  --border: oklch(0.92 0.005 250);
  --input: oklch(0.92 0.005 250);
  --ring: oklch(0.52 0.13 165);

  /* Color — Accent (amber, used sparingly) */
  --accent: oklch(0.96 0.04 75);
  --accent-foreground: oklch(0.35 0.10 75);

  /* Color — Status */
  --destructive: oklch(0.58 0.22 27);
  --destructive-foreground: oklch(0.985 0 0);
  --success: oklch(0.65 0.16 160);
  --success-foreground: oklch(0.985 0 0);
  --warning: oklch(0.78 0.16 75);
  --warning-foreground: oklch(0.25 0.10 75);

  /* Color — Sidebar */
  --sidebar: oklch(0.985 0.003 250);
  --sidebar-foreground: oklch(0.18 0.005 250);
  --sidebar-primary: oklch(0.52 0.13 165);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.96 0.005 250);
  --sidebar-accent-foreground: oklch(0.18 0.005 250);
  --sidebar-border: oklch(0.92 0.005 250);
  --sidebar-ring: oklch(0.52 0.13 165);

  /* Charts (data viz palette derived from brand) */
  --chart-1: oklch(0.52 0.13 165);   /* Primary teal */
  --chart-2: oklch(0.78 0.16 75);    /* Amber accent */
  --chart-3: oklch(0.55 0.14 220);   /* Soft blue */
  --chart-4: oklch(0.65 0.16 160);   /* Success green */
  --chart-5: oklch(0.50 0.10 295);   /* Mauve (low emphasis) */

  /* Radii */
  --radius: 0.625rem;
}

.dark {
  --background: oklch(0.16 0.005 250);
  --foreground: oklch(0.96 0.003 250);
  --surface: oklch(0.20 0.005 250);
  --card: oklch(0.22 0.005 250);
  --card-foreground: oklch(0.96 0.003 250);
  --popover: oklch(0.22 0.005 250);
  --popover-foreground: oklch(0.96 0.003 250);
  --primary: oklch(0.62 0.13 165);
  --primary-foreground: oklch(0.16 0.005 250);
  --primary-hover: oklch(0.68 0.14 165);
  --muted: oklch(0.24 0.005 250);
  --muted-foreground: oklch(0.65 0.005 250);
  --accent: oklch(0.28 0.04 75);
  --accent-foreground: oklch(0.85 0.10 75);
  --border: oklch(0.28 0.005 250);
  --input: oklch(0.28 0.005 250);
  --ring: oklch(0.62 0.13 165);
  --destructive: oklch(0.65 0.20 27);
  --success: oklch(0.70 0.16 160);
  --warning: oklch(0.82 0.16 75);
  --sidebar: oklch(0.20 0.005 250);
  --sidebar-foreground: oklch(0.96 0.003 250);
  --sidebar-primary: oklch(0.62 0.13 165);
  --sidebar-primary-foreground: oklch(0.16 0.005 250);
  --sidebar-accent: oklch(0.24 0.005 250);
  --sidebar-accent-foreground: oklch(0.96 0.003 250);
  --sidebar-border: oklch(0.28 0.005 250);
  --sidebar-ring: oklch(0.62 0.13 165);
}

@theme inline {
  --font-sans: 'Geist', 'Inter', system-ui, sans-serif;
  --font-mono: 'Geist Mono', 'JetBrains Mono', ui-monospace, monospace;

  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-surface: var(--surface);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--surface);
  --color-secondary-foreground: var(--foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);

  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);

  --radius-sm: calc(var(--radius) - 6px);
  --radius-md: calc(var(--radius) - 4px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  html {
    @apply bg-background;
  }
  body {
    @apply bg-background text-foreground font-sans antialiased;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
  }
  /* Mono numerals in tables */
  table tbody td.numeric,
  .tabular-nums {
    font-variant-numeric: tabular-nums;
    font-family: var(--font-mono);
  }
}
```

---

## 16. Do's and Don'ts

### Do
- Use `--primary` for the single most important action on a screen.
- Use `gap-*` on flex/grid parents for all spacing between items.
- Wrap headings in `text-balance` and prose in `text-pretty`.
- Use `font-mono` + `tabular-nums` for numbers in tables.
- Test every screen in light **and** dark mode.
- Ensure every interactive element has visible focus, hover, and active states.
- Use `<Empty>`, `<Field>`, `<InputGroup>` shadcn components — never raw divs.
- Mobile-first: design for 375px viewport before scaling up.
- Keep a single `<h1>` per page and nest headings semantically.

### Don't
- Don't introduce new colors outside the palette.
- Don't use shadows on buttons or table rows — use borders and backgrounds.
- Don't use gradients except as one-off marketing accents (and never on app surfaces).
- Don't use emojis as icons. Use Lucide.
- Don't use weight 300 or lower.
- Don't use pure black (`#000`) or pure white (`#fff`) — always use tokens.
- Don't use `space-y-*` or `space-x-*` — use `gap-*` on the parent.
- Don't write `p-[16px]` — use `p-4`. Stick to the spacing scale.
- Don't design icon-only buttons without an `aria-label`.
- Don't make critical actions less than 44px tall on mobile.

---

## Appendix A: Quick Reference Cheatsheet

```
COLORS (light)              SPACING                  TEXT
primary    #0F766E         1   = 4px               h1   32/40 600 -.02
fg         #1C1F23         2   = 8px               h2   24/32 600 -.015
muted-fg   #6B7280         3   = 12px              h3   20/28 600 -.01
bg         #FFFFFF         4   = 16px (default)    body 14/22 400
surface    #FAFAF9         6   = 24px              caption 13/18 500
border     #E7E5E4         8   = 32px (desktop)
accent     #F59E0B         12  = 48px              RADII
destructive #DC2626                                sm  4   md  6
success    #16A34A         BREAKPOINTS              lg  10  xl  14
                            sm  640                  full ∞
HEIGHTS                     md  768
header (m)  56px            lg  1024 ← layout switch
header (d)  64px            xl  1280
bottom nav  64px            2xl 1536
sidebar     240px
input (m)   44px            FOCUS RING
input (d)   36px            2px var(--ring), offset 2px
```

---

**End of design.md** — When in doubt, prioritize clarity over cleverness, and trust the system.