# LokalOS - Design Interview Q&A & Roadmap

> Generated from grill-me session on 2026-05-04

---

## Interview Summary

This document captures the complete design interview conducted using the grill-me skill. Each question, answer, and decision is documented to ensure shared understanding between developer and AI assistant.

---

## Part 1: Q&A (Question by Question)

### Q1: Value Proposition
**Question:** What's the PRIMARY problem this product solves? What specific pain point does it address for local businesses?

**Answer:** It is a customer database system where the shop owner can maintain the customer database. They can send a welcome message to WhatsApp manually and ask them to review the local business. They can also send a birthday mail, and after the customer doesn't come for 30, 60, or 90 days, they can send a reminder. They can track spending of the customer and based on that decide on reward functions and send promotional links.

---

### Q2: Target Market
**Question:** Who is the IDEAL first customer?

**Answer:**
- **Business types:** Salons, Hand Shops (gifting shops)
- **Data complexity:** Small/simple database (not like clinic or café with too much detail)
- **Business size:** Single location or small chain
- **Tech comfort:** Minimal — they don't know how this can help, need education

---

### Q3: MVP Scope
**Question:** What features MUST be in version 1.0?

**Answer:** Minimal MVP includes everything that doesn't require external API or automation or any external cost. The "aha moment" is that the database shows which customers haven't come back in 30/90 days and who is the highest-paying customer — details they don't pay much attention to, but with the app they can find these.

---

### Q4: Data Architecture
**Question:** How should data be stored and synced?

**Answer:** Hybrid approach — stored locally and synced to Supabase. Not completely offline (if they lose access to the system they can't access database). Not completely online (if no internet, can't access). When no internet for long → purely offline. When internet available → sync to cloud.

---

### Q5: Supabase Setup
**Question:** Who sets up Supabase — you or the user?

**Answer:** The developer (me) pre-configures it.

---

### Q6: Customer Data Model
**Question:** What customer fields are REQUIRED vs OPTIONAL for v1.0?

**Answer:**
- **Required:** Name, Phone number
- **Optional (everything else):** Source, Notes, Birthday, Anniversary, Tags, Consent status

---

### Q7: Visit/Transaction Tracking
**Question:** What details should be recorded for each visit?

**Answer:** If user wants to record: service category, bill value, date, payment status, staff who served. As much as they record, the output/dashboard will help them that much.

---

### Q8: Follow-Up System
**Question:** How should follow-ups work?

**Answer:**
- System detects when customer hasn't visited for 30/60/90 days based on last visit
- Flags the customer and prompts user to send follow-up message
- Does NOT send automatically in v1.0 — manual step only
- Shows as dashboard alert + follow-ups page
- No push notifications

---

### Q9: WhatsApp Integration
**Question:** How does WhatsApp work in v1.0?

**Answer:**
- User sets up pre-built message templates in Settings page
- Click WhatsApp button → opens WhatsApp Web (desktop) or WhatsApp app (mobile)
- Can select custom message or auto-fill
- Customer sends manually in v1.0
- v2.0 can have automation

---

### Q10: Google Reviews
**Question:** What's the plan for Google Business Profile integration?

**Answer:**
- Review page = setting page where user inputs review URL + message
- Send the URL to client for direct review
- No reply to reviews or review status tracking in v1.0 (v2.0 if possible)

---

### Q11: Loyalty Program
**Question:** What's the loyalty program scope for v1.0?

**Answer:**
- Rule: when customer spends 100 rupees = 1 point, based on that user decides reward
- Can be added in v1 if possible, but complex — needs research on logic/math
- User can define their own reward system
- Visit-based award also considered

---

### Q12: Pricing & Plans
**Question:** What's the plan/pricing strategy?

**Answer:**
- **Free plan:** 50 customer limit, 30-day trial, full features
- **Pro plan (paid):** Unlimited customers, more detailed dashboard
- **Automation add-on:** Separate paid feature
- Gate on capacity (customers + time), not features — users experience full value first

---

### Q13: Multi-Tenancy
**Question:** How does multi-business work?

**Answer:**
- **v1:** One business per account
- **v2:** Multiple locations (branches) of same business type only — not different business types (e.g., salon + café)

---

### Q14: Tech Stack Decisions
**Question:** Any concerns or changes needed to the tech stack?

**Answer:**
- Current stack (React 19 + TS + Vite + Tailwind + shadcn/ui + IndexedDB + Supabase + Recharts) is complete
- Need to be careful about database — if IndexedDB insufficient, consider better option
- Don't add high-tech database in MVP — scale up when needed

---

### Q15: Deployment & Distribution
**Question:** How will users access the app?

**Answer:**
- PWA (installable web app)
- Later build mobile app (Android)
- Works on Android phone, tablet, desktop
- Primary hosted on Vercel

---

### Q16: Staff Management
**Question:** How does staff work in v1.0?

**Answer:**
- Track which staff member served the customer
- Staff performance dashboard — who brings most money, who is active/inactive
- Not staff login/accounts — owner only login
- Staff is just a tag on visits (who served)

---

### Q17: Analytics & Reports
**Question:** What analytics should be in v1.0?

**Answer:**
- Highest-paying customer ✅
- Inactive customers (30/60/90 days) ✅
- Staff performance ✅
- All features available in free, gated only on customer count (50) and time (30 days)

---

### Q18: Onboarding
**Question:** What's the onboarding flow for new users?

**Answer:**
- Sign up and login required
- Welcome/setup wizard: define owner name, define staff members
- Can skip and add customers as they go
- Brief setup, not complex

---

### Q19: Data Privacy & Compliance
**Question:** Any concerns about customer data handling?

**Answer:**
- Target businesses NOT requiring heavy compliance (like clinical)
- Phone numbers stored locally
- Consent = customer providing name/number is implicit consent
- Additional: QR code on shop wall for explicit consent — customer scans, clicks "I accept"

---

### Q20: Import/Export
**Question:** Should users be able to import/export their data?

**Answer:**
- Import from CSV/Excel ✅
- Export to CSV/Excel ✅
- Real-time sync to Supabase serves as backup

---

### Q21: What's NOT in v1.0?
**Question:** Let's finalize what's deliberately excluded from v1.0

**Answer:** (User agreed with earlier list)
- Automated WhatsApp messages (manual only)
- Real-time review sync
- Full loyalty rules engine (simpler version in v1)
- Push notifications
- Multi-business accounts
- Staff login/accounts
- Payment integration (not invoicing, just status tracking)

---

### Q22: Risk Assessment
**Question:** What could go wrong?

**Answer:**

**Technical risk:** Database crashes/doesn't save, data silently deleted, storage full without warning — hurts SaaS reputation

**Market risk:** Better/cheaper competitors exist — need unique value proposition

**User experience risk:** Users don't understand what app can do, treat as simple tool, don't utilize full potential, blame the app

---

### Q23: Technical Risk Mitigation
**Question:** How do we prevent silent data loss?

**Answer:**
- **Storage:** IndexedDB 50MB likely sufficient for thousands (text data only, no images). If insufficient, upgrade. Warn user internally, not with technical details.
- **Sync failures:** Show simple "Online/Offline" indicator with last sync time. If offline, warn data may be lost.
- **Data health:** Automated checks. Show user simple status (green/yellow), not technical details. We fix issues, not them.

---

### Q24: Market Differentiation
**Question:** What makes LokalOS different from competitors?

**Answer:**
- Not a CRM
- Far better than Excel/Notepad
- "Personalized assistant" — provides insights they're unaware of
- Shows: "This client used to visit every 2 weeks but hasn't in 30 days"
- Staff performance insights
- Simple for non-tech, powerful enough to grow

---

### Q25: User Education
**Question:** How do we solve the "they don't know what this can do" problem?

**Answer:**
- Welcome page video showing how it works
- Help documentation with FAQs
- 1-2 tutorial videos on how to use

---

### Q26: UI/UX Priority
**Question:** What should the UI focus on?

**Answer:**
- **Dashboard:** Revenue, customer count — need research, then implement
- **Customizable:** Settings page where user selects what to show on dashboard
- **Mobile navigation:** Research needed — bottom tabs or hamburger as option to select
- **Dark mode:** Yes

---

### Q27: Development Priorities
**Question:** What should we build FIRST?

**Answer (with additional feature):**
1. Customer CRUD
2. Visit tracking
3. Dashboard with insights
4. WhatsApp integration
5. Settings (profile, staff, templates)
6. Follow-ups page
7. Data import/export
8. QR code for consent + queue feature (optional, auto-enabled for salons)

---

### Q28: Queue Feature Scope
**Question:** Is queue feature for v1 or v2?

**Answer:**
- For salons only (need research for other business types)
- Optional setting — enabled by default based on business type in signup
- Can toggle in settings

---

### Follow-up: Payment Integration
**Question:** About payment tracking

**Answer:**
- Don't want full CRM with amounts owed, pending collections — at least not in v1
- But if adding payment status (Paid/Pending/Partial), also add:
  - Dashboard section: how many customers have partial/pending
  - Customer section: sort/filter by payment status
- This is still simple annotation, not full invoicing

---

## Part 2: Version 1.0 Scope (CONFIRMED)

### Core Features (MUST HAVE)

| Feature | Description |
|---------|-------------|
| Customer CRUD | Add, edit, delete, list customers (name, phone required; notes, source, birthday optional) |
| Visit Tracking | Record date, service category, bill value, payment status (Paid/Pending/Partial), staff |
| Payment Status Dashboard | Widget showing pending/partial payment counts; customer list filter/sort |
| Dashboard Insights | Inactive 30/60/90 days, top spenders, staff performance |
| Loyalty Rules Engine | Simple version in free (visit count, basic points); advanced in Pro |
| WhatsApp Integration | Template-based messages, deep links, manual send |
| Follow-ups | Auto-detect inactive customers, prompt user, show on dashboard + follow-ups page |
| Import/Export | CSV import/export |
| Data Health Monitoring | Automated sync status, online/offline indicator |

### Optional/Context-Aware Features

| Feature | Description |
|---------|-------------|
| Queue Management | Auto-enabled for salons, toggle in settings |
| QR Code Consent | Generate QR for shop wall → customer scans → accepts consent |
| Customizable Dashboard | User selects which metrics to display |

### Gating Strategy (Free Plan)

| Limit | Value |
|-------|-------|
| Customer limit | 50 |
| Time limit | 30 days |
| Features | Full (no feature gating) |
| Pro plan | Unlimited customers + advanced loyalty + more dashboard details |

---

## Part 3: Version 2.0 Scope (DEFERRED)

### Features Planned for v2

| Feature | Description |
|---------|-------------|
| Automated WhatsApp Messages | Trigger-based auto-send to customers |
| Real-time Review Sync | Google Business Profile integration |
| Advanced Loyalty Rules | Full rules engine with custom rewards |
| Push Notifications | For follow-ups, etc. |
| Multi-location | Multiple branches under one business |
| Staff Login/Accounts | Staff can log in separately |
| Full Review Management | Reply to reviews, status tracking |
| Payment Collections | Full accounts receivable tracking |
| SMS/Email Marketing | Beyond WhatsApp |
| Agency Model | Multiple businesses per account |
| API for Third-party Tools | Open API |

---

## Part 4: Excluded from v1.0

| Feature | Reason |
|---------|--------|
| Automated WhatsApp messages | Manual only in v1.0 |
| Real-time review sync | Manual review link only |
| Full loyalty rules engine | Simpler version in v1, advanced in Pro |
| Push notifications | Not included |
| Multi-business accounts | Single business only |
| Staff login/accounts | Owner-only, staff is tag |
| Payment integration (invoicing) | Just status annotation, not full AR |
| SMS/Email marketing | WhatsApp only |
| API for third-party tools | Later |

---

## Part 5: Key Decisions

| Decision | Rationale |
|----------|-----------|
| Local-first + cloud-sync | Hybrid approach — works offline, syncs when online |
| IndexedDB primary storage | Free, simple, sufficient for thousands of records |
| Pre-configured Supabase | Developer sets up, not user barrier |
| Feature-full free plan | Gate on capacity (50 customers, 30 days), not features |
| WhatsApp deep links | Compliant, simple, no API costs |
| Business-type adaptive features | Queue auto-enabled for salons |
| Automated data health | User sees simple status, not technical details |
| "Personalized Assistant" not CRM | Positioning for non-tech users |

---

## Part 6: Technical Stack

| Layer | Technology |
|-------|-------------|
| Frontend | React 19, TypeScript, Vite 6 |
| Styling | Tailwind CSS 4, shadcn/ui v4 |
| Components | Radix UI, Base UI |
| Icons | Lucide React |
| Database | IndexedDB (primary) + Supabase (sync) |
| State | React hooks + localDb utility |
| Routing | React Router DOM 7 |
| Charts | Recharts 3 |
| Animation | Motion (framer-motion replacement) |
| Error Tracking | Sentry |
| Deployment | Vercel (PWA) |

---

## Part 7: Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| **Silent data loss** | Automated health checks, show simple online/offline + sync status, internal monitoring |
| **Storage limit (50MB)** | Likely sufficient for text data (thousands of customers), upgrade if needed |
| **Competitors** | Position as "personalized assistant" not CRM, focus on insights users don't know they need |
| **User education** | Video tutorials + help docs + sample data showing "aha moments" |

---

## Part 8: Target Market Summary

| Attribute | Value |
|-----------|-------|
| Business types | Salons, Gift/Hand shops (simple data needs) |
| Business size | Single location or small chain |
| Tech comfort | Minimal — need education |
| Geography | India (WhatsApp-heavy) |
| Current state | Not managing customer data (notepad/Excel/nothing) |

---

## Part 9: Gating & Pricing

| Plan | Customers | Features | Price |
|------|-----------|----------|-------|
| Free | 50 | Full (loyalty, dashboard, import/export) | Free |
| Pro | Unlimited | Everything in free + advanced loyalty + detailed dashboard | Paid |
| Automation | — | Add-on for automated messages | Paid |

---

## Appendix: File Structure

```
lokalos/
├── grillmeqma.md          # This document
├── vision.md              # Project vision & architecture
├── UI-SPEC.md             # UI design contract
├── AGENTS.md              # Development guide
├── supabase.sql            # Database schema
└── src/
    ├── components/         # UI components
    ├── views/              # Page components
    ├── hooks/              # Custom hooks
    ├── lib/                # Utilities
    └── types.ts            # TypeScript interfaces
```

---

*End of grill-me session documentation*