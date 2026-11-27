/**
 * Moves and renames files by a ledger, and rewrites everything that names
 * them. A branch that started before a restructure catches up by rebasing and
 * running it again: a move already made is skipped, and the branch's own files
 * get their references rewritten the same way.
 *
 * The ledger, `scripts/move-files.json`, maps each path from the repository
 * root to where it goes. An entry may move a file another entry already moved
 * (`a → b`, then `b → c`), in any order. For every tracked or untracked (not
 * ignored) file, the script:
 *
 * 1. Moves each file the ledger names straight to where it finally goes, with
 *    `git mv` when tracked.
 * 2. Rewrites relative module specifiers in code and MDX (`import`, `export …
 *    from`, `import()`, `require()`, `vi.mock()` and friends) that lead to a
 *    moved file, and those of a moved file that lead to a file that stayed.
 * 3. Rewrites relative links in Markdown the same way, with or without `./`.
 * 4. Rewrites paths from the root (`src/utils/react/useId.tsx`, with or without
 *    the extension) in every text file, including the path-keyed baselines. A
 *    JSON object whose keys were sorted stays sorted, in the same order and
 *    format its tool writes.
 * 5. Prints the relative specifiers that lead nowhere, and the old names still
 *    written some other way (a bare file name, a module path from `src/` in a
 *    config, an import in a Markdown code block), for a person to fix.
 *
 * Usage: node scripts/move-files.mjs [--dry-run]
 *
 * A dry run moves nothing, so it reads a file it would move at its old path:
 * its count leaves out the rewrites inside a file that moves to another folder.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const posix = path.posix;

const CODE = /\.(?:[cm]?[jt]sx?)$/;
const MARKDOWN = /\.mdx?$/;
const MDX = /\.mdx$/;
const RESOLVABLE = [
  '.ts',
  '.tsx',
  '.mts',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.d.ts',
];
const INDEXES = RESOLVABLE.map((ext) => `/index${ext}`);
/** A specifier with one of these extensions names its file exactly. */
const EXPLICIT = /\.(?:[cm]?[jt]sx?|json|css|svg|png|mdx?|snap)$/;
/** History, and this script with its ledger and examples: never rewritten. */
const FROZEN = new Set([
  'CHANGELOG.md',
  'pnpm-lock.yaml',
  'scripts/move-files.json',
  'scripts/move-files.mjs',
  'scripts/move-files.test.mjs',
]);
const BINARY = /\.(?:png|jpe?g|gif|webp|ico|woff2?|ttf|otf|eot|zip|gz|tgz)$/i;
const MOCKING =
  /^(?:vi|vitest|jest)\.(?:mock|doMock|unmock|doUnmock|importActual|importMock|requireActual)$/;

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const stripExt = (file) =>
  file.replace(/\.d\.ts$/, '').replace(/\.(?:[cm]?[jt]sx?)$/, '');

/**
 * The files a relative specifier can mean, from the directory of `base`, in
 * resolution order. A Markdown link is `exact`: it names its file.
 */
export function candidates(base, specifier, exact = false) {
  const target = posix.normalize(posix.join(posix.dirname(base), specifier));

  if (exact) return [target.replace(/\/$/, '')];
  if (/(?:^|\/)\.{1,2}$|\/$/.test(specifier))
    return INDEXES.map((index) => target.replace(/\/$/, '') + index);
  if (EXPLICIT.test(specifier)) return [target];

  return [
    ...RESOLVABLE.map((ext) => target + ext),
    ...INDEXES.map((index) => target + index),
  ];
}

function relativeSpecifier(fromFile, toPath) {
  const relative = posix.relative(posix.dirname(fromFile), toPath) || '.';

  return relative.startsWith('.') ? relative : `./${relative}`;
}

/** How `specifier` should read so that, from `file`, it leads to `next` the way it led to `previous`. */
function respell(file, specifier, previous, next, exact) {
  if (exact) return relativeSpecifier(file, next);

  const viaIndex =
    INDEXES.some((index) => previous.endsWith(index)) &&
    !/(?:^|\/)index(?:\.\w+)?$/.test(specifier);

  if (viaIndex && INDEXES.some((index) => next.endsWith(index)))
    return relativeSpecifier(file, posix.dirname(next));
  if (EXPLICIT.test(specifier)) return relativeSpecifier(file, next);

  return relativeSpecifier(file, stripExt(next));
}

/**
 * The specifier `file` should use for `specifier` once the ledger's moves are
 * made, or `null` when it stays as it is. `origin` is where `file` was before
 * it moved (itself when it didn't); `exists` checks a path, case-sensitively.
 * A query (`?raw`) stays as it is.
 */
export function rewriteSpecifier({
  file,
  origin,
  specifier: full,
  moves,
  exists,
  exact = false,
}) {
  if (!full.startsWith('.')) return null;

  const [specifier, query = ''] = full.split(/(?=\?)/);
  const found = candidates(file, specifier, exact).find(exists);

  if (found && !moves.has(found)) return null;

  for (const base of origin === file ? [file] : [file, origin]) {
    for (const candidate of candidates(base, specifier, exact)) {
      const next =
        moves.get(candidate) ??
        (base !== file && exists(candidate) && candidate);

      if (next) return respell(file, specifier, candidate, next, exact) + query;
    }
  }

  return null;
}

/** Whether a relative specifier leads to a file from `file`. */
export function resolves(file, full, exists, exact = false) {
  const [specifier] = full.split(/(?=\?)/);

  return candidates(file, specifier, exact).some(exists);
}

/** Every path from the root in `text` that names a moved file, rewritten. */
export function rewritePaths(text, moves) {
  let result = text;

  for (const [from, to] of moves) {
    const before = '(?<![\\w.-])';
    const after = '(?![\\w-]|\\.\\w)';

    result = result.replace(new RegExp(before + escape(from) + after, 'g'), to);

    const bareFrom = stripExt(from);

    if (bareFrom !== from)
      result = result.replace(
        new RegExp(before + escape(bareFrom) + after, 'g'),
        stripExt(to),
      );
  }

  return result;
}

/** Each moved path mapped to where the ledger finally puts it. */
export function finalMoves(ledger) {
  const next = new Map(ledger);

  return new Map(
    ledger.map(([from]) => {
      let to = from;

      for (let step = 0; next.has(to) && step <= ledger.length; step += 1)
        to = next.get(to);

      return [from, to];
    }),
  );
}

const byCodeUnit = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const byLocale = (a, b) => a.localeCompare(b);

function isSorted(keys, compare) {
  return keys.every((key, i) => i === 0 || compare(keys[i - 1], key) <= 0);
}

/**
 * `next` (the JSON `previous` became once its keys were renamed in place),
 * with every object whose keys `previous` kept sorted sorted again by the same
 * order. Returns `null` when nothing needed sorting.
 */
export function keepSorted(previous, next) {
  let changed = false;

  function walk(before, after) {
    if (Array.isArray(after))
      return after.map((item, i) => walk(before?.[i], item));
    if (!after || typeof after !== 'object') return after;

    const beforeKeys = Object.keys(before ?? {});
    const entries = Object.entries(after).map(([key, value], i) => [
      key,
      walk(before?.[beforeKeys[i]], value),
    ]);
    const keys = entries.map(([key]) => key);
    const compare = [byCodeUnit, byLocale].find((order) =>
      isSorted(beforeKeys, order),
    );

    if (compare && beforeKeys.length > 1 && !isSorted(keys, compare)) {
      entries.sort(([a], [b]) => compare(a, b));
      changed = true;
    }

    return Object.fromEntries(entries);
  }

  const result = walk(previous, next);

  return changed ? result : null;
}

/** Serializes `value` the way `original` was written: `JSON.stringify` with two spaces, or Prettier over compact JSON. */
async function formatJson(file, original, previous, value) {
  if (original === JSON.stringify(previous, null, 2) + '\n')
    return JSON.stringify(value, null, 2) + '\n';

  const prettier = await import('prettier');
  const options = {
    ...(await prettier.resolveConfig(file)),
    filepath: file,
  };

  if (original === (await prettier.format(JSON.stringify(previous), options)))
    return prettier.format(JSON.stringify(value), options);

  return null;
}

/** Module specifiers in a code file: `[start, end, specifier]`, positions inside the quotes. */
async function codeSpecifiers(file, text) {
  const { default: ts } = await import('typescript');
  const source = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    /x$/.test(file) ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const found = [];
  const add = (node) => {
    if (
      node &&
      (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    )
      found.push([node.getStart(source) + 1, node.getEnd() - 1, node.text]);
  };

  (function visit(node) {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
      add(node.moduleSpecifier);
    else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument))
      add(node.argument.literal);
    else if (ts.isCallExpression(node)) {
      const callee = node.expression;
      const name =
        callee.kind === ts.SyntaxKind.ImportKeyword
          ? 'import'
          : callee.getText(source);

      if (name === 'import' || name === 'require' || MOCKING.test(name))
        add(node.arguments[0]);
    }
    ts.forEachChild(node, visit);
  })(source);

  return found;
}

/**
 * Relative `](x)` links in Markdown, which name their file exactly, and
 * `import … from './x'` in MDX. A link without `./` gets one to resolve, and
 * `bare` says to drop it again. Fenced code is an example, not a link or an
 * import, so it is blanked out first, keeping every offset.
 */
function markdownSpecifiers(file, markdown) {
  const text = markdown.replace(
    /^[ \t]*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^[ \t]*\1[ \t]*$/gm,
    (block) => block.replace(/[^\n]/g, ' '),
  );
  const found = [];
  const patterns = [
    [/\]\(((?![a-z][\w+.-]*:|[/#<])[^)\s#?]+)/gi, true],
    ...(MDX.test(file) ? [[/\bfrom\s+['"](\.{1,2}\/[^'"]+)['"]/g, false]] : []),
  ];

  for (const [pattern, exact] of patterns) {
    for (const match of text.matchAll(pattern)) {
      const start = match.index + match[0].indexOf(match[1]);
      const bare = !match[1].startsWith('.');

      found.push([
        start,
        start + match[1].length,
        bare ? `./${match[1]}` : match[1],
        exact,
        bare,
      ]);
    }
  }

  return found;
}

function replaceRanges(text, edits) {
  let result = text;

  for (const [start, end, value] of [...edits].sort((a, b) => b[0] - a[0]))
    result = result.slice(0, start) + value + result.slice(end);

  return result;
}

export async function main({ root, dryRun = false, log = console.log }) {
  const git = (...args) =>
    execFileSync('git', args, { cwd: root, encoding: 'utf8' });
  const abs = (file) => path.join(root, file);
  const exists = (file) => {
    try {
      return fs
        .readdirSync(path.dirname(abs(file)))
        .includes(posix.basename(file));
    } catch {
      return false;
    }
  };
  const ledger = Object.entries(
    JSON.parse(fs.readFileSync(abs('scripts/move-files.json'), 'utf8')),
  );
  const moves = finalMoves(ledger);
  // Where a file's relative imports were written from, if not where it is.
  const origins = new Map(ledger.map(([from]) => [moves.get(from), from]));
  const tracked = new Set(git('ls-files', '-z').split('\0').filter(Boolean));

  // 1. Moves, each file straight to where the ledger finally puts it, so the
  // order of the entries doesn't matter.
  let moved = 0;

  for (const [from, to] of moves) {
    if (!exists(from)) continue;
    if (exists(to) && from.toLowerCase() !== to.toLowerCase())
      throw new Error(`Both ${from} and ${to} exist: resolve it by hand.`);

    moved += 1;
    origins.set(to, from);
    if (dryRun) continue;
    fs.mkdirSync(path.dirname(abs(to)), { recursive: true });
    if (tracked.has(from)) git('mv', from, to);
    else fs.renameSync(abs(from), abs(to));
  }

  const files = [
    ...git('ls-files', '-z').split('\0'),
    ...git('ls-files', '-z', '--others', '--exclude-standard').split('\0'),
  ].filter(
    (file) =>
      file &&
      !FROZEN.has(file) &&
      !BINARY.test(file) &&
      // Not a symlink: its target is listed on its own.
      fs.lstatSync(abs(file), { throwIfNoEntry: false })?.isFile(),
  );

  let rewritten = 0;
  // What a dry run would write, for step 5 to read in place of the disk.
  const written = new Map();
  const unresolved = [];

  for (const file of new Set(files)) {
    const original = fs.readFileSync(abs(file), 'utf8');

    if (original.includes('\0')) continue;

    const origin = origins.get(file) ?? file;
    let text = original;

    // 2–3. Relative specifiers and links.
    const specifiers = CODE.test(file)
      ? await codeSpecifiers(file, text)
      : MARKDOWN.test(file)
        ? markdownSpecifiers(file, text)
        : [];
    const edits = [];

    for (const [start, end, specifier, exact, bare] of specifiers) {
      const next = rewriteSpecifier({
        file,
        origin,
        specifier,
        moves,
        exists,
        exact,
      });

      if (next && next !== specifier)
        edits.push([start, end, bare ? next.replace(/^\.\//, '') : next]);
      // A rewritten one leads to a moved file, which a dry run hasn't moved.
      const target = next ?? specifier;

      if (
        target.startsWith('.') &&
        !(next && dryRun) &&
        !resolves(file, target, exists, exact)
      )
        unresolved.push(`${file}: ${target}`);
    }
    text = replaceRanges(text, edits);

    // 4. Paths from the root.
    text = rewritePaths(text, moves);

    if (text === original) continue;

    if (file.endsWith('.json')) {
      try {
        const previous = JSON.parse(original);
        const next = JSON.parse(text);
        const sorted = keepSorted(previous, next);
        // Written again as its tool writes it: a longer path can change how
        // Prettier wraps a line.
        const formatted = await formatJson(
          file,
          original,
          previous,
          sorted ?? next,
        );

        if (formatted) text = formatted;
        else if (sorted)
          log(`! ${file}: renamed keys, but could not keep them sorted`);
      } catch {
        // JSON with comments: the rewritten text stands.
      }
    }

    rewritten += 1;
    written.set(file, text);
    if (!dryRun) fs.writeFileSync(abs(file), text);
  }

  // 5. What a person should check: a renamed file's old name, or a moved
  // file's old path from `src/` without the extension (a module path in a
  // config), written some other way.
  const leftovers = [];
  const oldNames = [...moves].flatMap(([from, to]) => {
    const fromSrc = stripExt(from).replace(/^src\//, '');

    return [
      ...(stripExt(posix.basename(from)) !== stripExt(posix.basename(to))
        ? [posix.basename(from)]
        : []),
      ...(fromSrc.includes('/') && stripExt(from) !== stripExt(to)
        ? [fromSrc]
        : []),
    ];
  });
  const oldName = new RegExp(
    `(?<![\\w-])(?:${[...new Set(oldNames)].map(escape).join('|')})(?![\\w-])`,
    'g',
  );

  for (const file of new Set(files)) {
    if (!oldNames.length || !fs.existsSync(abs(file))) continue;

    const text = written.get(file) ?? fs.readFileSync(abs(file), 'utf8');

    for (const [name] of text.matchAll(oldName))
      leftovers.push(`${file}: ${name}`);
  }

  log(
    `${dryRun ? 'Would move' : 'Moved'} ${moved} file(s); ${dryRun ? 'would rewrite' : 'rewrote'} ${rewritten} file(s).`,
  );
  if (unresolved.length)
    log(
      `\nRelative specifiers that lead nowhere:\n  ${unresolved.join('\n  ')}`,
    );
  if (leftovers.length)
    log(`\nOld file names still mentioned:\n  ${leftovers.join('\n  ')}`);

  return { moved, rewritten, unresolved, leftovers };
}

if (import.meta.main) {
  await main({
    root: path.resolve(import.meta.dirname, '..'),
    dryRun: process.argv.includes('--dry-run'),
  });
}
