import { useQuery } from '@tanstack/react-query';
import { PlayIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { queryKeys } from '@/data/queryKeys';
import sqlite from '@/data/sqlite';

import { RunAutomationModal } from './components/RunAutomationModal';

export function AutomationRunsScreen() {
  const { automationId } = useParams();
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
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

  return (
    <main className="flex-1 p-6 sm:p-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{automation.name}</h1>
            {automation.description ? (
              <p className="mt-2 text-sm text-muted-foreground">{automation.description}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" onClick={() => setIsRunModalOpen(true)}>
              <PlayIcon data-icon="inline-start" />
              Run automation
            </Button>
            <Button type="button" variant="destructive">
              <Trash2Icon data-icon="inline-start" />
              Delete automation
            </Button>
          </div>
        </header>

        <section className="flex flex-col gap-4" aria-labelledby="runs-heading">
          <div>
            <h2 id="runs-heading" className="text-lg font-semibold">
              Runs
            </h2>
            <p className="text-sm text-muted-foreground">
              A history of every execution of this automation.
            </p>
          </div>

          <div className="rounded-lg border bg-background px-5 py-10 text-center">
            <p className="font-medium">No runs yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Run this automation to create its first execution.
            </p>
          </div>
        </section>
      </div>
      <RunAutomationModal
        automation={automation}
        open={isRunModalOpen}
        onOpenChange={setIsRunModalOpen}
      />
    </main>
  );
}
