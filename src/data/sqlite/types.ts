export type $AutomationPayload = {
  id: string;
  name: string;
  description: string;
  script: string;
  inputs: AutomationInput[];
  outputs: AutomationOutput[];
  createdAt: string;
  updatedAt: string;
};

export type AutomationDatabaseRecord = Omit<$AutomationPayload, 'inputs' | 'outputs'> & {
  inputsJson: string;
  outputsJson: string;
};

export type AutomationInput = {
  name: string;
  type: AutomationInputType;
  description: string;
  required: boolean;
};

export type AutomationInputType = 'text' | 'file' | 'number' | 'boolean';

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
  startedAt: string;
  finishedAt: string | null;
};

export type RunDatabaseRecord = Omit<$RunPayload, 'inputs' | 'outputs'> & {
  inputsJson: string;
  outputsJson: string;
};

export type RunCreateArgs = {
  data: {
    automationId: string;
    inputs: Record<string, unknown>;
  };
};

export type RunCompleteArgs = {
  where: {
    id: string;
  };
  data: {
    status: Exclude<RunStatus, 'running'>;
    outputs: Record<string, unknown>;
    logs: string;
    error: string;
  };
};

export type RunFindManyArgs = {
  where: {
    automationId: string;
  };
};
