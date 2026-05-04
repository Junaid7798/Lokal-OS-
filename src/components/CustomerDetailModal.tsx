import { useState, useEffect } from 'react';
import { localDb } from '@/lib/localDb';
import { logAction } from '@/lib/auditLogger';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { supabase } from '@/lib/supabaseClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Phone, Edit2, X, CalendarPlus } from 'lucide-react';
import { format } from 'date-fns';
import type { CustomerWithVisits, Visit, Action } from '../types';

interface CustomerDetailModalProps {
  customer: CustomerWithVisits;
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomerDetailModal({
  customer,
  isOpen,
  onClose,
}: CustomerDetailModalProps) {
  const { profile } = useBusinessProfile();
  const [isAddingVisit, setIsAddingVisit] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(customer.name);
  const [editPhone, setEditPhone] = useState(customer.phone);
  const [serviceCategory, setServiceCategory] = useState('');
  const [billValue, setBillValue] = useState('');
  const [visitDate, setVisitDate] = useState(
    () => new Date().toISOString().split('T')[0]
  );
  const [isRecovered, setIsRecovered] = useState(false);

  useEffect(() => {
    async function loadActions() {
      if (isOpen) {
        setEditName(customer.name);
        setEditPhone(customer.phone);
      }
      if (isOpen && profile?.id) {
        const actions = (await localDb.getActions(profile.id) as unknown as Action[]).filter(
          (a) => a.customer_id === customer.id
        );
        const comebackActions = actions.filter(
          (a) => a.action_type === 'comeback'
        );
        if (comebackActions.length > 0 && !customer.is_returned) {
          setIsRecovered(true);
        } else {
          setIsRecovered(false);
        }
      }
    }
    loadActions();
  }, [
    isOpen,
    customer.id,
    profile?.id,
    customer.is_returned,
    customer.name,
    customer.phone,
  ]);

  async function handleAddVisit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile?.id) return;
    const bill = parseFloat(billValue) || 0;

    await localDb.addVisit(profile.id, {
      business_id: profile.id,
      customer_id: customer.id,
      service_category: serviceCategory,
      bill_value: bill,
      visit_date: new Date(visitDate).toISOString(),
    });

    // Trigger automation jobs for visit_completed trigger
    try {
      const sequences = await localDb.getAutomationSequences(profile.id) as Array<{
        id: string;
        trigger_type: string;
        is_active: boolean;
        steps?: Array<{ id: string; delay_days: number }>;
      }>;
      const visitTriggerSeqs = sequences.filter(
        (s) => s.trigger_type === 'visit_completed' && s.is_active
      );
      for (const seq of visitTriggerSeqs) {
        for (const step of seq.steps || []) {
          const nextStepAt = new Date();
          nextStepAt.setDate(nextStepAt.getDate() + step.delay_days);
          await localDb.createAutomationJob({
            business_id: profile.id,
            sequence_id: seq.id,
            customer_id: customer.id,
            next_step_at: nextStepAt.toISOString(),
          });
        }
      }
    } catch (err) {
      console.warn('Automation trigger failed:', err);
    }

    if (supabase) {
      try {
        const { error } = await supabase.from('visits').insert({
          business_id: profile.id,
          customer_id: customer.id,
          service_category: serviceCategory,
          bill_value: bill,
          visit_date: new Date(visitDate).toISOString(),
        });
        if (error) console.warn('Visit sync failed:', error);
      } catch (err) {
        console.warn('Visit sync failed:', err);
      }
    }

    await logAction({
      business_id: profile.id,
      actor_type: 'owner',
      actor_name: localStorage.getItem('deskTracker_activeStaff') || 'Owner',
      action: 'visit_added',
      entity_type: 'visit',
      entity_id: customer.id,
      metadata: { service_category: serviceCategory, bill },
    });

    if (isRecovered || customer.is_returned) {
      const newRevenue = (customer.revenue_recovered || 0) + bill;
      localDb.updateCustomer(profile.id, customer.id, {
        is_returned: true,
        revenue_recovered: newRevenue,
      });
      if (supabase) {
        const localId = customer.id;
        const { data: existing } = await supabase
          .from('customers')
          .select('id')
          .eq('business_id', profile.id)
          .or(`id.eq.${localId},local_id.eq.${localId}`)
          .maybeSingle();
        if (existing) {
          try {
            const { error } = await supabase
              .from('customers')
              .update({ is_returned: true, revenue_recovered: newRevenue })
              .eq('id', existing.id);
            if (error) console.warn('Customer update sync failed:', error);
          } catch (err) {
            console.warn('Customer update sync failed:', err);
          }
        }
      }
    }

    toast.success('Visit logged!');
    setIsAddingVisit(false);
    setIsRecovered(false);
    onClose();
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile?.id) return;

    localDb.updateCustomer(profile.id, customer.id, {
      name: editName,
      phone: editPhone,
    });

    if (supabase) {
      const localId = customer.id;
      const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .eq('business_id', profile.id)
        .or(`id.eq.${localId},local_id.eq.${localId}`)
        .maybeSingle();
      if (existing) {
        try {
          const { error } = await supabase
            .from('customers')
            .update({ name: editName, phone: editPhone })
            .eq('id', existing.id);
          if (error) console.warn('Customer edit sync failed:', error);
        } catch (err) {
          console.warn('Customer edit sync failed:', err);
        }
      }
    }

    await logAction({
      business_id: profile.id,
      actor_type: 'owner',
      actor_name: localStorage.getItem('deskTracker_activeStaff') || 'Owner',
      action: 'customer_updated',
      entity_type: 'customer',
      entity_id: customer.id,
    });

    toast.success('Customer updated successfully');
    setIsEditing(false);
    onClose();
  }

  const waLink = (text: string) =>
    `https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;

  const logAndOpen = async (action: string, text: string) => {
    if (!profile?.id) return;
    await logAction({
      business_id: profile.id,
      actor_type: 'owner',
      actor_name: localStorage.getItem('deskTracker_activeStaff') || 'Owner',
      action: 'message_sent',
      entity_type: 'customer',
      entity_id: customer.id,
      metadata: { message_type: action },
    });
    window.open(waLink(text), '_blank');
  };

  const msgThankYou = `Hi ${customer.name}, ${profile?.msg_thank_you || 'thank you for visiting today!'}`;
  const msgRequestReview =
    `Hi ${customer.name}, ${profile?.msg_request_review || "we'd love it if you could leave us a review here:"} ${profile?.google_review_link || ''}`.trim();
  const msgFollowUp = `Hi ${customer.name}, ${profile?.msg_follow_up || 'just a quick follow-up to see how you are doing after your recent service.'}`;
  const msgComeback = `Hi ${customer.name}, ${profile?.msg_comeback || "it's been a while! We'd love to see you again."}`;
  const msgReferral = `Hi ${customer.name}, ${profile?.msg_referral || 'loved our service? Refer a friend and you both get a discount on your next visit!'}`;

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="fixed inset-0 sm:inset-auto sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] w-full h-full sm:h-auto sm:max-w-md sm:max-h-[90vh] sm:rounded-2xl p-0 gap-0 flex flex-col bg-background sm:border data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 sm:zoom-in-95 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] duration-200">
        <div className="p-4 sm:p-5 border-b border-border bg-card shrink-0 flex items-center justify-between z-10 sticky top-0 shadow-sm sm:shadow-none">
          <div className="pr-2 flex-1">
            {isEditing ? (
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Edit Customer
              </h2>
            ) : (
              <>
                <DialogTitle className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
                  {customer.name}
                  {customer.is_returned && (
                    <span className="bg-emerald-500/10 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider dark:bg-emerald-500/20 dark:text-emerald-400">
                      Returned
                    </span>
                  )}
                </DialogTitle>
                <p className="text-[13px] font-medium text-muted-foreground mt-0.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  {customer.phone}
                </p>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!isEditing && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
                className="rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 pb-24 bg-muted/10">
          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editName">Customer Name</Label>
                <Input
                  id="editName"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPhone">Phone Number</Label>
                <Input
                  id="editPhone"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          ) : (
            <>
              {customer.is_returned && customer.revenue_recovered > 0 && (
                <div className="flex items-center justify-between bg-emerald-500/10 px-4 py-3.5 rounded-2xl border border-emerald-500/20 shadow-sm">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest">
                    Recovered Revenue
                  </span>
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-300 text-xl tracking-tight">
                    ₹{customer.revenue_recovered}
                  </span>
                </div>
              )}

              <div className="space-y-3">
                <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                  Quick Message Actions
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  <Button
                    variant="outline"
                    className="text-[13px] font-medium bg-card justify-start h-11 shadow-sm rounded-xl border-border hover:border-primary/50 text-foreground"
                    onClick={() => logAndOpen('thank_you', msgThankYou)}
                  >
                    <span className="truncate w-full text-left">Thank You</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="text-[13px] font-medium bg-card justify-start h-11 shadow-sm rounded-xl border-border hover:border-primary/50 text-foreground"
                    onClick={() =>
                      logAndOpen('review_request', msgRequestReview)
                    }
                  >
                    <span className="truncate w-full text-left">
                      Request Review
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    className="text-[13px] font-medium bg-card justify-start h-11 shadow-sm rounded-xl border-border hover:border-primary/50 text-foreground"
                    onClick={() => logAndOpen('follow_up', msgFollowUp)}
                  >
                    <span className="truncate w-full text-left">Follow-up</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="text-[13px] font-medium bg-card justify-start h-11 shadow-sm rounded-xl border-border focus:bg-emerald-500/10 focus:text-emerald-700 focus:border-emerald-500/30 hover:border-primary/50 text-foreground"
                    onClick={() => logAndOpen('comeback', msgComeback)}
                  >
                    <span className="truncate w-full text-left">Comeback</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="text-[13px] font-medium bg-card justify-start h-11 shadow-sm rounded-xl border-border hover:border-primary/50 col-span-2 text-foreground"
                    onClick={() => logAndOpen('request_referral', msgReferral)}
                  >
                    <span className="truncate w-full text-center">
                      Request Referral
                    </span>
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                    Visit History
                  </h3>
                  {!isAddingVisit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAddingVisit(true)}
                      className="h-7 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10 -mr-2"
                    >
                      <CalendarPlus className="h-3.5 w-3.5 mr-1.5" /> Log Visit
                    </Button>
                  )}
                </div>

                {isAddingVisit && (
                  <form
                    onSubmit={handleAddVisit}
                    className="bg-card p-4 rounded-2xl shadow-sm border space-y-4 animate-in fade-in zoom-in-95 duration-200"
                  >
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">
                        Service Category
                      </Label>
                      <Select
                        value={serviceCategory}
                        onValueChange={setServiceCategory}
                        required
                      >
                        <SelectTrigger className="h-10 rounded-xl">
                          <SelectValue placeholder="Select a service category" />
                        </SelectTrigger>
                        <SelectContent>
                          {(
                            (profile?.service_categories as string) ||
                            'Haircut, Facial, Massage, Styling, Coloring'
                          )
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean)
                            .map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Date</Label>
                        <Input
                          type="date"
                          required
                          value={visitDate}
                          onChange={(e) => setVisitDate(e.target.value)}
                          className="h-10 rounded-xl"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">
                          Bill Value (₹)
                        </Label>
                        <Input
                          type="number"
                          placeholder="499"
                          value={billValue}
                          onChange={(e) => setBillValue(e.target.value)}
                          className="h-10 rounded-xl"
                        />
                      </div>
                    </div>
                    {!customer.is_returned && (
                      <div className="flex items-center space-x-2 pt-2 border-t mt-3">
                        <input
                          type="checkbox"
                          id="recovered"
                          className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4"
                          checked={isRecovered}
                          onChange={(e) => setIsRecovered(e.target.checked)}
                        />
                        <label
                          htmlFor="recovered"
                          className="text-xs font-medium text-muted-foreground cursor-pointer select-none"
                        >
                          Returning from comeback message (Records Revenue)
                        </label>
                      </div>
                    )}
                    {customer.is_returned && (
                      <div className="pt-2 border-t mt-3">
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold tracking-wide">
                          This visit will automatically add to Recovered
                          Revenue.
                        </p>
                      </div>
                    )}
                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-9 rounded-xl text-xs font-medium"
                        onClick={() => setIsAddingVisit(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="h-9 rounded-xl text-xs font-semibold"
                      >
                        Save Visit
                      </Button>
                    </div>
                  </form>
                )}

                <div className="space-y-2.5">
                  {customer.visits?.length === 0 && (
                    <div className="text-center py-6 bg-card border border-dashed rounded-2xl">
                      <p className="text-xs text-muted-foreground font-medium">
                        No visits logged yet.
                      </p>
                    </div>
                  )}
                  {customer.visits?.map((v: Visit) => (
                    <div
                      key={v.id}
                      className="p-3.5 bg-card rounded-2xl border shadow-sm flex flex-col gap-1"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-sm">
                          {v.service_category || 'General Visit'}
                        </span>
                        {v.bill_value > 0 && (
                          <span className="font-bold text-sm text-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                            ₹{v.bill_value}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {format(new Date(v.visit_date), 'MMM d, yyyy')}
                        {v.staff_name && (
                          <span className="opacity-75">
                            {' '}
                            • by {v.staff_name}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}