export type CodeEditorProps = {
  describedBy?: string;
  invalid?: boolean;
  onBlur?: () => void;
  onChange: (value: string) => void;
  value: string;
};
