import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';
import CodeMirror from '@uiw/react-codemirror';

import { useTheme } from '@/components/shared/ThemeProvider/use-theme';
import { cn } from '@/lib/utils';

import type { CodeEditorProps } from './types';

const extensions = [python()];

export function CodeEditor(props: CodeEditorProps) {
  const { describedBy, height = '20rem', invalid, onBlur, onChange, value } = props;
  const { resolvedTheme } = useTheme();

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
      height={height}
      indentWithTab={true}
      onBlur={onBlur}
      onChange={onChange}
      placeholder="# Write the automation script here"
      theme={resolvedTheme === 'dark' ? oneDark : 'light'}
      value={value}
    />
  );
}
