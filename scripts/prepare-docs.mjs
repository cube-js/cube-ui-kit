/**
 * prepare-docs.mjs
 *
 * Copies *.docs.mdx files to docs/, converting them to plain markdown
 * by stripping JSX and fixing links.
 *
 * Sources:
 *   src/components/**\/*.docs.mdx -> docs/components/{category}/{Name}.md
 *   src/stories/*.docs.mdx       -> docs/{Name}.md
 *
 * Run via: node scripts/prepare-docs.mjs
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const COMPONENT_SRC = 'src/components';
const STORIES_SRC = 'src/stories';
const DOCS_DIR = 'docs';
const COMPONENT_OUT = path.join(DOCS_DIR, 'components');

const log = (...a) => console.log('[prepare-docs]', ...a);

/* ── helpers ──────────────────────────────────────────────────────────── */

async function glob(dir, pattern) {
  const results = [];
  const items = await fs.readdir(dir, { withFileTypes: true });

  for (const item of items) {
    const full = path.join(dir, item.name);

    if (item.isDirectory()) {
      results.push(...(await glob(full, pattern)));
    } else if (pattern.test(item.name)) {
      results.push(full);
    }
  }

  return results;
}

/**
 * Convert a Storybook title like "Actions/Button.Split" to
 * the docs story ID "actions-button-split--docs".
 */
function titleToStoryId(title) {
  return (
    title
      .toLowerCase()
      .replace(/[/.]/g, '-')
      .replace(/\s+/g, '-') +
    '--docs'
  );
}

/**
 * Compute the output path for a component docs file.
 *
 * src/components/{category}/{Name}/{Name}.docs.mdx -> docs/components/{category}/{Name}.md
 * src/components/{category}/{file}.docs.mdx        -> docs/components/{category}/{file}.md
 * src/components/{file}.docs.mdx                   -> docs/components/{file}.md
 */
function computeComponentOutputPath(srcPath) {
  const rel = path.relative(COMPONENT_SRC, srcPath);
  const parts = rel.split(path.sep);
  const fileName = parts[parts.length - 1].replace(/\.docs\.mdx$/, '.md');

  if (parts.length === 1) {
    return path.join(COMPONENT_OUT, fileName);
  }

  if (parts.length === 2) {
    return path.join(COMPONENT_OUT, parts[0], fileName);
  }

  // parts.length >= 3: category/SubDir/File.docs.mdx -> category/File.md
  return path.join(COMPONENT_OUT, parts[0], fileName);
}

/**
 * Compute the output path for a top-level stories docs file.
 *
 * src/stories/{Name}.docs.mdx -> docs/{Name}.md
 */
function computeStoriesOutputPath(srcPath) {
  const fileName = path.basename(srcPath).replace(/\.docs\.mdx$/, '.md');
  return path.join(DOCS_DIR, fileName);
}

/**
 * Extract the Storybook title from a stories file.
 * Looks for `title: 'Category/Name'` or `title: "Category/Name"`.
 */
async function extractStoryTitle(storiesPath) {
  try {
    const content = await fs.readFile(storiesPath, 'utf8');
    const match = content.match(/title:\s*['"]([^'"]+)['"]/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Extract an inline <Meta title="..." /> from the MDX content.
 */
function extractInlineMetaTitle(content) {
  const match = content.match(/<Meta\s+title=["']([^"']+)["']\s*\/>/);
  return match ? match[1] : null;
}

/**
 * Find the companion stories file for a docs file.
 * Checks both .tsx and .jsx extensions.
 */
async function findCompanionStoriesPath(docPath) {
  const dir = path.dirname(docPath);
  const base = path.basename(docPath, '.docs.mdx');

  for (const ext of ['.stories.tsx', '.stories.jsx']) {
    const candidate = path.join(dir, `${base}${ext}`);

    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // not found, try next
    }
  }

  return null;
}

/* ── JSX stripping ───────────────────────────────────────────────────── */

function stripJsx(content) {
  const lines = content.split('\n');
  const result = [];
  let inCodeFence = false;
  let inImport = false;
  let inExportBlock = false;
  let exportBraceDepth = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      inCodeFence = !inCodeFence;
      result.push(line);
      continue;
    }

    if (inCodeFence) {
      result.push(line);
      continue;
    }

    // Track multi-line imports (e.g. `import {\n  A,\n  B,\n} from '...';`)
    if (inImport) {
      if (trimmed.includes('from ') && trimmed.endsWith(';')) {
        inImport = false;
      }

      continue;
    }

    // Track multi-line export blocks (e.g. `export const Template = ...`)
    if (inExportBlock) {
      for (const ch of trimmed) {
        if (ch === '{') exportBraceDepth++;
        else if (ch === '}') exportBraceDepth--;
      }

      if (exportBraceDepth <= 0 && trimmed.endsWith(';')) {
        inExportBlock = false;
      }

      continue;
    }

    // Skip import lines (single-line or start of multi-line)
    if (trimmed.startsWith('import ')) {
      if (!trimmed.endsWith(';')) {
        inImport = true;
      }

      continue;
    }

    // Skip export blocks
    if (trimmed.startsWith('export ')) {
      if (trimmed.endsWith(';')) continue;

      inExportBlock = true;
      exportBraceDepth = 0;

      for (const ch of trimmed) {
        if (ch === '{') exportBraceDepth++;
        else if (ch === '}') exportBraceDepth--;
      }

      continue;
    }

    // Skip any standalone self-closing JSX tag (e.g. <Meta />, <Story />, <Root />)
    if (/^<[A-Z]\w*[\s/]/.test(trimmed) && trimmed.endsWith('/>')) continue;

    // Skip <Canvas> and </Canvas> (open/close)
    if (/^<Canvas>$/.test(trimmed)) continue;
    if (/^<\/Canvas>$/.test(trimmed)) continue;

    // Skip <Controls ... /> or <Controls />
    if (/^<Controls[\s/>]/.test(trimmed)) continue;

    result.push(line);
  }

  return result.join('\n').replace(/\n{3,}/g, '\n\n').replace(/^\n+/, '');
}

/* ── link fixing ─────────────────────────────────────────────────────── */

/**
 * Fix Storybook doc links in both formats:
 *   [text](/docs/category-name--docs)
 *   [text](/docs/category-name--docs#hash)
 *   [text](?path=/docs/category-name--docs)
 *   [text](?path=/docs/category-name--docs#hash)
 */
function fixStorybookLinks(
  content,
  storyIdToOutputPath,
  currentOutputPath,
  brokenLinks,
) {
  const currentDir = path.dirname(currentOutputPath);

  const replacer = (match, linkText, storyId, hash = '') => {
    const targetPath = storyIdToOutputPath.get(storyId);

    if (targetPath) {
      let rel = path.relative(currentDir, targetPath);

      if (!rel.startsWith('.')) {
        rel = './' + rel;
      }

      return `[${linkText}](${rel}${hash})`;
    }

    // No target file — strip to plain text so the output has no dead links
    brokenLinks.add(storyId);
    return linkText;
  };

  let result = content;

  // /docs/id--docs or /docs/id--docs#hash
  result = result.replace(
    /\[([^\]]*)\]\(\/docs\/([^)#]+--docs)(#[^)]*)?\)/g,
    replacer,
  );

  // ?path=/docs/id--docs or ?path=/docs/id--docs#hash
  result = result.replace(
    /\[([^\]]*)\]\(\?path=\/docs\/([^)#]+--docs)(#[^)]*)?\)/g,
    replacer,
  );

  return result;
}

/**
 * Fix relative MDX links: [text](./path.docs.mdx) or [text](./Dir/File.docs.mdx)
 * In the output, subdirectories are flattened, so:
 *   ./Menu/Menu.docs.mdx -> ./Menu.md
 *   ./use-context-menu.docs.mdx -> ./use-context-menu.md
 */
function fixRelativeMdxLinks(content) {
  return content.replace(
    /\[([^\]]*)\]\((\.[^)]+)\.docs\.mdx\)/g,
    (match, linkText, relativePath) => {
      // Extract just the filename without extension from the relative path
      const baseName = path.basename(relativePath);
      return `[${linkText}](./${baseName}.md)`;
    },
  );
}

/**
 * Convert tasty GitHub URLs to local docs/tasty/ paths.
 *   https://github.com/tenphi/tasty/blob/main/docs/X.md -> {rel}/tasty/X.md
 *   https://github.com/tenphi/tasty                      -> {rel}/tasty/usage.md
 */
function fixTastyLinks(content, currentOutputPath) {
  const currentDir = path.dirname(currentOutputPath);
  const tastyDir = path.join(DOCS_DIR, 'tasty');

  // Specific doc page links: .../blob/main/docs/X.md
  content = content.replace(
    /\[([^\]]*)\]\(https:\/\/github\.com\/tenphi\/tasty\/blob\/main\/docs\/([^)]+)\)/g,
    (match, linkText, docFile) => {
      let rel = path.relative(currentDir, path.join(tastyDir, docFile));
      if (!rel.startsWith('.')) rel = './' + rel;
      return `[${linkText}](${rel})`;
    },
  );

  // Root repo link: https://github.com/tenphi/tasty
  content = content.replace(
    /\[([^\]]*)\]\(https:\/\/github\.com\/tenphi\/tasty\)/g,
    (match, linkText) => {
      let rel = path.relative(currentDir, path.join(tastyDir, 'usage.md'));
      if (!rel.startsWith('.')) rel = './' + rel;
      return `[${linkText}](${rel})`;
    },
  );

  return content;
}

/**
 * Convert glaze GitHub URLs to local docs/glaze/ paths.
 *   https://github.com/tenphi/glaze/blob/main/docs/X.md -> {rel}/glaze/X.md
 *
 * Glaze's published docs/ folder doesn't include a README/index page, so the
 * bare repo URL (https://github.com/tenphi/glaze) is intentionally left
 * untouched and resolves to GitHub.
 */
function fixGlazeLinks(content, currentOutputPath) {
  const currentDir = path.dirname(currentOutputPath);
  const glazeDir = path.join(DOCS_DIR, 'glaze');

  return content.replace(
    /\[([^\]]*)\]\(https:\/\/github\.com\/tenphi\/glaze\/blob\/main\/docs\/([^)]+)\)/g,
    (match, linkText, docFile) => {
      let rel = path.relative(currentDir, path.join(glazeDir, docFile));
      if (!rel.startsWith('.')) rel = './' + rel;
      return `[${linkText}](${rel})`;
    },
  );
}

/**
 * Fix Base Properties links to point to docs/BaseProperties.md.
 * Handles: /base-properties, /BaseProperties, /docs/base-properties, /docs/docs-base-properties--docs
 */
function fixBasePropertiesLinks(content, currentOutputPath) {
  const currentDir = path.dirname(currentOutputPath);
  const basePropsPath = path.join(DOCS_DIR, 'BaseProperties.md');
  let rel = path.relative(currentDir, basePropsPath);
  if (!rel.startsWith('.')) rel = './' + rel;

  const replacer = `[Base properties](${rel})`;

  return content.replace(
    /\[Base properties\]\(\/(?:docs\/)?(?:getting-started-base-properties--docs|base-properties|BaseProperties|base-properties--docs|docs-base-properties--docs)\)/gi,
    replacer,
  );
}

/**
 * Fix Field Properties links to point to docs/FieldProperties.md.
 * Handles: /docs/field-properties--docs, /field-properties
 */
function fixFieldPropertiesLinks(content, currentOutputPath) {
  const currentDir = path.dirname(currentOutputPath);
  const fieldPropsPath = path.join(DOCS_DIR, 'FieldProperties.md');
  let rel = path.relative(currentDir, fieldPropsPath);
  if (!rel.startsWith('.')) rel = './' + rel;

  return content.replace(
    /\[([Ff]ield properties)\]\(\/(?:docs\/)?(?:getting-started-field-properties--docs|field-properties--docs|field-properties)\)/g,
    (match, linkText) => `[${linkText}](${rel})`,
  );
}

/* ── main ─────────────────────────────────────────────────────────────── */

/**
 * Collect docs from a source directory, compute output paths, and extract
 * storybook title mappings. Returns an array of { docPath, outputPath, content }.
 */
async function collectDocs(srcDir, computeOutput) {
  const files = await glob(srcDir, /\.docs\.mdx$/);
  const entries = [];

  for (const docPath of files) {
    const outputPath = computeOutput(docPath);
    const content = await fs.readFile(docPath, 'utf8');

    const companionPath = await findCompanionStoriesPath(docPath);
    let title = companionPath ? await extractStoryTitle(companionPath) : null;

    if (!title) {
      title = extractInlineMetaTitle(content);
    }

    if (title) {
      const storyId = titleToStoryId(title);
      storyIdToOutputPath.set(storyId, outputPath);
    }

    entries.push({ docPath, outputPath, content });
  }

  return entries;
}

log('Scanning for docs files...');

const storyIdToOutputPath = new Map();

const componentEntries = await collectDocs(
  COMPONENT_SRC,
  computeComponentOutputPath,
);
const storiesEntries = await collectDocs(
  STORIES_SRC,
  computeStoriesOutputPath,
);

const allEntries = [...componentEntries, ...storiesEntries];

log(
  `Found ${allEntries.length} docs files (${componentEntries.length} components, ${storiesEntries.length} stories)`,
);
log(`Mapped ${storyIdToOutputPath.size} storybook IDs`);

// Copy vendored docs from node_modules (replacing symlinks with real files for publishing)
const VENDORED_DOCS = [
  { name: 'tasty', source: path.join('node_modules', '@tenphi', 'tasty', 'docs') },
  { name: 'glaze', source: path.join('node_modules', '@tenphi', 'glaze', 'docs') },
];

for (const { name, source } of VENDORED_DOCS) {
  const target = path.join(DOCS_DIR, name);
  await fs.rm(target, { recursive: true, force: true });
  await fs.cp(source, target, { recursive: true });
  log(`Copied ${name} docs from node_modules`);
}

// Clean output directory for components (stories go top-level alongside tasty/)
await fs.rm(COMPONENT_OUT, { recursive: true, force: true });

// Process each file
let processed = 0;
const brokenLinks = new Set();

for (const { docPath, outputPath, content } of allEntries) {
  let result = stripJsx(content);
  result = fixStorybookLinks(
    result,
    storyIdToOutputPath,
    outputPath,
    brokenLinks,
  );
  result = fixRelativeMdxLinks(result);
  result = fixTastyLinks(result, outputPath);
  result = fixGlazeLinks(result, outputPath);
  result = fixBasePropertiesLinks(result, outputPath);
  result = fixFieldPropertiesLinks(result, outputPath);

  // Ensure trailing newline
  if (!result.endsWith('\n')) {
    result += '\n';
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, result);
  processed++;
}

// Write manifest for cleanup (outside docs/ so it's never published)
const generatedPaths = allEntries.map((e) => e.outputPath);
await fs.writeFile('.docs-generated', generatedPaths.join('\n') + '\n');

log(`Wrote ${processed} markdown files to ${DOCS_DIR}`);

if (brokenLinks.size > 0) {
  log(
    `Warning: ${brokenLinks.size} unresolved storybook links:`,
    [...brokenLinks].join(', '),
  );
}
