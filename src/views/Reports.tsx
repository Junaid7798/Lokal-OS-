import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  subDays,
  isAfter,
} from 'date-fns';
import { Copy, Printer, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { LockedFeature } from '@/components/LockedFeature';
import { AISummary } from '@/components/AISummary';

interface ReportData {
  customersAdded: number;
  visits: number;
  reviewRequests: number;
  followupsCompleted: number;
  comebacks: number;
  returned: number;
  revRecovered: number;
  pendingFollowups: number;
  overdueFollowups: number;
}

export default function Reports() {
  const { profile } = useBusinessProfile();
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [dailyStats, setDailyStats] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setNeedsSetup(true);
      setLoading(false);
      return;
    }
    if (profile?.id && supabase) loadStats();
  }, [profile, selectedDate]);

  async function loadStats() {
    if (!supabase || !profile?.id) {
      setNeedsSetup(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    const start = startOfDay(new Date(selectedDate)).toISOString();
    const end = endOfDay(new Date(selectedDate)).toISOString();

    // Fetch data in parallel
    const [
      { count: customersAdded },
      { data: visits },
      { data: actions },
      { data: followups },
      { data: returned },
    ] = await Promise.all([
      supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', profile.id)
        .gte('created_at', start)
        .lte('created_at', end),
      supabase
        .from('visits')
        .select('*')
        .eq('business_id', profile.id)
        .gte('visit_date', selectedDate)
        .lte('visit_date', selectedDate),
      supabase
        .from('action_logs')
        .select('*')
        .eq('business_id', profile.id)
        .gte('created_at', start)
        .lte('created_at', end),
      supabase.from('followup_tasks').select('*').eq('business_id', profile.id),
      supabase
        .from('returned_customers')
        .select('*')
        .eq('business_id', profile.id)
        .gte('returned_at', start)
        .lte('returned_at', end),
    ]);

    const revRecovered =
      returned?.reduce(
        (acc, r) => acc + (r.bill_value || profile.average_bill_value || 0),
        0
      ) || 0;
    const pendingFollowups =
      followups?.filter(
        (f) =>
          f.status === 'pending' && !isAfter(new Date(), new Date(f.due_date))
      ).length || 0;
    const overdueFollowups =
      followups?.filter(
        (f) =>
          f.status === 'pending' && isAfter(new Date(), new Date(f.due_date))
      ).length || 0;

    setDailyStats({
      customersAdded: customersAdded || 0,
      visits: visits?.length || 0,
      reviewRequests:
        actions?.filter((a) => a.action_type === 'review_request').length || 0,
      followupsCompleted:
        actions?.filter((a) => a.action_type === 'follow_up').length || 0,
      comebacks:
        actions?.filter((a) => a.action_type === 'comeback').length || 0,
      returned: returned?.length || 0,
      revRecovered,
      pendingFollowups,
      overdueFollowups,
    });
    setLoading(false);
  }

  const copyReport = (data: ReportData, title: string) => {
    if (!data) return;
    const text = `${title}
Date: ${selectedDate}

Customers added: ${data.customersAdded}
Visits recorded: ${data.visits}
Review requests sent: ${data.reviewRequests}
Follow-ups completed: ${data.followupsCompleted}
Comeback messages sent: ${data.comebacks}
Customers returned: ${data.returned}
Estimated revenue recovered: ₹${data.revRecovered}
Pending follow-ups: ${data.pendingFollowups}
Overdue follow-ups: ${data.overdueFollowups}`;

    navigator.clipboard.writeText(text);
    toast.success('Report copied to clipboard!');
  };

  if (needsSetup) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Reports</h1>
        <Card className="p-6">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            <p className="font-medium">Supabase Not Connected</p>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Reports require a Supabase database.
          </p>
          <Button className="mt-4" onClick={() => (window.location.href = '/setup')}>
            Set Up Supabase
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">Daily Report</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Report</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Daily Report</h1>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(dailyStats).map(([key, value]) => (
              <Card key={key}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{value as number}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => copyReport(dailyStats, 'Daily Frontdesk Report')}
              className="flex-1"
            >
              <Copy className="mr-2 h-4 w-4" /> Copy Report
            </Button>
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="flex-1"
            >
              <Printer className="mr-2 h-4 w-4" /> Print Report
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="weekly" className="space-y-6 mt-6">
          <LockedFeature featureName="Weekly Report" requiredPlan="Pro">
            <div className="space-y-6">
              <div className="text-center p-10 border rounded-lg">
                Pro Weekly Report Coming Soon
              </div>
              <AISummary data={dailyStats || {}} />
            </div>
          </LockedFeature>
        </TabsContent>
      </Tabs>
    </div>
  );
}
