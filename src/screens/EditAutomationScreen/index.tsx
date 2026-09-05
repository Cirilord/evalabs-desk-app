import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

import { queryKeys } from '@/data/queryKeys';
import sqlite from '@/data/sqlite';
import { CreateAutomationScreen } from '@/screens/CreateAutomationScreen';

import type { EditAutomationScreenProps } from './types';

export function EditAutomationScreen(props: EditAutomationScreenProps) {
  void props;
  const { automationId } = useParams();
  const { data: automation, isLoading } = useQuery({
    queryKey: queryKeys.automation(automationId ?? ''),
    queryFn: () => sqlite.automation.findUnique({ where: { id: automationId ?? '' } }),
    enabled: Boolean(automationId),
  });

  if (isLoading) {
    return <main className="flex-1 p-6 sm:p-10">Loading automation...</main>;
  }

  if (!automation) {
    return (
      <main className="flex-1 p-6 sm:p-10">
        <p className="text-sm text-muted-foreground">Automation not found.</p>
      </main>
    );
  }

  return <CreateAutomationScreen automation={automation} />;
}
