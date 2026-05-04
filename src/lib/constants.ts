/**
 * Platform-wide limits and thresholds for various business operations.
 * These values are constants and should not be modified at runtime.
 */
export const LIMITS = {
  /** Maximum customers allowed on free tier */
  FREE_CUSTOMER_LIMIT: 50,
  /** Warning threshold (40/50 = 80% utilization) */
  FREE_CUSTOMER_WARNING_THRESHOLD: 40,
  /** Default follow-up days for new customers */
  DEFAULT_FOLLOWUP_DAYS: 30,
  /** Days of inactivity before triggering follow-up */
  INACTIVE_THRESHOLD_DAYS: 30,
  /** Minimum days before marking follow-up as overdue */
  OVERDUE_FOLLOWUP_MIN_DAYS: 2,
  /** Maximum days before marking follow-up as overdue */
  OVERDUE_FOLLOWUP_MAX_DAYS: 7,
  /** Monthly WhatsApp message limit for free tier */
  MONTHLY_WHATSAPP_FREE_LIMIT: 30,
} as const;

/**
 * Default values for business configuration.
 * Used when setting up new businesses or as placeholder values.
 */
export const DEFAULTS = {
  /** Default staff member name for solo businesses */
  STAFF_MEMBERS: 'Owner',
  /** Default service categories offered */
  SERVICE_CATEGORIES: 'Haircut, Facial, Massage, Styling, Coloring',
  /** Default customer acquisition sources */
  CUSTOMER_SOURCES: 'Walk-in, Instagram, Referral, Google, Facebook, Other',
  /** Default thank you message after service */
  THANK_YOU_MESSAGE: 'thank you for visiting today!',
  /** Default review request message */
  REQUEST_REVIEW_MESSAGE: "we'd love it if you could leave us a review here:",
  /** Default follow-up message for inactive customers */
  FOLLOW_UP_MESSAGE: 'just a quick follow-up to see how you are doing after your recent service.',
  /** Default comeback message for re-engagement */
  COMEBACK_MESSAGE: "it's been while! We'd love to see you again.",
  /** Default referral program message */
  REFERRAL_MESSAGE: 'loved our service? Refer a friend and you both get a discount on your next visit!',
  /** Default language code */
  LANGUAGE: 'en',
} as const;

/** IndexedDB schema version */
export const DB_VERSION = 1;
/** IndexedDB database name */
export const DB_NAME = 'lokalos_db';

/**
 * Pricing constants for paid plans.
 */
export const PLANS = {
  /** Price in INR for Pro plan (monthly) */
  PRO_PRICE_INR: 1999,
} as const;