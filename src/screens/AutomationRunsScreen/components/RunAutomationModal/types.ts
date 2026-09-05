import type { $AutomationPayload } from '@/data/sqlite/types';

export type RunAutomationModalProps = {
  automation: $AutomationPayload;
  isRunning: boolean;
  onOpenChange: (open: boolean) => void;
  onRun: (inputs: Record<string, unknown>) => Promise<void>;
  open: boolean;
};
