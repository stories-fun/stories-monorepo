'use client';

import { useEffect, useRef } from 'react';
import { useAppKitTheme } from '@reown/appkit/react';

export default function AppKitThemeCustomizer() {
  const { setThemeMode, setThemeVariables } = useAppKitTheme();
  const hasSetTheme = useRef(false);

  useEffect(() => {
    if (hasSetTheme.current) return;
    hasSetTheme.current = true;

    setThemeMode('dark');
    setThemeVariables({
      '--w3m-color-mix': '#141414',
      '--w3m-color-mix-strength': 50,
    });
  }, [setThemeMode, setThemeVariables]);

  return null;
}
