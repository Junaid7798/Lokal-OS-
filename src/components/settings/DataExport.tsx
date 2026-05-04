import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Download } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { exportToCSV } from '../../lib/exportUtils';

interface DataExportProps {
  profile: { id: string } | null;
}

export function DataExport({ profile }: DataExportProps) {
  const handleExportCustomers = async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', profile.id);
    if (data) {
      exportToCSV(data, 'customers', Object.keys(data[0] || {}));
      await supabase.from('export_logs').insert([
        {
          business_id: profile.id,
          export_type: 'customers',
          exported_by: (await supabase.auth.getUser()).data.user!.id,
        },
      ]);
    }
  };

  const handleExportVisits = async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('visits')
      .select('*')
      .eq('business_id', profile.id);
    if (data) {
      exportToCSV(data, 'visits', Object.keys(data[0] || {}));
      await supabase.from('export_logs').insert([
        {
          business_id: profile.id,
          export_type: 'visits',
          exported_by: (await supabase.auth.getUser()).data.user!.id,
        },
      ]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Export</CardTitle>
        <CardDescription>
          Download your data as CSV for Google Sheets.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          className="w-full justify-start"
          variant="outline"
          onClick={handleExportCustomers}
        >
          <Download className="h-4 w-4 mr-2" /> Export Customers CSV
        </Button>
        <Button
          className="w-full justify-start"
          variant="outline"
          onClick={handleExportVisits}
        >
          <Download className="h-4 w-4 mr-2" /> Export Visits CSV
        </Button>
        <p className="text-sm text-center text-muted-foreground pt-4">
          "Open this file in Google Sheets or Excel."
        </p>
      </CardContent>
    </Card>
  );
}