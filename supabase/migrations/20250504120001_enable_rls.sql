-- ============================================================================
-- Enable Row Level Security on All Tenant Tables
-- ============================================================================
-- Purpose: Multi-tenant isolation at database level
-- All queries must include business_id matching user's business
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTION: current_business_id()
-- Returns the business_id of the currently authenticated user.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.current_business_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM business_profiles
  WHERE owner_user_id = auth.uid()
  LIMIT 1
$$;

-- ============================================================================
-- ENABLE RLS ON: business_profiles
-- ============================================================================

ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business_profiles_own_read"
  ON public.business_profiles
  FOR SELECT
  USING (owner_user_id = auth.uid());

CREATE POLICY "business_profiles_own_update"
  ON public.business_profiles
  FOR UPDATE
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- ============================================================================
-- ENABLE RLS ON: customers
-- ============================================================================

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_tenant_read"
  ON public.customers
  FOR SELECT
  USING (business_id = current_business_id());

CREATE POLICY "customers_tenant_insert"
  ON public.customers
  FOR INSERT
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "customers_tenant_update"
  ON public.customers
  FOR UPDATE
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "customers_tenant_delete"
  ON public.customers
  FOR DELETE
  USING (business_id = current_business_id());

-- ============================================================================
-- ENABLE RLS ON: visits
-- ============================================================================

ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "visits_tenant_read"
  ON public.visits
  FOR SELECT
  USING (business_id = current_business_id());

CREATE POLICY "visits_tenant_insert"
  ON public.visits
  FOR INSERT
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "visits_tenant_update"
  ON public.visits
  FOR UPDATE
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "visits_tenant_delete"
  ON public.visits
  FOR DELETE
  USING (business_id = current_business_id());

-- ============================================================================
-- ENABLE RLS ON: staff_members
-- ============================================================================

ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_members_tenant_read"
  ON public.staff_members
  FOR SELECT
  USING (business_id = current_business_id());

CREATE POLICY "staff_members_tenant_insert"
  ON public.staff_members
  FOR INSERT
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "staff_members_tenant_update"
  ON public.staff_members
  FOR UPDATE
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "staff_members_tenant_delete"
  ON public.staff_members
  FOR DELETE
  USING (business_id = current_business_id());

-- ============================================================================
-- ENABLE RLS ON: locations
-- ============================================================================

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "locations_tenant_read"
  ON public.locations
  FOR SELECT
  USING (business_id = current_business_id());

CREATE POLICY "locations_tenant_insert"
  ON public.locations
  FOR INSERT
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "locations_tenant_update"
  ON public.locations
  FOR UPDATE
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "locations_tenant_delete"
  ON public.locations
  FOR DELETE
  USING (business_id = current_business_id());

-- ============================================================================
-- ENABLE RLS ON: message_templates
-- ============================================================================

ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "message_templates_tenant_read"
  ON public.message_templates
  FOR SELECT
  USING (business_id = current_business_id());

CREATE POLICY "message_templates_tenant_insert"
  ON public.message_templates
  FOR INSERT
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "message_templates_tenant_update"
  ON public.message_templates
  FOR UPDATE
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "message_templates_tenant_delete"
  ON public.message_templates
  FOR DELETE
  USING (business_id = current_business_id());

-- ============================================================================
-- ENABLE RLS ON: action_logs
-- ============================================================================

ALTER TABLE public.action_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "action_logs_tenant_read"
  ON public.action_logs
  FOR SELECT
  USING (business_id = current_business_id());

CREATE POLICY "action_logs_tenant_insert"
  ON public.action_logs
  FOR INSERT
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "action_logs_tenant_update"
  ON public.action_logs
  FOR UPDATE
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "action_logs_tenant_delete"
  ON public.action_logs
  FOR DELETE
  USING (business_id = current_business_id());

-- ============================================================================
-- ENABLE RLS ON: leads
-- ============================================================================

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads_tenant_read"
  ON public.leads
  FOR SELECT
  USING (business_id = current_business_id());

CREATE POLICY "leads_tenant_insert"
  ON public.leads
  FOR INSERT
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "leads_tenant_update"
  ON public.leads
  FOR UPDATE
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "leads_tenant_delete"
  ON public.leads
  FOR DELETE
  USING (business_id = current_business_id());

-- ============================================================================
-- ENABLE RLS ON: appointments
-- ============================================================================

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointments_tenant_read"
  ON public.appointments
  FOR SELECT
  USING (business_id = current_business_id());

CREATE POLICY "appointments_tenant_insert"
  ON public.appointments
  FOR INSERT
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "appointments_tenant_update"
  ON public.appointments
  FOR UPDATE
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "appointments_tenant_delete"
  ON public.appointments
  FOR DELETE
  USING (business_id = current_business_id());

-- ============================================================================
-- ENABLE RLS ON: campaigns
-- ============================================================================

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns_tenant_read"
  ON public.campaigns
  FOR SELECT
  USING (business_id = current_business_id());

CREATE POLICY "campaigns_tenant_insert"
  ON public.campaigns
  FOR INSERT
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "campaigns_tenant_update"
  ON public.campaigns
  FOR UPDATE
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "campaigns_tenant_delete"
  ON public.campaigns
  FOR DELETE
  USING (business_id = current_business_id());

-- ============================================================================
-- ENABLE RLS ON: campaign_recipients
-- ============================================================================

ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaign_recipients_tenant_read"
  ON public.campaign_recipients
  FOR SELECT
  USING (business_id = current_business_id());

CREATE POLICY "campaign_recipients_tenant_insert"
  ON public.campaign_recipients
  FOR INSERT
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "campaign_recipients_tenant_update"
  ON public.campaign_recipients
  FOR UPDATE
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "campaign_recipients_tenant_delete"
  ON public.campaign_recipients
  FOR DELETE
  USING (business_id = current_business_id());

-- ============================================================================
-- ENABLE RLS ON: loyalty_rules
-- ============================================================================

ALTER TABLE public.loyalty_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "loyalty_rules_tenant_read"
  ON public.loyalty_rules
  FOR SELECT
  USING (business_id = current_business_id());

CREATE POLICY "loyalty_rules_tenant_insert"
  ON public.loyalty_rules
  FOR INSERT
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "loyalty_rules_tenant_update"
  ON public.loyalty_rules
  FOR UPDATE
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "loyalty_rules_tenant_delete"
  ON public.loyalty_rules
  FOR DELETE
  USING (business_id = current_business_id());

-- ============================================================================
-- ENABLE RLS ON: customer_packages
-- ============================================================================

ALTER TABLE public.customer_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_packages_tenant_read"
  ON public.customer_packages
  FOR SELECT
  USING (business_id = current_business_id());

CREATE POLICY "customer_packages_tenant_insert"
  ON public.customer_packages
  FOR INSERT
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "customer_packages_tenant_update"
  ON public.customer_packages
  FOR UPDATE
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "customer_packages_tenant_delete"
  ON public.customer_packages
  FOR DELETE
  USING (business_id = current_business_id());

-- ============================================================================
-- ENABLE RLS ON: automation tables
-- ============================================================================

ALTER TABLE public.automation_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "automation_tenant_read"
  ON public.automation_sequences
  FOR SELECT
  USING (business_id = current_business_id());

CREATE POLICY "automation_tenant_all"
  ON public.automation_sequences
  FOR ALL
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

-- ============================================================================
-- ENABLE RLS ON: external_integrations
-- ============================================================================

ALTER TABLE public.external_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "external_integrations_tenant_read"
  ON public.external_integrations
  FOR SELECT
  USING (business_id = current_business_id());

CREATE POLICY "external_integrations_tenant_insert"
  ON public.external_integrations
  FOR INSERT
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "external_integrations_tenant_update"
  ON public.external_integrations
  FOR UPDATE
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "external_integrations_tenant_delete"
  ON public.external_integrations
  FOR DELETE
  USING (business_id = current_business_id());

-- ============================================================================
-- ENABLE RLS ON: google_reviews
-- ============================================================================

ALTER TABLE public.google_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "google_reviews_tenant_read"
  ON public.google_reviews
  FOR SELECT
  USING (business_id = current_business_id());

CREATE POLICY "google_reviews_tenant_insert"
  ON public.google_reviews
  FOR INSERT
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "google_reviews_tenant_update"
  ON public.google_reviews
  FOR UPDATE
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "google_reviews_tenant_delete"
  ON public.google_reviews
  FOR DELETE
  USING (business_id = current_business_id());

-- ============================================================================
-- ENABLE RLS ON: export_logs, audit_logs, owner_alerts
-- ============================================================================

ALTER TABLE public.export_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "logs_tenant_read"
  ON public.export_logs
  FOR SELECT
  USING (business_id = current_business_id());

CREATE POLICY "audit_tenant_read"
  ON public.audit_logs
  FOR SELECT
  USING (business_id = current_business_id());

CREATE POLICY "audit_tenant_insert"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "alerts_tenant_read"
  ON public.owner_alerts
  FOR SELECT
  USING (business_id = current_business_id());

CREATE POLICY "alerts_tenant_insert"
  ON public.owner_alerts
  FOR INSERT
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "alerts_tenant_update"
  ON public.owner_alerts
  FOR UPDATE
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this to verify all tables have RLS enabled:
-- SELECT tablename FROM pg_tables WHERE schemaname='public' AND rowsecurity=false;
-- Result should be EMPTY
-- ============================================================================