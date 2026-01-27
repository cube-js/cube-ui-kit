import copy from 'clipboard-copy';
import { useCallback, useMemo } from 'react';

import { Button } from '../../components/actions/Button';
import { Layout } from '../../components/content/Layout';
import { PrismCode } from '../../components/content/PrismCode/PrismCode';
import { useToast } from '../../components/overlays/Toast';
import { CopyIcon } from '../../icons';
import { tasty } from '../../tasty';
import { renderStyles, StyleResult } from '../../tasty/pipeline';
import { Styles } from '../../tasty/styles/types';

const OutputContent = tasty({
  styles: {
    display: 'block',
    flex: 1,
    overflow: 'auto',
    padding: '2x',
    margin: 0,
    fill: '#dark-bg',
  },
});

export interface PlaygroundOutputProps {
  styles: Styles;
}

function formatStyleResults(results: StyleResult[]): string {
  if (results.length === 0) {
    return '/* No styles generated */';
  }

  // Group rules by selector + atRules combination
  const groupedRules = new Map<string, string[]>();

  for (const result of results) {
    const { selector, declarations, atRules } = result;
    // Create a unique key for grouping: selector + atRules
    const atRulesKey = atRules?.join('|') ?? '';
    const groupKey = `${selector}|||${atRulesKey}`;

    const declList = declarations.split(';').filter(Boolean);

    if (!groupedRules.has(groupKey)) {
      groupedRules.set(groupKey, []);
    }
    groupedRules.get(groupKey)!.push(...declList);
  }

  const lines: string[] = [];

  for (const [groupKey, declList] of groupedRules) {
    const [selector, atRulesKey] = groupKey.split('|||');
    const atRules = atRulesKey ? atRulesKey.split('|') : [];

    // Build the rule with merged declarations
    const rule = `${selector} {\n  ${declList.join(';\n  ')};\n}`;

    if (atRules.length > 0) {
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
  const toast = useToast();

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

  const handleCopy = useCallback(async () => {
    await copy(cssOutput);
    toast.success('CSS copied to clipboard');
  }, [cssOutput, toast]);

  return (
    <Layout height="100%">
      <Layout.Toolbar>
        <span>Generated CSS</span>
        <Button
          size="small"
          type="clear"
          icon={<CopyIcon />}
          aria-label="Copy CSS"
          onPress={handleCopy}
        />
      </Layout.Toolbar>
      <Layout.Content padding={0}>
        <OutputContent>
          <PrismCode code={cssOutput} language="css" />
        </OutputContent>
      </Layout.Content>
    </Layout>
  );
}
