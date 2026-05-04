import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useBusinessProfile } from '../hooks/useBusinessProfile';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

const templates = {
  positive:
    'Hi {{customer_name}}, thank you so much for your kind words! We are thrilled to hear you had a great experience with your {{service_name}} at {{business_name}}.',
  neutral:
    'Hi {{customer_name}}, thank you for the feedback regarding your {{service_name}}. We appreciate you visiting {{business_name}} and hope to provide an even better experience next time!',
  negative:
    "Hi {{customer_name}}, I'm sorry to hear your experience with your {{service_name}} wasn't up to par. We aim for excellence at {{business_name}} and would appreciate a chance to make it right. Please contact us directly so we can discuss this further.",
};

export default function Reviews() {
  const { profile } = useBusinessProfile();
  const [stats, setStats] = useState({
    sentToday: 0,
    sentWeek: 0,
    reviewed: 0,
    pending: 0,
  });

  const [formData, setFormData] = useState({
    customerName: '',
    tone: 'positive',
    serviceName: '',
  });
  const [generatedReply, setGeneratedReply] = useState('');

  useEffect(() => {
    async function fetchStats() {
      if (!profile?.id) return;
      const { data: customers } = await supabase
        .from('customers')
        .select('review_status')
        .eq('business_id', profile.id);
      if (customers) {
        setStats({
          sentToday: 0,
          sentWeek: 0,
          reviewed: customers.filter((c) => c.review_status === 'reviewed')
            .length,
          pending: customers.filter((c) => c.review_status === 'requested')
            .length,
        });
      }
    }
    fetchStats();
  }, [profile]);

  const generateReply = () => {
    if (!profile) return;
    const template = templates[formData.tone as keyof typeof templates];
    const reply = template
      .replace('{{customer_name}}', formData.customerName || 'Customer')
      .replace('{{business_name}}', profile.business_name || 'our business')
      .replace('{{service_name}}', formData.serviceName || 'service');
    setGeneratedReply(reply);
  };

  if (!profile) return <div>Loading...</div>;

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Google Reviews</h1>

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="replies">Reply Generator</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6 mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Sent Today</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.sentToday}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Sent Week</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.sentWeek}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Reviewed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.reviewed}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Google Review QR Code</CardTitle>
              <CardDescription>Printable for your shop</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {profile.google_review_link ? (
                <QRCodeSVG value={profile.google_review_link} size={200} />
              ) : (
                <p>No review link configured in Settings</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="replies" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate Review Reply</CardTitle>
              <CardDescription>
                Review replies should be checked by the owner before posting.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Customer Name</Label>
                <Input
                  value={formData.customerName}
                  onChange={(e) =>
                    setFormData({ ...formData, customerName: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Service Name</Label>
                <Input
                  value={formData.serviceName}
                  onChange={(e) =>
                    setFormData({ ...formData, serviceName: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Tone</Label>
                <select
                  value={formData.tone}
                  onChange={(e) =>
                    setFormData({ ...formData, tone: e.target.value })
                  }
                  className="border p-2 rounded"
                >
                  <option value="positive">Positive</option>
                  <option value="neutral">Neutral</option>
                  <option value="negative">Negative</option>
                </select>
              </div>
              <Button onClick={generateReply}>Generate Reply</Button>

              {generatedReply && (
                <div className="mt-4">
                  <Label>Generated Reply</Label>
                  <Textarea
                    value={generatedReply}
                    readOnly
                    className="h-32 mt-2"
                  />
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedReply);
                      toast.success('Copied!');
                    }}
                    className="mt-2"
                  >
                    Copy to Clipboard
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
