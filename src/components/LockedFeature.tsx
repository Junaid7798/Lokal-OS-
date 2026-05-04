import React from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';

export function LockedFeature({
  children,
  featureName,
  requiredPlan,
}: {
  children: React.ReactNode;
  featureName: string;
  requiredPlan: 'Free' | 'Founding' | 'Pro' | 'Automation';
}) {
  const navigate = useNavigate();
  const { profile } = useBusinessProfile();

  // Simple check: higher plans unlock all features
  const planOrder = { Free: 0, Founding: 1, Pro: 2, Automation: 3 };
  const requiredOrder = planOrder[requiredPlan];
  const userOrder = planOrder[profile?.plan || 'Free'];

  const isLocked = userOrder < requiredOrder;

  if (!isLocked) return <>{children}</>;

  return (
    <Card className="opacity-70 grayscale">
      <CardContent className="p-6 flex flex-col items-center gap-2">
        <Lock className="h-8 w-8 text-muted-foreground" />
        <p className="font-semibold">{featureName} is locked</p>
        <p className="text-sm text-center">
          Upgrade to {requiredPlan} to access this feature.
        </p>
        <Button onClick={() => navigate('/upgrade')}>Upgrade Plan</Button>
      </CardContent>
    </Card>
  );
}
