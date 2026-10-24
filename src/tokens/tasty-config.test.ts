import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import tastyConfig from '../../tasty.config';

import { renderColorTokens } from './colors';
import { getPaletteTokens } from './palette';

const ROOT = join(__dirname, '../..');

const COPY_BUTTON = `import { Button, tasty } from '@cube-dev/ui-kit';

export const CopyButton = tasty(Button, { type: 'clear' });
`;

const CONSUMER = `import { AlertDialog, Button, ButtonGroup, Card, CloseIcon, ColorSwatch, ComboBox, GridLayout, GridProvider, ItemButton, Layout, ResizablePanel, Root, Space, tasty, Text, TextArea } from '@cube-dev/ui-kit';

import { CopyButton } from './CopyButton';

export const DangerButton = tasty(Button, { styles: { fill: '#danger' } });
export const ClearButton = tasty(Button, { type: 'clear', size: 'small' });
export const CopyDangerButton = tasty(CopyButton, { styles: { fill: '#danger' } });

export function Consumer() {
  return (
    <>
      <Button styles={{ fill: '#danger' }} />
      <Button styles={{ width: '100%' }} />
      <Button fill="#danger" />
      <Button width="100%" gridArea="actions" />
      <ItemButton styles={{ padding: '2x' }} />
      <ComboBox inputStyles={{ padding: '2x' }} />
      <ComboBox fill="#danger" />
      <ComboBox filter={false} direction="top" />
      <ColorSwatch color="#ff0000" />
      <TextArea resize="vertical" />
      <Button.Group direction="vertical" />
      <ButtonGroup gap="1x" flow="row" />
      <Button filter="grayscale(1)" />
      <AlertDialog content="Delete the file?" />
      <Root font="Inter" />
      <GridProvider gap={8} columns={12} />
      <ResizablePanel direction="left" padding="2x" />
      <CopyButton styles={{ fill: '#danger' }} />
      <Space styles={{ gap: '2x' }} />
      <Text.Strong styles={{ color: '#danger' }} />
      <CloseIcon color="#danger" />
      <Card padding="2x" gap="1x" flow="row" />
      <Card fill="#danger" />
      <Layout.Content padding="0" scrollbar="tiny" />
      <GridLayout.Content padding="0" />
      {/* oxlint-disable-next-line tasty/no-protected-restyle -- a reasoned override */}
      <Button fill="#purple" />
    </>
  );
}
`;

/**
 * Lint `files` in a throwaway consumer project that installs this checkout as
 * `@cube-dev/ui-kit` and extends its `tasty.config.ts`, the way Cube Cloud
 * does. Returns the trimmed source line of each `rule` diagnostic.
 */
function lintConsumer(rule: string, files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'ui-kit-consumer-'));

  try {
    mkdirSync(join(dir, 'node_modules/@cube-dev'), { recursive: true });
    symlinkSync(ROOT, join(dir, 'node_modules/@cube-dev/ui-kit'), 'dir');
    writeFileSync(join(dir, 'package.json'), '{ "private": true }');
    writeFileSync(
      join(dir, 'tasty.config.ts'),
      "export default { extends: '@cube-dev/ui-kit' };",
    );
    writeFileSync(
      join(dir, '.oxlintrc.json'),
      JSON.stringify({
        categories: { correctness: 'off' },
        plugins: [],
        jsPlugins: [
          {
            name: 'tasty',
            specifier: join(
              ROOT,
              'node_modules/@tenphi/eslint-plugin-tasty/dist/index.js',
            ),
          },
        ],
        rules: { [`tasty/${rule}`]: 'error' },
      }),
    );

    for (const [name, source] of Object.entries(files)) {
      writeFileSync(join(dir, name), source);
    }

    // Name the files: given `.`, oxlint follows the symlink into this
    // checkout and lints its consumer type tests as well.
    const result = spawnSync(
      join(ROOT, 'node_modules/.bin/oxlint'),
      ['-c', '.oxlintrc.json', '-f', 'json', ...Object.keys(files)],
      { cwd: dir, encoding: 'utf8' },
    );
    if (result.error) throw result.error;

    let report: {
      diagnostics: {
        code: string;
        filename: string;
        labels: { span: { line: number } }[];
      }[];
    };

    try {
      report = JSON.parse(result.stdout);
    } catch {
      throw new Error(`oxlint failed:\n${result.stdout}\n${result.stderr}`);
    }

    return report.diagnostics
      .filter((diagnostic) => diagnostic.code === `tasty(${rule})`)
      .map((diagnostic) => {
        const lines = readFileSync(
          join(dir, diagnostic.filename),
          'utf8',
        ).split('\n');

        return lines[diagnostic.labels[0].span.line - 1].trim();
      })
      .sort();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('tasty.config.ts', () => {
  // The ESLint plugin validates color tokens against this list, so a palette
  // token missing from it is reported as unknown wherever it is used.
  it('lists every color token the palette emits', () => {
    const listed = new Set<string>(tastyConfig.tokens);
    const emitted = Object.keys({
      ...getPaletteTokens(),
      ...renderColorTokens(),
    }).filter((name) => name.startsWith('#'));

    expect(emitted.filter((name) => !listed.has(name))).toEqual([]);
  });

  // A consumer that extends this config gets `protectedComponents`, so
  // restyling a component reports, its primitives stay open, containers keep
  // the props that lay out their content, and a component's own prop named
  // like a style passes, while that name on a component that doesn't own it
  // (`<Button filter>`) is reported.
  it('protects components for a consumer that extends it', () => {
    const reported = lintConsumer('no-protected-restyle', {
      'CopyButton.tsx': COPY_BUTTON,
      'Consumer.tsx': CONSUMER,
    });

    expect(reported).toEqual(
      [
        "export const DangerButton = tasty(Button, { styles: { fill: '#danger' } });",
        "export const CopyDangerButton = tasty(CopyButton, { styles: { fill: '#danger' } });",
        "<Button styles={{ fill: '#danger' }} />",
        '<Button fill="#danger" />',
        "<ItemButton styles={{ padding: '2x' }} />",
        "<ComboBox inputStyles={{ padding: '2x' }} />",
        "<CopyButton styles={{ fill: '#danger' }} />",
        '<ComboBox fill="#danger" />',
        '<Button filter="grayscale(1)" />',
        '<Card fill="#danger" />',
      ].sort(),
    );
  }, 30_000);
});
