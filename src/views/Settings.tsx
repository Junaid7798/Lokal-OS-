import React, { useState, useEffect } from 'react';
import { localDb } from '../lib/localDb';
import { useBusinessProfile } from '../hooks/useBusinessProfile';
import { supabase } from '../lib/supabaseClient';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import { toast } from 'sonner';
import { LogOut } from 'lucide-react';
import { BusinessSettings } from '../components/settings/BusinessSettings';
import { MessageSettings } from '../components/settings/MessageSettings';
import { FollowUpRules } from '../components/settings/FollowUpRules';
import { BrandingSettings } from '../components/settings/BrandingSettings';
import { DataExport } from '../components/settings/DataExport';
import type { ServiceFollowupRule } from '../types';

export default function Settings({ onLogout }: { onLogout: () => void }) {
  const { profile, loading, setProfile } = useBusinessProfile();
  const [rules, setRules] = useState<ServiceFollowupRule[]>([]);

  const [formData, setFormData] = useState({
    business_name: '',
    industry: '',
    phone: '',
    google_review_link: '',
    average_bill_value: '',
    default_language: 'en',
    staff_members: 'Owner',
    service_categories: 'Haircut, Facial, Massage, Styling, Coloring',
    customer_sources: 'Walk-in, Instagram, Referral, Google, Facebook, Other',
    msg_thank_you: '',
    msg_request_review: '',
    msg_follow_up: '',
    msg_comeback: '',
    msg_referral: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (profile && !profile.isNew) {
        setFormData({
          business_name: profile.business_name || '',
          industry: profile.industry || '',
          phone: profile.phone || '',
          google_review_link: profile.google_review_link || '',
          average_bill_value: profile.average_bill_value?.toString() || '',
          default_language: profile.default_language || 'en',
          staff_members: profile.staff_members || 'Owner',
          service_categories:
            profile.service_categories ||
            'Haircut, Facial, Massage, Styling, Coloring',
          customer_sources:
            profile.customer_sources ||
            'Walk-in, Instagram, Referral, Google, Facebook, Other',
          msg_thank_you:
            profile.msg_thank_you || 'thank you for visiting today!',
          msg_request_review:
            profile.msg_request_review ||
            "we'd love it if you could leave us a review here:",
          msg_follow_up:
            profile.msg_follow_up ||
            'just a quick follow-up to see how you are doing after your recent service.',
          msg_comeback:
            profile.msg_comeback ||
            "it's been a while! We'd love to see you again.",
          msg_referral:
            profile.msg_referral ||
            'loved our service? Refer a friend and you both get a discount on your next visit!',
        });

        const { data, error } = await supabase
          .from('service_followup_rules')
          .select('*')
          .eq('business_id', profile.id);
        if (!error && data) setRules(data);
      }
    }
    loadData();
  }, [profile]);

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyLanguageTemplates = (lang: string) => {
    let templates: Record<string, string> = {};
    if (lang === 'en') {
      templates = {
        msg_thank_you: 'thank you for visiting today!',
        msg_request_review: "we'd love it if you could leave us a review here:",
        msg_follow_up:
          'just a quick follow-up to see how you are doing after your recent service.',
        msg_comeback:
          "it's been a while! We'd love to see you again. Book today to get a discount.",
        msg_referral:
          'loved our service? Refer a friend and you both get a discount on your next visit!',
        default_language: 'en',
      };
    } else if (lang === 'hi') {
      templates = {
        msg_thank_you: 'aaj visit karne ke liye dhanyawad!',
        msg_request_review: 'kripya apne anubhav ko Google par review karein:',
        msg_follow_up:
          'hum bas aapse check karna chahte the, aapka pichla service kaisa raha?',
        msg_comeback:
          'kafi samay ho gaya! Apni agali service book karein aur discount payein.',
        msg_referral:
          'humari service pasand aayi? Apne doston ko refer karein aur discount payein!',
        default_language: 'hi',
      };
    } else if (lang === 'hinglish') {
      templates = {
        msg_thank_you: 'aaj visit karne ke liye thank you!',
        msg_request_review: 'kya aap apna experience Google par share karenge?',
        msg_follow_up:
          'just checking in, recent service ke baad sab kaisa hai?',
        msg_comeback:
          'kafi time ho gaya dekhe! Next appointment book karein discount ke liye.',
        msg_referral:
          'service achhi lagi? Apne friend ko refer karein for a special discount!',
        default_language: 'hinglish',
      };
    }
    setFormData((prev) => ({ ...prev, ...templates }));
    toast.success('Templates updated. Remember to save!');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const user = localDb.getAuth();
    if (!user) return;

    const payload = {
      business_name: formData.business_name,
      industry: formData.industry,
      phone: formData.phone,
      google_review_link: formData.google_review_link,
      average_bill_value: parseFloat(formData.average_bill_value) || 0,
      default_language: formData.default_language,
      staff_members: formData.staff_members,
      service_categories: formData.service_categories,
      customer_sources: formData.customer_sources,
      is_pro: profile?.is_pro || false,
      msg_thank_you: formData.msg_thank_you,
      msg_request_review: formData.msg_request_review,
      msg_follow_up: formData.msg_follow_up,
      msg_comeback: formData.msg_comeback,
      msg_referral: formData.msg_referral,
    };

    localStorage.setItem('deskTracker_lang', formData.default_language);

    await localDb.saveProfile(user.id, payload);
    toast.success('Profile saved correctly!');
    setProfile({ ...profile, ...payload, isNew: false, id: user.id });

    setSaving(false);
  };

  const handleLogout = () => {
    onLogout();
  };

  const handlePrint = () => {
    document.body.classList.add('print-qr');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('print-qr');
    }, 1000);
  };

  if (loading) return <div className="p-4">Loading settings...</div>;

  return (
    <div className="p-4 space-y-4 max-w-3xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Button
          variant="outline"
          size="icon"
          onClick={handleLogout}
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="business" className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full h-auto gap-2 bg-transparent p-0">
          <TabsTrigger
            value="business"
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary border rounded-xl py-2.5 shrink-0 text-sm font-semibold"
          >
            Business
          </TabsTrigger>
          <TabsTrigger
            value="messages"
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary border rounded-xl py-2.5 shrink-0 text-sm font-semibold"
          >
            Messages
          </TabsTrigger>
          <TabsTrigger
            value="followup"
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary border rounded-xl py-2.5 shrink-0 text-sm font-semibold"
          >
            Follow-up Rules
          </TabsTrigger>
          <TabsTrigger
            value="branding"
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary border rounded-xl py-2.5 shrink-0 text-sm font-semibold"
          >
            Branding
          </TabsTrigger>
          <TabsTrigger
            value="loyalty"
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary border rounded-xl py-2.5 shrink-0 text-sm font-semibold"
          >
            Loyalty
          </TabsTrigger>
          <TabsTrigger
            value="subscription"
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary border rounded-xl py-2.5 shrink-0 text-sm font-semibold"
          >
            Subscription
          </TabsTrigger>
          <TabsTrigger
            value="export"
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary border rounded-xl py-2.5 shrink-0 text-sm font-semibold"
          >
            Data Export
          </TabsTrigger>
        </TabsList>

        <form onSubmit={handleSave} className="space-y-4 mt-6">
          <div className="flex justify-end border-b pb-4 mb-4">
            <Button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto"
            >
              {saving ? 'Saving...' : 'Save All Settings'}
            </Button>
          </div>

          <TabsContent value="business" className="space-y-4 mt-0">
            <BusinessSettings
              formData={formData}
              profile={profile}
              onChange={handleFormChange}
              handlePrint={handlePrint}
            />
          </TabsContent>

          <TabsContent value="messages" className="space-y-4 mt-0">
            <MessageSettings
              formData={formData}
              onChange={handleFormChange}
              onApplyLanguageTemplates={handleApplyLanguageTemplates}
            />
          </TabsContent>
        </form>

        <TabsContent value="followup" className="space-y-4 mt-6">
          <FollowUpRules
            profile={profile}
            rules={rules}
            onRulesChange={setRules}
          />
        </TabsContent>

        <TabsContent value="branding" className="space-y-4 mt-0">
          <BrandingSettings />
        </TabsContent>

        <TabsContent value="loyalty" className="space-y-4 mt-0">
          <LoyaltyTabContent />
        </TabsContent>

        <TabsContent value="subscription" className="space-y-4 mt-0">
          <SubscriptionTabContent profile={profile} setProfile={setProfile} />
        </TabsContent>

        <TabsContent value="export" className="space-y-6 mt-6">
          <DataExport profile={profile} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LoyaltyTabContent() {
  return (
    <div className="border-primary/50 shadow-sm p-6 bg-card rounded-xl">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🏆</span>
        <h2 className="text-lg font-semibold">Loyalty Points Program</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Configure how customers earn and redeem loyalty points
      </p>
      <div className="p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          Loyalty program configuration coming soon...
        </p>
      </div>
    </div>
  );
}

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Label } from '../components/ui/label';

function SubscriptionTabContent({
  profile,
  setProfile,
}: {
  profile: { is_pro?: boolean } | null;
  setProfile: React.Dispatch<React.SetStateAction<any>>;
}) {
  const handleTogglePro = async () => {
    const user = localDb.getAuth();
    if (user) {
      const payload = { ...profile, is_pro: !profile?.is_pro };
      await localDb.saveProfile(user.id, payload);
      setProfile(payload);
      toast.success(
        payload.is_pro ? 'Upgraded to Pro!' : 'Downgraded to Free.'
      );
    }
  };

  return (
    <Card className="border-primary/50 shadow-sm overflow-hidden bg-gradient-to-br from-white to-primary/5 dark:from-background dark:to-primary/10">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-sm uppercase tracking-wider font-bold">
            Pro
          </span>
          Your Plan
        </CardTitle>
        <CardDescription>
          {profile?.is_pro
            ? 'You are on the Pro plan with unlimited customers and advanced reporting.'
            : 'You are on the Free plan. Upgrade for unlimited customers and advanced reports.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between bg-card border rounded-lg p-3">
          <div className="flex flex-col">
            <span className="font-semibold text-sm">
              Pro Subscription
            </span>
            <span className="text-xs text-muted-foreground">
              ₹1,999/month
            </span>
          </div>
          <Button
            variant={profile?.is_pro ? 'outline' : 'default'}
            size="sm"
            onClick={handleTogglePro}
          >
            {profile?.is_pro ? 'Cancel Pro' : 'Upgrade to Pro'}
          </Button>
        </div>

        <div className="space-y-2 mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div>
              <Label>Pro Features</Label>
              <p className="text-xs text-muted-foreground">
                Unlock weekly reports, extended limits, team members and
                CSV export.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}