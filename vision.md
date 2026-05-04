# LokalOS - Project Vision & Architecture Summary

> **Date:** 2026-05-04  
> **Purpose:** Comprehensive code summary and architectural vision for the LokalOS local business management SaaS application.

---

## Project Overview

**LokalOS** is a **local business management SaaS application** built with React 19 + TypeScript + Vite. It helps local businesses manage customers, appointments, loyalty programs, marketing campaigns, and follow-ups — primarily via WhatsApp integration and Google Business Profile sync.

### Tech Stack

| Layer | Technology |
|-------|-------------|
| Frontend | React 19, TypeScript, Vite 6 |
| Styling | Tailwind CSS 4, shadcn/ui v4 |
| Components | Radix UI, Base UI |
| Icons | Lucide React |
| Database | Supabase (PostgreSQL) + IndexedDB + localStorage |
| State | React hooks + localDb utility |
| Routing | React Router DOM 7 |
| Charts | Recharts 3 |
| Animation | Motion (framer-motion replacement) |
| Error Tracking | Sentry |
| Analytics | Custom initAnalytics |
| Validation | Zod, date-fns |

---

## Core Features

### 1. Customer Management
- Add/edit/search customers with phone, name, source, notes
- Track visits, revenue, consent status
- Customer detail modal with full history
- Import/Export CSV & Excel
- Customer limit enforcement (Free: 50, Pro: unlimited)

### 2. Visit Tracking
- Record service category, bill value, payment status
- Staff attribution for each visit
- Revenue recovery tracking

### 3. Follow-Up System
- Manual follow-ups after visits
- Inactive customer identification
- Due date tracking with status

### 4. Loyalty Program
- Visit-based rewards (e.g., "10th visit free")
- Rule configuration
- Reward tracking per customer

### 5. Marketing Campaigns
- WhatsApp message templates
- Bulk messaging to customer segments
- Delivery status tracking
- Review request automation

### 6. Appointments
- Schedule appointments with date/time
- Staff assignment
- Status tracking (Booked → Completed → No-Show)

### 7. Leads Management
- Lead capture with source/interest
- Status pipeline (New → Contacted → Converted → Lost)
- Convert to customer

### 8. Google Business Integration
- Review monitoring
- Reply to reviews
- Google Review QR generation
- External integration sync

### 9. Multi-Location Support
- Location management
- Customer/visit/staff association
- Location-specific analytics

### 10. Automation Sequences
- Trigger-based automation (visit, appointment, inactivity)
- Multi-step WhatsApp sequences
- Scheduled job execution

### 11. Plan & Access Control
- Plan tiers: Free, Founding, Pro, Automation
- Feature gating (exports, imports, Pro reports)
- Customer limit enforcement

---

## Database Schema (Supabase)

### Core Tables

| Table | Purpose |
|-------|---------|
| `business_profiles` | Business settings, plan, limits |
| `customers` | Customer records |
| `visits` | Visit/transaction records |
| `staff_members` | Staff list per business |
| `message_templates` | WhatsApp templates |
| `action_logs` | Audit/action tracking |
| `leads` | Lead pipeline |
| `appointments` | Scheduling |
| `campaigns` | Marketing campaigns |
| `campaign_recipients` | Campaign delivery |
| `loyalty_rules` | Loyalty rewards |
| `customer_packages` | Package/session tracking |
| `owner_alerts` | Business alerts |
| `automation_sequences` | Auto-automation |
| `automation_steps` | Sequence steps |
| `automation_jobs` | Job execution |
| `external_integrations` | Google sync |
| `google_reviews` | Review data |
| `locations` | Branch management |
| `export_logs` | Export audit |
| `audit_logs` | Full audit trail |

### Data Model Relationships

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

---

## Local Storage Architecture

### Dual Storage Strategy

LokalOS uses **IndexedDB as primary** with **localStorage fallback**:

1. **IndexedDB** (`lib/indexedDb.ts`)
   - 8 stores: profile, customers, visits, actions, leads, appointments, campaigns, loyalty
   - Business-scoped data isolation via `business_id` index

2. **localStorage Fallback**
   - Automatic migration from localStorage to IndexedDB
   - Legacy data compatibility maintained
   - Profile stored as `profile_{userId}`
   - Customer data stored as `customers_{businessId}`

### localDb API

```typescript
localDb.getAuth()           // Get current user
localDb.setAuth(user)        // Set current user
localDb.getProfile(userId)    // Fetch profile
localDb.saveProfile(userId, data)  // Save profile
localDb.getCustomers(userId)      // Get all customers with visits
localDb.addCustomer(userId, customer)  // Add customer
localDb.updateCustomer(userId, id, updates)  // Update customer
localDb.getVisits(userId)    // Get visits
localDb.addVisit(userId, visit)   // Add visit
localDb.getActions(userId)    // Get actions
localDb.addAction(userId, customerId, type)  // Log action
localDb.exportToCSV(userId)   // Export to CSV
localDb.importFromCSV(userId, csv)  // Import from CSV
```

---

## Key Components

### Layout (`components/Layout.tsx`)

- **Desktop:** Fixed sidebar (13 nav items) + main content area
- **Mobile:** Bottom tab bar with 13 items
- **Staff Selector:** Dropdown with staff list
- **Active States:** `bg-primary/10 text-primary`

### Navigation Items

| Route | Icon | Label |
|-------|------|------|
| `/` | Home | Home |
| `/customers` | Users | Customers |
| `/follow-ups` | CheckSquare | Tasks |
| `/inactive` | Clock | Inactive |
| `/reviews` | Star | Reviews |
| `/appointments` | Calendar | Appts |
| `/campaigns` | Megaphone | Campaigns |
| `/loyalty` | Award | Loyalty |
| `/revenue` | IndianRupee | Revenue |
| `/leads` | UserCircle | Leads |
| `/data` | ClipboardList | Data |
| `/reports` | BarChart | Reports |
| `/settings` | Settings | Settings |

### Views (Pages)

| View | File | Description |
|------|------|-------------|
| Home | `views/Home.tsx` | Dashboard with stats, alerts, occasions, charts |
| Customers | `views/Customers.tsx` | Customer list with add/edit/import/export |
| CustomerDetail | `views/CustomerDetail.tsx` | Customer detail page (lazy) |
| Settings | `views/Settings.tsx` | Business profile, staff, templates |
| Leads | `views/Leads.tsx` | Lead pipeline |
| Appointments | `views/Appointments.tsx` | Scheduling |
| Campaigns | `views/Campaigns.tsx` | Marketing |
| LoyaltySettings | `views/LoyaltySettings.tsx` | Loyalty rules |
| FollowUps | `views/FollowUps.tsx` | Follow-up tasks |
| Inactive | `views/Inactive.tsx` | Inactive customers |
| Reviews | `views/Reviews.tsx` | Review management |
| RevenueDashboard | `views/RevenueDashboard.tsx` | Revenue analytics |
| Reports | `views/Reports.tsx` | Analytics reports |
| Automation | `views/Automation.tsx` | Automation sequences |
| Locations | `views/Locations.tsx` | Branch management |
| ActivityLog | `views/ActivityLog.tsx` | Audit log viewer |
| GoogleReviewKit | `views/GoogleReviewKit.tsx` | QR & review tools |
| Upgrade | `views/Upgrade.tsx` | Plan upgrade |
| ReviewMonitoring | `views/ReviewMonitoring.tsx` | Review sync |
| AgencyDashboard | `views/AgencyDashboard.tsx` | Agency management |
| DataManagement | `views/DataManagement.tsx` | Import/export |
| SetupSupabase | `views/SetupSupabase.tsx` | Supabase config |
| Auth | `views/Auth.tsx` | Login/signup |

---

## Custom Hooks

| Hook | Purpose |
|------|---------|
| `useBusinessProfile` | Fetch/update business profile |
| `useCustomerStats` | Calculate stats, chart data |
| `useAlerts` | Generate alerts from customer data |
| `useStaffTracker` | Track active staff member |
| `useStaffMetrics` | Staff performance analytics |
| `useRevenueAnalytics` | Revenue insights |
| `useCustomerAnalytics` | Customer behavior |
| `useColorTheme` | Dynamic theming |
| `useAccessibility` | A11y utilities |

---

## Data Types (`types.ts`)

### Core Interfaces

```typescript
// Business
interface Business {
  id: string;
  business_name: string;
  average_bill_value: number;
  plan: 'Free' | 'Founding' | 'Pro' | 'Automation';
  plan_status: 'trial' | 'active' | 'overdue' | 'cancelled';
  customer_limit: number;
  monthly_whatsapp_action_limit: number;
}

// Customer
interface Customer {
  id: string;
  business_id: string;
  name: string;
  phone: string;
  source: string;
  consent_status: 'pending' | 'given' | 'withdrawn';
  opt_out: boolean;
  tags: string[];
  notes: string;
  review_status: 'not_asked' | 'requested' | 'reviewed' | 'skipped';
  birthday_date?: string;
  anniversary_date?: string;
  is_returned?: boolean;
  revenue_recovered?: number;
}

// Visit
interface Visit {
  id: string;
  customer_id: string;
  service_category: string;
  visit_date: string;
  bill_value?: number;
  payment_status: 'Paid' | 'Pending' | 'Partial' | 'Not Applicable';
  payment_method?: 'Cash' | 'UPI' | 'Card' | 'Other';
  staff_name: string;
  notes: string;
}

// Extended Types
interface CustomerWithVisits extends Customer {
  visits?: Visit[];
  total_revenue?: number;
}

interface BusinessProfile extends Business {
  industry?: string;
  phone?: string;
  staff_members: string;
  service_categories: string;
  customer_sources: string;
  msg_thank_you?: string;
  msg_request_review?: string;
  msg_follow_up?: string;
  msg_comeback?: string;
  msg_referral?: string;
}
```

---

## UI Design System

### Spacing Scale (Multiples of 4)

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps |
| sm | 8px | Compact elements |
| md | 16px | Default spacing |
| lg | 24px | Sections |
| xl | 32px | Layout gaps |
| 2xl | 48px | Page spacing |
| 3xl | 64px | Hero sections |

### Typography

| Role | Size | Weight |
|------|------|-------|
| Body | 14-15px | 400 |
| Label | 12-13px | 500 |
| H1 | 24-26px | 700 |
| H2 | 18-20px | 600 |
| Display | 32px+ | 700 |

### Color Palette

| Role | Light | Dark |
|------|-------|------|
| Background | white | oklch(0.985) |
| Surface | oklch(0.97) | oklch(0.269) |
| Primary | oklch(0.205) | oklch(0.922) |
| Destructive | oklch(0.577 0.245 27.325) | — |

### Component Patterns

```tsx
// Interactive button
className = 'cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200';

// Card hover
className = 'hover:shadow-md hover:border-xxx/30 transition-all duration-200';

// Nav active state
className = isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted';
```

---

## Integrations

### Supabase (`supabaseClient.ts`)

- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Fallback storage: localStorage keys
- Optional: returns null if not configured
- Caller must handle null case

### WhatsApp

- Deep links via `generateWhatsAppLink()`
- Message templates stored per business
- Language support: en, hi, hinglish

### Google Business Profile

- Review sync via external_integrations
- OAuth flow support
- Review reply capability
- QR code generation

### Sentry

- Error tracking init
- React ErrorBoundary wrapper
- Global error capture

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    App.tsx                           │
│  BrowserRouter → Routes → Layout → Outlet             │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
    ┌───▼───┐  ┌──▼────┐  ┌▼──────────┐
    │Home   │  │Cust-  │  │Settings  │
    │       │  │omers  │  │          │
    └───┬───┘  └──┬────┘  └┬─────────┘
        │        │         │
     ┌──▼────────▼─────────▼────┐
     │     localDb              │
     │  IndexedDB + localStorage │
     └───────────┬────���──────────┘
                │
     ┌──────────▼──────────┐
     │   useCustomerStats   │
     │   useAlerts         │
     │   useBusinessProfile│
     └────────┬───────────┘
              │
   ┌────────│────────┐
   │        │        │
┌──▼──┐ ┌▼───┐ ┌▼────┐
│Charts│ │Data │ │UI   │
│     │ │    │ │     │
└─────┘ └────┘ └─────┘
```

---

## Key Flows

### Add Customer

1. Open dialog, enter name/phone/source
2. Validate phone (10+ digits)
3. Check duplicate in Supabase
4. Save to localDb with auto-ID
5. Sync to Supabase (optional)
6. Log audit action
7. Show success toast
8. Reload customer list

### Record Visit

1. Select customer
2. Enter service, bill value, payment status
3. Auto-attach active staff
4. Save visit
5. Update customer's last visit date
6. Check for loyalty reward eligibility
7. Log action

### Follow-Up Flow

1. After visit without follow-up action
2. Mark overdue at 2-7 days
3. Alert appears on home dashboard
4. Staff views Follow-Ups page
5. Mark completed via WhatsApp/phone
6. Log action

### Campaign Send

1. Create campaign with template
2. Select segment (source, tags, etc.)
3. Queue recipients
4. Generate WhatsApp link for each
5. User clicks → opens WhatsApp
6. Log delivery status

---

## Testing

- **Framework:** Vitest
- **Coverage:** jsdom environment
- **Files tested:** `useAlerts.ts`, `useCustomerStats.ts`, `utils.ts`, `validation.ts`
- **Setup:** `src/test/setup.ts`
- **Configuration:** `vitest.config.ts`

---

## Build & Run Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on port 3000 |
| `npm run build` | Production build |
| `npm run preview` | Preview production |
| `npm run lint` | TypeScript check |
| `npm run test` | Run tests |

---

## Key Decisions & Rationale

1. **Dual Storage:** IndexedDB primary with localStorage fallback for offline-first + migration path
2. **Business-scoped Isolation:** All data keyed by `business_id` for multi-tenant safety
3. **Plan Gating:** Feature flags in UI, enforced at data layer
4. **Staff Attribution:** All actions logged with active staff
5. **WhatsApp First:** Deep links over API for simplicity and reliability
6. **Lazy Loading:** Heavy views (Revenue, Reports, Automation) lazy-loaded
7. **Error Boundaries:** Wrapped at app and route level

---

## Future Considerations

- Real-time WebSocket subscriptions
- Team role-based access control
- Multi-staff login with sessions
- Payment integration
- SMS fallback
- Email marketing
- CRM export
- API for third-party tools
- Mobile PWA

---

## File Organization Summary

```
src/
├── components/
│   ├── ui/          # shadcn/ui components
│   ├── Layout.tsx    # Main app layout
│   ├── ErrorBoundary.tsx
│   └── ...
├── hooks/
│   ├── useBusinessProfile.ts
│   ├── useCustomerStats.ts
│   ├── useAlerts.ts
│   └── ...
├── lib/
│   ├── localDb.ts        # Primary DB API
│   ├── indexedDb.ts      # IndexedDB wrapper
│   ├── supabaseClient.ts # Supabase config
│   ├── validation.ts      # Phone/email validation
│   ├── utils.ts          # ClassName utility
│   ├── auditLogger.ts    # Audit logging
│   └── ...
├── views/
│   ├── Home.tsx
│   ├── Customers.tsx
│   └── ... (13+ views)
├── types.ts         # TypeScript interfaces
├── App.tsx         # Router setup
└── main.tsx        # Entry point
```

---

## Vision Statement

**LokalOS** is designed to be the all-in-one **local business management platform** that combines CRM, marketing automation, scheduling, loyalty, and analytics — all driven by simple WhatsApp-powered communication.

The vision is to empower local businesses (salons, clinics, cafes, clinics) with enterprise-grade tools in a simple, beautiful interface that works offline-first and syncs to the cloud.

**Core Philosophy:**
1. 🌟 **Simplicity First** — 5-minute setup, instant value
2. 📱 **Mobile-Native** — Works beautifully on phone
3. 💬 **WhatsApp-First** — Meet customers where they are
4. 🔄 **Offline-First** — Works without internet
5. 📈 **Growth-Focused** — Built to scale

---

*Generated by analyzing the complete LokalOS codebase.*