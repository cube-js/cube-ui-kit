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

const CONSUMER = `import { Button, Card, CloseIcon, ComboBox, ItemButton, Layout, Space, tasty, Text } from '@cube-dev/ui-kit';

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
      <CopyButton styles={{ fill: '#danger' }} />
      <Space styles={{ gap: '2x' }} />
      <Text.Strong styles={{ color: '#danger' }} />
      <CloseIcon color="#danger" />
      <Card padding="2x" gap="1x" flow="row" />
      <Card fill="#danger" />
      <Layout.Content padding="0" />
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
    const { diagnostics } = JSON.parse(result.stdout) as {
      diagnostics: {
        code: string;
        filename: string;
        labels: { span: { line: number } }[];
      }[];
    };

    return diagnostics
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
  // restyling a component reports, its primitives stay open and containers
  // keep the props that lay out their content.
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
        '<Card fill="#danger" />',
      ].sort(),
    );
  }, 30_000);
});
