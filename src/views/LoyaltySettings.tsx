import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { localDb } from '@/lib/localDb';
import type { LoyaltyRule } from '@/types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { AlertTriangle, Trophy } from 'lucide-react';

export default function LoyaltySettings() {
  const { profile } = useBusinessProfile();
  const [rules, setRules] = useState<LoyaltyRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [newRule, setNewRule] = useState({
    rule_name: '',
    visit_threshold: 5,
    reward_text: '',
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
      .from('loyalty_rules')
      .select('*')
      .eq('business_id', profile.id)
      .then(({ data, error }) => {
        setLoading(false);
        if (error) {
          toast.error('Failed to load loyalty rules');
          return;
        }
        if (data) setRules(data);
      });
  }, [profile, needsSetup]);

  const addRule = async () => {
    if (!profile?.id) return;
    const payload = {
      ...newRule,
      business_id: profile.id,
      active: true,
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('loyalty_rules')
        .insert(payload)
        .select()
        .single();
      if (error) {
        toast.error(error.message);
        return;
      }
      setRules([...rules, data]);
    } else {
      // Fallback to localDb
      const record = await localDb.addLoyaltyRule(profile.id, payload);
      setRules([...rules, record as LoyaltyRule]);
    }

    setNewRule({ rule_name: '', visit_threshold: 5, reward_text: '' });
    toast.success('Rule added!');
  };

  const toggleRule = async (id: string, active: boolean) => {
    if (supabase) {
      await supabase.from('loyalty_rules').update({ active }).eq('id', id);
    }
    setRules(rules.map((r) => (r.id === id ? { ...r, active } : r)));
  };

  if (needsSetup) {
    return (
      <div className="p-4 space-y-4 max-w-3xl mx-auto pb-12">
        <h1 className="text-2xl font-bold">Loyalty Settings</h1>
        <Card className="p-6">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            <p className="font-medium">Supabase Not Connected</p>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Loyalty settings require Supabase for full sync.
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
      <div className="p-4 max-w-3xl mx-auto pb-12">
        <h1 className="text-2xl font-bold">Loyalty Settings</h1>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 max-w-3xl mx-auto pb-12">
      <div className="flex items-center gap-2">
        <Trophy className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Loyalty Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Rule</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="space-y-2">
            <Label htmlFor="ruleName">Rule Name</Label>
            <Input
              id="ruleName"
              placeholder="e.g. Gold Member"
              value={newRule.rule_name}
              onChange={(e) => setNewRule({ ...newRule, rule_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="visitThreshold">Visit Threshold</Label>
            <Input
              id="visitThreshold"
              type="number"
              placeholder="Number of visits required"
              value={newRule.visit_threshold}
              onChange={(e) =>
                setNewRule({ ...newRule, visit_threshold: parseInt(e.target.value) || 5 })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rewardText">Reward Text</Label>
            <Input
              id="rewardText"
              placeholder="e.g. 20% off next visit"
              value={newRule.reward_text}
              onChange={(e) => setNewRule({ ...newRule, reward_text: e.target.value })}
            />
          </div>
          <Button onClick={addRule}>Add Rule</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {rules.length === 0 ? (
            <p className="text-muted-foreground">No rules yet</p>
          ) : (
            rules.map((rule) => (
              <div
                key={rule.id}
                className="flex justify-between items-center border rounded-lg p-3"
              >
                <div>
                  <p className="font-medium">{rule.rule_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {rule.visit_threshold} visits → {rule.reward_text}
                  </p>
                </div>
                <Button
                  variant={rule.active ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleRule(rule.id, !rule.active)}
                >
                  {rule.active ? 'Active' : 'Inactive'}
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
