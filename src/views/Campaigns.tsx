import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { Campaign, CampaignRecipient, Customer } from '../types';
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
import { MessageAssistant } from '@/components/MessageAssistant';
import { AlertTriangle } from 'lucide-react';

export default function Campaigns() {
  const { profile } = useBusinessProfile();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [recipients, setRecipients] = useState<(CampaignRecipient & { customer: Customer })[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    segment_type: 'inactive_30',
    message_template: '',
  });

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setNeedsSetup(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase || !profile?.id || needsSetup) return;
    setLoading(true);

    supabase
      .from('campaigns')
      .select('*')
      .eq('business_id', profile.id)
      .then(({ data, error }) => {
        setLoading(false);
        if (error) {
          toast.error('Failed to load campaigns');
          return;
        }
        if (data) setCampaigns(data);
      });
  }, [profile, needsSetup]);

  useEffect(() => {
    if (!supabase || !selectedCampaign || needsSetup) return;

    supabase
      .from('campaign_recipients')
      .select('*, customer:customers(*)')
      .eq('campaign_id', selectedCampaign.id)
      .then(({ data, error }) => {
        if (error) {
          toast.error('Failed to load recipients');
          return;
        }
        if (data) setRecipients(data as (CampaignRecipient & { customer: Customer })[]);
      });
  }, [selectedCampaign, needsSetup]);

  const createCampaign = async () => {
    if (!supabase || !profile?.id) {
      toast.error('Database not connected');
      return;
    }
    const { data, error } = await supabase
      .from('campaigns')
      .insert({ ...newCampaign, business_id: profile.id })
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    setCampaigns([...campaigns, data]);
    toast.success('Campaign created!');
  };

  const updateRecipient = async (id: string, status: string) => {
    if (!supabase) return;
    await supabase
      .from('campaign_recipients')
      .update({
        status,
        [status === 'Sent' ? 'sent_at' : 'returned_at']: new Date().toISOString(),
      })
      .eq('id', id);
    setRecipients(
      recipients.map((r) => (r.id === id ? { ...r, status: status as CampaignRecipient['status'] } : r))
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
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <Card className="p-6">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            <p className="font-medium">Supabase Not Connected</p>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Campaigns require a Supabase database. Please set up your Supabase
            connection.
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
      <div className="p-4">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Campaigns</h1>
      <Card>
        <CardHeader>
          <CardTitle>Create Campaign</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          <Input
            placeholder="Campaign Name"
            value={newCampaign.name}
            onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
          />
          <Select
            value={newCampaign.segment_type}
            onValueChange={(v) => setNewCampaign({ ...newCampaign, segment_type: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inactive_30">Inactive 30+ days</SelectItem>
              <SelectItem value="vip">VIP</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input
              placeholder="Message Template"
              value={newCampaign.message_template}
              onChange={(e) => setNewCampaign({ ...newCampaign, message_template: e.target.value })}
            />
            <MessageAssistant
              onSave={(msg) => setNewCampaign({ ...newCampaign, message_template: msg })}
            />
          </div>
          <Button onClick={createCampaign}>Create</Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        {campaigns.map((c) => (
          <Button
            key={c.id}
            variant={selectedCampaign?.id === c.id ? 'default' : 'outline'}
            onClick={() => setSelectedCampaign(c)}
          >
            {c.name}
          </Button>
        ))}
      </div>

      {selectedCampaign && (
        <Card>
          <CardHeader>
            <CardTitle>Recipients</CardTitle>
          </CardHeader>
          <CardContent>
            {recipients.length === 0 ? (
              <p className="text-muted-foreground">No recipients yet</p>
            ) : (
              recipients.map((r) => (
                <div key={r.id} className="flex justify-between items-center border p-2">
                  <p>{r.customer?.name || 'Unknown'}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        openWhatsApp(r.customer?.phone, selectedCampaign.message_template)
                      }
                    >
                      WhatsApp
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateRecipient(r.id, 'Sent')}>
                      Mark Sent
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateRecipient(r.id, 'Returned')}>
                      Mark Returned
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
