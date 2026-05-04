# LokalOS - Complete Project Documentation

> **Generated:** May 5, 2026  
> **Version:** 1.0.0  
> **Repository:** https://github.com/Junaid7798/Lokal-OS-.git

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Database Schema](#4-database-schema)
5. [Core Features](#5-core-features)
6. [Architecture Deep Dive](#6-architecture-deep-dive)
7. [Component Library](#7-component-library)
8. [Custom Hooks](#8-custom-hooks)
9. [Utility Libraries](#9-utility-libraries)
10. [Views/Pages](#10-viewspages)
11. [Design System](#11-design-system)
12. [Authentication & Authorization](#12-authentication--authorization)
13. [Offline-First Strategy](#13-offline-first-strategy)
14. [Plan & Feature Gating](#14-plan--feature-gating)
15. [Testing](#15-testing)
16. [Build & Deployment](#16-build--deployment)
17. [Environment Variables](#17-environment-variables)
18. [Development Guidelines](#18-development-guidelines)
19. [API Reference](#19-api-reference)
20. [Changelog](#20-changelog)

---

## 1. Project Overview

**LokalOS** is a comprehensive local business management SaaS application designed for small-to-medium businesses such as salons, clinics, cafes, and repair shops. It combines CRM, marketing automation, appointment scheduling, loyalty programs, and analytics into a single, offline-first platform that syncs to the cloud.

### Key Philosophy
- **Simplicity First** — 5-minute setup, instant value
- **Mobile-Native** — Works beautifully on phone
- **WhatsApp-First** — Meet customers where they are
- **Offline-First** — Works without internet
- **Growth-Focused** — Built to scale

### Target Users
- Salon owners
- Clinic administrators
- Cafe managers
- Repair shop owners
- Any local service business

---

## 2. Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend Framework** | React | 19.0.1 | UI rendering |
| **Language** | TypeScript | ~5.8.2 | Type safety |
| **Build Tool** | Vite | 6.2.3 | Bundling & dev server |
| **Styling** | Tailwind CSS | 4.1.14 | Utility-first CSS |
| **UI Components** | shadcn/ui v4 | 4.6.0 | Component primitives |
| **Component Base** | Base UI / Radix UI | 1.4.1 | Accessible primitives |
| **Icons** | Lucide React | 0.546.0 | Icon library |
| **Database** | Supabase (PostgreSQL) | 2.105.1 | Cloud database |
| **Local Storage** | IndexedDB + localStorage | — | Offline persistence |
| **Routing** | React Router DOM | 7.14.2 | Client-side routing |
| **Charts** | Recharts | 3.8.1 | Data visualization |
| **Animation** | Motion (framer-motion) | 12.23.24 | Animations |
| **Forms** | React Hook Form | 7.74.0 | Form management |
| **Validation** | Zod | 4.4.2 | Schema validation |
| **Dates** | date-fns | 4.1.0 | Date manipulation |
| **Toasts** | Sonner | 2.0.7 | Notifications |
| **Error Tracking** | Sentry | 10.51.0 | Error monitoring |
| **Analytics** | Google Analytics | 4 | Page tracking |
| **AI Assistant** | Google GenAI | 1.29.0 | Message generation |
| **Testing** | Vitest | 4.1.5 | Unit testing |
| **Testing DOM** | jsdom | 29.1.1 | Test environment |
| **Testing Utils** | React Testing Library | 16.3.2 | Component testing |
| **PWA** | Vite PWA Plugin | 1.2.0 | Service worker |
| **Fonts** | Geist Variable | 5.2.8 | Primary typeface |

---

## 3. Project Structure

```
lokalos/
├── public/                          # Static assets
│   ├── icon-192.svg                 # PWA icon
│   └── manifest.json                # PWA manifest
├── src/
│   ├── components/                  # React components
│   │   ├── ui/                      # shadcn/ui components (10 files)
│   │   │   ├── button.tsx           # Button with variants
│   │   │   ├── card.tsx             # Card container
│   │   │   ├── dialog.tsx           # Modal/dialog
│   │   │   ├── dropdown-menu.tsx    # Dropdown menu
│   │   │   ├── input.tsx            # Text input
│   │   │   ├── label.tsx            # Form label
│   │   │   ├── select.tsx           # Dropdown select
│   │   │   ├── skeleton.tsx         # Loading skeleton
│   │   │   ├── sonner.tsx           # Toast notifications
│   │   │   ├── tabs.tsx             # Tab navigation
│   │   │   └── textarea.tsx         # Multi-line input
│   │   ├── settings/                # Settings sub-components
│   │   │   ├── BrandingSettings.tsx
│   │   │   ├── BusinessSettings.tsx
│   │   │   ├── DataExport.tsx
│   │   │   ├── FollowUpRules.tsx
│   │   │   └── MessageSettings.tsx
│   │   ├── AccessibilityAudit.tsx   # A11y checker
│   │   ├── AISummary.tsx            # AI-generated summaries
│   │   ├── CustomerDetailModal.tsx  # Customer detail popup
│   │   ├── CustomerListItem.tsx     # Customer list row
│   │   ├── CustomerTableRow.tsx     # Customer table row
│   │   ├── ErrorBoundary.tsx        # Error catching
│   │   ├── LazyImage.tsx            # Lazy-loaded images
│   │   ├── Layout.tsx               # App shell (sidebar + header)
│   │   ├── LockedFeature.tsx        # Plan gate wrapper
│   │   ├── MessageAssistant.tsx     # AI message generator
│   │   ├── OnboardingTour.tsx       # First-time tour
│   │   ├── RoutePrefetch.tsx        # Route preloading
│   │   ├── ScreenReaderOnly.tsx     # A11y helper
│   │   ├── ThemeProvider.tsx        # Dark/light mode
│   │   └── VirtualList.tsx          # Virtualized lists
│   ├── contexts/
│   │   └── AuthContext.tsx          # Authentication state
│   ├── hooks/                       # Custom React hooks
│   │   ├── useAccessibility.ts      # Keyboard shortcuts, focus traps
│   │   ├── useAlerts.ts             # Dashboard alert generation
│   │   ├── useAsync.ts              # Async operation state
│   │   ├── useBusinessProfile.ts    # Business profile data
│   │   ├── useColorTheme.ts         # Theme switching
│   │   ├── useCustomerAnalytics.ts  # RFM segmentation
│   │   ├── useCustomerStats.ts      # Dashboard statistics
│   │   ├── useDebounce.ts           # Debounce/throttle utilities
│   │   ├── useRevenueAnalytics.ts   # Revenue metrics
│   │   ├── useStaffMetrics.ts       # Staff performance
│   │   └── useStaffTracker.ts       # Active staff selection
│   ├── lib/                         # Utility libraries
│   │   ├── actionLogger.ts          # Action logging wrapper
│   │   ├── analytics.ts             # Google Analytics integration
│   │   ├── auditLogger.ts           # Audit trail logging
│   │   ├── campaigns.ts             # Campaign automation engine
│   │   ├── constants.ts             # App constants & defaults
│   │   ├── coupons.ts               # Coupon management
│   │   ├── errors.ts                # Error handling utilities
│   │   ├── exportUtils.ts           # CSV export
│   │   ├── geminiAssistant.ts       # Google AI integration
│   │   ├── indexedDb.ts             # IndexedDB wrapper
│   │   ├── localDb.ts               # Primary database API
│   │   ├── loyalty.ts               # Loyalty program engine
│   │   ├── planLimits.ts            # Plan tier definitions
│   │   ├── reviewProvider.ts        # Review integration
│   │   ├── schemas.ts               # Zod validation schemas
│   │   ├── sentry.ts                # Sentry initialization
│   │   ├── supabaseClient.ts        # Supabase client
│   │   ├── syncQueue.ts             # Offline sync queue
│   │   ├── utils.ts                 # General utilities (cn, safeDate, etc.)
│   │   ├── validation.ts            # Phone/email validation
│   │   └── whatsappProvider.ts      # WhatsApp integration
│   ├── views/                       # Page components
│   │   ├── ActivityLog.tsx          # Audit log viewer
│   │   ├── AgencyDashboard.tsx      # Agency management
│   │   ├── Appointments.tsx         # Scheduling
│   │   ├── Auth.tsx                 # Login/signup
│   │   ├── Automation.tsx           # Automation sequences
│   │   ├── Campaigns.tsx            # Marketing campaigns
│   │   ├── CustomerDetail.tsx       # Customer detail page
│   │   ├── Customers.tsx            # Customer list
│   │   ├── DataManagement.tsx       # Import/export
│   │   ├── FollowUps.tsx            # Follow-up tasks
│   │   ├── GoogleReviewKit.tsx      # QR & review tools
│   │   ├── Home.tsx                 # Dashboard
│   │   ├── Inactive.tsx             # Inactive customers
│   │   ├── Leads.tsx                # Lead pipeline
│   │   ├── Locations.tsx            # Branch management
│   │   ├── LoyaltySettings.tsx      # Loyalty configuration
│   │   ├── Reports.tsx              # Analytics reports
│   │   ├── RevenueDashboard.tsx     # Revenue analytics
│   │   ├── ReviewMonitoring.tsx     # Review sync
│   │   ├── Reviews.tsx              # Review management
│   │   ├── Settings.tsx             # Business settings
│   │   ├── SetupSupabase.tsx        # Supabase configuration
│   │   └── Upgrade.tsx              # Plan upgrade
│   ├── App.tsx                      # Root component & routing
│   ├── index.css                    # Global styles & CSS variables
│   ├── main.tsx                     # Entry point
│   ├── types.ts                     # TypeScript interfaces
│   └── vite-env.d.ts               # Vite type declarations
├── supabase/
│   └── migrations/                  # Database migrations
│       ├── 20250504120000_init_schema.sql
│       └── 20250504120001_enable_rls.sql
├── supabase.sql                     # Complete database schema
├── UI-SPEC.md                       # Design system specification
├── vision.md                        # Project vision & architecture
├── AGENTS.md                        # Agent coding guidelines
├── package.json                     # Dependencies & scripts
├── tsconfig.json                    # TypeScript configuration
├── vite.config.ts                   # Vite configuration
├── vitest.config.ts                 # Test configuration
└── README.md                        # Project readme
```

---

## 4. Database Schema

### Core Tables (Supabase PostgreSQL)

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `business_profiles` | Business settings & plan | id, business_name, plan, customer_limit |
| `customers` | Customer records | id, business_id, name, phone, source, consent_status |
| `visits` | Visit/transaction records | id, customer_id, visit_date, bill_value, payment_status |
| `staff_members` | Staff list per business | id, business_id, name, role, active |
| `message_templates` | WhatsApp templates | id, business_id, type, language, content |
| `action_logs` | Audit/action tracking | id, business_id, customer_id, action_type |
| `leads` | Lead pipeline | id, business_id, name, phone, status, next_followup_date |
| `appointments` | Scheduling | id, customer_id, appointment_date, status |
| `campaigns` | Marketing campaigns | id, business_id, name, segment_type, status |
| `campaign_recipients` | Campaign delivery | id, campaign_id, customer_id, status |
| `loyalty_rules` | Loyalty rewards | id, business_id, rule_name, visit_threshold |
| `loyalty_rewards` | Reward tracking | id, customer_id, rule_id, status |
| `customer_packages` | Package/session tracking | id, customer_id, package_name, total_sessions |
| `owner_alerts` | Business alerts | id, business_id, alert_type, severity |
| `automation_sequences` | Auto-automation | id, business_id, trigger_type, active |
| `automation_steps` | Sequence steps | id, sequence_id, day_offset, template_name |
| `automation_jobs` | Job execution | id, customer_id, scheduled_for, status |
| `external_integrations` | Google sync | id, business_id, provider, status |
| `google_reviews` | Review data | id, google_review_id, rating, review_text |
| `locations` | Branch management | id, business_id, name, address, active |
| `export_logs` | Export audit | id, business_id, export_type |
| `audit_logs` | Full audit trail | id, actor_type, action, entity_type, metadata_json |
| `public_tool_leads` | Public lead capture | id, name, business_name, phone, tool_used |

### Data Relationships

```
business_profiles (1)
  ├── customers (many)
  ├── visits (many)
  ├── staff_members (many)
  ├── locations (many)
  ├── leads (many)
  ├── appointments (many)
  ├── campaigns (many)
  ├── loyalty_rules (many)
  ├── customer_packages (many)
  ├── automation_sequences (many)
  └── audit_logs (many)

customers (1)
  ├── visits (many)
  ├── action_logs (many)
  ├── loyalty_rewards (many)
  └── customer_packages (many)
```

### Row Level Security (RLS)

Every table has RLS enabled with policies ensuring users can only access their own business data:

```sql
CREATE POLICY "Users manage their own customers" ON public.customers
  FOR ALL USING (auth.uid() = business_id) WITH CHECK (auth.uid() = business_id);
```

---

## 5. Core Features

### 5.1 Customer Management
- Add/edit/search customers with name, phone, source, notes
- Track visits, revenue, consent status
- Customer detail modal with full history
- Import/Export CSV & Excel
- Customer limit enforcement (Free: 50, Pro: unlimited)
- Duplicate prevention on import

### 5.2 Visit Tracking
- Record service category, bill value, payment status
- Staff attribution for each visit
- Revenue recovery tracking
- Payment method tracking (Cash, UPI, Card, Other)

### 5.3 Follow-Up System
- Manual follow-ups after visits
- Inactive customer identification (30+ days)
- Due date tracking with status
- Alert generation on dashboard

### 5.4 Loyalty Program
- Visit-based rewards (e.g., "10th visit free")
- Points-based system with tiers (Regular, Silver, Gold, Platinum)
- Rule configuration per business
- Reward tracking per customer
- Points expiry management

### 5.5 Marketing Campaigns
- WhatsApp message templates
- Bulk messaging to customer segments
- Delivery status tracking
- Review request automation
- Campaign statistics

### 5.6 Appointments
- Schedule appointments with date/time
- Staff assignment
- Status tracking: Booked → Confirmed → Completed → No-Show → Cancelled → Rescheduled

### 5.7 Leads Management
- Lead capture with source/interest
- Status pipeline: New → Contacted → Follow-Up Due → Converted → Lost
- Convert to customer workflow

### 5.8 Google Business Integration
- Review monitoring
- Reply to reviews
- Google Review QR code generation
- External integration sync

### 5.9 Multi-Location Support
- Location management
- Customer/visit/staff association
- Location-specific analytics

### 5.10 Automation Sequences
- Trigger-based automation (visit, appointment, inactivity)
- Multi-step WhatsApp sequences
- Scheduled job execution
- Campaign automation with conditions

### 5.11 Plan & Access Control
- Plan tiers: Free, Founding, Pro, Automation
- Feature gating (exports, imports, Pro reports)
- Customer limit enforcement
- WhatsApp action limits

### 5.12 AI Assistant
- Google Gemini-powered message generation
- Business summary generation
- Tone and language customization

---

## 6. Architecture Deep Dive

### 6.1 Application Entry Flow

```
main.tsx
  └── App.tsx
      └── AuthProvider (AuthContext)
          └── AppContent
              ├── ThemeProvider (next-themes)
              ├── Sentry.ErrorBoundary
              ├── ErrorBoundary
              ├── BrowserRouter
              │   ├── PageTracker (analytics)
              │   ├── OnboardingTour
              │   ├── AccessibilityAudit
              │   └── Routes
              │       ├── Auth (unauthenticated)
              │       └── Layout (authenticated)
              │           └── Outlet → Views
              └── Toaster (sonner)
```

### 6.2 Data Flow Architecture

```
Views (Pages)
  ├── Hooks (useBusinessProfile, useCustomerStats, etc.)
  │   └── localDb API
  │       ├── IndexedDB (primary)
  │       └── localStorage (fallback)
  └── Supabase (cloud sync)
      └── syncQueue (offline-first)
```

### 6.3 Dual Storage Strategy

**IndexedDB** (`lib/indexedDb.ts`)
- 8 stores: profile, customers, visits, actions, leads, appointments, campaigns, loyalty
- Business-scoped data isolation via `business_id` index
- Schema version 1

**localStorage Fallback**
- Automatic migration from localStorage to IndexedDB
- Legacy data compatibility maintained
- Profile stored as `profile_{userId}`
- Customer data stored as `customers_{businessId}`

**Sync Queue** (`lib/syncQueue.ts`)
- Queues operations for Supabase sync
- Retry logic with max 3 attempts
- Automatic sync on online event
- 30-second periodic sync interval

### 6.4 State Management

No global state library is used. State is managed via:
- **React Context**: AuthContext for user/session state
- **React Hooks**: useState, useEffect for local component state
- **Custom Hooks**: Business logic extracted into reusable hooks
- **localDb**: Persistent data storage

### 6.5 Routing

| Route | View | Lazy Loaded |
|-------|------|-------------|
| `/` | Home | No |
| `/customers` | Customers | No |
| `/customers/:id` | CustomerDetail | Yes |
| `/reviews` | Reviews | No |
| `/data` | DataManagement | Yes |
| `/leads` | Leads | Yes |
| `/appointments` | Appointments | Yes |
| `/campaigns` | Campaigns | Yes |
| `/loyalty` | LoyaltySettings | Yes |
| `/revenue` | RevenueDashboard | Yes |
| `/review-kit` | GoogleReviewKit | Yes |
| `/upgrade` | Upgrade | Yes |
| `/automation` | Automation | Yes |
| `/review-monitoring` | ReviewMonitoring | No |
| `/agency-dashboard` | AgencyDashboard | Yes |
| `/locations` | Locations | Yes |
| `/activity` | ActivityLog | Yes |
| `/follow-ups` | FollowUps | No |
| `/inactive` | Inactive | Yes |
| `/reports` | Reports | Yes |
| `/settings` | Settings | No |
| `/setup` | SetupSupabase | No |

---

## 7. Component Library

### 7.1 shadcn/ui Components (Base UI Primitives)

All UI components are built on `@base-ui/react` primitives with custom styling.

| Component | File | Variants | Description |
|-----------|------|----------|-------------|
| Button | `button.tsx` | default, outline, secondary, ghost, destructive, link | Primary action button |
| Card | `card.tsx` | default, sm | Content container |
| Dialog | `dialog.tsx` | — | Modal/dialog (mobile: bottom sheet, desktop: centered) |
| DropdownMenu | `dropdown-menu.tsx` | — | Dropdown menu |
| Input | `input.tsx` | — | Text input with focus ring |
| Label | `label.tsx` | — | Form label |
| Select | `select.tsx` | sm, default | Dropdown select |
| Skeleton | `skeleton.tsx` | — | Loading placeholder |
| Sonner | `sonner.tsx` | — | Toast notifications |
| Tabs | `tabs.tsx` | default, line | Tab navigation |
| Textarea | `textarea.tsx` | — | Multi-line input |

### 7.2 Layout Components

**Layout.tsx**
- Desktop: Fixed sidebar (240px) + main content area
- Mobile: Bottom tab bar with 13 navigation items
- Staff selector dropdown in header
- Active nav state: `bg-primary/10 text-primary`

**Navigation Items (13 total)**

| Route | Icon | Label | Tour ID |
|-------|------|-------|---------|
| `/` | Home | Home | home |
| `/customers` | Users | Customers | customers |
| `/follow-ups` | CheckSquare | Tasks | — |
| `/inactive` | Clock | Inactive | — |
| `/reviews` | Star | Reviews | — |
| `/appointments` | Calendar | Appts | appointments |
| `/campaigns` | Megaphone | Campaigns | campaigns |
| `/loyalty` | Award | Loyalty | — |
| `/revenue` | IndianRupee | Revenue | analytics |
| `/leads` | UserCircle | Leads | — |
| `/data` | ClipboardList | Data | — |
| `/reports` | BarChart | Reports | — |
| `/settings` | Settings | Settings | settings |

### 7.3 Feature Components

| Component | Purpose |
|-----------|---------|
| `ErrorBoundary.tsx` | Catches React errors, shows fallback UI |
| `LockedFeature.tsx` | Plan gate wrapper - shows upgrade CTA |
| `OnboardingTour.tsx` | First-time user tour with react-joyride |
| `MessageAssistant.tsx` | AI-powered WhatsApp message generator |
| `CustomerDetailModal.tsx` | Customer detail popup with visit history |
| `ThemeProvider.tsx` | Dark/light mode with next-themes |
| `AccessibilityAudit.tsx` | Accessibility checker |
| `VirtualList.tsx` | Virtualized list for performance |
| `LazyImage.tsx` | Lazy-loaded images |
| `RoutePrefetch.tsx` | Route preloading for faster navigation |
| `ScreenReaderOnly.tsx` | Screen reader helper |
| `AISummary.tsx` | AI-generated business summaries |

---

## 8. Custom Hooks

### 8.1 Data Hooks

| Hook | Purpose | Returns |
|------|---------|---------|
| `useBusinessProfile` | Fetch/update business profile | `{ profile, loading, setProfile }` |
| `useCustomerStats` | Calculate dashboard statistics | `{ totalCustomers, returningCustomers, revenue, recoveredRevenue }` |
| `useAlerts` | Generate alerts from customer data | `Alert[]` |
| `useOccasions` | Find birthdays/anniversaries today | `OccasionCustomer[]` |
| `useStaffTracker` | Track active staff member | `{ activeStaff, setActiveStaff }` |
| `useStaffMetrics` | Staff performance analytics | `{ staffMetrics, staffTrends }` |
| `useRevenueAnalytics` | Revenue insights & forecasting | `RevenueMetrics, RevenueTrend[], RevenueForecast` |
| `useCustomerAnalytics` | RFM segmentation & LTV | `CustomerAnalytics` |

### 8.2 Utility Hooks

| Hook | Purpose |
|------|---------|
| `useAsync` | Manages async operations with loading/error states |
| `useAsyncCallback` | Memoized async callback with state |
| `useDebounce` | Debounces a value |
| `useDebouncedCallback` | Debounced callback function |
| `useThrottle` | Throttled value updates |
| `useIntersectionObserver` | Detects element viewport entry |
| `useLocalStorage` | Syncs state with localStorage |
| `usePrevious` | Returns previous value |
| `useClickOutside` | Detects clicks outside elements |
| `useWindowSize` | Current window dimensions |
| `useMediaQuery` | Matches media query |
| `useIsMobile` | Mobile viewport detection |
| `useIsTablet` | Tablet viewport detection |
| `useAsyncMemo` | Memoized async factory |
| `usePagination` | Pagination controls |
| `useColorTheme` | Theme switching (default, playful, elegant, mono, modern) |

### 8.3 Accessibility Hooks

| Hook | Purpose |
|------|---------|
| `useKeyboardShortcuts` | Global keyboard shortcuts |
| `useGlobalKeyboardShortcuts` | App-wide shortcuts (h=home, c=customers, etc.) |
| `useFocusTrap` | Traps focus within element |
| `useAnnounce` | Screen reader announcements |
| `useSkipLink` | Skip to main content link |

---

## 9. Utility Libraries

### 9.1 localDb (`lib/localDb.ts`)

Primary database API with dual storage support.

```typescript
// Authentication
localDb.getAuth()           // Get current user
localDb.setAuth(user)       // Set current user

// Profile
localDb.getProfile(userId)  // Fetch profile
localDb.saveProfile(userId, data)  // Save profile

// Customers
localDb.getCustomers(userId)       // Get all customers with visits
localDb.addCustomer(userId, customer)  // Add customer
localDb.updateCustomer(userId, id, updates)  // Update customer

// Visits
localDb.getVisits(userId)    // Get visits
localDb.addVisit(userId, visit)   // Add visit

// Actions
localDb.getActions(userId)   // Get actions
localDb.addAction(userId, customerId, type)  // Log action

// Import/Export
localDb.exportToCSV(userId)  // Export to CSV
localDb.importFromCSV(userId, csv)  // Import from CSV
```

### 9.2 Validation (`lib/validation.ts`)

```typescript
cleanPhoneNumber(phone: string): string           // Remove non-numeric
isValidPhoneNumber(phone: string): boolean        // 10-15 digits check
formatPhoneForWhatsApp(phone: string): string     // + prefix
generateWhatsAppLink(phone: string, message: string): string  // wa.me link
validateEmail(email: string): boolean             // Email format
validateRequired(value: string | undefined): boolean  // Non-empty check
```

### 9.3 Utilities (`lib/utils.ts`)

```typescript
cn(...inputs: ClassValue[]): string               // tailwind-merge + clsx
safeDate(value: unknown): Date | null             // Safe date parsing
formatSafe(value, formatFn, fallback): string     // Safe date formatting
generateSafeId(): string                          // UUID or timestamp fallback
indexBy<T, K>(array, keyFn): Map<K, T>            // O(1) lookup map
groupBy<T, K>(array, keyFn): Map<K, T[]>          // Group array by key
```

### 9.4 Campaign Engine (`lib/campaigns.ts`)

- Segment definitions (VIP, At Risk, Growing, New, Dormant, Regular)
- Trigger types (visit_completed, customer_added, birthday, etc.)
- Condition evaluation engine
- Message template processing with variables
- Automation validation

### 9.5 Loyalty Engine (`lib/loyalty.ts`)

- Tier system: Regular → Silver → Gold → Platinum
- Earning rules: per rupee, per visit, new customer, referral, review, birthday
- Points calculation with multipliers
- Redemption processing
- Expiry management

### 9.6 Coupon System (`lib/coupons.ts`)

- Coupon types: percentage, fixed, buy_x_get_y, bogo, loyalty_redemption
- Validation with multiple conditions
- Batch code generation
- Usage tracking & statistics

### 9.7 Error Handling (`lib/errors.ts`)

```typescript
withRetry<T>(fn, options): Promise<T>            // Retry with backoff
handleApiError(error, context): void             // User-friendly errors
AppError class                                   // Custom error with code
showSuccessMessage / showErrorMessage / showWarningMessage  // Toast helpers
```

### 9.8 Analytics (`lib/analytics.ts`)

```typescript
initAnalytics()                                  // Google Analytics setup
trackPageView(pagePath, pageTitle)               // Page view tracking
trackEvent(eventName, params)                    // Custom events
trackUserAction(action, category, label, value)  // User interactions
trackError(error, fatal)                         // Error tracking
```

### 9.9 Audit Logging (`lib/auditLogger.ts`)

```typescript
logAction({ business_id, actor_type, actor_name, action, entity_type, entity_id, metadata })
```

### 9.10 Sync Queue (`lib/syncQueue.ts`)

```typescript
enqueueSyncOp(table, type, data)                 // Queue operation
drainSyncQueue()                                 // Process queue
startSyncInterval()                              // Start periodic sync
stopSyncInterval()                               // Stop periodic sync
getQueueLength()                                 // Pending operations count
```

---

## 10. Views/Pages

### 10.1 Home (Dashboard)
- Stats cards: Total customers, returning customers, revenue, recovered revenue
- Alert cards with severity levels
- Birthday/anniversary occasions
- 7-day chart (customers + revenue)
- Recent activity list
- Quick action buttons

### 10.2 Customers
- Search with debounce
- Sort: newest, oldest, revenue, visits
- Filter: all, returned
- Add/edit customer modal
- Import CSV/Excel
- Export CSV
- Customer detail modal
- Plan-gated features

### 10.3 Customer Detail
- Customer info card
- Visit history table
- Add visit form
- Action history
- Edit customer
- WhatsApp quick actions

### 10.4 Settings
- Business profile editing
- Staff management
- Message templates (thank you, review, follow-up, comeback, referral)
- Theme selection
- Language settings
- Plan information

### 10.5 Appointments
- Calendar view
- Add/edit appointments
- Status management
- Staff assignment

### 10.6 Campaigns
- Campaign creation
- Segment selection
- Message template editing
- Recipient queue
- Delivery tracking

### 10.7 Revenue Dashboard
- Revenue metrics
- Trend charts
- Day-of-week analysis
- Source breakdown
- Service category breakdown
- Forecasting

### 10.8 Reports
- Customer analytics
- Staff performance
- Revenue reports
- Export options

### 10.9 Automation
- Sequence creation
- Trigger configuration
- Step management
- Job scheduling
- Statistics

### 10.10 Other Views
- **FollowUps**: Pending follow-up tasks
- **Inactive**: Customers not contacted in 30+ days
- **Reviews**: Review request management
- **Leads**: Lead pipeline
- **DataManagement**: Import/export tools
- **LoyaltySettings**: Loyalty rule configuration
- **Locations**: Multi-location management
- **ActivityLog**: Audit trail viewer
- **GoogleReviewKit**: QR code generation
- **ReviewMonitoring**: Google review sync
- **AgencyDashboard**: Agency management
- **Upgrade**: Plan upgrade page
- **SetupSupabase**: Supabase configuration
- **Auth**: Login/signup

---

## 11. Design System

### 11.1 Color Palette (OKLCH)

| Role | Light Mode | Dark Mode | Hex (Light) |
|------|-----------|-----------|-------------|
| Primary | `oklch(0.52 0.13 165)` | `oklch(0.62 0.13 165)` | `#0F766E` |
| Foreground | `oklch(0.18 0.005 250)` | `oklch(0.96 0.003 250)` | `#1C1F23` |
| Background | `oklch(1 0 0)` | `oklch(0.16 0.005 250)` | `#FFFFFF` |
| Surface | `oklch(0.985 0.003 250)` | `oklch(0.20 0.005 250)` | `#FAFAF9` |
| Border | `oklch(0.92 0.005 250)` | `oklch(0.28 0.005 250)` | `#E7E5E4` |
| Accent | `oklch(0.78 0.16 75)` | `oklch(0.82 0.16 75)` | `#F59E0B` |
| Destructive | `oklch(0.58 0.22 27)` | `oklch(0.65 0.20 27)` | `#DC2626` |
| Success | `oklch(0.65 0.16 160)` | `oklch(0.70 0.16 160)` | `#16A34A` |

### 11.2 Typography

| Token | Size | Line Height | Weight | Tracking |
|-------|------|-------------|--------|----------|
| text-h1 | 32px | 40px | 600 | -0.02em |
| text-h2 | 24px | 32px | 600 | -0.015em |
| text-h3 | 20px | 28px | 600 | -0.01em |
| text-body | 14px | 22px | 400 | 0 |
| text-body-lg | 16px | 24px | 400 | 0 |
| text-caption | 13px | 18px | 500 | 0.005em |
| text-overline | 11px | 16px | 600 | 0.08em |

**Font Stack:**
- Sans: `'Geist', 'Inter', system-ui, -apple-system, sans-serif`
- Mono: `'Geist Mono', 'JetBrains Mono', ui-monospace, monospace`

### 11.3 Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| 1 | 4px | Icon-to-text spacing |
| 2 | 8px | Tight stacks |
| 3 | 12px | Form field padding |
| 4 | 16px | Default gap, mobile padding |
| 6 | 24px | Section gaps |
| 8 | 32px | Desktop padding |
| 12 | 48px | Page top padding |
| 16 | 64px | Hero spacing |

### 11.4 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| rounded-sm | 4px | Badges, chips |
| rounded-md | 6px | Inputs, small buttons |
| rounded-lg | 10px | Default buttons, cards, dialogs |
| rounded-xl | 14px | Hero cards, onboarding |
| rounded-2xl | 18px | Mobile sheets |
| rounded-full | ∞ | Avatars, status dots |

### 11.5 Shadows

| Token | Value | Usage |
|-------|-------|-------|
| shadow-card | `0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 1px 0 rgb(0 0 0 / 0.02)` | Cards at rest |
| shadow-pop | `0 8px 24px -4px rgb(0 0 0 / 0.10), 0 4px 8px -2px rgb(0 0 0 / 0.06)` | Popovers, dropdowns |

### 11.6 Themes

Five color themes are available:
1. **Default** — Teal primary, Geist font
2. **Playful** — Purple primary, Space Grotesk font, large radius
3. **Elegant** — Brown primary, Playfair Display serif, small radius
4. **Mono** — Orange primary, JetBrains Mono, no radius
5. **Modern** — Green primary, Outfit font, medium radius

---

## 12. Authentication & Authorization

### 12.1 Auth Flow

```
1. User enters email/password on Auth page
2. AuthContext calls Supabase auth
3. On success, fetch business profile from localDb
4. If no profile exists, create partial profile
5. Redirect to Home dashboard
```

### 12.2 AuthContext API

```typescript
interface AuthContextState {
  user: User | null;
  session: Session | null;
  profile: BusinessProfile | null;
  loading: boolean;
  profileLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, businessName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
```

### 12.3 Row Level Security

All Supabase tables have RLS policies ensuring:
- Users can only access their own business data
- `auth.uid() = business_id` check on all operations
- Foreign key relationships cascade on delete

---

## 13. Offline-First Strategy

### 13.1 Architecture

```
User Action
  ├── Save to IndexedDB (immediate)
  ├── Update UI (immediate)
  └── Queue for Supabase sync (background)
```

### 13.2 Sync Behavior

- **Online**: Operations sync immediately to Supabase
- **Offline**: Operations queued in localStorage
- **Reconnection**: Queue automatically drains
- **Periodic**: 30-second sync interval
- **Retry**: Max 3 retries with exponential backoff

### 13.3 Data Priority

1. **Critical**: Customer records, visits, appointments
2. **Important**: Actions, leads, campaigns
3. **Background**: Analytics, logs, exports

---

## 14. Plan & Feature Gating

### 14.1 Plan Tiers

| Plan | Customer Limit | WhatsApp Limit | Price (INR) |
|------|---------------|----------------|-------------|
| Free | 50 | 30/month | Free |
| Founding | 500 | 500/month | — |
| Pro | 2,000 | 2,000/month | 1,999/month |
| Automation | 10,000 | 10,000/month | — |

### 14.2 Feature Matrix

| Feature | Free | Founding | Pro | Automation |
|---------|------|----------|-----|------------|
| Basic follow-up | ✓ | ✓ | ✓ | ✓ |
| Review QR | ✓ | ✓ | ✓ | ✓ |
| Inactive list | — | ✓ | ✓ | ✓ |
| Daily report | — | ✓ | ✓ | ✓ |
| Weekly report | — | — | ✓ | ✓ |
| Staff activity | — | — | ✓ | ✓ |
| CSV import | — | — | ✓ | ✓ |
| Automation | — | — | — | ✓ |
| All features | — | — | — | ✓ |

### 14.3 Implementation

```typescript
// Plan check
const planOrder = { Free: 0, Founding: 1, Pro: 2, Automation: 3 };
const isLocked = planOrder[userPlan] < planOrder[requiredPlan];

// Limit check
const canAddCustomer = currentCount < business.customer_limit;
```

---

## 15. Testing

### 15.1 Test Framework

- **Runner**: Vitest
- **Environment**: jsdom
- **Assertions**: @testing-library/jest-dom
- **Components**: @testing-library/react

### 15.2 Test Files

| File | Coverage |
|------|----------|
| `src/hooks/useAlerts.test.ts` | Alert generation, occasions |
| `src/hooks/useCustomerStats.test.ts` | Statistics calculation |
| `src/lib/utils.test.ts` | Utility functions |
| `src/lib/validation.test.ts` | Validation functions |

### 15.3 Running Tests

```bash
npm run test        # Interactive mode
npm run test:run    # Single run
npm run test:ui     # UI mode
```

### 15.4 Test Setup

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn() },
  writable: true,
});
```

---

## 16. Build & Deployment

### 16.1 Build Commands

```bash
npm run dev          # Dev server on port 3000
npm run build        # Production build
npm run preview      # Preview production build
npm run clean        # Remove dist folder
npm run lint         # TypeScript check (tsc --noEmit)
npm run lint:fix     # ESLint fix
npm run format       # Prettier format
npm run test         # Run tests
npm run test:run     # Run tests once
```

### 16.2 Vite Configuration

```typescript
// Key configurations:
- Port: 3000
- HMR: Enabled (disable with DISABLE_HMR=true)
- Path alias: @/ → ./src/
- Manual chunks: vendor-react, vendor-charts, vendor-supabase, vendor-ui
- PWA: Auto-update, workbox caching
```

### 16.3 PWA Configuration

- **Manifest**: LokalOS, standalone display, theme color #10b981
- **Icons**: SVG icon at 192x192
- **Caching**: JS, CSS, HTML, SVG, PNG, WOFF2
- **Runtime Caching**: Google Fonts (CacheFirst), Supabase API (NetworkFirst)

---

## 17. Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `VITE_SENTRY_DSN` | No | Sentry error tracking DSN |
| `VITE_GA_MEASUREMENT_ID` | No | Google Analytics measurement ID |
| `GEMINI_API_KEY` | No | Google AI API key |

---

## 18. Development Guidelines

### 18.1 Code Style

- **TypeScript**: Strict mode, no `any`
- **Imports**: Use `@/` path aliases
- **Components**: Functional components with TypeScript interfaces
- **Hooks**: Extract business logic into custom hooks
- **Naming**: PascalCase for components, camelCase for hooks/utils

### 18.2 Import Order

```typescript
// 1. React/Framework
import { useState, useEffect } from 'react';

// 2. External libraries
import { format } from 'date-fns';

// 3. Internal components
import { Button } from '@/components/ui/button';

// 4. Internal hooks
import { useBusinessProfile } from '@/hooks/useBusinessProfile';

// 5. Internal lib/utils
import { localDb } from '@/lib/localDb';
import { cn } from '@/lib/utils';

// 6. Internal types
import type { Customer, Visit } from '@/types';
```

### 18.3 Error Handling

```typescript
try {
  const { data, error } = await supabase.from('customers').select('*');
  if (error) throw error;
  setCustomers(data);
} catch (err) {
  toast.error('Failed to load customers');
  console.error(err);
}
```

### 18.4 Performance

- Use `useMemo` for expensive computations
- Use `useCallback` for callback props
- Lazy load heavy views
- Use virtual lists for large datasets
- Debounce search inputs
- Memoize chart data

---

## 19. API Reference

### 19.1 Types (`src/types.ts`)

**Core Types:**
- `Customer` — Customer record
- `Visit` — Visit/transaction record
- `BusinessProfile` — Business settings
- `Lead` — Lead record
- `Appointment` — Appointment record
- `Campaign` — Campaign record
- `LoyaltyRule` — Loyalty rule
- `CustomerPackage` — Package record
- `Action` — Audit action

**Extended Types:**
- `CustomerWithVisits` — Customer + visits array
- `DashboardStats` — Statistics object
- `Alert` — Alert object
- `ChartDataPoint` — Chart data

### 19.2 Validation Schemas (`lib/schemas.ts`)

```typescript
customerSchema     // Name, phone, source, consent
visitSchema        // Service, bill value, date, payment
appointmentSchema  // Date, time, service, status
campaignSchema     // Name, template, segment
leadSchema         // Name, phone, source, status
profileSchema      // Business name, owner, phone, email
```

### 19.3 Constants (`lib/constants.ts`)

```typescript
LIMITS.FREE_CUSTOMER_LIMIT = 50;
LIMITS.FREE_CUSTOMER_WARNING_THRESHOLD = 40;
LIMITS.DEFAULT_FOLLOWUP_DAYS = 30;
LIMITS.INACTIVE_THRESHOLD_DAYS = 30;
LIMITS.MONTHLY_WHATSAPP_FREE_LIMIT = 30;

DEFAULTS.STAFF_MEMBERS = 'Owner';
DEFAULTS.SERVICE_CATEGORIES = 'Haircut, Facial, Massage, Styling, Coloring';
DEFAULTS.CUSTOMER_SOURCES = 'Walk-in, Instagram, Referral, Google, Facebook, Other';

PLANS.PRO_PRICE_INR = 1999;
```

---

## 20. Changelog

### v1.0.0 (May 5, 2026)
- Initial comprehensive documentation
- Complete feature set implemented
- All views and components documented
- Database schema finalized
- Design system specification complete

### Previous Development (May 2-4, 2026)
- UI-SPEC.md design system created
- vision.md architecture summary created
- AGENTS.md coding guidelines established
- Supabase migrations created
- All core features implemented

---

## Appendix A: Quick Reference

### File Count Summary

| Category | Count |
|----------|-------|
| Views (Pages) | 24 |
| UI Components | 11 |
| Feature Components | 15 |
| Settings Components | 5 |
| Custom Hooks | 15 |
| Utility Libraries | 22 |
| Test Files | 4 |
| Total TypeScript Files | ~100+ |

### Lines of Code Estimate

| Category | Approximate Lines |
|----------|-------------------|
| Views | ~8,000 |
| Components | ~3,000 |
| Hooks | ~2,500 |
| Libraries | ~6,000 |
| Types | ~500 |
| Tests | ~500 |
| **Total** | **~20,500** |

### Dependencies Summary

| Category | Count |
|----------|-------|
| Production dependencies | 30 |
| Development dependencies | 18 |
| **Total** | **48** |

---

*This documentation was generated on May 5, 2026. For the latest version, refer to the repository at https://github.com/Junaid7798/Lokal-OS-.git*
