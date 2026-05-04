import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useBusinessProfile } from '../hooks/useBusinessProfile';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import Papa from 'papaparse';

export default function DataManagement() {
  const { profile } = useBusinessProfile();
  const [importData, setImportData] = useState<any[]>([]);
  const [preview, setPreview] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setImportData(results.data);
        setPreview(results.data.slice(0, 10));
      },
    });
  };

  const importCustomers = async () => {
    if (!profile?.id) return;

    let imported = 0;
    let skipped = 0;
    let failed = 0;

    for (const row of importData) {
      if (!row.name || !row.phone) {
        failed++;
        continue;
      }

      // Check duplicate
      const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .eq('business_id', profile.id)
        .eq('phone', row.phone);

      if (existing && existing.length > 0) {
        skipped++;
        continue;
      }

      const { data: customer, error } = await supabase
        .from('customers')
        .insert({
          business_id: profile.id,
          name: row.name,
          phone: row.phone,
          source: row.source,
          note: row.notes,
        })
        .select()
        .single();

      if (error) {
        failed++;
        continue;
      }

      if (row.last_visit_date && customer) {
        await supabase.from('visits').insert({
          business_id: profile.id,
          customer_id: customer.id,
          service_category: row.service_category,
          visit_date: row.last_visit_date,
        });
      }
      imported++;
    }
    toast.success(
      `Import finished: ${imported} imported, ${skipped} skipped, ${failed} failed.`
    );
    setImportData([]);
    setPreview([]);
  };

  const exportCustomers = async () => {
    if (!profile?.id) return;

    const { data: customers } = await supabase
      .from('customers')
      .select('name, phone, source, opt_out, review_status, visits(visit_date)')
      .eq('business_id', profile.id);

    if (!customers) return;

    const csvContent = customers.map((c) => ({
      Name: c.name,
      Phone: c.phone,
      Source: c.source,
      'Opt Out': c.opt_out,
      'Review Status': c.review_status,
      'Visit Count': c.visits?.length || 0,
      'Last Visit': c.visits?.length ? c.visits[0].visit_date : '',
    }));

    const csv = Papa.unparse(csvContent);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'customers.csv');
    link.click();
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Import/Export Data</h1>

      <Card>
        <CardHeader>
          <CardTitle>Import Customers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <input type="file" accept=".csv" onChange={handleFileUpload} />
          {preview.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <pre className="text-xs bg-muted p-2">
                  {JSON.stringify(preview, null, 2)}
                </pre>
              </div>
              <Button onClick={importCustomers}>Confirm Import</Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Export Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={exportCustomers}>Download CSV</Button>
        </CardContent>
      </Card>
    </div>
  );
}
