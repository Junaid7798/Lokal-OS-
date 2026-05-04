import { z } from 'zod';

/**
 * Phone number validation and formatting utilities.
 * These functions ensure phone numbers are properly formatted for
 * storage, display, and WhatsApp integration.
 */

// =============================================================================
// Zod Schemas for Entity Validation
// =============================================================================

export const customerSchema = z.object({
  id: z.string().optional(),
  business_id: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(100),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  source: z.string().optional().default('Walk-in'),
  consent_status: z.enum(['pending', 'given', 'withdrawn']).default('pending'),
  opt_out: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  notes: z.string().default(''),
  review_status: z.enum(['not_asked', 'requested', 'reviewed', 'skipped']).default('not_asked'),
  birthday_date: z.string().optional(),
  anniversary_date: z.string().optional(),
});

export const visitSchema = z.object({
  id: z.string().optional(),
  business_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  location_id: z.string().uuid().optional(),
  service_category: z.string().min(1, 'Service category is required'),
  visit_date: z.string(),
  bill_value: z.number().nonnegative().optional(),
  payment_status: z.enum(['Paid', 'Pending', 'Partial', 'Not Applicable']).default('Pending'),
  payment_method: z.enum(['Cash', 'UPI', 'Card', 'Other']).optional(),
  staff_name: z.string().default('Owner'),
  notes: z.string().default(''),
});

export const appointmentSchema = z.object({
  id: z.string().optional(),
  business_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  location_id: z.string().uuid().optional(),
  appointment_date: z.string(),
  appointment_time: z.string(),
  service_category: z.string().min(1, 'Service category is required'),
  staff_name: z.string().default('Owner'),
  status: z.enum(['Booked', 'Confirmed', 'Completed', 'No-Show', 'Cancelled', 'Rescheduled']).default('Booked'),
  notes: z.string().default(''),
});

export const leadSchema = z.object({
  id: z.string().optional(),
  business_id: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  source: z.string().optional().default('Website'),
  interest: z.string().optional().default(''),
  status: z.enum(['New', 'Contacted', 'Follow-Up Due', 'Converted', 'Lost']).default('New'),
  next_followup_date: z.string().optional(),
  notes: z.string().default(''),
});

export const campaignSchema = z.object({
  id: z.string().optional(),
  business_id: z.string().uuid(),
  name: z.string().min(1, 'Campaign name is required'),
  segment_type: z.string().optional().default(''),
  message_template: z.string().min(1, 'Message template is required'),
  status: z.enum(['Draft', 'Active', 'Finished']).default('Draft'),
});

export const customerInputSchema = customerSchema.omit({ id: true }).extend({
  phone: z.string().transform((val) => cleanPhoneNumber(val)).pipe(
    z.string().min(10, 'Phone must be at least 10 digits')
  ),
});

export const visitInputSchema = visitSchema.omit({ id: true, business_id: true, customer_id: true });

export const appointmentInputSchema = appointmentSchema.omit({ id: true, business_id: true, customer_id: true });

export const leadInputSchema = leadSchema.omit({ id: true, business_id: true });

// Type exports from schemas
export type CustomerInput = z.infer<typeof customerInputSchema>;
export type VisitInput = z.infer<typeof visitInputSchema>;
export type AppointmentInput = z.infer<typeof appointmentInputSchema>;
export type LeadInput = z.infer<typeof leadInputSchema>;

/**
 * Removes all non-numeric characters except + from phone number.
 * 
 * @param phone - Raw phone number string
 * @returns Cleaned phone number with only digits and +
 * 
 * @example
 * cleanPhoneNumber('+91 98765 43210') // returns '+919876543210'
 * cleanPhoneNumber('(987) 654-3210') // returns '9876543210'
 */
export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/[^0-9+]/g, '');
}

/**
 * Validates if phone number has acceptable digit count.
 * 
 * @param phone - Phone number to validate
 * @returns true if valid (10-15 digits), false otherwise
 * 
 * @example
 * isValidPhoneNumber('+919876543210') // true
 * isValidPhoneNumber('123') // false
 */
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = cleanPhoneNumber(phone);
  // Most valid phone numbers range from 10-15 digits
  const digitCount = cleaned.replace(/\D/g, '').length;
  return digitCount >= 10 && digitCount <= 15;
}

/**
 * Formats phone number for WhatsApp API (ensures + prefix).
 * 
 * @param phone - Phone number to format
 * @returns Formatted number with + prefix
 * 
 * @example
 * formatPhoneForWhatsApp('919876543210') // returns '+919876543210'
 * formatPhoneForWhatsApp('+91 98765 43210') // returns '+919876543210'
 */
export function formatPhoneForWhatsApp(phone: string): string {
  const cleaned = cleanPhoneNumber(phone);
  const digits = cleaned.replace(/\+/g, '');
  return `+${digits}`;
}

/**
 * Generates WhatsApp Deep Link for message composition.
 * 
 * @param phone - Recipient phone number
 * @param message - Message to send
 * @returns WhatsApp deep link URL
 * 
 * @example
 * generateWhatsAppLink('+919876543210', 'Hello!')
 * // returns 'https://wa.me/919876543210?text=Hello%21'
 */
export function generateWhatsAppLink(phone: string, message: string): string {
  const formatted = formatPhoneForWhatsApp(phone);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formatted.replace('+', '')}?text=${encodedMessage}`;
}

/**
 * Basic email format validation.
 * 
 * @param email - Email address to validate
 * @returns true if format appears valid, false otherwise
 * 
 * @example
 * validateEmail('user@example.com') // true
 * validateEmail('invalid') // false
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates that a required field has content.
 * 
 * @param value - Value to check
 * @returns true if value exists and is non-empty, false otherwise
 * 
 * @example
 * validateRequired('hello') // true
 * validateRequired('') // false
 * validateRequired(undefined) // false
 */
export function validateRequired(value: string | undefined | null): boolean {
  return Boolean(value && value.trim().length > 0);
}