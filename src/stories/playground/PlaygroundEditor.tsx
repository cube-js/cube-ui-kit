import { json } from '@codemirror/lang-json';
import CodeMirror from '@uiw/react-codemirror';
import { parse } from 'best-effort-json-parser';
import { useCallback, useRef, useState } from 'react';

import { Layout } from '../../components/content/Layout';
import { tasty } from '../../tasty';
import { Styles } from '../../tasty/styles/types';

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
  const isFocusedRef = useRef(false);

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

  const handleFocus = useCallback(() => {
    isFocusedRef.current = true;
  }, []);

  // Normalize JSON on blur - format it properly
  const handleBlur = useCallback(() => {
    isFocusedRef.current = false;
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

  // Normalize on paste
  const handlePaste = useCallback(() => {
    // Use setTimeout to let the paste complete first
    setTimeout(() => {
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
    }, 0);
  }, [editorValue]);

  // Sync external value changes only when not focused
  const currentJson = JSON.stringify(value, null, 2);
  if (currentJson !== editorValue && !error && !isFocusedRef.current) {
    setEditorValue(currentJson);
  }

  return (
    <Layout height="100%">
      <Layout.Toolbar>Styles (JSON)</Layout.Toolbar>
      <Layout.Content padding={0}>
        <Layout.Grid rows="1sf max-content" flexGrow={1}>
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
            onFocus={handleFocus}
            onBlur={handleBlur}
            onPaste={handlePaste}
          />
          {error && <ErrorDisplay>JSON Error: {error}</ErrorDisplay>}
        </Layout.Grid>
      </Layout.Content>
    </Layout>
  );
}
