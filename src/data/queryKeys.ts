export const queryKeys = {
  automations: ['automations'],
  automation: (id: string) => ['automations', id] as const,
  pythonInterpreter: ['interpreters', 'python'],
} as const;
