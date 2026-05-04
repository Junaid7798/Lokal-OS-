import { useState } from 'react';
import { Card, CardContent, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { generateSummary } from '@/lib/geminiAssistant';
import { Bot, Sparkles, Copy, Save } from 'lucide-react';
import { toast } from 'sonner';

export function AISummary({ data }: { data: Record<string, any> }) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateSummary(data);
      setSummary(result);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 space-y-3">
      <h3 className="font-semibold flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-purple-600" /> AI Weekly Summary
      </h3>

      <Button className="w-full" onClick={handleGenerate} disabled={loading}>
        {loading ? 'Generating...' : 'Generate AI Summary'}
      </Button>

      {summary && (
        <div className="pt-3 border-t space-y-2">
          <Textarea value={summary} readOnly rows={6} className="text-sm" />
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigator.clipboard.writeText(summary)}
            >
              <Copy className="h-4 w-4 mr-2" /> Copy
            </Button>
            <Button
              className="flex-1"
              onClick={() => toast.success('Summary saved to report draft!')}
            >
              <Save className="h-4 w-4 mr-2" /> Save Summary
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
