import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useBusinessProfile } from '../hooks/useBusinessProfile';
import { LoyaltyRule } from '../types';
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
 * Loyalty program rules management.
 * Requires Supabase connection to store rules.
 */
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
    if (!supabase || !profile?.id) return;
    const { data, error } = await supabase
      .from('loyalty_rules')
      .insert({ ...newRule, business_id: profile.id })
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    setRules([...rules, data]);
    toast.success('Rule added!');
  };

  const toggleRule = async (id: string, active: boolean) => {
    if (!supabase) return;
    await supabase.from('loyalty_rules').update({ active }).eq('id', id);
    setRules(rules.map(r => r.id === id ? { ...r, active } : r));
  };

  if (needsSetup) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold">Loyalty Settings</h1>
        <Card className="p-6">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            <p className="font-medium">Supabase Not Connected</p>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Loyalty settings require Supabase.
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
        <h1 className="text-2xl font-bold">Loyalty Settings</h1>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Loyalty Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Create Rule</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          <Input
            placeholder="Rule Name"
            onChange={(e) => setNewRule({ ...newRule, rule_name: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Visit Threshold"
            onChange={(e) => setNewRule({ ...newRule, visit_threshold: parseInt(e.target.value) || 5 })}
          />
          <Input
            placeholder="Reward Text"
            onChange={(e) => setNewRule({ ...newRule, reward_text: e.target.value })}
          />
          <Button onClick={addRule}>Add Rule</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Rules</CardTitle>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <p className="text-muted-foreground">No rules yet</p>
          ) : (
            rules.map((rule) => (
              <div key={rule.id} className="flex justify-between items-center border p-2">
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