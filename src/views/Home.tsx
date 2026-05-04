import { useState, useEffect, lazy, Suspense } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { localDb } from '@/lib/localDb';
import {
  useCustomerStats,
  useRecentChartData,
} from '@/hooks/useCustomerStats';
import { useAlerts, useOccasions } from '@/hooks/useAlerts';
import { generateWhatsAppLink } from '@/lib/validation';
import { chartTooltipStyles } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Settings,
  Users,
  ArrowRight,
  UserPlus,
  IndianRupee,
  RefreshCcw,
  AlertTriangle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import type {
  CustomerWithVisits,
  Action,
  Visit,
  CustomerPackage,
} from '../types';

const RechartsBarChart = lazy(() =>
  import('recharts').then((m) => ({ default: m.BarChart }))
);
const RechartsLineChart = lazy(() =>
  import('recharts').then((m) => ({ default: m.LineChart }))
);
const Bar = lazy(() => import('recharts').then((m) => ({ default: m.Bar })));
const Line = lazy(() => import('recharts').then((m) => ({ default: m.Line })));
const XAxis = lazy(() =>
  import('recharts').then((m) => ({ default: m.XAxis }))
);
const Tooltip = lazy(() =>
  import('recharts').then((m) => ({ default: m.Tooltip }))
);
const ResponsiveContainer = lazy(() =>
  import('recharts').then((m) => ({ default: m.ResponsiveContainer }))
);

interface CustomerData extends CustomerWithVisits {
  visits?: Visit[];
  occasionType?: string;
}

export default function Home() {
  const { profile } = useBusinessProfile();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [allActions, setAllActions] = useState<Action[]>([]);
  const [packages, setPackages] = useState<CustomerPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (profile?.id) {
        let typedCustomers: CustomerData[] = [];
        if (supabase) {
          const { data: customersData } = await supabase
            .from('customers')
            .select('*, visits(*), actions(*)')
            .eq('business_id', profile.id);

          typedCustomers = (customersData || []).map(
            (c) => ({
              ...c,
              visits: c.visits || [],
              tags: c.tags || [],
              notes: c.notes || '',
            })
          );
        } else {
          const localCustomers = await localDb.getCustomers(profile.id);
          typedCustomers = (localCustomers || []).map(
            (c: Record<string, unknown>) => ({
              ...c,
              visits: (c.visits as unknown[]) || [],
              tags: (c.tags as string[]) || [],
              notes: (c.notes as string) || '',
            })
          ) as CustomerData[];
        }
        setCustomers(typedCustomers);

        const dbActions = (await localDb.getActions(profile.id) as unknown as Action[]) || [];
        setAllActions(dbActions);

        if (supabase) {
          const { data: packagesData } = await supabase
            .from('customer_packages')
            .select('*')
            .eq('business_id', profile.id);
          setPackages(packagesData || []);
        }
      }
      setLoading(false);
    }
    fetchData();
  }, [profile]);

  const stats = useCustomerStats({ customers });
  const alerts = useAlerts({ customers, actions: allActions });
  const occasions = useOccasions(customers);
  const recentData = useRecentChartData(customers);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!profile || profile.isNew) {
    return (
      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        <div className="pt-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome to LokalOS
          </h1>
          <p className="text-muted-foreground mt-1">
            Let's set up your business profile to get started.
          </p>
        </div>
        <Card className="p-8 text-center space-y-6 bg-primary/5 border-primary/20 hover:shadow-lg transition-all duration-300">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Settings className="w-8 h-8 text-primary" />
          </div>
          <div>
            <p className="text-lg font-medium">Complete your business setup</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add your business name, contact info, and staff to get started.
            </p>
          </div>
          <Button
            onClick={() => navigate('/settings')}
            size="lg"
            className="hover:scale-105 active:scale-95 transition-all duration-200"
          >
            Go to Settings
          </Button>
        </Card>
      </div>
    );
  }

  const getWhatsAppMessage = (customer: CustomerData) => {
    const occasionType = customer.occasionType;
    const occasionLabel =
      occasionType === 'birthday' ? 'Birthday' : 'Anniversary';
    return `Happy ${occasionLabel} ${customer.name}!`;
  };

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto">
      <div className="pt-2 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {profile.business_name || 'Your Business'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Welcome back to your Overview.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/settings')}
          className="gap-2"
        >
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Settings</span>
        </Button>
      </div>

      {alerts.length > 0 && (
        <div className="space-y-3 mt-4">
          {alerts.map((alert, i) => (
            <Card
              key={i}
              className={`p-4 flex items-center justify-between border-l-4 ${
                alert.type === 'High'
                  ? 'border-l-destructive bg-destructive/5'
                  : alert.type === 'Medium'
                    ? 'border-l-amber-500 bg-amber-500/5'
                    : 'border-l-blue-500 bg-blue-500/5'
              } border-y-border border-r-border hover:shadow-md transition-all duration-200`}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle
                  className={`h-5 w-5 ${
                    alert.type === 'High'
                      ? 'text-destructive'
                      : alert.type === 'Medium'
                        ? 'text-amber-600'
                        : 'text-blue-600'
                  }`}
                />
                <span className="font-medium text-[15px]">{alert.message}</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(alert.route)}
              >
                {alert.action}
              </Button>
            </Card>
          ))}
        </div>
      )}

      {occasions.length > 0 && (
        <Card className="p-4 border-l-4 border-l-pink-500 bg-pink-500/5 mt-6 hover:shadow-md transition-all duration-200 cursor-pointer">
          <h3 className="font-semibold mb-2">Today's Occasions</h3>
          {occasions.map((c) => (
            <div key={c.id} className="flex justify-between items-center py-2">
              <span>
                {c.name} (
                {c.occasionType === 'birthday' ? 'Birthday' : 'Anniversary'})
              </span>
              <Button
                size="sm"
                className="hover:scale-105 active:scale-95 transition-all duration-200"
                onClick={() =>
                  window.open(
                    generateWhatsAppLink(c.phone, getWhatsAppMessage(c))
                  )
                }
              >
                WhatsApp
              </Button>
            </div>
          ))}
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        <Card
          className="p-4 flex flex-col gap-2 bg-primary/5 border-primary/20 hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer"
          onClick={() => navigate('/customers')}
        >
          <div className="flex items-center gap-2 text-primary">
            <Users className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Users
            </span>
          </div>
          <p className="text-2xl font-bold">{stats.totalCustomers}</p>
        </Card>

        <Card className="p-4 flex flex-col gap-2 bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20 hover:shadow-md hover:border-emerald-500/30 transition-all duration-200 cursor-pointer">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <IndianRupee className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Revenue
            </span>
          </div>
          <p className="text-2xl font-bold">₹{stats.revenue}</p>
        </Card>

        <Card
          className="p-4 flex flex-col gap-2 bg-violet-500/5 dark:bg-violet-500/10 border-violet-500/20 hover:shadow-md hover:border-violet-500/30 transition-all duration-200 cursor-pointer"
          onClick={() => navigate('/follow-ups')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
              <RefreshCcw className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Returned
              </span>
            </div>
            {stats.recoveredRevenue > 0 && (
              <span className="text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 px-1.5 py-0.5 rounded font-bold">
                ₹{stats.recoveredRevenue} Rec.
              </span>
            )}
          </div>
          <p className="text-2xl font-bold">{stats.returningCustomers}</p>
        </Card>

        <Button
          variant="outline"
          className="h-auto flex flex-col justify-center items-center py-4 gap-2 hover:bg-primary/5 hover:text-primary hover:border-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
          onClick={() => navigate('/customers')}
        >
          <UserPlus className="h-6 w-6" />
          <span className="font-medium">Manage Customers</span>
        </Button>
      </div>

      <Suspense
        fallback={
          <div className="grid sm:grid-cols-2 gap-4 mt-8">
            <Skeleton className="h-[220px]" />
            <Skeleton className="h-[220px]" />
          </div>
        }
      >
        <div className="grid sm:grid-cols-2 gap-4 mt-8">
          <Card className="p-4 flex flex-col space-y-4 border-border">
            <h3 className="font-semibold text-sm text-foreground">
              Customers Added (Last 7 Days)
            </h3>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={recentData}>
                  <XAxis
                    dataKey="name"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <Tooltip
                    cursor={chartTooltipStyles.barCursor}
                  />
                  <Bar
                    dataKey="customers"
                    name="Customers"
                    fill="var(--primary)"
                    radius={[4, 4, 0, 0]}
                  />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-4 flex flex-col space-y-4 border-border">
            <h3 className="font-semibold text-sm text-foreground">
              Revenue (Last 7 Days)
            </h3>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={recentData}>
                  <XAxis
                    dataKey="name"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <Tooltip
                    cursor={chartTooltipStyles.lineCursor}
                  />
                  <Line
                    type="monotone"
                    name="Revenue (₹)"
                    dataKey="revenue"
                    stroke="var(--primary)"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </Suspense>

      <div className="grid grid-cols-1 mt-8">
        <Card className="p-6 flex flex-col justify-center space-y-4 bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
          <h3 className="font-semibold text-lg">Quick Actions</h3>
          <div className="space-y-2 max-w-sm">
            <Button
              variant="secondary"
              className="w-full justify-between hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              onClick={() => navigate('/customers')}
            >
              View All Customers <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-between hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              onClick={() => navigate('/settings')}
            >
              Edit Message Templates / View QR Code{' '}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="secondary"
              className={`w-full justify-between hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ${profile?.is_pro ? 'text-primary bg-primary/10 hover:bg-primary/20' : ''}`}
              onClick={() => navigate('/reports')}
            >
              {profile?.is_pro ? 'View Analytics' : 'Unlock Pro Reports'}{' '}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
