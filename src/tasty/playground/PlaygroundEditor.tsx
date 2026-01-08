import { json } from '@codemirror/lang-json';
import CodeMirror from '@uiw/react-codemirror';
import { parse } from 'best-effort-json-parser';
import { useCallback, useState } from 'react';

import { Styles } from '../styles/types';
import { tasty } from '../tasty';

const EditorContainer = tasty({
  qa: 'PlaygroundEditor',
  styles: {
    display: 'flex',
    flow: 'column',
    height: '100%',
    overflow: 'hidden',
  },
});

const EditorHeader = tasty({
  styles: {
    display: 'flex',
    placeItems: 'center',
    padding: '1x 2x',
    fill: '#dark.03',
    borderBottom: true,
    preset: 't3',
    fontWeight: 600,
  },
});

const EditorWrapper = tasty({
  styles: {
    display: 'block',
    flex: 1,
    overflow: 'auto',
    Wrapper: {
      $: '.cm-editor',
      height: '100%',
    },
  },
});

const ErrorDisplay = tasty({
  styles: {
    padding: '1x 2x',
    fill: '#danger.10',
    color: '#danger-text',
    preset: 't4',
    borderTop: '#danger.20',
  },
});

export interface PlaygroundEditorProps {
  value: Styles;
  onChange: (styles: Styles) => void;
}

export function PlaygroundEditor({ value, onChange }: PlaygroundEditorProps) {
  const [error, setError] = useState<string | null>(null);
  const [editorValue, setEditorValue] = useState(() =>
    JSON.stringify(value, null, 2),
  );

  const handleChange = useCallback(
    (val: string) => {
      setEditorValue(val);
      try {
        // Use best-effort parser for lenient parsing (handles JS-like syntax)
        const parsed = parse(val) as Styles;
        if (parsed && typeof parsed === 'object') {
          setError(null);
          onChange(parsed);
        }
      } catch (e) {
        setError((e as Error).message);
      }
    },
    [onChange],
  );

  // Normalize JSON on blur - format it properly
  const handleBlur = useCallback(() => {
    try {
      const parsed = parse(editorValue) as Styles;
      if (parsed && typeof parsed === 'object') {
        const normalized = JSON.stringify(parsed, null, 2);
        setEditorValue(normalized);
        setError(null);
      }
    } catch {
      // Keep current value if parsing fails
    }
  }, [editorValue]);

  // Sync external value changes
  const currentJson = JSON.stringify(value, null, 2);
  if (currentJson !== editorValue && !error) {
    setEditorValue(currentJson);
  }

  return (
    <EditorContainer>
      <EditorHeader>Styles (JSON)</EditorHeader>
      <EditorWrapper>
        <CodeMirror
          value={editorValue}
          height="100%"
          extensions={[json()]}
          theme="light"
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            highlightActiveLine: true,
          }}
          onChange={handleChange}
          onBlur={handleBlur}
        />
      </EditorWrapper>
      {error && <ErrorDisplay>JSON Error: {error}</ErrorDisplay>}
    </EditorContainer>
  );
}
