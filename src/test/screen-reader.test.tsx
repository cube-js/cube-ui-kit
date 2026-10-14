import { virtual } from '@guidepup/virtual-screen-reader';
import { render, waitFor } from '@testing-library/react';
import { onTestFinished } from 'vitest';

import { readWithScreenReader, startScreenReader } from './screen-reader';

describe('readWithScreenReader', () => {
  it('reads the page once, top to bottom', async () => {
    render(
      <>
        <h2>Files</h2>
        <button>Save</button>
      </>,
    );

    expect(await readWithScreenReader()).toEqual([
      'document',
      'heading, Files, level 2',
      'button, Save',
      'end of document',
    ]);
  });

  it('reads a page with nothing in it', async () => {
    expect(await readWithScreenReader()).toEqual(['document']);
  });

  it('stops where an aria-modal dialog wraps the reader around', async () => {
    render(
      <div role="dialog" aria-modal="true" aria-label="Rename">
        <button>OK</button>
      </div>,
    );

    // No 'end of document': past the dialog's end the reader is back at its
    // start, and the reading ends there.
    expect(await readWithScreenReader()).toEqual([
      'document',
      'dialog, Rename, modal',
      'button, OK',
      'end of dialog, Rename, modal',
    ]);
  });

  it('reads only the container it is given', async () => {
    const { getByRole } = render(
      <>
        <button>Outside</button>
        <nav aria-label="Pages">
          <a href="#a">Home</a>
        </nav>
      </>,
    );

    expect(await readWithScreenReader(getByRole('navigation'))).toEqual([
      'navigation, Pages',
      'link, Home',
      'end of navigation, Pages',
    ]);
  });
});

describe('startScreenReader', () => {
  it('ends the session already running', async () => {
    const { getByRole } = render(<button>Save</button>);

    await startScreenReader();
    const reader = await startScreenReader();

    getByRole('button').focus();

    // A second listener left behind by the first session would log it twice.
    await waitFor(async () =>
      expect(await reader.spokenPhraseLog()).toEqual([
        'document',
        'button, Save',
      ]),
    );
  });

  it('presses keys under fake timers that advance', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    onTestFinished(() => {
      vi.useRealTimers();
    });
    render(
      <>
        <button>Save</button>
        <button>Cancel</button>
      </>,
    );
    const reader = await startScreenReader();

    await reader.press('Tab');
    await reader.press('Tab');

    expect(await reader.lastSpokenPhrase()).toBe('button, Cancel');
  });

  it('starts a session the test does not stop', async () => {
    await startScreenReader();
  });

  it('has stopped that session when the test finished', async () => {
    await expect(virtual.spokenPhraseLog()).rejects.toThrow('was not started');
  });
});
