import type { $RunPayload } from '@/data/sqlite/types';

export type RunDetailsModalProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  run: $RunPayload;
};
