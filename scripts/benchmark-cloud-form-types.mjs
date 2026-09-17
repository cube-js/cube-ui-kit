import { spawnSync } from 'node:child_process';
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Read-only compatibility/performance check. All configs and logs live in the OS temp directory;
// no installs, links, generated files, or edits in the Cloud checkout.
const kit = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cloud = resolve(process.argv[2] ?? join(kit, '../cloud'));
const repetitions = Number(process.argv[3] ?? 3);
if (!Number.isInteger(repetitions) || repetitions < 1) {
  throw new Error('Repetitions must be a positive integer.');
}
const consoleUI = join(cloud, 'packages/console-ui');
const compiler = join(cloud, 'node_modules/typescript-7/bin/tsc');
const output = mkdtempSync(join(tmpdir(), 'ui-kit-cloud-form-types-'));
// Resolve candidate declarations with the consumer's dependency graph. Reading
// dist in-place would mix two React/i18next copies and skew both results.
const candidatePackage = join(output, 'candidate');
cpSync(join(kit, 'dist'), join(candidatePackage, 'dist'), { recursive: true });
symlinkSync(
  join(cloud, 'node_modules'),
  join(candidatePackage, 'node_modules'),
  'dir',
);
const roots = [
  'src/modules/auth/components/NarrowForm.tsx',
  'src/modules/auth/pages/Users/components/SAMLOptionsForm.tsx',
  'src/modules/auth/pages/Users/components/LDAPOptionsForm.tsx',
  'src/modules/deployments/organisms/SettingsEnvVarsForm.tsx',
  'src/ui/organisms/SaveableCard/SaveableCard.tsx',
  'custom.d.ts',
  'vite-lib-stub.d.ts',
];
const results = [];
for (let iteration = 0; iteration < repetitions; iteration++) {
  // Reverse alternate pairs to reduce ordering/cache bias.
  for (const variant of iteration % 2
    ? ['candidate', 'installed']
    : ['installed', 'candidate']) {
    const config = {
      extends: join(consoleUI, 'tsconfig.json'),
      compilerOptions: {
        incremental: false,
        paths: {
          '@/*': [join(consoleUI, 'src/*')],
          ...(variant === 'candidate'
            ? {
                '@cube-dev/ui-kit': [join(candidatePackage, 'dist/index.d.ts')],
              }
            : {}),
        },
      },
      include: [join(consoleUI, 'src/**/*.d.ts')],
      files: roots.map((file) => join(consoleUI, file)),
    };
    const prefix = join(output, `${variant}-${iteration + 1}`);
    writeFileSync(`${prefix}.json`, JSON.stringify(config, null, 2));
    const run = spawnSync(
      process.execPath,
      [
        compiler,
        '-p',
        `${prefix}.json`,
        '--extendedDiagnostics',
        '--pretty',
        'false',
      ],
      {
        cwd: consoleUI,
        encoding: 'utf8',
        maxBuffer: 32 * 1024 * 1024,
      },
    );
    if (run.error || run.signal)
      throw run.error ?? new Error(`Compiler stopped: ${run.signal}`);
    const log = run.stdout + run.stderr;
    writeFileSync(`${prefix}.log`, log);
    const diagnostics = log
      .split('\n')
      .filter((line) => /error TS\d+:/.test(line))
      .sort();
    const metrics = Object.fromEntries(
      [...log.matchAll(/^([A-Za-z][A-Za-z ]+):\s+([\d.]+)(K|s)?$/gm)].map(
        ([, key, value, unit]) => [
          key.trim(),
          { value: Number(value), unit: unit ?? '' },
        ],
      ),
    );
    if (!metrics['Check time'] || !metrics.Files || run.status === null) {
      throw new Error(
        `Compiler did not produce a usable measurement: ${prefix}.log`,
      );
    }
    const result = {
      variant,
      iteration: iteration + 1,
      exitCode: run.status,
      diagnostics,
      metrics,
    };
    results.push(result);
    console.log(JSON.stringify({ ...result, diagnostics: diagnostics.length }));
  }
}
const gitHead = (cwd) =>
  spawnSync('git', ['rev-parse', 'HEAD'], {
    cwd,
    encoding: 'utf8',
  }).stdout.trim();
const report = {
  cloudHead: gitHead(cloud),
  kitHead: gitHead(kit),
  node: process.version,
  compiler: JSON.parse(
    readFileSync(join(cloud, 'node_modules/typescript-7/package.json'), 'utf8'),
  ).version,
  roots,
  results,
};
writeFileSync(join(output, 'results.json'), JSON.stringify(report, null, 2));
console.log(`Results: ${output}`);
const installed = results.find(
  (result) => result.variant === 'installed',
).diagnostics;
const candidate = results.find(
  (result) => result.variant === 'candidate',
).diagnostics;
for (const result of results) {
  const reference = result.variant === 'installed' ? installed : candidate;
  if (JSON.stringify(result.diagnostics) !== JSON.stringify(reference)) {
    throw new Error(
      `Diagnostics changed between ${result.variant} runs; inspect ${output}`,
    );
  }
}
const added = candidate.filter((diagnostic) => !installed.includes(diagnostic));
console.log(
  JSON.stringify(
    {
      addedDiagnostics: added,
      removedDiagnostics: installed.filter(
        (diagnostic) => !candidate.includes(diagnostic),
      ),
    },
    null,
    2,
  ),
);
if (added.length) process.exitCode = 1;
