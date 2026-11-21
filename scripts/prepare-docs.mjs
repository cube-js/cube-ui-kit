/**
 * Builds the docs the package ships, at `prepack`: the Storybook pages become
 * plain Markdown in `docs/`, and `docs/llms.txt` indexes them. The harness
 * names `docs/` as UI Kit's docs (`harness/plugin.json`), so harnesspm gives
 * consumers' agents that index as `uikit:docs`. `--clean`, at `postpack`,
 * removes what the build wrote.
 *
 *   src/stories/{Name}.docs.mdx                        -> docs/{Name}.md
 *   src/components/{Name}.docs.mdx                     -> docs/components/{Name}.md
 *   src/components/{category}/[{Dir}/]{Name}.docs.mdx  -> docs/components/{category}/{Name}.md
 *   src/components/form/Form/modern-form-*.md          -> docs/components/form/modern-form-*.md
 *
 * A page loses its imports and Storybook blocks (`<Meta>`, `<Story>`,
 * `<Canvas>`, …). A guide that a page renders with `<Markdown>` is inlined
 * there, and links to the guide lead to that page. Links are rewritten to work
 * in the package:
 *
 * - A Storybook docs route (`/docs/<id>--docs`, `?path=/docs/…` or the full
 *   Storybook URL) leads to the page made from that docs file. A component
 *   with stories but no docs file has an autodocs page only, so its route
 *   becomes the Storybook URL.
 * - A relative link, or a GitHub link into this repository, leads to the page
 *   made from that file. A file that exists but doesn't ship gets a GitHub link.
 *
 * A link that leads nowhere fails the build, so dead links never ship.
 *
 * Usage: node scripts/prepare-docs.mjs [--clean]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '..');
const DOCS = 'docs';
/** What the last build wrote, outside `docs/` so it never ships. */
const MANIFEST = '.docs-generated';
const STORYBOOK = 'https://cube-ui-kit.vercel.app/';
const GITHUB = 'https://github.com/cube-js/cube-ui-kit/';
/** Guides that ship as pages of their own, next to their component's page. */
const GUIDE = /^src\/components\/form\/Form\/modern-form-[a-z-]+\.md$/;
const STORIES = /\.stories\.[jt]sx?$/;

const posix = path.posix;
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(ROOT, file));

/** Storybook's id for a title: `Actions/Button.Split` → `actions-button-split`. */
export const storyId = (title) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Where the page made from a source file goes. Paths are POSIX, from the repo root. */
export function outputOf(file) {
  const parts = file.split('/');
  const name = parts.at(-1).replace(/\.docs\.mdx$/, '.md');

  if (parts[1] === 'stories') return `${DOCS}/${name}`;

  // src/components/[{category}/[{Dir}/]]{name}: a component's own folder is dropped.
  const category = parts.length > 3 ? [parts[2]] : [];

  return [DOCS, 'components', ...category, name].join('/');
}

/** The meta title of a stories file. */
export function metaTitle(text) {
  const meta = /(?:export\s+default|const\s+meta\b[^=]*=)\s*\{/.exec(text);

  return meta
    ? /\btitle:\s*['"]([^'"]+)['"]/.exec(text.slice(meta.index))?.[1]
    : undefined;
}

/** The Storybook title of a docs page: its own `<Meta title>`, or its stories' title. */
function pageTitle(file, text) {
  const inline = /<Meta\s+title=["']([^"']+)["']/.exec(text);

  if (inline) return inline[1];

  const binding = /<Meta\s+of=\{(\w+)\}/.exec(text)?.[1];
  const from =
    binding &&
    new RegExp(`import \\* as ${binding} from ['"]([^'"]+)['"]`).exec(
      text,
    )?.[1];

  if (!from) return undefined;

  const base = posix.join(posix.dirname(file), from);
  const stories = [base, ...['.tsx', '.ts', '.jsx', '.js'].map((e) => base + e)]
    .filter((candidate) => STORIES.test(candidate))
    .find(exists);

  return stories ? metaTitle(read(stories)) : undefined;
}

/**
 * Whether each line is code: a fence or a line inside one. A fence closes only
 * with the same character, at least as long, so a ```` fence can hold ```
 * lines (CommonMark).
 */
function fenced(lines) {
  let fence;

  return lines.map((line) => {
    const marker = /^\s*(`{3,}|~{3,})(.*)$/.exec(line);

    if (fence) {
      if (
        marker &&
        marker[1][0] === fence[0] &&
        marker[1].length >= fence.length &&
        marker[2].trim() === ''
      ) {
        fence = undefined;
      }

      return true;
    }

    if (marker) fence = marker[1];

    return Boolean(marker);
  });
}

/** Replaces each line outside code fences with what `fn` returns for it. */
function mapProse(text, fn) {
  const lines = text.split('\n');
  const code = fenced(lines);

  return lines.flatMap((line, i) => (code[i] ? [line] : fn(line))).join('\n');
}

/**
 * Drops the headings left with nothing under them, such as a section that
 * held only a story: the next content is a heading of the same or a higher
 * level, a `---` or the end. Repeats, so a section left empty goes too.
 */
export function pruneEmptySections(markdown) {
  let lines = markdown.split('\n');

  for (;;) {
    const code = fenced(lines);
    const level = (i) =>
      code[i] ? undefined : /^(#{2,6}) /.exec(lines[i])?.[1].length;
    const empty = lines.map((_, i) => {
      const own = level(i);

      if (!own) return false;

      let next = i + 1;

      while (next < lines.length && lines[next].trim() === '') next++;

      return (
        next === lines.length ||
        level(next) <= own ||
        (!code[next] && lines[next].trim() === '---')
      );
    });

    if (!empty.includes(true)) break;
    lines = lines.filter((_, i) => !empty[i]);
  }

  return `${lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd()}\n`;
}

/**
 * MDX → Markdown: drops imports, exports, MDX comments and Storybook blocks.
 * `<Markdown>{guide}</Markdown>` becomes `{{include <file>}}`, for the caller
 * to replace with that file, read as `guide` is imported.
 */
export function stripMdx(text, file) {
  const raw = new Map(
    [...text.matchAll(/^import (\w+) from ['"]([^'"]+)\?raw['"];?$/gm)].map(
      ([, binding, from]) => [binding, posix.join(posix.dirname(file), from)],
    ),
  );
  // A statement or tag spans lines until this test passes on its last line.
  let until;

  const result = mapProse(text, (line) => {
    const trimmed = line.trim();

    if (until) {
      if (until(trimmed)) until = undefined;

      return [];
    }

    const include = /^<Markdown>\{(\w+)\}<\/Markdown>$/.exec(trimmed);

    if (include && raw.has(include[1])) {
      return [`{{include ${raw.get(include[1])}}}`];
    }

    const skip = (end) => {
      if (!end(trimmed)) until = end;

      return [];
    };

    if (/^import\s/.test(trimmed)) {
      return skip((l) =>
        /(^|\s)from\s+['"][^'"]+['"];?$|^import\s+['"][^'"]+['"];?$/.test(l),
      );
    }

    if (/^export\s/.test(trimmed)) return skip((l) => /[;}]$/.test(l));

    if (trimmed.startsWith('{/*')) return skip((l) => l.endsWith('*/}'));

    // A component's tag on a line of its own (`<Story of={…} />`, `<Canvas>`,
    // `</Canvas>`), or one still open, which ends on a later line. A line
    // with text after its tags is prose, and stays.
    if (
      /^<\/?[A-Z][\w.]*(\s|\/?>|$)/.test(trimmed) &&
      (trimmed.endsWith('>') || !trimmed.includes('>'))
    ) {
      return skip((l) => l.endsWith('>'));
    }

    return [line];
  });

  return `${result
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\n+/, '')
    .trimEnd()}\n`;
}

const relative = (from, to) => {
  const link = posix.relative(posix.dirname(from), to);

  return link.startsWith('.') ? link : `./${link}`;
};

/**
 * Rewrites the link targets on one line of a page made from `file` into
 * `out`. `site` knows the pages and Storybook ids; problems go to `errors`.
 */
export function rewriteLinks(line, { file, out, site, errors }) {
  const target = (url, hash) => {
    const route =
      /^(?:(?:https:\/\/cube-ui-kit\.vercel\.app)?\/?\?path=)?\/(docs|story)\/([\w-]+)$/.exec(
        url,
      );

    if (route) {
      const [, kind, id] = route;
      const page = kind === 'docs' && site.pageById.get(id);

      if (page) return relative(out, page) + hash;
      if (kind === 'story' || site.ids.has(id)) {
        return `${STORYBOOK}?path=/${kind}/${id}${hash}`;
      }

      errors.push(`${file}: no Storybook page for ${url}`);

      return url + hash;
    }

    const github = new RegExp(
      `^${GITHUB.replace(/[.]/g, '\\.')}(?:blob|tree)/main/(.+)$`,
    ).exec(url);
    let repoPath;

    if (github) repoPath = github[1];
    else if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return url + hash;
    else if (url.startsWith('/')) {
      errors.push(`${file}: ${url} is not a Storybook route or a file`);

      return url + hash;
    } else {
      repoPath = posix.join(posix.dirname(file), decodeURI(url));
    }

    const page = site.outputs.get(repoPath);

    if (page) return relative(out, page) + hash;
    if (!exists(repoPath)) {
      errors.push(`${file}: ${url} leads to a missing file`);

      return url + hash;
    }

    return github ? url + hash : `${GITHUB}blob/main/${repoPath}${hash}`;
  };

  // Inline code keeps its text: only the parts outside backticks are links.
  return line
    .split(/(`[^`]*`)/)
    .map((part, index) =>
      index % 2
        ? part
        : part.replace(
            /\]\(([^)\s#]*)(#[^)\s]*)?\)/g,
            (match, url, hash = '') =>
              url === '' ? match : `](${target(url, hash)})`,
          ),
    )
    .join('');
}

/** A page's title (its first `#` heading) and the first sentence of its first paragraph. */
export function summarize(markdown) {
  const heading = /^# (.+)$/m.exec(markdown);
  const title = heading?.[1].trim();
  let description;

  mapProse(
    markdown.slice(heading ? heading.index + heading[0].length : 0),
    (line) => {
      const text = line.trim();

      if (
        description === undefined &&
        text !== '' &&
        !/^(#|[-*+] |\d+\. |\||>|<|!\[|\{\{)/.test(text)
      ) {
        const plain = text
          .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
          .replace(/\*\*([^*]+)\*\*/g, '$1');
        const sentence = /^.*?[.!?](?=\s|$)/.exec(plain)?.[0] ?? plain;

        description =
          sentence.length > 200
            ? `${sentence.slice(0, sentence.lastIndexOf(' ', 199))}…`
            : sentence;
      }

      return [line];
    },
  );

  return { title, description };
}

const capitalize = (word) => word[0].toUpperCase() + word.slice(1);

/** `docs/llms.txt`: guides first, then components by category, by title. */
export function llmsIndex(pages) {
  const groups = new Map();

  for (const page of pages) {
    const [, ...rest] = page.out.split('/');
    const group =
      rest.length === 1
        ? 'Guides'
        : rest.length === 2
          ? 'Components'
          : capitalize(rest[1]);

    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(page);
  }

  const order = (name) => ['Guides', 'Components'].indexOf(name) + 1 || 3;
  const sections = [...groups]
    .sort(([a], [b]) => order(a) - order(b) || a.localeCompare(b))
    .map(([name, list]) =>
      [
        `## ${name}`,
        '',
        ...list
          .sort((a, b) =>
            a.title
              .replaceAll('`', '')
              .localeCompare(b.title.replaceAll('`', '')),
          )
          .map(
            ({ out, title, description }) =>
              `- [${title}](${posix.relative(DOCS, out)})${description ? `: ${description}` : ''}`,
          ),
      ].join('\n'),
    );

  return [
    '# Cube UI Kit',
    '',
    "> Docs for `@cube-dev/ui-kit`, the version installed in this project. Start with the [Usage Guide](Usage.md): units, tokens, presets, colors, modifiers, state syntax and the form system. Read a component's page before you use it.",
    '',
    ...sections.flatMap((section) => [section, '']),
  ].join('\n');
}

function sources() {
  return fs
    .readdirSync(path.join(ROOT, 'src'), { recursive: true })
    .map((file) => posix.join('src', file.split(path.sep).join('/')))
    .sort();
}

/**
 * Builds every page in memory. Returns `{ files, warnings }`, where `files`
 * maps an output path to its content; throws with every dead link.
 */
export function buildDocs() {
  const all = sources();
  const docs = all.filter(
    (file) =>
      file.endsWith('.docs.mdx') && /^src\/(components|stories)\//.test(file),
  );
  const site = { outputs: new Map(), pageById: new Map(), ids: new Set() };
  const inlined = new Map();

  for (const file of all.filter((f) => STORIES.test(f))) {
    const title = metaTitle(read(file));

    if (title) site.ids.add(`${storyId(title)}--docs`);
  }

  const warnings = [];

  for (const file of docs) {
    const text = read(file);
    const out = outputOf(file);
    const title = pageTitle(file, text);

    if (title) {
      site.pageById.set(`${storyId(title)}--docs`, out);
      site.ids.add(`${storyId(title)}--docs`);
    } else {
      warnings.push(`${file}: no Storybook title, so no link can lead here`);
    }

    for (const [, from] of text.matchAll(
      /^import \w+ from ['"]([^'"]+)\?raw['"];?$/gm,
    )) {
      inlined.set(posix.join(posix.dirname(file), from), out);
    }
  }

  const guides = all.filter((file) => GUIDE.test(file) && !inlined.has(file));
  const pages = [...docs, ...guides];
  const files = new Map();
  const errors = [];

  for (const file of pages) site.outputs.set(file, outputOf(file));
  for (const [file, out] of inlined) site.outputs.set(file, out);

  for (const [out, list] of Object.entries(
    Object.groupBy(pages, (file) => outputOf(file)),
  )) {
    if (list.length > 1)
      errors.push(`${list.join(' and ')} both become ${out}`);
  }

  const convert = (file, out) =>
    mapProse(stripMdx(read(file), file), (line) => [
      rewriteLinks(line, { file, out, site, errors }),
    ]).replace(/^\{\{include (.+)\}\}$/gm, (_, guide) =>
      convert(guide, out).trimEnd(),
    );

  for (const file of pages) {
    const out = outputOf(file);

    files.set(out, pruneEmptySections(convert(file, out)));
  }

  if (errors.length > 0) {
    throw new Error(
      `The docs have ${errors.length} dead link(s):\n${errors.map((e) => `  ${e}`).join('\n')}`,
    );
  }

  const index = [...files].map(([out, markdown]) => {
    const { title, description } = summarize(markdown);

    return { out, title: title ?? posix.basename(out, '.md'), description };
  });

  files.set(`${DOCS}/llms.txt`, llmsIndex(index));

  return { files, warnings };
}

/** Removes what the last build wrote: the files its manifest lists, and `docs/components`. */
export function cleanDocs() {
  const manifest = path.join(ROOT, MANIFEST);
  const written = fs.existsSync(manifest)
    ? fs.readFileSync(manifest, 'utf8').split('\n').filter(Boolean)
    : [];

  for (const file of written) fs.rmSync(path.join(ROOT, file), { force: true });
  fs.rmSync(path.join(ROOT, DOCS, 'components'), {
    recursive: true,
    force: true,
  });
  fs.rmSync(manifest, { force: true });

  return written.length;
}

function main() {
  if (process.argv.includes('--clean')) {
    console.log(`[prepare-docs] Removed ${cleanDocs()} generated files`);

    return;
  }

  const { files, warnings } = buildDocs();

  cleanDocs();

  for (const [file, content] of files) {
    fs.mkdirSync(path.dirname(path.join(ROOT, file)), { recursive: true });
    fs.writeFileSync(path.join(ROOT, file), content);
  }

  fs.writeFileSync(
    path.join(ROOT, MANIFEST),
    `${[...files.keys()].join('\n')}\n`,
  );

  for (const warning of warnings) console.warn(`[prepare-docs] ${warning}`);
  console.log(`[prepare-docs] Wrote ${files.size} files to ${DOCS}/`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(`[prepare-docs] ${error.message}`);
    process.exit(1);
  }
}
