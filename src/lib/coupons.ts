export type CouponType =
  | 'percentage'
  | 'fixed'
  | 'buy_x_get_y'
  | 'bogo'
  | 'loyalty_redemption';
export type CouponStatus = 'active' | 'expired' | 'used' | 'disabled';

export interface Coupon {
  id: string;
  business_id: string;
  code: string;
  name: string;
  description?: string;
  type: CouponType;
  value: number;
  min_purchase?: number;
  max_discount?: number;
  max_uses?: number;
  per_customer_limit?: number;
  current_uses: number;
  valid_from: string;
  valid_until: string;
  applicable_services?: string[];
  applicable_segments?: string[];
  applicable_locations?: string[];
  first_visit_only?: boolean;
  stackable?: boolean;
  status: CouponStatus;
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

export interface CouponValidationResult {
  valid: boolean;
  error?: string;
  discount_amount?: number;
  can_stack: boolean;
}

export interface CouponStatistics {
  total_coupons: number;
  active_coupons: number;
  total_uses: number;
  total_discount_given: number;
  avg_redemption_rate: number;
}

export interface BatchCouponOptions {
  prefix?: string;
  count: number;
  code_length?: number;
  exclude_similar?: boolean;
  existing_codes?: string[];
}

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;

function generateCode(
  length: number = CODE_LENGTH,
  existingCodes: string[] = []
): string {
  let code = '';
  let attempts = 0;
  const maxAttempts = 100;

  do {
    code = '';
    for (let i = 0; i < length; i++) {
      code += CHARS[Math.floor(Math.random() * CHARS.length)];
    }
    attempts++;
  } while (existingCodes.includes(code) && attempts < maxAttempts);

  return code;
}

export function generateCouponCode(prefix?: string): string {
  const code = generateCode();
  return prefix ? `${prefix.toUpperCase()}${code}` : code;
}

export function generateBatchCodes(options: BatchCouponOptions): string[] {
  const codes: string[] = [];
  const length = options.code_length || CODE_LENGTH;
  const existing = new Set(options.existing_codes || []);

  for (let i = 0; i < options.count; i++) {
    const code = generateCode(length, Array.from(existing));
    const fullCode = options.prefix
      ? `${options.prefix.toUpperCase()}${code}`
      : code;
    codes.push(fullCode);
    existing.add(fullCode);
  }

  return codes;
}

export function validateCoupon(
  coupon: Coupon,
  customerId: string,
  purchaseAmount: number,
  serviceCategory?: string,
  customerSegment?: string,
  customerVisitCount?: number,
  previousRedemptions: number = 0
): CouponValidationResult {
  const now = new Date();
  const validFrom = new Date(coupon.valid_from);
  const validUntil = new Date(coupon.valid_until);

  if (now < validFrom) {
    return {
      valid: false,
      error: 'Coupon is not yet active',
      can_stack: false,
    };
  }

  if (now > validUntil) {
    return { valid: false, error: 'Coupon has expired', can_stack: false };
  }

  if (coupon.status !== 'active') {
    return {
      valid: false,
      error: `Coupon is ${coupon.status}`,
      can_stack: false,
    };
  }

  if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
    return {
      valid: false,
      error: 'Coupon usage limit reached',
      can_stack: false,
    };
  }

  if (
    coupon.per_customer_limit &&
    previousRedemptions >= coupon.per_customer_limit
  ) {
    return {
      valid: false,
      error: `You have already used this coupon ${coupon.per_customer_limit} time(s)`,
      can_stack: false,
    };
  }

  if (coupon.min_purchase && purchaseAmount < coupon.min_purchase) {
    return {
      valid: false,
      error: `Minimum purchase of ₹${coupon.min_purchase} required`,
      can_stack: false,
    };
  }

  if (coupon.applicable_services?.length && serviceCategory) {
    if (!coupon.applicable_services.includes(serviceCategory)) {
      return {
        valid: false,
        error: 'Coupon not applicable for this service',
        can_stack: false,
      };
    }
  }

  if (coupon.applicable_segments?.length && customerSegment) {
    if (!coupon.applicable_segments.includes(customerSegment)) {
      return {
        valid: false,
        error: 'Coupon not applicable for your customer segment',
        can_stack: false,
      };
    }
  }

  if (coupon.first_visit_only && customerVisitCount && customerVisitCount > 0) {
    return {
      valid: false,
      error: 'This coupon is only valid for first-time customers',
      can_stack: false,
    };
  }

  const discountAmount = calculateDiscount(coupon, purchaseAmount);

  return {
    valid: true,
    discount_amount: discountAmount,
    can_stack: coupon.stackable || false,
  };
}

export function calculateDiscount(
  coupon: Coupon,
  purchaseAmount: number
): number {
  let discount = 0;

  switch (coupon.type) {
    case 'percentage':
      discount = Math.floor(purchaseAmount * (coupon.value / 100));
      break;
    case 'fixed':
      discount = Math.min(coupon.value, purchaseAmount);
      break;
    case 'buy_x_get_y':
      discount = purchaseAmount;
      break;
    case 'bogo':
      discount = Math.floor(purchaseAmount / 2);
      break;
    case 'loyalty_redemption':
      discount = coupon.value;
      break;
    default:
      discount = 0;
  }

  if (coupon.max_discount) {
    discount = Math.min(discount, coupon.max_discount);
  }

  return Math.min(discount, purchaseAmount);
}

export function createCoupon(
  businessId: string,
  options: {
    name: string;
    description?: string;
    type: CouponType;
    value: number;
    min_purchase?: number;
    max_discount?: number;
    max_uses?: number;
    per_customer_limit?: number;
    valid_days: number;
    valid_from?: Date;
    applicable_services?: string[];
    applicable_segments?: string[];
    applicable_locations?: string[];
    first_visit_only?: boolean;
    stackable?: boolean;
    prefix?: string;
  }
): Coupon {
  const now = options.valid_from || new Date();
  const validUntil = new Date(now);
  validUntil.setDate(validUntil.getDate() + options.valid_days);

  return {
    id: `coupon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    business_id: businessId,
    code: generateCouponCode(options.prefix),
    name: options.name,
    description: options.description,
    type: options.type,
    value: options.value,
    min_purchase: options.min_purchase,
    max_discount: options.max_discount,
    max_uses: options.max_uses,
    per_customer_limit: options.per_customer_limit,
    current_uses: 0,
    valid_from: now.toISOString(),
    valid_until: validUntil.toISOString(),
    applicable_services: options.applicable_services,
    applicable_segments: options.applicable_segments,
    applicable_locations: options.applicable_locations,
    first_visit_only: options.first_visit_only,
    stackable: options.stackable,
    status: 'active',
    created_at: now.toISOString(),
  };
}

export function createBatchCoupons(
  businessId: string,
  options: {
    base_options: Omit<Parameters<typeof createCoupon>[1], 'prefix'>;
    batch_options: BatchCouponOptions;
  }
): Coupon[] {
  const codes = generateBatchCodes({
    prefix: options.batch_options.prefix,
    count: options.batch_options.count,
    code_length: options.batch_options.code_length,
    existing_codes: options.batch_options.existing_codes,
  });

  return codes.map((code) => ({
    ...createCoupon(businessId, { ...options.base_options, prefix: '' }),
    code,
  }));
}

export function formatCouponCode(code: string): string {
  return code.match(/.{1,4}/g)?.join('-') || code;
}

export function parseFormattedCode(formatted: string): string {
  return formatted.replace(/-/g, '').toUpperCase();
}

export function getCouponDisplayValue(coupon: Coupon): string {
  switch (coupon.type) {
    case 'percentage':
      return `${coupon.value}% OFF${coupon.max_discount ? ` (Max ₹${coupon.max_discount})` : ''}`;
    case 'fixed':
      return `₹${coupon.value} OFF`;
    case 'buy_x_get_y':
      return `Buy ${coupon.value} Get 1 Free`;
    case 'bogo':
      return 'Buy One Get One Free';
    case 'loyalty_redemption':
      return `${coupon.value} Points Redeemed`;
    default:
      return '';
  }
}

export function getCouponBadge(coupon: Coupon): {
  label: string;
  color: string;
} {
  const now = new Date();
  const validUntil = new Date(coupon.valid_until);
  const daysRemaining = Math.floor(
    (validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (coupon.status === 'disabled') {
    return { label: 'Disabled', color: 'bg-gray-100 text-gray-700' };
  }
  if (now > validUntil) {
    return { label: 'Expired', color: 'bg-red-100 text-red-700' };
  }
  if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
    return { label: 'Fully Redeemed', color: 'bg-green-100 text-green-700' };
  }
  if (daysRemaining <= 3 && daysRemaining > 0) {
    return {
      label: `Expires in ${daysRemaining}d`,
      color: 'bg-yellow-100 text-yellow-700',
    };
  }
  return { label: 'Active', color: 'bg-green-100 text-green-700' };
}

export function isCouponExpiringSoon(
  coupon: Coupon,
  daysThreshold: number = 3
): boolean {
  const now = new Date();
  const validUntil = new Date(coupon.valid_until);
  const daysRemaining = Math.floor(
    (validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysRemaining > 0 && daysRemaining <= daysThreshold;
}

export function getCouponUsagePercentage(coupon: Coupon): number {
  if (!coupon.max_uses) return 0;
  return Math.round((coupon.current_uses / coupon.max_uses) * 100);
}

export function getRemainingUses(coupon: Coupon): number | null {
  if (!coupon.max_uses) return null;
  return Math.max(0, coupon.max_uses - coupon.current_uses);
}

export function calculateCouponStatistics(
  coupons: Coupon[],
  redemptions: CouponRedemption[]
): CouponStatistics {
  const activeCoupons = coupons.filter((c) => c.status === 'active');
  const totalUses = coupons.reduce((sum, c) => sum + c.current_uses, 0);
  const totalDiscount = redemptions.reduce(
    (sum, r) => sum + r.discount_amount,
    0
  );

  const usedCoupons = coupons.filter((c) => c.max_uses && c.current_uses > 0);
  const avgRedemption =
    usedCoupons.length > 0
      ? (usedCoupons.reduce((sum, c) => sum + c.current_uses / c.max_uses, 0) /
          usedCoupons.length) *
        100
      : 0;

  return {
    total_coupons: coupons.length,
    active_coupons: activeCoupons.length,
    total_uses: totalUses,
    total_discount_given: totalDiscount,
    avg_redemption_rate: Math.round(avgRedemption),
  };
}

export function getCouponsByStatus(
  coupons: Coupon[]
): Record<CouponStatus, Coupon[]> {
  return {
    active: coupons.filter((c) => c.status === 'active'),
    expired: coupons.filter((c) => c.status === 'expired'),
    used: coupons.filter((c) => c.max_uses && c.current_uses >= c.max_uses),
    disabled: coupons.filter((c) => c.status === 'disabled'),
  };
}

export function getExpiringCoupons(
  coupons: Coupon[],
  days: number = 7
): Coupon[] {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + days);

  return coupons.filter(
    (c) =>
      c.status === 'active' &&
      new Date(c.valid_until) <= threshold &&
      new Date(c.valid_until) > new Date()
  );
}

export function getTopPerformingCoupons(
  coupons: Coupon[],
  limit: number = 5
): Coupon[] {
  return [...coupons]
    .sort((a, b) => b.current_uses - a.current_uses)
    .slice(0, limit);
}

export function createRedemption(
  couponId: string,
  customerId: string,
  discountAmount: number,
  originalAmount: number,
  visitId?: string
): CouponRedemption {
  return {
    id: `redemp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    coupon_id: couponId,
    customer_id: customerId,
    visit_id: visitId,
    discount_amount: discountAmount,
    original_amount: originalAmount,
    redeemed_at: new Date().toISOString(),
  };
}

export function applyCoupon(
  coupon: Coupon,
  purchaseAmount: number,
  customerId: string,
  visitId?: string
): { success: boolean; redemption?: CouponRedemption; error?: string } {
  const validation = validateCoupon(coupon, customerId, purchaseAmount);

  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const redemption = createRedemption(
    coupon.id,
    customerId,
    validation.discount_amount!,
    purchaseAmount,
    visitId
  );

  return { success: true, redemption };
}
