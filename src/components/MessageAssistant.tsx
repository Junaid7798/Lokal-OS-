import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Textarea } from './ui/textarea';
import { generateMessage } from '../lib/geminiAssistant';
import { Bot, Sparkles, Copy, Save } from 'lucide-react';
import { toast } from 'sonner';

export function MessageAssistant({
  onSave,
}: {
  onSave: (msg: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState<{
    purpose: string;
    tone: string;
    language: string;
    businessName: string;
    serviceName: string;
  }>({
    purpose: '',
    tone: 'Polite',
    language: 'English',
    businessName: '',
    serviceName: '',
  });
  const [generated, setGenerated] = useState('');

  if (!process.env.GEMINI_API_KEY) return null;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const msg = await generateMessage(inputs);
      setGenerated(msg);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <Button variant="outline" className="gap-2" onClick={() => setOpen(true)}>
        <Bot className="h-4 w-4" /> AI Assistant
      </Button>
    );
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-600" /> AI Assistant
        </h3>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Close
        </Button>
      </div>

      <Input
        placeholder="Purpose (e.g. Birthday wish)"
        onChange={(e) => setInputs({ ...inputs, purpose: e.target.value })}
      />
      <div className="flex gap-2">
        <Select onValueChange={(v: string) => setInputs({ ...inputs, tone: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Tone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Polite">Polite</SelectItem>
            <SelectItem value="Friendly">Friendly</SelectItem>
            <SelectItem value="Professional">Professional</SelectItem>
          </SelectContent>
        </Select>
        <Select onValueChange={(v: string) => setInputs({ ...inputs, language: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="English">English</SelectItem>
            <SelectItem value="Hindi">Hindi</SelectItem>
            <SelectItem value="Hinglish">Hinglish</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Input
        placeholder="Business Name"
        onChange={(e) => setInputs({ ...inputs, businessName: e.target.value })}
      />
      <Input
        placeholder="Service/Item Name"
        onChange={(e) => setInputs({ ...inputs, serviceName: e.target.value })}
      />

      <Button className="w-full" onClick={handleGenerate} disabled={loading}>
        {loading ? 'Generating...' : 'Generate'}
      </Button>

      {generated && (
        <div className="pt-3 border-t space-y-2">
          <Textarea
            value={generated}
            onChange={(e) => setGenerated(e.target.value)}
            rows={4}
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigator.clipboard.writeText(generated)}
            >
              <Copy className="h-4 w-4 mr-2" /> Copy
            </Button>
            <Button className="flex-1" onClick={() => onSave(generated)}>
              <Save className="h-4 w-4 mr-2" /> Save Draft
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
