import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { open as openFileDialog } from '@tauri-apps/plugin-dialog';
import { CheckIcon, ChevronDownIcon, FileIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { Checkbox, Select } from 'radix-ui';
import { useEffect } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { CodeEditor } from '@/components/shared/CodeEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { queryKeys } from '@/data/queryKeys';
import sqlite from '@/data/sqlite';

import { GenerateScriptPromptDialog } from './components/GenerateScriptPromptDialog';
import { LibraryCombobox } from './components/LibraryCombobox';
import { createAutomationSchema } from './schema';
import type {
  CreateAutomationForm,
  CreateAutomationScreenProps,
  SavedAutomationScript,
} from './types';

const DEFAULT_AUTOMATION_BODY = `  # Add your automation logic here.
  pass`;
const DEFAULT_AUTOMATION_SCRIPT = `def main():
${DEFAULT_AUTOMATION_BODY}
`;

const MAIN_FUNCTION_PATTERN = /\bdef\s+main\s*\([^)]*\)/g;

export function CreateAutomationScreen(props: CreateAutomationScreenProps) {
  const { automation } = props;
  const { t } = useTranslation();
  const isEditing = Boolean(automation);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const saveAutomation = useMutation({
    mutationFn: async (data: CreateAutomationForm) => {
      const automationId = automation?.id ?? crypto.randomUUID();
      const savedScript = await invoke<SavedAutomationScript>('save_automation_script', {
        automationId,
        script: data.script,
        scriptMode: data.scriptMode,
        scriptPath: data.scriptPath,
        scriptFileMode: data.scriptFileMode,
      });
      const automationData = {
        id: automationId,
        name: data.name,
        description: data.description,
        script: data.script,
        scriptSource: savedScript.scriptSource,
        scriptPath: savedScript.scriptPath,
        libraries: data.libraries,
        inputs: data.inputs,
        outputs: [],
      };

      return automation
        ? sqlite.automation.update({ where: { id: automation.id }, data: automationData })
        : sqlite.automation.create({ data: automationData });
    },
  });
  const {
    formState: { errors, isSubmitting },
    control,
    getValues,
    handleSubmit,
    register,
    setError,
    setValue,
    trigger,
  } = useForm<CreateAutomationForm>({
    defaultValues: {
      name: automation?.name ?? '',
      description: automation?.description ?? '',
      script: automation?.script ?? DEFAULT_AUTOMATION_SCRIPT,
      scriptMode:
        automation?.scriptSource === 'external' || automation?.scriptSource === 'file'
          ? 'file'
          : 'inline',
      scriptFileMode:
        automation?.scriptSource === 'external' || automation?.scriptSource === 'file'
          ? 'external'
          : 'clone',
      scriptPath: automation?.scriptPath ?? null,
      libraries: automation?.libraries ?? [],
      inputs: automation?.inputs ?? [],
      outputs: [],
    },
    resolver: zodResolver(createAutomationSchema),
  });
  const { append, fields, remove } = useFieldArray({
    control,
    name: 'inputs',
  });
  const scriptMode = useWatch({ control, name: 'scriptMode' });

  useEffect(() => {
    if (automation?.scriptSource !== 'managed') {
      return;
    }

    void invoke<string>('read_managed_automation_script', { automationId: automation.id }).then(
      (script) => setValue('script', script)
    );
  }, [automation, setValue]);

  function synchronizeMainInputs(inputCount: number) {
    const script = getValues('script');
    const mainFunctions = [...script.matchAll(MAIN_FUNCTION_PATTERN)];
    const [mainFunctionMatch] = mainFunctions;

    if (mainFunctions.length !== 1 || !mainFunctionMatch) {
      return;
    }

    const mainFunction = mainFunctionMatch[0];
    const parameters = inputCount > 0 ? 'inputs: dict' : '';
    const updatedMainFunction = mainFunction.replace(/\([^)]*\)/, `(${parameters})`);

    if (mainFunction !== updatedMainFunction) {
      setValue('script', script.replace(mainFunction, updatedMainFunction), {
        shouldDirty: true,
      });
    }
  }

  async function onSubmit(data: CreateAutomationForm) {
    try {
      const savedAutomation = await saveAutomation.mutateAsync(data);
      await queryClient.invalidateQueries({ queryKey: queryKeys.automations });
      await queryClient.invalidateQueries({ queryKey: queryKeys.automation(savedAutomation.id) });
      await navigate(isEditing ? `/automations/${savedAutomation.id}` : '/');
    } catch (submitError) {
      setError('root', {
        message: submitError instanceof Error ? submitError.message : String(submitError),
      });
    }
  }

  return (
    <main className="flex-1 p-6 sm:p-10">
      <div className="w-full">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {isEditing ? t('create.editAutomation') : t('create.createAutomation')}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isEditing ? t('create.editDescription') : t('create.startDescription')}
            </p>
          </div>
          <GenerateScriptPromptDialog getAutomation={getValues} />
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="name">{t('create.name')}</Label>
            <Input
              id="name"
              placeholder={t('create.namePlaceholder')}
              autoComplete="off"
              autoFocus
              aria-describedby="name-error"
              aria-invalid={Boolean(errors.name)}
              {...register('name')}
            />
            {errors.name ? (
              <p id="name-error" className="text-sm text-destructive">
                {errors.name.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('create.description')}</Label>
            <Textarea
              id="description"
              placeholder={t('create.descriptionPlaceholder')}
              rows={5}
              aria-describedby="description-error"
              aria-invalid={Boolean(errors.description)}
              {...register('description')}
            />
            {errors.description ? (
              <p id="description-error" className="text-sm text-destructive">
                {errors.description.message}
              </p>
            ) : null}
          </div>

          <section className="flex flex-col gap-2">
            <div>
              <h2 className="text-base font-medium">{t('create.libraries')}</h2>
              <p className="text-sm text-muted-foreground">{t('create.librariesDescription')}</p>
            </div>
            <Controller
              control={control}
              name="libraries"
              render={({ field }) => (
                <LibraryCombobox libraries={field.value} onChange={field.onChange} />
              )}
            />
            {errors.libraries ? (
              <p className="text-sm text-destructive">{errors.libraries.message}</p>
            ) : null}
          </section>

          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-medium">{t('create.inputs')}</h2>
                <p className="text-sm text-muted-foreground">{t('create.inputsDescription')}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  synchronizeMainInputs(fields.length + 1);
                  append({
                    name: '',
                    type: 'text',
                    description: '',
                    required: false,
                  });
                  void trigger('script');
                }}
              >
                <PlusIcon data-icon="inline-start" />
                {t('create.addInput')}
              </Button>
            </div>

            {fields.length === 0 ? (
              <p className="rounded-md border border-dashed px-4 py-6 text-sm text-muted-foreground">
                {t('create.noInputs')}
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="rounded-lg border bg-background p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="grid flex-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`input-name-${field.id}`}>{t('create.name')}</Label>
                          <Input
                            id={`input-name-${field.id}`}
                            placeholder="file_path"
                            aria-invalid={Boolean(errors.inputs?.[index]?.name)}
                            {...register(`inputs.${index}.name`)}
                          />
                          {errors.inputs?.[index]?.name ? (
                            <p className="text-sm text-destructive">
                              {errors.inputs[index].name.message}
                            </p>
                          ) : null}
                        </div>

                        <div className="space-y-2">
                          <Label>{t('create.inputType')}</Label>
                          <Controller
                            control={control}
                            name={`inputs.${index}.type`}
                            render={({ field: typeField }) => (
                              <Select.Root
                                value={typeField.value}
                                onValueChange={typeField.onChange}
                              >
                                <Select.Trigger
                                  className="flex h-9 w-full items-center justify-between rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                                  aria-label={t('create.inputType')}
                                >
                                  <Select.Value />
                                  <Select.Icon asChild>
                                    <ChevronDownIcon />
                                  </Select.Icon>
                                </Select.Trigger>
                                <Select.Portal>
                                  <Select.Content
                                    className="overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md"
                                    position="popper"
                                  >
                                    <Select.Viewport className="p-1">
                                      <Select.Group>
                                        <Select.Item
                                          className="cursor-default rounded-sm px-2 py-1.5 text-sm outline-none data-highlighted:bg-accent"
                                          value="text"
                                        >
                                          <Select.ItemText>{t('common.text')}</Select.ItemText>
                                        </Select.Item>
                                        <Select.Item
                                          className="cursor-default rounded-sm px-2 py-1.5 text-sm outline-none data-highlighted:bg-accent"
                                          value="file"
                                        >
                                          <Select.ItemText>{t('common.file')}</Select.ItemText>
                                        </Select.Item>
                                        <Select.Item
                                          className="cursor-default rounded-sm px-2 py-1.5 text-sm outline-none data-highlighted:bg-accent"
                                          value="number"
                                        >
                                          <Select.ItemText>{t('common.number')}</Select.ItemText>
                                        </Select.Item>
                                        <Select.Item
                                          className="cursor-default rounded-sm px-2 py-1.5 text-sm outline-none data-highlighted:bg-accent"
                                          value="boolean"
                                        >
                                          <Select.ItemText>{t('common.boolean')}</Select.ItemText>
                                        </Select.Item>
                                      </Select.Group>
                                    </Select.Viewport>
                                  </Select.Content>
                                </Select.Portal>
                              </Select.Root>
                            )}
                          />
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor={`input-description-${field.id}`}>
                            {t('create.description')}
                          </Label>
                          <Input
                            id={`input-description-${field.id}`}
                            placeholder={t('create.inputDescription')}
                            {...register(`inputs.${index}.description`)}
                          />
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`${t('common.remove')} ${t('create.inputs')}`}
                        onClick={() => {
                          synchronizeMainInputs(fields.length - 1);
                          remove(index);
                          void trigger('script');
                        }}
                      >
                        <Trash2Icon />
                      </Button>
                    </div>

                    <Controller
                      control={control}
                      name={`inputs.${index}.required`}
                      render={({ field: requiredField }) => (
                        <label className="mt-4 flex items-center gap-2 text-sm font-medium">
                          <Checkbox.Root
                            checked={requiredField.value}
                            className="flex size-4 items-center justify-center rounded-sm border shadow-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                            onCheckedChange={(checked) => requiredField.onChange(checked === true)}
                          >
                            <Checkbox.Indicator>
                              <CheckIcon />
                            </Checkbox.Indicator>
                          </Checkbox.Root>
                          {t('create.required')}
                        </label>
                      )}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="space-y-2">
            <Label>{t('create.scriptSource')}</Label>
            <Controller
              control={control}
              name="scriptMode"
              render={({ field }) => (
                <Select.Root value={field.value} onValueChange={field.onChange}>
                  <Select.Trigger
                    className="flex h-9 w-full items-center justify-between rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    aria-label={t('create.scriptSource')}
                  >
                    <Select.Value />
                    <Select.Icon asChild>
                      <ChevronDownIcon />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content
                      className="overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md"
                      position="popper"
                    >
                      <Select.Viewport className="p-1">
                        <Select.Group>
                          <Select.Item
                            className="cursor-default rounded-sm px-2 py-1.5 text-sm outline-none data-highlighted:bg-accent"
                            value="inline"
                          >
                            <Select.ItemText>{t('create.scriptSourceInline')}</Select.ItemText>
                          </Select.Item>
                          <Select.Item
                            className="cursor-default rounded-sm px-2 py-1.5 text-sm outline-none data-highlighted:bg-accent"
                            value="file"
                          >
                            <Select.ItemText>{t('create.scriptSourceFile')}</Select.ItemText>
                          </Select.Item>
                        </Select.Group>
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              )}
            />
          </div>

          {scriptMode === 'inline' ? (
            <div className="space-y-2">
              <Label>{t('create.script')}</Label>
              <p className="text-sm text-muted-foreground">{t('create.scriptHint')}</p>
              <Controller
                control={control}
                name="script"
                render={({ field }) => (
                  <CodeEditor
                    describedBy="script-error"
                    invalid={Boolean(errors.script)}
                    onBlur={field.onBlur}
                    onChange={(value) => {
                      field.onChange(value);
                      void trigger('script');
                    }}
                    value={field.value}
                  />
                )}
              />
              {errors.script ? (
                <p id="script-error" className="text-sm text-destructive">
                  {errors.script.message}
                </p>
              ) : null}
            </div>
          ) : (
            <Controller
              control={control}
              name="scriptPath"
              render={({ field }) => (
                <div className="space-y-2">
                  <Label htmlFor="script-path">{t('create.choosePythonFile')}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="script-path"
                      readOnly
                      value={field.value ?? ''}
                      placeholder={t('create.noPythonFile')}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        const path = await openFileDialog({
                          filters: [{ extensions: ['py'], name: 'Python files' }],
                          multiple: false,
                        });
                        field.onChange(Array.isArray(path) ? path[0] : (path ?? null));
                      }}
                    >
                      <FileIcon data-icon="inline-start" />
                      {t('common.file')}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">{t('create.scriptFileHint')}</p>
                  <Controller
                    control={control}
                    name="scriptFileMode"
                    render={({ field: fileModeField }) => (
                      <div className="space-y-2">
                        <Label>{t('create.scriptFileMode')}</Label>
                        <Select.Root
                          value={fileModeField.value}
                          onValueChange={fileModeField.onChange}
                        >
                          <Select.Trigger className="flex h-9 w-full items-center justify-between rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                            <Select.Value />
                            <Select.Icon asChild>
                              <ChevronDownIcon />
                            </Select.Icon>
                          </Select.Trigger>
                          <Select.Portal>
                            <Select.Content
                              className="overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md"
                              position="popper"
                            >
                              <Select.Viewport className="p-1">
                                <Select.Item
                                  className="cursor-default rounded-sm px-2 py-1.5 text-sm outline-none data-highlighted:bg-accent"
                                  value="clone"
                                >
                                  <Select.ItemText>
                                    {t('create.scriptFileModeClone')}
                                  </Select.ItemText>
                                </Select.Item>
                                <Select.Item
                                  className="cursor-default rounded-sm px-2 py-1.5 text-sm outline-none data-highlighted:bg-accent"
                                  value="external"
                                >
                                  <Select.ItemText>
                                    {t('create.scriptFileModeExternal')}
                                  </Select.ItemText>
                                </Select.Item>
                              </Select.Viewport>
                            </Select.Content>
                          </Select.Portal>
                        </Select.Root>
                        <p className="text-sm text-muted-foreground">
                          {t(
                            `create.scriptFileMode${fileModeField.value === 'clone' ? 'CloneHint' : 'ExternalHint'}`
                          )}
                        </p>
                      </div>
                    )}
                  />
                  {errors.scriptPath ? (
                    <p className="text-sm text-destructive">{errors.scriptPath.message}</p>
                  ) : null}
                </div>
              )}
            />
          )}

          {errors.root ? (
            <p className="text-sm text-destructive" role="alert">
              {errors.root.message}
            </p>
          ) : null}

          <div className="flex justify-end gap-3">
            <Button variant="outline" asChild>
              <Link to={automation ? `/automations/${automation.id}` : '/'}>
                {t('create.cancel')}
              </Link>
            </Button>
            <Button type="submit" disabled={isSubmitting || saveAutomation.isPending}>
              {isSubmitting || saveAutomation.isPending
                ? isEditing
                  ? t('create.saving')
                  : t('create.creating')
                : isEditing
                  ? t('common.saveChanges')
                  : t('create.createAutomation')}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
