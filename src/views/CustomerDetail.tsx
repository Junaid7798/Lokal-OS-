import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import {
  Customer,
  Visit,
  ServiceFollowupRule,
  CustomerPackage,
} from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { safeDate } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

interface VisitFormData {
  service_category: string;
  visit_date: string;
  bill_value: string;
  payment_status: 'Paid' | 'Pending' | 'Partial' | 'Not Applicable';
  payment_method: 'Cash' | 'UPI' | 'Card' | 'Other';
  staff_name: string;
  notes: string;
}

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [rules, setRules] = useState<ServiceFollowupRule[]>([]);
  const [packages, setPackages] = useState<CustomerPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddVisit, setShowAddVisit] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  const [newVisit, setNewVisit] = useState<VisitFormData>({
    service_category: '',
    visit_date: new Date().toISOString().split('T')[0],
    bill_value: '',
    payment_status: 'Pending',
    payment_method: 'Cash',
    staff_name: '',
    notes: '',
  });

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setNeedsSetup(true);
      setLoading(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!id || needsSetup) return;
    if (!supabase) {
      setNeedsSetup(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();
      if (customerError) throw customerError;
      setCustomer(customerData);

      const [visitsRes, rulesRes, packagesRes] = await Promise.all([
        supabase.from('visits').select('*').eq('customer_id', id).order('visit_date', { ascending: false }),
        supabase.from('service_followup_rules').select('*').eq('business_id', customerData.business_id),
        supabase.from('customer_packages').select('*').eq('customer_id', id),
      ]);

      if (visitsRes.error) throw visitsRes.error;
      if (rulesRes.error) throw rulesRes.error;
      if (packagesRes.error) throw packagesRes.error;

      setVisits(visitsRes.data || []);
      setRules(rulesRes.data || []);
      setPackages(packagesRes.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load customer data';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [id, needsSetup]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateReviewStatus = useCallback(async (status: Customer['review_status']) => {
    if (!customer || !supabase) return;
    const { error } = await supabase
      .from('customers')
      .update({ review_status: status })
      .eq('id', customer.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setCustomer({ ...customer, review_status: status });
    toast.success(`Status updated to ${status}`);
  }, [customer]);

  const handleAddVisit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !supabase) return;

    try {
      const billValue = newVisit.bill_value ? parseFloat(newVisit.bill_value) : null;
      const { data: visit, error: visitError } = await supabase
        .from('visits')
        .insert([
          {
            customer_id: customer.id,
            business_id: customer.business_id,
            service_category: newVisit.service_category,
            visit_date: newVisit.visit_date,
            bill_value: billValue,
            payment_status: newVisit.payment_status,
            payment_method: newVisit.payment_method,
            staff_name: newVisit.staff_name,
            notes: newVisit.notes,
          },
        ])
        .select()
        .single();
      if (visitError) throw visitError;

      const rule = rules.find((r) => r.service_category === newVisit.service_category);
      const days = rule ? rule.default_followup_days : 30;
      const dueDate = new Date(newVisit.visit_date);
      dueDate.setDate(dueDate.getDate() + days);

      await supabase.from('followup_tasks').insert([
        {
          business_id: customer.business_id,
          customer_id: customer.id,
          visit_id: visit.id,
          task_type: `Follow-up for ${newVisit.service_category}`,
          due_date: dueDate.toISOString(),
          status: 'pending',
        },
      ]);

      setVisits([visit as Visit, ...visits]);
      setShowAddVisit(false);
      setNewVisit({
        service_category: '',
        visit_date: new Date().toISOString().split('T')[0],
        bill_value: '',
        payment_status: 'Pending',
        payment_method: 'Cash',
        staff_name: '',
        notes: '',
      });
      toast.success('Visit added!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add visit';
      toast.error(message);
    }
  }, [customer, newVisit, rules, visits, supabase]);

  const handleUseSession = useCallback(async (pkg: CustomerPackage) => {
    if (pkg.used_sessions >= pkg.total_sessions || !supabase) return;
    const { error } = await supabase
      .from('customer_packages')
      .update({ used_sessions: pkg.used_sessions + 1 })
      .eq('id', pkg.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPackages(
      packages.map((p) =>
        p.id === pkg.id ? { ...p, used_sessions: p.used_sessions + 1 } : p
      )
    );
    toast.success('Session used!');
  }, [packages, supabase]);

  if (needsSetup) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Customer Detail</h1>
        <Card className="p-6">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            <p className="font-medium">Supabase Not Connected</p>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Customer details require a Supabase database.
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
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="p-6 border-destructive">
          <p className="text-destructive font-medium">Error: {error}</p>
          <Button className="mt-4" variant="outline" onClick={fetchData}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="p-6">
          <p className="text-muted-foreground">Customer not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{customer.name}</h1>
        <p className="text-muted-foreground">{customer.phone}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Birthday</p>
            <p className="font-medium">{customer.birthday_date || 'N/A'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Anniversary</p>
            <p className="font-medium">{customer.anniversary_date || 'N/A'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Source</p>
            <p className="font-medium">{customer.source}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Consent</p>
            <p className="font-medium">{customer.consent_status}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Opt-out</p>
            <p className="font-medium">{customer.opt_out ? 'Yes' : 'No'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Tags</p>
            <p className="font-medium">{customer.tags.join(', ')}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Recorded</p>
              <p className="font-bold text-lg">
                ₹{visits.reduce((sum, v) => sum + (v.bill_value || 0), 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Visit Value</p>
              <p className="font-bold text-lg">
                ₹{visits.length
                  ? (visits.reduce((sum, v) => sum + (v.bill_value || 0), 0) / visits.length).toFixed(2)
                  : '0.00'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Bill</p>
              <p className="font-bold text-lg">
                ₹{visits.length ? visits[0].bill_value || 0 : 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Packages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {packages.length === 0 && (
            <p className="text-muted-foreground text-sm">No packages yet.</p>
          )}
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="p-4 border rounded-lg flex justify-between items-center"
            >
              <div>
                <p className="font-medium">{pkg.package_name}</p>
                <p className="text-sm text-muted-foreground">
                  Sessions: {pkg.used_sessions} / {pkg.total_sessions}{' '}
                  (Remaining: {pkg.total_sessions - pkg.used_sessions})
                </p>
                <p className="text-sm text-muted-foreground">
                  Expires: {pkg.expiry_date || 'N/A'}
                </p>
              </div>
              <Button size="sm" onClick={() => handleUseSession(pkg)}>
                Use Session
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Review Status</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button size="sm" onClick={() => updateReviewStatus('requested')}>
            Request Review
          </Button>
          <Button size="sm" variant="outline" onClick={() => updateReviewStatus('reviewed')}>
            Mark Reviewed
          </Button>
          <Button size="sm" variant="ghost" onClick={() => updateReviewStatus('skipped')}>
            Skip
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Visit History</CardTitle>
          <Button size="sm" onClick={() => setShowAddVisit(!showAddVisit)}>
            {showAddVisit ? 'Cancel' : 'Add Visit'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {showAddVisit && (
            <form onSubmit={handleAddVisit} className="space-y-3 border rounded-lg p-4">
              <div className="space-y-1.5">
                <Label>Service/Category</Label>
                <Input
                  value={newVisit.service_category}
                  onChange={(e) => setNewVisit({ ...newVisit, service_category: e.target.value })}
                  placeholder="e.g. Haircut"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newVisit.visit_date}
                    onChange={(e) => setNewVisit({ ...newVisit, visit_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Bill Value (₹)</Label>
                  <Input
                    type="number"
                    placeholder="Optional"
                    value={newVisit.bill_value}
                    onChange={(e) => setNewVisit({ ...newVisit, bill_value: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Payment Status</Label>
                  <Select
                    value={newVisit.payment_status}
                    onValueChange={(v) => setNewVisit({ ...newVisit, payment_status: v as VisitFormData['payment_status'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Partial">Partial</SelectItem>
                      <SelectItem value="Not Applicable">Not Applicable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Payment Method</Label>
                  <Select
                    value={newVisit.payment_method}
                    onValueChange={(v) => setNewVisit({ ...newVisit, payment_method: v as VisitFormData['payment_method'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Staff Name</Label>
                <Input
                  value={newVisit.staff_name}
                  onChange={(e) => setNewVisit({ ...newVisit, staff_name: e.target.value })}
                  placeholder="e.g. Owner"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Input
                  value={newVisit.notes}
                  onChange={(e) => setNewVisit({ ...newVisit, notes: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <Button type="submit" className="w-full">Save Visit</Button>
            </form>
          )}

          <div className="space-y-2">
            {visits.length === 0 && (
              <p className="text-muted-foreground text-sm">No visits yet.</p>
            )}
            {visits.map((visit) => (
              <div key={visit.id} className="p-3 border rounded-lg">
                <p className="font-medium">{visit.service_category}</p>
                <p className="text-sm text-muted-foreground">
                  {safeDate(visit.visit_date)?.toLocaleDateString() || 'Invalid date'}
                </p>
                {visit.bill_value ? (
                  <p className="text-sm">Value: ₹{visit.bill_value}</p>
                ) : null}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
