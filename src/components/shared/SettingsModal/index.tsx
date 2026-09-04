import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { RefreshCwIcon, TerminalIcon } from 'lucide-react';
import { Dialog } from 'radix-ui';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { queryKeys } from '@/data/queryKeys';

import type { PythonInterpreter, SettingsModalProps } from './types';

export function SettingsModal(props: SettingsModalProps) {
  const { trigger } = props;
  const [open, setOpen] = useState(false);
  const {
    data: interpreter,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: queryKeys.pythonInterpreter,
    queryFn: () => invoke<PythonInterpreter | null>('detect_python_interpreter'),
    enabled: open,
  });

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

          <div className="px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-medium">Interpreters</h2>
                <p className="text-sm text-muted-foreground">
                  Python is detected automatically from your system.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCwIcon data-icon="inline-start" />
                Refresh
              </Button>
            </div>

            <div className="mt-4 rounded-lg border bg-muted/30 p-4">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Detecting Python...</p>
              ) : error ? (
                <p className="text-sm text-destructive">Could not detect the Python interpreter.</p>
              ) : interpreter ? (
                <div className="flex gap-3">
                  <TerminalIcon className="mt-0.5" />
                  <dl className="min-w-0 flex-1 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="font-medium">{interpreter.name}</dt>
                      <dd className="text-muted-foreground">{interpreter.version}</dd>
                    </div>
                    <div className="mt-2">
                      <dt className="text-muted-foreground">Path</dt>
                      <dd className="mt-1 break-all font-mono text-xs">{interpreter.path}</dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Python was not found in your system path.
                </p>
              )}
            </div>
          </div>

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
