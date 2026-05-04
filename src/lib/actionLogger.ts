import { localDb } from './localDb';

export async function logAction(
  business_id: string,
  customer_id: string,
  action_type: string
) {
  localDb.addAction(business_id, customer_id, action_type);
}
