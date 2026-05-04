# LokalOS Codebase Audit Report

**Audit Date:** May 5, 2026
**Auditor:** AI Code Review Agent
**Scope:** Full-stack React/TypeScript application (src/, lib/, components/, hooks/, views/)
**Methodology:** Static analysis, architectural review, TypeScript compilation check (`tsc --noEmit` ✓ passes), pattern matching, and manual code inspection.

---

## Executive Summary

LokalOS is a local business CRM SaaS built with React 19, TypeScript, Vite, Tailwind CSS v4, and Supabase. The codebase demonstrates solid architectural foundations with an offline-first IndexedDB/localStorage dual-storage layer, shadcn/ui component integration, and a clear design system (UI-SPEC.md). However, the project exhibits significant **data layer fragmentation**, **security vulnerabilities around credential storage**, **stub implementations** in several views, and **algorithmic inefficiencies** that will cause performance degradation as data scales. The TypeScript strictness has been improved recently (SESSION.md notes fixing `any` casts), but regressions and mixed import patterns remain.

**Overall Grade: C+** — Functional core with promising architecture, but requires hardening for production.

---

## 1. Critical Bugs, Runtime Errors & Security Vulnerabilities

### 🔴 CRITICAL

| ID | Issue | Location | Impact | Fix Priority |
|----|-------|----------|--------|--------------|
| **C1** | **Supabase client used without null checks in multiple views** | `CustomerDetail.tsx`, `Appointments.tsx`, `Reports.tsx`, `Leads.tsx`, `Campaigns.tsx`, `DataManagement.tsx` | **Runtime crashes** when Supabase is not configured (e.g., offline mode or initial setup). These views call `supabase.from(...)` directly without checking `if (supabase)`. | Immediate |
| **C2** | **Supabase credentials stored in localStorage** | `supabaseClient.ts`, `SetupSupabase.tsx` | **Security vulnerability**: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` fall back to `localStorage.getItem('supabase_url')`. localStorage is accessible to any XSS payload. Anon keys in client-side code are expected, but storing them in localStorage increases XSS blast radius. | Immediate |
| **C3** | **Invalid date parsing without validation** | `useAlerts.ts:40`, `useOccasions` in `useAlerts.ts:126-129` | `new Date(c.created_at)` and `new Date(c.birthday_date)` can return `Invalid Date`, causing `isSameDay` and `format` to throw or behave unpredictably. | Immediate |
| **C4** | **Missing auth token/session validation** | `AuthContext.tsx:147-150` | When Supabase is unavailable, the app falls back to `localDb.getAuth()` and casts the cached object to `User` without validation. A malformed localStorage entry could cause crashes or impersonation. | Immediate |

### 🟠 HIGH

| ID | Issue | Location | Impact |
|----|-------|----------|--------|
| **H1** | **useSession declared as async arrow inside component** | `CustomerDetail.tsx:164` | `const useSession = async (...) => {...}` violates React Rules of Hooks (naming convention). While not a hook currently, refactoring risk is high. It also mutates `packages` state directly via `setPackages` inside the same component, which is fine, but the naming is dangerous. |
| **H2** | **Blocking `prompt()` and `confirm()` in event handlers** | `Inactive.tsx:95-99`, `Customers.tsx:140` | `window.prompt` and `window.confirm` block the main thread. In `Inactive.tsx`, `prompt` returns `null` on cancel, but `parseFloat(null)` returns `NaN`, which is passed to Supabase insert. In `Customers.tsx`, `confirm` is used during customer creation flow. |
| **H3** | **Raw HTML inputs in CustomerDetail** | `CustomerDetail.tsx:305-380` | Uses raw `<input>`, `<select>`, `<textarea>` and `<button>` instead of shadcn/ui components, bypassing form validation, accessibility, and styling consistency. |
| **H4** | **Hardcoded dashboard stats** | `Inactive.tsx:122-129` | The inactive customer count shows static values (`12` customers, `$1,200` recovery) instead of computed data from `inactiveLists`. This is misleading to users. |
| **H5** | **Dialog conditionally rendered breaking focus management** | `Automation.tsx:261` | `{showDialog && (<Dialog...>)}` prevents Radix from managing focus lifecycle correctly. Dialogs should always be mounted with `open` prop controlled. |
| **H6** | **XSS via unsanitized window.open** | `Campaigns.tsx:205-206`, `Appointments.tsx:185-196` | WhatsApp deep links are constructed with `${r.customer?.phone}` without sanitization. While phone numbers are user-input, malicious data could inject `javascript:` protocols or other schemes. |
| **H7** | **Error boundary doesn't report to Sentry** | `ErrorBoundary.tsx:25-26` | `componentDidCatch` only logs to `console.error`. The outer `Sentry.ErrorBoundary` in `App.tsx` may catch it, but the custom boundary swallows the error from Sentry's integration. |

### 🟡 MEDIUM

| ID | Issue | Location | Impact |
|----|-------|----------|--------|
| **M1** | **Type assertions masking nulls** | `AuthContext.tsx:149` | `as User` casts a partial object to full Supabase User type, hiding missing properties from downstream consumers. |
| **M2** | **useLoadingState returns static noop** | `errors.ts:128-134` | The hook returns `isLoading: false`, `error: null`, and `retry: () => {}` permanently. It's a dead utility that misleads developers into thinking it manages state. |
| **M3** | **import() used without error boundaries** | `Customers.tsx:286-320` | Dynamic imports for `papaparse` and `xlsx` in `handleImportData` lack try/catch around the `import()` calls themselves. Network failures loading chunks will crash. |
| **M4** | **Missing `key` stability in mapped lists** | `Appointments.tsx:163-204` | Cards mapped from `appointments` don't always have stable keys where nested elements change. |
| **M5** | **Plan limit check inconsistent** | `planLimits.ts:34-51` | `checkLimit` handles `'Automation'` plan specially but `hasFeature` does not validate that `business.plan` actually exists in `PLANS`. Invalid plan strings cause `PLANS[business.plan]` to be `undefined`. |

---

## 2. Logical Inconsistencies, Edge-Case Failures & Algorithmic Inefficiencies

### 🔴 CRITICAL

| ID | Issue | Location | Impact |
|----|-------|----------|--------|
| **L1** | **Data layer fragmentation: dual storage without single source of truth** | `Home.tsx`, `CustomerDetail.tsx`, `Reports.tsx`, `Appointments.tsx` | Some views read from `localDb` (IndexedDB), others read directly from `supabase`, and `Home.tsx` uses Supabase joins. This creates **split-brain scenarios**: data written to IndexedDB may not appear in Supabase-dependent views, and vice versa. The sync queue is only used for customer inserts/deletes, not for visits, appointments, or actions. |
| **L2** | **O(n×m) nested loop in useAlerts** | `useAlerts.ts:53-72` | For every customer, it scans ALL actions to find follow-ups. With 1,000 customers and 10,000 actions, this is 10M operations per render. No indexing by `customer_id` or `action_type`. |
| **L3** | **Customers.tsx loads all visits into memory to calculate revenue** | `Customers.tsx:323-374` | `processedCustomers` useMemo recalculates `reduce()` over all visits for every customer on every search/sort/filter change. For 10k visits, this is expensive. |

### 🟠 HIGH

| ID | Issue | Location | Impact |
|----|-------|----------|--------|
| **L4** | **Inactive.tsx loads ALL customers with ALL visits** | `Inactive.tsx:39-42` | Uses `.select('*, visits(*)')` which fetches every visit for every customer. With 500 customers × 20 visits = 10k rows loaded into memory just to find the latest visit date. Should use a grouped query or dedicated view. |
| **L5** | **FollowUps.tsx loads entire customer + action datasets** | `FollowUps.tsx:28-29` | Same pattern: loads every customer and every action to compute follow-ups. Should be computed server-side or with IndexedDB cursors. |
| **L6** | **Import bypasses IndexedDB and writes directly to localStorage** | `Customers.tsx:269-273` | `localStorage.setItem(`customers_${profile.id}`, JSON.stringify(currentList))` bypasses the IndexedDB abstraction, corrupting the data layer's consistency and breaking the sync queue. |
| **L7** | **Missing pagination everywhere** | `Customers.tsx`, `Home.tsx`, `FollowUps.tsx`, `Inactive.tsx` | No pagination, cursor-based fetching, or virtual scrolling. The app will become unusable at ~500+ customers. |
| **L8** | **Revenue calculation inconsistent across views** | `Home.tsx` (useCustomerStats), `CustomerDetail.tsx:217-244`, `RevenueDashboard.tsx:84-96` | Each view calculates revenue independently with slightly different logic (e.g., `parseFloat` vs direct number access). Creates risk of displaying different totals on different screens. |

### 🟡 MEDIUM

| ID | Issue | Location | Impact |
|----|-------|----------|--------|
| **L9** | **Settings form wraps multiple TabsContent in one form** | `Settings.tsx:242-269` | The `<form onSubmit={handleSave}>` wraps only the first two tabs (`business`, `messages`). Tabs like `followup`, `branding`, `loyalty` are OUTSIDE the form and won't save. |
| **L10** | **Automation job status type mismatch** | `localDb.ts:804` | `updateAutomationJob` accepts `'pending' | 'in_progress' | 'completed' | 'failed'` but `AutomationJobRecord` defines status as `'pending' | 'in_progress' | 'completed' | 'failed'` — actually consistent, BUT `getPendingAutomationJobs` filters by `'pending'` and `next_step_at` while `createAutomationJob` sets `status: 'pending'` and `next_step_at` correctly. However, `getPendingAutomationJobs` uses `j.next_step_at` but the record type uses `next_step_at` while jobs are created with `next_step_at` — consistent. Wait, `getPendingAutomationJobs` filters by `j.status === 'pending' && j.next_step_at` but `createAutomationJob` sets `next_step_at: job.next_step_at || now`. This seems okay. |
| **L11** | **Locations.tsx is a non-functional stub** | `Locations.tsx` | The entire view has no state, no handlers, and the "Add Location" button does nothing. The `Location` type exists in `types.ts` but is unused in any functional code. |
| **L12** | **LoyaltySettings.tsx shows only placeholder** | `LoyaltySettings.tsx` | Entire loyalty configuration UI is "coming soon". Types and schemas exist but UI is absent. |

---

## 3. Technical Debt, Anti-Patterns & Best Practice Deviations

### Architecture & Data Layer

1. **Mixed Import Patterns**: The codebase uses both `@/lib/...` and `../lib/...` inconsistently. AGENTS.md mandates `@/` but relative paths dominate in views. This breaks refactoring and indicates deferred migration.
2. **Direct localStorage Access**: 42 instances of `localStorage.getItem/setItem` scattered across components (`Customers.tsx`, `CustomerDetailModal.tsx`, `Settings.tsx`, hooks). This bypasses the `localDb` abstraction and makes migration/testing impossible.
3. **Sync Queue Only Covers Customers**: `enqueueSyncOp` is called for `customers` and `automation_sequences/jobs`, but **never** for `visits`, `appointments`, `leads`, `campaigns`, or `actions`. The offline-first claim is incomplete.
4. **Module-Level Side Effects**: `syncQueue.ts:179` calls `startSyncInterval()` at module load time. This executes immediately on import, even during SSR or test environments, causing unpredictable behavior.
5. **Supabase Client Singleton with Mutable Config**: `supabaseClient.ts` reads config once at module initialization. If the user updates credentials in `SetupSupabase.tsx`, the module-level `supabase` instance remains `null` until page refresh.

### React & TypeScript

6. **`any` Types Still Present**: Despite recent cleanup (SESSION.md), `any` remains in:
   - `useAsync.ts:89`: `useAsyncCallback<T extends (...args: any[]) => Promise<any>>`
   - `auditLogger.ts:10`: `metadata?: Record<string, any>`
   - `geminiAssistant.ts:46`: `data: Record<string, any>`
   - `exportUtils.ts:2`: `data: any[]`
   - `Settings.tsx:326`: `setProfile: React.Dispatch<React.SetStateAction<any>>`
   - Test files: `useCustomerStats.test.ts` (multiple `as any` casts)
7. **Type Assertions**: `customerData as unknown as Action[]`, `data as unknown as AutomationSequence[]`, and `as User` are used to bypass type checking rather than fixing data contracts.
8. **Error Handling with `err: any`**: `CustomerDetail.tsx`, `MessageAssistant.tsx` use `catch (err: any)` instead of `unknown` with proper narrowing.
9. **Inline Styles & Hardcoded Colors**: Multiple components use hardcoded colors (`bg-emerald-500/10`, `text-emerald-600`, `bg-amber-50`, `text-amber-800`) instead of semantic tokens (`bg-success/10`, `text-success`). This breaks theming and dark mode consistency.
10. **Props Drilling in Settings**: `Settings.tsx` passes `formData` and `handleFormChange` to sub-components individually instead of using a form context or React Hook Form.

### Performance

11. **No Memoization for Expensive Components**: `Layout.tsx` re-renders all nav items on every route change. `DesktopNavItem` and `MobileNavItem` are not memoized.
12. **Recharts Lazy Loading Per-Component**: `Home.tsx` lazy-loads each Recharts sub-component individually (`Bar`, `Line`, `XAxis`, etc.), creating 6+ separate chunks and Suspense boundaries. Better to lazy-load the entire chart component or the view itself.
13. **String Concatenation for IDs**: `generateId()` uses `Date.now() + '_' + Math.random()`. This is not cryptographically secure and has collision risk under high throughput. Use `crypto.randomUUID()` where available.

### Testing

14. **Test Framework Configured but Empty**: `vitest.config.ts` exists, but `package.json` shows Vitest and React Testing Library dependencies. Only 2 test files exist (`useCustomerStats.test.ts`, `utils.test.ts`, `validation.test.ts`), and they use `as any` extensively.
15. **No E2E Tests**: Playwright is not configured despite UI-SPEC mentioning complex mobile/desktop responsive behaviors.

---

## 4. Feature Enhancement & UX Refinement Opportunities

### High-Impact UX Improvements

| Feature | Current State | Recommended Action | Priority |
|---------|--------------|-------------------|----------|
| **Global Search** | Mentioned in UI-SPEC but not implemented | Add `cmd+k` modal with Fuse.js or similar fuzzy search over customers, visits, and leads | High |
| **Pagination / Virtualization** | All lists load everything | Implement cursor-based pagination for Supabase views and `react-window` for local lists | High |
| **Mobile Bottom Nav Overflow** | 12 nav items in mobile bottom bar | Follow UI-SPEC: exactly 5 tabs + "More" drawer. Currently overflows on small screens. | High |
| **Offline Indicator** | No visual feedback when offline | Add a subtle banner/indicator when `navigator.onLine === false` | Medium |
| **Pull-to-Refresh** | Not implemented | Add `react-pull-to-refresh` or native touch handlers for list views | Medium |
| **Form Validation** | Manual validation scattered | Integrate Zod schemas (`validation.ts`) with `react-hook-form` consistently | High |
| **Print Styles** | `print-qr` class exists but no print stylesheet | Add comprehensive `@media print` styles for reports and QR codes | Low |
| **Data Export Encryption** | CSV exports are plain text | Offer password-protected ZIP for PII compliance | Medium |
| **Accessibility Audit** | `AccessibilityAudit.tsx` exists but is superficial | Implement axe-core violations overlay and fix heading hierarchy issues | High |

### Missing Core Features (Stubs)

| Feature | Location | Notes |
|---------|----------|-------|
| **Locations Management** | `Locations.tsx` | Entirely non-functional stub |
| **Loyalty Program Config** | `LoyaltySettings.tsx`, Settings tab | UI shows placeholder; types/schemas ready |
| **Weekly Reports** | `Reports.tsx` | Tab exists but shows "Coming Soon" |
| **Google Review Sync** | `ReviewMonitoring.tsx` | OAuth not wired |
| **Automation Job Runner** | `SESSION.md` notes | Edge Function not deployed; jobs are created but never executed |
| **WhatsApp API Provider** | `whatsappProvider.ts` | Only interface exists; no real provider implemented |

### Code Quality Tooling Gaps

- **No pre-commit hooks**: Husky + lint-staged not configured
- **No dead code detection**: Knip or similar not used
- **No bundle analysis script**: `build:analyze` uses `rm -rf` which won't work on Windows
- **No dependency audit**: `npm audit` not integrated into CI

---

## 5. Actionable Refactoring Roadmap

### Phase 1: Critical Stability (Week 1)

1. **Fix null-supabase crashes**: Wrap ALL direct `supabase.from()` calls in `if (!supabase) { toast.error('Database not connected'); return; }`.
2. **Date validation**: Create a `safeDate(value: unknown): Date | null` utility and use it in `useAlerts`, `useOccasions`, `useCustomerStats`.
3. **Replace hardcoded stats in Inactive.tsx**: Compute `inactiveLists['30'].length` and actual recovered revenue.
4. **Fix Settings form scope**: Move `<form>` to wrap ALL `TabsContent` elements, or use per-tab save buttons.
5. **Security**: Move Supabase credentials from `localStorage` to `sessionStorage` (slightly better) or implement an in-memory config store with encrypted-at-rest option.

### Phase 2: Data Layer Unification (Week 2)

1. **Enforce localDb as the single source of truth**: Refactor `CustomerDetail.tsx`, `Appointments.tsx`, `Reports.tsx` to use `localDb` methods instead of direct Supabase calls.
2. **Expand sync queue**: Add `visits`, `appointments`, `actions`, `leads`, `campaigns` to the sync queue.
3. **Implement server-side queries for analytics**: Use Supabase RPC/functions for dashboard stats instead of loading all rows.
4. **Add pagination**: Implement `limit`/`offset` or cursor-based fetching in `localDb` and Supabase views.

### Phase 3: Performance & UX (Week 3)

1. **Memoize expensive computations**: Extract `useAlerts` O(n×m) loop into a Map-based index: `actionsByCustomerId`.
2. **Virtualize lists**: Add `react-window` to Customers and FollowUps lists.
3. **Implement global search**: Add `cmd+k` search modal.
4. **Fix mobile nav**: Limit to 5 items with "More" drawer as per UI-SPEC.
5. **Add loading skeletons**: Replace "Loading..." text with `Skeleton` components consistently.

### Phase 4: Hardening (Week 4)

1. **Remove all `any` types**: Fix remaining `any` in `useAsync.ts`, `auditLogger.ts`, `geminiAssistant.ts`.
2. **Standardize imports**: Migrate all `../lib/` imports to `@/lib/`.
3. **Add tests**: Write unit tests for `localDb`, `syncQueue`, and `useCustomerStats`. Add component tests for `CustomerDetailModal`.
4. **Implement stub views**: Build functional `Locations.tsx` and `LoyaltySettings.tsx`.
5. **Security audit**: Sanitize all `window.open` URLs, replace `prompt`/`confirm` with modal dialogs, and add Content Security Policy headers.

---

## Appendix: File-by-File Quick Reference

| File | Grade | Key Issues |
|------|-------|------------|
| `src/App.tsx` | B+ | Good lazy loading, but inconsistent Suspense boundaries |
| `src/lib/localDb.ts` | B | Solid dual-storage, but import bypasses it; no pagination |
| `src/lib/indexedDb.ts` | B+ | Clean IndexedDB wrapper, good migration logic |
| `src/lib/syncQueue.ts` | C+ | Side effects at import time; narrow table coverage |
| `src/lib/supabaseClient.ts` | C | Credentials in localStorage; immutable singleton |
| `src/contexts/AuthContext.tsx` | B | Good state management, but fake User cast is risky |
| `src/views/Customers.tsx` | B- | Complex but functional; import writes to localStorage directly |
| `src/views/CustomerDetail.tsx` | D+ | Direct Supabase usage, raw HTML inputs, blocking prompts |
| `src/views/Home.tsx` | B | Good structure, but loads excessive data via joins |
| `src/views/Settings.tsx` | C | Form scope bug, `any` in props, hardcoded plan toggle |
| `src/views/Automation.tsx` | B | Clean UI, but Dialog conditionally rendered |
| `src/views/Reports.tsx` | C+ | Direct Supabase, missing error handling on parallel fetches |
| `src/views/FollowUps.tsx` | C+ | O(n×m) algorithm, loads entire datasets |
| `src/views/Inactive.tsx` | D | Hardcoded stats, blocking prompts, Supabase without null checks |
| `src/views/Appointments.tsx` | C | No validation, direct Supabase, no time conflict checks |
| `src/views/Locations.tsx` | F | Complete stub |
| `src/views/Leads.tsx` | C | Direct Supabase, no validation |
| `src/views/Campaigns.tsx` | C | Direct Supabase, no edit/delete, XSS risk in links |
| `src/components/Layout.tsx` | B | Good responsive layout, but mobile nav overflow |
| `src/components/CustomerDetailModal.tsx` | B+ | Polished UI, but inline classes are excessive |
| `src/components/ErrorBoundary.tsx` | C | Doesn't integrate with Sentry |
| `src/hooks/useAlerts.ts` | C | O(n×m) complexity, invalid date risk |
| `src/hooks/useCustomerStats.ts` | B+ | Clean memoization, but parseFloat on every render |
| `src/hooks/useBusinessProfile.ts` | B | Good hook, but `Enterprise` plan is invalid per types |
| `src/hooks/useAsync.ts` | C | `any` in generic constraint |
| `src/types.ts` | A | Comprehensive and well-organized |
| `src/lib/validation.ts` | B+ | Good Zod schemas, but not used in most forms |

---

*End of Audit Report*
