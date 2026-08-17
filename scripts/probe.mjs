#!/usr/bin/env node
/**
 * `pnpm probe` — inspect what the UI Kit actually renders, in one call.
 *
 * Answers the questions that otherwise cost a throwaway vitest spec: what CSS a
 * tasty styles object produces under the real config, what a component tree
 * emits as HTML plus only the CSS it caused, and what the color tokens resolve
 * to.
 *
 * Mirrors Cube Cloud's `yarn probe` (`packages/console-ui/scripts/probe.mjs`)
 * flag for flag, so a recipe carries between the two repos. The difference is
 * the provider stack each one mounts: there it is router + data layer + `<Root>`,
 * here it is `<Root>` alone, which is what `configure()` and the Glaze palette
 * hang off.
 *
 * This is the jsdom tier and it is the default. It reports the CSS tasty
 * generated — NOT what a browser computes: jsdom does not resolve custom
 * properties, so `backgroundColor` comes back as the literal
 * `var(--surface-2-color)` and `--gap` as empty. For resolved colors, real
 * geometry, pointer behaviour or a screenshot, use `pnpm probe:browser`.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCRATCH_DIR = resolve(ROOT_DIR, '.probe');

const USAGE = `
pnpm probe <mode> [options]

Modes
  styles '<json>'     CSS for a tasty styles object, under the real ui-kit
                      config (units, recipes, presets, color tokens)
  tokens              Color tokens: resolved literal values for one scheme,
                      plus the four-variant state maps <Root> declares
  render              HTML + the CSS this snippet caused. Snippet on stdin.
  globals             Everything on the page with only <Root> mounted: the
                      :root token block, body styles, @font-face, keyframes

Options
  --scheme <name>     tokens: light | dark  (default: light)
  --hc                tokens: resolve the high-contrast variant of --scheme
  --filter <substr>   tokens: only tokens whose name contains this
  --full-css          render: do not subtract the baseline
  --canonical         render: normalise tasty hashes and React IDs (for
                      diffing). Applies on both tiers.
  --json              print the raw result JSON

Options for 'pnpm probe:browser' only (these need a real browser)
  --computed <sel> [prop...]   resolved values — jsdom reports var(...) as text
  --rect <sel>                 geometry — jsdom sizes everything at 0
  --screenshot                 write a PNG beside the result
  --scheme <name>              render: drive <html> into light | dark | hc
  --hc                         render: high contrast, composable with --scheme
                               so 'dark --hc' reaches the fourth variant
                               ('--scheme hc' alone means light + hc)

Notes
  The snippet is NOT typechecked — oxc strips types without checking them.
  Write a module: imports at the top, then either 'export default' a component
  or leave bare JSX as the last expression. '@cube-dev/ui-kit' is aliased to
  this working copy's src, so a snippet reads exactly like consumer code.

Example
  pnpm probe render <<'TSX'
  import { Button } from '@cube-dev/ui-kit';
  <Button type="primary">Hello</Button>
  TSX
`.trim();

function parseArgs(argv) {
  const [mode, ...rest] = argv;
  const options = { mode, positional: [] };

  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];

    if (arg === '--full-css') {
      options.fullCss = true;
    } else if (arg === '--canonical') {
      options.canonical = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--hc') {
      options.highContrast = true;
    } else if (arg === '--scheme') {
      options.scheme = rest[(i += 1)];
    } else if (arg === '--filter') {
      options.filter = rest[(i += 1)];
    } else if (arg === '--screenshot') {
      options.screenshot = true;
    } else if (arg === '--rect') {
      options.rect = rest[(i += 1)];
    } else if (arg === '--computed') {
      options.computed = rest[(i += 1)];
      // Any bare words that follow are property names.
      while (rest[i + 1] && !rest[i + 1].startsWith('--')) {
        (options.computedProps ??= []).push(rest[(i += 1)]);
      }
    } else {
      options.positional.push(arg);
    }
  }

  return options;
}

function readStdin() {
  try {
    return readFileSync(0, 'utf-8');
  } catch {
    return '';
  }
}

/**
 * Turn the snippet into a module with a default export.
 *
 * Two accepted shapes:
 *
 *   1. A full module that already has `export default` — used verbatim.
 *   2. Module-level code (imports, helper components, `tasty()` factories)
 *      followed by a trailing JSX expression.
 *
 * The split for (2) is the FIRST line that opens JSX at column 0, with
 * everything from there to EOF taken as the expression.
 *
 * Two rejected alternatives, both of which produce a parse error pointing at
 * the snippet's own code rather than at the wrapper that broke it:
 *
 *   - splitting after the imports swallows any intervening
 *     `const Foo = tasty(…)` into the returned JSX;
 *   - taking the last blank-line-separated block splits multi-line JSX in half,
 *     because blank lines are routine *inside* an element. `<Card>\n <Text/>\n\n
 *     <Text/>\n</Card>` would keep the dangling `<Card>` opener in the preamble
 *     and return only the tail.
 *
 * Column 0 is what makes this safe: nested JSX is always indented, and
 * module-level code (imports, `const`, `function`) never starts with `<`.
 */
function buildSnippetModule(source) {
  const trimmed = source.trim();

  if (/^\s*export\s+default\b/m.test(trimmed)) {
    return trimmed;
  }

  const lines = trimmed.split('\n');
  const start = lines.findIndex((line) => line.startsWith('<'));

  if (start === -1) {
    throw new Error(
      'Could not find a trailing JSX expression. Either end the snippet with a ' +
        'JSX block starting at column 0, or write an explicit ' +
        '`export default function Snippet() { … }`.',
    );
  }

  const preamble = lines.slice(0, start).join('\n').trim();
  const jsx = lines.slice(start).join('\n').trim().replace(/;$/, '');

  return `${preamble}\n\nexport default function Snippet() {\n  return (\n${jsx}\n  );\n}\n`;
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  if (!options.mode || options.mode === '--help' || options.mode === '-h') {
    console.log(USAGE);
    process.exit(options.mode ? 0 : 1);
  }

  if (!['styles', 'tokens', 'render', 'globals'].includes(options.mode)) {
    console.error(`Unknown mode "${options.mode}".\n\n${USAGE}`);
    process.exit(1);
  }

  // Argument validation before any filesystem work — rejecting a run must not
  // wipe the previous run's scratch dir out from under the caller.
  //
  // The browser harness implements `render` only, and imports `snippetPath`
  // unconditionally. Without this, `probe:browser tokens` sends an undefined
  // path, the dynamic import throws, and the catch reports "Snippet failed to
  // compile" — an error about a snippet nobody wrote.
  const browser = process.env.PROBE_TIER === 'browser';

  if (browser && options.mode !== 'render') {
    console.error(
      `probe:browser supports 'render' only — '${options.mode}' is not implemented there.\n` +
        `Run 'pnpm probe ${options.mode}' instead: a browser would not change that answer, ` +
        `since ${options.mode} reports what tasty generates rather than what a browser computes.`,
    );
    process.exit(1);
  }

  // These three are meaningless under jsdom and the jsdom tier does not forward
  // them, so refuse rather than no-op: asking for computed values and silently
  // getting none reads as "no styles applied".
  if (!browser) {
    const browserOnly = [
      options.computed && '--computed',
      options.rect && '--rect',
      options.screenshot && '--screenshot',
    ].filter(Boolean);

    if (browserOnly.length) {
      console.error(
        `probe: ${browserOnly.join(', ')} need${browserOnly.length > 1 ? '' : 's'} a real ` +
          `browser — jsdom resolves no custom properties and sizes everything at 0.\n` +
          `Re-run with 'pnpm probe:browser'.`,
      );
      process.exit(1);
    }
  }

  // Which modes can actually act on a scheme. Silently ignoring `--scheme dark`
  // on a mode that has no scheme is the same failure as silently ignoring
  // `--computed`: the answer comes back looking like the light-mode result was
  // the dark-mode result.
  const schemeAware = browser ? ['render'] : ['tokens'];

  if (
    (options.scheme || options.highContrast) &&
    !schemeAware.includes(options.mode)
  ) {
    const flags = [options.scheme && '--scheme', options.highContrast && '--hc']
      .filter(Boolean)
      .join(', ');

    console.error(
      `probe ${options.mode}: ${flags} has no effect here.\n` +
        (options.mode === 'styles' || options.mode === 'globals'
          ? `'${options.mode}' reports what tasty generated for every scheme at once — the state ` +
            `maps and @media blocks in its output ARE the per-scheme answer.\n`
          : `The jsdom tier cannot resolve a scheme's colors at all. Use 'pnpm probe tokens ` +
            `--scheme <name>' for literal values, or 'pnpm probe:browser render --scheme <name>' ` +
            `for what a browser computes.\n`),
    );
    process.exit(1);
  }

  // Validated here rather than left to the palette. An unknown scheme reaches
  // `renderColorTokens`, misses the variant lookup and throws inside the token
  // renderer — surfacing as a vitest stack trace about `Object.keys(undefined)`,
  // which reads as a harness bug rather than as a typo in the flag.
  const schemes = browser ? ['light', 'dark', 'hc'] : ['light', 'dark'];

  if (options.scheme && !schemes.includes(options.scheme)) {
    console.error(
      `probe: unknown --scheme "${options.scheme}". Expected ${schemes.join(' | ')}.` +
        (browser
          ? `\n('hc' is light + high contrast, the spelling Cube Cloud's probe uses. ` +
            `For dark + high contrast, pass '--scheme dark --hc'.)`
          : `\nAdd --hc for the high-contrast variant of either.`),
    );
    process.exit(1);
  }

  // Fresh id per invocation: the absence of THIS run's result file is the
  // unambiguous signal that the harness itself failed, and a leftover file
  // from an earlier run must never be mistaken for an answer.
  const runId = `${Date.now()}-${process.pid}`;
  const outPath = resolve(SCRATCH_DIR, `out/${runId}.json`);

  rmSync(SCRATCH_DIR, { recursive: true, force: true });
  mkdirSync(SCRATCH_DIR, { recursive: true });

  const input = {
    runId,
    mode: options.mode,
    outPath,
    fullCss: Boolean(options.fullCss),
    canonical: Boolean(options.canonical),
  };

  if (options.mode === 'styles') {
    const raw = options.positional[0] ?? readStdin();

    if (!raw.trim()) {
      console.error('probe styles: expected a styles object as JSON.');
      process.exit(1);
    }

    try {
      input.styles = JSON.parse(raw);
    } catch (error) {
      console.error(`probe styles: could not parse JSON — ${error.message}`);
      process.exit(1);
    }
  }

  if (options.mode === 'tokens') {
    input.tokenOptions = {
      scheme: options.scheme ?? 'light',
      highContrast: Boolean(options.highContrast),
    };
  }

  if (options.mode === 'render') {
    const source = readStdin();

    if (!source.trim()) {
      console.error('probe render: expected a JSX snippet on stdin.');
      process.exit(1);
    }

    input.snippetPath = resolve(SCRATCH_DIR, 'snippet.tsx');
    // The same file addressed two ways, because the two tiers import it from
    // different sides of the dev server. Node takes the filesystem path; the
    // browser harness runs inside Chromium and can only fetch what Vite serves,
    // so it needs a URL relative to the Vite root — an absolute path there is
    // requested as `http://localhost:PORT/Users/…` and 404s.
    input.snippetUrl = '/.probe/snippet.tsx';

    try {
      writeFileSync(input.snippetPath, buildSnippetModule(source));
    } catch (error) {
      console.error(`probe render: ${error.message}`);
      process.exit(1);
    }
  }

  // Must happen BEFORE the input file is written: the browser config bakes the
  // file's contents in through `define` at config-load time, so anything added
  // after the write never reaches the harness.
  if (browser) {
    input.scheme = options.scheme;
    input.highContrast = Boolean(options.highContrast);
    input.computed = options.computed;
    input.computedProps = options.computedProps;
    input.rect = options.rect;
    input.screenshot = Boolean(options.screenshot);
  }

  const inputPath = resolve(SCRATCH_DIR, 'input.json');

  writeFileSync(inputPath, JSON.stringify(input, null, 2));

  // Vitest's own entry through `process.execPath`, not `pnpm exec` or `npx`:
  // one fewer process to boot, and it cannot pick a different vitest than the
  // installed one.
  const run = spawnSync(
    process.execPath,
    [
      resolve(ROOT_DIR, 'node_modules/vitest/vitest.mjs'),
      'run',
      '--config',
      browser ? 'vitest.probe.browser.config.ts' : 'vitest.probe.config.ts',
      '--silent',
    ],
    {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
      env: {
        ...process.env,
        PROBE_INPUT: inputPath,
        PROBE_JSDOM_VERSION: readJsdomVersion(),
        // Selects vitest's non-TTY reporter.
        CI: '1',
      },
    },
  );

  let result;

  try {
    result = JSON.parse(readFileSync(outPath, 'utf-8'));
  } catch {
    console.error('The probe harness failed before it could produce a result.');
    console.error(run.stderr || run.stdout || '(no output)');
    process.exit(1);
  }

  // The result file is the answer, but a non-zero exit means the harness ALSO
  // failed *after* writing it — a failed assertion, an unhandled rejection.
  // Staying silent about that is how a harness bug hides behind output that
  // still looks plausible, so surface it and let the result print anyway.
  if (run.status !== 0) {
    console.error(
      `⚠ The probe harness exited ${run.status} after writing its result. ` +
        `The output below may be incomplete or stale.\n`,
    );
    console.error(
      `${run.stderr?.trim() || run.stdout?.trim() || '(no output)'}\n`,
    );
  }

  print(result, options);
  process.exit(result.ok === false ? 1 : 0);
}

function readJsdomVersion() {
  try {
    return JSON.parse(
      readFileSync(
        resolve(ROOT_DIR, 'node_modules/jsdom/package.json'),
        'utf-8',
      ),
    ).version;
  } catch {
    return 'unknown';
  }
}

function print(result, options) {
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));

    return;
  }

  if (result.ok === false) {
    console.error(
      `Snippet failed to ${result.kind === 'compile' ? 'compile' : 'render'}:\n`,
    );
    console.error(result.message);

    return;
  }

  if (result.mode === 'styles') {
    for (const rule of result.styles ?? []) {
      const body = `${rule.selector || '&'} { ${rule.declarations} }`;

      // At-rules come back alongside the rule rather than wrapped around it, so
      // print them nested — a `@media` or `@container` condition is usually the
      // whole point of the question.
      console.log(
        rule.atRules?.length
          ? `${rule.atRules.join(' { ')} { ${body} ${'}'.repeat(rule.atRules.length)}`
          : body,
      );
    }
  }

  if (result.mode === 'tokens') {
    const entries = Object.entries(result.resolved ?? {}).filter(
      ([name]) => !options.filter || name.includes(options.filter),
    );

    console.log(`# resolved — ${result.scheme} (${entries.length} tokens)`);
    for (const [name, value] of entries) {
      // Legacy aliases come back by reference, not resolved — flagged so a
      // '#surface-text' value is not read as a literal color.
      const alias = typeof value === 'string' && value.startsWith('#');

      console.log(
        `${name}: ${value}${alias ? '   (alias, not resolved)' : ''}`,
      );
    }

    const palette = Object.entries(result.palette ?? {}).filter(
      ([name]) => !options.filter || name.includes(options.filter),
    );

    console.log(
      `\n# <Root> palette (${palette.length} tokens, state maps: '' | @dark | @hc | @dark & @hc)`,
    );
    for (const [name, value] of palette) {
      console.log(`${name}: ${JSON.stringify(value)}`);
    }
  }

  if (result.mode === 'globals') {
    console.log(result.css);
    console.error(
      `\n# ${result.ruleCount} rules on the page with only <Root> mounted. ` +
        `Of those, ${result.subtractedRuleCount} are attributed to a node and so are what ` +
        `'render' subtracts; the rest — the :root token block, body styles, @font-face, ` +
        `keyframes — is injected globally and never enters a per-node dump at all.`,
    );
  }

  if (result.computed) {
    console.log('=== COMPUTED (real browser) ===');
    for (const [prop, value] of Object.entries(result.computed)) {
      console.log(`${prop}: ${value}`);
    }
    console.log('');
  }

  if (result.rect) {
    console.log(`=== RECT === ${JSON.stringify(result.rect)}\n`);
  }

  if (result.screenshotPath) {
    console.log(`=== SCREENSHOT ===\n${result.screenshotPath}\n`);
  }

  if (result.mode === 'render') {
    console.log('=== HTML ===');
    console.log(result.html);

    if (result.portalHtml?.length) {
      console.log(`\n=== PORTALS (${result.portalHtml.length}) ===`);
      console.log('# Overlays mount at the Root, not inside the tree above.\n');
      for (const markup of result.portalHtml) {
        console.log(markup);
      }
    }

    console.log(`\n=== CSS (${result.ruleCount} rules) ===`);
    console.log(result.css);
  }

  if (result.warnings?.length) {
    console.error(
      `\n⚠ jsdom discarded ${result.warnings.length} CSS rule(s) it cannot represent ` +
        `(@container style() / @property). This output is INCOMPLETE — ` +
        `re-run with \`pnpm probe:browser\` for those.`,
    );
  }
}

main();
