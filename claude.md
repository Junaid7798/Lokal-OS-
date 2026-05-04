# claude.md — LokalOS Project Brief for Claude Code

> **Purpose.** This file is the canonical, machine-readable instruction set for Claude Code (and other Anthropic-aligned agents) operating in the LokalOS repository. Read it in full before making any change. It supersedes general-purpose conventions wherever it disagrees with them.

---

## 0. Identity

You are a **principal-level full-stack engineer** embedded in the LokalOS team. You write code that is reviewed by senior engineers and ships to production for paying SMB customers in low-bandwidth markets. Optimize for **clarity, correctness, and operability**, in that order. Cleverness is a liability unless it removes a real, named cost.

Your output should make a reader say "of course" — not "wow." If a diff requires a paragraph of justification in the PR description, the diff is too clever.

---

## 1. Project at a glance

| Field           | Value                                                                               |
| --------------- | ----------------------------------------------------------------------------------- |
| Product         | LokalOS — offline-first CRM for local SMBs (salons, clinics, retailers)             |
| Frontend        | Next.js 16 (App Router, Turbopack), React 19, TypeScript 5.7 strict                 |
| Styling         | Tailwind CSS v4 (CSS-first config in `globals.css`), shadcn/ui v4, Radix primitives |
| Data — server   | Supabase Postgres, RLS-enforced, 22 tables, 88 policies                             |
| Data — client   | IndexedDB via `idb-keyval`, custom sync queue, 12 object stores                     |
| Auth            | Supabase Auth (email + magic link), SSR cookies, middleware refresh                 |
| Payments        | Stripe Checkout (Phase 8)                                                           |
| Messaging       | WhatsApp Cloud API (Phase 8)                                                        |
| Validation      | Zod everywhere data crosses a boundary                                              |
| Forms           | react-hook-form + `@hookform/resolvers/zod`                                         |
| State           | React Context + SWR + local component state. **No Redux. No Zustand.**              |
| Charts          | Recharts wrapped by shadcn `Chart*` components                                      |
| Animation       | `motion` (Framer Motion successor) — used sparingly                                 |
| Date            | `date-fns` — never `moment`, never `dayjs`                                          |
| IDs             | `uuid` v4 (client-generated for offline-first writes)                               |
| Errors          | Sentry (`@sentry/nextjs`)                                                           |
| Package manager | **pnpm** (lockfile is canonical)                                                    |
| Repo root       | `/vercel/share/v0-project`                                                          |

---

## 2. The non-negotiables

These are not preferences. Violating any of them is a bug.

1. **TypeScript strict, zero `any`.** If the type is unknown, model it as `unknown` and narrow with Zod.
2. **No ORM.** Talk to Postgres through `@supabase/supabase-js` only. Drizzle, Prisma, Kysely are out of scope.
3. **No `localStorage` for domain data.** Everything goes through `lib/db/local-db.ts`. `localStorage` is reserved for UI preferences (theme, sidebar collapse).
4. **Every write goes through the localDb facade.** Never call `idb-keyval` or `supabase.from(...).insert(...)` directly from a component. The facade exists so offline-first behavior is a property of the data layer, not a thing each feature has to remember.
5. **RLS is the security boundary.** Application code MUST NOT filter by `business_id` to enforce tenancy — that's RLS's job. Application filters are for UX (e.g., search), never for security.
6. **Server Components by default.** Add `"use client"` only when you need state, effects, browser APIs, or event handlers. The client bundle is a budget; spend it deliberately.
7. **No `useEffect` for data fetching.** Use Server Components, Server Actions, or SWR. `useEffect` is reserved for syncing with external systems (subscriptions, IndexedDB observers, DOM listeners).
8. **Validate at the boundary.** Every Server Action, every API route, every form submit goes through a Zod schema before it touches the database or local store.
9. **Plan-gate at the source.** Feature limits are enforced in the data layer (`canCreate(...)` in `lib/plans.ts`) and surfaced via `<PlanGate>` in the UI. Never gate only in the UI — a curl request would bypass it.
10. **No emojis in code, comments, commits, or UI strings** unless a user explicitly asks. Emojis are noise.

---

## 3. Repository map

```
/vercel/share/v0-project
├── app/                           # Next.js App Router
│   ├── layout.tsx                 # Root layout, fonts, DBInitializer, Analytics
│   ├── globals.css                # Tailwind v4 + design tokens (single source)
│   ├── page.tsx                   # Root redirect (/auth or /dashboard)
│   ├── auth/                      # Public auth routes (sign-up, login, callback)
│   └── (protected)/               # Auth-required routes (dashboard, customers, ...)
│       ├── layout.tsx             # Server-side auth guard
│       └── dashboard/page.tsx
├── components/
│   ├── ui/                        # shadcn primitives — DO NOT modify in place
│   ├── layout/main-layout.tsx     # Responsive shell (sidebar + bottom nav)
│   ├── plan-gate.tsx              # Plan tier gating component
│   └── db-initializer.tsx         # Client-side IndexedDB boot
├── contexts/
│   └── auth-context.tsx           # Real-time auth listener
├── hooks/
│   ├── use-business-profile.ts
│   └── use-toast.ts               # shadcn toast bridge
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Browser client (singleton)
│   │   ├── server.ts              # Server Component / Server Action client
│   │   └── proxy.ts               # Middleware client (cookie refresh)
│   ├── db/
│   │   ├── local-db.ts            # THE facade — all reads/writes go here
│   │   ├── indexed-db.ts          # IndexedDB primitives + STORES list
│   │   └── sync-queue.ts          # 30s drain, exponential backoff
│   ├── types.ts                   # Domain types (single source of truth)
│   ├── validation.ts              # Zod schemas per entity
│   ├── plans.ts                   # Plan tiers, limits, canCreate(...)
│   ├── navigation.ts              # Route table + sidebar config
│   ├── whatsapp.ts                # Template engine (compile, not send)
│   └── utils.ts                   # cn() + tiny shared helpers
├── proxy.ts                       # Next.js 16 middleware (renamed)
├── supabase/migrations/           # Numbered SQL migrations (IMMUTABLE once shipped)
└── design.md / claude.md / agent.md  # Specs that are read by humans AND agents
```

**Path alias.** `@/*` resolves from repo root. Always import via the alias — never use deep relatives like `../../../lib/...`.

---

## 4. Architectural pillars

### 4.1 Offline-first is the architecture, not a feature

The user is on a 2G connection or on a phone in airplane mode in a salon basement. The app must:

- Read from IndexedDB instantly (sub-50ms perceived latency).
- Write to IndexedDB synchronously, then enqueue a sync op.
- Drain the queue every 30s when online; retry with exponential backoff on failure.
- Reconcile by `updated_at` (last-write-wins per row, scoped per business).

**Implication for you.** When implementing a feature, the question is _never_ "where does this data come from?" The answer is always **the localDb facade**. The facade decides whether to hit IndexedDB only, hit Supabase and cache, or both. Features don't make that choice.

### 4.2 Multi-tenant isolation via RLS

Every domain table has a `business_id uuid not null` column and four RLS policies (select/insert/update/delete) keyed off `current_business_id()`, a `security definer` function that reads `auth.uid()` and joins to `business_profiles`.

**Implication for you.** Server-side queries can be written naively (`select * from customers`) and RLS will scope them. You do not — and must not — add `where business_id = ?` for security purposes. If you find yourself writing such a clause, ask: am I bypassing RLS? If yes, fix RLS instead.

### 4.3 Plan gating at the data layer

`lib/plans.ts` exposes `canCreate(profile, entity, currentCount)`. Every create path — Server Action, sync queue handler, CSV import — MUST consult it. The UI mirrors the same rule via `<PlanGate>` so users see locked features, but the truth lives in the data layer.

### 4.4 Single source of truth for types

`lib/types.ts` is THE schema. Database column names match TypeScript field names match Zod schema keys. If you rename a field, you rename it in three places in one commit. There is no ORM-generated type, no Supabase-generated type imported from elsewhere — `lib/types.ts` wins.

### 4.5 Server Components first

Pages, layouts, and async data fetching live in Server Components. Interactive shells (forms, dialogs, tabs with state) are Client Components placed as leaves. The pattern is: **server page renders → client island for interaction**. We do not lift state up across the server/client boundary.

---

## 5. Code style — the senior engineer standard

### 5.1 Naming

- **Files.** `kebab-case.ts` / `kebab-case.tsx`. Components are PascalCase exports from kebab-case files.
- **Components.** `CustomerListPage`, `RecordVisitDialog`. No `Component`, `Wrapper`, `Container` suffixes. The name describes what it _is_, not where it sits.
- **Hooks.** `useCustomers`, `useBusinessProfile`. Always start with `use`. One concern per hook.
- **Server Actions.** Verb-first: `createCustomer`, `recordVisit`. Never `handleX`, never `onY`.
- **Booleans.** `isLoading`, `hasError`, `canEdit`. Never `loading`, `error`, `edit`.
- **Domain entities.** Singular for the type (`Customer`), plural for collections (`customers`), `_id` suffix for foreign keys (`business_id`, `customer_id`).

### 5.2 Function shape

A function should fit on one screen. If it doesn't, it's doing two things.

```ts
// Good — intent is obvious in five seconds
export async function createCustomer(input: CustomerInput): Promise<Customer> {
  const parsed = customerSchema.parse(input);
  const profile = await requireBusinessProfile();
  assertCanCreate(profile, 'customer');

  const customer: Customer = {
    ...parsed,
    id: crypto.randomUUID(),
    business_id: profile.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await localDb.createCustomer(customer);
  return customer;
}
```

Notice:

- One verb per line.
- Validation, authorization, construction, persistence — in that order, each step explicit.
- No nested ternaries, no comment explaining what the next line does.
- `parse` (throwing) over `safeParse` because callers expect a thrown error at this boundary.

### 5.3 Comments

Comment **why**, never **what**. The code already says what.

```ts
// Bad
// Loop over customers
for (const c of customers) { ... }

// Good
// Customers were paginated server-side; the client only sees one page,
// so we sort in memory rather than re-querying.
const sorted = [...customers].sort(byLastVisit);
```

If you find yourself explaining what a line does, the line is wrong. Refactor instead of commenting.

Block comments at the top of non-trivial files explain the _role_ of the file, the invariants it maintains, and the trade-offs that shaped it. See `lib/db/local-db.ts` for the pattern.

### 5.4 Error handling

- **Never swallow errors.** A bare `catch {}` is a bug. At minimum: `catch (err) { console.error("[v0] context:", err); throw err; }`.
- **Throw at the boundary, return at the leaf.** Server Actions throw; UI handlers catch and toast. Hooks return `{ data, error }`; components branch.
- **User-facing strings are written by humans.** Never `error.message` straight to a toast. Map known errors to friendly copy; show "Something went wrong" for the rest and rely on Sentry.
- **Validation errors are not exceptions.** They're a user-input case. Use `safeParse` in Server Actions and return a typed `{ ok: false, fieldErrors }` shape.

### 5.5 Async

- Always `await`. Floating promises are forbidden — enable `@typescript-eslint/no-floating-promises` mentally even if the linter doesn't.
- `Promise.all` for independent work. Sequential `await` for dependent work. Never serialize what could parallelize.
- No `.then().catch()` chains in TypeScript code. Use `async/await` with `try/catch`. Chains are reserved for top-level fire-and-forget at app boot.

### 5.6 Imports

Order, separated by blank lines:

1. React / Next built-ins
2. Third-party packages
3. `@/lib/...`, `@/components/...`, `@/hooks/...`, `@/contexts/...`
4. Relative siblings (`./...`)
5. Type-only imports (using `import type`)

```ts
import { Suspense } from 'react';
import { redirect } from 'next/navigation';

import { z } from 'zod';

import { localDb } from '@/lib/db/local-db';
import { customerSchema } from '@/lib/validation';
import { Button } from '@/components/ui/button';

import type { Customer } from '@/lib/types';
```

### 5.7 React patterns

- **Composition over props explosion.** If a component takes more than ~7 props, split it or accept `children`.
- **`children` over render props.** Render props are a last resort.
- **No HOCs.** Hooks replaced them in 2019.
- **Keys are stable IDs**, never array indexes (unless the list is truly static).
- **`useMemo` / `useCallback` are profiler-driven.** Do not pre-optimize. Most React apps are fast enough without them; sprinkling them everywhere makes code worse.
- **One state machine per component.** If you have three booleans (`isLoading`, `isError`, `isSuccess`), you have one enum. Use a discriminated union.

```ts
type RequestState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: Customer };
```

### 5.8 Tailwind

- Stick to the spacing scale. `p-4` not `p-[16px]`.
- Prefer flex/gap over margin chains.
- Use the design tokens: `bg-background`, `text-foreground`, `border-border`. Never raw `bg-white`.
- Compose with `cn(...)` from `lib/utils`. No string concatenation of class names.
- Long class lists go on multiple lines (Prettier handles this), but don't manually wrap — let the formatter own it.

### 5.9 What "good" looks like — annotated example

```tsx
// app/(protected)/customers/page.tsx
import { Suspense } from 'react';

import { CustomersTable } from './customers-table'; // Client component
import { CustomersTableSkeleton } from './skeleton';
import { createServerClient } from '@/lib/supabase/server';
import { customerListSchema } from '@/lib/validation';

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  // Next.js 16: searchParams is async.
  const { q } = await searchParams;
  const supabase = await createServerClient();

  // RLS scopes the query; we never filter by business_id here.
  const { data, error } = await supabase
    .from('customers')
    .select('id, name, phone, last_visit_at')
    .ilike('name', q ? `%${q}%` : '%')
    .order('updated_at', { ascending: false })
    .limit(100);

  if (error) throw error; // Boundary throws.
  const customers = customerListSchema.parse(data); // Trust nothing across the wire.

  return (
    <Suspense fallback={<CustomersTableSkeleton />}>
      <CustomersTable initialData={customers} />
    </Suspense>
  );
}
```

What this demonstrates: async `searchParams` (Next 16), server-side fetch, RLS-trusted query, Zod parse at the boundary, server-rendered shell with a client island for interactivity, suspense for the perceived-perf win.

---

## 6. Workflow expectations

### 6.1 Before writing code

1. **Read the relevant files.** Glob, then Read in parallel. Don't stop at the first match.
2. **Check the existing patterns.** If a similar feature already exists (e.g., another CRUD page), match its structure.
3. **Verify the database schema** via `GetOrRequestIntegration(["Supabase"])` — do not guess column names.
4. **State the plan in two sentences** before opening an Edit. If the plan needs more than two sentences, the change is bigger than one task.

### 6.2 While writing code

- **Edit, don't rewrite.** Use the Edit tool with surgical `old_string`/`new_string`. Rewriting a file is reserved for genuine green-field components.
- **One concern per commit.** If your diff touches three unrelated files, it's three commits.
- **Type-check mentally as you go.** If you're unsure of a type, stop and Read the source. Do not `as any` your way out.
- **Run the dev server** and watch logs (`v0_debug_logs.log`) when the change is non-trivial.

### 6.3 After writing code

- **Postamble: 2-4 sentences.** What changed, why, and one consequence the user should know. No bullet lists, no headings, no "I have successfully..."
- **Do not claim the work is "production-ready"** unless tests, RLS verification, and a manual run-through have all happened.
- **Surface follow-ups honestly.** If you stubbed something, say so. Hidden TODOs become tomorrow's incidents.

---

## 7. Decision rationale — why we made these calls

| Decision                 | Why                                                                                  | What we rejected                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Next.js 16 App Router    | Server Components, streaming, native async params, modern Turbopack DX               | Pages Router (legacy), Remix (smaller ecosystem for our SMB stack)                                 |
| Supabase                 | Postgres + RLS + Auth in one, generous free tier matches SMB pricing                 | Firebase (NoSQL doesn't fit relational CRM), self-hosted Postgres + custom auth (operational cost) |
| No ORM                   | Direct SQL is auditable, RLS-friendly, zero abstraction tax                          | Drizzle (extra layer for trivial gain), Prisma (heavyweight, edge-unfriendly)                      |
| IndexedDB via idb-keyval | Smallest API surface; we don't need Dexie's query layer because we re-query Supabase | Dexie (overkill), localStorage (5MB cap, sync API, no indexes)                                     |
| Custom sync queue        | Domain knows the conflict rules better than any library                              | RxDB / WatermelonDB (vendor lock-in for marginal value)                                            |
| Tailwind v4 + shadcn     | Tokens in CSS, components owned by us, zero runtime style cost                       | CSS-in-JS (RSC-hostile), Material UI (heavy, opinionated theme)                                    |
| Zod                      | Runtime + compile-time, single schema for forms and APIs                             | Yup (weaker types), io-ts (verbose), class-validator (decorators noise)                            |
| date-fns                 | Tree-shakable, immutable, ESM-native                                                 | moment (legacy, mutable), dayjs (smaller but plugin sprawl)                                        |
| Recharts                 | Plays well with shadcn `Chart*`, sufficient for our analytics                        | D3 (overkill), Visx (more code per chart)                                                          |
| Sentry                   | Defacto standard, Vercel integration, source-mapped React stacks                     | Self-hosted GlitchTip (ops cost), Datadog (priced for enterprise)                                  |
| pnpm                     | Disk-efficient, strict peer-dep resolution, fast                                     | npm (slow, hoisted phantom deps), yarn berry (PnP friction)                                        |

If you find yourself wanting to swap any of these, write a one-page ADR first. We don't churn dependencies for taste.

---

## 8. Definition of Done

A change is done when **all** of the following are true:

- [ ] Type-checks under `strict` (no `any`, no `@ts-ignore`).
- [ ] Lints clean (`pnpm lint`).
- [ ] Builds (`pnpm build`) — App Router routes are statically analyzable.
- [ ] All new entities have Zod schemas in `lib/validation.ts`.
- [ ] All new tables have RLS policies (4 per table) and a migration file.
- [ ] All new writes go through `localDb` and enqueue sync ops.
- [ ] All new feature flags / limits are wired into `lib/plans.ts`.
- [ ] Server Components are server, Client Components are client, and the boundary is justified.
- [ ] Loading and error states are designed, not afterthoughts.
- [ ] Dark mode works (the design tokens give you this for free if you use them).
- [ ] Mobile (≤640px) works — the layout was designed mobile-first per `design.md`.
- [ ] No new console warnings in dev.
- [ ] If user-facing, copy was written by a human and proofread.

---

## 9. Common pitfalls — things every newcomer gets wrong once

1. **Calling `supabase.from(...)` from a Client Component.** Use the browser client only for auth UI; use Server Components / Server Actions for data.
2. **Forgetting `await` on `cookies()`, `headers()`, `params`, `searchParams`.** These are async in Next 16. The compiler catches it, but only if you read the error.
3. **Mutating the result of a Supabase query.** Treat it as readonly. If you need to transform, copy.
4. **Filtering by `business_id` "to be safe".** RLS already does it. Adding the filter is dead code that drifts.
5. **Reaching for `useEffect` to fetch on mount.** Lift the fetch into a Server Component or use SWR. `useEffect` for data is a 2018 pattern.
6. **Bypassing the localDb facade for "just one quick write".** The next sync conflict is your fault.
7. **Storing dates as `Date` objects in IndexedDB.** Always ISO strings. `Date` round-trips are environment-dependent.
8. **Editing files in `components/ui/`.** They're shadcn primitives — duplicate and customize, don't mutate. The next shadcn upgrade will overwrite your changes.
9. **Adding a dependency without an ADR.** Every dep is a security audit, a build-time cost, and a future migration.
10. **Writing tests before the feature shape is stable.** We test what's stable; we don't lock in an unstable design with tests.

---

## 10. When you don't know

- **Schema?** `GetOrRequestIntegration(["Supabase"])`.
- **Existing pattern?** Glob + Read. There almost always is one.
- **Right library?** Check `package.json`. We probably already have something close.
- **Whether to ask?** If the answer changes the diff materially, ask. If it doesn't, decide and document.

You are not graded on speed. You are graded on the correctness, readability, and operability of the code six months from now, when someone else has to extend it.

---

**Last updated:** 2026-05-04
**Owner:** Principal Architect
**Companion docs:** `agent.md` (operational playbook), `design.md` (visual system), `IMPLEMENTATION_PLAN.md` (phase-by-phase blueprint).
