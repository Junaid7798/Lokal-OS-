import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { isSupabaseConfigured, saveSupabaseConfig } from '@/lib/supabaseClient';

/**
 * Supabase setup page.
 * Shows connection status and allows updating credentials.
 */
export default function SetupSupabase() {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  const isConfigured = isSupabaseConfigured();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !key) return;

    saveSupabaseConfig(url.trim(), key.trim());
    setStatus('saved');

    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="flex bg-gray-50 h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Supabase Connection</CardTitle>
          <CardDescription>
            {isConfigured
              ? 'Your Supabase is connected. Update credentials below if needed.'
              : 'Connect Supabase to enable Campaigns, Leads, Loyalty, and Revenue features.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'saved' && (
            <div className="p-2 bg-green-50 text-green-700 rounded mb-4">
              Saved! Reloading...
            </div>
          )}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Supabase URL</Label>
              <Input
                id="url"
                placeholder="https://xxxxxx.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="key">Supabase Anon Key</Label>
              <Input
                id="key"
                placeholder="eyJhb..."
                value={key}
                onChange={(e) => setKey(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              {isConfigured ? 'Update Connection' : 'Connect'}
            </Button>
            {isConfigured && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => (window.location.href = '/')}
              >
                Go to Dashboard
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
