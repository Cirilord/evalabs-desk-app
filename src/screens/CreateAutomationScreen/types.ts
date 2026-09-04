import { z } from 'zod';

import { createAutomationSchema } from './schema';

export type CreateAutomationForm = z.infer<typeof createAutomationSchema>;

export type CreateAutomationScreenProps = Record<string, never>;
