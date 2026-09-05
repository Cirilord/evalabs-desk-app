import { Dialog } from 'radix-ui';

import { Button } from '@/components/ui/button';

import type { RunDetailsModalProps } from './types';

function getDuration(startedAt: string, finishedAt: string | null) {
  if (!finishedAt) {
    return 'In progress';
  }

  const milliseconds = new Date(finishedAt).getTime() - new Date(startedAt).getTime();

  return `${(milliseconds / 1000).toFixed(2)}s`;
}

function getStatusLabel(status: RunDetailsModalProps['run']['status']) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function RunDetailsModal({ onOpenChange, open, run }: RunDetailsModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border bg-background shadow-lg">
          <div className="shrink-0 border-b px-6 py-5">
            <Dialog.Title className="text-lg font-semibold">Run details</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
              Execution information, inputs, and logs.
            </Dialog.Description>
          </div>

          <div className="min-h-0 overflow-y-auto px-6 py-5">
            <dl className="grid gap-4 text-sm sm:grid-cols-3">
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground">Status</dt>
                <dd className="font-medium">{getStatusLabel(run.status)}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground">Started at</dt>
                <dd>{new Date(run.startedAt).toLocaleString()}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground">Duration</dt>
                <dd>{getDuration(run.startedAt, run.finishedAt)}</dd>
              </div>
            </dl>

            <section className="mt-6">
              <h2 className="text-sm font-medium">Inputs</h2>
              <pre className="mt-2 overflow-x-auto rounded-md bg-muted px-3 py-2 text-xs text-foreground">
                {JSON.stringify(run.inputs, null, 2)}
              </pre>
            </section>

            <section className="mt-6">
              <h2 className="text-sm font-medium">Output</h2>
              <pre className="mt-2 min-h-10 overflow-x-auto rounded-md bg-muted px-3 py-2 text-xs text-foreground">
                {run.output || 'No output.'}
              </pre>
            </section>

            {run.error ? (
              <section className="mt-6">
                <h2 className="text-sm font-medium text-destructive">Error</h2>
                <pre className="mt-2 overflow-x-auto rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {run.error}
                </pre>
              </section>
            ) : null}
          </div>

          <div className="flex shrink-0 justify-end border-t px-6 py-4">
            <Dialog.Close asChild>
              <Button type="button" variant="outline">
                Close
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
