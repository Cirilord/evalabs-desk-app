import type { $AutomationPayload } from '@/data/sqlite/types';

export type RunAutomationModalProps = {
  automation: $AutomationPayload;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};
