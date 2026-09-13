import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import {
  CopyIcon,
  FilePenLineIcon,
  InfoIcon,
  LoaderCircleIcon,
  PencilIcon,
  PlayIcon,
  Trash2Icon,
} from 'lucide-react';
import { AlertDialog } from 'radix-ui';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { queryKeys } from '@/data/queryKeys';
import sqlite from '@/data/sqlite';
import type { $AutomationPayload, $RunPayload } from '@/data/sqlite/types';
import { getCodeEditorPreference } from '@/lib/code-editor';

import { BuiltInScriptEditorModal } from './components/BuiltInScriptEditorModal';
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

function getRunStatusLabel(status: $RunPayload['status'], t: (key: string) => string) {
  const labels = {
    preparing: t('runs.statusPreparing'),
    running: t('runs.statusRunning'),
    succeeded: t('runs.statusSucceeded'),
    failed: t('runs.statusFailed'),
  };

  return labels[status];
}

function getCloneName(name: string) {
  const suffix = ' copy';

  return `${name.slice(0, 100 - suffix.length).trimEnd()}${suffix}`;
}

export function AutomationRunsScreen() {
  const { t } = useTranslation();
  const { automationId } = useParams();
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBuiltInEditorOpen, setIsBuiltInEditorOpen] = useState(false);
  const [builtInScript, setBuiltInScript] = useState('');
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
    mutationFn: async () => {
      const id = automationId ?? '';

      await invoke('delete_automation_environment', { automationId: id });
      await sqlite.automation.delete({ where: { id } });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.automations });
      await navigate('/');
    },
  });
  const cloneAutomation = useMutation({
    mutationFn: async (automation: $AutomationPayload) => {
      const id = crypto.randomUUID();
      const scriptPath =
        automation.scriptSource === 'managed'
          ? await invoke<string>('clone_managed_automation_script', {
              sourceAutomationId: automation.id,
              targetAutomationId: id,
            })
          : automation.scriptPath;

      return sqlite.automation.create({
        data: {
          id,
          name: getCloneName(automation.name),
          description: automation.description,
          script: automation.script,
          scriptSource: automation.scriptSource,
          scriptPath,
          libraries: automation.libraries,
          inputs: automation.inputs,
          outputs: [],
        },
      });
    },
    onSuccess: async (clonedAutomation) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.automations });
      await navigate(`/automations/${clonedAutomation.id}`);
    },
  });
  const openScript = useMutation({
    mutationFn: async (automation: $AutomationPayload) => {
      const codeEditor = getCodeEditorPreference();
      const savedScript = await invoke<{
        scriptSource: $AutomationPayload['scriptSource'];
        scriptPath: string;
      }>('open_automation_script_in_editor', {
        automationId: automation.id,
        script: automation.script,
        scriptSource: automation.scriptSource,
        scriptPath: automation.scriptPath,
        codeEditor: codeEditor === 'system' ? null : codeEditor,
      });

      if (
        savedScript.scriptSource !== automation.scriptSource ||
        savedScript.scriptPath !== automation.scriptPath
      ) {
        await sqlite.automation.update({
          where: { id: automation.id },
          data: { ...automation, ...savedScript },
        });
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.automation(automationId ?? '') });
    },
  });
  const openBuiltInScriptEditor = useMutation({
    mutationFn: async (automation: $AutomationPayload) => {
      if (automation.scriptSource !== 'managed') {
        return automation.script;
      }

      return invoke<string>('read_managed_automation_script', { automationId: automation.id });
    },
    onSuccess: (script) => {
      setBuiltInScript(script);
      setIsBuiltInEditorOpen(true);
    },
  });
  const saveBuiltInScript = useMutation({
    mutationFn: async ({
      automation,
      script,
    }: {
      automation: $AutomationPayload;
      script: string;
    }) => {
      const savedScript = await invoke<{
        scriptPath: string;
        scriptSource: $AutomationPayload['scriptSource'];
      }>('save_automation_script', {
        automationId: automation.id,
        script,
        scriptMode: 'inline',
        scriptPath: null,
        scriptFileMode: 'clone',
      });

      return sqlite.automation.update({
        where: { id: automation.id },
        data: { ...automation, ...savedScript, script },
      });
    },
    onSuccess: async () => {
      setIsBuiltInEditorOpen(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.automation(automationId ?? '') });
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
        libraries: automation.libraries,
        outputs: [],
        inputs,
        hasInputs: automation.inputs.length > 0,
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

  function editScript() {
    if (!automation) {
      return;
    }

    if (getCodeEditorPreference() === 'builtin') {
      openBuiltInScriptEditor.mutate(automation);
      return;
    }

    openScript.mutate(automation);
  }

  function saveScript() {
    if (!automation) {
      return;
    }

    saveBuiltInScript.mutate({ automation, script: builtInScript });
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
      <div className="flex w-full flex-col gap-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{automation.name}</h1>
            {automation.description ? (
              <p className="mt-2 text-sm text-muted-foreground">{automation.description}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={openScript.isPending || openBuiltInScriptEditor.isPending}
              onClick={editScript}
            >
              <FilePenLineIcon data-icon="inline-start" />
              {t('runs.editScript')}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to={`/automations/${automation.id}/edit`}>
                <PencilIcon data-icon="inline-start" />
                {t('create.editAutomation')}
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={cloneAutomation.isPending}
              onClick={() => cloneAutomation.mutate(automation)}
            >
              <CopyIcon data-icon="inline-start" />
              {cloneAutomation.isPending ? t('runs.cloning') : t('runs.cloneAutomation')}
            </Button>
            <Button type="button" onClick={() => setIsRunModalOpen(true)}>
              <PlayIcon data-icon="inline-start" />
              {t('runs.run')}
            </Button>
            <Button type="button" variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2Icon data-icon="inline-start" />
              {t('runs.deleteAutomation')}
            </Button>
          </div>
        </header>

        {openScript.error ? (
          <p className="text-sm text-destructive" role="alert">
            {openScript.error instanceof Error
              ? openScript.error.message
              : String(openScript.error)}
          </p>
        ) : null}
        {openBuiltInScriptEditor.error ? (
          <p className="text-sm text-destructive" role="alert">
            {openBuiltInScriptEditor.error instanceof Error
              ? openBuiltInScriptEditor.error.message
              : String(openBuiltInScriptEditor.error)}
          </p>
        ) : null}

        <section className="flex flex-col gap-4" aria-labelledby="runs-heading">
          <div>
            <h2 id="runs-heading" className="text-lg font-semibold">
              {t('runs.runs')}
            </h2>
            <p className="text-sm text-muted-foreground">{t('runs.detailsDescription')}</p>
          </div>

          {isLoadingRuns ? (
            <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
          ) : runs.length === 0 ? (
            <div className="rounded-lg border bg-background px-5 py-10 text-center">
              <p className="font-medium">{t('runs.noRuns')}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t('runs.noRunsDescription')}</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border bg-background">
              {runs.map((run) => (
                <article key={run.id} className="border-b px-5 py-4 last:border-b-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">
                        {getRunStatusLabel(run.status, t)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(run.startedAt).toLocaleString()}
                      </span>
                      {run.runnerVersion ? (
                        <span className="text-sm text-muted-foreground">{run.runnerVersion}</span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-3">
                      {run.finishedAt ? (
                        <span className="text-sm text-muted-foreground">
                          Finished {new Date(run.finishedAt).toLocaleTimeString()}
                        </span>
                      ) : null}
                      {run.status === 'preparing' || run.status === 'running' ? (
                        <LoaderCircleIcon className="animate-spin text-muted-foreground" />
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedRun(run)}
                      >
                        <InfoIcon data-icon="inline-start" />
                        {t('runs.details')}
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
      <BuiltInScriptEditorModal
        error={
          saveBuiltInScript.error
            ? saveBuiltInScript.error instanceof Error
              ? saveBuiltInScript.error.message
              : String(saveBuiltInScript.error)
            : null
        }
        isSaving={saveBuiltInScript.isPending}
        open={isBuiltInEditorOpen}
        script={builtInScript}
        onOpenChange={(open) => {
          if (!saveBuiltInScript.isPending) {
            setIsBuiltInEditorOpen(open);
          }
        }}
        onSave={saveScript}
        onScriptChange={setBuiltInScript}
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
              {t('runs.deleteAutomation')} {automation.name}?
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
              {t('runs.deleteDescription')}
            </AlertDialog.Description>
            <div className="mt-6 flex justify-end gap-3">
              <AlertDialog.Cancel asChild>
                <Button variant="outline" disabled={deleteAutomation.isPending}>
                  {t('common.cancel')}
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button
                  variant="destructive"
                  disabled={deleteAutomation.isPending}
                  onClick={() => deleteAutomation.mutate()}
                >
                  {deleteAutomation.isPending ? t('runs.deleting') : t('runs.deleteAutomation')}
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </main>
  );
}
