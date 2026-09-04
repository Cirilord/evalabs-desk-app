export const queryKeys = {
  automations: ['automations'],
  automation: (id: string) => ['automations', id] as const,
} as const;
