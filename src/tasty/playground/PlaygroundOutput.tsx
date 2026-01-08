import { useMemo } from 'react';

import { renderStyles, StyleResult } from '../pipeline';
import { Styles } from '../styles/types';
import { tasty } from '../tasty';

const OutputContainer = tasty({
  qa: 'PlaygroundOutput',
  styles: {
    display: 'flex',
    flow: 'column',
    height: '100%',
    overflow: 'hidden',
  },
});

const OutputHeader = tasty({
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

const OutputContent = tasty({
  as: 'pre',
  styles: {
    display: 'block',
    flex: 1,
    overflow: 'auto',
    padding: '2x',
    margin: 0,
    fill: '#dark.02',
    preset: 't3',
    font: 'monospace',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
});

export interface PlaygroundOutputProps {
  styles: Styles;
}

function formatStyleResults(results: StyleResult[]): string {
  if (results.length === 0) {
    return '/* No styles generated */';
  }

  const lines: string[] = [];

  for (const result of results) {
    const { selector, declarations, atRules } = result;

    // Build the rule
    const rule = `${selector} {\n  ${declarations.split(';').filter(Boolean).join(';\n  ')};\n}`;

    if (atRules && atRules.length > 0) {
      // Wrap in at-rules (nested)
      let wrapped = rule;
      for (let i = atRules.length - 1; i >= 0; i--) {
        const indent = '  '.repeat(atRules.length - i);
        const innerIndent = '  '.repeat(atRules.length - i + 1);
        wrapped = `${atRules[i]} {\n${wrapped
          .split('\n')
          .map((line) => innerIndent + line)
          .join('\n')}\n${indent.slice(2)}}`;
      }
      lines.push(wrapped);
    } else {
      lines.push(rule);
    }
  }

  return lines.join('\n\n');
}

export function PlaygroundOutput({ styles }: PlaygroundOutputProps) {
  const cssOutput = useMemo(() => {
    if (!styles || Object.keys(styles).length === 0) {
      return '/* Enter styles in the editor to see generated CSS */';
    }

    try {
      // Use a demo selector for display purposes
      const results = renderStyles(styles, '.demo');
      return formatStyleResults(results as StyleResult[]);
    } catch (e) {
      return `/* Error generating CSS: ${(e as Error).message} */`;
    }
  }, [styles]);

  return (
    <OutputContainer>
      <OutputHeader>Generated CSS</OutputHeader>
      <OutputContent>{cssOutput}</OutputContent>
    </OutputContainer>
  );
}
