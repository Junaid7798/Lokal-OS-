import { useState, useEffect } from 'react';
import { localDb } from '@/lib/localDb';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { differenceInDays } from 'date-fns';
import { logAction } from '@/lib/actionLogger';
import type { CustomerWithVisits, Visit, Action } from '../types';

interface FollowUpTask {
  customer: CustomerWithVisits;
  visit: Visit;
  status: 'Completed' | 'Due Today' | 'Overdue';
  daysSince: number;
}

export default function FollowUps() {
  const { profile } = useBusinessProfile();
  const [tasks, setTasks] = useState<FollowUpTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) loadTasks();
  }, [profile]);

  async function loadTasks() {
    setLoading(true);
    const customers = await localDb.getCustomers(profile.id);
    const allActions = await localDb.getActions(profile.id) as unknown as Action[];

    if (customers) {
      const parsedTasks: FollowUpTask[] = [];
      customers.forEach((c: CustomerWithVisits) => {
        if (!c.visits || c.visits.length === 0) return;
        const latestVisit = [...c.visits].sort(
          (a, b) =>
            new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime()
        )[0];

        // Find if any follow_up action was performed on or after the latest visit date
        const hasFollowUp = allActions.some(
          (a: Action) =>
            a.customer_id === c.id &&
            a.action_type === 'follow_up' &&
            new Date(a.created_at) >= new Date(latestVisit.visit_date)
        );

        const daysSince = differenceInDays(
          new Date(),
          new Date(latestVisit.visit_date)
        );

        // We track customers who visited 2-7 days ago for follow-ups
        // If they have been followed up, we show them as completed regardless
        if (hasFollowUp && daysSince <= 7) {
          parsedTasks.push({
            customer: c,
            visit: latestVisit,
            status: 'Completed',
            daysSince,
          });
        } else if (daysSince === 2) {
          parsedTasks.push({
            customer: c,
            visit: latestVisit,
            status: 'Due Today',
            daysSince,
          });
        } else if (daysSince > 2 && daysSince <= 7) {
          parsedTasks.push({
            customer: c,
            visit: latestVisit,
            status: 'Overdue',
            daysSince,
          });
        }
      });
      // Sort tasks: Due Today first, then Overdue, then Completed
      parsedTasks.sort((a, b) => {
        if (a.status === 'Completed' && b.status !== 'Completed') return 1;
        if (b.status === 'Completed' && a.status !== 'Completed') return -1;
        if (a.status === 'Due Today' && b.status !== 'Due Today') return -1;
        if (b.status === 'Due Today' && a.status !== 'Due Today') return 1;
        return b.daysSince - a.daysSince;
      });
      setTasks(parsedTasks);
    }
    setLoading(false);
  }

  const waLink = (customer: CustomerWithVisits) =>
    `https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${customer.name}, just a quick follow-up to see how you are doing after your recent service at ${profile?.business_name}.`)}`;

  const logAndOpen = async (customer: CustomerWithVisits) => {
    if (!profile?.id) return;
    await logAction(profile.id, customer.id, 'follow_up');
    window.open(waLink(customer), '_blank');
    loadTasks();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-5xl mx-auto pb-24">
      <div className="bg-card p-4 sm:p-5 rounded-2xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Follow-ups
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customers who visited 2-7 days ago.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Loading follow-ups...
        </p>
      ) : null}
      {!loading && tasks.length === 0 && (
        <div className="text-center py-12 bg-card rounded-xl border shadow-sm">
          <p className="font-medium text-lg">No pending follow-ups</p>
          <p className="text-sm text-muted-foreground mt-1">
            You're all caught up!
          </p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-4">
        {tasks.map((t, i) => (
          <Card
            key={i}
            className="p-4 sm:p-5 flex flex-col gap-4 rounded-2xl shadow-sm border bg-card"
          >
            <div className="flex justify-between items-start">
              <div className="min-w-0 pr-2">
                <p className="font-semibold text-base text-foreground truncate">
                  {t.customer.name}
                </p>
                <p className="text-[13px] text-muted-foreground mt-0.5 truncate">
                  <span className="font-medium">
                    {t.visit.service_category}
                  </span>{' '}
                  • {t.daysSince} days ago
                </p>
              </div>
              <span
                className={`shrink-0 text-[10px] uppercase tracking-wider font-bold px-2 py-1 flex items-center justify-center rounded-md ${
                  t.status === 'Completed'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                    : t.status === 'Due Today'
                      ? 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                      : 'bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive'
                }`}
              >
                {t.status}
              </span>
            </div>
            {t.status !== 'Completed' && (
              <div className="mt-auto pt-2 border-t">
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full h-10 rounded-xl font-semibold"
                  onClick={() => logAndOpen(t.customer)}
                >
                  Send WhatsApp
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
