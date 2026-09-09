import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { translations } from '@/components/shared/LocaleProvider/translations';
import type { Locale } from '@/components/shared/LocaleProvider/translations';

const LOCALE_STORAGE_KEY = 'eva-labs-locale';

function getInitialLocale(): Locale {
  const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);

  if (storedLocale === 'en-US' || storedLocale === 'pt-BR') {
    return storedLocale;
  }

  if (storedLocale === 'en') {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, 'en-US');
    return 'en-US';
  }

  return window.navigator.language.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en-US';
}

void i18n.use(initReactI18next).init({
  fallbackLng: 'en-US',
  interpolation: { escapeValue: false },
  keySeparator: false,
  lng: getInitialLocale(),
  resources: {
    'en-US': { translation: translations['en-US'] },
    'pt-BR': { translation: translations['pt-BR'] },
  },
});

i18n.on('languageChanged', (locale) => {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  document.documentElement.lang = locale;
});

export default i18n;
