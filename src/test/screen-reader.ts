/**
 * A virtual screen reader for specs and for `pnpm probe render --sr`.
 *
 * `@guidepup/virtual-screen-reader` builds the accessibility tree a screen
 * reader would — names, roles, states, descriptions, `aria-modal` containment,
 * live regions — and reports what it would speak. It reads only the DOM, so it
 * runs unchanged in jsdom and in Chromium, though jsdom's styles hide less: it
 * skips `@media` and container queries. It does not replace a real
 * screen reader; it catches what a role query cannot: an icon read out as an
 * unnamed graphic, an announcement that never fires, a reading order that
 * wanders out of a dialog.
 *
 * Start it through these helpers, not `virtual.start()`. The package exports a
 * singleton, and `start()` never stops a previous session: the old session's
 * `MutationObserver` and `focusin` listener stay attached to `document.body` and
 * keep writing into the next session's log, so one failed spec that skipped
 * `stop()` corrupts every later spec in the worker.
 */
import { virtual } from '@guidepup/virtual-screen-reader';
import { onTestFinished } from 'vitest';

export type ScreenReader = typeof virtual;

/**
 * More than any real reading of a component needs, and few enough that a walk
 * which can never end fails in seconds rather than at the test timeout.
 */
const MAX_STEPS = 5000;

/**
 * The same limit in time, for a machine under load: well inside the probe's
 * 60s test timeout, so a long page ends with the advice below rather than
 * with the harness cut off.
 */
const MAX_READING_MS = 20_000;

/** How the reader prefixes what a live region announces. */
const LIVE_PHRASE = /^(?:polite|assertive): /;

/**
 * What one move of the reader spoke, minus an immediate repeat.
 *
 * The package treats a dialog as its own parent dialog, so landing on the
 * dialog element speaks it twice — once for entering the dialog, once for the
 * element. Nothing a user would hear twice, so a reading keeps one.
 */
function withoutRepeat(spoken: string[]): string[] {
  return spoken.filter((phrase, index) => phrase !== spoken[index - 1]);
}

/**
 * Start a fresh session on `container` and return the reader.
 *
 * Any session still running is stopped first, and this one is stopped when the
 * test finishes, pass or fail.
 *
 * Under fake timers, use `vi.useFakeTimers({ shouldAdvanceTime: true })`, as
 * this repo already does for `userEvent`: Testing Library waits on a
 * `setTimeout` after each key and advances only Jest's fake timers, so with
 * plain `vi.useFakeTimers()` every `press()` and `type()` hangs.
 *
 * Every keypress through `reader.press()` first re-focuses the element under
 * the reader's cursor. When a component moves focus asynchronously, wait for
 * the move to be spoken before the next press, or that press lands on the
 * element focus just left:
 *
 * ```ts
 * await reader.press('ArrowDown');
 * await waitFor(async () =>
 *   expect(await reader.lastSpokenPhrase()).toMatch(/^option, Apple/),
 * );
 * ```
 */
export async function startScreenReader(
  container: Node = document.body,
): Promise<ScreenReader> {
  await virtual.stop();
  await virtual.start({ container });
  onTestFinished(() => virtual.stop());

  return virtual;
}

/**
 * Read `container` from top to bottom, as a screen reader user does by moving
 * to the next item until there is none, and return everything spoken.
 *
 * The reading ends where the reader would start repeating itself: after the
 * last item it wraps back to the first, and inside an open `aria-modal` dialog
 * it wraps within the dialog — the rest of the page is out of reach there, for
 * the reader exactly as for a user. Phrases from live regions that update
 * during the reading are kept in the order they were spoken.
 *
 * Runs its own session, so it ends any session already in progress.
 */
export async function readWithScreenReader(
  container: Node = document.body,
): Promise<string[]> {
  const reader = await startScreenReader(container);

  try {
    const phrases = withoutRepeat(await reader.spokenPhraseLog());
    const spokenAt = new Map<Node, Set<string>>();

    /** Records the item under the cursor; false if it was read already. */
    const visit = (phrase: string | undefined) => {
      const node = reader.activeNode;

      if (!node || phrase === undefined) return false;

      const spoken = spokenAt.get(node) ?? new Set<string>();

      spokenAt.set(node, spoken);

      if (spoken.has(phrase)) return false;

      spoken.add(phrase);

      return true;
    };

    // Nothing in the container is announced at all.
    if (!visit(phrases.findLast((phrase) => !LIVE_PHRASE.test(phrase)))) {
      return phrases;
    }

    const deadline = Date.now() + MAX_READING_MS;

    for (let step = 0; step < MAX_STEPS && Date.now() < deadline; step += 1) {
      const before = (await reader.spokenPhraseLog()).length;

      await reader.next();

      const spoken = (await reader.spokenPhraseLog()).slice(before);

      if (!visit(spoken.findLast((phrase) => !LIVE_PHRASE.test(phrase)))) {
        return phrases;
      }

      phrases.push(...withoutRepeat(spoken));
    }

    throw new Error(
      `readWithScreenReader: still reading new items after ${MAX_STEPS} steps ` +
        `or ${MAX_READING_MS / 1000}s. ` +
        'Read a smaller container, or drive the reader with startScreenReader().',
    );
  } finally {
    await reader.stop();
  }
}
