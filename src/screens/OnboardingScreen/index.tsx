import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { CheckIcon, ChevronDownIcon, DownloadIcon, LoaderCircleIcon } from 'lucide-react';
import { Checkbox, Select, ToggleGroup } from 'radix-ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useTelemetry } from '@/components/shared/TelemetryProvider/use-telemetry';
import type { ThemePreference } from '@/components/shared/ThemeProvider/types';
import { useTheme } from '@/components/shared/ThemeProvider/use-theme';
import { Button } from '@/components/ui/button';
import { queryKeys } from '@/data/queryKeys';
import { cn } from '@/lib/utils';

import type { OnboardingScreenProps, PythonInterpreter, PythonRunner } from './types';

export function OnboardingScreen(props: OnboardingScreenProps) {
  const { onComplete } = props;
  const { i18n, t } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const { setTheme, theme } = useTheme();
  const { setTelemetry, telemetry } = useTelemetry();
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

  const themeOptions: { value: ThemePreference; label: string; description: string }[] = [
    {
      value: 'system',
      label: t('onboarding.system'),
      description: t('onboarding.systemDescription'),
    },
    { value: 'light', label: t('onboarding.light'), description: t('onboarding.lightDescription') },
    { value: 'dark', label: t('onboarding.dark'), description: t('onboarding.darkDescription') },
  ];
  const runnerActionLabel = isSystemSelected
    ? isSystemActive
      ? t('runner.systemPythonActive')
      : t('runner.useSystemPython')
    : selectedRunner?.installed
      ? selectedRunner.active
        ? t('runner.pythonActive', { version: selectedRunner.version })
        : t('runner.usePython', { version: selectedRunner.version })
      : t('runner.installPython', { version: selectedRunner?.version ?? '' });

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-6">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-foreground/5 lg:grid-cols-[0.82fr_1.18fr]">
        <div className="flex flex-col justify-between bg-primary p-8 text-primary-foreground sm:p-10">
          <div>
            <img alt="EVA Labs" className="size-10 brightness-0 invert" src="/logo.svg" />
            <p className="mt-12 text-sm font-medium tracking-[0.2em] uppercase opacity-70">
              {t('onboarding.welcome')}
            </p>
            <h1 className="mt-3 max-w-sm text-4xl font-semibold tracking-tight">
              {t('onboarding.welcomeDescription')}
            </h1>
          </div>
          <p className="mt-12 max-w-xs text-sm leading-6 opacity-75">
            {t('onboarding.welcomeHint')}
          </p>
        </div>

        <div className="flex min-h-[34rem] flex-col p-8 sm:p-10">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {t('onboarding.quickSetup')}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">{t('onboarding.title')}</h2>
          </div>

          <div className="mt-8 flex flex-col gap-8">
            <section>
              <div>
                <h3 className="font-medium">{t('onboarding.appearance')}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('onboarding.appearanceDescription')}
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
                <h3 className="font-medium">{t('onboarding.language')}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('onboarding.languageDescription')}
                </p>
              </div>
              <Select.Root
                value={locale}
                onValueChange={(value) =>
                  value === 'en-US' || value === 'pt-BR'
                    ? void i18n.changeLanguage(value)
                    : undefined
                }
              >
                <Select.Trigger className="mt-4 flex h-10 w-full items-center justify-between rounded-lg border bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
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
                      <Select.Item
                        className="cursor-default rounded-sm px-2 py-1.5 text-sm outline-none data-highlighted:bg-accent"
                        value="en-US"
                      >
                        <Select.ItemText>{t('language.english')}</Select.ItemText>
                      </Select.Item>
                      <Select.Item
                        className="cursor-default rounded-sm px-2 py-1.5 text-sm outline-none data-highlighted:bg-accent"
                        value="pt-BR"
                      >
                        <Select.ItemText>{t('language.portuguese')}</Select.ItemText>
                      </Select.Item>
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </section>

            <section>
              <div>
                <h3 className="font-medium">{t('onboarding.pythonRunner')}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('onboarding.pythonRunnerDescription')}
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
                            <Select.ItemText>{t('settings.systemPython')}</Select.ItemText>
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
                      ? t('runner.systemPythonDetected', { version: interpreter.version })
                      : t('runner.noSystemPython')
                    : selectedRunner?.path
                      ? t('runner.pythonReady', { version: selectedRunner.version })
                      : 'Install this runner with bundled uv.'}
              </p>
            </section>

            <section className="border-t pt-6">
              <div className="flex items-start gap-3">
                <Checkbox.Root
                  checked={telemetry === 'enabled'}
                  className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm border border-input bg-background text-primary-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                  id="telemetry"
                  onCheckedChange={(checked) =>
                    setTelemetry(checked === true ? 'enabled' : 'disabled')
                  }
                >
                  <Checkbox.Indicator>
                    <CheckIcon className="size-3" />
                  </Checkbox.Indicator>
                </Checkbox.Root>
                <label className="cursor-pointer text-sm" htmlFor="telemetry">
                  <span className="font-medium">{t('onboarding.telemetry')}</span>
                  <span className="mt-1 block text-muted-foreground">
                    {t('onboarding.telemetryDescription')}
                  </span>
                </label>
              </div>
            </section>
          </div>

          <div className="mt-auto flex justify-end pt-10">
            <Button size="lg" type="button" onClick={onComplete}>
              {t('onboarding.startAutomating')}
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
