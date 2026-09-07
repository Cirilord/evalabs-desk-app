import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { CheckIcon, ChevronDownIcon, DownloadIcon, LoaderCircleIcon } from 'lucide-react';
import { Select, ToggleGroup } from 'radix-ui';
import { useState } from 'react';

import type { ThemePreference } from '@/components/shared/ThemeProvider/types';
import { useTheme } from '@/components/shared/ThemeProvider/use-theme';
import { Button } from '@/components/ui/button';
import { queryKeys } from '@/data/queryKeys';
import { cn } from '@/lib/utils';

import type { OnboardingScreenProps, PythonInterpreter, PythonRunner } from './types';

const themeOptions: { value: ThemePreference; label: string; description: string }[] = [
  { value: 'system', label: 'System', description: 'Match your device' },
  { value: 'light', label: 'Light', description: 'A clear workspace' },
  { value: 'dark', label: 'Dark', description: 'Easy on the eyes' },
];

export function OnboardingScreen(props: OnboardingScreenProps) {
  const { onComplete } = props;
  const { setTheme, theme } = useTheme();
  const [selectedRunnerVersion, setSelectedRunnerVersion] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { data: interpreter } = useQuery({
    queryKey: queryKeys.pythonInterpreter,
    queryFn: () => invoke<PythonInterpreter | null>('detect_python_interpreter'),
  });
  const { data: runners, isLoading: areRunnersLoading } = useQuery({
    queryKey: queryKeys.pythonRunners,
    queryFn: () => invoke<PythonRunner[]>('list_python_runners'),
  });
  const activeRunner = runners?.find((runner) => runner.active);
  const selectedRunner =
    selectedRunnerVersion === 'system'
      ? undefined
      : (runners?.find((runner) => runner.version === selectedRunnerVersion) ?? activeRunner);
  const isSystemSelected = selectedRunnerVersion === 'system' || !selectedRunner;
  const isSystemActive = !activeRunner;
  const configureRunner = useMutation({
    mutationFn: async () => {
      if (isSystemSelected) {
        await invoke('select_python_runner', { version: null });
        return;
      }

      const version = selectedRunner?.version;
      if (!version) {
        return;
      }

      if (!selectedRunner.installed) {
        await invoke('install_python_runner', { version });
      }

      await invoke('select_python_runner', { version });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.pythonRunners });
    },
  });

  function handleThemeChange(value: string) {
    if (value === 'system' || value === 'light' || value === 'dark') {
      setTheme(value);
    }
  }

  const runnerActionLabel = isSystemSelected
    ? isSystemActive
      ? 'System Python active'
      : 'Use system Python'
    : selectedRunner?.installed
      ? selectedRunner.active
        ? `Python ${selectedRunner.version} active`
        : `Use Python ${selectedRunner.version}`
      : `Install Python ${selectedRunner?.version ?? ''}`;

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-6">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-foreground/5 lg:grid-cols-[0.82fr_1.18fr]">
        <div className="flex flex-col justify-between bg-primary p-8 text-primary-foreground sm:p-10">
          <div>
            <img alt="EVA Labs" className="size-10 brightness-0 invert" src="/logo.svg" />
            <p className="mt-12 text-sm font-medium tracking-[0.2em] uppercase opacity-70">
              Welcome to EVA Labs
            </p>
            <h1 className="mt-3 max-w-sm text-4xl font-semibold tracking-tight">
              Your desktop automation workspace is ready.
            </h1>
          </div>
          <p className="mt-12 max-w-xs text-sm leading-6 opacity-75">
            Set your preferences now. You can change everything later in Settings.
          </p>
        </div>

        <div className="flex min-h-[34rem] flex-col p-8 sm:p-10">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Quick setup</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Make EVA Labs yours</h2>
          </div>

          <div className="mt-8 flex flex-col gap-8">
            <section>
              <div>
                <h3 className="font-medium">Appearance</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose the theme for this device.
                </p>
              </div>
              <ToggleGroup.Root
                className="mt-4 grid grid-cols-3 gap-2"
                type="single"
                value={theme}
                onValueChange={handleThemeChange}
              >
                {themeOptions.map((option) => (
                  <ToggleGroup.Item
                    key={option.value}
                    className="rounded-lg border bg-background px-3 py-3 text-left text-sm outline-none transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                    value={option.value}
                  >
                    <span className="block font-medium">{option.label}</span>
                    <span className="mt-1 block text-xs opacity-70">{option.description}</span>
                  </ToggleGroup.Item>
                ))}
              </ToggleGroup.Root>
            </section>

            <section>
              <div>
                <h3 className="font-medium">Python runner</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Select the Python runtime used by your automations.
                </p>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Select.Root
                  value={isSystemSelected ? 'system' : selectedRunner?.version}
                  onValueChange={setSelectedRunnerVersion}
                >
                  <Select.Trigger className="flex h-10 flex-1 items-center justify-between rounded-lg border bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
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
                <Button
                  className="h-10"
                  disabled={
                    areRunnersLoading ||
                    configureRunner.isPending ||
                    (isSystemSelected && isSystemActive) ||
                    Boolean(selectedRunner?.active)
                  }
                  type="button"
                  variant="outline"
                  onClick={() => configureRunner.mutate()}
                >
                  {configureRunner.isPending ? (
                    <LoaderCircleIcon className="animate-spin" data-icon="inline-start" />
                  ) : isSystemSelected || selectedRunner?.installed ? (
                    <CheckIcon data-icon="inline-start" />
                  ) : (
                    <DownloadIcon data-icon="inline-start" />
                  )}
                  {runnerActionLabel}
                </Button>
              </div>

              <p
                className={cn(
                  'mt-3 text-sm text-muted-foreground',
                  configureRunner.error && 'text-destructive'
                )}
              >
                {configureRunner.error
                  ? configureRunner.error instanceof Error
                    ? configureRunner.error.message
                    : String(configureRunner.error)
                  : isSystemSelected
                    ? interpreter
                      ? `System Python ${interpreter.version} detected`
                      : 'No system Python detected. Install a managed runner to continue.'
                    : selectedRunner?.path
                      ? `Python ${selectedRunner.version} is ready to use`
                      : 'Install this runner with bundled uv.'}
              </p>
            </section>
          </div>

          <div className="mt-auto flex justify-end pt-10">
            <Button size="lg" type="button" onClick={onComplete}>
              Start automating
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
