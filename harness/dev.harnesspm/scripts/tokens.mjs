/**
 * uikit:tokens — UI Kit's color tokens by the names Tasty styles use, with
 * their values in light, dark and both high-contrast schemes, and each token's
 * contrast against its base.
 *
 * Built on Glaze's own inspector (the `glaze:inspect` tool's measuring module,
 * shipped in `@tenphi/glaze/harness`), so a ✓ or ✗ here means what a Glaze
 * warning means. UI Kit pins Glaze exactly, and `src/harness.test.ts` imports
 * the module the same way, so a Glaze release that moves it fails there first.
 */
import { existsSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const USAGE = `Usage: npx harnesspm run uikit:tokens [<part of a name>...] [--format <format>] [--json]

Lists UI Kit's color tokens by the names Tasty styles use, such as #surface or
#danger-accent-text, with their values in light, dark and both high-contrast
schemes. Every part you give must appear in the name.

A token made against a base shows its contrast against that base, measured as
Glaze's solver measures it: ✓ meets the token's floor and ✗ misses it. An
alias, such as #dark or #current-fill, shows the token or value it resolves to;
the Usage guide says which aliases are legacy. Values are for UI Kit's default
palette configuration.

--format  how to print colors: hex (default), okhsl, okhst, rgb, hsl or oklch
--json    print the result as JSON`;

/** Tasty token-name prefix of each palette theme. The default theme has none. */
const prefixOf = (theme) => (theme === 'default' ? '' : `${theme}-`);

/**
 * Every emitted color token, then every alias, optionally filtered.
 * `tokenNames` are the keys of `getPaletteTokens()`, so only a color the
 * palette emits is listed. `aliases` maps each other `#name` that
 * `getColorTokens()` defines by value or reference (legacy names such as
 * `#dark`, and current ones such as `#clear` or `#current-fill`) to that value,
 * such as `#surface-text`, `#surface-text-soft.65` or `transparent`.
 */
export function listTokens(
  g,
  measure,
  { palette, codeTheme, tokenNames, aliases = new Map() },
  { filters = [], format = 'hex' } = {},
) {
  const parts = filters.map((f) => f.replace(/^#/, '').toLowerCase());
  const sources = [
    ...palette.list().map((name) => [name, palette.theme(name)]),
    ['code', codeTheme],
  ];
  const matches = (token) => parts.every((part) => token.includes(part));
  const all = [];

  for (const [themeName, theme] of sources) {
    const prefix = themeName === 'code' ? '' : prefixOf(themeName);
    const inspected = measure.inspectTheme(g, theme, themeName, format);

    for (const color of inspected.colors) {
      const token = `#${prefix}${color.name}`;

      // Like `pickCodeTokens` in palette.ts: the code theme emits only `code-*`.
      if (themeName === 'code' && !color.name.startsWith('code-')) continue;
      if (!tokenNames.has(token)) continue;

      all.push({
        token,
        theme: themeName,
        values: color.values,
        ...(color.contrast
          ? {
              contrast: {
                ...color.contrast,
                base: `#${prefix}${color.contrast.base}`,
              },
            }
          : {}),
      });
    }
  }

  const byToken = new Map(all.map((entry) => [entry.token, entry]));
  const aliasEntries = [...aliases].map(([token, value]) => {
    // `#surface-text-soft.65` is that token at 65% opacity.
    const target = byToken.get(/^(#[\w-]+?)(\.\d+)?$/.exec(value)?.[1]);
    const values = Object.fromEntries(
      measure.SCHEMES.map((s) => [
        s.key,
        target?.values[s.key] ?? literal(g, measure, value, format),
      ]),
    );

    return { token, aliasOf: value, values };
  });

  return [...all, ...aliasEntries].filter((entry) => matches(entry.token));
}

/** A literal alias value, such as `okhsl(5 100% 67%)`, in the chosen format. */
function literal(g, measure, value, format) {
  try {
    return measure.formatVariant(g, measure.parseColor(g, value), format);
  } catch {
    // Not a color Glaze parses, such as `transparent`: print it as it is.
    return value;
  }
}

/**
 * What `listTokens` reads, from UI Kit's palette and color-token modules: the
 * built ones in the tool, the source ones in the spec.
 */
export function sourceFrom({
  getPalette,
  getCodeTheme,
  getPaletteTokens,
  getColorTokens,
}) {
  const tokenNames = new Set(Object.keys(getPaletteTokens()));
  const aliases = new Map(
    Object.entries(getColorTokens()).filter(
      ([name, value]) => typeof value === 'string' && !tokenNames.has(name),
    ),
  );

  return {
    palette: getPalette(),
    codeTheme: getCodeTheme(),
    tokenNames,
    aliases,
  };
}

/** Glaze's measuring module, from the Glaze that resolves next to this file. */
export async function loadMeasure(from = import.meta.url) {
  const entry = createRequire(from).resolve('@tenphi/glaze');
  const file = join(
    dirname(entry),
    '..',
    'harness',
    'dev.harnesspm',
    'scripts',
    'measure.mjs',
  );

  return import(pathToFileURL(file).href);
}

function number(metric, value) {
  return metric === 'apca' ? value.toFixed(1) : value.toFixed(2);
}

function floorLabel(pair) {
  const normal = pair.schemes.light?.target;
  const high = pair.schemes.lightContrast?.target;
  const metric = pair.metric.toUpperCase();

  if (normal === undefined && high === undefined) return `${metric}, no floor`;

  const short = (target) => String(Number(target.toFixed(2)));

  return `${metric} ≥ ${normal === high ? short(normal) : `${short(normal)}/${short(high)}`}`;
}

function cell(pair, result) {
  if (result.translucent) return 'translucent';

  const value = number(pair.metric, result.value);

  return result.pass === undefined
    ? value
    : `${result.pass ? '✓' : '✗'} ${value}`;
}

function table(rows) {
  const widths = [];

  for (const row of rows) {
    row.forEach((text, i) => {
      widths[i] = Math.max(widths[i] ?? 0, text.length);
    });
  }

  return rows
    .map((row) =>
      row
        .map((text, i) =>
          i === row.length - 1 ? text : text.padEnd(widths[i]),
        )
        .join('  ')
        .trimEnd(),
    )
    .join('\n');
}

export function render(tokens, schemes, total) {
  const rows = [['token', '', ...schemes.map((s) => s.label)]];

  for (const entry of tokens) {
    rows.push([
      entry.token,
      entry.aliasOf ? `→ ${entry.aliasOf}` : '',
      ...schemes.map((s) => entry.values[s.key]),
    ]);

    const pair = entry.contrast;

    if (pair) {
      rows.push([
        `  vs ${pair.base}`,
        floorLabel(pair),
        ...schemes.map((s) => cell(pair, pair.schemes[s.key])),
      ]);
    }
  }

  return `${table(rows)}\n\n${tokens.length} of ${total} tokens.`;
}

async function main(argv) {
  const filters = [];
  let format = 'hex';
  let json = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--help' || arg === '-h') {
      console.log(USAGE);

      return 0;
    }

    if (arg === '--json') json = true;
    else if (arg === '--format') format = argv[++i];
    else if (arg.startsWith('--format='))
      format = arg.slice('--format='.length);
    else if (arg.startsWith('--')) {
      console.error(`uikit:tokens: unknown option ${arg}\n\n${USAGE}`);

      return 2;
    } else filters.push(arg);
  }

  // Glaze reports a floor it cannot meet with console.warn; the ✗ in the table
  // says the same, so keep the lookup's output to the table.
  const warn = console.warn;

  console.warn = () => {};

  try {
    const g = await import('@tenphi/glaze');
    const measure = await loadMeasure();

    if (!measure.FORMATS.includes(format)) {
      console.error(
        `uikit:tokens: --format must be one of ${measure.FORMATS.join(', ')}`,
      );

      return 2;
    }

    const build = new URL('../../../dist/tokens/palette.js', import.meta.url);

    if (!existsSync(build)) {
      console.error(
        `uikit:tokens: cannot find UI Kit's build at ${fileURLToPath(build)}. In the UI Kit repository, run \`pnpm build\` first.`,
      );

      return 2;
    }

    const source = sourceFrom({
      ...(await import(build.href)),
      ...(await import(
        new URL('../../../dist/tokens/colors.js', import.meta.url).href
      )),
    });
    const tokens = listTokens(g, measure, source, { filters, format });

    if (json) {
      console.log(JSON.stringify(tokens, null, 2));
    } else if (tokens.length === 0) {
      console.log(
        `No token matches ${filters.map((f) => `"${f}"`).join(' and ')}. Try a shorter part of the name.`,
      );
    } else {
      console.log(
        render(
          tokens,
          measure.SCHEMES,
          source.tokenNames.size + source.aliases.size,
        ),
      );
    }

    return 0;
  } finally {
    console.warn = warn;
  }
}

// pnpm and harnesspm may start this file through a symlink.
if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
) {
  process.exitCode = await main(process.argv.slice(2));
}
