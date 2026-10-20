import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

import {
  act,
  fireEvent,
  renderWithRoot,
  screen,
  userEvent,
  waitFor,
} from '../../../test';
import { Button } from '../../actions/Button';
import { CommandMenu } from '../../actions/CommandMenu';
import { Menu, MenuTrigger } from '../../actions/Menu';
import { Checkbox } from '../../fields/Checkbox';
import { DateInput, DatePicker } from '../../fields/DatePicker';
import { Radio, RadioGroup } from '../../fields/RadioGroup';
import { Select } from '../../fields/Select';
import { Switch } from '../../fields/Switch';
import { TextArea } from '../../fields/TextArea';

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
      'Select',
      'Checkbox',
      'Switch',
      'Radio',
      'CommandMenu',
      'DateInput',
      'DatePicker',
    ])('focuses an autofocused %s on every open', async (control) => {
      const user = userEvent.setup();

      // oxlint-disable jsx-a11y/no-autofocus -- the case under test
      const controls = {
        Button: (
          <Button autoFocus qa="Autofocused">
            Continue
          </Button>
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
        const autofocused = control.startsWith('Date')
          ? (await screen.findAllByRole('spinbutton'))[0]
          : control === 'CommandMenu'
            ? await screen.findByRole('searchbox')
            : await screen.findByTestId('Autofocused');

        await waitFor(() => expect(autofocused).toHaveFocus());
        await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
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
      await act(() => new Promise((resolve) => setTimeout(resolve, 600)));
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
        await act(() => new Promise((resolve) => setTimeout(resolve, 700)));
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
        await act(() => new Promise((resolve) => setTimeout(resolve, 1100)));
      } finally {
        document.removeEventListener('focusin', onFocusIn);
      }

      expect(screen.getByRole('dialog')).toHaveFocus();
      expect(focused).toHaveLength(2);
    });

    // A screen reader's virtual cursor: `useDialog` focuses the dialog itself
    // only after transitions, so its first control takes focus first.
    it('focuses the first control when a screen reader opens it', async () => {
      const user = userEvent.setup();
      renderWithRoot(<App />);
      const opener = screen.getByTestId('Opener');

      for (let cycle = 0; cycle < 2; cycle++) {
        // A virtual cursor moves focus to the button, then clicks it with no
        // pointer behind the click.
        act(() => opener.focus());
        fireEvent.click(opener);
        const close = await screen.findByTestId('ModalCloseButton');

        await waitFor(() => expect(close).toHaveFocus());
        await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
        expect(close).toHaveFocus();

        await user.keyboard('{Escape}');
        await waitFor(() => expect(opener).toHaveFocus());
      }
    });

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
          await act(() => new Promise((resolve) => setTimeout(resolve, 600)));
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
        await act(() => new Promise((resolve) => setTimeout(resolve, 500)));

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
