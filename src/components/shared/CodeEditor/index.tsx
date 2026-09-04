import { python } from '@codemirror/lang-python';
import CodeMirror from '@uiw/react-codemirror';

import { cn } from '@/lib/utils';

import type { CodeEditorProps } from './types';

const extensions = [python()];

export function CodeEditor(props: CodeEditorProps) {
  const { describedBy, invalid, onBlur, onChange, value } = props;
  return (
    <CodeMirror
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      aria-label="Python script"
      basicSetup={true}
      className={cn(
        'overflow-hidden rounded-md border bg-background text-foreground',
        invalid && 'border-destructive'
      )}
      extensions={extensions}
      height="20rem"
      indentWithTab={true}
      onBlur={onBlur}
      onChange={onChange}
      placeholder="# Write the automation script here"
      theme="light"
      value={value}
    />
  );
}
