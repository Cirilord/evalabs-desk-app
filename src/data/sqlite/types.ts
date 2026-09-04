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

export type AutomationWhereInput = {
  id: string;
};
