'use client';

import { useEffect } from 'react';
import { useAppKitTheme } from '@reown/appkit/react';

export default function AppKitThemeCustomizer() {
  const { setThemeMode, setThemeVariables } = useAppKitTheme();

  useEffect(() => {
    setThemeMode('dark'); // or 'light'

    setThemeVariables({
      '--w3m-color-mix': '#141414', // your brand accent (neon green)
      '--w3m-color-mix-strength': 50, // controls mix strength with background
      '--w3m-font-family': 'DM Sans, sans-serif',
    });
  }, [setThemeMode, setThemeVariables]);

  return null; // This component just applies the theme globally
}
