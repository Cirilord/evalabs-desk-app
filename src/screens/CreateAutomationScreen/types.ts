import { z } from 'zod';

import type { $AutomationPayload } from '@/data/sqlite/types';

import { createAutomationSchema } from './schema';

export type CreateAutomationForm = z.infer<typeof createAutomationSchema>;

export type CreateAutomationScreenProps = {
  automation?: $AutomationPayload;
};
