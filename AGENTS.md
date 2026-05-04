# AGENTS.md - LokalOS Development Guide

> **Last Updated:** May 4, 2026

This file provides guidance for agentic coding agents working on the LokalOS project.

---

## Key Files

| File           | Purpose                                                    |
| -------------- | ---------------------------------------------------------- |
| `UI-SPEC.md`   | UI Design Contract - visual/spacing/typography/color specs |
| `supabase.sql` | Database schema                                            |
| `AGENTS.md`    | This file                                                  |
| `SESSION.md`   | Current session progress and pending items                  |
| `HANDOFF.md`   | Project handoff for next agent                            |

---

## Project Overview

**LokalOS** is a local business management SaaS application built with:

- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS 4 + shadcn/ui components
- **Database:** Supabase (PostgreSQL) + localStorage fallback
- **Routing:** React Router DOM 7
- **Charts:** Recharts
- **State:** React hooks + localDb utility

---

## Commands

### Development

```bash
npm run dev          # Start dev server on port 3000
npm run build        # Production build
npm run preview      # Preview production build
npm run clean        # Remove dist folder
npm run lint         # TypeScript check (tsc --noEmit)
```

### Running TypeScript Check

```bash
npm run lint
# or directly:
npx tsc --noEmit
```

---

## Code Style Guidelines

### TypeScript & Types

1. **Avoid `any`** - Use proper interfaces/types from `src/types.ts`

   ```typescript
   // Bad
   const data: any = response;

   // Good
   import type { Customer, Visit } from '@/types';
   const data: Customer = response;
   ```

2. **Use path aliases** - Import using `@/` prefix:

   ```typescript
   import { Button } from '@/components/ui/button';
   import { useBusinessProfile } from '@/hooks/useBusinessProfile';
   import { localDb } from '@/lib/localDb';
   ```

3. **Create custom hooks** - Extract business logic into hooks:
   ```typescript
   // src/hooks/useAlerts.ts
   // src/hooks/useCustomerStats.ts
   ```

### Component Structure

1. **Use functional components** with TypeScript:

   ```typescript
   interface Props {
     onClose: () => void;
     customer: Customer;
   }

   export default function CustomerModal({ onClose, customer }: Props) {
     // ...
   }
   ```

2. **Error boundaries** - Wrap components that may fail:

   ```typescript
   import { ErrorBoundary } from '@/components/ErrorBoundary';
   <ErrorBoundary><Component /></ErrorBoundary>
   ```

3. **Loading states** - Always show loading for async operations:
   ```typescript
   const [loading, setLoading] = useState(true);
   if (loading) return <Spinner />;
   ```

### Naming Conventions

| Type                    | Convention                   | Example                          |
| ----------------------- | ---------------------------- | -------------------------------- |
| Components              | PascalCase                   | `Home.tsx`, `CustomerDetail.tsx` |
| Hooks                   | camelCase with `use` prefix  | `useBusinessProfile.ts`          |
| Utilities               | camelCase                    | `localDb.ts`, `validation.ts`    |
| Interfaces              | PascalCase, suffix with type | `Customer`, `Visit`, `Action`    |
| Files (components)      | PascalCase.tsx               | `Button.tsx`                     |
| Files (utilities/hooks) | camelCase.ts                 | `useAlerts.ts`, `utils.ts`       |

### Imports Order

```typescript
// 1. React/Framework
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 2. External libraries
import { format } from 'date-fns';
import { toast } from 'sonner';

// 3. Internal - components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// 4. Internal - hooks
import { useBusinessProfile } from '@/hooks/useBusinessProfile';

// 5. Internal - lib/utils
import { localDb } from '@/lib/localDb';
import { cn } from '@/lib/utils';

// 6. Internal - types
import type { Customer, Visit } from '@/types';
```

### UI/UX Guidelines

1. **Icons** - Use Lucide React only (no emojis as icons):

   ```typescript
   import { Settings, Users, ArrowRight } from 'lucide-react';
   ```

2. **Interactive elements** - Always add cursor-pointer and transitions:

   ```typescript
   className =
     'cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200';
   ```

3. **Dark mode support** - Use `dark:` prefix for dark styles:

   ```typescript
   className = 'bg-emerald-500/5 dark:bg-emerald-500/10';
   ```

4. **Semantic colors** - Prefer theme tokens over hardcoded colors:

   ```typescript
   // Good
   className = 'text-primary bg-destructive/5';

   // Avoid
   className = 'text-purple-600 bg-red-100';
   ```

### Error Handling

1. **Use try/catch with user feedback**:

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

2. **Input validation** - Use validation utilities:

   ```typescript
   import { cleanPhoneNumber, isValidPhoneNumber } from '@/lib/validation';

   const cleanPhone = cleanPhoneNumber(phone);
   if (!isValidPhoneNumber(cleanPhone)) {
     toast.error('Invalid phone number');
     return;
   }
   ```

### React Patterns

1. **useMemo for expensive computations**:

   ```typescript
   const stats = useMemo(() => {
     return customers.reduce(
       (acc, c) => {
         // computation
         return acc;
       },
       { total: 0 }
     );
   }, [customers]);
   ```

2. **useCallback for callback props**:

   ```typescript
   const handleClick = useCallback((id: string) => {
     setSelected(id);
   }, []);
   ```

3. **Custom hooks for shared logic**:
   ```typescript
   // Use existing hooks
   const { profile, loading } = useBusinessProfile();
   const { activeStaff, setActiveStaff } = useStaffTracker();
   ```

---

## File Organization

```
src/
├── components/          # UI components
│   ├── ui/             # shadcn/ui components
│   ├── Layout.tsx      # Main layout with sidebar
│   └── ErrorBoundary.tsx
├── hooks/              # Custom React hooks
│   ├── useBusinessProfile.ts
│   ├── useAlerts.ts
│   └── useCustomerStats.ts
├── lib/                # Utilities & services
│   ├── localDb.ts      # localStorage DB
│   ├── supabaseClient.ts
│   ├── validation.ts
│   └── utils.ts        # cn() utility
├── views/              # Page components
│   ├── Home.tsx
│   ├── Customers.tsx
│   └── ...
├── types.ts            # TypeScript interfaces
├── App.tsx             # Root component
└── main.tsx            # Entry point
```

---

## Testing

Currently no test framework is configured. When adding tests:

- Use Vitest for unit tests
- Use React Testing Library for component tests

---

## Database

Schema is in `supabase.sql`. Key tables:

- `customers` - Customer records with visits
- `customer_packages` - Package/session tracking
- `business_profile` - Business settings

---

## Important Notes

1. **API Keys** - Never hardcode; use environment variables:

   ```typescript
   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
   ```

2. **No console.log in production** - Use proper error logging

3. **Accessibility** - Use semantic HTML, proper labels, keyboard navigation

4. **Performance** - Add loading states, memoize expensive ops, consider virtualization for large lists
