import type { AutomationLibrary } from '@/data/sqlite/types';

export type LibraryComboboxProps = {
  libraries: AutomationLibrary[];
  onChange: (libraries: AutomationLibrary[]) => void;
};
