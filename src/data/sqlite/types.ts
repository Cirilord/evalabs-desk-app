export type $AutomationPayload = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type AutomationCreateArgs = {
  data: AutomationCreateInput;
};

export type AutomationCreateInput = {
  name: string;
  description: string;
};

export type AutomationFindUniqueArgs = {
  where: AutomationWhereInput;
};

export type AutomationFindUniqueOrThrowArgs = AutomationFindUniqueArgs;

export type AutomationWhereInput = {
  id: string;
};
