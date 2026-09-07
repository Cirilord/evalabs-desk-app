import { useEffect, useState } from 'react';

import { ThemeContext } from './context';
import { applyTheme, getThemePreference, storeThemePreference } from './theme';
import type { ResolvedTheme, ThemePreference, ThemeProviderProps } from './types';

export function ThemeProvider(props: ThemeProviderProps) {
  const { children } = props;
  const [theme, setThemeState] = useState<ThemePreference>(getThemePreference);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => applyTheme(theme));

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateTheme = () => setResolvedTheme(applyTheme(theme));

    updateTheme();
    mediaQuery.addEventListener('change', updateTheme);

    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [theme]);

  function setTheme(nextTheme: ThemePreference) {
    storeThemePreference(nextTheme);
    setThemeState(nextTheme);
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
