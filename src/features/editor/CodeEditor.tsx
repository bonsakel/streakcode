import Editor, { type OnMount } from '@monaco-editor/react';
import { useCallback, useEffect, useRef } from 'react';
import type { Language } from '@/features/judge/types';
import { useSettings } from '@/store/settings';
import { monaco } from './monacoSetup';
import { buildMonacoTheme, readThemeTokens } from './monacoTheme';

export interface CodeEditorProps {
  value: string;
  language: Language;
  onChange: (value: string) => void;
  /** Ctrl/Cmd+Enter */
  onRun: () => void;
  /** 1-based line to underline as the latest error, or null. */
  errorLine: number | null;
  /** Gives screen readers a name for the code box. */
  label: string;
}

const THEME_NAME = 'skill-issue';

function applyAppTheme() {
  monaco.editor.defineTheme(THEME_NAME, buildMonacoTheme(readThemeTokens()));
  monaco.editor.setTheme(THEME_NAME);
}

/** Monaco wrapper: follows the app theme, keeps a Run shortcut, and marks the failing line. */
export default function CodeEditor({
  value,
  language,
  onChange,
  onRun,
  errorLine,
  label,
}: CodeEditorProps) {
  const theme = useSettings((s) => s.theme);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const runRef = useRef(onRun);
  useEffect(() => {
    runRef.current = onRun;
  }, [onRun]);

  // Wait a frame so the new data-theme attribute is on <html> before the colors are read.
  useEffect(() => {
    const frame = requestAnimationFrame(applyAppTheme);
    return () => cancelAnimationFrame(frame);
  }, [theme]);

  useEffect(() => {
    const model = editorRef.current?.getModel();
    if (!model) return;
    const line = errorLine && errorLine <= model.getLineCount() ? errorLine : null;
    monaco.editor.setModelMarkers(
      model,
      'judge',
      line === null
        ? []
        : [
            {
              severity: monaco.MarkerSeverity.Error,
              message: 'The judge reported an error here.',
              startLineNumber: line,
              endLineNumber: line,
              startColumn: 1,
              endColumn: model.getLineMaxColumn(line),
            },
          ],
    );
  }, [errorLine, value, language]);

  const onMount: OnMount = useCallback((editor) => {
    editorRef.current = editor;
    applyAppTheme();
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runRef.current());
  }, []);

  return (
    <Editor
      path={`solution.${language}`}
      language={language}
      value={value}
      theme={THEME_NAME}
      onChange={(next) => onChange(next ?? '')}
      onMount={onMount}
      loading={<p className="p-4 font-mono text-sm text-muted">Booting the editor...</p>}
      options={{
        ariaLabel: label,
        fontFamily: '"JetBrains Mono Variable", ui-monospace, monospace',
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: language === 'python' ? 4 : 2,
        padding: { top: 12, bottom: 12 },
        renderLineHighlight: 'line',
        smoothScrolling: true,
        wordWrap: 'on',
        contextmenu: false,
        quickSuggestions: false,
        suggestOnTriggerCharacters: false,
      }}
    />
  );
}
