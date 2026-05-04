import { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LockedFeature } from '@/components/LockedFeature';
import { AlertTriangle, Plus, Play, Pause, Trash2, Edit2, Zap, MessageSquare, Calendar, Clock } from 'lucide-react';
import { localDb } from '@/lib/localDb';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AutomationSequence {
  id: string;
  business_id: string;
  name: string;
  trigger_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  steps?: AutomationStep[];
}

interface AutomationStep {
  id: string;
  sequence_id: string;
  step_order: number;
  action_type: string;
  delay_days: number;
  message_template_id?: string;
}

const TRIGGER_TYPES = [
  { value: 'visit_completed', label: 'After Visit', icon: Calendar },
  { value: 'appointment_booked', label: 'After Booking', icon: Calendar },
  { value: 'inactive_30d', label: 'After 30 Days Inactive', icon: Clock },
  { value: 'birthday', label: 'On Birthday', icon: Zap },
];

const ACTION_TYPES = [
  { value: 'whatsapp_message', label: 'Send WhatsApp Message', icon: MessageSquare },
  { value: 'reminder', label: 'Send Reminder', icon: Zap },
  { value: 'offer', label: 'Send Special Offer', icon: Zap },
];

export default function Automation() {
  const { profile } = useBusinessProfile();
  const [sequences, setSequences] = useState<AutomationSequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingSequence, setEditingSequence] = useState<AutomationSequence | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    trigger_type: 'visit_completed',
  });
  const [steps, setSteps] = useState<Array<{
    step_order: number;
    action_type: string;
    delay_days: number;
    message_template_id?: string;
  }>>([]);

  useEffect(() => {
    if (profile?.id) {
      loadSequences();
    }
  }, [profile]);

  async function loadSequences() {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const data = await localDb.getAutomationSequences(profile.id);
      setSequences((data || []) as AutomationSequence[]);
    } catch (err) {
      console.error('Failed to load sequences:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!profile?.id || !formData.name.trim()) {
      toast.error('Please enter a name');
      return;
    }

    try {
      if (editingSequence) {
        await localDb.updateAutomationSequence(editingSequence.id, {
          name: formData.name,
          trigger_type: formData.trigger_type,
          steps,
        });
        toast.success('Sequence updated');
      } else {
        await localDb.createAutomationSequence({
          business_id: profile.id,
          name: formData.name,
          trigger_type: formData.trigger_type,
          steps,
        });
        toast.success('Sequence created');
      }
      setShowDialog(false);
      setEditingSequence(null);
      setFormData({ name: '', trigger_type: 'visit_completed' });
      setSteps([]);
      loadSequences();
    } catch (err) {
      console.error('Failed to save sequence:', err);
      toast.error('Failed to save sequence');
    }
  }

  async function handleToggle(seq: AutomationSequence) {
    try {
      await localDb.updateAutomationSequence(seq.id, {
        is_active: !seq.is_active,
      });
      loadSequences();
    } catch (err) {
      console.error('Failed to toggle:', err);
    }
  }

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeleteTarget(id);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await localDb.deleteAutomationSequence(deleteTarget);
      toast.success('Sequence deleted');
      loadSequences();
    } catch (err) {
      console.error('Failed to delete:', err);
    } finally {
      setDeleteTarget(null);
    }
  }

  function openEdit(seq: AutomationSequence) {
    setEditingSequence(seq);
    setFormData({
      name: seq.name,
      trigger_type: seq.trigger_type,
    });
    const seqSteps = (seq as unknown as Record<string, unknown>).steps;
    setSteps(Array.isArray(seqSteps) ? (seqSteps as typeof steps) : []);
    setShowDialog(true);
  }

  function openCreate() {
    setEditingSequence(null);
    setFormData({ name: '', trigger_type: 'visit_completed' });
    setSteps([{ step_order: 0, action_type: 'whatsapp_message', delay_days: 0 }]);
    setShowDialog(true);
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">WhatsApp Automation</h1>
      </div>

      <LockedFeature featureName="WhatsApp Automation" requiredPlan="Automation">
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-amber-800">API Charges Warning</CardTitle>
          </CardHeader>
          <CardContent className="text-amber-900 text-sm">
            WhatsApp API charges are billed separately or passed through based on provider usage. Ensure you have sufficient balance with your provider.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Automation Sequences</CardTitle>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" /> Create New Sequence
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-muted-foreground">Loading...</div>
            ) : sequences.length === 0 ? (
              <div className="text-center py-8">
                <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No automation sequences yet</p>
                <Button variant="outline" onClick={openCreate}>
                  Create your first sequence
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {sequences.map((seq) => (
                  <div
                    key={seq.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${seq.is_active ? 'bg-success/10' : 'bg-muted'}`}>
                        <Zap className={`h-5 w-5 ${seq.is_active ? 'text-success' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <p className="font-medium">{seq.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {TRIGGER_TYPES.find(t => t.value === seq.trigger_type)?.label || seq.trigger_type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggle(seq)}
                      >
                        {seq.is_active ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(seq)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(seq.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingSequence ? 'Edit Sequence' : 'Create Sequence'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Sequence Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Welcome Follow-ups"
                />
              </div>
              <div>
                <Label>Trigger</Label>
                <Select
                  value={formData.trigger_type}
                  onValueChange={(v) => setFormData({ ...formData, trigger_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Steps</Label>
                <div className="space-y-2">
                  {steps.map((step, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <span className="text-sm text-muted-foreground w-6">
                        {idx + 1}.
                      </span>
                      <Select
                        value={step.action_type}
                        onValueChange={(v) => {
                          const newSteps = [...steps];
                          newSteps[idx].action_type = v;
                          setSteps(newSteps);
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACTION_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        className="w-20"
                        value={step.delay_days}
                        onChange={(e) => {
                          const newSteps = [...steps];
                          newSteps[idx].delay_days = parseInt(e.target.value) || 0;
                          setSteps(newSteps);
                        }}
                        placeholder="Days"
                      />
                      <span className="text-sm text-muted-foreground">days</span>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setSteps([
                      ...steps,
                      {
                        step_order: steps.length,
                        action_type: 'whatsapp_message',
                        delay_days: 0,
                      },
                    ]);
                  }}
                >
                  + Add Step
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete Sequence</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this automation sequence? This action cannot be undone.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </LockedFeature>
    </div>
  );
}
