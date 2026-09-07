import { useEffect, useState } from 'react';

import {
  getTelemetryPreference,
  initializeAnalytics,
  setTelemetryPreference,
} from '@/lib/analytics';
import type { TelemetryPreference } from '@/lib/analytics';

import { TelemetryContext } from './context';
import type { TelemetryProviderProps } from './types';

export function TelemetryProvider(props: TelemetryProviderProps) {
  const { children } = props;
  const [telemetry, setTelemetryState] = useState<TelemetryPreference>(getTelemetryPreference);

  useEffect(() => {
    initializeAnalytics();
  }, []);

  function setTelemetry(preference: TelemetryPreference) {
    setTelemetryPreference(preference);
    setTelemetryState(preference);
  }

  return (
    <TelemetryContext.Provider value={{ telemetry, setTelemetry }}>
      {children}
    </TelemetryContext.Provider>
  );
}
