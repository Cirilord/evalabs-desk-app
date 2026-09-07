import type { ReactNode } from 'react';

import type { TelemetryPreference } from '@/lib/analytics';

export type TelemetryProviderProps = {
  children: ReactNode;
};

export type TelemetryContextValue = {
  telemetry: TelemetryPreference;
  setTelemetry: (telemetry: TelemetryPreference) => void;
};
