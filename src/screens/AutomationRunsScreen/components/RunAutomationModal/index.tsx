import { open as openFileDialog } from '@tauri-apps/plugin-dialog';
import { CheckIcon, FileIcon, LoaderCircleIcon } from 'lucide-react';
import { Checkbox, Dialog } from 'radix-ui';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import type { RunAutomationModalProps } from './types';

type RunInputValues = Record<string, boolean | string>;

function getDefaultValues({ inputs }: RunAutomationModalProps['automation']): RunInputValues {
  return Object.fromEntries(
    inputs.map((input) => [input.name, input.type === 'boolean' ? false : ''])
  );
}

export function RunAutomationModal({
  automation,
  isRunning,
  onOpenChange,
  onRun,
  open,
}: RunAutomationModalProps) {
  const { t } = useTranslation();
  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RunInputValues>({ defaultValues: getDefaultValues(automation) });
  const isBusy = isRunning || isSubmitting;

  function handleOpenChange(isOpen: boolean) {
    if (isBusy) return;
    if (isOpen) reset(getDefaultValues(automation));
    onOpenChange(isOpen);
  }

  async function handleRun(values: RunInputValues) {
    await onRun(values);
    reset(getDefaultValues(automation));
    onOpenChange(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border bg-background shadow-lg">
          <div className="shrink-0 border-b px-6 py-5">
            <Dialog.Title className="text-lg font-semibold">
              {t('runs.run')} {automation.name}
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
              {t('runs.runDescription')}
            </Dialog.Description>
          </div>

          <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit(handleRun)}>
            <div className="min-h-0 overflow-y-auto px-6 py-5">
              {automation.inputs.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('runs.runNoInputs')}</p>
              ) : (
                <div className="flex flex-col gap-5">
                  {automation.inputs.map((input) => {
                    const inputId = `run-input-${input.name}`;
                    const label = input.required ? `${input.name} *` : input.name;

                    if (input.type === 'boolean') {
                      return (
                        <Controller
                          key={input.name}
                          control={control}
                          name={input.name}
                          render={({ field }) => (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <Checkbox.Root
                                  checked={Boolean(field.value)}
                                  id={inputId}
                                  onCheckedChange={(checked) => field.onChange(checked === true)}
                                  className="flex size-4 items-center justify-center rounded-sm border shadow-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                >
                                  <Checkbox.Indicator>
                                    <CheckIcon />
                                  </Checkbox.Indicator>
                                </Checkbox.Root>
                                <Label htmlFor={inputId}>{label}</Label>
                              </div>
                              {input.description && (
                                <p className="text-sm text-muted-foreground">{input.description}</p>
                              )}
                            </div>
                          )}
                        />
                      );
                    }

                    if (input.type === 'file') {
                      return (
                        <Controller
                          key={input.name}
                          control={control}
                          name={input.name}
                          rules={{ required: input.required ? 'Select a file.' : false }}
                          render={({ field }) => (
                            <div className="flex flex-col gap-2">
                              <Label htmlFor={inputId}>{label}</Label>
                              <div className="flex gap-2">
                                <Input
                                  id={inputId}
                                  readOnly
                                  value={String(field.value ?? '')}
                                  placeholder={t('create.noPythonFile')}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={async () => {
                                    const path = await openFileDialog({ multiple: false });
                                    field.onChange(Array.isArray(path) ? path[0] : (path ?? ''));
                                  }}
                                >
                                  <FileIcon data-icon="inline-start" />
                                  {t('common.file')}
                                </Button>
                              </div>
                              {errors[input.name]?.message && (
                                <p className="text-sm text-destructive">
                                  {errors[input.name]?.message}
                                </p>
                              )}
                              {input.description && (
                                <p className="text-sm text-muted-foreground">{input.description}</p>
                              )}
                            </div>
                          )}
                        />
                      );
                    }

                    return (
                      <div key={input.name} className="flex flex-col gap-2">
                        <Label htmlFor={inputId}>{label}</Label>
                        <Input
                          id={inputId}
                          type={input.type}
                          {...register(input.name, {
                            required: input.required ? 'This input is required.' : false,
                          })}
                        />
                        {errors[input.name]?.message && (
                          <p className="text-sm text-destructive">{errors[input.name]?.message}</p>
                        )}
                        {input.description && (
                          <p className="text-sm text-muted-foreground">{input.description}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex shrink-0 justify-end gap-3 border-t px-6 py-4">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" disabled={isBusy}>
                  {t('common.cancel')}
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={isBusy}>
                {isBusy && <LoaderCircleIcon className="animate-spin" data-icon="inline-start" />}
                {isBusy ? t('runs.running') : t('runs.run')}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
