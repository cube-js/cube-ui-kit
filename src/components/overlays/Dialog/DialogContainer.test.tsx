import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

import { act, renderWithRoot, screen, userEvent, waitFor } from '../../../test';
import { Button } from '../../actions/Button';

import { Dialog } from './Dialog';
import { DialogContainer } from './DialogContainer';

describe.each(['modal', 'tray'] as const)(
  '<DialogContainer type=%s />',
  (type) => {
    it.each([
      [true, false, true],
      [false, false, false],
      [true, true, false],
    ])(
      'honors passive dismissal (dismissable=%s, keyboard disabled=%s)',
      async (isDismissable, isKeyboardDismissDisabled, shouldDismiss) => {
        const onDismiss = vi.fn();
        const { getByRole } = renderWithRoot(
          <DialogContainer
            type={type}
            isOpen
            isDismissable={isDismissable}
            isKeyboardDismissDisabled={isKeyboardDismissDisabled}
            onDismiss={onDismiss}
          >
            <Dialog aria-label="Chat" isDismissable={false}>
              <input aria-label="Message" />
            </Dialog>
          </DialogContainer>,
        );
        await userEvent.click(getByRole('textbox', { name: 'Message' }));
        await userEvent.keyboard('{Escape}');
        expect(onDismiss).toHaveBeenCalledTimes(shouldDismiss ? 1 : 0);
      },
    );

    it('keeps explicit dialog dismissal available when passive dismissal is disabled', async () => {
      const onDismiss = vi.fn();
      const { getByTestId } = renderWithRoot(
        <DialogContainer
          type={type}
          isOpen
          isDismissable={false}
          onDismiss={onDismiss}
        >
          <Dialog aria-label="Chat" isDismissable>
            <input aria-label="Message" />
          </Dialog>
        </DialogContainer>,
      );
      await userEvent.click(getByTestId('ModalCloseButton'));
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('does not lock scrolling when a retained dialog starts closed', () => {
      const { getByRole } = renderWithRoot(
        <>
          <button>Page action</button>
          <DialogContainer type={type} hideOnClose isOpen={false}>
            <Dialog aria-label="Chat">
              <input aria-label="Message" />
            </Dialog>
          </DialogContainer>
        </>,
      );
      expect(getByRole('button', { name: 'Page action' })).toBeVisible();
      expect(document.documentElement.style.overflow).not.toBe('hidden');
    });

    it('retains a conditional dialog and its input state with hideOnClose', async () => {
      const dialog = (
        <Dialog>
          <input aria-label="Name" defaultValue="Initial" />
        </Dialog>
      );
      const { getByRole, getByTestId, rerender } = renderWithRoot(
        <DialogContainer type={type} hideOnClose>
          {dialog}
        </DialogContainer>,
      );

      const updatedDialog = (
        <Dialog key="updated">
          <input aria-label="Name" defaultValue="Updated" />
        </Dialog>
      );
      rerender(
        <DialogContainer type={type} hideOnClose>
          {updatedDialog}
        </DialogContainer>,
      );

      const input = getByRole('textbox', { name: 'Name' });
      await userEvent.clear(input);
      await userEvent.type(input, 'Draft');

      rerender(
        <DialogContainer type={type} hideOnClose>
          {null}
        </DialogContainer>,
      );

      await waitFor(() => {
        expect(getByTestId(type === 'tray' ? 'Tray' : 'Modal')).toHaveAttribute(
          'data-unmounted',
        );
      });
      expect(input).toBeInTheDocument();
      expect(input).not.toBeVisible();
      expect(document.documentElement.style.overflow).not.toBe('hidden');

      rerender(
        <DialogContainer type={type} hideOnClose>
          {updatedDialog}
        </DialogContainer>,
      );

      expect(getByRole('textbox', { name: 'Name' })).toBe(input);
      expect(input).toHaveValue('Draft');
    });

    it('does not show a retained dialog when explicitly reopened without children', async () => {
      const { getByRole, getByTestId, rerender } = renderWithRoot(
        <DialogContainer type={type} hideOnClose isOpen>
          <Dialog>
            <input aria-label="Name" />
          </Dialog>
        </DialogContainer>,
      );
      const input = getByRole('textbox', { name: 'Name' });

      rerender(<DialogContainer type={type} hideOnClose isOpen={false} />);

      await waitFor(() => {
        expect(getByTestId(type === 'tray' ? 'Tray' : 'Modal')).toHaveAttribute(
          'data-unmounted',
        );
      });
      expect(input).toBeInTheDocument();

      rerender(<DialogContainer type={type} hideOnClose isOpen />);

      expect(input).not.toBeInTheDocument();

      rerender(<DialogContainer type={type} hideOnClose isOpen={false} />);

      await waitFor(() => {
        expect(getByTestId(type === 'tray' ? 'Tray' : 'Modal')).toHaveAttribute(
          'data-unmounted',
        );
      });
      expect(input).not.toBeInTheDocument();
    });

    it('unmounts a conditional dialog after exit by default', async () => {
      const { getByRole, rerender } = renderWithRoot(
        <DialogContainer type={type}>
          <Dialog>
            <input aria-label="Name" defaultValue="Initial" />
          </Dialog>
        </DialogContainer>,
      );
      const input = getByRole('textbox', { name: 'Name' });

      rerender(<DialogContainer type={type}>{null}</DialogContainer>);

      await waitFor(() => {
        expect(input).not.toBeInTheDocument();
      });
    });
  },
);

type User = ReturnType<typeof userEvent.setup>;

const CLOSERS = {
  Escape: (user: User) => user.keyboard('{Escape}'),
  'the dismiss button': (user: User) =>
    user.click(screen.getByTestId('ModalCloseButton')),
  'an action that closes it': (user: User) =>
    user.click(screen.getByTestId('Done')),
  'a press outside': async (user: User) => {
    const underlay = screen.getByTestId('Underlay');

    // It takes presses once the overlay is shown.
    await waitFor(() => expect(underlay).toHaveAttribute('data-open'));
    await user.click(underlay);
  },
};

describe.each(['modal', 'tray'] as const)(
  'DialogContainer focus restore (type=%s)',
  (type) => {
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
      it.each(Object.keys(CLOSERS) as (keyof typeof CLOSERS)[])(
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
  },
);

describe('DialogContainer hideOnClose focus restore', () => {
  // The first open mounts the dialog, and a native `autoFocus` moves focus in
  // before any effect can read the opener.
  it.each([
    ['inside a mounted container', false],
    ['with its container', true],
  ])(
    'returns focus to the opener after an autofocused first open %s',
    async (_, mountsContainer) => {
      function App() {
        const [isOpen, setOpen] = useState(false);
        const [isMounted, setMounted] = useState(!mountsContainer);

        return (
          <>
            <Button
              qa="Opener"
              onPress={() => {
                setMounted(true);
                setOpen(true);
              }}
            >
              Open
            </Button>
            {isMounted ? (
              <DialogContainer hideOnClose onDismiss={() => setOpen(false)}>
                {isOpen ? (
                  <Dialog aria-label="Retained">
                    {/* oxlint-disable-next-line jsx-a11y/no-autofocus -- the case under test */}
                    <input autoFocus aria-label="Draft" />
                  </Dialog>
                ) : null}
              </DialogContainer>
            ) : null}
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
    },
  );

  // The dialog stays mounted, and its content moves focus in on every open, in
  // the same commit that opens it.
  it.each(['an autofocused field', 'a layout effect'])(
    'returns focus to each opener when %s moves focus in on open',
    async (mover) => {
      function Draft({ isOpen }: { isOpen: boolean }) {
        const ref = useRef<HTMLInputElement>(null);

        useLayoutEffect(() => {
          if (mover === 'a layout effect' && isOpen) ref.current?.focus();
        }, [isOpen]);

        if (mover === 'a layout effect') {
          return <input ref={ref} aria-label="Draft" />;
        }

        return isOpen ? (
          // oxlint-disable-next-line jsx-a11y/no-autofocus -- the case under test
          <input autoFocus aria-label="Draft" />
        ) : null;
      }

      function App() {
        const [isOpen, setOpen] = useState(false);

        return (
          <>
            <Button qa="First" onPress={() => setOpen(true)}>
              First
            </Button>
            <Button qa="Second" onPress={() => setOpen(true)}>
              Second
            </Button>
            <DialogContainer
              hideOnClose
              isOpen={isOpen}
              onDismiss={() => setOpen(false)}
            >
              <Dialog aria-label="Retained">
                <Draft isOpen={isOpen} />
              </Dialog>
            </DialogContainer>
          </>
        );
      }

      const user = userEvent.setup();
      renderWithRoot(<App />);

      for (const qa of ['First', 'Second']) {
        const opener = screen.getByTestId(qa);

        await user.click(opener);
        await waitFor(() => expect(screen.getByRole('textbox')).toHaveFocus());

        await user.keyboard('{Escape}');
        await waitFor(() => expect(opener).toHaveFocus());
      }
    },
  );

  describe.each([true, false])('hideOnClose=%s', (hideOnClose) => {
    function App() {
      const [isOpen, setOpen] = useState(false);

      // A shortcut reopens it without moving focus.
      useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
          if (event.key === 'F2') setOpen(true);
        };

        document.addEventListener('keydown', onKeyDown);

        return () => document.removeEventListener('keydown', onKeyDown);
      }, []);

      return (
        <>
          <Button qa="Opener" onPress={() => setOpen(true)}>
            Open
          </Button>
          <DialogContainer
            hideOnClose={hideOnClose}
            isOpen={isOpen}
            onDismiss={() => setOpen(false)}
          >
            <Dialog aria-label="Retained">
              <input aria-label="Draft" />
              {/* Closes and drops focus to the page, as a control that is
                  disabled or removed on close does. */}
              <Button
                qa="Done"
                onPress={() => {
                  setOpen(false);
                  (document.activeElement as HTMLElement).blur();
                }}
              >
                Done
              </Button>
            </Dialog>
          </DialogContainer>
        </>
      );
    }

    async function openFromOpener() {
      const user = userEvent.setup();
      renderWithRoot(<App />);
      const opener = screen.getByTestId('Opener');

      await user.click(opener);
      const dialog = await screen.findByRole('dialog');
      await waitFor(() =>
        expect(dialog).toContainElement(document.activeElement as HTMLElement),
      );

      return { user, opener, dialog };
    }

    it('focuses the dialog itself on every open, as on mount', async () => {
      const { user, opener } = await openFromOpener();

      for (let cycle = 0; cycle < 2; cycle++) {
        if (cycle > 0) {
          await user.click(opener);
        }

        const dialog = await screen.findByRole('dialog');

        await waitFor(() => expect(dialog).toHaveFocus());
        await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
        expect(dialog).toHaveFocus();

        await user.keyboard('{Escape}');
        await waitFor(() => expect(opener).toHaveFocus());
      }
    });

    it('returns focus to the opener after a reopen during the exit', async () => {
      const { user, opener, dialog } = await openFromOpener();

      await user.keyboard('{Escape}');
      await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
      // Still exiting, with focus still inside.
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
      await user.keyboard('{F2}');
      await screen.findByRole('dialog');

      await user.keyboard('{Escape}');
      await waitFor(() => expect(opener).toHaveFocus());
    });

    it('returns focus to the opener after a reopen during the exit from the page', async () => {
      const { user, opener } = await openFromOpener();

      await user.click(screen.getByTestId('Done'));
      await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
      expect(document.body).toHaveFocus();
      await user.keyboard('{F2}');
      const dialog = await screen.findByRole('dialog');
      await waitFor(() =>
        expect(dialog).toContainElement(document.activeElement as HTMLElement),
      );

      await user.keyboard('{Escape}');
      await waitFor(() => expect(opener).toHaveFocus());
    });
  });

  it('returns focus to an SVG opener', async () => {
    function App() {
      const [isOpen, setOpen] = useState(false);

      return (
        <>
          <svg width={100} height={100}>
            <g
              data-qa="Bar"
              tabIndex={0}
              role="button"
              aria-label="Bar"
              onKeyDown={(event) => {
                if (event.key === 'Enter') setOpen(true);
              }}
            >
              <rect width={20} height={80} />
            </g>
          </svg>
          <DialogContainer
            hideOnClose
            isOpen={isOpen}
            onDismiss={() => setOpen(false)}
          >
            <Dialog aria-label="Details">
              <input aria-label="Draft" />
            </Dialog>
          </DialogContainer>
        </>
      );
    }

    const user = userEvent.setup();
    renderWithRoot(<App />);
    const bar = screen.getByTestId('Bar');

    act(() => bar.focus());
    await user.keyboard('{Enter}');
    const dialog = await screen.findByRole('dialog');
    await waitFor(() =>
      expect(dialog).toContainElement(document.activeElement as HTMLElement),
    );

    await user.keyboard('{Escape}');
    await waitFor(() => expect(bar).toHaveFocus());
  });

  // Focus is left in the nested dialog, which closes too.
  it('returns focus to the opener when a nested dialog closes with it', async () => {
    function App() {
      const [isOpen, setOpen] = useState(false);
      const [isNestedOpen, setNestedOpen] = useState(false);

      return (
        <>
          <Button qa="Opener" onPress={() => setOpen(true)}>
            Open
          </Button>
          <DialogContainer hideOnClose isOpen={isOpen}>
            <Dialog aria-label="Retained">
              <Button qa="OpenNested" onPress={() => setNestedOpen(true)}>
                Open nested
              </Button>
              <DialogContainer isOpen={isNestedOpen}>
                <Dialog aria-label="Nested">
                  <Button
                    qa="CloseBoth"
                    onPress={() => {
                      setNestedOpen(false);
                      setOpen(false);
                    }}
                  >
                    Close both
                  </Button>
                </Dialog>
              </DialogContainer>
            </Dialog>
          </DialogContainer>
        </>
      );
    }

    const user = userEvent.setup();
    renderWithRoot(<App />);
    const opener = screen.getByTestId('Opener');

    for (let cycle = 0; cycle < 2; cycle++) {
      await user.click(opener);
      await user.click(await screen.findByTestId('OpenNested'));
      await user.click(await screen.findByTestId('CloseBoth'));
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
    await act(() => new Promise((resolve) => setTimeout(resolve, 600)));

    expect(screen.getByTestId('Outside')).toHaveFocus();
  });
});
