import { z } from 'zod';

export const automationInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter an input name.')
    .max(100, 'Input names must contain at most 100 characters.')
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Use letters, numbers, and underscores only.'),
  type: z.enum(['text', 'file', 'number', 'boolean']),
  description: z.string().trim().max(500, 'Description must contain at most 500 characters.'),
  required: z.boolean(),
});

export const automationOutputSchema = automationInputSchema.omit({ required: true });

export const createAutomationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter a name for the automation.')
    .max(100, 'Name must contain at most 100 characters.'),
  description: z.string().trim().max(500, 'Description must contain at most 500 characters.'),
  script: z
    .string()
    .trim()
    .min(1, 'Enter the automation script.')
    .regex(/\bdef\s+process\s*\(/, 'Define a process(inputs) function.'),
  inputs: z.array(automationInputSchema),
  outputs: z.array(automationOutputSchema),
});
