export const queryKeys = {
  automations: ['automations'],
  automation: (id: string) => ['automations', id] as const,
  runs: (automationId: string) => ['automations', automationId, 'runs'] as const,
  latestRuns: ['automations', 'latest-runs'] as const,
  pythonInterpreter: ['interpreters', 'python'],
  pythonRunners: ['runners', 'python'],
} as const;
