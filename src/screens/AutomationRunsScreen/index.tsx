import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import {
  CopyIcon,
  InfoIcon,
  LoaderCircleIcon,
  PencilIcon,
  PlayIcon,
  Trash2Icon,
} from 'lucide-react';
import { AlertDialog } from 'radix-ui';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { queryKeys } from '@/data/queryKeys';
import sqlite from '@/data/sqlite';
import type { $AutomationPayload, $RunPayload } from '@/data/sqlite/types';

import { RunAutomationModal } from './components/RunAutomationModal';
import { RunDetailsModal } from './components/RunDetailsModal';

function normalizeInputs(automation: $AutomationPayload, values: Record<string, unknown>) {
  return Object.fromEntries(
    automation.inputs.map((input) => {
      const value = values[input.name];

      return [input.name, input.type === 'number' && value !== '' ? Number(value) : value];
    })
  );
}

function getRunStatusLabel(status: $RunPayload['status']) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getCloneName(name: string) {
  const suffix = ' copy';

  return `${name.slice(0, 100 - suffix.length).trimEnd()}${suffix}`;
}

export function AutomationRunsScreen() {
  const { automationId } = useParams();
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRun, setSelectedRun] = useState<$RunPayload | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    void listen<{ automationId: string }>('run:updated', ({ payload }) => {
      if (payload.automationId === automationId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.runs(automationId ?? '') });
      }
    }).then((dispose) => {
      unlisten = dispose;
    });

    return () => unlisten?.();
  }, [automationId, queryClient]);
  const { data: automation, isLoading } = useQuery({
    queryKey: queryKeys.automation(automationId ?? ''),
    queryFn: () => sqlite.automation.findUnique({ where: { id: automationId ?? '' } }),
    enabled: Boolean(automationId),
  });
  const { data: runs = [], isLoading: isLoadingRuns } = useQuery({
    queryKey: queryKeys.runs(automationId ?? ''),
    queryFn: () => sqlite.run.findMany({ where: { automationId: automationId ?? '' } }),
    enabled: Boolean(automationId),
  });
  const deleteAutomation = useMutation({
    mutationFn: () => sqlite.automation.delete({ where: { id: automationId ?? '' } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.automations });
      await navigate('/');
    },
  });
  const cloneAutomation = useMutation({
    mutationFn: (automation: $AutomationPayload) =>
      sqlite.automation.create({
        data: {
          name: getCloneName(automation.name),
          description: automation.description,
          script: automation.script,
          scriptSource: automation.scriptSource,
          scriptPath: automation.scriptPath,
          inputs: automation.inputs,
          outputs: automation.outputs,
        },
      }),
    onSuccess: async (clonedAutomation) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.automations });
      await navigate(`/automations/${clonedAutomation.id}`);
    },
  });
  const runAutomation = useMutation({
    mutationFn: async ({
      automation,
      inputs,
    }: {
      automation: $AutomationPayload;
      inputs: Record<string, unknown>;
    }) => {
      await invoke('start_automation_run', {
        automationId: automation.id,
        script: automation.script,
        scriptSource: automation.scriptSource,
        scriptPath: automation.scriptPath,
        outputs: automation.outputs,
        inputs,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.runs(automationId ?? '') });
    },
  });

  async function handleRun(values: Record<string, unknown>) {
    if (!automation) {
      throw new Error('Automation not found.');
    }

    await runAutomation.mutateAsync({
      automation,
      inputs: normalizeInputs(automation, values),
    });
  }

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
            <Button type="button" variant="outline" asChild>
              <Link to={`/automations/${automation.id}/edit`}>
                <PencilIcon data-icon="inline-start" />
                Edit automation
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={cloneAutomation.isPending}
              onClick={() => cloneAutomation.mutate(automation)}
            >
              <CopyIcon data-icon="inline-start" />
              {cloneAutomation.isPending ? 'Cloning...' : 'Clone automation'}
            </Button>
            <Button type="button" onClick={() => setIsRunModalOpen(true)}>
              <PlayIcon data-icon="inline-start" />
              Run automation
            </Button>
            <Button type="button" variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
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

          {isLoadingRuns ? (
            <p className="text-sm text-muted-foreground">Loading runs...</p>
          ) : runs.length === 0 ? (
            <div className="rounded-lg border bg-background px-5 py-10 text-center">
              <p className="font-medium">No runs yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Run this automation to create its first execution.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border bg-background">
              {runs.map((run) => (
                <article key={run.id} className="border-b px-5 py-4 last:border-b-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{getRunStatusLabel(run.status)}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(run.startedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {run.finishedAt ? (
                        <span className="text-sm text-muted-foreground">
                          Finished {new Date(run.finishedAt).toLocaleTimeString()}
                        </span>
                      ) : null}
                      {run.status === 'running' ? (
                        <LoaderCircleIcon className="animate-spin text-muted-foreground" />
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedRun(run)}
                      >
                        <InfoIcon data-icon="inline-start" />
                        View details
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
      <RunAutomationModal
        automation={automation}
        isRunning={runAutomation.isPending}
        open={isRunModalOpen}
        onOpenChange={setIsRunModalOpen}
        onRun={handleRun}
      />
      {selectedRun ? (
        <RunDetailsModal
          open={Boolean(selectedRun)}
          run={selectedRun}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedRun(null);
            }
          }}
        />
      ) : null}
      <AlertDialog.Root open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-lg">
            <AlertDialog.Title className="text-lg font-semibold">
              Delete {automation.name}?
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
              This action permanently removes the automation. It cannot be undone.
            </AlertDialog.Description>
            <div className="mt-6 flex justify-end gap-3">
              <AlertDialog.Cancel asChild>
                <Button variant="outline" disabled={deleteAutomation.isPending}>
                  Cancel
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button
                  variant="destructive"
                  disabled={deleteAutomation.isPending}
                  onClick={() => deleteAutomation.mutate()}
                >
                  {deleteAutomation.isPending ? 'Deleting...' : 'Delete automation'}
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </main>
  );
}
