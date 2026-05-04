export interface Location {
  id: string;
  business_id: string;
  name: string;
  address?: string;
  phone?: string;
  active: boolean;
  created_at: string;
}

export interface Customer {
  id: string;
  business_id: string;
  location_id?: string;
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
  created_at: string;
  updated_at: string;
}

export interface Visit {
  id: string;
  business_id: string;
  customer_id: string;
  location_id?: string;
  service_category: string;
  visit_date: string;
  bill_value?: number;
  payment_status: 'Paid' | 'Pending' | 'Partial' | 'Not Applicable';
  payment_method?: 'Cash' | 'UPI' | 'Card' | 'Other';
  staff_name: string;
  notes: string;
  created_at: string;
}

export interface ServiceFollowupRule {
  id: string;
  business_id: string;
  service_category: string;
  default_followup_days: number;
}

export interface Business {
  id: string;
  business_name: string;
  average_bill_value: number;
  plan: 'Free' | 'Founding' | 'Pro' | 'Automation';
  plan_status: 'trial' | 'active' | 'overdue' | 'cancelled';
  customer_limit: number;
  monthly_whatsapp_action_limit: number;
  created_at: string;
}

export interface FollowupTask {
  id: string;
  business_id: string;
  customer_id: string;
  visit_id: string;
  task_type: string;
  due_date: string;
  status: 'pending' | 'completed';
  completed_at?: string;
  created_at: string;
}

export interface Lead {
  id: string;
  business_id: string;
  name: string;
  phone: string;
  source: string;
  interest: string;
  status: 'New' | 'Contacted' | 'Follow-Up Due' | 'Converted' | 'Lost';
  next_followup_date: string;
  notes: string;
  created_by_staff_id?: string;
  converted_customer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  business_id: string;
  customer_id: string;
  location_id?: string;
  appointment_date: string;
  appointment_time: string;
  service_category: string;
  staff_name: string;
  status:
    | 'Booked'
    | 'Confirmed'
    | 'Completed'
    | 'No-Show'
    | 'Cancelled'
    | 'Rescheduled';
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  business_id: string;
  name: string;
  segment_type: string;
  message_template: string;
  status: 'Draft' | 'Active' | 'Finished';
  created_at: string;
}

export interface CampaignRecipient {
  id: string;
  campaign_id: string;
  business_id: string;
  customer_id: string;
  status: 'Pending' | 'Sent' | 'Returned';
  sent_at?: string;
  returned_at?: string;
  created_at: string;
}

export interface LoyaltyRule {
  id: string;
  business_id: string;
  rule_name: string;
  visit_threshold: number;
  reward_text: string;
  active: boolean;
  created_at: string;
}

export interface LoyaltyReward {
  id: string;
  business_id: string;
  customer_id: string;
  rule_id: string;
  reward_text: string;
  status: 'Pending' | 'Given';
  given_at?: string;
  created_at: string;
}
export interface CustomerPackage {
  id: string;
  business_id: string;
  customer_id: string;
  package_name: string;
  total_sessions: number;
  used_sessions: number;
  start_date?: string;
  expiry_date?: string;
  status: 'Active' | 'Expired';
  created_at: string;
  updated_at: string;
}

export interface OwnerAlert {
  id: string;
  business_id: string;
  alert_type: string;
  title: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High';
  status: 'Active' | 'Resolved' | 'Dismissed';
  created_at: string;
  resolved_at?: string;
}

export interface AutomationSequence {
  id: string;
  business_id: string;
  name: string;
  trigger_type:
    | 'visit_added'
    | 'customer_added'
    | 'appointment_completed'
    | 'inactive_threshold';
  active: boolean;
  created_at: string;
}

export interface AutomationStep {
  id: string;
  sequence_id: string;
  day_offset: number;
  message_type: 'whatsapp';
  template_name: string;
  status: string;
  created_at: string;
}

export interface AutomationJob {
  id: string;
  business_id: string;
  customer_id: string;
  sequence_id: string;
  step_id: string;
  scheduled_for: string;
  status: 'Scheduled' | 'Sent' | 'Failed' | 'Skipped';
  provider_message_id?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface ExternalIntegration {
  id: string;
  business_id: string;
  provider: 'google_business_profile';
  status: 'not_connected' | 'connected' | 'error';
  created_at: string;
  updated_at: string;
}

export interface GoogleReview {
  id: string;
  business_id: string;
  google_review_id: string;
  reviewer_name: string;
  rating: number;
  review_text?: string;
  review_date: string;
  reply_text?: string;
  replied_at?: string;
  status: 'pending' | 'replied' | 'ignored';
  created_at: string;
}

export interface Agency {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
}

export interface AgencyBusiness {
  id: string;
  agency_id: string;
  business_id: string;
  relationship_status: 'active' | 'revoked';
  created_at: string;
}

// Action types for audit logging
export interface Action {
  id: string;
  business_id: string;
  customer_id: string;
  action_type:
    | 'follow_up'
    | 'whatsapp'
    | 'comeback'
    | 'visit_added'
    | 'note_added'
    | 'review_request';
  description?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// User/Auth types
export interface User {
  id: string;
  email: string;
}

// Business Profile with additional fields
export interface BusinessProfile extends Business {
  business_name: string;
  industry?: string;
  phone?: string;
  google_review_link?: string;
  default_language: string;
  staff_members: string;
  service_categories: string;
  customer_sources: string;
  msg_thank_you?: string;
  msg_request_review?: string;
  msg_follow_up?: string;
  msg_comeback?: string;
  msg_referral?: string;
  isNew?: boolean;
  is_pro?: boolean;
}

// Customer with visits (extended type)
export interface CustomerWithVisits extends Customer {
  visits?: Visit[];
  total_revenue?: number;
  is_returned?: boolean;
  revenue_recovered?: number;
}

// Stats types
export interface DashboardStats {
  totalCustomers: number;
  returningCustomers: number;
  revenue: number;
  recoveredRevenue: number;
}

export interface Alert {
  type: 'Low' | 'Medium' | 'High';
  message: string;
  action: string;
  route: string;
}

export interface OccasionCustomer extends Customer {
  occasionType: 'birthday' | 'anniversary';
}

// Chart data types
export interface ChartDataPoint {
  date: Date;
  name: string;
  customers: number;
  revenue: number;
}

// Loyalty & Points types
export interface LoyaltyPointsConfig {
  business_id: string;
  points_per_rupee: number;
  minimum_redemption: number;
  points_expiry_days: number;
  tiers: LoyaltyTier[];
  earning_rules: EarningRule[];
}

export interface LoyaltyTier {
  id: string;
  name: 'Regular' | 'Silver' | 'Gold' | 'Platinum';
  min_points: number;
  discount_percent: number;
  perks: string[];
}

export interface EarningRule {
  id: string;
  name: string;
  trigger:
    | 'per_rupee'
    | 'per_visit'
    | 'new_customer'
    | 'referral'
    | 'review'
    | 'birthday'
    | 'anniversary';
  points: number;
  multiplier?: number;
  conditions?: RuleCondition[];
  active: boolean;
}

export interface RuleCondition {
  field:
    | 'service_category'
    | 'bill_value'
    | 'visit_count'
    | 'days_since_last_visit';
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in';
  value: string | number | string[];
}

export interface CustomerLoyaltyProfile {
  customer_id: string;
  total_points: number;
  current_tier: string;
  lifetime_points: number;
  points_used: number;
}

export interface PointsTransaction {
  id: string;
  customer_id: string;
  business_id: string;
  type: 'earned' | 'redeemed' | 'expired' | 'bonus' | 'adjustment';
  points: number;
  source: string;
  reference_id?: string;
  created_at: string;
  expires_at?: string;
}

// Campaign Automation types
export interface CampaignAutomation {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  trigger_type: TriggerType;
  trigger_days_offset?: number;
  conditions: CampaignCondition[];
  actions: CampaignAction[];
  status: 'active' | 'paused' | 'draft';
  segment_filter?: string;
  created_at: string;
  updated_at: string;
}

export type TriggerType =
  | 'visit_completed'
  | 'customer_added'
  | 'appointment_completed'
  | 'package_expiring'
  | 'inactive_days'
  | 'birthday'
  | 'anniversary'
  | 'segment_change'
  | 'revenue_milestone'
  | 'coupon_expiry';

export interface CampaignCondition {
  id: string;
  field: ConditionField;
  operator: Operator;
  value: string | number | string[];
  secondary_value?: number;
}

export type ConditionField =
  | 'total_visits'
  | 'total_revenue'
  | 'days_since_last_visit'
  | 'segment'
  | 'tier'
  | 'current_package_sessions'
  | 'has_package'
  | 'tags'
  | 'source'
  | 'location';

export type Operator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'
  | 'contains'
  | 'not_contains'
  | 'between';

export interface CampaignAction {
  id: string;
  type: 'whatsapp' | 'email' | 'sms' | 'notification';
  template: string;
  delay_days: number;
  conditions?: CampaignCondition[];
}

// Coupon types
export interface Coupon {
  id: string;
  business_id: string;
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed' | 'buy_x_get_y' | 'bogo';
  value: number;
  min_purchase?: number;
  max_uses?: number;
  current_uses: number;
  valid_from: string;
  valid_until: string;
  applicable_services?: string[];
  applicable_segments?: string[];
  status: 'active' | 'expired' | 'used' | 'disabled';
  created_by?: string;
  created_at: string;
}

export interface CouponRedemption {
  id: string;
  coupon_id: string;
  customer_id: string;
  visit_id?: string;
  discount_amount: number;
  original_amount: number;
  redeemed_at: string;
}
