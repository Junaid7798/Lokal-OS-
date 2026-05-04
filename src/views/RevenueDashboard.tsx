import { useState, useEffect, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { Visit } from '../types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { IndianRupee, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function RevenueDashboard() {
  const { profile } = useBusinessProfile();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setNeedsSetup(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase || !profile?.id || needsSetup) return;
    async function fetchVisits() {
      setLoading(true);
      const { data, error } = await supabase
        .from('visits')
        .select('*')
        .eq('business_id', profile.id);
      if (error) {
        toast.error('Failed to load visits');
      } else if (data) {
        setVisits(data);
      }
      setLoading(false);
    }
    fetchVisits();
  }, [profile, needsSetup]);

  if (needsSetup) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold">Revenue Dashboard</h1>
        <Card className="p-6">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            <p className="font-medium">Supabase Not Connected</p>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Revenue tracking requires Supabase.
          </p>
          <Button className="mt-4" onClick={() => (window.location.href = '/setup')}>
            Set Up Supabase
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold">Revenue Dashboard</h1>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const stats = useMemo(() => {
    const total = visits.reduce((sum, v) => sum + (v.bill_value || 0), 0);
    const pending = visits
      .filter((v) => v.payment_status === 'Pending' || v.payment_status === 'Partial')
      .reduce((sum, v) => sum + (v.bill_value || 0), 0);

    const byService: Record<string, number> = {};
    visits.forEach((v) => {
      byService[v.service_category] = (byService[v.service_category] || 0) + (v.bill_value || 0);
    });

    return { total, pending, byService };
  }, [visits]);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Revenue Dashboard</h1>
      <p className="text-sm text-muted-foreground flex items-center gap-1">
        <AlertCircle className="h-4 w-4" /> Simple revenue tracking (not GST/invoicing).
      </p>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Recorded Revenue</p>
          <p className="text-2xl font-bold flex items-center gap-1">
            <IndianRupee className="h-5 w-5" /> {stats.total}
          </p>
        </Card>
        <Card className="p-4 text-amber-700 bg-amber-50">
          <p className="text-sm">Pending Amount</p>
          <p className="text-2xl font-bold flex items-center gap-1">
            <IndianRupee className="h-5 w-5" /> {stats.pending}
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue by Service</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.entries(stats.byService).length === 0 ? (
            <p className="text-muted-foreground">No data yet</p>
          ) : (
            Object.entries(stats.byService).map(([service, amount]) => (
              <div key={service} className="flex justify-between py-1">
                <span>{service}</span>
                <span className="font-bold">₹{amount}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { toast } from 'sonner';
