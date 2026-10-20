import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

import {
  act,
  fireEvent,
  renderWithRoot,
  screen,
  userEvent,
  wait,
  waitFor,
} from '../../../test';
import { Button } from '../../actions/Button';
import { CommandMenu } from '../../actions/CommandMenu';
import { Menu, MenuTrigger } from '../../actions/Menu';
import { Disclosure } from '../../content/Disclosure';
import { Checkbox } from '../../fields/Checkbox';
import {
  DateInput,
  DatePicker,
  DateRangePicker,
  DateRangeSeparatedPicker,
} from '../../fields/DatePicker';
import { Radio, RadioGroup } from '../../fields/RadioGroup';
import { Select } from '../../fields/Select';
import { Switch } from '../../fields/Switch';
import { TextArea } from '../../fields/TextArea';
import { AlertDialog } from '../AlertDialog';

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

    it('focuses an autofocused TextArea on every open', async () => {
      const user = userEvent.setup();

      function Composer() {
        const [isOpen, setOpen] = useState(false);

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
              <Dialog aria-label="Chat">
                <Button qa="Copy">Copy</Button>
                {/* oxlint-disable-next-line jsx-a11y/no-autofocus -- the case under test */}
                <TextArea autoFocus aria-label="Composer" />
              </Dialog>
            </DialogContainer>
          </>
        );
      }

      renderWithRoot(<Composer />);
      const opener = screen.getByTestId('Opener');

      for (let cycle = 0; cycle < 2; cycle++) {
        await user.click(opener);
        const composer = await screen.findByRole('textbox', {
          name: 'Composer',
        });

        await waitFor(() => expect(composer).toHaveFocus());
        await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
        expect(composer).toHaveFocus();

        await user.keyboard('{Escape}');
        await waitFor(() => expect(opener).toHaveFocus());
      }
    });

    // `autoFocus` acts when a control mounts, and a retained dialog mounts it
    // hidden, before its first open.
    it.each([
      'Button',
      'marked Button',
      'Select',
      'marked Select',
      'Checkbox',
      'Switch',
      'Radio',
      'CommandMenu',
      'DateInput',
      'DatePicker',
      'marked DatePicker',
      'DateRangePicker',
      'DateRangeSeparatedPicker',
    ])('focuses an autofocused %s on every open', async (control) => {
      const user = userEvent.setup();

      // oxlint-disable jsx-a11y/no-autofocus -- the case under test
      const controls = {
        Button: (
          <Button autoFocus qa="Autofocused">
            Continue
          </Button>
        ),
        // A consumer's own mark, kept by the control.
        'marked Button': (
          <Button data-autofocus="" qa="Autofocused">
            Continue
          </Button>
        ),
        'marked Select': (
          <Select
            aria-label="Region"
            inputProps={{ 'data-autofocus': '' }}
            qa="Autofocused"
          >
            <Select.Item key="eu">EU</Select.Item>
          </Select>
        ),
        Select: (
          <Select autoFocus aria-label="Region" qa="Autofocused">
            <Select.Item key="eu">EU</Select.Item>
          </Select>
        ),
        Checkbox: (
          <Checkbox autoFocus qa="Autofocused">
            Agree
          </Checkbox>
        ),
        Switch: (
          <Switch autoFocus qa="Autofocused">
            Notify
          </Switch>
        ),
        Radio: (
          <RadioGroup aria-label="Size" defaultValue="s">
            <Radio value="s">Small</Radio>
            <Radio autoFocus value="l" qa="Autofocused">
              Large
            </Radio>
          </RadioGroup>
        ),
        CommandMenu: (
          <CommandMenu aria-label="Commands">
            <CommandMenu.Item key="copy">Copy</CommandMenu.Item>
          </CommandMenu>
        ),
        DateInput: <DateInput autoFocus aria-label="Due" />,
        DatePicker: <DatePicker autoFocus aria-label="Due" />,
        'marked DatePicker': <DatePicker data-autofocus="" aria-label="Due" />,
        DateRangePicker: <DateRangePicker autoFocus aria-label="Stay" />,
        DateRangeSeparatedPicker: (
          <DateRangeSeparatedPicker autoFocus aria-label="Stay" />
        ),
      };
      // oxlint-enable jsx-a11y/no-autofocus

      function Confirm() {
        const [isOpen, setOpen] = useState(false);

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
              <Dialog aria-label="Confirm">
                <Button qa="Copy">Copy</Button>
                {controls[control]}
              </Dialog>
            </DialogContainer>
          </>
        );
      }

      renderWithRoot(<Confirm />);
      const opener = screen.getByTestId('Opener');

      for (let cycle = 0; cycle < 2; cycle++) {
        await user.click(opener);
        // A date field focuses its first segment, and a command menu its
        // search field (on by default).
        const autofocused = /Date/.test(control)
          ? (await screen.findAllByRole('spinbutton'))[0]
          : control === 'CommandMenu'
            ? await screen.findByRole('searchbox')
            : await screen.findByTestId('Autofocused');

        await waitFor(() => expect(autofocused).toHaveFocus());
        await act(() => wait(50));
        expect(autofocused).toHaveFocus();

        await user.keyboard('{Escape}');
        await waitFor(() => expect(opener).toHaveFocus());
      }
    });

    // Buttons mark themselves for `autoFocus` even while disabled.
    it('skips an autofocused control that cannot take focus', async () => {
      const user = userEvent.setup();

      function Retry() {
        const [isOpen, setOpen] = useState(false);

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
              <Dialog aria-label="Retry">
                {/* oxlint-disable-next-line jsx-a11y/no-autofocus -- the case under test */}
                <Button isDisabled autoFocus qa="Retry">
                  Retry
                </Button>
                <Button type="primary" qa="Save">
                  Save
                </Button>
              </Dialog>
            </DialogContainer>
          </>
        );
      }

      renderWithRoot(<Retry />);
      const opener = screen.getByTestId('Opener');

      for (let cycle = 0; cycle < 2; cycle++) {
        await user.click(opener);
        const save = await screen.findByTestId('Save');

        await waitFor(() => expect(save).toHaveFocus());

        await user.keyboard('{Escape}');
        await waitFor(() => expect(opener).toHaveFocus());
      }
    });

    // `useDialog` blurs and refocuses a dialog 500 ms after it mounts, so
    // VoiceOver on iOS announces it.
    it('refocuses the dialog half a second after it reopens', async () => {
      const { user, opener } = await openFromOpener();

      // Past the first open's refocus, and the one a retained dialog's mount
      // schedules.
      await act(() => wait(600));
      await user.keyboard('{Escape}');
      await waitFor(() => expect(opener).toHaveFocus());

      const focused: Element[] = [];
      const onFocusIn = (event: FocusEvent) => {
        const target = event.target as Element;

        if (target.getAttribute('role') === 'dialog') focused.push(target);
      };

      document.addEventListener('focusin', onFocusIn);

      try {
        await user.click(opener);
        await act(() => wait(700));
      } finally {
        document.removeEventListener('focusin', onFocusIn);
      }

      expect(screen.getByRole('dialog')).toHaveFocus();
      expect(focused).toHaveLength(2);
    });

    // `useDialog` refocuses a dialog 500 ms after it mounts, and a retained
    // one mounts hidden: opened before then, that is its only refocus.
    it('refocuses the dialog once when it opens right after it mounts', async () => {
      const user = userEvent.setup();
      renderWithRoot(<App />);

      const focused: Element[] = [];
      const onFocusIn = (event: FocusEvent) => {
        const target = event.target as Element;

        if (target.getAttribute('role') === 'dialog') focused.push(target);
      };

      document.addEventListener('focusin', onFocusIn);

      try {
        await user.click(screen.getByTestId('Opener'));
        await act(() => wait(1100));
      } finally {
        document.removeEventListener('focusin', onFocusIn);
      }

      expect(screen.getByRole('dialog')).toHaveFocus();
      expect(focused).toHaveLength(2);
    });

    // Several autofocused controls: the last takes focus, as each focuses
    // itself when it mounts.
    it('focuses the last autofocused control on every open', async () => {
      const user = userEvent.setup();

      function Marked() {
        const [isOpen, setOpen] = useState(false);

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
              <Dialog aria-label="Marked">
                {/* oxlint-disable-next-line jsx-a11y/no-autofocus -- the case under test */}
                <Button autoFocus qa="First">
                  First
                </Button>
                {/* oxlint-disable-next-line jsx-a11y/no-autofocus -- the case under test */}
                <Button autoFocus qa="Second">
                  Second
                </Button>
                <Button type="primary" qa="Save">
                  Save
                </Button>
              </Dialog>
            </DialogContainer>
          </>
        );
      }

      renderWithRoot(<Marked />);
      const opener = screen.getByTestId('Opener');

      for (let cycle = 0; cycle < 2; cycle++) {
        await user.click(opener);
        const second = await screen.findByTestId('Second');

        await waitFor(() => expect(second).toHaveFocus());
        await act(() => wait(50));
        expect(second).toHaveFocus();

        await user.keyboard('{Escape}');
        await waitFor(() => expect(opener).toHaveFocus());
      }
    });

    // A screen reader's virtual cursor: `focusSafely` holds a control's
    // `autoFocus` until transitions end, and the dialog focuses it meanwhile,
    // never a primary or destructive button instead.
    it.each(['Button', 'AlertDialog'])(
      'focuses an autofocused control when a screen reader opens it (%s)',
      async (kind) => {
        function Confirm() {
          const [isOpen, setOpen] = useState(false);

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
                {kind === 'Button' ? (
                  <Dialog aria-label="Confirm">
                    {/* oxlint-disable-next-line jsx-a11y/no-autofocus -- the case under test */}
                    <Button
                      autoFocus
                      qa="Cancel"
                      onPress={() => setOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="primary" qa="Save">
                      Save
                    </Button>
                  </Dialog>
                ) : (
                  <AlertDialog
                    danger
                    title="Delete"
                    content="Delete the report?"
                    actions={{
                      confirm: { label: 'Delete' },
                      cancel: { qa: 'Cancel' },
                    }}
                  />
                )}
              </DialogContainer>
            </>
          );
        }

        renderWithRoot(<Confirm />);
        const opener = screen.getByTestId('Opener');

        for (let cycle = 0; cycle < 2; cycle++) {
          // A virtual cursor moves focus to the button, then clicks it with
          // no pointer behind the click.
          act(() => opener.focus());
          fireEvent.click(opener);
          const cancel = await screen.findByTestId('Cancel');

          await waitFor(() => expect(cancel).toHaveFocus());
          await act(() => wait(300));
          expect(cancel).toHaveFocus();

          fireEvent.click(cancel);
          await waitFor(() => expect(opener).toHaveFocus());
          await act(() => wait(400));
        }
      },
    );

    // Containment ends as a dialog closes, so Tab leaves it for the page
    // beside its opener rather than the end of the document.
    it.each(['modal', 'panel'] as const)(
      'tabs to the controls around its opener while a %s closes',
      async (type) => {
        const user = userEvent.setup();

        function Notes() {
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
                <Dialog aria-label="Notes" isDismissable={false}>
                  <Button qa="Done" onPress={() => setOpen(false)}>
                    Done
                  </Button>
                </Dialog>
              </DialogContainer>
              <Button qa="After">After</Button>
            </>
          );
        }

        renderWithRoot(<Notes />);
        const opener = screen.getByTestId('Opener');
        const after = screen.getByTestId('After');

        for (let cycle = 0; cycle < 2; cycle++) {
          opener.focus();
          await user.keyboard('{Enter}');
          const done = await screen.findByTestId('Done');

          await waitFor(() =>
            expect(screen.getByRole('dialog')).toContainElement(
              document.activeElement as HTMLElement,
            ),
          );

          done.focus();
          // Closes it, and focus stays on Done while it exits.
          await user.keyboard('{Enter}');
          await user.tab();
          expect(after).toHaveFocus();

          // The end of the exit leaves it there.
          await act(() => wait(600));
          expect(after).toHaveFocus();
        }
      },
    );

    // A panel does not trap focus: Tab leaves it for the page beside its
    // opener rather than the end of the document, where its portal sits.
    it('tabs out of a panel to the controls around its opener', async () => {
      const user = userEvent.setup();

      function Notes() {
        const [isOpen, setOpen] = useState(false);

        return (
          <>
            <Button qa="Before">Before</Button>
            <Button qa="Opener" onPress={() => setOpen(true)}>
              Open
            </Button>
            <DialogContainer
              type="panel"
              hideOnClose={hideOnClose}
              isOpen={isOpen}
              onDismiss={() => setOpen(false)}
            >
              <Dialog aria-label="Notes" isDismissable={false}>
                <Button qa="First">First</Button>
                <Button qa="Done" onPress={() => setOpen(false)}>
                  Done
                </Button>
              </Dialog>
            </DialogContainer>
            <Button qa="After">After</Button>
          </>
        );
      }

      renderWithRoot(<Notes />);
      const opener = screen.getByTestId('Opener');

      for (let cycle = 0; cycle < 2; cycle++) {
        opener.focus();
        await user.keyboard('{Enter}');
        const dialog = await screen.findByRole('dialog', { name: 'Notes' });

        await waitFor(() =>
          expect(dialog).toContainElement(
            document.activeElement as HTMLElement,
          ),
        );

        screen.getByTestId('Done').focus();
        await user.tab();
        expect(screen.getByTestId('After')).toHaveFocus();

        screen.getByTestId('First').focus();
        await user.tab({ shift: true });
        expect(screen.getByTestId('Before')).toHaveFocus();

        screen.getByTestId('Done').focus();
        await user.keyboard('{Enter}');
        await waitFor(() => expect(opener).toHaveFocus());
      }
    });

    // Nothing to go on from: Tab moves natively, so off the panel's portal at
    // the end of the document. A retained panel's `FocusScope` would go on
    // from the element focused when it mounted.
    it('tabs natively out of a panel opened with focus on the page', async () => {
      const user = userEvent.setup();

      function App() {
        const [isMounted, setMounted] = useState(false);
        const [isOpen, setOpen] = useState(false);

        // Shortcuts, so focus stays where it is.
        useEffect(() => {
          const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'F3') setMounted(true);
            if (event.key === 'F2') setOpen(true);
          };

          document.addEventListener('keydown', onKeyDown);

          return () => document.removeEventListener('keydown', onKeyDown);
        }, []);

        return (
          <>
            <Button qa="Link">Link</Button>
            <Button qa="NextToLink">Next to link</Button>
            {isMounted ? (
              <DialogContainer
                type="panel"
                hideOnClose={hideOnClose}
                isOpen={isOpen}
                onDismiss={() => setOpen(false)}
              >
                <Dialog aria-label="Notes" isDismissable={false}>
                  <Button qa="First">First</Button>
                  <Button qa="Done" onPress={() => setOpen(false)}>
                    Done
                  </Button>
                </Dialog>
              </DialogContainer>
            ) : null}
            <Button qa="Last">Last</Button>
          </>
        );
      }

      renderWithRoot(<App />);
      act(() => screen.getByTestId('Link').focus());
      await user.keyboard('{F3}');
      act(() => (document.activeElement as HTMLElement).blur());
      await user.keyboard('{F2}');
      await screen.findByRole('dialog', { name: 'Notes' });

      act(() => screen.getByTestId('Done').focus());
      await user.tab();
      expect(document.body).toHaveFocus();

      act(() => screen.getByTestId('First').focus());
      await user.tab({ shift: true });
      expect(screen.getByTestId('Last')).toHaveFocus();
    });

    // Mounted and opened with nothing focused, so no `FocusScope` takes the
    // key: the control still sees it, as one that completes on Tab needs.
    it('leaves Tab to its last control when nothing was focused', async () => {
      const user = userEvent.setup();
      const seen: string[] = [];

      function App() {
        const [isOpen, setOpen] = useState(false);

        useEffect(() => {
          const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'F2') setOpen(true);
          };

          document.addEventListener('keydown', onKeyDown);

          return () => document.removeEventListener('keydown', onKeyDown);
        }, []);

        return (
          <DialogContainer
            type="panel"
            hideOnClose={hideOnClose}
            isOpen={isOpen}
            onDismiss={() => setOpen(false)}
          >
            <Dialog aria-label="Notes" isDismissable={false}>
              <input
                aria-label="Code"
                data-qa="Code"
                onKeyDown={(event) => {
                  if (event.key === 'Tab') seen.push(event.key);
                }}
              />
            </Dialog>
          </DialogContainer>
        );
      }

      renderWithRoot(<App />);
      await user.keyboard('{F2}');
      const code = await screen.findByTestId('Code');

      act(() => code.focus());
      await user.tab();
      expect(seen).toEqual(['Tab']);
    });

    // What renders it goes while it is open, as a tab switch removes it.
    it.each(['a field in it', 'a list opened from it'])(
      'returns focus to the opener when it unmounts while %s has focus',
      async (where) => {
        const user = userEvent.setup();
        let hide = () => {};

        function Notes({ isOpen, onDismiss }) {
          return (
            <DialogContainer
              hideOnClose={hideOnClose}
              isOpen={isOpen}
              onDismiss={onDismiss}
            >
              <Dialog aria-label="Notes">
                <input aria-label="Name" data-qa="Name" />
                <Select aria-label="Region" qa="Region">
                  <Select.Item key="eu">EU</Select.Item>
                </Select>
              </Dialog>
            </DialogContainer>
          );
        }

        function App() {
          const [isShown, setShown] = useState(false);
          const [isOpen, setOpen] = useState(false);

          hide = () => setShown(false);

          return (
            <>
              <Button qa="Add" onPress={() => setShown(true)}>
                Add
              </Button>
              <Button qa="Opener" onPress={() => setOpen(true)}>
                Open
              </Button>
              {isShown ? (
                <Notes isOpen={isOpen} onDismiss={() => setOpen(false)} />
              ) : null}
            </>
          );
        }

        renderWithRoot(<App />);
        // Mounted while Add has focus, as after adding a row.
        await user.click(screen.getByTestId('Add'));
        await act(() => wait(600));

        await user.click(screen.getByTestId('Opener'));

        if (where === 'a field in it') {
          await user.click(await screen.findByTestId('Name'));
        } else {
          await user.click(await screen.findByTestId('Region'));
          const listbox = await screen.findByRole('listbox');

          await waitFor(() =>
            expect(listbox).toContainElement(
              document.activeElement as HTMLElement,
            ),
          );
        }

        act(() => hide());
        await act(() => wait(100));
        expect(screen.getByTestId('Opener')).toHaveFocus();
      },
    );

    // The opener goes in the same commit: nothing to return to.
    it('leaves focus on the page when it unmounts with its opener', async () => {
      const user = userEvent.setup();
      let hide = () => {};

      function Section() {
        const [isOpen, setOpen] = useState(false);

        return (
          <>
            <Button qa="Opener" onPress={() => setOpen(true)}>
              Edit
            </Button>
            <DialogContainer
              hideOnClose={hideOnClose}
              isOpen={isOpen}
              onDismiss={() => setOpen(false)}
            >
              <Dialog aria-label="Notes">
                <input aria-label="Name" data-qa="Name" />
              </Dialog>
            </DialogContainer>
          </>
        );
      }

      function App() {
        const [isShown, setShown] = useState(false);

        hide = () => setShown(false);

        return (
          <>
            <Button qa="Settings" onPress={() => setShown(true)}>
              Settings
            </Button>
            {isShown ? <Section /> : null}
          </>
        );
      }

      renderWithRoot(<App />);
      // Mounted while Settings has focus.
      await user.click(screen.getByTestId('Settings'));
      await act(() => wait(600));
      await user.click(screen.getByTestId('Opener'));
      await user.click(await screen.findByTestId('Name'));

      act(() => hide());
      await act(() => wait(100));
      expect(document.body).toHaveFocus();
    });

    // A step replaced inside the open container: focus moves to the next
    // step without passing through the opener.
    it('leaves its opener alone when a step replaces its content', async () => {
      const user = userEvent.setup();
      const openerEvents: string[] = [];

      function App() {
        const [isOpen, setOpen] = useState(false);
        const [step, setStep] = useState(1);

        return (
          <>
            <Button
              qa="Opener"
              onFocus={() => openerEvents.push('focus')}
              onBlur={() => openerEvents.push('blur')}
              onPress={() => setOpen(true)}
            >
              Open
            </Button>
            <DialogContainer
              hideOnClose={hideOnClose}
              isOpen={isOpen}
              onDismiss={() => setOpen(false)}
            >
              {step === 1 ? (
                <Dialog key="details" aria-label="Details">
                  <Button qa="Next" onPress={() => setStep(2)}>
                    Next
                  </Button>
                </Dialog>
              ) : (
                <Dialog key="review" aria-label="Review">
                  <input aria-label="Notes" />
                </Dialog>
              )}
            </DialogContainer>
          </>
        );
      }

      renderWithRoot(<App />);
      await act(() => wait(600));
      await user.click(screen.getByTestId('Opener'));
      await screen.findByRole('dialog', { name: 'Details' });
      await act(() => wait(100));
      openerEvents.length = 0;

      await user.click(screen.getByTestId('Next'));
      const review = await screen.findByRole('dialog', { name: 'Review' });

      await act(() => wait(100));
      expect(review).toContainElement(document.activeElement as HTMLElement);
      expect(openerEvents).toEqual([]);
    });

    // A callback ref is a new ref on every render.
    it('keeps focus in a field while it rerenders with a callback ref', async () => {
      const user = userEvent.setup();
      const openerEvents: string[] = [];

      function App() {
        const [isOpen, setOpen] = useState(false);
        const [name, setName] = useState('');

        return (
          <>
            <Button
              qa="Opener"
              onFocus={() => openerEvents.push('focus')}
              onPress={() => setOpen(true)}
            >
              Open
            </Button>
            <DialogContainer
              hideOnClose={hideOnClose}
              isOpen={isOpen}
              onDismiss={() => setOpen(false)}
            >
              <Dialog ref={(element) => void element} aria-label="Rename">
                <input
                  aria-label="Name"
                  data-qa="Name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </Dialog>
            </DialogContainer>
          </>
        );
      }

      renderWithRoot(<App />);
      await user.click(screen.getByTestId('Opener'));
      const field = await screen.findByTestId('Name');

      await user.click(field);
      openerEvents.length = 0;
      await user.keyboard('ab');
      await act(() => wait(100));

      expect(field).toHaveFocus();
      expect(openerEvents).toEqual([]);
    });

    // A disclosure stays open around the removed opener: not a popup that
    // closed, so there is nothing to return to.
    it('leaves focus on the page when its opener goes from an open disclosure', async () => {
      const user = userEvent.setup();

      function Rows() {
        const [isOpen, setOpen] = useState(false);
        const [hasRow, setHasRow] = useState(true);

        return (
          <>
            <Disclosure defaultExpanded>
              <Disclosure.Trigger qa="Rows">Rows</Disclosure.Trigger>
              <Disclosure.Content>
                {hasRow ? (
                  <Button qa="Opener" onPress={() => setOpen(true)}>
                    Delete row
                  </Button>
                ) : null}
              </Disclosure.Content>
            </Disclosure>
            <DialogContainer
              hideOnClose={hideOnClose}
              isOpen={isOpen}
              onDismiss={() => setOpen(false)}
            >
              <Dialog aria-label="Confirm">
                <Button
                  qa="Delete"
                  onPress={() => {
                    setHasRow(false);
                    setOpen(false);
                  }}
                >
                  Delete
                </Button>
              </Dialog>
            </DialogContainer>
          </>
        );
      }

      renderWithRoot(<Rows />);
      await act(() => wait(600));
      await user.click(screen.getByTestId('Opener'));
      await user.click(await screen.findByTestId('Delete'));
      await act(() => wait(800));

      expect(document.body).toHaveFocus();
    });

    it('returns focus to the menu trigger when a menu item opened it', async () => {
      const user = userEvent.setup();

      function Actions() {
        const [isOpen, setOpen] = useState(false);

        return (
          <>
            <MenuTrigger>
              <Button qa="Actions">Actions</Button>
              <Menu aria-label="Actions" onAction={() => setOpen(true)}>
                <Menu.Item key="rename">Rename</Menu.Item>
              </Menu>
            </MenuTrigger>
            <DialogContainer
              hideOnClose={hideOnClose}
              isOpen={isOpen}
              onDismiss={() => setOpen(false)}
            >
              <Dialog aria-label="Rename">
                <input aria-label="Name" />
              </Dialog>
            </DialogContainer>
          </>
        );
      }

      renderWithRoot(<Actions />);
      const trigger = screen.getByTestId('Actions');

      for (let cycle = 0; cycle < 2; cycle++) {
        trigger.focus();
        await user.keyboard('{Enter}');
        const item = await screen.findByRole('menuitem', { name: 'Rename' });

        await waitFor(() => expect(item).toHaveFocus());
        await user.keyboard('{Enter}');
        const dialog = await screen.findByRole('dialog', { name: 'Rename' });

        await waitFor(() =>
          expect(dialog).toContainElement(
            document.activeElement as HTMLElement,
          ),
        );

        await user.keyboard('{Escape}');
        await waitFor(() => expect(trigger).toHaveFocus());
      }
    });

    // A wizard step that hands over to the next: the second dialog's opener is
    // in the first, which is closed and hidden by the time the second closes.
    it('returns focus to the opener when a dialog opened from it closes', async () => {
      const user = userEvent.setup();

      function Wizard() {
        const [step, setStep] = useState<0 | 1 | 2>(0);

        return (
          <>
            <Button qa="Opener" onPress={() => setStep(1)}>
              Open
            </Button>
            <DialogContainer
              hideOnClose={hideOnClose}
              isOpen={step === 1}
              onDismiss={() => setStep(0)}
            >
              <Dialog aria-label="Step 1">
                <Button qa="Next" onPress={() => setStep(2)}>
                  Next
                </Button>
              </Dialog>
            </DialogContainer>
            <DialogContainer isOpen={step === 2} onDismiss={() => setStep(0)}>
              <Dialog aria-label="Step 2">
                <input aria-label="Name" />
              </Dialog>
            </DialogContainer>
          </>
        );
      }

      renderWithRoot(<Wizard />);
      const opener = screen.getByTestId('Opener');

      for (let cycle = 0; cycle < 2; cycle++) {
        opener.focus();
        await user.keyboard('{Enter}');
        const first = await screen.findByRole('dialog', { name: 'Step 1' });

        await waitFor(() =>
          expect(first).toContainElement(document.activeElement as HTMLElement),
        );

        screen.getByTestId('Next').focus();
        await user.keyboard('{Enter}');
        const second = await screen.findByRole('dialog', { name: 'Step 2' });

        await waitFor(() =>
          expect(second).toContainElement(
            document.activeElement as HTMLElement,
          ),
        );
        // Past step 1's exit, so its content is hidden.
        await act(() => wait(500));

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

      // `useDialog` re-focuses a dialog left on `<body>` 500 ms after it
      // mounts (an iOS VoiceOver workaround); let that pass first.
      await act(() => new Promise((resolve) => setTimeout(resolve, 600)));
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
