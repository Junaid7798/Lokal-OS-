import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useBusinessProfile } from '../hooks/useBusinessProfile';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { differenceInDays, format, subDays } from 'date-fns';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import { toast } from 'sonner';
import type { Customer, Visit, CustomerWithVisits } from '../types';

interface InactiveItem {
  customer: CustomerWithVisits;
  visit: Visit;
  daysSince: number;
}

export default function Inactive() {
  const { profile } = useBusinessProfile();
  const [inactiveLists, setInactiveLists] = useState<{
    [key: string]: InactiveItem[];
  }>({
    '30': [],
    '45': [],
    '60': [],
    '90': [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInactive() {
      if (!profile?.id) return;
      setLoading(true);
      // Fetch customers with visits joined
      const { data: customersVisits, error } = await supabase
        .from('customers')
        .select('*, visits(*)')
        .eq('business_id', profile.id);

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      const lists: { [key: string]: InactiveItem[] } = {
        '30': [],
        '45': [],
        '60': [],
        '90': [],
      };
      const now = new Date();

      customersVisits?.forEach((c: CustomerWithVisits) => {
        if (!c.visits || c.visits.length === 0) return;
        const latestVisit = [...c.visits].sort(
          (a, b) =>
            new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime()
        )[0];
        const daysSince = differenceInDays(
          now,
          new Date(latestVisit.visit_date)
        );

        const item = { customer: c, visit: latestVisit, daysSince };

        if (daysSince >= 90) lists['90'].push(item);
        else if (daysSince >= 60) lists['60'].push(item);
        else if (daysSince >= 45) lists['45'].push(item);
        else if (daysSince >= 30) lists['30'].push(item);
      });
      setInactiveLists(lists);
      setLoading(false);
    }
    loadInactive();
  }, [profile]);

  const handleAction = async (
    customer: CustomerWithVisits,
    action: 'sent' | 'returned' | 'skip'
  ) => {
    if (action === 'sent') {
      await supabase.from('message_events').insert({
        customer_id: customer.id,
        business_id: profile.id,
        event_type: 'comeback_message_sent',
        created_at: new Date().toISOString(),
      });
      toast.success('Marked as sent!');
    } else if (action === 'returned') {
      const billValue = prompt(
        'Enter bill value (leave empty to use average):'
      );
      const isAfterFollowup = confirm(
        'Did this return happen after a follow-up?'
      );

      // logic for returned
      await supabase.from('returned_customers').insert({
        customer_id: customer.id,
        business_id: profile.id,
        returned_at: new Date().toISOString(),
        after_followup: isAfterFollowup,
        bill_value: billValue ? parseFloat(billValue) : null,
      });
      toast.success('Marked as returned!');
    } else if (action === 'skip') {
      toast.success('Skipped');
    }
  };

  const waLink = (customer: CustomerWithVisits) =>
    `https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${customer.name}, it's been a while! We miss you at ${profile?.business_name}. Book your next appointment with us to get a special discount.`)}`;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-5xl mx-auto pb-24">
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Inactive Customers</p>
          <p className="text-2xl font-bold">12</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Recovery Value</p>
          <p className="text-2xl font-bold">$1,200</p>
        </Card>
      </div>

      <Tabs defaultValue="30" className="w-full">
        <TabsList className="grid w-full grid-cols-4 rounded-xl mb-4 bg-muted/50 p-1">
          <TabsTrigger value="30">30d</TabsTrigger>
          <TabsTrigger value="45">45d</TabsTrigger>
          <TabsTrigger value="60">60d</TabsTrigger>
          <TabsTrigger value="90">90d+</TabsTrigger>
        </TabsList>

        {['30', '45', '60', '90'].map((interval) => (
          <TabsContent key={interval} value={interval} className="mt-0">
            {loading ? <p>Loading...</p> : null}
            {!loading && inactiveLists[interval].length === 0 && (
              <div className="text-center py-12 bg-card rounded-xl border">
                <p>No inactive customers in this bucket.</p>
              </div>
            )}
            {!loading && inactiveLists[interval].length > 0 && (
              <div className="grid sm:grid-cols-2 gap-3 mt-4">
                {inactiveLists[interval].map((t: InactiveItem) => (
                  <Card key={t.customer.id} className="p-4 flex flex-col gap-2">
                    <p className="font-semibold">{t.customer.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Last visited:{' '}
                      {format(new Date(t.visit.visit_date), 'MMM d')} (
                      {t.daysSince} days ago)
                    </p>
                    <div className="flex gap-2">
                      <a
                          href={waLink(t.customer)}
                          target="_blank"
                          onClick={() => handleAction(t.customer, 'sent')}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3"
                        >
                          Send Comeback
                        </a>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(t.customer, 'returned')}
                      >
                        Returned
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAction(t.customer, 'skip')}
                      >
                        Skip
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
