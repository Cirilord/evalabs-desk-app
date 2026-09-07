import type { ResolvedTheme, ThemePreference } from './types';

const THEME_STORAGE_KEY = 'eva-labs-theme';

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function getThemePreference(): ThemePreference {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

  return isThemePreference(storedTheme) ? storedTheme : 'system';
}

function getResolvedTheme(theme: ThemePreference): ResolvedTheme {
  if (theme !== 'system') {
    return theme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: ThemePreference): ResolvedTheme {
  const resolvedTheme = getResolvedTheme(theme);
  document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  document.documentElement.style.colorScheme = resolvedTheme;

  return resolvedTheme;
}

export function initializeTheme() {
  applyTheme(getThemePreference());
}

export function storeThemePreference(theme: ThemePreference) {
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}
