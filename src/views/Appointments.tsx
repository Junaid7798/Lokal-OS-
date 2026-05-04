import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useBusinessProfile } from '../hooks/useBusinessProfile';
import { Appointment, Customer } from '../types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

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

  useEffect(() => {
    if (!profile?.id) return;
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
    if (!profile?.id) return;
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

  const updateStatus = async (a: Appointment, status: string) => {
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
        apt.id === a.id 
          ? { 
              ...apt, 
              status: status as 'Booked' | 'Confirmed' | 'Completed' | 'No-Show' | 'Cancelled' | 'Rescheduled' 
            } 
          : apt
      )
    );
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Appointments</h1>

      <Card>
        <CardHeader>
          <CardTitle>Book Appointment</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          <select
            className="border p-2"
            onChange={(e) =>
              setNewAppointment({
                ...newAppointment,
                customer_id: e.target.value,
              })
            }
          >
            <option value="">Select Customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <Input
            type="date"
            onChange={(e) =>
              setNewAppointment({
                ...newAppointment,
                appointment_date: e.target.value,
              })
            }
          />
          <Input
            type="time"
            onChange={(e) =>
              setNewAppointment({
                ...newAppointment,
                appointment_time: e.target.value,
              })
            }
          />
          <Button onClick={createAppointment}>Book</Button>
        </CardContent>
      </Card>

      <div className="grid gap-2">
        {appointments.map((a) => (
          <Card key={a.id} className="p-2 flex justify-between items-center">
            <div>
              <p className="font-bold">
                {a.appointment_date} {a.appointment_time}
              </p>
              <p>{a.status}</p>
            </div>
            <div className="flex gap-1">
              {['Confirmed', 'Completed', 'No-Show'].map((s) => (
                <Button size="sm" key={s} onClick={() => updateStatus(a, s)}>
                  {s}
                </Button>
              ))}
            </div>
            <div className="flex gap-1 mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  window.open(
                    `https://wa.me/${customers.find((c) => c.id === a.customer_id)?.phone}?text=Confirming your appointment on ${a.appointment_date} at ${a.appointment_time}`
                  )
                }
              >
                Confirm
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  window.open(
                    `https://wa.me/${customers.find((c) => c.id === a.customer_id)?.phone}?text=Reminder: Your appointment is on ${a.appointment_date} at ${a.appointment_time}`
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
