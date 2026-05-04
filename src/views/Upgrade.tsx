import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Check } from 'lucide-react';

export default function Upgrade() {
  const plans = [
    {
      name: 'Free',
      price: '0',
      features: [
        '50 Customers',
        '30 WhatsApp Actions/mo',
        'Basic Follow-up',
        'Review QR',
      ],
    },
    {
      name: 'Founding',
      price: '999',
      features: [
        '500 Customers',
        '500 WhatsApp Actions/mo',
        'Inactive Customer List',
        'Daily Report',
      ],
    },
    {
      name: 'Pro',
      price: '2999',
      features: [
        '2000 Customers',
        '2000 WhatsApp Actions/mo',
        'Weekly Report',
        'Staff Activity',
        'CSV Import/Export',
      ],
    },
  ];

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Upgrade Your Plan</h1>
      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((p) => (
          <Card key={p.name} className="flex flex-col">
            <CardHeader>
              <CardTitle>{p.name}</CardTitle>
              <p className="text-3xl font-bold">
                ₹{p.price}
                <span className="text-sm font-normal">/mo</span>
              </p>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" /> {f}
                  </li>
                ))}
              </ul>
            </CardContent>
            <div className="p-4">
              <Button className="w-full">Choose {p.name}</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
