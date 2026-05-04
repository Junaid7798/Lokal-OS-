import React, { useEffect, useState } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { useColorTheme } from '@/hooks/useColorTheme';

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  // Apply color theme globally
  useColorTheme();
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
