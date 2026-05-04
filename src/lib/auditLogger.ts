import { supabase } from './supabaseClient';

export async function logAction(params: {
  business_id: string;
  actor_type: 'owner' | 'staff' | 'agency';
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
}) {
  if (!supabase) {
    console.warn('Supabase not available, skipping audit log');
    return;
  }

  try {
    const { error } = await supabase.from('audit_logs').insert([
      {
        business_id: params.business_id,
        actor_type: params.actor_type,
        actor_name: params.actor_name,
        action: params.action,
        entity_type: params.entity_type,
        entity_id: params.entity_id,
        metadata_json: params.metadata,
      },
    ]);
    if (error) {
      console.warn('Audit log insert failed:', error.message);
    }
  } catch (err) {
    console.error('Failed to log action:', err);
  }
}
