import { Label } from '../ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Palette } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useColorTheme } from '../../hooks/useColorTheme';
import type { AppTheme } from '../../hooks/useColorTheme';

export function BrandingSettings() {
  const { theme, setTheme } = useTheme();
  const { colorTheme, setColorTheme } = useColorTheme();

  const themes = [
    {
      name: 'Minimal (Default)',
      value: 'default',
      colorClass: 'bg-zinc-900 dark:bg-zinc-100',
      desc: 'Geist, Zinc, 0.6rem rounded',
    },
    {
      name: 'Playful',
      value: 'theme-playful',
      colorClass: 'bg-violet-600',
      desc: 'Space Grotesk, Violet, highly rounded',
    },
    {
      name: 'Elegant',
      value: 'theme-elegant',
      colorClass: 'bg-stone-600',
      desc: 'Playfair, Muted Gold, slightly rounded',
    },
    {
      name: 'Modern',
      value: 'theme-modern',
      colorClass: 'bg-emerald-500',
      desc: 'Outfit, Emerald, rounded',
    },
    {
      name: 'Retro / Mono',
      value: 'theme-mono',
      colorClass: 'bg-orange-600',
      desc: 'JetBrains Mono, Orange, sharp corners',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" /> Appearance
        </CardTitle>
        <CardDescription>
          Customize the look and feel of your app.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Theme Mode</Label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              onClick={() => setTheme('light')}
              className="w-full text-sm"
            >
              Light
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              onClick={() => setTheme('dark')}
              className="w-full text-sm"
            >
              Dark
            </Button>
            <Button
              variant={theme === 'system' ? 'default' : 'outline'}
              onClick={() => setTheme('system')}
              className="w-full text-sm"
            >
              System
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>App Vibe & Feel</Label>
          <div className="flex flex-wrap gap-2">
            {themes.map((c) => (
              <button
                key={c.value}
                onClick={() => setColorTheme(c.value as AppTheme)}
                className={`flex items-center gap-3 p-3 w-full text-left rounded-xl border-2 transition-all ${
                  colorTheme === c.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div
                  className={`w-8 h-8 shrink-0 rounded-full ${c.colorClass}`}
                />
                <div>
                  <p className="font-medium text-sm">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}