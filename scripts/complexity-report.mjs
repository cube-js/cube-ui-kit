#!/usr/bin/env node
/**
 * `pnpm diagnostics:complexity` — the hardest-to-follow functions in `src/`.
 *
 * Measures every function's cognitive complexity, SonarSource's metric, with
 * `eslint-plugin-sonarjs` running inside oxlint, and prints the worst first.
 * Cognitive complexity adds 1 for each break in the linear flow (`if`, loops,
 * `catch`, `switch`, ternaries, a change of operator in a `&&`/`||` chain,
 * recursion) plus 1 for each level of nesting it sits in. So a flat `switch`
 * or a JSX block of `cond && <X />` scores low, and the same logic nested
 * scores high. Spec: https://www.sonarsource.com/docs/CognitiveComplexity.pdf
 *
 * `.oxlintrc.json` sets a ceiling with the same rule, `pnpm lint` enforces it,
 * and no function may go above it. The ceiling only goes down: once the worst
 * function improves, lower it to the new worst. This report prints both.
 *
 * Usage:
 *   pnpm diagnostics:complexity              # the 30 worst functions + summary
 *   pnpm diagnostics:complexity --limit 100  # the 100 worst
 *   pnpm diagnostics:complexity --all        # every function that branches
 *   pnpm -s diagnostics:complexity --json    # [{ complexity, file, line }]
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const DEFAULT_LIMIT = 30;
/** SonarSource's default threshold for the rule. */
const SONAR_DEFAULT = 15;

const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const limitArg = args.find((arg) => arg.startsWith('--limit='));
const limitIdx = args.indexOf('--limit');
const limit = has('--all')
  ? Infinity
  : limitArg
    ? Number(limitArg.slice('--limit='.length))
    : limitIdx === -1
      ? DEFAULT_LIMIT
      : Number(args[limitIdx + 1]);

if (limit !== Infinity && !(Number.isInteger(limit) && limit > 0)) {
  console.error('--limit takes a positive whole number');
  process.exit(1);
}

/**
 * Report every function: the same rule as `.oxlintrc.json`, with no other
 * rules and a threshold of 0. The config lives in a temporary directory, so
 * the plugin is referenced by absolute path.
 */
function measure() {
  const dir = mkdtempSync(join(tmpdir(), 'complexity-report-'));
  const config = join(dir, 'oxlintrc.json');

  writeFileSync(
    config,
    JSON.stringify({
      plugins: [],
      jsPlugins: [
        {
          name: 'sonarjs',
          specifier: require.resolve('eslint-plugin-sonarjs'),
        },
      ],
      categories: { correctness: 'off' },
      rules: { 'sonarjs/cognitive-complexity': ['error', 0] },
    }),
  );

  try {
    const oxlint = join(ROOT, 'node_modules/.bin/oxlint');
    // oxlint exits 1 when it reports anything, which here is always.
    const run = (cmdArgs) => {
      try {
        return execFileSync(oxlint, cmdArgs, {
          cwd: ROOT,
          encoding: 'utf8',
          maxBuffer: 256 * 1024 * 1024,
        });
      } catch (error) {
        if (error.stdout) return error.stdout;
        throw error;
      }
    };
    const output = run([
      '-c',
      config,
      '--ignore-pattern',
      '*.js',
      '--ignore-pattern',
      '*.d.ts',
      '--format',
      'json',
      'src',
    ]);

    return JSON.parse(output)
      .diagnostics.map((diagnostic) => {
        const file = diagnostic.filename;

        return {
          complexity: Number(/from (\d+) to/.exec(diagnostic.message)[1]),
          file,
          line: startLine(file, diagnostic.labels[0].span),
        };
      })
      .sort((a, b) => b.complexity - a.complexity);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** The ceiling `pnpm lint` enforces, read from `.oxlintrc.json`. */
function readCeiling() {
  const config = readFileSync(join(ROOT, '.oxlintrc.json'), 'utf8');
  const match = /"sonarjs\/cognitive-complexity":\s*\[\s*"error",\s*(\d+)/.exec(
    config,
  );

  return match ? Number(match[1]) : undefined;
}

/** Source files as bytes: oxlint's spans are UTF-8 byte offsets. */
const sources = new Map();
function source(file) {
  if (!sources.has(file)) sources.set(file, readFileSync(join(ROOT, file)));

  return sources.get(file);
}

const OPEN_PAREN = 0x28;
const CLOSE_PAREN = 0x29;

const COLON = 0x3a;
const isSpace = (byte) => /\s/.test(String.fromCharCode(byte));

/** The index of the first non-space byte after `i`. */
function nextNonSpace(bytes, i) {
  let j = i + 1;
  while (j < bytes.length && isSpace(bytes[j])) j++;

  return j;
}

/**
 * The line a function starts on. oxlint points at the function's name, or at
 * the `=>` of an arrow function, which sits after a parameter list that may
 * span several lines. Step back to the `(` that opens that list.
 */
function startLine(file, { offset, line }) {
  const bytes = source(file);

  if (bytes.toString('utf8', offset, offset + 2) !== '=>') return line;

  let i = offset - 1;
  while (i >= 0 && isSpace(bytes[i])) i--;

  // `(…): Type =>`: the parameter list closes at the `)` before the colon.
  if (bytes[i] !== CLOSE_PAREN) {
    while (
      i >= 0 &&
      !(bytes[i] === CLOSE_PAREN && bytes[nextNonSpace(bytes, i)] === COLON)
    ) {
      i--;
    }
    if (i < 0) return line;
  }

  for (let depth = 0; i >= 0; i--) {
    if (bytes[i] === CLOSE_PAREN) depth++;
    if (bytes[i] === OPEN_PAREN && --depth === 0) break;
  }

  let newlines = 0;
  for (let j = i; j < offset; j++) if (bytes[j] === 0x0a) newlines++;

  return line - newlines;
}

/** The function's first source line, trimmed, to say which one it is. */
function sourceLine({ file, line }) {
  const text = source(file).toString('utf8').split('\n')[line - 1].trim();

  return text.length > 60 ? `${text.slice(0, 59)}…` : text;
}

function printReport(functions, seconds) {
  const worst = functions[0]?.complexity ?? 0;
  const ceiling = readCeiling();
  const over = functions.filter((fn) => fn.complexity > SONAR_DEFAULT).length;

  console.log(
    `Cognitive complexity of ${functions.length} branching functions in src/, ` +
      `measured in ${seconds.toFixed(1)}s`,
  );
  console.log(
    `  ${over} over ${SONAR_DEFAULT} (SonarSource's default) · ` +
      `worst ${worst} · ceiling ${ceiling ?? 'not set'} (.oxlintrc.json)\n`,
  );

  for (const fn of functions.slice(0, limit)) {
    console.log(
      `${String(fn.complexity).padStart(4)}  ${fn.file}:${fn.line}  ${sourceLine(fn)}`,
    );
  }

  if (functions.length > limit) {
    console.log(
      `\nShowing the ${limit} worst of ${functions.length}. ` +
        '--all lists every function, --json prints machine-readable output.',
    );
  }

  if (ceiling !== undefined && worst < ceiling) {
    console.log(
      `\nThe worst function is now ${worst}: lower the ceiling ` +
        `(sonarjs/cognitive-complexity in .oxlintrc.json) from ${ceiling} to ${worst}.`,
    );
  }
}

const started = performance.now();
const functions = measure();
const seconds = (performance.now() - started) / 1000;

if (has('--json')) {
  // A reader that closes early (`| head`) is not an error.
  process.stdout.on('error', (error) => {
    if (error.code !== 'EPIPE') throw error;
  });
  // No `process.exit()` after writing: it can cut off output piped on macOS.
  process.stdout.write(`${JSON.stringify(functions, null, 2)}\n`);
} else {
  printReport(functions, seconds);
}
