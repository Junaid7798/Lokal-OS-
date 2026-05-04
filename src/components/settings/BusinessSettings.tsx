import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { QrCode, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface BusinessSettingsProps {
  formData: {
    business_name: string;
    industry: string;
    phone: string;
    google_review_link: string;
    staff_members: string;
    service_categories: string;
    customer_sources: string;
  };
  profile: { business_name?: string; google_review_link?: string } | null;
  onChange: (field: string, value: string) => void;
  handlePrint: () => void;
}

export function BusinessSettings({
  formData,
  profile,
  onChange,
  handlePrint,
}: BusinessSettingsProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Business Profile</CardTitle>
          <CardDescription>
            Details used to send WhatsApp texts & track reports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name</Label>
              <Input
                id="business_name"
                value={formData.business_name}
                onChange={(e) => onChange('business_name', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                placeholder="e.g. Salon, Spa, Clinic"
                value={formData.industry}
                onChange={(e) => onChange('industry', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">WhatsApp Business Phone</Label>
              <Input
                id="phone"
                placeholder="e.g. +91 9876543210"
                value={formData.phone}
                onChange={(e) => onChange('phone', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="google_review_link">
                Google Review Link
              </Label>
              <Input
                id="google_review_link"
                placeholder="https://g.page/r/xxxxx/review"
                value={formData.google_review_link}
                onChange={(e) => onChange('google_review_link', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff_members">
                Team Members (Comma separated)
              </Label>
              <Input
                id="staff_members"
                placeholder="e.g. Owner, Riya, Pooja, Vikram"
                value={formData.staff_members}
                onChange={(e) => onChange('staff_members', e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Used to log who performed which action.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service_categories">
                Service Categories (Comma separated)
              </Label>
              <Input
                id="service_categories"
                placeholder="e.g. Haircut, Facial, Spa"
                value={formData.service_categories}
                onChange={(e) => onChange('service_categories', e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Used as a dropdown when logging visits.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_sources">
                Customer Sources (Comma separated)
              </Label>
              <Input
                id="customer_sources"
                placeholder="e.g. Walk-in, Instagram, Referral"
                value={formData.customer_sources}
                onChange={(e) => onChange('customer_sources', e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Used as a dropdown when creating a new customer.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-primary" /> Review QR Code
              </CardTitle>
              <CardDescription>
                Print this QR code for your desk to let customers scan and
                review easily.
              </CardDescription>
            </div>
            {profile?.google_review_link && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrint}
              >
                <Printer className="h-4 w-4 mr-2" /> Print
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {profile?.google_review_link ? (
            <div
              id="print-area"
              className="flex flex-col items-center justify-center p-8 border rounded-xl bg-white space-y-6 max-w-sm mx-auto shadow-sm"
            >
              <h3 className="text-2xl font-bold bg-white text-black text-center">
                Scan for Reviews
              </h3>
              <p className="text-gray-600 text-center max-w-[250px] font-medium leading-snug">
                Happy with your visit? Scan this QR code to leave a Google
                Review.
              </p>
              <QRCodeSVG value={profile.google_review_link} size={220} />
              <p className="text-sm font-semibold text-gray-800 text-center">
                {profile.business_name}
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 border border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center dark:bg-zinc-900/50">
              <p className="text-muted-foreground text-sm">
                Add your Google Review Link below and save to generate the
                QR code.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}