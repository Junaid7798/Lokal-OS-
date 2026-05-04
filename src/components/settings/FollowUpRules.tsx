import { useState } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabaseClient';
import type { ServiceFollowupRule } from '../../types';

interface FollowUpRulesProps {
  profile: { id: string } | null;
  rules: ServiceFollowupRule[];
  onRulesChange: (rules: ServiceFollowupRule[]) => void;
}

export function FollowUpRules({ profile, rules, onRulesChange }: FollowUpRulesProps) {
  const [newRule, setNewRule] = useState({
    service_category: '',
    default_followup_days: '',
  });

  const handleAddRule = async () => {
    if (
      !profile?.id ||
      !newRule.service_category ||
      !newRule.default_followup_days
    )
      return;

    const { data, error } = await supabase
      .from('service_followup_rules')
      .insert([
        {
          business_id: profile.id,
          service_category: newRule.service_category,
          default_followup_days: parseInt(newRule.default_followup_days),
        },
      ])
      .select()
      .single();

    if (error) {
      toast.error(error.message);
      return;
    }
    onRulesChange([...rules, data]);
    setNewRule({ service_category: '', default_followup_days: '' });
    toast.success('Rule added!');
  };

  const handleDeleteRule = async (id: string) => {
    const { error } = await supabase
      .from('service_followup_rules')
      .delete()
      .eq('id', id);
    if (error) {
      toast.error(error.message);
      return;
    }
    onRulesChange(rules.filter((r) => r.id !== id));
    toast.success('Rule deleted!');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Follow-Up Rules</CardTitle>
        <CardDescription>
          Configure auto-generated follow-up tasks.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Service"
            value={newRule.service_category}
            onChange={(e) =>
              setNewRule({ ...newRule, service_category: e.target.value })
            }
          />
          <Input
            type="number"
            placeholder="Days"
            value={newRule.default_followup_days}
            onChange={(e) =>
              setNewRule({
                ...newRule,
                default_followup_days: e.target.value,
              })
            }
          />
          <Button onClick={handleAddRule}>Add</Button>
        </div>
        <div className="space-y-2">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="flex justify-between items-center p-2 border rounded"
            >
              <span>
                {rule.service_category}: {rule.default_followup_days} days
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteRule(rule.id)}
              >
                Delete
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}