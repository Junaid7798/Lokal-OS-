-- Run this in your Supabase SQL Editor

-- 1. Create Business Profiles Table
CREATE TABLE public.business_profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  business_name text NOT NULL,
  industry text,
  phone text,
  google_review_link text,
  average_bill_value numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business profile" ON public.business_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own business profile" ON public.business_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own business profile" ON public.business_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Create Staff Members Table
CREATE TABLE public.staff_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid REFERENCES public.business_profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  phone text,
  role text DEFAULT 'Staff',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own staff" ON public.staff_members
  FOR ALL USING (auth.uid() = business_id) WITH CHECK (auth.uid() = business_id);

-- 3. Create Customers Table
CREATE TABLE public.customers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid REFERENCES public.business_profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  source text,
  consent_status boolean DEFAULT true,
  note text,
  created_by_staff_id uuid REFERENCES public.staff_members(id) ON DELETE SET NULL,
  review_status text DEFAULT 'not_asked',
  birthday_date date,
  anniversary_date date,
  created_at timestamptz DEFAULT now(),
  UNIQUE(business_id, phone)
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own customers" ON public.customers
  FOR ALL USING (auth.uid() = business_id) WITH CHECK (auth.uid() = business_id);

-- 4. Create Visits Table
CREATE TABLE public.visits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid REFERENCES public.business_profiles(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  service_category text,
  visit_date date NOT NULL DEFAULT CURRENT_DATE,
  bill_value numeric,
  payment_status text DEFAULT 'Pending',
  payment_method text,
  created_by_staff_id uuid REFERENCES public.staff_members(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own visits" ON public.visits
  FOR ALL USING (auth.uid() = business_id) WITH CHECK (auth.uid() = business_id);

-- 5. Create Message Templates Table
CREATE TABLE public.message_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid REFERENCES public.business_profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL, -- thank_you, review, reminder, comeback, referral
  language text NOT NULL, -- en, hi, hinglish
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(business_id, type, language)
);

ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own templates" ON public.message_templates
  FOR ALL USING (auth.uid() = business_id) WITH CHECK (auth.uid() = business_id);

-- 6. Create Audit Action Logs
CREATE TABLE public.action_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid REFERENCES public.business_profiles(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  created_by_staff_id uuid REFERENCES public.staff_members(id) ON DELETE SET NULL,
  action_type text NOT NULL, -- 'review_request', 'follow_up', 'comeback', 'referral', 'marked_returned'
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.action_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own logs" ON public.action_logs
  FOR ALL USING (auth.uid() = business_id) WITH CHECK (auth.uid() = business_id);

-- 7. Create Leads Table
CREATE TABLE public.leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid REFERENCES public.business_profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  source text,
  interest text,
  status text DEFAULT 'New', -- New, Contacted, Follow-Up Due, Converted, Lost
  next_followup_date date,
  notes text,
  created_by_staff_id uuid REFERENCES public.staff_members(id) ON DELETE SET NULL,
  converted_customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own leads" ON public.leads
  FOR ALL USING (auth.uid() = business_id) WITH CHECK (auth.uid() = business_id);

-- 8. Create Appointments Table
CREATE TABLE public.appointments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid REFERENCES public.business_profiles(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  service_category text,
  staff_name text,
  status text DEFAULT 'Booked', -- Booked, Confirmed, Completed, No-Show, Cancelled, Rescheduled
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own appointments" ON public.appointments
  FOR ALL USING (auth.uid() = business_id) WITH CHECK (auth.uid() = business_id);

-- 9. Create Campaigns Table
CREATE TABLE public.campaigns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid REFERENCES public.business_profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  segment_type text NOT NULL,
  message_template text,
  status text DEFAULT 'Draft', -- Draft, Active, Finished
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own campaigns" ON public.campaigns
  FOR ALL USING (auth.uid() = business_id) WITH CHECK (auth.uid() = business_id);

-- 10. Create Campaign Recipients Table
CREATE TABLE public.campaign_recipients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  business_id uuid REFERENCES public.business_profiles(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'Pending', -- Pending, Sent, Returned
  sent_at timestamptz,
  returned_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own campaign recipients" ON public.campaign_recipients
  FOR ALL USING (auth.uid() = business_id) WITH CHECK (auth.uid() = business_id);

-- 11. Create Loyalty Tables
CREATE TABLE public.loyalty_rules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid REFERENCES public.business_profiles(id) ON DELETE CASCADE NOT NULL,
  rule_name text NOT NULL,
  visit_threshold int NOT NULL,
  reward_text text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.loyalty_rewards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid REFERENCES public.business_profiles(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  rule_id uuid REFERENCES public.loyalty_rules(id) ON DELETE CASCADE NOT NULL,
  reward_text text NOT NULL,
  status text DEFAULT 'Pending', -- Pending, Given
  given_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.loyalty_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own loyalty rules" ON public.loyalty_rules
  FOR ALL USING (auth.uid() = business_id) WITH CHECK (auth.uid() = business_id);


-- 12. Create Customer Packages Table
CREATE TABLE public.customer_packages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid REFERENCES public.business_profiles(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  package_name text NOT NULL,
  total_sessions int NOT NULL,
  used_sessions int DEFAULT 0,
  start_date date,
  expiry_date date,
  status text DEFAULT 'Active', -- Active, Expired
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.customer_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own customer packages" ON public.customer_packages
  FOR ALL USING (auth.uid() = business_id) WITH CHECK (auth.uid() = business_id);

-- 13. Create Owner Alerts Table
CREATE TABLE public.owner_alerts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid REFERENCES public.business_profiles(id) ON DELETE CASCADE NOT NULL,
  alert_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  severity text NOT NULL, -- Low, Medium, High
  status text DEFAULT 'Active', -- Active, Resolved, Dismissed
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE public.owner_alerts ENABLE ROW LEVEL SECURITY;

-- 14. Create Public Tool Leads Table
CREATE TABLE public.public_tool_leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  business_name text NOT NULL,
  phone text NOT NULL,
  tool_used text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.public_tool_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert for tool leads" ON public.public_tool_leads
  FOR INSERT WITH CHECK (true);

-- 15. Add Plan Fields to Business Profiles
ALTER TABLE public.business_profiles
  ADD COLUMN plan text DEFAULT 'Free',
  ADD COLUMN plan_status text DEFAULT 'active',
  ADD COLUMN customer_limit int DEFAULT 50,
  ADD COLUMN monthly_whatsapp_action_limit int DEFAULT 30;

-- 16. Create Automation Tables
CREATE TABLE public.automation_sequences (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid REFERENCES public.business_profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  trigger_type text NOT NULL,
  active boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.automation_steps (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sequence_id uuid REFERENCES public.automation_sequences(id) ON DELETE CASCADE NOT NULL,
  day_offset int NOT NULL,
  message_type text NOT NULL,
  template_name text NOT NULL,
  status text DEFAULT 'Active',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.automation_jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid REFERENCES public.business_profiles(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  sequence_id uuid REFERENCES public.automation_sequences(id) ON DELETE CASCADE NOT NULL,
  step_id uuid REFERENCES public.automation_steps(id) ON DELETE CASCADE NOT NULL,
  scheduled_for timestamptz NOT NULL,
  status text DEFAULT 'Scheduled', -- Scheduled, Sent, Failed, Skipped
  provider_message_id text,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.automation_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own automation sequences" ON public.automation_sequences
  FOR ALL USING (auth.uid() = business_id) WITH CHECK (auth.uid() = business_id);

CREATE POLICY "Users manage their own automation steps" ON public.automation_steps
  FOR ALL USING (EXISTS (SELECT 1 FROM public.automation_sequences WHERE id = sequence_id AND business_id = auth.uid()));

CREATE POLICY "Users manage their own automation jobs" ON public.automation_jobs
  FOR ALL USING (auth.uid() = business_id) WITH CHECK (auth.uid() = business_id);

-- 17. Add Review and Integration Tables
CREATE TABLE public.external_integrations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid REFERENCES public.business_profiles(id) ON DELETE CASCADE NOT NULL,
  provider text NOT NULL,
  access_token_encrypted text,
  refresh_token_encrypted text,
  status text DEFAULT 'not_connected',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.google_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid REFERENCES public.business_profiles(id) ON DELETE CASCADE NOT NULL,
  google_review_id text NOT NULL,
  reviewer_name text NOT NULL,
  rating int NOT NULL,
  review_text text,
  review_date timestamptz NOT NULL,
  reply_text text,
  replied_at timestamptz,
  status text DEFAULT 'pending', -- pending, replied, ignored
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.external_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own integrations" ON public.external_integrations
  FOR ALL USING (auth.uid() = business_id) WITH CHECK (auth.uid() = business_id);

CREATE POLICY "Users manage their own reviews" ON public.google_reviews
  FOR ALL USING (auth.uid() = business_id) WITH CHECK (auth.uid() = business_id);

-- 19. Add Locations Table
CREATE TABLE public.locations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid REFERENCES public.business_profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  address text,
  phone text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own locations" ON public.locations
  FOR ALL USING (auth.uid() = business_id) WITH CHECK (auth.uid() = business_id);

-- 20. Add Export Logs Table
CREATE TABLE public.export_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid REFERENCES public.business_profiles(id) ON DELETE CASCADE NOT NULL,
  export_type text NOT NULL,
  exported_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.export_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own export logs" ON public.export_logs
  FOR ALL USING (auth.uid() = business_id) WITH CHECK (auth.uid() = business_id);

-- 21. Add Audit Logs Table
CREATE TABLE public.audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid REFERENCES public.business_profiles(id) ON DELETE CASCADE NOT NULL,
  actor_type text NOT NULL,
  actor_name text NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata_json jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own audit logs" ON public.audit_logs
  FOR ALL USING (auth.uid() = business_id) WITH CHECK (auth.uid() = business_id);

-- Update existing tables for location support
ALTER TABLE public.customers ADD COLUMN location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL;
ALTER TABLE public.visits ADD COLUMN location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL;
ALTER TABLE public.staff_members ADD COLUMN location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL;
ALTER TABLE public.appointments ADD COLUMN location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL;

