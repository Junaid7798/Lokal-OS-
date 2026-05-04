-- ============================================================================
-- LokalOS Multi-Tenant Schema v1
-- Created: 2025-05-04
-- Purpose: Master schema for all LokalOS entities with RLS foundations
--
-- Key Design Principles:
--   1. Every tenant table has business_id uuid NOT NULL
--   2. business_id references business_profiles(id) on delete cascade
--   3. Timestamp columns: created_at, updated_at (default now())
--   4. id is always uuid primary key with gen_random_uuid() default
--   5. RLS enabled on every tenant table (enforced in separate migration)
--   6. Indexes on business_id and common query paths
-- ============================================================================

-- ============================================================================
-- CORE PROFILE & AUTH TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.business_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL UNIQUE,
  business_name text NOT NULL,
  email text NOT NULL,
  phone text,
  plan text NOT NULL DEFAULT 'Free' CHECK (plan IN ('Free', 'Starter', 'Pro', 'Enterprise')),
  plan_status text NOT NULL DEFAULT 'active' CHECK (plan_status IN ('active', 'paused', 'cancelled', 'trial')),
  subscription_end_date timestamptz,
  
  -- Engagement preferences
  auto_follow_ups_enabled boolean NOT NULL DEFAULT true,
  loyalty_program_enabled boolean NOT NULL DEFAULT false,
  whatsapp_enabled boolean NOT NULL DEFAULT false,
  google_reviews_enabled boolean NOT NULL DEFAULT false,
  
  -- Plan limits
  customer_limit integer NOT NULL DEFAULT 50,
  monthly_whatsapp_action_limit integer NOT NULL DEFAULT 100,
  whatsapp_actions_used integer NOT NULL DEFAULT 0,
  
  -- Business settings
  inactivity_threshold_days integer NOT NULL DEFAULT 30,
  service_categories text[] NOT NULL DEFAULT ARRAY['General'],
  timezone text NOT NULL DEFAULT 'UTC',
  currency text NOT NULL DEFAULT 'USD',
  
  -- Audit
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_profiles_owner_user_id 
  ON public.business_profiles(owner_user_id);

-- ============================================================================
-- CUSTOMER MASTER
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  
  -- Contact information
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  source text,
  
  -- Consent & communication preferences
  consent_status text NOT NULL DEFAULT 'pending'
    CHECK (consent_status IN ('pending', 'given', 'withdrawn')),
  opt_out boolean NOT NULL DEFAULT false,
  
  -- Engagement tracking
  tags text[] NOT NULL DEFAULT '{}',
  notes text DEFAULT '',
  review_status text NOT NULL DEFAULT 'not_asked'
    CHECK (review_status IN ('not_asked', 'asked', 'reviewed', 'escalated')),
  
  -- Business metrics
  total_visits integer DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  is_returned boolean DEFAULT false,
  
  -- Profile customization
  birthday_date date,
  anniversary_date date,
  last_visit_date timestamptz,
  
  -- Audit
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(business_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_customers_business_id 
  ON public.customers(business_id);
CREATE INDEX IF NOT EXISTS idx_customers_business_id_created_at_desc 
  ON public.customers(business_id, created_at DESC);

-- ============================================================================
-- VISIT HISTORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  
  visit_date date NOT NULL,
  service_category text NOT NULL,
  duration_minutes integer,
  
  revenue numeric DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'completed'
    CHECK (payment_status IN ('pending', 'completed', 'failed')),
  payment_method text,
  staff_name text,
  notes text DEFAULT '',
  
  -- Audit
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visits_business_id 
  ON public.visits(business_id);
CREATE INDEX IF NOT EXISTS idx_visits_customer_id 
  ON public.visits(customer_id);
CREATE INDEX IF NOT EXISTS idx_visits_visit_date 
  ON public.visits(visit_date DESC);

-- ============================================================================
-- STAFF MEMBERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.staff_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  
  name text NOT NULL,
  email text,
  phone text,
  role text NOT NULL DEFAULT 'staff'
    CHECK (role IN ('staff', 'manager', 'admin')),
  specialties text[] NOT NULL DEFAULT '{}',
  
  -- Audit
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(business_id, email)
);

CREATE INDEX IF NOT EXISTS idx_staff_members_business_id 
  ON public.staff_members(business_id);

-- ============================================================================
-- LOCATIONS (MULTI-LOCATION SUPPORT)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  
  name text NOT NULL,
  address text,
  phone text,
  is_primary boolean NOT NULL DEFAULT false,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_locations_business_id 
  ON public.locations(business_id);

-- ============================================================================
-- MESSAGE TEMPLATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  
  template_type text NOT NULL
    CHECK (template_type IN ('whatsapp', 'email', 'sms')),
  name text NOT NULL,
  content text NOT NULL,
  variables text[] NOT NULL DEFAULT '{}',
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_message_templates_business_id 
  ON public.message_templates(business_id);

-- ============================================================================
-- ACTION LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.action_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  
  action_type text NOT NULL,
  staff_name text,
  metadata jsonb DEFAULT '{}',
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_action_logs_business_id 
  ON public.action_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_customer_id 
  ON public.action_logs(customer_id);

-- ============================================================================
-- LEADS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  source text,
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'converted', 'lost')),
  notes text DEFAULT '',
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(business_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_leads_business_id 
  ON public.leads(business_id);

-- ============================================================================
-- APPOINTMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  
  appointment_date timestamptz NOT NULL,
  duration_minutes integer DEFAULT 60,
  staff_member_id uuid REFERENCES public.staff_members(id) ON DELETE SET NULL,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  notes text DEFAULT '',
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_business_id 
  ON public.appointments(business_id);
CREATE INDEX IF NOT EXISTS idx_appointments_appointment_date 
  ON public.appointments(appointment_date);

-- ============================================================================
-- CAMPAIGNS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  
  name text NOT NULL,
  campaign_type text NOT NULL
    CHECK (campaign_type IN ('followup', 'review_request', 'winback', 'promo')),
  message_template_id uuid REFERENCES public.message_templates(id) ON DELETE SET NULL,
  
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'in_progress', 'completed', 'paused')),
  
  scheduled_at timestamptz,
  completed_at timestamptz,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_business_id 
  ON public.campaigns(business_id);

-- ============================================================================
-- CAMPAIGN RECIPIENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.campaign_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  
  sent_at timestamptz,
  response_status text DEFAULT 'pending'
    CHECK (response_status IN ('pending', 'sent', 'failed', 'replied')),
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign_id 
  ON public.campaign_recipients(campaign_id);

-- ============================================================================
-- LOYALTY RULES & CUSTOMER PACKAGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.loyalty_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  
  name text NOT NULL,
  rule_type text NOT NULL,
  trigger_value integer NOT NULL,
  reward_type text NOT NULL,
  reward_value integer NOT NULL,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_rules_business_id 
  ON public.loyalty_rules(business_id);

CREATE TABLE IF NOT EXISTS public.customer_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  loyalty_rule_id uuid REFERENCES public.loyalty_rules(id) ON DELETE SET NULL,
  
  package_type text NOT NULL,
  visits_remaining integer DEFAULT 0,
  points_balance numeric DEFAULT 0,
  expiry_date date,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_packages_customer_id 
  ON public.customer_packages(customer_id);

-- ============================================================================
-- AUTOMATION SEQUENCES & JOBS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.automation_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  
  name text NOT NULL,
  trigger_type text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.automation_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  sequence_id uuid NOT NULL REFERENCES public.automation_sequences(id) ON DELETE CASCADE,
  
  step_order integer NOT NULL,
  action_type text NOT NULL,
  delay_days integer DEFAULT 0,
  message_template_id uuid REFERENCES public.message_templates(id) ON DELETE SET NULL,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.automation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  
  sequence_id uuid NOT NULL REFERENCES public.automation_sequences(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  
  next_step_at timestamptz,
  completed_at timestamptz,
  error_message text,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_jobs_status 
  ON public.automation_jobs(status);

-- ============================================================================
-- EXTERNAL INTEGRATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.external_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  
  service_name text NOT NULL
    CHECK (service_name IN ('google_business', 'whatsapp', 'stripe', 'zapier')),
  
  is_active boolean NOT NULL DEFAULT false,
  credentials jsonb,
  last_synced_at timestamptz,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(business_id, service_name)
);

-- ============================================================================
-- GOOGLE REVIEWS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.google_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  
  review_text text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  review_url text,
  reviewer_name text,
  synced_at timestamptz NOT NULL DEFAULT now(),
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_google_reviews_business_id 
  ON public.google_reviews(business_id);

-- ============================================================================
-- EXPORT & AUDIT LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.export_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  
  export_type text NOT NULL,
  row_count integer DEFAULT 0,
  file_url text,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  
  actor_id uuid REFERENCES public.staff_members(id) ON DELETE SET NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  old_values jsonb DEFAULT '{}',
  new_values jsonb DEFAULT '{}',
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity 
  ON public.audit_logs(entity_type, entity_id);

-- ============================================================================
-- OWNER ALERTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.owner_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  
  alert_type text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_owner_alerts_is_read 
  ON public.owner_alerts(is_read);

-- ============================================================================
-- END SCHEMA
-- ============================================================================