import type { ReactElement } from 'react';

export type PythonInterpreter = {
  name: string;
  path: string;
  version: string;
};

export type PythonRunner = {
  version: string;
  path: string | null;
  installed: boolean;
  active: boolean;
};

export type CodeEditor = {
  id: string;
  name: string;
  installed: boolean;
};

export type SettingsModalProps = {
  trigger: ReactElement;
};
