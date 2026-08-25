#!/usr/bin/env node
/**
 * `pnpm chromatic:duplicates` — find stories that photograph the same thing.
 *
 * Chromatic bills per story, so two stories that render an identical tree cost
 * twice and can only ever catch one regression. They accumulate honestly: a
 * `Controlled` story next to a `Default` one, a `DynamicSections` that emits
 * the same markup as `WithSections`, a `WithContextMenu` whose menu never
 * opens because nothing drove it. None of that is visible from the story name,
 * and none of it shows up in review.
 *
 * So measure it. This renders every story out of `storybook-static` in real
 * Chromium — play functions included, exactly as Chromatic would — and
 * fingerprints the result twice:
 *
 *   - **dom**   the rendered markup — the whole body, so portalled overlays
 *               count — with volatile bits (generated ids, `aria-*`
 *               references) normalised away.
 *   - **pixel** a PNG of the viewport.
 *
 * Stories sharing a fingerprint are reported as a group. A shared *dom* hash is
 * the strong signal — it means the two stories built the same tree and differ
 * only in code that never reached the screen. A shared *pixel* hash catches the
 * rest.
 *
 * The report is evidence, not a verdict: it says two stories are identical, not
 * which of them should keep the snapshot. Read the group, keep the one that
 * documents the visual, and opt the others out with `NO_SNAPSHOT` from
 * `src/stories/chromatic.ts`. Opted-out stories then drop out of the report, so
 * what remains is always the work still to do rather than a standing list of
 * findings someone already answered.
 *
 * It also flags stories **named for an overlay that never opened** —
 * `WithTooltip`, `InPopover`, `WithContextMenu` and friends that carry no
 * `play` function and rendered no `tooltip` / `dialog` / `menu` / `listbox`
 * role. Those photograph a closed trigger: the feature they are named for goes
 * untested and the image usually duplicates the default story. Give them a
 * `play` function (see `docs/rules/storybook.md`) or opt them out — but do not
 * leave them photographing a button.
 *
 * Build first, this reads the static output:
 *
 *   pnpm build-storybook
 *
 * Usage:
 *   node scripts/chromatic-duplicates.mjs
 *   node scripts/chromatic-duplicates.mjs --json report.json
 *   node scripts/chromatic-duplicates.mjs --filter Forms/ListBox
 *   node scripts/chromatic-duplicates.mjs --concurrency 8
 */
import { createHash } from 'node:crypto';
import {
  createReadStream,
  existsSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

import { hasPlay, isOptedOut, sourceReader } from './lib/story-snapshots.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const STATIC_DIR = join(ROOT, 'storybook-static');

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(name);
  return i === -1 ? fallback : args[i + 1];
};

const filter = flag('--filter', null);
const jsonOut = flag('--json', null);
const concurrency = Number(flag('--concurrency', 6));

/**
 * Chromatic's default viewport. Matching it keeps the fingerprints comparable
 * to what actually gets billed — a story that overflows at 1200px wide may not
 * at 800px, and the duplicate groups would differ.
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

/**
 * Story names that promise something rendered in an *overlay*.
 *
 * A story called `WithTooltip` or `InPopover` is named for something that only
 * exists once the user has done something. Chromatic runs `play` and then
 * photographs — so with no `play`, the snapshot is of the closed trigger, the
 * feature is untested, and the image usually duplicates the default story.
 *
 * Deliberately narrower than "interaction-only": `Expanded`, `Collapsed` and
 * `Focus` name states that render inline, so a story showing them has nothing
 * to open and would only ever be a false positive here. Being a heuristic over
 * names, this still catches the occasional innocent (`Skeleton / Menu`) — the
 * output is a list to read, not a list to act on blindly.
 */
const OVERLAY_NAME =
  /tooltip|popover|dropdown|contextmenu|submenu|menu|dialog|modal|tray|overlay|open|hover|trigger/i;

/** Roles that only appear once an overlay is actually on screen. */
const OVERLAY_ROLES = [
  'tooltip',
  'dialog',
  'alertdialog',
  'menu',
  'listbox',
  'grid',
];

if (!existsSync(join(STATIC_DIR, 'index.json'))) {
  console.error(
    `No build at ${STATIC_DIR}.\nRun \`pnpm build-storybook\` first.`,
  );
  process.exit(2);
}

// ─── Static server ───────────────────────────────────────────────────────────

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

// ─── Fingerprinting ──────────────────────────────────────────────────────────

/**
 * Runs in the page. Returns a normalised serialisation of the story root.
 *
 * Everything stripped here is a value that changes between renders without the
 * story looking any different: React Aria's generated `id`/`for`/`aria-*`
 * references, tasty's content-hashed class names, Storybook's own render
 * counter. Leaving them in would make every story unique and the report empty.
 */
const FINGERPRINT = () => {
  const root = document.querySelector('#storybook-root');
  if (!root) return null;

  // Serialise the whole body, not just the story root: overlays portal to a
  // sibling container, so a root-only fingerprint would report two stories
  // whose popovers differ as identical. `#storybook-docs`, scripts and the
  // stylesheets tasty accumulates are dropped — they are not the story.
  const clone = document.body.cloneNode(true);
  for (const node of clone.querySelectorAll(
    'script, style, link, #storybook-docs',
  )) {
    node.remove();
  }

  // Only ids and the attributes that reference them. `style` deliberately
  // stays: tasty passes dynamic values through inline custom properties
  // (`--cube-spin-size: 48px`), so dropping it would report every size variant
  // of a component as a duplicate of every other.
  const VOLATILE_ATTR =
    /^(id|for|name|aria-labelledby|aria-describedby|aria-controls|aria-activedescendant|aria-owns|data-key|data-reactid)$/;

  for (const el of [clone, ...clone.querySelectorAll('*')]) {
    if (!el.getAttribute) continue;

    for (const attr of [...el.attributes]) {
      if (VOLATILE_ATTR.test(attr.name)) {
        el.removeAttribute(attr.name);
        continue;
      }

      // tasty emits content-hashed class names (`t1a2b3c`); two identical trees
      // get identical hashes, but a re-render order change can shuffle them.
      if (attr.name === 'class') {
        el.setAttribute(
          'class',
          attr.value.split(/\s+/).filter(Boolean).sort().join(' '),
        );
      }
    }
  }

  // `#storybook-root` is a block element, so its own rect is viewport-wide for
  // every story and says nothing. What matters is how much the story actually
  // paints, so union the rects of everything inside it — portals included,
  // since an opened overlay renders outside the root.
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;

  const measure = (el) => {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    left = Math.min(left, r.left);
    top = Math.min(top, r.top);
    right = Math.max(right, r.right);
    bottom = Math.max(bottom, r.bottom);
  };

  for (const el of root.querySelectorAll('*')) measure(el);
  for (const el of document.querySelectorAll('body > :not(#storybook-root)')) {
    for (const inner of [el, ...el.querySelectorAll('*')]) measure(inner);
  }

  const finite = Number.isFinite(left) && Number.isFinite(top);

  const roles = [
    'tooltip',
    'dialog',
    'alertdialog',
    'menu',
    'listbox',
    'grid',
  ].filter((role) => document.querySelector(`[role="${role}"]`));

  // A story can change its whole appearance without touching the root: the
  // color-scheme decorators in `src/stories/decorators/withColorScheme.tsx`
  // drive `<html data-schema>` / `<html data-contrast>`, which the `@dark` and
  // `@hc` predefined states resolve against. Fold them into the fingerprint so
  // a `DarkScheme` story is not reported as a copy of its light twin.
  const html = document.documentElement;
  const scheme = `${html.getAttribute('data-schema') ?? ''}/${html.getAttribute('data-contrast') ?? ''}`;

  return {
    html: `${scheme}\n${clone.innerHTML}`,
    text: root.innerText?.slice(0, 400) ?? '',
    width: finite ? Math.round(right - left) : 0,
    height: finite ? Math.round(bottom - top) : 0,
    roles,
  };
};

const sha = (value) =>
  createHash('sha256').update(value).digest('hex').slice(0, 16);

/**
 * Subscribes to Storybook's preview channel before the story boots.
 *
 * `storyFinished` is the event that fires once the `play` function has
 * resolved — the moment Chromatic photographs. Waiting for DOM quiescence
 * instead is not equivalent: several `play` functions here `await timeout(500)`
 * between steps, and the DOM is perfectly quiet during that sleep, so a
 * quiescence-only wait fingerprints a dialog that the story is about to close.
 */
const WATCH_STORY_FINISHED = () => {
  window.__storyFinished = false;

  const subscribe = () => {
    const channel = window.__STORYBOOK_ADDONS_CHANNEL__;
    if (!channel) return false;
    channel.on('storyFinished', () => {
      window.__storyFinished = true;
    });
    return true;
  };

  if (!subscribe()) {
    const poll = setInterval(() => {
      if (subscribe()) clearInterval(poll);
    }, 10);
  }
};

async function fingerprintStory(page, port, story) {
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
  await page
    .waitForFunction(() => window.__storyFinished === true, null, {
      timeout: SETTLE_TIMEOUT_MS,
    })
    .catch(() => {});

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

  const dom = await page.evaluate(FINGERPRINT);
  if (!dom) return { id: story.id, error: 'no root' };

  let pixelHash = null;
  try {
    // The viewport, not `#storybook-root`. Clipping to the root element drops
    // every overlay that renders outside its box — an open popover, dialog or
    // tooltip — so two stories differing only in what their popover contains
    // would come back pixel-identical. It is also what Chromatic photographs.
    const shot = await page.screenshot({ timeout: 10000 });
    pixelHash = sha(shot);
  } catch {
    // Leaves `pixelHash` null; the story is still compared by markup.
  }

  return {
    id: story.id,
    title: story.title,
    name: story.name,
    exportName: story.exportName,
    importPath: story.importPath,
    domHash: sha(dom.html),
    pixelHash,
    width: dom.width,
    height: dom.height,
    roles: dom.roles,
    text: dom.text.replace(/\s+/g, ' ').trim().slice(0, 120),
  };
}

// ─── Run ─────────────────────────────────────────────────────────────────────

const index = JSON.parse(readFileSync(join(STATIC_DIR, 'index.json'), 'utf-8'));
let stories = Object.values(index.entries).filter((e) => e.type === 'story');
if (filter)
  stories = stories.filter(
    (s) => s.title.includes(filter) || s.id.includes(filter),
  );

console.log(
  `Fingerprinting ${stories.length} stories at ${VIEWPORT.width}×${VIEWPORT.height} …`,
);

const { server, port } = await serve();
const browser = await chromium.launch();
const results = [];
let done = 0;

async function worker() {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  await context.addInitScript(WATCH_STORY_FINISHED);

  const page = await context.newPage();

  for (;;) {
    const story = stories[done++];
    if (!story) break;

    try {
      results.push(await fingerprintStory(page, port, story));
    } catch (error) {
      results.push({
        id: story.id,
        title: story.title,
        name: story.name,
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

await Promise.all(Array.from({ length: concurrency }, worker));
await browser.close();
server.close();

// ─── Report ──────────────────────────────────────────────────────────────────

const sourceOf = sourceReader(ROOT);

const ok = results.filter((r) => !r.error);
const failed = results.filter((r) => r.error);

// Everything below is a to-do list, so a story that has already been dealt with
// must drop out of it. A group of three where two are opted out is resolved:
// one snapshot, one image, nothing left to do. Fingerprinting still runs for
// every story — the opt-out only decides whether the finding is actionable.
const billable = ok.filter(
  (r) => !isOptedOut(sourceOf(r.importPath), r.exportName),
);
const optedOutCount = ok.length - billable.length;

function group(key) {
  const map = new Map();
  for (const r of billable) {
    const value = r[key];
    if (!value) continue;
    let bucket = map.get(value);
    if (!bucket) map.set(value, (bucket = []));
    bucket.push(r);
  }
  return [...map.values()]
    .filter((g) => g.length > 1)
    .sort((a, b) => b.length - a.length);
}

const domGroups = group('domHash');
const pixelGroups = group('pixelHash');
const pixelOnly = pixelGroups.filter(
  (g) =>
    !domGroups.some((d) => d[0].domHash && d.some((s) => s.id === g[0].id)),
);

// Stories named for an interaction-only state that never reached it.
const unopened = billable
  .filter(
    (r) =>
      OVERLAY_NAME.test(r.exportName ?? r.name) &&
      !OVERLAY_ROLES.some((role) => r.roles?.includes(role)) &&
      !hasPlay(sourceOf(r.importPath), r.exportName),
  )
  .sort((a, b) => a.title.localeCompare(b.title));

const wastedDom = domGroups.reduce((n, g) => n + g.length - 1, 0);
const wastedPixel = pixelOnly.reduce((n, g) => n + g.length - 1, 0);

const line = (r) => `      ${r.title} / ${r.name}`;

console.log(`\n\n── Identical rendered markup ${'─'.repeat(49)}`);
console.log(`  ${domGroups.length} groups, ${wastedDom} redundant snapshots\n`);
for (const g of domGroups) {
  console.log(`  ${g.length}×  ${g[0].text || '(no text)'}`);
  for (const r of g) console.log(line(r));
  console.log('');
}

console.log(`── Identical pixels, different markup ${'─'.repeat(40)}`);
console.log(
  `  ${pixelOnly.length} groups, ${wastedPixel} redundant snapshots\n`,
);
for (const g of pixelOnly) {
  console.log(`  ${g.length}×  ${g[0].text || '(no text)'}`);
  for (const r of g) console.log(line(r));
  console.log('');
}

console.log(`── Named for an overlay, snapshotted closed ${'─'.repeat(34)}`);
console.log(
  `  ${unopened.length} stories are named for an overlay, have no play function, and`,
);
console.log(`  rendered none. Give them a play function or opt them out.\n`);
for (const r of unopened) {
  console.log(`  ${r.title} / ${r.name}  — ${r.text || '(no text)'}`);
}

if (failed.length) {
  console.log(`\n── Failed to fingerprint ${'─'.repeat(53)}`);
  for (const r of failed) console.log(`  ${r.title} / ${r.name}: ${r.error}`);
}

console.log(
  `\n${ok.length} stories fingerprinted, ${optedOutCount} already opted out of their snapshot.`,
);
console.log(
  `${wastedDom + wastedPixel} of the remaining ${billable.length} snapshots are provably redundant.`,
);

if (jsonOut) {
  writeFileSync(
    jsonOut,
    JSON.stringify({ results, domGroups, pixelOnly, unopened }, null, 2),
  );
  console.log(`Wrote ${jsonOut}`);
}
