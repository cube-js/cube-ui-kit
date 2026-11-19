/**
 * The argument parser and the result printer behind `pnpm probe`.
 *
 * Apart from `probe.mjs` because that file runs `main()` on import, so a spec
 * could not load it without starting a probe.
 */

/**
 * Every flag `parseArgs` knows. A `--computed` group's property list runs up
 * to the next of these, so a custom property such as `--gap` is read as a
 * property name rather than dropped as an unknown flag. A new flag goes here
 * as well as into the parser; the spec fails when the two differ.
 */
export const KNOWN_FLAGS = new Set([
  '--full-css',
  '--canonical',
  '--sr',
  '--json',
  '--hc',
  '--scheme',
  '--filter',
  '--screenshot',
  '--rect',
  '--computed',
]);

export function parseArgs(argv) {
  const [mode, ...rest] = argv;
  const options = { mode, positional: [], errors: [] };

  /**
   * Consume the value after a flag that requires one.
   *
   * A missing value used to land as `undefined`, which every downstream check
   * reads as "flag absent" — so `probe:browser render --computed` produced a
   * plain render and looked like an answer to a computed-values question that was
   * never asked. Worse, `--computed --scheme dark` took `--scheme` itself as the
   * selector, silently dropping the scheme too. An empty value (`--computed ''`)
   * is read as absent the same way. All three are the failure this tool refuses
   * to commit elsewhere, so they are errors rather than defaults.
   */
  const takeValue = (flag, index) => {
    const value = rest[index];

    if (value === undefined) {
      options.errors.push(`${flag} needs a value.`);

      return undefined;
    }

    if (value === '') {
      options.errors.push(
        `${flag} needs a value, but it was given an empty one.`,
      );

      return undefined;
    }

    if (value.startsWith('--')) {
      options.errors.push(
        `${flag} needs a value, but the next argument is the flag "${value}".`,
      );

      return undefined;
    }

    return value;
  };

  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];

    if (arg === '--full-css') {
      options.fullCss = true;
    } else if (arg === '--canonical') {
      options.canonical = true;
    } else if (arg === '--sr') {
      options.screenReader = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--hc') {
      options.highContrast = true;
    } else if (arg === '--scheme') {
      options.scheme = takeValue(arg, (i += 1));
    } else if (arg === '--filter') {
      options.filter = takeValue(arg, (i += 1));
    } else if (arg === '--screenshot') {
      options.screenshot = true;
    } else if (arg === '--rect') {
      // One selector per run. Keeping the last of two would answer for one of
      // them and say nothing about the other.
      if (options.rect !== undefined) {
        options.errors.push(
          '--rect reads one selector per run, and it was given twice. Run the probe once per selector.',
        );
      }

      options.rect = takeValue(arg, (i += 1));
    } else if (arg === '--computed') {
      // Repeatable: each group reads its own element with its own properties.
      const selector = takeValue(arg, (i += 1));
      const props = [];

      // Every word up to the next flag this parser knows is a property name,
      // custom properties (`--gap`) included.
      while (rest[i + 1] !== undefined && !KNOWN_FLAGS.has(rest[i + 1])) {
        props.push(rest[(i += 1)]);
      }

      if (selector !== undefined) {
        // Results are keyed by selector, so a second group for the same one
        // would overwrite the first.
        if (options.computed?.some((group) => group.selector === selector)) {
          options.errors.push(
            `--computed "${selector}" was given twice. List all its properties after one --computed.`,
          );
        }

        (options.computed ??= []).push({ selector, props });
      }
    } else {
      options.positional.push(arg);
    }
  }

  return options;
}

export function print(result, options, harnessLog = '') {
  // Diagnostics go to stderr on every mode, `--json` included: the log is what
  // tells you which file to open, and redirecting stdout to a file is exactly
  // when you would otherwise lose it.
  const printHarnessLog = () => {
    if (harnessLog) {
      console.error(`\n--- dev server log ---\n${harnessLog}`);
    }
  };

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    printHarnessLog();

    return;
  }

  // A `--computed` / `--rect` selector that matched nothing, or is not a valid
  // selector: the message names the flag and the selector, and is all there is.
  if (result.ok === false && result.kind === 'selector') {
    console.error(result.message);

    return;
  }

  if (result.ok === false) {
    console.error(
      {
        play: `The snippet's play() failed:\n`,
        read: `The screen reader could not read the page:\n`,
        compile: `Snippet failed to compile:\n`,
      }[result.kind] ?? `Snippet failed to render:\n`,
    );
    console.error(result.message);
    printHarnessLog();

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

  for (const [selector, values] of Object.entries(result.computed ?? {})) {
    console.log(`=== COMPUTED ${selector} (real browser) ===`);
    for (const [prop, value] of Object.entries(values)) {
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

  const printSpoken = (title, phrases) => {
    console.log(`=== ${title} ===`);
    console.log(phrases.length ? phrases.join('\n') : '(nothing is announced)');
    console.log('');
  };

  if (result.spokenDuringPlay) {
    printSpoken('SCREEN READER — during play()', result.spokenDuringPlay);
  }

  if (result.spoken) {
    printSpoken('SCREEN READER — reading the page', result.spoken);
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

    // Under `--sr` the question is what is announced; the CSS stays in `--json`.
    if (!result.spoken) {
      console.log(`\n=== CSS (${result.ruleCount} rules) ===`);
      console.log(result.css);
    }
  }

  if (result.warnings?.length) {
    console.error(
      `\n⚠ jsdom discarded ${result.warnings.length} CSS rule(s) it cannot represent ` +
        `(@container style() / @property). This output is INCOMPLETE — ` +
        `re-run with \`pnpm probe:browser\` for those.`,
    );
  }
}
