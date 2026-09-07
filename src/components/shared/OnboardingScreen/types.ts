export type OnboardingScreenProps = {
  onComplete: () => void;
};

type PythonInterpreter = {
  path: string;
  version: string;
};

type PythonRunner = {
  version: string;
  path: string | null;
  installed: boolean;
  active: boolean;
};

export type { PythonInterpreter, PythonRunner };
