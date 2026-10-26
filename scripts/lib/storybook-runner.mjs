/**
 * Renders built stories in real Chromium, the way Chromatic does.
 *
 * Shared by `scripts/chromatic-duplicates.mjs` (fingerprints each story) and
 * `scripts/a11y-diagnostics.mjs` (runs axe-core on each story). Both need the
 * same thing first: the story served out of `storybook-static`, its `play`
 * function finished, and the DOM settled. What each one then reads from the
 * page is its own business — it is passed in as `visit`.
 */
import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const STATIC_DIR = join(ROOT, 'storybook-static');

/**
 * Chromatic's default viewport. Matching it keeps results comparable to what
 * actually gets billed — a story that overflows at 1200px wide may not at
 * 800px, and both the duplicate groups and the axe findings would differ.
 */
const VIEWPORT = { width: 1200, height: 900 };

/**
 * How long the DOM must stay unchanged after `storyFinished` before the story
 * counts as settled.
 *
 * `storyFinished` covers the `play` function; this covers what runs after it —
 * overlay transitions, portal mounts, `requestAnimationFrame` layout. CSS
 * animations do not mutate the DOM, so a permanently spinning story still
 * settles.
 */
const QUIET_MS = 400;

/** Cap on either wait, for a story that never finishes or never stops mutating. */
const SETTLE_TIMEOUT_MS = 15000;

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ico': 'image/x-icon',
};

/**
 * Every story in the build, optionally narrowed to those whose title or id
 * contains `filter`. Exits when there is no build to read.
 */
export function readStories(filter) {
  if (!existsSync(join(STATIC_DIR, 'index.json'))) {
    console.error(
      `No build at ${STATIC_DIR}.\nRun \`pnpm build-storybook\` first.`,
    );
    process.exit(2);
  }

  const index = JSON.parse(
    readFileSync(join(STATIC_DIR, 'index.json'), 'utf-8'),
  );
  const stories = Object.values(index.entries).filter(
    (e) => e.type === 'story',
  );

  return filter
    ? stories.filter((s) => s.title.includes(filter) || s.id.includes(filter))
    : stories;
}

function serve() {
  const server = createServer((req, res) => {
    const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
    const path = join(STATIC_DIR, url === '/' ? 'index.html' : url);

    if (!path.startsWith(STATIC_DIR) || !existsSync(path)) {
      res.writeHead(404).end('not found');
      return;
    }

    res.writeHead(200, {
      'content-type': MIME[extname(path)] ?? 'application/octet-stream',
    });
    createReadStream(path).pipe(res);
  });

  return new Promise((done) => {
    server.listen(0, '127.0.0.1', () =>
      done({ server, port: server.address().port }),
    );
  });
}

/**
 * Subscribes to Storybook's preview channel before the story boots.
 *
 * `storyFinished` is the event that fires once the `play` function has
 * resolved — the moment Chromatic photographs. Waiting for DOM quiescence
 * instead is not equivalent: several `play` functions here `await timeout(500)`
 * between steps, and the DOM is perfectly quiet during that sleep, so a
 * quiescence-only wait reads a dialog that the story is about to close.
 */
const WATCH_STORY_FINISHED = () => {
  window.__storyFinished = null;

  const describe = (error) => {
    try {
      return (
        error?.message ??
        error?.error?.message ??
        JSON.stringify(error, Object.getOwnPropertyNames(error ?? {}))
      );
    } catch {
      return String(error);
    }
  };

  const subscribe = () => {
    const channel = window.__STORYBOOK_ADDONS_CHANNEL__;
    if (!channel) return false;

    channel.on('storyFinished', (payload) => {
      window.__storyFinished = { status: payload?.status ?? 'success' };
    });
    // Storybook reports a thrown `play` on its own event, and `storyFinished`
    // does not carry the reason — so keep the message from here.
    channel.on('playFunctionThrewException', (error) => {
      window.__storyFinished = { status: 'error', error: describe(error) };
    });

    return true;
  };

  if (!subscribe()) {
    const poll = setInterval(() => {
      if (subscribe()) clearInterval(poll);
    }, 10);
  }
};

/**
 * Starts every story with empty storage, as Chromatic does.
 *
 * A worker reuses one browser context for hundreds of stories, and several
 * components persist what the user did — `LayoutPanel` sizes, `ItemTable`
 * column widths, dismissed notifications. Without this, a story renders with
 * whatever an earlier story in the same worker saved, so its result depends on
 * which stories happened to run before it.
 */
const RESET_STORAGE = () => {
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {
    // Storage can be unavailable on an opaque origin; there is nothing to reset.
  }
};

/** Loads the story and waits until it has settled. Returns how `play` ended. */
async function openStory(page, port, story) {
  const url = `http://127.0.0.1:${port}/iframe.html?id=${encodeURIComponent(story.id)}&viewMode=story`;

  await page.goto(url, { waitUntil: 'load', timeout: 30000 });

  await page
    .waitForFunction(
      () => document.querySelector('#storybook-root')?.hasChildNodes(),
      null,
      { timeout: 20000 },
    )
    .catch(() => {});

  // Stories without a `play` function also emit `storyFinished`, so this is the
  // single wait for both cases. Stories that never emit it (a `play` that hangs)
  // fall through to the quiescence wait below rather than stalling the run.
  const finished = await page
    .waitForFunction(() => window.__storyFinished, null, {
      timeout: SETTLE_TIMEOUT_MS,
    })
    .then((handle) => handle.jsonValue())
    .catch(() => ({ status: 'timeout' }));

  await page.evaluate(
    ([quietMs, timeoutMs]) =>
      new Promise((resolve) => {
        let quiet;
        const observer = new MutationObserver(() => {
          clearTimeout(quiet);
          quiet = setTimeout(finish, quietMs);
        });

        function finish() {
          clearTimeout(quiet);
          clearTimeout(cap);
          observer.disconnect();
          resolve();
        }

        const cap = setTimeout(finish, timeoutMs);
        quiet = setTimeout(finish, quietMs);

        observer.observe(document.body, {
          subtree: true,
          childList: true,
          attributes: true,
          characterData: true,
        });
      }),
    [QUIET_MS, SETTLE_TIMEOUT_MS],
  );

  return finished;
}

/**
 * Opens each story in turn across `concurrency` pages and returns what
 * `visit(page, story, finished)` resolved to for it. A story that throws —
 * while loading or inside `visit` — comes back as `{ …story, error }`, so one
 * broken story never stops the run.
 */
export async function runStories(stories, { visit, concurrency = 6 }) {
  const { server, port } = await serve();
  const browser = await chromium.launch();
  const results = [];
  let next = 0;

  async function worker() {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    await context.addInitScript(RESET_STORAGE);
    await context.addInitScript(WATCH_STORY_FINISHED);

    const page = await context.newPage();

    for (;;) {
      const story = stories[next++];
      if (!story) break;

      try {
        const finished = await openStory(page, port, story);
        results.push(await visit(page, story, finished));
      } catch (error) {
        results.push({
          id: story.id,
          title: story.title,
          name: story.name,
          exportName: story.exportName,
          importPath: story.importPath,
          error: String(error.message ?? error),
        });
      }

      if (results.length % 50 === 0) {
        process.stdout.write(`  ${results.length}/${stories.length}\r`);
      }
    }

    await context.close();
  }

  try {
    await Promise.all(Array.from({ length: concurrency }, worker));
  } finally {
    await browser.close();
    server.close();
  }

  return results;
}
