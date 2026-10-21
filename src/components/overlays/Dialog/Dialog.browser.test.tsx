import { setInteractionModality } from '@react-aria/interactions';
import { useState } from 'react';
import { userEvent as browserUserEvent, page } from 'vitest/browser';

import { renderWithRoot, screen, wait, waitFor } from '../../../test';
import { Button } from '../../actions/Button/Button';
import { Menu, MenuTrigger } from '../../actions/Menu';
import { Content } from '../../content/Content';
import { TextInput } from '../../fields/TextInput';
import { AlertDialog } from '../AlertDialog';

import { Dialog } from './Dialog';
import { DialogContainer } from './DialogContainer';
import { DialogTrigger } from './DialogTrigger';

/**
 * `Dialog` sizes itself with a three-value tasty shorthand that compiles to
 * `min-width` / `width` / `max-width`. CSS resolves `min-width` AFTER
 * `max-width`, so a floor larger than the ceiling wins and the dialog overflows
 * the viewport it was supposed to fit inside.
 *
 * That is exactly what `$min-dialog-size` used to do: it was computed from
 * `100vw - 2x` while every consumer's max-width uses `100dvw - 8x`, so below
 * ~352px the two crossed over and no dialog in the library fit. The Excel /
 * Sheets task pane is 300-350px wide, which is the whole of its viewport.
 *
 * jsdom cannot see this — it resolves no custom properties and lays nothing out,
 * so the floor-beats-ceiling behaviour is invisible there. It needs a real
 * browser at a real narrow viewport.
 */
describe('Dialog width at a narrow viewport', () => {
  const NARROW = 300;

  afterEach(async () => {
    // Other specs in this project assume the default 414x896.
    await page.viewport(414, 896);
  });

  it('fits inside a 300px viewport instead of overflowing it', async () => {
    await page.viewport(NARROW, 700);

    renderWithRoot(
      <DialogContainer isOpen onDismiss={() => {}}>
        <Dialog>
          <Content>Narrow</Content>
        </Dialog>
      </DialogContainer>,
    );

    const dialog = await screen.findByTestId('Dialog');

    await waitFor(() => {
      expect(dialog.getBoundingClientRect().width).toBeGreaterThan(0);
    });

    const width = dialog.getBoundingClientRect().width;
    const styles = getComputedStyle(dialog);

    // The floor must never exceed the ceiling, whatever the viewport.
    expect(parseFloat(styles.minWidth)).toBeLessThanOrEqual(
      parseFloat(styles.maxWidth),
    );

    // …and the rendered dialog therefore stays inside the viewport.
    expect(width).toBeLessThanOrEqual(NARROW);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(NARROW);
  });

  it('is unaffected at a wide viewport', async () => {
    await page.viewport(1280, 900);

    renderWithRoot(
      <DialogContainer isOpen onDismiss={() => {}}>
        <Dialog>
          <Content>Wide</Content>
        </Dialog>
      </DialogContainer>,
    );

    const dialog = await screen.findByTestId('Dialog');

    await waitFor(() => {
      expect(dialog.getBoundingClientRect().width).toBeGreaterThan(0);
    });

    // `min(288px, 100dvw - 8x)` still resolves to the 288px branch here, so the
    // floor is the same one the token has always applied away from the crossover.
    expect(parseFloat(getComputedStyle(dialog).minWidth)).toBe(288);
  });
});

/**
 * `Dialog`'s gutters are declared as custom properties on the dialog root, and
 * consumers are documented to read them so one child can span the full dialog
 * width while its siblings keep the gutter (see Dialog.docs.mdx, "Padding
 * Tokens").
 *
 * The failure mode this guards is silent: rename either property, or move the
 * declaration off the dialog root, and the consumer's inset resolves to nothing
 * at all. No error, no visual break in the dialog itself — just a surface
 * somewhere else quietly losing its padding. These assertions turn that into a
 * failing test.
 *
 * jsdom resolves no custom properties, so this has to run in a real browser.
 */
describe('Dialog padding tokens', () => {
  const TOKENS = [
    '--dialog-padding-h',
    '--dialog-content-padding-v',
    '--dialog-title-padding-v',
    '--dialog-footer-v',
  ];

  it('exposes the documented gutters to descendants', async () => {
    renderWithRoot(
      <DialogContainer isOpen onDismiss={() => {}}>
        <Dialog>
          <Content qa="TokenProbe">
            {TOKENS.map((token) => (
              <div
                key={token}
                data-qa={token}
                // Consuming the token is the assertion: a custom property read
                // back with `getPropertyValue` returns its unresolved tasty
                // expression, which says nothing about whether it resolves.
                style={{ marginLeft: `var(${token})` }}
              />
            ))}
          </Content>
        </Dialog>
      </DialogContainer>,
    );

    await screen.findByTestId('TokenProbe');

    for (const token of TOKENS) {
      const probe = await screen.findByTestId(token);
      const inset = parseFloat(getComputedStyle(probe).marginLeft);

      expect(
        inset,
        `${token} must resolve to a length inside the dialog`,
      ).toBeGreaterThan(0);
    }
  });

  it('lets a slot take back its horizontal padding without losing the rest', async () => {
    renderWithRoot(
      <DialogContainer isOpen onDismiss={() => {}}>
        <Dialog>
          <Content
            qa="EdgeToEdge"
            styles={{ padding: '$dialog-content-padding-v 0' }}
          >
            Edge to edge
          </Content>
        </Dialog>
      </DialogContainer>,
    );

    const content = await screen.findByTestId('EdgeToEdge');
    const styles = getComputedStyle(content);

    expect(parseFloat(styles.paddingLeft)).toBe(0);
    expect(parseFloat(styles.paddingRight)).toBe(0);
    // The vertical padding still comes from the token…
    expect(parseFloat(styles.paddingTop)).toBeGreaterThan(0);
    // …and the slot's own non-padding styles survive the merge.
    expect(styles.flexGrow).toBe('1');
    expect(styles.overflowY).toBe('auto');
  });
});

/**
 * A dialog contains focus from the frame it opens in, not only once its enter
 * transition has ended. A Tab pressed while it is still entering used to move
 * focus to the page behind the modal, and nothing pulled it back.
 *
 * In a browser for the real Tab: the escape is the browser's own default
 * action, which only React Aria's containment listener prevents. Animation
 * frames are held so the dialog stays in its enter phase (`DisplayTransition`
 * moves on to `entered` on the second frame) for as long as the test needs.
 */
describe('Dialog focus containment while it enters', () => {
  beforeEach(() => {
    let id = 0;

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => ++id);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function openWithKeyboard() {
    renderWithRoot(
      <DialogTrigger>
        <Button qa="Trigger">Open</Button>
        <Dialog aria-label="Entering">
          <Button qa="First">First</Button>
          <Button qa="Last">Last</Button>
        </Dialog>
      </DialogTrigger>,
    );

    screen.getByTestId('Trigger').focus();
    await browserUserEvent.keyboard('{Enter}');

    const dialog = await screen.findByTestId('Dialog');

    await waitFor(() =>
      expect(dialog).toContainElement(document.activeElement as HTMLElement),
    );
    expect(screen.getByTestId('Modal')).toHaveAttribute('data-enter');

    return dialog;
  }

  it('keeps Shift+Tab inside a modal that is still entering', async () => {
    const dialog = await openWithKeyboard();

    await browserUserEvent.tab({ shift: true });

    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });

  it('keeps Tab inside it from the last control', async () => {
    const dialog = await openWithKeyboard();

    screen.getByTestId('Last').focus();
    await browserUserEvent.tab();

    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });

  it('still returns focus to the trigger when it closes while entering', async () => {
    await openWithKeyboard();

    await browserUserEvent.keyboard('{Escape}');

    await waitFor(() => expect(screen.getByTestId('Trigger')).toHaveFocus());
  });
});

/**
 * A retained dialog (`hideOnClose`) restores focus and moves it in itself, as
 * its `FocusScope` never unmounts. Two parts of that only a browser shows:
 * Chromium blurs a focused button the moment it is disabled, which jsdom does
 * not, and only a browser scrolls an element into view when it is focused.
 */
describe('DialogContainer hideOnClose focus in a browser', () => {
  it('returns focus to an opener disabled while the dialog is open', async () => {
    function App() {
      const [isOpen, setOpen] = useState(false);

      return (
        <>
          <Button qa="Opener" isDisabled={isOpen} onPress={() => setOpen(true)}>
            Open
          </Button>
          <DialogContainer
            hideOnClose
            isOpen={isOpen}
            onDismiss={() => setOpen(false)}
          >
            <Dialog aria-label="Busy">
              <input aria-label="Draft" />
            </Dialog>
          </DialogContainer>
        </>
      );
    }

    renderWithRoot(<App />);
    const opener = screen.getByTestId('Opener');

    for (let cycle = 0; cycle < 2; cycle++) {
      opener.focus();
      await browserUserEvent.keyboard('{Enter}');

      const dialog = await screen.findByTestId('Dialog');

      await waitFor(() =>
        expect(dialog).toContainElement(document.activeElement as HTMLElement),
      );

      await browserUserEvent.keyboard('{Escape}');
      await waitFor(() => expect(opener).toHaveFocus());
    }
  });

  // Non-dismissable, as `Layout.Panel`'s dialog mode renders it.
  it('keeps its scroll position when it reopens', async () => {
    function App() {
      const [isOpen, setOpen] = useState(false);

      return (
        <>
          <Button qa="Opener" onPress={() => setOpen(true)}>
            Open
          </Button>
          <DialogContainer
            hideOnClose
            isOpen={isOpen}
            onDismiss={() => setOpen(false)}
          >
            <Dialog aria-label="Chat" isDismissable={false}>
              <div data-qa="Messages" style={{ height: 160, overflow: 'auto' }}>
                {Array.from({ length: 40 }, (_, index) => (
                  <div key={index} style={{ height: 40 }}>
                    <button type="button">Copy {index}</button>
                  </div>
                ))}
              </div>
              <input aria-label="Composer" />
            </Dialog>
          </DialogContainer>
        </>
      );
    }

    renderWithRoot(<App />);
    const opener = screen.getByTestId('Opener');

    opener.focus();
    await browserUserEvent.keyboard('{Enter}');

    const messages = await screen.findByTestId('Messages');
    const composer = screen.getByLabelText('Composer');

    await waitFor(() =>
      expect(screen.getByTestId('Dialog')).toContainElement(
        document.activeElement as HTMLElement,
      ),
    );
    messages.scrollTop = messages.scrollHeight;
    composer.focus();

    const scrollTop = messages.scrollTop;

    expect(scrollTop).toBeGreaterThan(0);

    await browserUserEvent.keyboard('{Escape}');
    await waitFor(() => expect(opener).toHaveFocus());

    await browserUserEvent.keyboard('{Enter}');
    // As on its first open, the dialog focuses itself, which scrolls nothing.
    await waitFor(() => expect(screen.getByTestId('Dialog')).toHaveFocus());

    expect(messages.scrollTop).toBe(scrollTop);
  });

  it('scrolls an autofocused field below the fold into view on every open', async () => {
    function App() {
      const [isOpen, setOpen] = useState(false);

      return (
        <>
          <Button qa="Opener" onPress={() => setOpen(true)}>
            Open
          </Button>
          <DialogContainer
            hideOnClose
            isOpen={isOpen}
            onDismiss={() => setOpen(false)}
          >
            <Dialog aria-label="Chat">
              <Content qa="Messages">
                {Array.from({ length: 40 }, (_, index) => (
                  <div key={index} style={{ height: 40 }}>
                    Message {index}
                  </div>
                ))}
                {/* oxlint-disable-next-line jsx-a11y/no-autofocus -- the case under test */}
                <TextInput autoFocus aria-label="Composer" />
              </Content>
            </Dialog>
          </DialogContainer>
        </>
      );
    }

    renderWithRoot(<App />);
    const opener = screen.getByTestId('Opener');

    for (let cycle = 0; cycle < 2; cycle++) {
      opener.focus();
      await browserUserEvent.keyboard('{Enter}');

      const composer = await screen.findByRole('textbox', { name: 'Composer' });

      await waitFor(() => expect(composer).toHaveFocus());

      const messages = screen.getByTestId('Messages');
      const box = messages.getBoundingClientRect();
      const rect = composer.getBoundingClientRect();

      expect(messages.scrollTop).toBeGreaterThan(0);
      expect(rect.top).toBeGreaterThanOrEqual(box.top - 1);
      expect(rect.bottom).toBeLessThanOrEqual(box.bottom + 1);

      // Back to the top, so the next open has to scroll the field in again.
      messages.scrollTop = 0;
      await browserUserEvent.keyboard('{Escape}');
      await waitFor(() => expect(opener).toHaveFocus());
    }
  });
});

/**
 * A retained dialog moves focus as one that mounts on every open does. Each
 * case runs both ways, and both must match. Hit testing and transition timing
 * need a browser.
 */
describe.each([true, false])('hideOnClose=%s focus parity', (hideOnClose) => {
  async function openWithKeyboard(opener: HTMLElement) {
    opener.focus();
    await browserUserEvent.keyboard('{Enter}');
  }

  async function waitForFocusIn(name: string) {
    const dialog = await screen.findByRole('dialog', { name });

    await waitFor(() =>
      expect(dialog).toContainElement(document.activeElement as HTMLElement),
    );

    return dialog;
  }

  // A screen reader's virtual cursor: `focusSafely` focuses the dialog itself
  // once the open transition ends. A retained dialog plays one on every open,
  // and nothing takes focus meanwhile, not even a destructive button when
  // nothing else can take it first.
  it.each(['dialog', 'alertdialog'] as const)(
    'focuses the %s itself when a screen reader opens it',
    async (role) => {
      let setOpen = (isOpen: boolean) => void isOpen;

      function App() {
        const [isOpen, setIsOpen] = useState(false);

        setOpen = setIsOpen;

        return (
          <>
            <Button qa="Opener">Open</Button>
            <DialogContainer
              hideOnClose={hideOnClose}
              isOpen={isOpen}
              onDismiss={() => setIsOpen(false)}
            >
              {role === 'dialog' ? (
                <Dialog aria-label="Settings">
                  <input aria-label="Name" />
                </Dialog>
              ) : (
                <AlertDialog
                  danger
                  title="Settings"
                  content="Delete the report?"
                  actions={{ confirm: { label: 'Delete' }, cancel: false }}
                />
              )}
            </DialogContainer>
          </>
        );
      }

      renderWithRoot(<App />);
      const opener = screen.getByTestId('Opener');

      for (let cycle = 0; cycle < 2; cycle++) {
        opener.focus();
        setInteractionModality('virtual');
        setOpen(true);
        const dialog = await screen.findByRole(role);

        await waitFor(() => expect(dialog).toHaveFocus());
        await wait(300);
        expect(dialog).toHaveFocus();

        setOpen(false);
        await waitFor(() => expect(opener).toHaveFocus());
        await wait(400);
      }
    },
  );

  // The closing menu returns focus to its trigger meanwhile.
  it('focuses the dialog itself when a screen reader opens it from a menu', async () => {
    let close = () => {};

    function Actions() {
      const [isOpen, setOpen] = useState(false);

      close = () => setOpen(false);

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
            <Dialog aria-label="Rename" isDismissable={false}>
              <input aria-label="Name" />
            </Dialog>
          </DialogContainer>
        </>
      );
    }

    renderWithRoot(<Actions />);
    const trigger = screen.getByTestId('Actions');

    for (let cycle = 0; cycle < 2; cycle++) {
      // A virtual cursor clicks with no pointer behind the click.
      trigger.focus();
      setInteractionModality('virtual');
      trigger.click();
      const item = await screen.findByRole('menuitem', { name: 'Rename' });

      await wait(400);
      setInteractionModality('virtual');
      item.click();
      const dialog = await screen.findByRole('dialog', { name: 'Rename' });

      await waitFor(() => expect(dialog).toHaveFocus());
      await wait(300);
      expect(dialog).toHaveFocus();

      close();
      await waitFor(() => expect(trigger).toHaveFocus());
      await wait(400);
    }
  });

  // The closing popover restores focus to its trigger a frame after it goes.
  it.each(['modal', 'panel'] as const)(
    'keeps focus in a %s opened from a button in a popover',
    async (type) => {
      function Toolbar() {
        const [isOpen, setOpen] = useState(false);

        return (
          <>
            <DialogTrigger type="popover">
              <Button qa="More">More</Button>
              <Dialog aria-label="Actions">
                <Button qa="Rename" onPress={() => setOpen(true)}>
                  Rename
                </Button>
              </Dialog>
            </DialogTrigger>
            <DialogContainer
              type={type}
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

      renderWithRoot(<Toolbar />);
      const more = screen.getByTestId('More');

      for (let cycle = 0; cycle < 2; cycle++) {
        await openWithKeyboard(more);
        await openWithKeyboard(await screen.findByTestId('Rename'));
        const dialog = await waitForFocusIn('Rename');

        await wait(400);
        expect(dialog).toContainElement(document.activeElement as HTMLElement);

        await browserUserEvent.keyboard('{Escape}');
        await waitFor(() => expect(dialog).not.toBeVisible());
        await wait(400);
      }
    },
  );

  // Reopened while it still slides out: closing it again restores to its own
  // trigger, as for any popover.
  it('returns focus to a popover trigger when it reopens over a panel opened from it', async () => {
    function Toolbar() {
      const [isOpen, setOpen] = useState(false);

      return (
        <>
          <DialogTrigger type="popover">
            <Button qa="More">More</Button>
            <Dialog aria-label="Actions">
              <Button qa="Rename" onPress={() => setOpen(true)}>
                Rename
              </Button>
            </Dialog>
          </DialogTrigger>
          <DialogContainer
            type="panel"
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

    renderWithRoot(<Toolbar />);
    const more = screen.getByTestId('More');

    await openWithKeyboard(more);
    await openWithKeyboard(await screen.findByTestId('Rename'));
    await wait(150);
    await openWithKeyboard(more);
    await wait(150);
    await browserUserEvent.keyboard('{Escape}');
    await waitFor(() => expect(more).toHaveFocus());
    await wait(800);
    expect(more).toHaveFocus();
  });

  // Both mounted with the page, so `FocusScope` restores both to `<body>`:
  // only the one focus was in takes that restore.
  it('returns focus to the opener of the panel focus was in when two unmount', async () => {
    let hide = () => {};

    function App() {
      const [isAOpen, setAOpen] = useState(false);
      const [isBOpen, setBOpen] = useState(false);
      const [isShown, setShown] = useState(true);

      hide = () => setShown(false);

      return (
        <>
          <Button qa="OpenA" onPress={() => setAOpen(true)}>
            A
          </Button>
          <Button qa="OpenB" onPress={() => setBOpen(true)}>
            B
          </Button>
          {isShown
            ? (['A', 'B'] as const).map((name) => (
                <DialogContainer
                  key={name}
                  type="panel"
                  hideOnClose={hideOnClose}
                  isOpen={name === 'A' ? isAOpen : isBOpen}
                  onDismiss={() =>
                    name === 'A' ? setAOpen(false) : setBOpen(false)
                  }
                >
                  <Dialog aria-label={name} isDismissable={false}>
                    <input aria-label={`Field ${name}`} data-qa={name} />
                  </Dialog>
                </DialogContainer>
              ))
            : null}
        </>
      );
    }

    renderWithRoot(<App />);
    await wait(600);

    for (const name of ['A', 'B']) {
      const opener = screen.getByTestId(`Open${name}`);

      await openWithKeyboard(opener);
      await wait(400);
    }

    screen.getByTestId('A').focus();
    hide();
    await wait(200);
    expect(screen.getByTestId('OpenA')).toHaveFocus();
  });

  it('opens a dialog nested in another one above it', async () => {
    function App() {
      const [isOpen, setOpen] = useState(false);
      const [isNestedOpen, setNestedOpen] = useState(false);

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
            <Dialog aria-label="Settings">
              <Button qa="OpenNested" onPress={() => setNestedOpen(true)}>
                Delete…
              </Button>
              <DialogContainer
                hideOnClose={hideOnClose}
                isOpen={isNestedOpen}
                onDismiss={() => setNestedOpen(false)}
              >
                <Dialog aria-label="Delete" size="S">
                  <Button qa="Cancel">Cancel</Button>
                </Dialog>
              </DialogContainer>
            </Dialog>
          </DialogContainer>
        </>
      );
    }

    renderWithRoot(<App />);
    const opener = screen.getByTestId('Opener');

    for (let cycle = 0; cycle < 2; cycle++) {
      await openWithKeyboard(opener);
      await waitForFocusIn('Settings');

      await openWithKeyboard(screen.getByTestId('OpenNested'));
      const nested = await waitForFocusIn('Delete');
      const box = nested.getBoundingClientRect();
      const hit = document.elementFromPoint(
        box.left + box.width / 2,
        box.top + box.height / 2,
      );

      expect(nested).toContainElement(hit as HTMLElement);

      await browserUserEvent.keyboard('{Escape}');
      await waitFor(() =>
        expect(screen.getByTestId('OpenNested')).toHaveFocus(),
      );
      await browserUserEvent.keyboard('{Escape}');
      await waitFor(() => expect(opener).toHaveFocus());
    }
  });
});
