import type { ReactElement } from 'react';

export type PythonInterpreter = {
  name: string;
  path: string;
  version: string;
};

export type SettingsModalProps = {
  trigger: ReactElement;
};
