import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import {
  CheckIcon,
  ChevronDownIcon,
  DownloadIcon,
  LoaderCircleIcon,
  RefreshCwIcon,
} from 'lucide-react';
import { Checkbox, Dialog, Select, Tabs } from 'radix-ui';
import { useState } from 'react';

import { useTelemetry } from '@/components/shared/TelemetryProvider/use-telemetry';
import { useTheme } from '@/components/shared/ThemeProvider/use-theme';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { queryKeys } from '@/data/queryKeys';

import type { PythonInterpreter, PythonRunner, SettingsModalProps } from './types';

export function SettingsModal(props: SettingsModalProps) {
  const { trigger } = props;
  const [open, setOpen] = useState(false);
  const [selectedRunnerVersion, setSelectedRunnerVersion] = useState<string | null>(null);
  const { setTelemetry, telemetry } = useTelemetry();
  const { setTheme, theme } = useTheme();
  const queryClient = useQueryClient();
  const { data: interpreter } = useQuery({
    queryKey: queryKeys.pythonInterpreter,
    queryFn: () => invoke<PythonInterpreter | null>('detect_python_interpreter'),
    enabled: open,
  });
  const {
    data: runners,
    error: runnersError,
    isLoading: areRunnersLoading,
    refetch: refetchRunners,
  } = useQuery({
    queryKey: queryKeys.pythonRunners,
    queryFn: () => invoke<PythonRunner[]>('list_python_runners'),
    enabled: open,
  });
  const installRunner = useMutation({
    mutationFn: (version: string) => invoke<PythonRunner>('install_python_runner', { version }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.pythonRunners });
    },
  });
  const selectRunner = useMutation({
    mutationFn: (version: string | null) => invoke('select_python_runner', { version }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.pythonRunners });
    },
  });
  const activeRunner = runners?.find((runner) => runner.active);
  const selectedRunner =
    selectedRunnerVersion === 'system'
      ? undefined
      : (runners?.find((runner) => runner.version === selectedRunnerVersion) ??
        activeRunner ??
        runners?.[0]);
  const isSystemSelected = selectedRunnerVersion === 'system' || !selectedRunner;
  const isSystemActive = !activeRunner;
  const runnerError = installRunner.error ?? selectRunner.error;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background shadow-lg">
          <div className="border-b px-6 py-5">
            <Dialog.Title className="text-lg font-semibold">Settings</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
              Manage the runtimes available to automations.
            </Dialog.Description>
          </div>

          <Tabs.Root defaultValue="general">
            <Tabs.List className="flex border-b px-6" aria-label="Settings sections">
              <Tabs.Trigger
                className="border-b-2 border-transparent px-3 py-3 text-sm font-medium text-muted-foreground outline-none data-[state=active]:border-primary data-[state=active]:text-foreground"
                value="general"
              >
                General
              </Tabs.Trigger>
              <Tabs.Trigger
                className="border-b-2 border-transparent px-3 py-3 text-sm font-medium text-muted-foreground outline-none data-[state=active]:border-primary data-[state=active]:text-foreground"
                value="runners"
              >
                Runners
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content className="px-6 py-5" value="general">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-medium">Appearance</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Choose how EVA Labs appears on this device.
                  </p>
                </div>
                <Select.Root value={theme} onValueChange={setTheme}>
                  <Select.Trigger className="flex h-9 w-36 shrink-0 items-center justify-between rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                    <Select.Value />
                    <Select.Icon asChild>
                      <ChevronDownIcon />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content
                      className="z-[60] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md"
                      position="popper"
                    >
                      <Select.Viewport className="p-1">
                        <Select.Group>
                          <Select.Item
                            className="cursor-default rounded-sm px-2 py-1.5 text-sm outline-none data-highlighted:bg-accent"
                            value="system"
                          >
                            <Select.ItemText>System</Select.ItemText>
                          </Select.Item>
                          <Select.Item
                            className="cursor-default rounded-sm px-2 py-1.5 text-sm outline-none data-highlighted:bg-accent"
                            value="light"
                          >
                            <Select.ItemText>Light</Select.ItemText>
                          </Select.Item>
                          <Select.Item
                            className="cursor-default rounded-sm px-2 py-1.5 text-sm outline-none data-highlighted:bg-accent"
                            value="dark"
                          >
                            <Select.ItemText>Dark</Select.ItemText>
                          </Select.Item>
                        </Select.Group>
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>

              <div className="mt-5 flex items-start justify-between gap-4 border-t pt-5">
                <div>
                  <h2 className="font-medium">Usage telemetry</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Share anonymous app launches and screen navigation to help improve EVA Labs.
                  </p>
                </div>
                <Checkbox.Root
                  aria-label="Share anonymous usage telemetry"
                  checked={telemetry === 'enabled'}
                  className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm border border-input bg-background text-primary-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                  onCheckedChange={(checked) =>
                    setTelemetry(checked === true ? 'enabled' : 'disabled')
                  }
                >
                  <Checkbox.Indicator>
                    <CheckIcon className="size-3" />
                  </Checkbox.Indicator>
                </Checkbox.Root>
              </div>
            </Tabs.Content>

            <Tabs.Content className="px-6 py-5" value="runners">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-medium">Python</h2>
                  <p className="text-sm text-muted-foreground">
                    Install a version with the bundled uv runner, then select the runner used by
                    automations.
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => refetchRunners()}>
                  <RefreshCwIcon data-icon="inline-start" />
                  Refresh
                </Button>
              </div>

              <div className="mt-4">
                {areRunnersLoading ? (
                  <p className="text-sm text-muted-foreground">Loading Python runners...</p>
                ) : runnersError ? (
                  <p className="text-sm text-destructive">
                    {runnersError instanceof Error ? runnersError.message : String(runnersError)}
                  </p>
                ) : selectedRunner || isSystemSelected ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Python version</Label>
                      <Select.Root
                        value={isSystemSelected ? 'system' : selectedRunner?.version}
                        onValueChange={setSelectedRunnerVersion}
                      >
                        <Select.Trigger className="flex h-9 w-full items-center justify-between rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                          <Select.Value />
                          <Select.Icon asChild>
                            <ChevronDownIcon />
                          </Select.Icon>
                        </Select.Trigger>
                        <Select.Portal>
                          <Select.Content
                            className="z-[60] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md"
                            position="popper"
                          >
                            <Select.Viewport className="p-1">
                              <Select.Group>
                                <Select.Item
                                  className="cursor-default rounded-sm px-2 py-1.5 text-sm outline-none data-highlighted:bg-accent"
                                  value="system"
                                >
                                  <Select.ItemText>System Python</Select.ItemText>
                                </Select.Item>
                                {runners?.map((runner) => (
                                  <Select.Item
                                    key={runner.version}
                                    className="cursor-default rounded-sm px-2 py-1.5 text-sm outline-none data-highlighted:bg-accent"
                                    value={runner.version}
                                  >
                                    <Select.ItemText>
                                      Python {runner.version}
                                      {runner.installed ? ' (installed)' : ''}
                                    </Select.ItemText>
                                  </Select.Item>
                                ))}
                              </Select.Group>
                            </Select.Viewport>
                          </Select.Content>
                        </Select.Portal>
                      </Select.Root>
                    </div>

                    <div className="flex items-center justify-between gap-4 border-t pt-4">
                      <div className="min-w-0 text-sm">
                        <p className="font-medium">
                          {isSystemSelected
                            ? interpreter
                              ? `Python ${interpreter.version}`
                              : 'System Python was not found'
                            : selectedRunner?.installed
                              ? 'Installed with uv'
                              : 'Not installed'}
                        </p>
                        {isSystemSelected && interpreter ? (
                          <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                            {interpreter.path}
                          </p>
                        ) : selectedRunner?.path ? (
                          <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                            {selectedRunner.path}
                          </p>
                        ) : null}
                      </div>

                      {isSystemSelected && isSystemActive ? (
                        <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary">
                          <CheckIcon className="size-4" />
                          Active
                        </span>
                      ) : isSystemSelected && interpreter ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={selectRunner.isPending}
                          onClick={() => selectRunner.mutate(null)}
                        >
                          {selectRunner.isPending ? (
                            <LoaderCircleIcon className="animate-spin" />
                          ) : null}
                          Use
                        </Button>
                      ) : selectedRunner?.active ? (
                        <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary">
                          <CheckIcon className="size-4" />
                          Active
                        </span>
                      ) : selectedRunner?.installed ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={selectRunner.isPending}
                          onClick={() => selectRunner.mutate(selectedRunner?.version ?? null)}
                        >
                          {selectRunner.isPending ? (
                            <LoaderCircleIcon className="animate-spin" />
                          ) : null}
                          Use
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          disabled={installRunner.isPending}
                          onClick={() => installRunner.mutate(selectedRunner?.version ?? '')}
                        >
                          {installRunner.isPending ? (
                            <LoaderCircleIcon className="animate-spin" />
                          ) : (
                            <DownloadIcon />
                          )}
                          Install
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No Python runners are available.</p>
                )}
              </div>

              {runnerError ? (
                <p className="mt-3 text-sm text-destructive">
                  {runnerError instanceof Error ? runnerError.message : String(runnerError)}
                </p>
              ) : null}
            </Tabs.Content>
          </Tabs.Root>

          <div className="flex justify-end border-t px-6 py-4">
            <Dialog.Close asChild>
              <Button>Done</Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
