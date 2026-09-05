import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckIcon, ChevronDownIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { Checkbox, Select } from 'radix-ui';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';

import { CodeEditor } from '@/components/shared/CodeEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { queryKeys } from '@/data/queryKeys';
import sqlite from '@/data/sqlite';

import { createAutomationSchema } from './schema';
import type { CreateAutomationForm, CreateAutomationScreenProps } from './types';

export function CreateAutomationScreen(props: CreateAutomationScreenProps) {
  const { automation } = props;
  const isEditing = Boolean(automation);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const saveAutomation = useMutation({
    mutationFn: (data: CreateAutomationForm) =>
      automation
        ? sqlite.automation.update({ where: { id: automation.id }, data })
        : sqlite.automation.create({ data }),
  });
  const {
    formState: { errors, isSubmitting },
    control,
    handleSubmit,
    register,
    setError,
  } = useForm<CreateAutomationForm>({
    defaultValues: {
      name: automation?.name ?? '',
      description: automation?.description ?? '',
      script: automation?.script ?? '',
      inputs: automation?.inputs ?? [],
      outputs: automation?.outputs ?? [],
    },
    resolver: zodResolver(createAutomationSchema),
  });
  const { append, fields, remove } = useFieldArray({
    control,
    name: 'inputs',
  });
  const {
    append: appendOutput,
    fields: outputFields,
    remove: removeOutput,
  } = useFieldArray({
    control,
    name: 'outputs',
  });

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
      <div className="mx-auto w-full max-w-xl">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isEditing ? 'Edit automation' : 'Create automation'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isEditing
              ? 'Update the script, inputs, and outputs of this automation.'
              : 'Start with a name, a short description, and the script that runs the automation.'}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Merge monthly spreadsheets"
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what this automation does"
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

          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-medium">Inputs</h2>
                <p className="text-sm text-muted-foreground">
                  Define the values this automation receives when it runs.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  append({
                    name: '',
                    type: 'text',
                    description: '',
                    required: false,
                  })
                }
              >
                <PlusIcon data-icon="inline-start" />
                Add input
              </Button>
            </div>

            {fields.length === 0 ? (
              <p className="rounded-md border border-dashed px-4 py-6 text-sm text-muted-foreground">
                This automation does not require any inputs yet.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="rounded-lg border bg-background p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="grid flex-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`input-name-${field.id}`}>Name</Label>
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
                          <Label>Type</Label>
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
                                  aria-label="Input type"
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
                                          <Select.ItemText>Text</Select.ItemText>
                                        </Select.Item>
                                        <Select.Item
                                          className="cursor-default rounded-sm px-2 py-1.5 text-sm outline-none data-highlighted:bg-accent"
                                          value="file"
                                        >
                                          <Select.ItemText>File</Select.ItemText>
                                        </Select.Item>
                                        <Select.Item
                                          className="cursor-default rounded-sm px-2 py-1.5 text-sm outline-none data-highlighted:bg-accent"
                                          value="number"
                                        >
                                          <Select.ItemText>Number</Select.ItemText>
                                        </Select.Item>
                                        <Select.Item
                                          className="cursor-default rounded-sm px-2 py-1.5 text-sm outline-none data-highlighted:bg-accent"
                                          value="boolean"
                                        >
                                          <Select.ItemText>Boolean</Select.ItemText>
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
                          <Label htmlFor={`input-description-${field.id}`}>Description</Label>
                          <Input
                            id={`input-description-${field.id}`}
                            placeholder="Describe the value this automation needs"
                            {...register(`inputs.${index}.description`)}
                          />
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Remove input"
                        onClick={() => remove(index)}
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
                          Required
                        </label>
                      )}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-medium">Outputs</h2>
                <p className="text-sm text-muted-foreground">
                  Define the results this automation produces when it runs.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  appendOutput({
                    name: '',
                    type: 'text',
                    description: '',
                  })
                }
              >
                <PlusIcon data-icon="inline-start" />
                Add output
              </Button>
            </div>

            {outputFields.length === 0 ? (
              <p className="rounded-md border border-dashed px-4 py-6 text-sm text-muted-foreground">
                This automation does not define any outputs yet.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {outputFields.map((field, index) => (
                  <div key={field.id} className="rounded-lg border bg-background p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="grid flex-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`output-name-${field.id}`}>Name</Label>
                          <Input
                            id={`output-name-${field.id}`}
                            placeholder="report_file"
                            aria-invalid={Boolean(errors.outputs?.[index]?.name)}
                            {...register(`outputs.${index}.name`)}
                          />
                          {errors.outputs?.[index]?.name ? (
                            <p className="text-sm text-destructive">
                              {errors.outputs[index].name.message}
                            </p>
                          ) : null}
                        </div>

                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Controller
                            control={control}
                            name={`outputs.${index}.type`}
                            render={({ field: typeField }) => (
                              <Select.Root
                                value={typeField.value}
                                onValueChange={typeField.onChange}
                              >
                                <Select.Trigger
                                  className="flex h-9 w-full items-center justify-between rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                                  aria-label="Output type"
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
                                          <Select.ItemText>Text</Select.ItemText>
                                        </Select.Item>
                                        <Select.Item
                                          className="cursor-default rounded-sm px-2 py-1.5 text-sm outline-none data-highlighted:bg-accent"
                                          value="file"
                                        >
                                          <Select.ItemText>File</Select.ItemText>
                                        </Select.Item>
                                        <Select.Item
                                          className="cursor-default rounded-sm px-2 py-1.5 text-sm outline-none data-highlighted:bg-accent"
                                          value="number"
                                        >
                                          <Select.ItemText>Number</Select.ItemText>
                                        </Select.Item>
                                        <Select.Item
                                          className="cursor-default rounded-sm px-2 py-1.5 text-sm outline-none data-highlighted:bg-accent"
                                          value="boolean"
                                        >
                                          <Select.ItemText>Boolean</Select.ItemText>
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
                          <Label htmlFor={`output-description-${field.id}`}>Description</Label>
                          <Input
                            id={`output-description-${field.id}`}
                            placeholder="Describe the result this automation produces"
                            {...register(`outputs.${index}.description`)}
                          />
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Remove output"
                        onClick={() => removeOutput(index)}
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="space-y-2">
            <Label>Script</Label>
            <p className="text-sm text-muted-foreground">
              Define <code>process(inputs)</code>. It receives a dictionary and must return a
              dictionary with the configured outputs. Use <code>print</code> for logs.
            </p>
            <Controller
              control={control}
              name="script"
              render={({ field }) => (
                <CodeEditor
                  describedBy="script-error"
                  invalid={Boolean(errors.script)}
                  onBlur={field.onBlur}
                  onChange={field.onChange}
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

          {errors.root ? (
            <p className="text-sm text-destructive" role="alert">
              {errors.root.message}
            </p>
          ) : null}

          <div className="flex justify-end gap-3">
            <Button variant="outline" asChild>
              <Link to={automation ? `/automations/${automation.id}` : '/'}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting || saveAutomation.isPending}>
              {isSubmitting || saveAutomation.isPending
                ? isEditing
                  ? 'Saving...'
                  : 'Creating...'
                : isEditing
                  ? 'Save changes'
                  : 'Create automation'}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
