import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { Appointment, Customer } from '../types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

export default function Appointments() {
  const { profile } = useBusinessProfile();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [newAppointment, setNewAppointment] = useState({
    customer_id: '',
    appointment_date: '',
    appointment_time: '',
    service_category: '',
    staff_name: '',
    notes: '',
  });
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setNeedsSetup(true);
      return;
    }
    if (!profile?.id || !supabase) return;

    supabase
      .from('appointments')
      .select('*')
      .eq('business_id', profile.id)
      .then(({ data, error }) => {
        if (error) {
          toast.error('Failed to load appointments');
          return;
        }
        if (data) setAppointments(data);
      });
    supabase
      .from('customers')
      .select('*')
      .eq('business_id', profile.id)
      .then(({ data, error }) => {
        if (error) {
          toast.error('Failed to load customers');
          return;
        }
        if (data) setCustomers(data);
      });
  }, [profile]);

  const createAppointment = async () => {
    if (!supabase || !profile?.id) {
      toast.error('Database not connected');
      return;
    }
    const { error } = await supabase
      .from('appointments')
      .insert({ ...newAppointment, business_id: profile.id });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Appointment booked!');
    setNewAppointment({
      customer_id: '',
      appointment_date: '',
      appointment_time: '',
      service_category: '',
      staff_name: '',
      notes: '',
    });
  };

  const updateStatus = async (a: Appointment, status: Appointment['status']) => {
    if (!supabase) return;
    const { error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', a.id);
    if (error) {
      toast.error(error.message);
      return;
    }

    if (status === 'Completed') {
      await supabase.from('visits').insert({
        business_id: a.business_id,
        customer_id: a.customer_id,
        service_category: a.service_category,
        visit_date: a.appointment_date,
      });
    }

    if (status === 'No-Show') {
      await supabase.from('followup_tasks').insert({
        business_id: a.business_id,
        customer_id: a.customer_id,
        task_type: 'No-show Follow-up',
        due_date: new Date().toISOString().split('T')[0],
        status: 'pending',
      });
    }

    setAppointments(
      appointments.map((apt) =>
        apt.id === a.id ? { ...apt, status } : apt
      )
    );
  };

  const openWhatsApp = (phone: string | undefined, message: string) => {
    const digits = phone?.replace(/\D/g, '');
    if (!digits) {
      toast.error('Invalid phone number');
      return;
    }
    window.open(
      `https://wa.me/${digits}?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  if (needsSetup) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold">Appointments</h1>
        <Card className="p-6">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            <p className="font-medium">Supabase Not Connected</p>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Appointments require a Supabase database.
          </p>
          <Button className="mt-4" onClick={() => (window.location.href = '/setup')}>
            Set Up Supabase
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Appointments</h1>

      <Card>
        <CardHeader>
          <CardTitle>Book Appointment</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          <Select
            value={newAppointment.customer_id}
            onValueChange={(v) => setNewAppointment({ ...newAppointment, customer_id: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={newAppointment.appointment_date}
            onChange={(e) =>
              setNewAppointment({ ...newAppointment, appointment_date: e.target.value })
            }
          />
          <Input
            type="time"
            value={newAppointment.appointment_time}
            onChange={(e) =>
              setNewAppointment({ ...newAppointment, appointment_time: e.target.value })
            }
          />
          <Input
            placeholder="Service Category"
            value={newAppointment.service_category}
            onChange={(e) =>
              setNewAppointment({ ...newAppointment, service_category: e.target.value })
            }
          />
          <Button onClick={createAppointment}>Book</Button>
        </CardContent>
      </Card>

      <div className="grid gap-2">
        {appointments.map((a) => (
          <Card key={a.id} className="p-4 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold">
                  {a.appointment_date} {a.appointment_time}
                </p>
                <p className="text-sm text-muted-foreground">{a.status}</p>
              </div>
              <div className="flex gap-1">
                {(['Confirmed', 'Completed', 'No-Show'] as const).map((s) => (
                  <Button size="sm" key={s} onClick={() => updateStatus(a, s)}>
                    {s}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  openWhatsApp(
                    customers.find((c) => c.id === a.customer_id)?.phone,
                    `Confirming your appointment on ${a.appointment_date} at ${a.appointment_time}`
                  )
                }
              >
                Confirm
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  openWhatsApp(
                    customers.find((c) => c.id === a.customer_id)?.phone,
                    `Reminder: Your appointment is on ${a.appointment_date} at ${a.appointment_time}`
                  )
                }
              >
                Remind
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
