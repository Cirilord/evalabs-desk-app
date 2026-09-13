export type CodeEditorProps = {
  describedBy?: string;
  height?: string;
  invalid?: boolean;
  onBlur?: () => void;
  onChange: (value: string) => void;
  value: string;
};
