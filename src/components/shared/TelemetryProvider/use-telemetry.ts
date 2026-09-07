import { useContext } from 'react';

import { TelemetryContext } from './context';

export function useTelemetry() {
  const telemetry = useContext(TelemetryContext);

  if (!telemetry) {
    throw new Error('useTelemetry must be used within TelemetryProvider.');
  }

  return telemetry;
}
