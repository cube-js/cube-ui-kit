#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { precompileTastyStyles } from '@tenphi/tasty/precompile';

import {
  cases,
  publicStyledComponents,
  runtimeOnlyComponents,
} from './precompile-tasty-catalog.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = resolve(ROOT, 'dist/precompiled');

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

const result = await precompileTastyStyles({
  id: '@cube-dev/ui-kit',
  cases,
});

const report = {
  tastyVersion: result.manifest.tastyVersion,
  catalogCases: result.report.map((item, index) => ({
    ...item,
    structuralReason: cases[index].structuralReason,
  })),
  catalogedComponents: publicStyledComponents.filter(
    (name) => !(name in runtimeOnlyComponents),
  ),
  runtimeOnlyComponents,
};

const manifestSource = `const manifest = ${JSON.stringify(result.manifest, null, 2)};\n\nexport default manifest;\n`;
const registerSource = `import { registerTastyPrecompiled } from '@tenphi/tasty/precompile/register';\nimport manifest from './manifest.js';\n\nregisterTastyPrecompiled(manifest);\n\nexport * from '../index.js';\n`;
const indexSource = `import './register.js';\nimport './styles.css';\n\nexport * from './register.js';\n`;
const manifestTypes = `import type { TastyPrecompiledManifest } from '@tenphi/tasty/precompile/register';\n\ndeclare const manifest: TastyPrecompiledManifest;\nexport default manifest;\n`;

await mkdir(OUTPUT, { recursive: true });
await Promise.all([
  writeFile(resolve(OUTPUT, 'styles.css'), result.css),
  writeFile(resolve(OUTPUT, 'manifest.json'), json(result.manifest)),
  writeFile(resolve(OUTPUT, 'manifest.js'), manifestSource),
  writeFile(resolve(OUTPUT, 'manifest.d.ts'), manifestTypes),
  writeFile(resolve(OUTPUT, 'register.js'), registerSource),
  writeFile(resolve(OUTPUT, 'index.js'), indexSource),
  writeFile(resolve(OUTPUT, 'report.json'), json(report)),
]);

console.log(
  `Precompiled ${result.manifest.chunks.length} Tasty chunks from ${cases.length} catalog cases (${result.css.length} CSS bytes).`,
);
