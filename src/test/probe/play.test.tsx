import { render } from '@testing-library/react';
import { onTestFinished } from 'vitest';

import { PlayError, runPlay } from './play';

describe('runPlay', () => {
  it('reports nothing without play or --sr', async () => {
    expect(await runPlay(undefined, false)).toEqual({});
  });

  it('reads the page under --sr', async () => {
    render(<button>Save</button>);

    expect(await runPlay(undefined, true)).toEqual({
      spoken: ['document', 'button, Save', 'end of document'],
    });
  });

  it('reports what the reader said during play, then reads the page', async () => {
    render(
      <>
        <button>Save</button>
        <button>Cancel</button>
      </>,
    );

    const result = await runPlay(async ({ reader }) => {
      await reader.press('Tab');
    }, true);

    expect(result).toEqual({
      spokenDuringPlay: ['document', 'button, Save'],
      spoken: ['document', 'button, Save', 'button, Cancel', 'end of document'],
    });
  });

  it('runs the reader for play without --sr, and reports nothing spoken', async () => {
    render(<button>Save</button>);

    let heard: string | undefined;

    const result = await runPlay(async ({ reader }) => {
      await reader.press('Tab');
      heard = await reader.lastSpokenPhrase();
    }, false);

    expect(heard).toBe('button, Save');
    expect(result).toEqual({});
  });

  it("reports a failure in play as the snippet's", async () => {
    const result = runPlay(async () => {
      throw new Error('no dialog');
    }, false);

    await expect(result).rejects.toThrow(PlayError);
    await expect(result).rejects.toMatchObject({
      kind: 'play',
      message: 'no dialog',
    });
  });

  it("reports a reading that fails as the snippet's, with advice", async () => {
    vi.resetModules();
    vi.doMock('../screen-reader', async (importOriginal) => ({
      ...((await importOriginal()) as object),
      readWithScreenReader: () =>
        Promise.reject(new Error('still reading new items')),
    }));
    onTestFinished(() => {
      vi.doUnmock('../screen-reader');
    });

    const play = await import('./play');
    const result = play.runPlay(undefined, true);

    await expect(result).rejects.toThrow(play.PlayError);
    await expect(result).rejects.toMatchObject({
      kind: 'read',
      message: expect.stringContaining('Probe a smaller snippet.'),
    });
  });
});
