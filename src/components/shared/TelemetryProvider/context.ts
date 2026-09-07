import { createContext } from 'react';

import type { TelemetryContextValue } from './types';

export const TelemetryContext = createContext<TelemetryContextValue | null>(null);
