import { CheckIcon, CopyIcon, SparklesIcon } from 'lucide-react';
import { Dialog } from 'radix-ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import type { GenerateScriptPromptDialogProps } from './types';
import type { CreateAutomationForm } from '../../types';

type Translate = ReturnType<typeof useTranslation>['t'];

function describeInputs(inputs: CreateAutomationForm['inputs'], t: Translate) {
  if (inputs.length === 0) {
    return `- ${t('aiPrompt.noInputs')}`;
  }

  return inputs
    .map((input) => {
      const required = input.required ? t('aiPrompt.required') : t('aiPrompt.optional');
      const description = input.description.trim() || t('aiPrompt.noDescription');
      const type = t(`common.${input.type}`);

      return `- ${input.name || '<name>'} (${type}, ${required}): ${description}`;
    })
    .join('\n');
}

function describeLibraries(libraries: CreateAutomationForm['libraries'], t: Translate) {
  if (libraries.length === 0) {
    return `- ${t('aiPrompt.noLibraries')}`;
  }

  return libraries
    .map(
      (library) => `- ${library.name || '<package>'} (${library.version || t('aiPrompt.latest')})`
    )
    .join('\n');
}

function buildScriptPrompt(automation: CreateAutomationForm, t: Translate) {
  const name = automation.name.trim() || t('aiPrompt.untitledAutomation');
  const description = automation.description.trim() || t('aiPrompt.noDescription');
  const inputContract = automation.inputs.length
    ? t('aiPrompt.mainWithInputs')
    : t('aiPrompt.mainWithoutInputs');

  return t('aiPrompt.template', {
    description,
    inputContract,
    inputs: describeInputs(automation.inputs, t),
    libraries: describeLibraries(automation.libraries, t),
    name,
  });
}

export function GenerateScriptPromptDialog(props: GenerateScriptPromptDialogProps) {
  const { getAutomation } = props;
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setPrompt(buildScriptPrompt(getAutomation(), t));
      setCopyState('idle');
    }

    setOpen(nextOpen);
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <Button type="button" variant="outline">
          <SparklesIcon data-icon="inline-start" />
          Generate AI prompt
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border bg-background shadow-lg">
          <div className="shrink-0 border-b px-6 py-5">
            <Dialog.Title className="text-lg font-semibold">Generate script with AI</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
              Copy this prompt into your preferred AI assistant to generate the Python script.
            </Dialog.Description>
          </div>
          <div className="min-h-0 flex-1 p-6">
            <Textarea
              className="h-full min-h-80 resize-none font-mono text-xs"
              readOnly
              value={prompt}
            />
          </div>
          <div className="flex shrink-0 items-center justify-between gap-3 border-t px-6 py-4">
            <p className="text-sm text-destructive" role="alert">
              {copyState === 'error'
                ? 'Could not copy the prompt. Select and copy it manually.'
                : null}
            </p>
            <div className="flex gap-3">
              <Dialog.Close asChild>
                <Button type="button" variant="outline">
                  Close
                </Button>
              </Dialog.Close>
              <Button type="button" onClick={copyPrompt}>
                {copyState === 'copied' ? (
                  <CheckIcon data-icon="inline-start" />
                ) : (
                  <CopyIcon data-icon="inline-start" />
                )}
                {copyState === 'copied' ? 'Copied' : 'Copy prompt'}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
