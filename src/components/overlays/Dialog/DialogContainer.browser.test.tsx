import { useState } from 'react';
import { flushSync } from 'react-dom';

import { renderWithRoot, screen, userEvent, waitFor } from '../../../test';
import { Button } from '../../actions/Button';

import { Dialog } from './Dialog';
import { DialogContainer } from './DialogContainer';

type User = ReturnType<typeof userEvent.setup>;

const CLOSERS = {
  Escape: (user: User) => user.keyboard('{Escape}'),
  'the dismiss button': (user: User) =>
    user.click(screen.getByTestId('ModalCloseButton')),
  'an action that closes it': (user: User) =>
    user.click(screen.getByTestId('Done')),
};

describe.each([
  ['modal', Object.keys(CLOSERS)],
  ['tray', ['Escape', 'an action that closes it']],
] as const)('DialogContainer focus restore (type=%s)', (type, closers) => {
  function App({ hideOnClose }: { hideOnClose: boolean }) {
    const [isOpen, setOpen] = useState(false);

    return (
      <>
        <Button qa="Opener" onPress={() => setOpen(true)}>
          Open
        </Button>
        <DialogContainer
          type={type}
          hideOnClose={hideOnClose}
          isOpen={isOpen}
          onDismiss={() => setOpen(false)}
        >
          <Dialog aria-label="Retained">
            <input aria-label="Draft" />
            <Button qa="Done" onPress={() => setOpen(false)}>
              Done
            </Button>
          </Dialog>
        </DialogContainer>
      </>
    );
  }

  describe.each([true, false])('hideOnClose=%s', (hideOnClose) => {
    it.each(closers)(
      'returns focus to the opener on every close by %s',
      async (closer) => {
        const user = userEvent.setup();
        renderWithRoot(<App hideOnClose={hideOnClose} />);
        const opener = screen.getByTestId('Opener');

        for (let cycle = 0; cycle < 2; cycle++) {
          await user.click(opener);
          const dialog = await screen.findByRole('dialog');
          await waitFor(() =>
            expect(dialog).toContainElement(
              document.activeElement as HTMLElement,
            ),
          );

          await CLOSERS[closer](user);
          await waitFor(() => expect(opener).toHaveFocus());
        }
      },
    );
  });
});

describe('DialogContainer hideOnClose focus restore', () => {
  // The first open mounts the dialog, and a native `autoFocus` moves focus in
  // before any effect can read the opener.
  it('returns focus to the opener after an autofocused first open', async () => {
    function App() {
      const [isOpen, setOpen] = useState(false);

      return (
        <>
          <Button qa="Opener" onPress={() => setOpen(true)}>
            Open
          </Button>
          <DialogContainer hideOnClose onDismiss={() => setOpen(false)}>
            {isOpen ? (
              <Dialog aria-label="Retained">
                {/* oxlint-disable-next-line jsx-a11y/no-autofocus -- the case under test */}
                <input autoFocus aria-label="Draft" />
              </Dialog>
            ) : null}
          </DialogContainer>
        </>
      );
    }

    const user = userEvent.setup();
    renderWithRoot(<App />);
    const opener = screen.getByTestId('Opener');

    for (let cycle = 0; cycle < 2; cycle++) {
      await user.click(opener);
      const dialog = await screen.findByRole('dialog');
      // Only the first open autofocuses: the retained field mounts once.
      await waitFor(() =>
        cycle === 0
          ? expect(screen.getByRole('textbox')).toHaveFocus()
          : expect(dialog).toContainElement(
              document.activeElement as HTMLElement,
            ),
      );

      await user.keyboard('{Escape}');
      await waitFor(() => expect(opener).toHaveFocus());
    }
  });

  it('leaves focus where an action handed it off', async () => {
    function App() {
      const [isOpen, setOpen] = useState(false);

      return (
        <>
          <Button qa="Opener" onPress={() => setOpen(true)}>
            Open
          </Button>
          <button type="button" data-qa="Outside">
            Outside
          </button>
          <DialogContainer hideOnClose isOpen={isOpen}>
            <Dialog aria-label="Retained">
              <Button
                qa="Act"
                onPress={() => {
                  flushSync(() => setOpen(false));
                  screen.getByTestId('Outside').focus();
                }}
              >
                Hand focus off
              </Button>
            </Dialog>
          </DialogContainer>
        </>
      );
    }

    const user = userEvent.setup();
    renderWithRoot(<App />);

    await user.click(screen.getByTestId('Opener'));
    await screen.findByRole('dialog');
    await user.click(screen.getByTestId('Act'));
    // Past the exit, where a retained dialog would restore.
    await new Promise((resolve) => setTimeout(resolve, 600));

    expect(screen.getByTestId('Outside')).toHaveFocus();
  });
});
