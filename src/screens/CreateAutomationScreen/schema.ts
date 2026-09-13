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

export const automationLibrarySchema = z.object({
  name: z.string().trim().min(1).max(200),
  version: z.string().trim().min(1).max(100),
});

export const createAutomationSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Enter a name for the automation.')
      .max(100, 'Name must contain at most 100 characters.'),
    description: z.string().trim().max(500, 'Description must contain at most 500 characters.'),
    script: z.string(),
    scriptMode: z.enum(['inline', 'file']),
    scriptFileMode: z.enum(['clone', 'external']),
    scriptPath: z.string().nullable(),
    libraries: z.array(automationLibrarySchema).max(50),
    inputs: z.array(automationInputSchema),
    outputs: z.array(automationOutputSchema),
  })
  .superRefine((automation, context) => {
    if (automation.scriptMode === 'file') {
      if (!automation.scriptPath?.trim()) {
        context.addIssue({
          code: 'custom',
          message: 'Choose a Python file.',
          path: ['scriptPath'],
        });
      }

      return;
    }

    const script = automation.script.trim();
    const mainFunctions = script.match(/\bdef\s+main\s*\([^)]*\)/g) ?? [];

    if (!script) {
      context.addIssue({
        code: 'custom',
        message: 'Enter the automation script.',
        path: ['script'],
      });
    } else if (mainFunctions.length === 0) {
      context.addIssue({
        code: 'custom',
        message: 'Define a main function.',
        path: ['script'],
      });
    } else if (mainFunctions.length > 1) {
      context.addIssue({
        code: 'custom',
        message: 'Define only one main function.',
        path: ['script'],
      });
    } else if (automation.inputs.length > 0 && !/\bdef\s+main\s*\(\s*inputs\b/.test(script)) {
      context.addIssue({
        code: 'custom',
        message: 'Define main(inputs) when this automation has inputs.',
        path: ['script'],
      });
    } else if (/\binput\s*\(/.test(script)) {
      context.addIssue({
        code: 'custom',
        message: 'input() is not supported. Define an automation input instead.',
        path: ['script'],
      });
    }
  });
