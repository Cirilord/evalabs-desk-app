import { z } from 'zod';

export const createAutomationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter a name for the automation.')
    .max(100, 'Name must contain at most 100 characters.'),
  description: z.string().trim().max(500, 'Description must contain at most 500 characters.'),
});
