import { useState, useEffect } from 'react';
import { localDb } from '@/lib/localDb';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Location } from '@/types';

export default function Locations() {
  const { profile } = useBusinessProfile();
  const [locations, setLocations] = useState<Location[]>([]);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) loadLocations();
  }, [profile]);

  async function loadLocations() {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const data = await localDb.getLocations(profile.id);
      setLocations(data as unknown as Location[]);
    } catch (err) {
      console.error('Failed to load locations:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || !name.trim()) {
      toast.error('Please enter a location name');
      return;
    }

    try {
      await localDb.addLocation(profile.id, {
        name: name.trim(),
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      toast.success('Location added');
      setName('');
      setAddress('');
      setPhone('');
      loadLocations();
    } catch (err) {
      toast.error('Failed to add location');
      console.error(err);
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      await localDb.updateLocation(id, { active });
      setLocations((prev) =>
        prev.map((l) => (l.id === id ? { ...l, active } : l))
      );
      toast.success(active ? 'Location activated' : 'Location deactivated');
    } catch (err) {
      toast.error('Failed to update location');
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-3xl mx-auto pb-12">
      <h1 className="text-2xl font-bold">Manage Locations</h1>

      <Card>
        <CardHeader>
          <CardTitle>Add New Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="locName">Location Name</Label>
              <Input
                id="locName"
                placeholder="e.g. Downtown Branch"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locAddress">Address</Label>
              <Input
                id="locAddress"
                placeholder="Full Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locPhone">Phone</Label>
              <Input
                id="locPhone"
                placeholder="Contact phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <Button type="submit">Add Location</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Locations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : locations.length === 0 ? (
            <p className="text-muted-foreground">No locations yet.</p>
          ) : (
            locations.map((loc) => (
              <div
                key={loc.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{loc.name}</p>
                  {loc.address && (
                    <p className="text-sm text-muted-foreground">{loc.address}</p>
                  )}
                  {loc.phone && (
                    <p className="text-sm text-muted-foreground">{loc.phone}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant={loc.active ? 'outline' : 'default'}
                  onClick={() => toggleActive(loc.id, !loc.active)}
                >
                  {loc.active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
