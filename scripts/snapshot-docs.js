/**
 * snapshot-storybook-docs.mjs  – Storybook v8.6-friendly
 *
 * • Builds Storybook docs
 * • Serves them from an in-process HTTP server
 * • Snapshots each MDX page to ./docs-static/<id>.html
 * • Logs pages that fail (error, no preview, or render timeout)
 * • Fixes internal links to point to the generated HTML files
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

import chromium from '@sparticuz/chromium';
import { chromium as pw } from 'playwright-core';

/* ───── config ─────────────────────────────────────────────────────── */
const BUILD_DIR = 'storybook-docs'; // output of `npm run build-docs`
const OUT_DIR = 'docs-static';
const TIMEOUT = process.env.CI ? 30_000 : 15_000; // 30 s on CI, 15 s locally

const log = (...a) => console.log('[docs-snapshot]', ...a);

/* ───── helper functions ─────────────────────────────────────────────── */

/**
 * Creates a mapping from component names to their story IDs
 * e.g., "ItemButton" -> "actions-itembutton--docs"
 */
function createComponentMapping(availableIds) {
  const mapping = new Map();

  // Common component word patterns for splitting compound words
  const patterns = [
    { suffix: 'button', replacement: 'Button' },
    { suffix: 'input', replacement: 'Input' },
    { suffix: 'box', replacement: 'Box' },
    { suffix: 'base', replacement: 'Base' },
    { suffix: 'menu', replacement: 'Menu' },
    { suffix: 'picker', replacement: 'Picker' },
    { suffix: 'group', replacement: 'Group' },
    { suffix: 'dialog', replacement: 'Dialog' },
    { suffix: 'trigger', replacement: 'Trigger' },
    { suffix: 'container', replacement: 'Container' },
    { suffix: 'wrapper', replacement: 'Wrapper' },
  ];

  availableIds.forEach((storyId) => {
    // Extract component name from story ID
    // e.g., "actions-itembutton--docs" -> "itembutton"
    const match = storyId.match(/^[^-]+-(.+)--docs$/);
    if (match) {
      const componentPart = match[1];

      // First, handle kebab-case (has dashes)
      if (componentPart.includes('-')) {
        const pascalCase = componentPart
          .split('-')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join('');
        mapping.set(pascalCase, storyId);
      } else {
        // Handle compound words without dashes
        let bestMatch = null;
        // let componentName = componentPart;

        // Try to split compound words using common patterns
        for (const pattern of patterns) {
          if (componentPart.endsWith(pattern.suffix)) {
            const prefix = componentPart.slice(0, -pattern.suffix.length);
            if (prefix.length > 0) {
              const prefixCapitalized =
                prefix.charAt(0).toUpperCase() + prefix.slice(1);
              bestMatch = prefixCapitalized + pattern.replacement;
              break;
            }
          }
        }

        if (bestMatch) {
          mapping.set(bestMatch, storyId);
          // componentName = bestMatch;
        }

        // Also add the simple capitalized version
        const simpleCapital =
          componentPart.charAt(0).toUpperCase() + componentPart.slice(1);
        mapping.set(simpleCapital, storyId);
      }

      // Always add the exact lowercase version
      mapping.set(componentPart, storyId);
    }
  });

  return mapping;
}

/**
 * Fixes /components/ComponentName links in source files to proper /docs/ format
 * e.g., "/components/ItemButton" -> "/docs/actions-itembutton--docs"
 * e.g., "/components/ItemButton#sub-components" -> "/docs/actions-itembutton--docs#sub-components"
 */
function fixComponentLinks(content, componentMapping) {
  const brokenLinks = new Set();

  // Pattern to match [text](/components/ComponentName) or [text](/components/ComponentName#hash)
  const componentLinkPattern =
    /\[([^\]]*)\]\(\/components\/([^)#]+)(#[^)]+)?\)/g;

  const fixedContent = content.replace(
    componentLinkPattern,
    (match, linkText, componentName, hashFragment = '') => {
      const storyId = componentMapping.get(componentName);
      if (storyId) {
        return `[${linkText}](/docs/${storyId}${hashFragment})`;
      }
      // If not found, log it and leave the link as is
      brokenLinks.add(componentName);
      return match;
    },
  );

  // Log broken component links if any were found
  if (brokenLinks.size > 0) {
    log(
      `⚠️  Found ${brokenLinks.size} unresolved component links:`,
      Array.from(brokenLinks).join(', '),
    );
  }

  return fixedContent;
}

/**
 * Fixes internal links in HTML content to point to the generated HTML files
 * Transforms links like:
 * - `href="/docs/pickers-select--docs"` -> `href="pickers-select--docs.html"`
 * - `href="/docs/pickers-select--docs#hash"` -> `href="pickers-select--docs.html#hash"`
 * - `href="?path=/docs/pickers-select--docs"` -> `href="pickers-select--docs.html"`
 * - `href="?path=/docs/pickers-select--docs#hash"` -> `href="pickers-select--docs.html#hash"`
 * - `href="/?path=/docs/pickers-select--docs"` -> `href="pickers-select--docs.html"`
 * - `href="./?path=/docs/pickers-select--docs"` -> `href="pickers-select--docs.html"`
 */
function fixInternalLinks(content, availableIds) {
  // Create a set of available IDs for quick lookup
  const availableIdsSet = new Set(availableIds);
  const brokenLinks = new Set();

  // Pattern to match various forms of Storybook docs links with optional hash fragments
  const linkPatterns = [
    // Match href="/docs/story-id--docs" or href="/docs/story-id--docs#hash"
    /href="\/docs\/([^"#]+--docs)(#[^"]+)?"/g,
    // Match href="?path=/docs/story-id--docs" or href="?path=/docs/story-id--docs#hash"
    /href="\?path=\/docs\/([^"#]+--docs)(#[^"]+)?"/g,
    // Match href="/?path=/docs/story-id--docs" or href="/?path=/docs/story-id--docs#hash"
    /href="\/\?path=\/docs\/([^"#]+--docs)(#[^"]+)?"/g,
    // Match href="./?path=/docs/story-id--docs" or href="./?path=/docs/story-id--docs#hash"
    /href="\.\/\?path=\/docs\/([^"#]+--docs)(#[^"]+)?"/g,
  ];

  let fixedContent = content;

  linkPatterns.forEach((pattern) => {
    fixedContent = fixedContent.replace(
      pattern,
      (match, storyId, hashFragment = '') => {
        // Check if this story ID exists in our generated files
        if (availableIdsSet.has(storyId)) {
          return `href="${storyId}.html${hashFragment}"`;
        }
        // If not found, log it and leave the link as is
        brokenLinks.add(storyId);
        return match;
      },
    );
  });

  // Log broken links if any were found
  if (brokenLinks.size > 0) {
    log(
      `⚠️  Found ${brokenLinks.size} broken internal links:`,
      Array.from(brokenLinks).join(', '),
    );
  }

  return fixedContent;
}

/* ───── 2. start local HTTP server ─────────────────────────────────── */
log('Starting local http-server...');
const serverPort = 6007;
const host = `http://127.0.0.1:${serverPort}`;
// Start the server as a detached process to allow killing the entire process group
const serverProcess = spawn(
  'npx',
  ['http-server', BUILD_DIR, '-p', serverPort, '-c-1', '--silent'],
  { detached: true },
);

process.on('exit', () => {
  // Ensure the process group is killed on exit
  if (serverProcess.pid) {
    try {
      process.kill(-serverProcess.pid);
    } catch (error) {
      // Ignore ESRCH errors (process already gone)
      if (error.code !== 'ESRCH') {
        throw error;
      }
    }
  }
});

await new Promise((resolve, reject) => {
  const started = Date.now();
  const tryConnect = () => {
    fetch(host)
      .then(resolve)
      .catch(() => {
        if (Date.now() - started > 10000) {
          reject(new Error('Server failed to start in 10s'));
        } else {
          setTimeout(tryConnect, 200);
        }
      });
  };
  tryConnect();
});

log('Server running at', host);

/* ───── 3. read Storybook index.json ───────────────────────────────── */
const index = JSON.parse(
  await fs.readFile(path.join(BUILD_DIR, 'index.json'), 'utf8'),
);

await fs.rm(OUT_DIR, { recursive: true, force: true });
await fs.mkdir(OUT_DIR, { recursive: true });

// Collect all doc story IDs for link fixing
const docStoryIds = Object.values(index.entries)
  .filter((entry) => entry.type === 'docs')
  .map((entry) => entry.id);

log(`Found ${docStoryIds.length} documentation pages to process`);

/* ───── 4. crawl & snapshot ────────────────────────────────────────── */
let browser;
try {
  // Try to use @sparticuz/chromium binary first (for serverless environments)
  const executablePath = await chromium.executablePath();
  if (executablePath) {
    browser = await pw.launch({
      executablePath,
      args: chromium.args,
      headless: chromium.headless,
    });
  } else {
    throw new Error('No @sparticuz/chromium binary available');
  }
} catch (error) {
  // Fallback to system Playwright if @sparticuz/chromium fails
  log('Falling back to system Playwright browser', error);
  browser = await pw.launch({ headless: true });
}

const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

page.on('console', (msg) => log('console>', msg.text()));
page.on('pageerror', (err) => log('pageerror>', err.message));

const failed = [];
const succeeded = [];

for (const { id, type, title } of Object.values(index.entries)) {
  if (type !== 'docs') continue;

  const url = `${host}/iframe.html?id=${id}&viewMode=docs&globals=`;
  log('Rendering', id);
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  let finalState = 'pending';
  try {
    // Wait for the docs content to be visible. This is the key change.
    await page.waitForSelector('#storybook-docs .sbdocs-wrapper', {
      state: 'visible',
      timeout: TIMEOUT,
    });
    finalState = 'ready';
  } catch (e) {
    finalState = 'timeout';
    console.log(e);
  }

  if (finalState === 'ready') {
    // Extract the styles from the head and the content from the docs container.
    const { styles, docsContent, pageTitle } = await page.evaluate(() => {
      const styleTags = Array.from(document.head.querySelectorAll('style'));
      const styles = styleTags.map((style) => style.innerHTML).join('\n');
      const docsElement = document.querySelector('#storybook-docs');
      const docsContent = docsElement ? docsElement.innerHTML : '';
      const pageTitle = document.title;
      return { styles, docsContent, pageTitle };
    });

    // Fix internal links in the content
    const fixedDocsContent = fixInternalLinks(docsContent, docStoryIds);

    // Wrap the content in a minimal HTML structure with styles included.
    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${pageTitle || title}</title>
  <style>
    body { margin: 2rem; }
    ${styles}
  </style>
</head>
<body>
  ${fixedDocsContent}
</body>
</html>`;

    const dest = path.join(OUT_DIR, `${id}.html`);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, html);
    log(`✔  ${id} → ${dest}`);
    succeeded.push({ id, title });
  } else {
    const screenshotPath = path.join(OUT_DIR, `${id}-failed.png`);
    await page.screenshot({ path: screenshotPath });
    log(`📸  Screenshot saved to ${screenshotPath}`);
    log(`❌  ${id} → skipped (${finalState})`);
    failed.push({ id, state: finalState });
  }
}

/* ───── 5. teardown & summary ──────────────────────────────────────── */
await browser.close();

log('Generating table of contents...');
const tocTree = { children: {} };

for (const { title, id } of succeeded) {
  const pathParts = title.split('/');
  let currentLevel = tocTree.children;

  for (let i = 0; i < pathParts.length; i++) {
    const part = pathParts[i];
    if (!currentLevel[part]) {
      currentLevel[part] = { children: {} };
    }
    if (i === pathParts.length - 1) {
      currentLevel[part].link = `${id}.html`;
      currentLevel[part].title = part;
    }
    currentLevel = currentLevel[part].children;
  }
}

function generateHtmlToc(nodes) {
  if (Object.keys(nodes).length === 0) return '';
  let html = '<ul>';
  const sortedKeys = Object.keys(nodes).sort();
  for (const key of sortedKeys) {
    const node = nodes[key];
    html += '<li>';
    if (node.link) {
      html += `<a href="${node.link}">${node.title || key}</a>`;
    } else {
      html += key;
    }
    if (Object.keys(node.children).length > 0) {
      html += generateHtmlToc(node.children);
    }
    html += '</li>';
  }
  html += '</ul>';
  return html;
}

const tocHtml = generateHtmlToc(tocTree.children);

// Fix internal links in the table of contents as well
const fixedTocHtml = fixInternalLinks(tocHtml, docStoryIds);

const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Documentation</title>
  <style>
    body { font-family: sans-serif; padding: 2rem; }
    ul { list-style-type: none; padding-left: 1rem; }
    li { margin-bottom: 0.5rem; }
    a { text-decoration: none; color: #0066cc; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>Table of Contents</h1>
  ${fixedTocHtml}
</body>
</html>`;

await fs.writeFile(path.join(OUT_DIR, 'index.html'), indexHtml);
log('✔  Table of contents generated at index.html');

/* ───── 6. fix component links in source files ─────────────────────── */
log('Fixing component links in source files...');
const componentMapping = createComponentMapping(docStoryIds);
let sourceFilesFixed = 0;

// Find all MDX files in the source directory
const findMdxFiles = async (dir) => {
  const files = [];
  const items = await fs.readdir(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...(await findMdxFiles(fullPath)));
    } else if (item.isFile() && item.name.endsWith('.mdx')) {
      files.push(fullPath);
    }
  }

  return files;
};

// Fix component links in MDX source files
const mdxFiles = await findMdxFiles('src');

for (const filePath of mdxFiles) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const fixedContent = fixComponentLinks(content, componentMapping);

    // Only write back if the content actually changed
    if (fixedContent !== content) {
      await fs.writeFile(filePath, fixedContent);
      sourceFilesFixed++;
    }
  } catch (error) {
    log(`⚠️  Failed to fix component links in ${filePath}: ${error.message}`);
  }
}

log(`✔  Fixed component links in ${sourceFilesFixed} source files`);

/* ───── 7. apply fixed links to original build files ──────────────── */
log('Applying fixed links to original build files...');
let originalFilesFixed = 0;

// Find all HTML files in the build directory
const findHtmlFiles = async (dir) => {
  const files = [];
  const items = await fs.readdir(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...(await findHtmlFiles(fullPath)));
    } else if (item.isFile() && item.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }

  return files;
};

// Fix links in HTML files from build directory only
const htmlFiles = await findHtmlFiles(BUILD_DIR);

for (const filePath of htmlFiles) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const fixedContent = fixInternalLinks(content, docStoryIds);

    // Only write back if the content actually changed
    if (fixedContent !== content) {
      await fs.writeFile(filePath, fixedContent);
      originalFilesFixed++;
    }
  } catch (error) {
    log(`⚠️  Failed to fix links in ${filePath}: ${error.message}`);
  }
}

log(`✔  Fixed internal links in ${originalFilesFixed} original build files`);

log('Snapshots written to', OUT_DIR);
log(`✔  Fixed internal links in ${succeeded.length} snapshot pages`);

if (failed.length) {
  log('\n⚠️  Some pages were skipped:');
  for (const { id, state } of failed) log(`• ${id} (${state})`);
  process.exitCode = 1;
}

// Kill the server process group to ensure a clean exit
if (serverProcess.pid) {
  process.kill(-serverProcess.pid);
}
