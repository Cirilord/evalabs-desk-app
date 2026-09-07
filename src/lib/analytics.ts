export type TelemetryPreference = 'enabled' | 'disabled';

type AnalyticsParameters = Record<string, boolean | number | string | undefined>;

const TELEMETRY_STORAGE_KEY = 'eva-labs-telemetry';
const measurementId = import.meta.env['VITE_GA_MEASUREMENT_ID'];

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...arguments_: unknown[]) => void;
  }
}

function isTelemetryPreference(value: string | null): value is TelemetryPreference {
  return value === 'enabled' || value === 'disabled';
}

function isAnalyticsAvailable() {
  return Boolean(measurementId);
}

function isAnalyticsEnabled() {
  return isAnalyticsAvailable() && getTelemetryPreference() === 'enabled';
}

function setGoogleAnalyticsDisabled(disabled: boolean) {
  if (measurementId) {
    Reflect.set(window, `ga-disable-${measurementId}`, disabled);
  }
}

function ensureAnalyticsIsLoaded() {
  if (!isAnalyticsEnabled() || !measurementId) {
    return;
  }

  setGoogleAnalyticsDisabled(false);
  window.dataLayer ??= [];
  window.gtag ??= function gtag() {
    // Google Tag expects the native Arguments object in dataLayer.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer?.push(arguments);
  };

  if (document.querySelector(`script[data-ga-measurement-id="${measurementId}"]`)) {
    return;
  }

  window.gtag('js', new Date());
  window.gtag('consent', 'default', { analytics_storage: 'granted' });
  window.gtag('config', measurementId, { send_page_view: false });

  const script = document.createElement('script');
  script.async = true;
  script.dataset['gaMeasurementId'] = measurementId;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.append(script);
}

export function getTelemetryPreference(): TelemetryPreference {
  const preference = window.localStorage.getItem(TELEMETRY_STORAGE_KEY);

  return isTelemetryPreference(preference) ? preference : 'enabled';
}

export function setTelemetryPreference(preference: TelemetryPreference) {
  window.localStorage.setItem(TELEMETRY_STORAGE_KEY, preference);

  if (preference === 'disabled') {
    setGoogleAnalyticsDisabled(true);
    window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
    return;
  }

  ensureAnalyticsIsLoaded();
}

export function initializeAnalytics() {
  setGoogleAnalyticsDisabled(!isAnalyticsEnabled());

  if (isAnalyticsEnabled()) {
    ensureAnalyticsIsLoaded();
  }
}

export function trackEvent(name: string, parameters?: AnalyticsParameters) {
  if (!isAnalyticsEnabled()) {
    return;
  }

  ensureAnalyticsIsLoaded();
  window.gtag?.('event', name, parameters);
}

export function trackPageView(path: string) {
  trackEvent('page_view', {
    page_location: `eva-labs://app${path}`,
    page_path: path,
    page_title: document.title,
  });
}
