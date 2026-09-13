export type BuiltInScriptEditorModalProps = {
  error: string | null;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  onScriptChange: (script: string) => void;
  open: boolean;
  script: string;
};
