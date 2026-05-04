import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import {
  Customer,
  Visit,
  ServiceFollowupRule,
  CustomerPackage,
} from '../types';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [rules, setRules] = useState<ServiceFollowupRule[]>([]);
  const [packages, setPackages] = useState<CustomerPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddVisit, setShowAddVisit] = useState(false);
  type VisitFormData = {
    service_category: string;
    visit_date: string;
    bill_value: string;
    payment_status: 'Paid' | 'Pending' | 'Partial' | 'Not Applicable';
    payment_method: 'Cash' | 'UPI' | 'Card' | 'Other';
    staff_name: string;
    notes: string;
  };

  const [newVisit, setNewVisit] = useState<VisitFormData>({
    service_category: '',
    visit_date: new Date().toISOString().split('T')[0],
    bill_value: '',
    payment_status: 'Pending',
    payment_method: 'Cash',
    staff_name: '',
    notes: '',
  });

  async function updateReviewStatus(status: Customer['review_status']) {
    if (!customer) return;
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
  }

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      setLoading(true);
      try {
        // Fetch Customer
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('*')
          .eq('id', id)
          .single();
        if (customerError) throw customerError;
        setCustomer(customerData);

        // Fetch Visits
        const { data: visitsData, error: visitsError } = await supabase
          .from('visits')
          .select('*')
          .eq('customer_id', id)
          .order('visit_date', { ascending: false });
        if (visitsError) throw visitsError;
        setVisits(visitsData || []);

        // Fetch Followup Rules
        const { data: rulesData, error: rulesError } = await supabase
          .from('service_followup_rules')
          .select('*')
          .eq('business_id', customerData.business_id);
        if (rulesError) throw rulesError;
        setRules(rulesData || []);

        // Fetch Packages
        const { data: packagesData, error: packagesError } = await supabase
          .from('customer_packages')
          .select('*')
          .eq('customer_id', id);
        if (packagesError) throw packagesError;
        setPackages(packagesData || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  async function handleAddVisit(e: React.FormEvent) {
    e.preventDefault();
    if (!customer) return;

    try {
      const { data: visit, error: visitError } = await supabase
        .from('visits')
        .insert([
          {
            customer_id: customer.id,
            business_id: customer.business_id,
            service_category: newVisit.service_category,
            visit_date: newVisit.visit_date,
            bill_value: newVisit.bill_value
              ? parseFloat(newVisit.bill_value)
              : null,
            payment_status: newVisit.payment_status,
            payment_method: newVisit.payment_method,
            staff_name: newVisit.staff_name,
            notes: newVisit.notes,
          },
        ])
        .select()
        .single();
      if (visitError) throw visitError;

      // Auto create follow-up
      const rule = rules.find(
        (r) => r.service_category === newVisit.service_category
      );
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
    } catch (err: any) {
      alert(err.message);
    }
  }

  const useSession = async (pkg: CustomerPackage) => {
    if (pkg.used_sessions >= pkg.total_sessions) return;
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
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!customer) return <div>Customer not found</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{customer.name}</h1>
      <p className="text-muted-foreground">{customer.phone}</p>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded shadow-sm">
          <p className="text-sm text-muted-foreground">Birthday</p>
          <p className="font-medium">{customer.birthday_date || 'N/A'}</p>
        </div>
        <div className="bg-card p-4 rounded shadow-sm">
          <p className="text-sm text-muted-foreground">Anniversary</p>
          <p className="font-medium">{customer.anniversary_date || 'N/A'}</p>
        </div>
        <div className="bg-card p-4 rounded shadow-sm">
          <p className="text-sm text-muted-foreground">Source</p>
          <p className="font-medium">{customer.source}</p>
        </div>
        <div className="bg-card p-4 rounded shadow-sm">
          <p className="text-sm text-muted-foreground">Consent</p>
          <p className="font-medium">{customer.consent_status}</p>
        </div>
        <div className="bg-card p-4 rounded shadow-sm">
          <p className="text-sm text-muted-foreground">Opt-out</p>
          <p className="font-medium">{customer.opt_out ? 'Yes' : 'No'}</p>
        </div>
        <div className="bg-card p-4 rounded shadow-sm">
          <p className="text-sm text-muted-foreground">Tags</p>
          <p className="font-medium">{customer.tags.join(', ')}</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold">Revenue Summary</h2>
        <div className="grid grid-cols-3 gap-4 mt-2">
          <div className="p-4 border rounded shadow-sm">
            <p className="text-sm">Total Recorded</p>
            <p className="font-bold">
              ₹{visits.reduce((sum, v) => sum + (v.bill_value || 0), 0)}
            </p>
          </div>
          <div className="p-4 border rounded shadow-sm">
            <p className="text-sm">Avg Visit Value</p>
            <p className="font-bold">
              ₹
              {visits.length
                ? (
                    visits.reduce((sum, v) => sum + (v.bill_value || 0), 0) /
                    visits.length
                  ).toFixed(2)
                : 0}
            </p>
          </div>
          <div className="p-4 border rounded shadow-sm">
            <p className="text-sm">Last Bill</p>
            <p className="font-bold">
              ₹{visits.length ? visits[0].bill_value || 0 : 0}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold">Packages</h2>
        <div className="grid gap-2 mt-2">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="p-4 border rounded shadow-sm flex justify-between items-center"
            >
              <div>
                <p className="font-medium">{pkg.package_name}</p>
                <p className="text-sm">
                  Sessions: {pkg.used_sessions} / {pkg.total_sessions}{' '}
                  (Remaining: {pkg.total_sessions - pkg.used_sessions})
                </p>
                <p className="text-sm">Expires: {pkg.expiry_date || 'N/A'}</p>
              </div>
              <Button size="sm" onClick={() => useSession(pkg)}>
                Use Session
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold">Review Status</h2>
        <div className="flex gap-2 mt-2">
          <Button onClick={() => updateReviewStatus('requested')}>
            Request Review
          </Button>
          <Button
            onClick={() => updateReviewStatus('reviewed')}
            variant="outline"
          >
            Mark Reviewed
          </Button>
          <Button onClick={() => updateReviewStatus('skipped')} variant="ghost">
            Skip
          </Button>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Visit History</h2>
          <button
            onClick={() => setShowAddVisit(!showAddVisit)}
            className="bg-primary text-white p-2 rounded"
          >
            Add Visit
          </button>
        </div>

        {showAddVisit && (
          <form
            onSubmit={handleAddVisit}
            className="mt-4 p-4 border rounded shadow-sm space-y-4"
          >
            <input
              type="text"
              placeholder="Service/Category"
              value={newVisit.service_category}
              onChange={(e) =>
                setNewVisit({ ...newVisit, service_category: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
            <input
              type="date"
              value={newVisit.visit_date}
              onChange={(e) =>
                setNewVisit({ ...newVisit, visit_date: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
            <input
              type="number"
              placeholder="Bill Value (optional)"
              value={newVisit.bill_value}
              onChange={(e) =>
                setNewVisit({ ...newVisit, bill_value: e.target.value })
              }
              className="w-full p-2 border rounded"
            />
            <select
              value={newVisit.payment_status}
              onChange={(e) =>
                setNewVisit({
                  ...newVisit,
                  payment_status: e.target.value as 'Paid' | 'Pending' | 'Partial' | 'Not Applicable',
                })
              }
              className="w-full p-2 border rounded"
            >
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Partial">Partial</option>
              <option value="Not Applicable">Not Applicable</option>
            </select>
            <select
              value={newVisit.payment_method}
              onChange={(e) =>
                setNewVisit({
                  ...newVisit,
                  payment_method: e.target.value as 'Cash' | 'UPI' | 'Card' | 'Other',
                })
              }
              className="w-full p-2 border rounded"
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="Other">Other</option>
            </select>
            <input
              type="text"
              placeholder="Staff Name"
              value={newVisit.staff_name}
              onChange={(e) =>
                setNewVisit({ ...newVisit, staff_name: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
            <textarea
              placeholder="Note (Do not include sensitive info)"
              value={newVisit.notes}
              onChange={(e) =>
                setNewVisit({ ...newVisit, notes: e.target.value })
              }
              className="w-full p-2 border rounded"
            />
            <button
              type="submit"
              className="bg-primary text-white p-2 rounded w-full"
            >
              Save Visit
            </button>
          </form>
        )}

        <div className="mt-4 space-y-2">
          {visits.map((visit) => (
            <div key={visit.id} className="p-4 border rounded shadow-sm">
              <p className="font-medium">{visit.service_category}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(visit.visit_date).toLocaleDateString()}
              </p>
              {visit.bill_value && (
                <p className="text-sm">Value: {visit.bill_value}</p>
              )}
            </div>
          ))}
          {visits.length === 0 && (
            <p className="text-muted-foreground">No visits yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
