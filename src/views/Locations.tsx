import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export default function Locations() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Manage Locations</h1>
      <Card>
        <CardHeader>
          <CardTitle>Add New Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Location Name</Label>
            <Input placeholder="e.g. Downtown Branch" />
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input placeholder="Full Address" />
          </div>
          <Button>Add Location</Button>
        </CardContent>
      </Card>
    </div>
  );
}
