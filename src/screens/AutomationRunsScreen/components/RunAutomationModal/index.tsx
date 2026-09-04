import { CheckIcon } from 'lucide-react';
import { Checkbox, Dialog } from 'radix-ui';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import type { RunAutomationModalProps } from './types';

export function RunAutomationModal(props: RunAutomationModalProps) {
  const { automation, onOpenChange, open } = props;
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border bg-background shadow-lg">
          <div className="shrink-0 border-b px-6 py-5">
            <Dialog.Title className="text-lg font-semibold">Run {automation.name}</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
              Provide the inputs required for this automation.
            </Dialog.Description>
          </div>

          <div className="min-h-0 overflow-y-auto px-6 py-5">
            {automation.inputs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                This automation does not require inputs.
              </p>
            ) : (
              <div className="flex flex-col gap-5">
                {automation.inputs.map((input) => {
                  const inputId = `run-input-${input.name}`;
                  const label = input.required ? `${input.name} *` : input.name;

                  if (input.type === 'boolean') {
                    return (
                      <div key={input.name} className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Checkbox.Root
                            id={inputId}
                            className="flex size-4 items-center justify-center rounded-sm border shadow-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                          >
                            <Checkbox.Indicator>
                              <CheckIcon />
                            </Checkbox.Indicator>
                          </Checkbox.Root>
                          <Label htmlFor={inputId}>{label}</Label>
                        </div>
                        {input.description ? (
                          <p className="text-sm text-muted-foreground">{input.description}</p>
                        ) : null}
                      </div>
                    );
                  }

                  return (
                    <div key={input.name} className="flex flex-col gap-2">
                      <Label htmlFor={inputId}>{label}</Label>
                      <Input
                        id={inputId}
                        name={input.name}
                        required={input.required}
                        type={input.type === 'file' ? 'file' : input.type}
                      />
                      {input.description ? (
                        <p className="text-sm text-muted-foreground">{input.description}</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex shrink-0 justify-end gap-3 border-t px-6 py-4">
            <Dialog.Close asChild>
              <Button variant="outline">Cancel</Button>
            </Dialog.Close>
            <Button disabled>Run automation</Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
