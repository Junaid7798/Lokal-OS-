import type { Customer, Visit, CustomerWithVisits } from '@/types';

export type TriggerType =
  | 'visit_completed'
  | 'customer_added'
  | 'appointment_completed'
  | 'appointment_reminder'
  | 'package_expiring'
  | 'package_expired'
  | 'inactive_days'
  | 'birthday'
  | 'anniversary'
  | 'segment_change'
  | 'revenue_milestone'
  | 'visit_milestone'
  | 'coupon_expiry'
  | 'coupon_redeemed'
  | 'followup_overdue'
  | 'manual';

export type ConditionField =
  | 'total_visits'
  | 'total_revenue'
  | 'avg_bill_value'
  | 'days_since_last_visit'
  | 'segment'
  | 'tier'
  | 'current_package_sessions'
  | 'has_package'
  | 'tags'
  | 'source'
  | 'location'
  | 'has_consent'
  | 'opt_out'
  | 'visit_count_this_month'
  | 'revenue_this_month'
  | 'last_visit_category';

export type Operator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'
  | 'contains'
  | 'not_contains'
  | 'between'
  | 'starts_with'
  | 'ends_with';

export interface CampaignCondition {
  id: string;
  field: ConditionField;
  operator: Operator;
  value: string | number | string[];
  secondary_value?: number;
}

export interface CampaignTrigger {
  type: TriggerType;
  days_offset?: number;
  target_segment?: string;
  recurrence?: 'once' | 'daily' | 'weekly' | 'monthly';
  end_date?: string;
}

export interface CampaignAction {
  id: string;
  type: 'whatsapp' | 'email' | 'sms' | 'notification' | 'internal';
  template: string;
  template_variables?: Record<string, string>;
  delay_days: number;
  conditions?: CampaignCondition[];
  enabled: boolean;
}

export interface CampaignAutomation {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  trigger: CampaignTrigger;
  conditions: CampaignCondition[];
  actions: CampaignAction[];
  status: 'active' | 'paused' | 'draft';
  segment_filter?: string;
  statistics?: CampaignStatistics;
  created_at: string;
  updated_at: string;
}

export interface CampaignStatistics {
  triggered: number;
  sent: number;
  failed: number;
  opened?: number;
  clicked?: number;
  last_run?: string;
  next_run?: string;
}

export interface SegmentDefinition {
  id: string;
  name: string;
  conditions: CampaignCondition[];
  description?: string;
  color: string;
  icon?: string;
}

export interface CustomerSegmentResult {
  segment: keyof typeof SEGMENT_TYPES;
  score: number;
  metrics: SegmentMetrics;
}

export interface SegmentMetrics {
  totalVisits: number;
  totalRevenue: number;
  avgBillValue: number;
  daysSinceLastVisit: number;
  visitFrequency: number;
  revenueGrowth: number;
}

export const SEGMENT_TYPES = {
  VIP: {
    name: 'VIP',
    color: '#10b981',
    description: 'High value, frequent customers',
  },
  AT_RISK: {
    name: 'At Risk',
    color: '#ef4444',
    description: 'Previously active but declining',
  },
  GROWING: {
    name: 'Growing',
    color: '#22c55e',
    description: 'Increasing engagement',
  },
  NEW: { name: 'New', color: '#3b82f6', description: 'Recent acquisition' },
  DORMANT: {
    name: 'Dormant',
    color: '#6b7280',
    description: 'No activity in 90+ days',
  },
  REGULAR: {
    name: 'Regular',
    color: '#f59e0b',
    description: 'Consistent, moderate engagement',
  },
} as const;

export const TRIGGER_LABELS: Record<TriggerType, string> = {
  visit_completed: 'After Visit',
  customer_added: 'New Customer',
  appointment_completed: 'Appointment Done',
  appointment_reminder: 'Appointment Reminder',
  package_expiring: 'Package Expiring',
  package_expired: 'Package Expired',
  inactive_days: 'Inactive Customer',
  birthday: 'Birthday',
  anniversary: 'Anniversary',
  segment_change: 'Segment Change',
  revenue_milestone: 'Revenue Milestone',
  visit_milestone: 'Visit Milestone',
  coupon_expiry: 'Coupon Expiry',
  coupon_redeemed: 'Coupon Redeemed',
  followup_overdue: 'Follow-up Overdue',
  manual: 'Manual Trigger',
};

export const TRIGGER_ICONS: Record<TriggerType, string> = {
  visit_completed: '✅',
  customer_added: '👋',
  appointment_completed: '📅',
  appointment_reminder: '⏰',
  package_expiring: '📦',
  package_expired: '📦',
  inactive_days: '😴',
  birthday: '🎂',
  anniversary: '💍',
  segment_change: '🔄',
  revenue_milestone: '💰',
  visit_milestone: '🏆',
  coupon_expiry: '🎟️',
  coupon_redeemed: '🎟️',
  followup_overdue: '📋',
  manual: '👆',
};

export function createSegmentDefinition(
  segmentType: keyof typeof SEGMENT_TYPES
): SegmentDefinition {
  const baseConditions: CampaignCondition[] = [];
  const info = SEGMENT_TYPES[segmentType];

  switch (segmentType) {
    case 'VIP':
      baseConditions.push(
        { id: 'c1', field: 'total_revenue', operator: 'gte', value: 10000 },
        { id: 'c2', field: 'total_visits', operator: 'gte', value: 5 }
      );
      break;
    case 'AT_RISK':
      baseConditions.push(
        {
          id: 'c1',
          field: 'days_since_last_visit',
          operator: 'gte',
          value: 45,
        },
        { id: 'c2', field: 'total_visits', operator: 'gte', value: 2 }
      );
      break;
    case 'GROWING':
      baseConditions.push(
        { id: 'c1', field: 'total_visits', operator: 'gte', value: 3 },
        { id: 'c2', field: 'days_since_last_visit', operator: 'lte', value: 21 }
      );
      break;
    case 'NEW':
      baseConditions.push(
        { id: 'c1', field: 'total_visits', operator: 'lte', value: 1 },
        { id: 'c2', field: 'days_since_last_visit', operator: 'lte', value: 30 }
      );
      break;
    case 'DORMANT':
      baseConditions.push({
        id: 'c1',
        field: 'days_since_last_visit',
        operator: 'gte',
        value: 90,
      });
      break;
    case 'REGULAR':
      baseConditions.push(
        {
          id: 'c1',
          field: 'days_since_last_visit',
          operator: 'lte',
          value: 60,
        },
        { id: 'c2', field: 'total_revenue', operator: 'lt', value: 10000 }
      );
      break;
  }

  return {
    id: `segment-${segmentType.toLowerCase()}`,
    name: info.name,
    conditions: baseConditions,
    description: info.description,
    color: info.color,
  };
}

export function calculateSegmentMetrics(
  visits: Visit[],
  now: Date = new Date()
): SegmentMetrics {
  if (visits.length === 0) {
    return {
      totalVisits: 0,
      totalRevenue: 0,
      avgBillValue: 0,
      daysSinceLastVisit: 999,
      visitFrequency: 0,
      revenueGrowth: 0,
    };
  }

  const sortedVisits = [...visits].sort(
    (a, b) =>
      new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime()
  );

  const totalRevenue = visits.reduce((sum, v) => sum + (v.bill_value || 0), 0);
  const lastVisitDate = new Date(sortedVisits[0].visit_date);

  const firstMonth = new Date(sortedVisits[sortedVisits.length - 1].visit_date);
  const lastMonth = new Date(sortedVisits[0].visit_date);
  const monthsDiff = Math.max(
    1,
    (lastMonth.getTime() - firstMonth.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  const visitFrequency = visits.length / monthsDiff;

  let revenueGrowth = 0;
  if (visits.length >= 2) {
    const midpoint = Math.floor(visits.length / 2);
    const firstHalfRevenue = visits
      .slice(0, midpoint)
      .reduce((sum, v) => sum + (v.bill_value || 0), 0);
    const secondHalfRevenue = visits
      .slice(midpoint)
      .reduce((sum, v) => sum + (v.bill_value || 0), 0);
    if (firstHalfRevenue > 0) {
      revenueGrowth =
        ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100;
    }
  }

  return {
    totalVisits: visits.length,
    totalRevenue,
    avgBillValue: totalRevenue / visits.length,
    daysSinceLastVisit: Math.floor(
      (now.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24)
    ),
    visitFrequency,
    revenueGrowth,
  };
}

export function evaluateCustomerSegment(
  customer: CustomerWithVisits,
  visits: Visit[]
): CustomerSegmentResult {
  const metrics = calculateSegmentMetrics(visits);
  const { totalVisits, totalRevenue, daysSinceLastVisit, revenueGrowth } =
    metrics;

  let segment: keyof typeof SEGMENT_TYPES;
  let score = 0;

  if (totalRevenue >= 10000 || totalVisits >= 10) {
    segment = 'VIP';
    score = 90 + Math.min(10, revenueGrowth);
  } else if (daysSinceLastVisit >= 90) {
    segment = 'DORMANT';
    score = Math.max(0, 50 - (daysSinceLastVisit - 90));
  } else if (
    daysSinceLastVisit >= 60 ||
    (totalVisits >= 2 && revenueGrowth < -30)
  ) {
    segment = 'AT_RISK';
    score = 40 + Math.min(20, 60 - daysSinceLastVisit);
  } else if (
    totalVisits >= 3 &&
    daysSinceLastVisit <= 30 &&
    revenueGrowth > 0
  ) {
    segment = 'GROWING';
    score = 70 + Math.min(30, revenueGrowth);
  } else if (totalVisits <= 1 && daysSinceLastVisit <= 30) {
    segment = 'NEW';
    score = 60 + Math.min(20, 30 - daysSinceLastVisit);
  } else {
    segment = 'REGULAR';
    score = 50 + Math.min(20, 30 - daysSinceLastVisit);
  }

  return { segment, score, metrics };
}

export function customerMatchesConditions(
  customer: CustomerWithVisits,
  visits: Visit[],
  conditions: CampaignCondition[]
): boolean {
  const metrics = calculateSegmentMetrics(visits);
  const {
    totalVisits,
    totalRevenue,
    avgBillValue,
    daysSinceLastVisit,
    visitFrequency,
    revenueGrowth,
  } = metrics;

  const segmentResult = evaluateCustomerSegment(customer, visits);

  return conditions.every((condition) => {
    let value: string | number;

    switch (condition.field) {
      case 'total_visits':
        value = totalVisits;
        break;
      case 'total_revenue':
        value = totalRevenue;
        break;
      case 'avg_bill_value':
        value = avgBillValue;
        break;
      case 'days_since_last_visit':
        value = daysSinceLastVisit;
        break;
      case 'segment':
        value = segmentResult.segment;
        break;
      case 'tags':
        value = customer.tags.join(',');
        break;
      case 'source':
        value = customer.source;
        break;
      case 'has_consent':
        value = customer.consent_status === 'given' ? 'yes' : 'no';
        break;
      case 'opt_out':
        value = customer.opt_out ? 'yes' : 'no';
        break;
      case 'visit_count_this_month':
        const thisMonth = new Date();
        thisMonth.setDate(1);
        value = visits.filter(
          (v) => new Date(v.visit_date) >= thisMonth
        ).length;
        break;
      case 'revenue_this_month':
        const monthStart = new Date();
        monthStart.setDate(1);
        value = visits
          .filter((v) => new Date(v.visit_date) >= monthStart)
          .reduce((sum, v) => sum + (v.bill_value || 0), 0);
        break;
      default:
        return true;
    }

    return evaluateOperator(value, condition.operator, condition.value);
  });
}

function evaluateOperator(
  actual: string | number,
  operator: Operator,
  expected: string | number | string[]
): boolean {
  const actualNum =
    typeof actual === 'string' ? parseFloat(actual) || 0 : actual;

  switch (operator) {
    case 'eq':
      return String(actual).toLowerCase() === String(expected).toLowerCase();
    case 'neq':
      return String(actual).toLowerCase() !== String(expected).toLowerCase();
    case 'gt':
      return typeof expected === 'number' && actualNum > expected;
    case 'lt':
      return typeof expected === 'number' && actualNum < expected;
    case 'gte':
      return typeof expected === 'number' && actualNum >= expected;
    case 'lte':
      return typeof expected === 'number' && actualNum <= expected;
    case 'contains':
      return String(actual)
        .toLowerCase()
        .includes(String(expected).toLowerCase());
    case 'not_contains':
      return !String(actual)
        .toLowerCase()
        .includes(String(expected).toLowerCase());
    case 'between':
      return (
        Array.isArray(expected) &&
        typeof expected[0] === 'number' &&
        typeof expected[1] === 'number' &&
        actualNum >= expected[0] &&
        actualNum <= expected[1]
      );
    case 'starts_with':
      return String(actual)
        .toLowerCase()
        .startsWith(String(expected).toLowerCase());
    case 'ends_with':
      return String(actual)
        .toLowerCase()
        .endsWith(String(expected).toLowerCase());
    default:
      return true;
  }
}

export function shouldTriggerAutomation(
  automation: CampaignAutomation,
  trigger: TriggerType,
  customer: CustomerWithVisits,
  visits: Visit[]
): boolean {
  if (automation.trigger.type !== trigger) return false;
  if (automation.status !== 'active') return false;

  if (automation.conditions.length === 0) return true;

  return customerMatchesConditions(customer, visits, automation.conditions);
}

export function getNextScheduledAction(
  automation: CampaignAutomation,
  triggerDate: Date
): { action: CampaignAction; scheduledDate: Date; actionIndex: number } | null {
  const activeActions = automation.actions
    .filter((a) => a.enabled && a.delay_days >= 0)
    .sort((a, b) => a.delay_days - b.delay_days);

  if (activeActions.length === 0) return null;

  const actionIndex = automation.actions.findIndex(
    (a) => a.id === activeActions[0].id
  );
  const nextAction = activeActions[0];
  const scheduledDate = new Date(triggerDate);
  scheduledDate.setDate(scheduledDate.getDate() + nextAction.delay_days);

  return { action: nextAction, scheduledDate, actionIndex };
}

export function getAllScheduledActions(
  automation: CampaignAutomation,
  triggerDate: Date
): Array<{ action: CampaignAction; scheduledDate: Date }> {
  return automation.actions
    .filter((a) => a.enabled && a.delay_days >= 0)
    .sort((a, b) => a.delay_days - b.delay_days)
    .map((action) => {
      const scheduledDate = new Date(triggerDate);
      scheduledDate.setDate(scheduledDate.getDate() + action.delay_days);
      return { action, scheduledDate };
    });
}

export function getAutomationStats(
  automation: CampaignAutomation,
  triggeredCount: number,
  sentCount: number,
  failedCount: number
): CampaignStatistics {
  return {
    triggered: triggeredCount,
    sent: sentCount,
    failed: failedCount,
  };
}

export function calculateSuccessRate(stats: CampaignStatistics): number {
  return stats.triggered > 0
    ? Math.round((stats.sent / stats.triggered) * 100)
    : 0;
}

export function processMessageTemplate(
  template: string,
  customer: CustomerWithVisits,
  visits: Visit[],
  metrics: SegmentMetrics
): string {
  const lastVisit = visits.length > 0 ? visits[0] : null;
  const segmentResult = evaluateCustomerSegment(customer, visits);

  const variables: Record<string, string> = {
    '{{customer_name}}': customer.name,
    '{{first_name}}': customer.name.split(' ')[0],
    '{{last_visit}}': lastVisit ? formatDate(lastVisit.visit_date) : 'N/A',
    '{{days_since_visit}}': String(metrics.daysSinceLastVisit),
    '{{total_visits}}': String(metrics.totalVisits),
    '{{total_spent}}': formatCurrency(metrics.totalRevenue),
    '{{avg_bill}}': formatCurrency(metrics.avgBillValue),
    '{{segment}}': segmentResult.segment,
    '{{business_name}}': '',
  };

  let message = template;
  for (const [key, value] of Object.entries(variables)) {
    message = message.replace(
      new RegExp(key.replace(/[{}}]/g, '\\$&'), 'g'),
      value
    );
  }

  return message;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function createAutomation(
  businessId: string,
  options: {
    name: string;
    description?: string;
    trigger: CampaignTrigger;
    conditions?: CampaignCondition[];
    actions?: CampaignAction[];
    segment_filter?: string;
  }
): CampaignAutomation {
  const now = new Date().toISOString();
  return {
    id: `auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    business_id: businessId,
    name: options.name,
    description: options.description,
    trigger: options.trigger,
    conditions: options.conditions || [],
    actions: options.actions || [],
    status: 'draft',
    segment_filter: options.segment_filter,
    statistics: {
      triggered: 0,
      sent: 0,
      failed: 0,
    },
    created_at: now,
    updated_at: now,
  };
}

export function validateAutomation(automation: CampaignAutomation): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!automation.name.trim()) {
    errors.push('Automation name is required');
  }

  if (!automation.trigger.type) {
    errors.push('Trigger type is required');
  }

  if (automation.actions.length === 0) {
    errors.push('At least one action is required');
  }

  automation.actions.forEach((action, index) => {
    if (!action.template.trim()) {
      errors.push(`Action ${index + 1}: Message template is required`);
    }
    if (!action.type) {
      errors.push(`Action ${index + 1}: Action type is required`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function getEligibleCustomers(
  customers: CustomerWithVisits[],
  visitsMap: Map<string, Visit[]>,
  conditions: CampaignCondition[]
): CustomerWithVisits[] {
  return customers.filter((customer) => {
    const visits = visitsMap.get(customer.id) || [];
    return customerMatchesConditions(customer, visits, conditions);
  });
}

export function calculateCampaignReach(
  automation: CampaignAutomation,
  totalCustomers: number,
  eligibleCount: number
): { reach: number; percentage: number } {
  return {
    reach: eligibleCount,
    percentage:
      totalCustomers > 0
        ? Math.round((eligibleCount / totalCustomers) * 100)
        : 0,
  };
}
