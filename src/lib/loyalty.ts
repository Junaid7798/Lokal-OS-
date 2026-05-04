import type { Customer, Visit } from '@/types';

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
    | 'anniversary'
    | 'package_purchase';
  points: number;
  multiplier?: number;
  conditions?: RuleCondition[];
  active: boolean;
  max_uses?: number;
  current_uses?: number;
}

export interface RuleCondition {
  field:
    | 'service_category'
    | 'bill_value'
    | 'visit_count'
    | 'days_since_last_visit'
    | 'total_revenue';
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not_in';
  value: string | number | string[];
}

export interface CustomerLoyaltyProfile {
  customer_id: string;
  total_points: number;
  current_tier: string;
  lifetime_points: number;
  points_used: number;
  tier_history: TierChange[];
}

export interface TierChange {
  tier: string;
  changed_at: string;
  reason: 'earned' | 'downgraded' | 'manual';
}

export interface PointsTransaction {
  id: string;
  customer_id: string;
  business_id: string;
  type:
    | 'earned'
    | 'redeemed'
    | 'expired'
    | 'bonus'
    | 'adjustment'
    | 'welcome'
    | 'referral'
    | 'review';
  points: number;
  source: string;
  reference_id?: string;
  created_at: string;
  expires_at?: string;
  status: 'active' | 'expired' | 'redeemed';
}

export interface RedemptionRecord {
  id: string;
  customer_id: string;
  business_id: string;
  points_used: number;
  rupee_value: number;
  description: string;
  created_at: string;
}

const DEFAULT_TIERS: LoyaltyTier[] = [
  {
    id: 'tier-1',
    name: 'Regular',
    min_points: 0,
    discount_percent: 0,
    perks: ['Base points earning'],
  },
  {
    id: 'tier-2',
    name: 'Silver',
    min_points: 500,
    discount_percent: 5,
    perks: [
      '5% bonus points',
      'Birthday bonus points',
      'Early access to promotions',
    ],
  },
  {
    id: 'tier-3',
    name: 'Gold',
    min_points: 2000,
    discount_percent: 10,
    perks: [
      '10% bonus points',
      'Priority booking',
      'Birthday bonus points',
      'Exclusive offers',
    ],
  },
  {
    id: 'tier-4',
    name: 'Platinum',
    min_points: 5000,
    discount_percent: 15,
    perks: [
      '15% bonus points',
      'Priority booking',
      'Exclusive offers',
      'Birthday bonus points',
      'Free add-on services',
    ],
  },
];

const DEFAULT_EARNING_RULES: EarningRule[] = [
  {
    id: 'rule-1',
    name: 'Per Rupee Spent',
    trigger: 'per_rupee',
    points: 1,
    active: true,
  },
  {
    id: 'rule-2',
    name: 'Per Visit Bonus',
    trigger: 'per_visit',
    points: 10,
    active: true,
  },
  {
    id: 'rule-3',
    name: 'Welcome Bonus',
    trigger: 'new_customer',
    points: 100,
    active: true,
    max_uses: 1,
  },
  {
    id: 'rule-4',
    name: 'Referral Reward',
    trigger: 'referral',
    points: 200,
    active: true,
    max_uses: 10,
  },
  {
    id: 'rule-5',
    name: 'Review Bonus',
    trigger: 'review',
    points: 50,
    active: true,
    max_uses: 1,
  },
  {
    id: 'rule-6',
    name: 'Birthday Bonus',
    trigger: 'birthday',
    points: 150,
    active: true,
    max_uses: 1,
  },
  {
    id: 'rule-7',
    name: 'Anniversary Bonus',
    trigger: 'anniversary',
    points: 100,
    active: true,
    max_uses: 1,
  },
];

export function getDefaultConfig(business_id: string): LoyaltyPointsConfig {
  return {
    business_id,
    points_per_rupee: 1,
    minimum_redemption: 100,
    points_expiry_days: 365,
    tiers: DEFAULT_TIERS,
    earning_rules: DEFAULT_EARNING_RULES,
  };
}

export function calculateTier(
  config: LoyaltyPointsConfig,
  points: number
): LoyaltyTier {
  const sortedTiers = [...config.tiers].sort(
    (a, b) => b.min_points - a.min_points
  );
  return sortedTiers.find((t) => points >= t.min_points) || config.tiers[0];
}

export function detectTierChange(
  config: LoyaltyPointsConfig,
  oldPoints: number,
  newPoints: number
): {
  changed: boolean;
  oldTier: LoyaltyTier;
  newTier: LoyaltyTier;
  upgraded: boolean;
} {
  const oldTier = calculateTier(config, oldPoints);
  const newTier = calculateTier(config, newPoints);

  const changed = oldTier.id !== newTier.id;
  return {
    changed,
    oldTier,
    newTier,
    upgraded: changed && newTier.min_points > oldTier.min_points,
  };
}

export function calculatePointsEarned(
  config: LoyaltyPointsConfig,
  visit: Visit,
  customer: Customer,
  existingTransactions?: PointsTransaction[]
): number {
  let totalPoints = 0;
  const currentTier = calculateTier(config, 0);
  const tierMultiplier = 1 + currentTier.discount_percent / 100;

  for (const rule of config.earning_rules) {
    if (!rule.active) continue;

    if (
      rule.conditions &&
      !evaluateConditions(rule.conditions, visit, customer)
    ) {
      continue;
    }

    if (rule.max_uses && existingTransactions) {
      const usedCount = existingTransactions.filter(
        (t) => t.source === rule.id && t.status !== 'expired'
      ).length;
      if (usedCount >= rule.max_uses) continue;
    }

    switch (rule.trigger) {
      case 'per_rupee':
        totalPoints +=
          (visit.bill_value || 0) *
          config.points_per_rupee *
          (rule.multiplier || 1);
        break;
      case 'per_visit':
        totalPoints += rule.points;
        break;
      case 'new_customer':
        if (isNewCustomer(customer)) {
          totalPoints += rule.points;
        }
        break;
      case 'birthday':
        if (isBirthday(customer)) {
          totalPoints += rule.points;
        }
        break;
      case 'anniversary':
        if (isAnniversary(customer)) {
          totalPoints += rule.points;
        }
        break;
    }
  }

  return Math.floor(totalPoints * tierMultiplier);
}

function isNewCustomer(customer: Customer, days: number = 30): boolean {
  const created = new Date(customer.created_at);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diffDays <= days;
}

function isBirthday(customer: Customer): boolean {
  if (!customer.birthday_date) return false;
  const today = new Date();
  const birthday = new Date(customer.birthday_date);
  return (
    today.getMonth() === birthday.getMonth() &&
    today.getDate() === birthday.getDate()
  );
}

function isAnniversary(customer: Customer): boolean {
  if (!customer.anniversary_date) return false;
  const today = new Date();
  const anniversary = new Date(customer.anniversary_date);
  return (
    today.getMonth() === anniversary.getMonth() &&
    today.getDate() === anniversary.getDate()
  );
}

export function isEligibleForBirthdayBonus(customer: Customer): boolean {
  return isBirthday(customer);
}

export function isEligibleForAnniversaryBonus(customer: Customer): boolean {
  return isAnniversary(customer);
}

function evaluateConditions(
  conditions: RuleCondition[],
  visit: Visit,
  customer: Customer
): boolean {
  return conditions.every((condition) => {
    const value = getFieldValue(condition.field, visit, customer);
    return compareValues(value, condition.operator, condition.value);
  });
}

function getFieldValue(
  field: string,
  visit: Visit,
  customer: Customer
): string | number {
  switch (field) {
    case 'service_category':
      return visit.service_category;
    case 'bill_value':
      return visit.bill_value || 0;
    case 'visit_count':
      return 0;
    case 'days_since_last_visit':
      return 0;
    case 'total_revenue':
      return 0;
    default:
      return 0;
  }
}

function compareValues(
  actual: string | number,
  operator: string,
  expected: string | number | string[]
): boolean {
  const actualNum =
    typeof actual === 'string' ? parseFloat(actual) || 0 : actual;
  const expectedNum =
    typeof expected === 'number'
      ? expected
      : typeof expected === 'string'
        ? parseFloat(expected) || 0
        : 0;

  switch (operator) {
    case 'eq':
      return String(actual) === String(expected);
    case 'neq':
      return String(actual) !== String(expected);
    case 'gt':
      return actualNum > expectedNum;
    case 'lt':
      return actualNum < expectedNum;
    case 'gte':
      return actualNum >= expectedNum;
    case 'lte':
      return actualNum <= expectedNum;
    case 'in':
      return Array.isArray(expected) && expected.includes(String(actual));
    case 'not_in':
      return Array.isArray(expected) && !expected.includes(String(actual));
    default:
      return true;
  }
}

export function calculateRedeemableValue(
  config: LoyaltyPointsConfig,
  points: number
): number {
  if (points < config.minimum_redemption) return 0;
  return Math.floor(points / config.points_per_rupee);
}

export function canRedeem(
  config: LoyaltyPointsConfig,
  points: number
): {
  eligible: boolean;
  reason?: string;
} {
  if (points < config.minimum_redemption) {
    return {
      eligible: false,
      reason: `Need at least ${config.minimum_redemption} points`,
    };
  }
  return { eligible: true };
}

export function calculatePointsToRedeem(
  config: LoyaltyPointsConfig,
  amount: number
): number {
  return Math.ceil(amount * config.points_per_rupee);
}

export function processRedemption(
  config: LoyaltyPointsConfig,
  currentPoints: number,
  redemptionAmount: number
): { valid: boolean; pointsUsed: number; error?: string } {
  const pointsNeeded = calculatePointsToRedeem(config, redemptionAmount);

  if (pointsNeeded > currentPoints) {
    return { valid: false, pointsUsed: 0, error: 'Insufficient points' };
  }

  if (pointsNeeded < config.minimum_redemption) {
    return {
      valid: false,
      pointsUsed: 0,
      error: `Minimum redemption is ${config.minimum_redemption} points`,
    };
  }

  return { valid: true, pointsUsed: pointsNeeded };
}

export function isPointsExpired(
  transaction: PointsTransaction,
  now: Date = new Date()
): boolean {
  if (!transaction.expires_at) return false;
  return new Date(transaction.expires_at) < now;
}

export function getExpiryDate(
  config: LoyaltyPointsConfig,
  createdAt: Date = new Date()
): Date {
  const expiry = new Date(createdAt);
  expiry.setDate(expiry.getDate() + config.points_expiry_days);
  return expiry;
}

export function getActivePoints(
  transactions: PointsTransaction[],
  now: Date = new Date()
): number {
  return transactions
    .filter((t) => t.status === 'active' && !isPointsExpired(t, now))
    .reduce((sum, t) => sum + t.points, 0);
}

export function getExpiringPoints(
  transactions: PointsTransaction[],
  daysThreshold: number = 30,
  now: Date = new Date()
): { points: number; transactions: PointsTransaction[] } {
  const thresholdDate = new Date(now);
  thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

  const expiring = transactions.filter(
    (t) =>
      t.status === 'active' &&
      t.expires_at &&
      new Date(t.expires_at) <= thresholdDate &&
      new Date(t.expires_at) > now
  );

  return {
    points: expiring.reduce((sum, t) => sum + t.points, 0),
    transactions: expiring,
  };
}

export function processExpiredPoints(
  transactions: PointsTransaction[],
  now: Date = new Date()
): PointsTransaction[] {
  return transactions.map((t) => {
    if (t.status === 'active' && isPointsExpired(t, now)) {
      return { ...t, status: 'expired' as const };
    }
    return t;
  });
}

export function createTransaction(
  customerId: string,
  businessId: string,
  type: PointsTransaction['type'],
  points: number,
  source: string,
  config: LoyaltyPointsConfig,
  referenceId?: string
): PointsTransaction {
  const now = new Date();
  return {
    id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    customer_id: customerId,
    business_id: businessId,
    type,
    points,
    source,
    reference_id: referenceId,
    created_at: now.toISOString(),
    expires_at: getExpiryDate(config, now).toISOString(),
    status: 'active',
  };
}

export function calculateTierProgress(
  config: LoyaltyPointsConfig,
  currentPoints: number
): {
  currentTier: LoyaltyTier;
  nextTier: LoyaltyTier | null;
  progress: number;
  pointsToNextTier: number;
} {
  const currentTier = calculateTier(config, currentPoints);
  const sortedTiers = [...config.tiers].sort(
    (a, b) => a.min_points - b.min_points
  );
  const currentIndex = sortedTiers.findIndex((t) => t.id === currentTier.id);
  const nextTier =
    currentIndex < sortedTiers.length - 1
      ? sortedTiers[currentIndex + 1]
      : null;

  let progress = 0;
  let pointsToNext = 0;

  if (nextTier) {
    const tierStart = currentTier.min_points;
    const tierEnd = nextTier.min_points;
    const pointsInTier = currentPoints - tierStart;
    const tierRange = tierEnd - tierStart;
    progress = Math.min(100, Math.max(0, (pointsInTier / tierRange) * 100));
    pointsToNext = Math.max(0, nextTier.min_points - currentPoints);
  }

  return { currentTier, nextTier, progress, pointsToNextTier: pointsToNext };
}

export function getTierBenefits(
  config: LoyaltyPointsConfig,
  tierName: string
): string[] {
  const tier = config.tiers.find((t) => t.name === tierName);
  return tier?.perks || [];
}

export function getAllTierInfo(config: LoyaltyPointsConfig): Array<{
  tier: LoyaltyTier;
  memberCount: number;
}> {
  return config.tiers.map((tier) => ({
    tier,
    memberCount: 0,
  }));
}
