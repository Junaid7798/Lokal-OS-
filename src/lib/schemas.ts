import { z } from 'zod';

export const phoneSchema = z
  .string()
  .min(10, 'Phone must be at least 10 digits')
  .regex(/^[\d+]+$/, 'Phone must contain only numbers and +');

export const emailSchema = z
  .string()
  .email('Invalid email address')
  .optional()
  .or(z.literal(''));

export const customerSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  phone: phoneSchema,
  source: z.string().optional().default(''),
  note: z.string().optional().default(''),
  consent_status: z.boolean().default(false),
});

export const visitSchema = z.object({
  service_category: z
    .string()
    .min(1, 'Service category is required')
    .max(100, 'Service category too long'),
  bill_value: z
    .string()
    .or(z.number())
    .transform((val) => parseFloat(String(val)))
    .pipe(
      z
        .number()
        .min(0, 'Bill value must be positive')
        .max(1000000, 'Bill value too high')
    ),
  visit_date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  customer_id: z.string().min(1, 'Customer ID required'),
  business_id: z.string().min(1, 'Business ID required'),
});

export const campaignSchema = z.object({
  name: z
    .string()
    .min(1, 'Campaign name is required')
    .max(100, 'Campaign name too long'),
  message_template: z
    .string()
    .min(1, 'Message template is required')
    .max(5000, 'Message too long'),
  target_segment: z
    .enum(['all', 'new', 'returning', 'inactive', 'vip'])
    .default('all'),
  scheduled_at: z.string().optional(),
});

export const leadSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  phone: phoneSchema,
  source: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  status: z
    .enum(['new', 'contacted', 'qualified', 'converted', 'lost'])
    .default('new'),
});

export const appointmentSchema = z.object({
  customer_id: z.string().min(1, 'Customer is required'),
  customer_name: z.string().min(1, 'Customer name is required'),
  service: z.string().min(1, 'Service is required'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  time: z.string().min(1, 'Time is required'),
  notes: z.string().optional().default(''),
  status: z
    .enum(['scheduled', 'completed', 'cancelled', 'no_show'])
    .default('scheduled'),
});

export const profileSchema = z.object({
  business_name: z
    .string()
    .min(1, 'Business name is required')
    .max(100, 'Business name too long'),
  owner_name: z
    .string()
    .min(1, 'Owner name is required')
    .max(100, 'Owner name too long'),
  phone: phoneSchema.optional().or(z.literal('')),
  email: emailSchema,
  address: z.string().optional().default(''),
  customer_limit: z.number().min(1).max(100000).default(50),
});

export type CustomerInput = z.infer<typeof customerSchema>;
export type VisitInput = z.infer<typeof visitSchema>;
export type CampaignInput = z.infer<typeof campaignSchema>;
export type LeadInput = z.infer<typeof leadSchema>;
export type AppointmentInput = z.infer<typeof appointmentSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;

export function validateFormData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
} {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    errors[path] = issue.message;
  });

  return { success: false, errors };
}

export function getFieldError(
  errors: Record<string, string> | undefined,
  field: string
): string | undefined {
  if (!errors) return undefined;
  return errors[field] || errors[`root.${field}`];
}
