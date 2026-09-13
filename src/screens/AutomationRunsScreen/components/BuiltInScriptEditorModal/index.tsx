import { Dialog } from 'radix-ui';
import { useTranslation } from 'react-i18next';

import { CodeEditor } from '@/components/shared/CodeEditor';
import { Button } from '@/components/ui/button';

import type { BuiltInScriptEditorModalProps } from './types';

export function BuiltInScriptEditorModal({
  error,
  isSaving,
  onOpenChange,
  onSave,
  onScriptChange,
  open,
  script,
}: BuiltInScriptEditorModalProps) {
  const { t } = useTranslation();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] max-w-6xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border bg-background shadow-lg">
          <div className="shrink-0 border-b px-6 py-5">
            <Dialog.Title className="text-lg font-semibold">{t('runs.editScript')}</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
              {t('runs.editScriptDescription')}
            </Dialog.Description>
          </div>

          <div className="min-h-0 flex-1 p-6">
            <CodeEditor height="min(60svh, 40rem)" onChange={onScriptChange} value={script} />
            {error ? (
              <p className="mt-3 text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 justify-end gap-3 border-t px-6 py-4">
            <Dialog.Close asChild>
              <Button type="button" variant="outline" disabled={isSaving}>
                {t('common.cancel')}
              </Button>
            </Dialog.Close>
            <Button type="button" disabled={isSaving} onClick={onSave}>
              {isSaving ? t('runs.savingScript') : t('common.saveChanges')}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
