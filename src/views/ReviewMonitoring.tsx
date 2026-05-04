import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LockedFeature } from '@/components/LockedFeature';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ReviewMonitoring() {
  // Placeholder connection state
  const [integrationStatus, setIntegrationStatus] = useState<
    'not_connected' | 'connected' | 'error'
  >('not_connected');

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Review Monitoring</h1>

      <LockedFeature featureName="Reviews Module" requiredPlan="Pro">
        {/* Integration Status Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Google Business Profile</CardTitle>
            <div
              className={`px-2 py-1 rounded text-sm ${
                integrationStatus === 'connected'
                  ? 'bg-success/10 text-success'
                  : integrationStatus === 'error'
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {integrationStatus.charAt(0).toUpperCase() +
                integrationStatus.slice(1)}
            </div>
          </CardHeader>
          <CardContent>
            {integrationStatus === 'not_connected' && (
              <Button onClick={() => setIntegrationStatus('connected')}>
                Connect Google Business Profile
              </Button>
            )}
            {integrationStatus === 'connected' && (
              <div className="flex gap-2">
                <Button variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" /> Manual Sync
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dashboard/Reviews List would go here */}
        {integrationStatus === 'connected' && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                List of reviews will appear here.
              </p>
            </CardContent>
          </Card>
        )}
      </LockedFeature>
    </div>
  );
}
