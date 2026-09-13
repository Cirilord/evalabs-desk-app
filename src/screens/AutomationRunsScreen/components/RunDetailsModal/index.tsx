import { Dialog } from 'radix-ui';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border bg-background shadow-lg">
          <div className="shrink-0 border-b px-6 py-5">
            <Dialog.Title className="text-lg font-semibold">{t('runs.details')}</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
              {t('runs.detailsDescription')}
            </Dialog.Description>
          </div>

          <div className="min-h-0 overflow-y-auto px-6 py-5">
            <dl className="grid gap-4 text-sm sm:grid-cols-4">
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
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground">{t('runs.runner')}</dt>
                <dd>{run.runnerVersion || 'Unknown'}</dd>
              </div>
            </dl>

            <section className="mt-6">
              <h2 className="text-sm font-medium">{t('runs.inputs')}</h2>
              <pre className="mt-2 overflow-x-auto rounded-md bg-muted px-3 py-2 text-xs text-foreground">
                {JSON.stringify(run.inputs, null, 2)}
              </pre>
            </section>

            <section className="mt-6">
              <h2 className="text-sm font-medium">{t('runs.logs')}</h2>
              <pre className="mt-2 min-h-10 overflow-x-auto rounded-md bg-muted px-3 py-2 text-xs text-foreground">
                {run.logs || t('runs.noLogs')}
              </pre>
            </section>

            {run.error ? (
              <section className="mt-6">
                <h2 className="text-sm font-medium text-destructive">{t('runs.error')}</h2>
                <pre className="mt-2 overflow-x-auto rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {run.error}
                </pre>
              </section>
            ) : null}
          </div>

          <div className="flex shrink-0 justify-end border-t px-6 py-4">
            <Dialog.Close asChild>
              <Button type="button" variant="outline">
                {t('common.close')}
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
