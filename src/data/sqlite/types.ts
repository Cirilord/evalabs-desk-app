export type $AutomationPayload = {
  id: string;
  name: string;
  description: string;
  script: string;
  scriptSource: AutomationScriptSource;
  scriptPath: string | null;
  libraries: AutomationLibrary[];
  inputs: AutomationInput[];
  outputs: AutomationOutput[];
  createdAt: string;
  updatedAt: string;
};

export type AutomationDatabaseRecord = Omit<
  $AutomationPayload,
  'inputs' | 'outputs' | 'libraries'
> & {
  inputsJson: string;
  librariesJson: string;
  outputsJson: string;
};

export type AutomationInput = {
  name: string;
  type: AutomationInputType;
  description: string;
  required: boolean;
};

export type AutomationInputType = 'text' | 'file' | 'number' | 'boolean';

export type AutomationScriptSource = 'inline' | 'file';

export type AutomationLibrary = {
  name: string;
  version: string;
};

export type AutomationOutput = {
  name: string;
  type: AutomationInputType;
  description: string;
};

export type AutomationCreateArgs = {
  data: AutomationCreateInput;
};

export type AutomationCreateInput = {
  name: string;
  description: string;
  script: string;
  scriptSource: AutomationScriptSource;
  scriptPath: string | null;
  libraries: AutomationLibrary[];
  inputs: AutomationInput[];
  outputs: AutomationOutput[];
};

export type AutomationFindUniqueArgs = {
  where: AutomationWhereInput;
};

export type AutomationFindUniqueOrThrowArgs = AutomationFindUniqueArgs;

export type AutomationDeleteArgs = {
  where: AutomationWhereInput;
};

export type AutomationUpdateArgs = {
  where: AutomationWhereInput;
  data: AutomationCreateInput;
};

export type AutomationWhereInput = {
  id: string;
};

export type RunStatus = 'running' | 'succeeded' | 'failed';

export type $RunPayload = {
  id: string;
  automationId: string;
  status: RunStatus;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  logs: string;
  error: string;
  runnerVersion: string;
  startedAt: string;
  finishedAt: string | null;
};

export type RunDatabaseRecord = Omit<$RunPayload, 'inputs' | 'outputs'> & {
  inputsJson: string;
  outputsJson: string;
};

export type RunFindManyArgs = {
  where: {
    automationId: string;
  };
};
