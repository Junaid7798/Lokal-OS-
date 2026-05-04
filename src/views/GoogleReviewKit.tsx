import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { QRCodeSVG } from 'qrcode.react';
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

const LANGUAGES = ['English', 'Hindi', 'Hinglish'];
const TONES = ['Polite', 'Friendly', 'Premium'];

export default function GoogleReviewKit() {
  const [inputs, setInputs] = useState<{
    business: string;
    reviewLink: string;
    whatsapp: string;
    language: string;
    tone: string;
  }>({
    business: '',
    reviewLink: '',
    whatsapp: '',
    language: 'English',
    tone: 'Friendly',
  });
  const [lead, setLead] = useState({ name: '', business: '', phone: '' });
  const [generated, setGenerated] = useState(false);

  const generateWhatsAppMessage = () => {
    const msg = `Hi! Thanks for visiting ${inputs.business}. Could you please leave us a review? Link: ${inputs.reviewLink}`;
    // Adjust tone/language logic here
    return encodeURIComponent(msg);
  };

  const handleWhatsApp = () => {
    const phone = inputs.whatsapp.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phone}?text=${generateWhatsAppMessage()}`);
  };

  const saveLead = async () => {
    const { error } = await supabase.from('public_tool_leads').insert({
      name: lead.name,
      business_name: lead.business,
      phone: lead.phone,
      tool_used: 'review-kit',
    });
    if (error) toast.error('Error saving info');
    else toast.success('Info saved!');
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">Google Review + WhatsApp Kit</h1>

      <Card>
        <CardContent className="grid gap-3 pt-4">
          <Input
            placeholder="Business Name"
            onChange={(e) => setInputs({ ...inputs, business: e.target.value })}
          />
          <Input
            placeholder="Google Review Link"
            onChange={(e) =>
              setInputs({ ...inputs, reviewLink: e.target.value })
            }
          />
          <Input
            placeholder="WhatsApp Number (+91...)"
            onChange={(e) => setInputs({ ...inputs, whatsapp: e.target.value })}
          />
          <div className="flex gap-2">
            <Select
              onValueChange={(v: string) => setInputs({ ...inputs, language: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem value={l} key={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={(v: string) => setInputs({ ...inputs, tone: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Tone" />
              </SelectTrigger>
              <SelectContent>
                {TONES.map((t) => (
                  <SelectItem value={t} key={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setGenerated(true)}>Generate Tools</Button>
        </CardContent>
      </Card>

      {generated && (
        <div className="space-y-4">
          <Card className="flex flex-col items-center p-4">
            <QRCodeSVG value={inputs.reviewLink} size={200} />
            <p className="mt-2 text-sm font-semibold">Review QR Code</p>
          </Card>
          <Card className="p-4 space-y-2">
            <p className="text-sm border p-2 rounded">
              {decodeURIComponent(generateWhatsAppMessage())}
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() =>
                  navigator.clipboard.writeText(
                    decodeURIComponent(generateWhatsAppMessage())
                  )
                }
              >
                Copy Message
              </Button>
              <Button onClick={handleWhatsApp}>Test WhatsApp</Button>
            </div>
          </Card>

          <Card className="bg-slate-50 p-4">
            <CardTitle className="text-lg">
              Want to track follow-ups and reviews properly?
            </CardTitle>
            <div className="grid gap-2 mt-3">
              <Input
                placeholder="Name"
                onChange={(e) => setLead({ ...lead, name: e.target.value })}
              />
              <Input
                placeholder="Business Name"
                onChange={(e) => setLead({ ...lead, business: e.target.value })}
              />
              <Input
                placeholder="WhatsApp Phone"
                onChange={(e) => setLead({ ...lead, phone: e.target.value })}
              />
              <Button onClick={saveLead}>Get full follow-up dashboard</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
