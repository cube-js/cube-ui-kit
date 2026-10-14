/**
 * The snippet's optional `play` export and the `--sr` screen reader, shared by
 * both probe tiers.
 *
 * `play` runs after the snippet mounts and before anything is captured, so the
 * HTML and CSS the probe reports are the state the interaction left behind — an
 * open popover, a focused option, a validation error.
 *
 * `--sr` answers two questions. What does the page read as once `play` is done
 * (or straight after the mount without one)? And, with `play`, what did the
 * reader say while `play` drove it — focus moves, live regions?
 */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { readWithScreenReader, startScreenReader } from '../screen-reader';

import type { ScreenReader } from '../screen-reader';

export interface PlayContext {
  /** The virtual screen reader. `--sr` prints what it said. */
  reader: ScreenReader;
  screen: typeof screen;
  userEvent: typeof userEvent;
  waitFor: typeof waitFor;
  within: typeof within;
}

export type Play = (context: PlayContext) => unknown;

export interface Spoken {
  /** A top-to-bottom reading of the page as `play` left it. */
  spoken?: string[];
  /** The reader's log while `play` ran. Only with `--sr` and a `play`. */
  spokenDuringPlay?: string[];
}

/**
 * A failure the probe reports as the snippet's rather than its own: in its
 * `play`, or in reading the page it rendered.
 */
export class PlayError extends Error {
  readonly kind: 'play' | 'read';

  constructor(message: string, kind: 'play' | 'read' = 'play') {
    super(message);
    this.kind = kind;
  }
}

/** Run the snippet's `play`, if it has one, and under `--sr` the reader. */
export async function runPlay(
  play: Play | undefined,
  screenReader: boolean,
): Promise<Spoken> {
  let spokenDuringPlay: string[] | undefined;

  if (play) {
    const reader = await startScreenReader();

    try {
      await play({ reader, screen, userEvent, waitFor, within });

      if (screenReader) {
        spokenDuringPlay = [...(await reader.spokenPhraseLog())];
      }
    } catch (error) {
      throw new PlayError(
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      await reader.stop();
    }
  }

  if (!screenReader) return {};

  try {
    return { spoken: await readWithScreenReader(), spokenDuringPlay };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    throw new PlayError(`${message}\n\nProbe a smaller snippet.`, 'read');
  }
}
