/**
 * snapshot-storybook-docs.mjs  – Storybook v8.6-friendly
 *
 * • Builds Storybook docs
 * • Serves them from an in-process HTTP server
 * • Snapshots each MDX page to ./docs-static/<id>.html
 * • Logs pages that fail (error, no preview, or render timeout)
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
  ${docsContent}
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
  ${tocHtml}
</body>
</html>`;

await fs.writeFile(path.join(OUT_DIR, 'index.html'), indexHtml);
log('✔  Table of contents generated at index.html');

log('Snapshots written to', OUT_DIR);

if (failed.length) {
  log('\n⚠️  Some pages were skipped:');
  for (const { id, state } of failed) log(`• ${id} (${state})`);
  process.exitCode = 1;
}

// Kill the server process group to ensure a clean exit
if (serverProcess.pid) {
  process.kill(-serverProcess.pid);
}
