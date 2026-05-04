import { Business } from '../types';

export const PLANS = {
  Free: {
    customer_limit: 50,
    whatsapp_limit: 30,
    features: ['basic_followup', 'review_qr'],
  },
  Founding: {
    customer_limit: 500,
    whatsapp_limit: 500,
    features: ['basic_followup', 'review_qr', 'inactive_list', 'daily_report'],
  },
  Pro: {
    customer_limit: 2000,
    whatsapp_limit: 2000,
    features: [
      'basic_followup',
      'review_qr',
      'inactive_list',
      'daily_report',
      'weekly_report',
      'staff_activity',
      'csv_import',
    ],
  },
  Automation: {
    customer_limit: 10000,
    whatsapp_limit: 10000,
    features: ['all'],
  },
};

export const checkLimit = (
  business: Business,
  type: 'customer' | 'whatsapp',
  currentCount: number
) => {
  if (business.plan === 'Automation') return true;

  if (type === 'customer') return currentCount < business.customer_limit;
  if (type === 'whatsapp')
    return currentCount < business.monthly_whatsapp_action_limit;
  return true;
};

export const hasFeature = (business: Business, feature: string) => {
  if (business.plan === 'Automation') return true;
  const planFeatures = PLANS[business.plan].features;
  return planFeatures.includes(feature) || planFeatures.includes('all');
};
