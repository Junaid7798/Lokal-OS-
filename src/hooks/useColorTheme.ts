import { useEffect, useState } from 'react';

export type AppTheme =
  | 'default'
  | 'theme-playful'
  | 'theme-elegant'
  | 'theme-mono'
  | 'theme-modern';

export function useColorTheme() {
  const [colorTheme, setColorTheme] = useState<AppTheme>(() => {
    return (
      (localStorage.getItem('deskTracker_colorTheme') as AppTheme) || 'default'
    );
  });

  useEffect(() => {
    localStorage.setItem('deskTracker_colorTheme', colorTheme);
    const html = document.documentElement;
    html.classList.remove(
      'theme-playful',
      'theme-elegant',
      'theme-mono',
      'theme-modern'
    );
    if (colorTheme !== 'default') {
      html.classList.add(colorTheme);
    }
  }, [colorTheme]);

  return { colorTheme, setColorTheme };
}
