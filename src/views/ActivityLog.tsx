import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { format } from 'date-fns';

export default function ActivityLog() {
  const { profile } = useBusinessProfile();
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('audit_logs')
      .select('*')
      .eq('business_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to load activity logs');
          return;
        }
        setLogs(data || []);
      });
  }, [profile]);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Activity Log</h1>
      <Card>
        <CardHeader>
          <CardTitle>Recent Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="border-b pb-2 text-sm">
                <p>
                  <span className="font-semibold">{log.actor_name}</span>{' '}
                  {log.action}{' '}
                  <span className="font-semibold">{log.entity_type}</span>
                </p>
                <p className="text-muted-foreground text-xs">
                  {format(new Date(log.created_at), 'PPPp')}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
