import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PlayIcon, Trash2Icon } from 'lucide-react';
import { AlertDialog } from 'radix-ui';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { queryKeys } from '@/data/queryKeys';
import sqlite from '@/data/sqlite';

import { RunAutomationModal } from './components/RunAutomationModal';

export function AutomationRunsScreen() {
  const { automationId } = useParams();
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: automation, isLoading } = useQuery({
    queryKey: queryKeys.automation(automationId ?? ''),
    queryFn: () => sqlite.automation.findUnique({ where: { id: automationId ?? '' } }),
    enabled: Boolean(automationId),
  });
  const deleteAutomation = useMutation({
    mutationFn: () => sqlite.automation.delete({ where: { id: automationId ?? '' } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.automations });
      await navigate('/');
    },
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
