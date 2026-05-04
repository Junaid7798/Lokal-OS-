# LokalOS — Implementation Plan

> **Audience:** Junior / mid-level engineer executing the build.
> **Author intent:** Principal-architect handover. Every decision is made for you. Do not deviate without raising a question. If something is ambiguous, stop and ask — do not improvise architecture.
> **Source of truth:** `vision.md` (product/feature scope) + this document (technical execution).
> **Last reviewed:** 2026-05-04

---

## Table of Contents

1. [How to Use This Document](#1-how-to-use-this-document)
2. [Architectural Decisions (Locked)](#2-architectural-decisions-locked)
3. [System Architecture Overview](#3-system-architecture-overview)
4. [Phase 0 — Repository & Tooling Setup](#phase-0--repository--tooling-setup)
5. [Phase 1 — Foundation: Routing, Layout, Design System](#phase-1--foundation-routing-layout-design-system)
6. [Phase 2 — Data Layer: Supabase, IndexedDB, localDb](#phase-2--data-layer-supabase-indexeddb-localdb)
7. [Phase 3 — Authentication & Multi-Tenant Bootstrapping](#phase-3--authentication--multi-tenant-bootstrapping)
8. [Phase 4 — Customer & Visit Core](#phase-4--customer--visit-core)
9. [Phase 5 — Engagement: Follow-ups, Loyalty, Campaigns](#phase-5--engagement-follow-ups-loyalty-campaigns)
10. [Phase 6 — Operations: Appointments, Leads, Staff, Locations](#phase-6--operations-appointments-leads-staff-locations)
11. [Phase 7 — Analytics, Reports, Dashboard](#phase-7--analytics-reports-dashboard)
12. [Phase 8 — Integrations: WhatsApp, Google Business, Sentry](#phase-8--integrations-whatsapp-google-business-sentry)
13. [Phase 9 — Plan Gating & Access Control](#phase-9--plan-gating--access-control)
14. [Phase 10 — Automation Engine](#phase-10--automation-engine)
15. [Phase 11 — Testing & QA](#phase-11--testing--qa)
16. [Phase 12 — Deployment & Operations](#phase-12--deployment--operations)
17. [Appendix A — Final File Tree](#appendix-a--final-file-tree)
18. [Appendix B — Environment Variables](#appendix-b--environment-variables)
19. [Appendix C — Coding Conventions](#appendix-c--coding-conventions)
20. [Appendix D — Definition of Done](#appendix-d--definition-of-done)

---

## 1. How to Use This Document

- Phases are **strictly sequential**. Do not start Phase N+1 until Phase N's "Acceptance Criteria" pass.
- Each phase has: **Goal → Deliverables → Step-by-step instructions → Code skeletons → Acceptance Criteria**.
- Code blocks marked `// SKELETON` are illustrative — type-correct but minimal. Fill in business logic per the inline comments. Do **not** add features beyond what the step specifies.
- Path conventions: all paths are relative to repository root unless prefixed with `/`.
- Commit after each completed step using Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`).
- If a step's acceptance criteria cannot be met with the provided guidance, **stop and escalate**. Do not invent solutions.

---

## 2. Architectural Decisions (Locked)

These decisions are non-negotiable. They are derived from `vision.md` and the constraints below.

| #     | Decision                                                                                        | Rationale                                                                                                                       |
| ----- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| AD-1  | **Vite 6 + React 19 + TypeScript (strict)** as the SPA shell                                    | Matches vision.md; fast HMR; no SSR needed for an offline-first internal-tool style SaaS                                        |
| AD-2  | **Supabase** as the canonical backend (Postgres + Auth + Storage)                               | Single integration covers DB, auth, RLS, file uploads                                                                           |
| AD-3  | **IndexedDB primary, `localStorage` fallback** via the `localDb` facade                         | Offline-first; survives reloads; localStorage used only for tiny keys (auth user, feature flags) and as legacy migration source |
| AD-4  | **Row-Level Security (RLS) on every tenant table**, keyed by `business_id`                      | Multi-tenant isolation enforced at DB layer; client cannot bypass                                                               |
| AD-5  | **React Router DOM v7** in _Declarative_ mode with `createBrowserRouter` + `lazy` route modules | Vision specifies React Router 7; lazy loading required for heavy views                                                          |
| AD-6  | **Tailwind CSS v4 + shadcn/ui v4** with CSS-first theming via `@theme` in `index.css`           | Tailwind 4 removes `tailwind.config.ts` requirement; shadcn v4 supports it                                                      |
| AD-7  | **Zod** at every trust boundary (form input, Supabase responses, imports)                       | Defense-in-depth typing; never trust external shape                                                                             |
| AD-8  | **Sentry** error tracking + a thin `initAnalytics()` wrapper                                    | Vision requirement; analytics provider is pluggable                                                                             |
| AD-9  | **Feature gating in two layers**: UI (`<PlanGate />`) **and** DB (RLS + RPC checks)             | UI gate for UX, DB gate for security                                                                                            |
| AD-10 | **WhatsApp via deep links** (`https://wa.me/...`), no Cloud API in v1                           | Faster to ship; vision.md confirms                                                                                              |
| AD-11 | **Vercel** for hosting; **Supabase Edge Functions** for any server-side jobs (cron, webhooks)   | Both are first-class for this stack                                                                                             |
| AD-12 | **No ORM**. Use `@supabase/supabase-js` directly                                                | Lower indirection; RLS does the heavy lifting                                                                                   |

### Out of scope for v1 (do not build)

- Real-time WebSocket subscriptions
- Multi-staff RBAC with separate logins (single owner login + staff selector only)
- Native mobile app (PWA only)
- Email marketing
- Payment processing (UI shows plan tiers only; billing is manual)

---

## 3. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Browser (PWA)                              │
│  ┌─────────────┐   ┌──────────────────┐   ┌──────────────────────┐ │
│  │  React 19   │──▶│  React Router 7  │──▶│  Lazy Route Modules  │ │
│  └─────────────┘   └──────────────────┘   └──────────────────────┘ │
│         │                                            │              │
│         ▼                                            ▼              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                       localDb Facade                        │   │
│  │  ┌──────────────┐    ┌──────────────────┐    ┌──────────┐  │   │
│  │  │  IndexedDB   │◀──▶│  Sync Queue      │───▶│ Supabase │  │   │
│  │  │  (primary)   │    │  (pending ops)   │    │  Client  │  │   │
│  │  └──────────────┘    └──────────────────┘    └────┬─────┘  │   │
│  │  ┌──────────────────────────────────────┐         │        │   │
│  │  │  localStorage (auth, flags, legacy)  │         │        │   │
│  │  └──────────────────────────────────────┘         │        │   │
│  └─────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┼──────────────┘
                                                       │ HTTPS
                                                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                            Supabase                                 │
│   ┌─────────────┐   ┌──────────────┐   ┌────────────────────────┐  │
│   │  Postgres   │   │     Auth     │   │   Edge Functions        │  │
│   │  + RLS      │   │  (email/OTP) │   │   (cron, webhooks,      │  │
│   │             │   │              │   │    automation runner)   │  │
│   └─────────────┘   └──────────────┘   └────────────────────────┘  │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │   Storage  (avatars, CSV exports, QR codes)                 │  │
│   └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌────────────────────────────────┐
              │  Third-party (deep-link only)  │
              │  WhatsApp · Google Business    │
              └────────────────────────────────┘
```

### Data flow contract

1. UI components call hooks (e.g., `useCustomers()`).
2. Hooks call `localDb` (never Supabase directly).
3. `localDb` reads from IndexedDB synchronously-fast and **enqueues** writes.
4. A background sync worker drains the queue against Supabase. On conflict (timestamp-based), Supabase wins and IndexedDB is reconciled.
5. RLS guarantees that even a tampered client cannot read another business's rows.

---

## Phase 0 — Repository & Tooling Setup

**Goal:** A reproducible dev environment with the locked tech stack, linting, formatting, and CI hooks.

### Deliverables

- Vite project bootstrapped with React 19 + TS strict
- Tailwind 4 + shadcn/ui v4 configured
- Path alias `@/*` → `src/*`
- ESLint + Prettier + Husky + lint-staged
- Vitest configured with jsdom

### Steps

#### 0.1 Bootstrap Vite project

```bash
pnpm create vite@latest lokalos --template react-ts
cd lokalos
pnpm install
```

#### 0.2 Install runtime dependencies

```bash
pnpm add react@^19 react-dom@^19 \
  react-router-dom@^7 \
  @supabase/supabase-js \
  zod date-fns \
  lucide-react \
  recharts \
  motion \
  @sentry/react \
  clsx tailwind-merge class-variance-authority
```

#### 0.3 Install dev dependencies

```bash
pnpm add -D tailwindcss @tailwindcss/vite \
  vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/jest-dom \
  eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin \
  eslint-plugin-react eslint-plugin-react-hooks \
  prettier husky lint-staged \
  @types/node
```

#### 0.4 Configure `vite.config.ts`

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: { port: 3000 },
});
```

#### 0.5 Configure `tsconfig.json` paths

Add to **both** `tsconfig.json` and `tsconfig.app.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] },
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

#### 0.6 Initialize Tailwind v4 (CSS-first)

Replace `src/index.css` with:

```css
@import 'tailwindcss';

@theme {
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.145 0 0);
  --color-primary: oklch(0.205 0 0);
  --color-primary-foreground: oklch(0.985 0 0);
  --color-muted: oklch(0.97 0 0);
  --color-muted-foreground: oklch(0.556 0 0);
  --color-destructive: oklch(0.577 0.245 27.325);
  --color-border: oklch(0.922 0 0);
  --color-ring: oklch(0.708 0 0);
  --radius: 0.625rem;
}

/* Dark mode overrides via class strategy */
.dark {
  --color-background: oklch(0.145 0 0);
  --color-foreground: oklch(0.985 0 0);
  /* ... */
}
```

> **Note:** Tailwind v4 does **not** use `tailwind.config.ts`. All theming lives in CSS via `@theme`.

#### 0.7 Initialize shadcn/ui v4

```bash
pnpm dlx shadcn@latest init
```

Answer prompts: New York style, base color Neutral, CSS variables Yes.

Pre-add the components used across the app:

```bash
pnpm dlx shadcn@latest add button card input label dialog dropdown-menu \
  select textarea badge tabs table sheet separator toast form \
  alert avatar checkbox switch progress skeleton tooltip
```

#### 0.8 ESLint + Prettier + Husky

- `.eslintrc.cjs`: extend `eslint:recommended`, `plugin:@typescript-eslint/recommended`, `plugin:react-hooks/recommended`.
- `.prettierrc`: `{ "semi": true, "singleQuote": true, "trailingComma": "all", "printWidth": 100 }`.
- Husky pre-commit:
  ```bash
  pnpm dlx husky init
  echo "pnpm lint-staged" > .husky/pre-commit
  ```
- `package.json` lint-staged:
  ```json
  "lint-staged": { "*.{ts,tsx}": ["eslint --fix", "prettier --write"] }
  ```

#### 0.9 Vitest config

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
});
```

#### 0.10 Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext .ts,.tsx",
    "format": "prettier --write .",
    "test": "vitest",
    "test:cov": "vitest run --coverage"
  }
}
```

### Acceptance Criteria

- [ ] `pnpm dev` serves a Vite app on port 3000 with no console errors.
- [ ] A test `<Button />` from shadcn renders with Tailwind styling.
- [ ] `pnpm lint` and `pnpm test` exit 0.
- [ ] Husky pre-commit runs lint-staged on staged files.

---

## Phase 1 — Foundation: Routing, Layout, Design System

**Goal:** Navigable shell with all 13 routes registered (lazy-loaded placeholders), responsive layout, and design tokens locked.

### Deliverables

- `src/App.tsx` with `createBrowserRouter` and lazy route modules
- `src/components/Layout.tsx` (sidebar + bottom-tab + staff selector)
- `src/components/ErrorBoundary.tsx`
- Design tokens applied; dark mode toggleable via `<html class="dark">`
- A placeholder `<View>` per route that renders its name

### Steps

#### 1.1 Type definitions

Create `src/types.ts` with the interfaces from `vision.md` (Business, Customer, Visit, BusinessProfile, etc.). Treat this file as the single source of truth for domain types. Do **not** scatter ad-hoc shapes elsewhere.

#### 1.2 Router setup

Create `src/router.tsx`:

```tsx
// SKELETON
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import ErrorBoundary from '@/components/ErrorBoundary';

const lazy = (loader: () => Promise<{ default: React.ComponentType }>) => ({
  lazy: async () => ({ Component: (await loader()).default }),
});

export const router = createBrowserRouter([
  { path: '/auth', ...lazy(() => import('@/views/Auth')) },
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, ...lazy(() => import('@/views/Home')) },
      { path: 'customers', ...lazy(() => import('@/views/Customers')) },
      {
        path: 'customers/:id',
        ...lazy(() => import('@/views/CustomerDetail')),
      },
      { path: 'follow-ups', ...lazy(() => import('@/views/FollowUps')) },
      { path: 'inactive', ...lazy(() => import('@/views/Inactive')) },
      { path: 'reviews', ...lazy(() => import('@/views/Reviews')) },
      { path: 'appointments', ...lazy(() => import('@/views/Appointments')) },
      { path: 'campaigns', ...lazy(() => import('@/views/Campaigns')) },
      { path: 'loyalty', ...lazy(() => import('@/views/LoyaltySettings')) },
      { path: 'revenue', ...lazy(() => import('@/views/RevenueDashboard')) },
      { path: 'leads', ...lazy(() => import('@/views/Leads')) },
      { path: 'data', ...lazy(() => import('@/views/DataManagement')) },
      { path: 'reports', ...lazy(() => import('@/views/Reports')) },
      { path: 'settings', ...lazy(() => import('@/views/Settings')) },
      { path: 'automation', ...lazy(() => import('@/views/Automation')) },
      { path: 'locations', ...lazy(() => import('@/views/Locations')) },
      { path: 'activity-log', ...lazy(() => import('@/views/ActivityLog')) },
      { path: 'review-kit', ...lazy(() => import('@/views/GoogleReviewKit')) },
      { path: 'upgrade', ...lazy(() => import('@/views/Upgrade')) },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
```

#### 1.3 Layout component

Create `src/components/Layout.tsx` per `vision.md`:

- Desktop ≥1024px: fixed left sidebar (240px), main content scroll area.
- Mobile <1024px: bottom tab bar with the 13 primary nav items.
- Staff selector dropdown in the top-right of both layouts.
- Active item: `bg-primary/10 text-primary`.
- Use the `NAV_ITEMS` array from `vision.md` Section "Navigation Items".
- Wrap `<Outlet />` in `<Suspense fallback={<Skeleton />}>`.

#### 1.4 ErrorBoundary

Wrap with `@sentry/react`'s `ErrorBoundary`:

```tsx
// SKELETON
import * as Sentry from '@sentry/react';
export default function ErrorBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Sentry.ErrorBoundary fallback={<FallbackUI />}>
      {children}
    </Sentry.ErrorBoundary>
  );
}
```

#### 1.5 Entry point

Update `src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { initSentry } from './lib/sentry';
import { initAnalytics } from './lib/analytics';
import './index.css';

initSentry();
initAnalytics();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
```

#### 1.6 Placeholder views

For each route in 1.2, create a stub `src/views/<Name>.tsx`:

```tsx
export default function Home() {
  return <h1 className="text-2xl font-bold">Home</h1>;
}
```

### Acceptance Criteria

- [ ] Every route in 1.2 renders without 404.
- [ ] Sidebar highlights the active route.
- [ ] Mobile bottom-tab bar appears below 1024px breakpoint.
- [ ] Lighthouse "Accessibility" score ≥ 90 on the Layout shell.

---

## Phase 2 — Data Layer: Supabase, IndexedDB, localDb

**Goal:** A unified `localDb` facade that the rest of the app uses. Supabase schema is provisioned with RLS. IndexedDB stores are created and migration from `localStorage` works.

### Deliverables

- `src/lib/supabaseClient.ts`
- `src/lib/indexedDb.ts` (8 stores, business-scoped indexes)
- `src/lib/localDb.ts` (the facade)
- `src/lib/syncQueue.ts` (background sync)
- SQL migration files in `supabase/migrations/`
- RLS policies enabled on every tenant table

### Steps

#### 2.1 Supabase project & env vars

Create a Supabase project. Add to `.env.local`:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

#### 2.2 Supabase client

```ts
// src/lib/supabaseClient.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: { persistSession: true, autoRefreshToken: true },
      })
    : null;

export function requireSupabase(): SupabaseClient {
  if (!supabase) throw new Error('Supabase not configured');
  return supabase;
}
```

> **Rule:** Every caller of `supabase` must handle `null`. Use `requireSupabase()` only inside guarded server-side or auth flows.

#### 2.3 SQL schema (migration `0001_init.sql`)

Create one migration per concern. The first migration creates all tables from `vision.md`'s "Database Schema" section. Every tenant table **must**:

- Have a `business_id uuid references business_profiles(id) on delete cascade`.
- Have `created_at timestamptz default now()` and `updated_at timestamptz default now()`.
- Have `id uuid primary key default gen_random_uuid()`.
- Have an index on `(business_id)`.

Example for `customers`:

```sql
create table customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business_profiles(id) on delete cascade,
  name text not null,
  phone text not null,
  source text,
  consent_status text not null default 'pending'
    check (consent_status in ('pending','given','withdrawn')),
  opt_out boolean not null default false,
  tags text[] not null default '{}',
  notes text default '',
  review_status text not null default 'not_asked',
  birthday_date date, anniversary_date date,
  is_returned boolean default false,
  revenue_recovered numeric default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, phone)
);
create index on customers (business_id);
create index on customers (business_id, created_at desc);
```

Repeat the pattern for: `business_profiles`, `visits`, `staff_members`, `message_templates`, `action_logs`, `leads`, `appointments`, `campaigns`, `campaign_recipients`, `loyalty_rules`, `customer_packages`, `owner_alerts`, `automation_sequences`, `automation_steps`, `automation_jobs`, `external_integrations`, `google_reviews`, `locations`, `export_logs`, `audit_logs`.

#### 2.4 RLS policies (migration `0002_rls.sql`)

For **every** tenant table:

```sql
alter table customers enable row level security;

-- Helper function: returns the business_id of the current authenticated user.
-- Stored on business_profiles.owner_user_id = auth.uid().
create or replace function current_business_id() returns uuid
language sql stable security definer as $$
  select id from business_profiles where owner_user_id = auth.uid() limit 1
$$;

create policy "tenant read" on customers
  for select using (business_id = current_business_id());
create policy "tenant insert" on customers
  for insert with check (business_id = current_business_id());
create policy "tenant update" on customers
  for update using (business_id = current_business_id())
  with check (business_id = current_business_id());
create policy "tenant delete" on customers
  for delete using (business_id = current_business_id());
```

Apply identical patterns to all other tenant tables. **No table may exist in `public` without RLS.**

#### 2.5 IndexedDB wrapper

```ts
// src/lib/indexedDb.ts — SKELETON
const DB_NAME = 'lokalos';
const DB_VERSION = 1;
const STORES = [
  'profile',
  'customers',
  'visits',
  'actions',
  'leads',
  'appointments',
  'campaigns',
  'loyalty',
] as const;
type StoreName = (typeof STORES)[number];

let dbPromise: Promise<IDBDatabase> | null = null;
function open(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) {
          const store = db.createObjectStore(name, { keyPath: 'id' });
          store.createIndex('business_id', 'business_id', { unique: false });
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

export async function idbGetAll<T>(
  store: StoreName,
  businessId: string
): Promise<T[]> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const idx = tx.objectStore(store).index('business_id');
    const req = idx.getAll(businessId);
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}
export async function idbPut<T extends { id: string }>(
  store: StoreName,
  value: T
): Promise<void> {
  /* ... */
}
export async function idbDelete(store: StoreName, id: string): Promise<void> {
  /* ... */
}
```

#### 2.6 The `localDb` facade

This is the **only** module the rest of the app talks to for persistence.

```ts
// src/lib/localDb.ts — SKELETON
import { idbGetAll, idbPut, idbDelete } from './indexedDb';
import { supabase } from './supabaseClient';
import { enqueue } from './syncQueue';

export const localDb = {
  // --- auth ---
  getAuth(): { id: string; email: string } | null {
    const raw = localStorage.getItem('auth_user');
    return raw ? JSON.parse(raw) : null;
  },
  setAuth(u: { id: string; email: string } | null) {
    if (u) localStorage.setItem('auth_user', JSON.stringify(u));
    else localStorage.removeItem('auth_user');
  },

  // --- profile ---
  async getProfile(userId: string) {
    /* try IDB first, fall back to localStorage `profile_${userId}`, then Supabase */
  },
  async saveProfile(userId: string, data: BusinessProfile) {
    /* IDB write + enqueue Supabase upsert */
  },

  // --- customers ---
  async getCustomers(userId: string): Promise<CustomerWithVisits[]> {
    /* IDB read joined with visits */
  },
  async addCustomer(userId: string, c: Omit<Customer, 'id'>) {
    /* validate → IDB put → enqueue */
  },
  async updateCustomer(userId: string, id: string, patch: Partial<Customer>) {
    /* ... */
  },

  // --- visits, actions, leads, appointments, campaigns, loyalty ---
  // same pattern: IDB-first, enqueue-to-Supabase

  // --- import/export ---
  async exportToCSV(userId: string): Promise<string> {
    /* ... */
  },
  async importFromCSV(
    userId: string,
    csv: string
  ): Promise<{ imported: number; skipped: number }> {
    /* ... */
  },
};
```

> **Rule of thumb:** Read paths return immediately from IDB. Write paths (a) optimistically write IDB, (b) enqueue a Supabase mutation, (c) return success. The sync worker reconciles.

#### 2.7 Sync queue

```ts
// src/lib/syncQueue.ts — SKELETON
type Op = {
  id: string;
  table: string;
  type: 'upsert' | 'delete';
  payload: unknown;
  ts: number;
};
const QUEUE_KEY = 'sync_queue';

export function enqueue(op: Omit<Op, 'id' | 'ts'>) {
  /* push to localStorage queue */
}
export async function drain() {
  if (!supabase || !navigator.onLine) return;
  const queue: Op[] = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]');
  for (const op of queue) {
    try {
      if (op.type === 'upsert')
        await supabase.from(op.table).upsert(op.payload as object);
      else
        await supabase
          .from(op.table)
          .delete()
          .eq('id', (op.payload as { id: string }).id);
    } catch (e) {
      /* leave in queue, log to Sentry */ break;
    }
    // remove from queue on success
  }
}

window.addEventListener('online', drain);
setInterval(drain, 30_000);
```

#### 2.8 Migration from legacy `localStorage`

On first boot, `localDb.getProfile(uid)` checks for `profile_${uid}` and `customers_${businessId}` in `localStorage`. If found, it migrates to IndexedDB and deletes the legacy keys. Idempotent.

### Acceptance Criteria

- [ ] All tables exist in Supabase with RLS enabled (`select * from pg_tables where rowsecurity=false and schemaname='public'` returns zero rows).
- [ ] Inserting a customer while online writes to IDB **and** to Supabase.
- [ ] Going offline, inserting, going back online: row appears in Supabase within 30s.
- [ ] An attacker tampering with the JWT to use another `business_id` cannot read foreign rows (verify with a manual SQL test).

---

## Phase 3 — Authentication & Multi-Tenant Bootstrapping

**Goal:** Email-magic-link login, automatic creation of a `business_profile` on first login, route guarding.

### Steps

#### 3.1 `views/Auth.tsx`

- Email input → `supabase.auth.signInWithOtp({ email })`.
- After redirect, `supabase.auth.getSession()` produces user.
- Persist via `localDb.setAuth({ id, email })`.

#### 3.2 First-login provisioning

```ts
// src/lib/bootstrapBusiness.ts — SKELETON
export async function ensureBusinessProfile(userId: string, email: string) {
  const { data } = await requireSupabase()
    .from('business_profiles')
    .select('*')
    .eq('owner_user_id', userId)
    .maybeSingle();
  if (data) return data;
  const { data: created } = await requireSupabase()
    .from('business_profiles')
    .insert({
      owner_user_id: userId,
      business_name: email.split('@')[0] + "'s Business",
      plan: 'Free',
      plan_status: 'trial',
      customer_limit: 50,
      monthly_whatsapp_action_limit: 100,
    })
    .select()
    .single();
  return created;
}
```

#### 3.3 Route guard

Wrap protected routes with `<RequireAuth />` that redirects to `/auth` if `localDb.getAuth()` is null.

#### 3.4 `useBusinessProfile` hook

Returns the cached profile from IDB; subscribes to changes.

### Acceptance Criteria

- [ ] New user signing in lands on `/` with a fresh `business_profile` provisioned.
- [ ] Returning user sees their existing profile.
- [ ] Visiting `/customers` while logged out redirects to `/auth`.

---

## Phase 4 — Customer & Visit Core

**Goal:** Full CRUD on customers and visits, with import/export, customer detail page, and limit enforcement.

### Steps

#### 4.1 `views/Customers.tsx`

- Table (shadcn `<Table>`) with columns: Name, Phone, Source, Last visit, Total revenue, Tags.
- Search input filters client-side over the IDB-backed list (debounced 200ms).
- "Add customer" opens a `<Dialog>` with a Zod-validated form.
- Phone validation: `/^\+?\d{10,15}$/`. Reject duplicates by `(business_id, phone)`.
- "Import CSV" / "Export CSV" buttons gated by `<PlanGate feature="csv_io" />` (Phase 9).
- Customer limit: when `count >= business.customer_limit`, the Add button shows an upgrade tooltip.

#### 4.2 `views/CustomerDetail.tsx` (lazy)

- Header with name, phone, tags, consent status.
- Tabs: Visits, Actions, Loyalty, Notes.
- "Record visit" button opens `<VisitDialog />`.

#### 4.3 Visits dialog

Fields: service category (select from `business.service_categories`), bill value, payment status, payment method, staff name (auto-filled from active staff selector), notes.
On submit:

1. Insert visit (IDB + enqueue).
2. Update customer's `last_visit_date`.
3. Call `evaluateLoyalty(customerId)` (Phase 5).
4. Insert action log entry (`type: 'visit_recorded'`).

#### 4.4 Import/Export

- Export: serialize customers + visits to CSV (RFC 4180-compliant; quote fields containing commas/newlines).
- Import: parse with a small CSV parser (no heavy dep — write `parseCsv()` in `lib/csv.ts`). Validate each row with Zod. Skip duplicates. Return `{imported, skipped, errors[]}`.

### Acceptance Criteria

- [ ] Add → list → search → edit → delete all work offline.
- [ ] Importing a 1,000-row CSV completes in < 5 seconds.
- [ ] Export produces a CSV that re-imports cleanly (round-trip).
- [ ] Free plan blocks the 51st customer with an upgrade prompt.

---

## Phase 5 — Engagement: Follow-ups, Loyalty, Campaigns

### 5.1 Follow-ups (`views/FollowUps.tsx`)

- Source data: customers whose last visit was 2–7 days ago without a follow-up `action_log`.
- Each row: customer + "Send WhatsApp" deep link + "Mark done" button.
- "Mark done" creates an `action_log { type: 'follow_up', staff_name, ... }`.

### 5.2 Inactive (`views/Inactive.tsx`)

- Customers with no visit in 30+ days. Configurable threshold via business profile.

### 5.3 Loyalty (`views/LoyaltySettings.tsx`)

- CRUD for `loyalty_rules` (e.g., "Every 10 visits → 1 free service").
- `evaluateLoyalty(customerId)`: count visits, compute earned rewards, write to `customer_packages` (or analogous reward table).

### 5.4 Campaigns (`views/Campaigns.tsx`)

- Create campaign: select template, segment (filters by source/tags/last-visit-window), preview recipient count.
- On send: create `campaign_recipients` rows; UI provides "Open WhatsApp" per row that the user clicks.
- Track delivery status: `queued | opened | sent_manually | failed`.

### 5.5 Templates

- Stored in `message_templates` with placeholders `{{name}}`, `{{business_name}}`, `{{last_visit_date}}`.
- A `renderTemplate(tpl, ctx)` utility in `lib/templates.ts` does substitution.

### Acceptance Criteria

- [ ] Customer with last visit 5 days ago appears in Follow-ups.
- [ ] After 10th visit, loyalty UI shows reward earned.
- [ ] Campaign with 50 recipients generates 50 working `wa.me` links.

---

## Phase 6 — Operations: Appointments, Leads, Staff, Locations

### 6.1 Appointments

- Calendar view (use `date-fns` for date math; render with a simple month grid — do **not** pull a heavy calendar lib).
- Create / edit / cancel / mark complete / mark no-show.
- Assign to staff member.

### 6.2 Leads

- Pipeline view: 4 columns (New, Contacted, Converted, Lost) using shadcn `<Card>` lanes.
- Drag-and-drop optional in v1; click-to-move buttons are required.
- "Convert to customer" creates a `customers` row and archives the lead.

### 6.3 Staff

- In Settings: add/remove staff names. Stored in `staff_members`.
- Staff selector (in Layout) reads from this list.

### 6.4 Locations (`views/Locations.tsx`, gated to Pro plan)

- CRUD on `locations`. Customers/visits can be tagged with `location_id`.

### Acceptance Criteria

- [ ] Booking an appointment shows on calendar in correct slot.
- [ ] Lead conversion creates a customer with the same phone (no duplicate).
- [ ] Free plan does not see the Locations menu item.

---

## Phase 7 — Analytics, Reports, Dashboard

### 7.1 `useCustomerStats`

Pure function over `customers + visits` returning: total customers, new this month, churn rate, avg revenue per customer, top sources.

### 7.2 `useAlerts`

Returns a list of derived alerts: birthdays today, anniversaries this week, overdue follow-ups, inactive milestones, low-stock-of-reviews.

### 7.3 `useRevenueAnalytics`, `useStaffMetrics`, `useCustomerAnalytics`

All pure, all fed from IDB, all memoized with `useMemo`.

### 7.4 `views/Home.tsx`

- Hero: KPI cards (today's visits, week revenue, pending follow-ups, new leads).
- Alerts panel.
- "Occasions" widget (birthdays/anniversaries this week).
- 30-day revenue chart (`recharts` `<AreaChart>`).
- All charts use shadcn chart components, no custom SVG.

### 7.5 `views/Reports.tsx` and `views/RevenueDashboard.tsx`

- Pro-gated reports with date-range picker, segment filters, exportable charts.

### Acceptance Criteria

- [ ] Home dashboard renders < 100ms after route change with 1,000 customers.
- [ ] All analytics hooks have unit tests (Phase 11).

---

## Phase 8 — Integrations: WhatsApp, Google Business, Sentry

### 8.1 WhatsApp

```ts
// src/lib/whatsapp.ts
export function generateWhatsAppLink(phone: string, message: string): string {
  const clean = phone.replace(/\D/g, '');
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}
```

Use in: follow-ups, campaigns, review requests, reminders. Always render as `<a target="_blank" rel="noopener noreferrer">`.

### 8.2 Google Business Profile

- Stored in `external_integrations` (per business).
- OAuth flow: a Supabase Edge Function `google-oauth-callback` exchanges the code, stores refresh token (encrypted via Supabase Vault).
- A scheduled Edge Function `sync-google-reviews` (cron: hourly) pulls new reviews into `google_reviews`.
- `views/Reviews.tsx` lists reviews; "Reply" calls another Edge Function `reply-google-review`.
- `views/GoogleReviewKit.tsx` generates a QR code (use `qrcode` npm package) linking to the Place ID review URL.

### 8.3 Sentry

```ts
// src/lib/sentry.ts
import * as Sentry from '@sentry/react';
export function initSentry() {
  if (!import.meta.env.VITE_SENTRY_DSN) return;
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    tracesSampleRate: 0.1,
    environment: import.meta.env.MODE,
  });
}
```

### 8.4 Analytics

```ts
// src/lib/analytics.ts
export function initAnalytics() {
  /* PostHog or no-op based on env */
}
export function track(event: string, props?: Record<string, unknown>) {
  /* ... */
}
```

Track: `customer_added`, `visit_recorded`, `campaign_sent`, `plan_upgraded`, `import_completed`.

### Acceptance Criteria

- [ ] A throw inside a route reports to Sentry.
- [ ] Clicking "Send WhatsApp" opens `wa.me` with the templated message.
- [ ] Connecting Google OAuth populates `external_integrations` for the business.

---

## Phase 9 — Plan Gating & Access Control

### 9.1 Plan tiers (matrix)

| Feature                  | Free | Founding | Pro  | Automation |
| ------------------------ | ---- | -------- | ---- | ---------- |
| Customer cap             | 50   | 500      | ∞    | ∞          |
| CSV import/export        | ❌   | ✅       | ✅   | ✅         |
| Pro reports              | ❌   | ❌       | ✅   | ✅         |
| Locations                | ❌   | ❌       | ✅   | ✅         |
| Automation               | ❌   | ❌       | ❌   | ✅         |
| Monthly WhatsApp actions | 100  | 1000     | 5000 | ∞          |

Encode as a typed map in `src/lib/plans.ts`:

```ts
export const PLAN_FEATURES = {
  Free: {
    customers: 50,
    csv_io: false,
    pro_reports: false,
    locations: false,
    automation: false,
    wa_actions: 100,
  },
  Founding: {
    customers: 500,
    csv_io: true,
    pro_reports: false,
    locations: false,
    automation: false,
    wa_actions: 1000,
  },
  Pro: {
    customers: Infinity,
    csv_io: true,
    pro_reports: true,
    locations: true,
    automation: false,
    wa_actions: 5000,
  },
  Automation: {
    customers: Infinity,
    csv_io: true,
    pro_reports: true,
    locations: true,
    automation: true,
    wa_actions: Infinity,
  },
} as const;
```

### 9.2 `<PlanGate />` component

```tsx
// SKELETON
export function PlanGate({
  feature,
  children,
  fallback,
}: {
  feature: keyof (typeof PLAN_FEATURES)['Free'];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { plan } = useBusinessProfile();
  const allowed = PLAN_FEATURES[plan][feature];
  if (allowed) return <>{children}</>;
  return <>{fallback ?? <UpgradePrompt feature={feature} />}</>;
}
```

### 9.3 DB-side enforcement

For sensitive limits (customer cap, WA actions), add a Postgres trigger:

```sql
create or replace function enforce_customer_limit() returns trigger as $$
declare cnt int; lim int;
begin
  select customer_limit into lim from business_profiles where id = new.business_id;
  select count(*) into cnt from customers where business_id = new.business_id;
  if cnt >= lim then raise exception 'CUSTOMER_LIMIT_EXCEEDED'; end if;
  return new;
end $$ language plpgsql;
create trigger customers_limit before insert on customers
  for each row execute function enforce_customer_limit();
```

### Acceptance Criteria

- [ ] UI hides locked features per plan.
- [ ] Tampering with the client to call `localDb.addCustomer` past the cap is rejected by the DB trigger.

---

## Phase 10 — Automation Engine

**Goal:** Trigger-based multi-step WhatsApp sequences. Gated to Automation plan.

### 10.1 Data model

- `automation_sequences`: `{ id, business_id, name, trigger_type ('visit'|'appointment'|'inactivity'|'birthday'), trigger_config jsonb, active }`
- `automation_steps`: `{ id, sequence_id, order, delay_hours, template_id }`
- `automation_jobs`: `{ id, sequence_id, step_id, customer_id, scheduled_for, status ('pending'|'sent'|'failed'|'cancelled') }`

### 10.2 Job creation

- On a triggering event (visit recorded, etc.), call `enqueueAutomationJobs(customerId, triggerType)` which creates one `automation_jobs` row per step at `now() + step.delay_hours`.

### 10.3 Job runner

A Supabase Edge Function `run-automation-jobs` (cron: every 5 min):

1. Fetches `automation_jobs where status='pending' and scheduled_for <= now()`.
2. For each: marks `sent`, generates the WhatsApp link, stores it on the job, and inserts an `owner_alert` for the user to click and send.
   > WhatsApp deep links require a human click in v1, so the runner doesn't actually send — it surfaces the next action to the owner.

### 10.4 UI (`views/Automation.tsx`)

- List sequences. Create/edit form. Toggle active.
- "Pending alerts" tray showing automation-generated `owner_alerts`.

### Acceptance Criteria

- [ ] A 3-step sequence on `trigger=visit` with delays [0, 24, 168] hours creates 3 jobs.
- [ ] After 24h, the second job moves to `sent` and surfaces an owner alert.

---

## Phase 11 — Testing & QA

### 11.1 Unit tests (Vitest)

**Required coverage** (mirroring `vision.md`):

- `lib/utils.ts` (`cn`, helpers)
- `lib/validation.ts` (phone, email, Zod schemas)
- `lib/templates.ts` (substitution)
- `lib/whatsapp.ts`
- `hooks/useAlerts.ts`
- `hooks/useCustomerStats.ts`
- `lib/plans.ts` (gating logic)

Target: ≥ 80% statements on `lib/` and `hooks/`.

### 11.2 Component tests

- Smoke tests for each view (renders without crash given a seeded IDB).
- Form validation tests for Add Customer, Add Visit, Create Campaign.

### 11.3 E2E (optional, recommended)

Playwright suite covering: signup → add customer → record visit → see on dashboard.

### 11.4 Manual QA checklist

- [ ] Offline: airplane mode, add customer, refresh, customer persists.
- [ ] Reconnect: customer appears in Supabase within 30s.
- [ ] Two-tenant test: User A cannot see User B's customers (via SQL probe).
- [ ] Mobile (375px): all 13 nav items reachable.

---

## Phase 12 — Deployment & Operations

### 12.1 Hosting

- **Frontend:** Vercel project, framework preset "Vite".
- Environment variables (Vercel dashboard → Settings → Environment Variables): see Appendix B.
- Branch strategy: `main` → production, `develop` → preview.

### 12.2 Supabase

- Run migrations via Supabase CLI:
  ```bash
  pnpm dlx supabase db push
  ```
- Edge Functions deployed via:
  ```bash
  pnpm dlx supabase functions deploy run-automation-jobs
  pnpm dlx supabase functions deploy sync-google-reviews
  pnpm dlx supabase functions deploy google-oauth-callback
  pnpm dlx supabase functions deploy reply-google-review
  ```
- Set cron via Supabase Studio → Database → Cron:
  - `run-automation-jobs`: `*/5 * * * *`
  - `sync-google-reviews`: `0 * * * *`

### 12.3 PWA

- Add a `vite-plugin-pwa` configuration in `vite.config.ts` (workbox runtime caching for static assets only — never cache Supabase API responses).
- Manifest: name "LokalOS", theme color from primary token, 192/512 icons.

### 12.4 Monitoring

- Sentry: project `lokalos-frontend`, alert rule on >1% error rate (5min window).
- Supabase Logs: enable "Auth" and "Database" log retention.

### 12.5 Backups

- Supabase: daily automated backups (Pro tier).
- Manual export of every `business_profile`'s data once a month via an Edge Function `monthly-backup` writing CSVs to Supabase Storage.

### 12.6 Release checklist

1. All Phase Acceptance Criteria pass.
2. `pnpm test` and `pnpm lint` green.
3. Lighthouse PWA + Performance + A11y ≥ 90.
4. RLS audit query returns zero unprotected tables.
5. Sentry test event fires.
6. Deploy to preview → smoke test → promote to production.

---

## Appendix A — Final File Tree

```
.
├── .env.local                       # Local env (gitignored)
├── .eslintrc.cjs
├── .prettierrc
├── .husky/
├── index.html
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts
├── components.json                  # shadcn config
├── public/
│   ├── icons/192.png, 512.png
│   └── manifest.webmanifest
├── supabase/
│   ├── migrations/
│   │   ├── 0001_init.sql
│   │   ├── 0002_rls.sql
│   │   ├── 0003_triggers.sql
│   │   └── 0004_automation.sql
│   └── functions/
│       ├── run-automation-jobs/
│       ├── sync-google-reviews/
│       ├── google-oauth-callback/
│       └── reply-google-review/
└── src/
    ├── main.tsx
    ├── router.tsx
    ├── index.css
    ├── types.ts
    ├── components/
    │   ├── ui/                      # shadcn primitives
    │   ├── Layout.tsx
    │   ├── ErrorBoundary.tsx
    │   ├── PlanGate.tsx
    │   ├── UpgradePrompt.tsx
    │   ├── StaffSelector.tsx
    │   ├── CustomerDialog.tsx
    │   ├── VisitDialog.tsx
    │   └── ...
    ├── views/                       # one file per route (lazy)
    │   ├── Auth.tsx
    │   ├── Home.tsx
    │   ├── Customers.tsx
    │   ├── CustomerDetail.tsx
    │   ├── FollowUps.tsx
    │   ├── Inactive.tsx
    │   ├── Reviews.tsx
    │   ├── Appointments.tsx
    │   ├── Campaigns.tsx
    │   ├── LoyaltySettings.tsx
    │   ├── RevenueDashboard.tsx
    │   ├── Leads.tsx
    │   ├── DataManagement.tsx
    │   ├── Reports.tsx
    │   ├── Settings.tsx
    │   ├── Automation.tsx
    │   ├── Locations.tsx
    │   ├── ActivityLog.tsx
    │   ├── GoogleReviewKit.tsx
    │   ├── ReviewMonitoring.tsx
    │   ├── AgencyDashboard.tsx
    │   ├── SetupSupabase.tsx
    │   └── Upgrade.tsx
    ├── hooks/
    │   ├── useBusinessProfile.ts
    │   ├── useCustomers.ts
    │   ├── useCustomerStats.ts
    │   ├── useAlerts.ts
    │   ├── useStaffTracker.ts
    │   ├── useStaffMetrics.ts
    │   ├── useRevenueAnalytics.ts
    │   ├── useCustomerAnalytics.ts
    │   ├── useColorTheme.ts
    │   └── useAccessibility.ts
    ├── lib/
    │   ├── supabaseClient.ts
    │   ├── indexedDb.ts
    │   ├── localDb.ts
    │   ├── syncQueue.ts
    │   ├── auditLogger.ts
    │   ├── validation.ts
    │   ├── templates.ts
    │   ├── whatsapp.ts
    │   ├── csv.ts
    │   ├── plans.ts
    │   ├── sentry.ts
    │   ├── analytics.ts
    │   ├── bootstrapBusiness.ts
    │   └── utils.ts
    └── test/
        └── setup.ts
```

---

## Appendix B — Environment Variables

| Var                          | Where                 | Example                     | Purpose                                        |
| ---------------------------- | --------------------- | --------------------------- | ---------------------------------------------- |
| `VITE_SUPABASE_URL`          | Vercel + `.env.local` | `https://abc.supabase.co`   | Supabase project URL                           |
| `VITE_SUPABASE_ANON_KEY`     | Vercel + `.env.local` | `eyJ...`                    | Public anon key                                |
| `VITE_SENTRY_DSN`            | Vercel + `.env.local` | `https://...@sentry.io/...` | Error tracking                                 |
| `VITE_ANALYTICS_KEY`         | Vercel + `.env.local` | `phc_...`                   | (Optional) PostHog key                         |
| `SUPABASE_SERVICE_ROLE_KEY`  | Supabase Edge only    | secret                      | For Edge Functions; **never** expose to client |
| `GOOGLE_OAUTH_CLIENT_ID`     | Supabase Edge only    | secret                      | GBP OAuth                                      |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Supabase Edge only    | secret                      | GBP OAuth                                      |

> **Rule:** Anything not prefixed `VITE_` is server-side only and **must not** appear in any `src/` file.

---

## Appendix C — Coding Conventions

1. **TypeScript strict mode**, `noUncheckedIndexedAccess` on. No `any`. Use `unknown` + Zod at boundaries.
2. **Hooks discipline:** no fetch in `useEffect`. All data via `localDb` + `useSWR`-like cached hooks (use `useSyncExternalStore` over IDB events).
3. **Component split:** no view file > 200 lines. Extract dialogs and tables into siblings.
4. **Imports order:** React → third-party → `@/` aliases → relative. Enforced by ESLint `import/order`.
5. **Naming:** components PascalCase; hooks `useFooBar`; lib utilities camelCase; SQL snake_case.
6. **Tailwind:** spacing scale only (no arbitrary `p-[17px]`). `gap-*` over `space-*`. Wrap headings in `text-balance`.
7. **A11y:** every interactive element must be keyboard reachable; dialogs use shadcn `<Dialog>` (focus-trap built in); `alt` on every `<img>`.
8. **Errors:** never `catch` silently. Re-throw or `Sentry.captureException`.
9. **Audits:** every state-changing user action calls `auditLogger.log({ type, entity, entity_id, staff_name })`.
10. **Commit style:** Conventional Commits. PRs require green CI.

---

## Appendix D — Definition of Done (per ticket)

A ticket is **done** when **all** of the following are true:

- [ ] Code matches this plan; deviations have a written ADR.
- [ ] Types are strict; no `@ts-ignore`.
- [ ] Unit tests cover the new logic; `pnpm test` green.
- [ ] Lint and format clean.
- [ ] Manual QA checklist for the relevant phase passes.
- [ ] Observability hooked up (audit log entry + analytics event where applicable).
- [ ] PR description references the phase + step number from this document.
- [ ] Reviewed and approved by the lead.

---

_End of plan. If you reach a point where this document does not answer "what do I do next?" — stop, document the gap, and escalate._
