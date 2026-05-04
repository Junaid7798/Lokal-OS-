import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { differenceInDays, format } from 'date-fns';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { toast } from 'sonner';
import type { Visit, CustomerWithVisits } from '../types';
import { safeDate } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

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
  const [needsSetup, setNeedsSetup] = useState(false);

  // Modal state for "Returned" action
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnCustomer, setReturnCustomer] = useState<CustomerWithVisits | null>(null);
  const [returnBillValue, setReturnBillValue] = useState('');
  const [returnAfterFollowup, setReturnAfterFollowup] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setNeedsSetup(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function loadInactive() {
      if (!profile?.id || needsSetup) return;
      if (!supabase) {
        setNeedsSetup(true);
        setLoading(false);
        return;
      }
      setLoading(true);
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
        const sortedVisits = [...c.visits].sort(
          (a, b) =>
            (safeDate(b.visit_date)?.getTime() || 0) -
            (safeDate(a.visit_date)?.getTime() || 0)
        );
        const latestVisit = sortedVisits[0];
        const latestVisitDate = safeDate(latestVisit.visit_date);
        if (!latestVisitDate) return;

        const daysSince = differenceInDays(now, latestVisitDate);
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
  }, [profile, needsSetup]);

  const totalInactive =
    inactiveLists['30'].length +
    inactiveLists['45'].length +
    inactiveLists['60'].length +
    inactiveLists['90'].length;

  const recoveryValue = Object.values(inactiveLists)
    .flat()
    .reduce((sum, item) => sum + (item.visit.bill_value || profile?.average_bill_value || 0), 0);

  const handleActionSent = async (customer: CustomerWithVisits) => {
    if (!supabase || !profile?.id) {
      toast.error('Database not connected');
      return;
    }
    const { error } = await supabase.from('message_events').insert({
      customer_id: customer.id,
      business_id: profile.id,
      event_type: 'comeback_message_sent',
      created_at: new Date().toISOString(),
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Marked as sent!');
  };

  const openReturnModal = (customer: CustomerWithVisits) => {
    setReturnCustomer(customer);
    setReturnBillValue('');
    setReturnAfterFollowup(false);
    setReturnModalOpen(true);
  };

  const handleReturnConfirm = async () => {
    if (!supabase || !profile?.id || !returnCustomer) {
      toast.error('Database not connected');
      return;
    }
    const bill = returnBillValue ? parseFloat(returnBillValue) : null;
    if (returnBillValue && (isNaN(bill as number) || (bill as number) < 0)) {
      toast.error('Please enter a valid bill value');
      return;
    }

    const { error } = await supabase.from('returned_customers').insert({
      customer_id: returnCustomer.id,
      business_id: profile.id,
      returned_at: new Date().toISOString(),
      after_followup: returnAfterFollowup,
      bill_value: bill,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Marked as returned!');
    setReturnModalOpen(false);
    setReturnCustomer(null);
  };

  const [skipModalOpen, setSkipModalOpen] = useState(false);
  const [skipCustomer, setSkipCustomer] = useState<CustomerWithVisits | null>(null);

  const openSkipModal = (customer: CustomerWithVisits) => {
    setSkipCustomer(customer);
    setSkipModalOpen(true);
  };

  const handleSkipConfirm = () => {
    toast.success('Skipped');
    setSkipModalOpen(false);
    setSkipCustomer(null);
  };

  const waLink = (customer: CustomerWithVisits) => {
    const phone = customer.phone?.replace(/\D/g, '');
    if (!phone) return '#';
    const text = encodeURIComponent(
      `Hi ${customer.name}, it's been a while! We miss you at ${profile?.business_name}. Book your next appointment with us to get a special discount.`
    );
    return `https://wa.me/${phone}?text=${text}`;
  };

  if (needsSetup) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Inactive Customers</h1>
        <Card className="p-6">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            <p className="font-medium">Supabase Not Connected</p>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Inactive tracking requires a Supabase database.
          </p>
          <Button className="mt-4" onClick={() => (window.location.href = '/setup')}>
            Set Up Supabase
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-5xl mx-auto pb-24">
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Inactive Customers</p>
          <p className="text-2xl font-bold">{totalInactive}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Recovery Value</p>
          <p className="text-2xl font-bold">₹{recoveryValue}</p>
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
                      {format(safeDate(t.visit.visit_date) || new Date(), 'MMM d')} (
                      {t.daysSince} days ago)
                    </p>
                    <div className="flex gap-2">
                      <a
                        href={waLink(t.customer)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleActionSent(t.customer)}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3"
                      >
                        Send Comeback
                      </a>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openReturnModal(t.customer)}
                      >
                        Returned
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openSkipModal(t.customer)}>
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

      <Dialog open={returnModalOpen} onOpenChange={setReturnModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark as Returned</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="returnBill">Bill Value (optional)</Label>
              <Input
                id="returnBill"
                type="number"
                placeholder="Leave empty to use average"
                value={returnBillValue}
                onChange={(e) => setReturnBillValue(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="afterFollowup"
                className="rounded border-gray-300 text-primary w-5 h-5 cursor-pointer accent-primary"
                checked={returnAfterFollowup}
                onChange={(e) => setReturnAfterFollowup(e.target.checked)}
              />
              <Label htmlFor="afterFollowup" className="text-sm font-normal cursor-pointer">
                This return happened after a follow-up
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReturnConfirm}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={skipModalOpen} onOpenChange={setSkipModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Skip Customer</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to skip {skipCustomer?.name ?? 'this customer'}?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSkipModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSkipConfirm}>Confirm Skip</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
