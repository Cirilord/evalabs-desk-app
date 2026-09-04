import type { $AutomationPayload } from '@/data/sqlite/types';

export type AppSidebarProps = {
  automations: $AutomationPayload[];
  isLoading: boolean;
  loadError: string | null;
};
