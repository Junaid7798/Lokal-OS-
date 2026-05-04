import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useBusinessProfile } from '../hooks/useBusinessProfile';
import { Lead } from '../types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

/**
 * Leads management view.
 * Requires Supabase connection to store lead data.
 */
export default function Leads() {
  const { profile } = useBusinessProfile();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [newLead, setNewLead] = useState({
    name: '',
    phone: '',
    source: '',
    interest: '',
  });

  // Check Supabase after mount
  useEffect(() => {
    if (!supabase) {
      const stored = localStorage.getItem('supabase_url');
      if (!stored) {
        setNeedsSetup(true);
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!supabase || !profile?.id || needsSetup) return;
    setLoading(true);

    supabase
      .from('leads')
      .select('*')
      .eq('business_id', profile.id)
      .then(({ data, error }) => {
        setLoading(false);
        if (error) {
          toast.error('Failed to load leads');
          return;
        }
        if (data) setLeads(data);
      });
  }, [profile, needsSetup]);

  const addLead = async () => {
    if (!supabase || !profile?.id) return;
    const { error } = await supabase
      .from('leads')
      .insert({ ...newLead, business_id: profile.id, status: 'New' });
    if (error) {
      toast.error(error.message);
      return;
    }
    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('business_id', profile.id);
    if (data) setLeads(data);
    setNewLead({ name: '', phone: '', source: '', interest: '' });
    toast.success('Lead added!');
  };

  const updateLeadStatus = async (id: string, status: Lead['status']) => {
    if (!supabase) return;
    await supabase.from('leads').update({ status }).eq('id', id);
    setLeads(leads.map(l => l.id === id ? { ...l, status } : l));
  };

  if (needsSetup) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold">Leads</h1>
        <Card className="p-6">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            <p className="font-medium">Supabase Not Connected</p>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Leads require a Supabase database.
          </p>
          <Button className="mt-4" onClick={() => window.location.href = '/setup'}>
            Set Up Supabase
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold">Leads</h1>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const statuses: Lead['status'][] = ['New', 'Contacted', 'Follow-Up Due', 'Converted', 'Lost'];

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Leads</h1>

      <Card>
        <CardHeader>
          <CardTitle>Add New Lead</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Name"
            value={newLead.name}
            onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
          />
          <Input
            placeholder="Phone"
            value={newLead.phone}
            onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
          />
          <Input
            placeholder="Source"
            value={newLead.source}
            onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
          />
          <Input
            placeholder="Interest"
            value={newLead.interest}
            onChange={(e) => setNewLead({ ...newLead, interest: e.target.value })}
          />
          <Button className="col-span-2" onClick={addLead}>Add Lead</Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statuses.map((status) => (
          <Card key={status}>
            <CardHeader>
              <CardTitle className="text-sm">{status}</CardTitle>
            </CardHeader>
            <CardContent>
              {leads
                .filter((l) => l.status === status)
                .map((lead) => (
                  <div key={lead.id} className="border p-2 rounded mt-2">
                    <p className="font-bold">{lead.name}</p>
                    <p className="text-sm">{lead.phone}</p>
                    {lead.interest && (
                      <p className="text-xs text-muted-foreground">{lead.interest}</p>
                    )}
                    <div className="flex gap-1 mt-2">
                      {status === 'New' && (
                        <Button size="sm" variant="outline" onClick={() => updateLeadStatus(lead.id, 'Contacted')}>
                          Contact
                        </Button>
                      )}
                      {status === 'Contacted' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => updateLeadStatus(lead.id, 'Follow-Up Due')}>
                            Follow Up
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => updateLeadStatus(lead.id, 'Converted')}>
                            Convert
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}