export const codeEditorIds = [
  'vscode',
  'cursor',
  'zed',
  'codium',
  'windsurf',
  'pycharm',
  'intellij',
  'sublime',
  'nova',
  'bbedit',
  'coteditor',
  'textmate',
  'fleet',
  'androidstudio',
  'notepadpp',
  'kate',
  'geany',
  'gedit',
  'vim',
  'neovim',
  'nano',
  'xcode',
  'textedit',
  'notepad',
] as const;

export type CodeEditorPreference = 'system' | (typeof codeEditorIds)[number];

const CODE_EDITOR_PREFERENCE_KEY = 'eva-labs-code-editor';

export function getCodeEditorPreference(): CodeEditorPreference {
  const storedPreference = window.localStorage.getItem(CODE_EDITOR_PREFERENCE_KEY);

  if (storedPreference === 'system') {
    return storedPreference;
  }

  return codeEditorIds.some((editor) => editor === storedPreference)
    ? (storedPreference as Exclude<CodeEditorPreference, 'system'>)
    : 'system';
}

export function storeCodeEditorPreference(preference: CodeEditorPreference) {
  window.localStorage.setItem(CODE_EDITOR_PREFERENCE_KEY, preference);
}
