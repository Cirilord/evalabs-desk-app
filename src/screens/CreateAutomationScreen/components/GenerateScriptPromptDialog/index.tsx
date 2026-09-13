import { CheckIcon, CopyIcon, SparklesIcon } from 'lucide-react';
import { Dialog } from 'radix-ui';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import type { GenerateScriptPromptDialogProps } from './types';
import type { CreateAutomationForm } from '../../types';

function describeInputs(inputs: CreateAutomationForm['inputs']) {
  if (inputs.length === 0) {
    return '- This automation does not receive inputs.';
  }

  return inputs
    .map((input) => {
      const required = input.required ? 'required' : 'optional';
      const description = input.description.trim() || 'No description provided.';

      return `- ${input.name || '<name>'} (${input.type}, ${required}): ${description}`;
    })
    .join('\n');
}

function describeOutputs(outputs: CreateAutomationForm['outputs']) {
  if (outputs.length === 0) {
    return '- This automation does not define outputs.';
  }

  return outputs
    .map((output) => {
      const description = output.description.trim() || 'No description provided.';

      return `- ${output.name || '<name>'} (${output.type}): ${description}`;
    })
    .join('\n');
}

function describeLibraries(libraries: CreateAutomationForm['libraries']) {
  if (libraries.length === 0) {
    return '- No third-party libraries are configured.';
  }

  return libraries
    .map((library) => `- ${library.name || '<package>'} (${library.version || 'latest'})`)
    .join('\n');
}

function buildScriptPrompt(automation: CreateAutomationForm) {
  const name = automation.name.trim() || 'Untitled automation';
  const description = automation.description.trim() || 'No description provided.';
  const inputContract = automation.inputs.length
    ? '- Define exactly one public function: def main(inputs):\n- The inputs argument is a dictionary containing the configured inputs by name.'
    : '- Define exactly one public function: def main().';
  const outputContract = automation.outputs.length
    ? '- Return a dictionary containing exactly the configured outputs by name.\n- Match every configured output type: text and file are strings, number is a JSON number, and boolean is true or false.'
    : '- Returning a value is optional because this automation has no configured outputs.';

  return `You are an expert Python automation developer. Write the complete Python script for the following EVA Labs automation.

Automation name: ${name}
Description: ${description}

User instructions:
[Write the specific behavior, rules, and edge cases you expect from the script here.]

Inputs:
${describeInputs(automation.inputs)}

Outputs:
${describeOutputs(automation.outputs)}

Available third-party libraries:
${describeLibraries(automation.libraries)}

Implementation contract:
- Respond with only the complete Python code, without Markdown fences or explanations.
${inputContract}
${outputContract}
- Use print() for execution logs when useful.
- Never call input(), read from stdin, or require interactive user input.
- Import and use only the configured third-party libraries when they are needed.
- Handle expected errors clearly and keep the script ready to run as-is.`;
}

export function GenerateScriptPromptDialog(props: GenerateScriptPromptDialogProps) {
  const { getAutomation } = props;
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setPrompt(buildScriptPrompt(getAutomation()));
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
