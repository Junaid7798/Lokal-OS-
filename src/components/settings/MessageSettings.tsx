import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { MessageAssistant } from '../MessageAssistant';

interface MessageSettingsProps {
  formData: {
    default_language: string;
    msg_thank_you: string;
    msg_request_review: string;
    msg_follow_up: string;
    msg_comeback: string;
    msg_referral: string;
  };
  onChange: (field: string, value: string) => void;
  onApplyLanguageTemplates: (lang: string) => void;
}

export function MessageSettings({
  formData,
  onChange,
  onApplyLanguageTemplates,
}: MessageSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Templates and Messages</CardTitle>
        <CardDescription>
          Manage message templates dynamically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>WhatsApp Template Language</Label>
            <Select
              value={formData.default_language}
              onValueChange={(val) => onChange('default_language', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">Hindi</SelectItem>
                <SelectItem value="hinglish">Hinglish</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-lg">Message Templates</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Write the core message you want to send. The app will
              automatically start every message with{' '}
              <span className="font-medium text-foreground">
                "Hi [Customer Name],"
              </span>{' '}
              and will automatically append your{' '}
              <span className="font-medium text-foreground">
                Google Review Link
              </span>{' '}
              to the Request Review message.
            </p>

            <div className="flex gap-2 flex-wrap mb-4 pb-2 border-b">
              <span className="text-xs font-semibold py-1 pr-2 uppercase">
                Load Defaults:
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onApplyLanguageTemplates('en')}
              >
                English
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onApplyLanguageTemplates('hi')}
              >
                Hindi
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onApplyLanguageTemplates('hinglish')}
              >
                Hinglish
              </Button>
              <MessageAssistant
                onSave={(msg) => onChange('msg_request_review', msg)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="msg_thank_you">Thank You Message</Label>
              <Input
                id="msg_thank_you"
                value={formData.msg_thank_you}
                onChange={(e) => onChange('msg_thank_you', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="msg_request_review">
                Request Review Message
              </Label>
              <Input
                id="msg_request_review"
                value={formData.msg_request_review}
                onChange={(e) => onChange('msg_request_review', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="msg_follow_up">Follow-up Message</Label>
              <Input
                id="msg_follow_up"
                value={formData.msg_follow_up}
                onChange={(e) => onChange('msg_follow_up', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="msg_comeback">Comeback Message</Label>
              <Input
                id="msg_comeback"
                value={formData.msg_comeback}
                onChange={(e) => onChange('msg_comeback', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="msg_referral">
                Referral Request Message
              </Label>
              <Input
                id="msg_referral"
                value={formData.msg_referral}
                onChange={(e) => onChange('msg_referral', e.target.value)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}