import { useState } from 'react';
import { userEvent as browserUserEvent, page } from 'vitest/browser';

import { renderWithRoot, screen, waitFor } from '../../../test';
import { Button } from '../../actions/Button/Button';
import { Menu, MenuTrigger } from '../../actions/Menu';
import { Content } from '../../content/Content';
import { TextInput } from '../../fields/TextInput';

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
 * case runs both ways, and both must match. Real keyboard Tab order, hit
 * testing and hidden content need a browser.
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

  it('returns focus to the menu trigger when a menu item opened it', async () => {
    function App() {
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

    renderWithRoot(<App />);
    const trigger = screen.getByTestId('Actions');

    for (let cycle = 0; cycle < 2; cycle++) {
      await openWithKeyboard(trigger);
      const item = await screen.findByRole('menuitem', { name: 'Rename' });

      await waitFor(() => expect(item).toHaveFocus());
      await browserUserEvent.keyboard('{Enter}');
      await waitForFocusIn('Rename');

      await browserUserEvent.keyboard('{Escape}');
      await waitFor(() => expect(trigger).toHaveFocus());
    }
  });

  // Neither traps focus: Tab leaves for the page beside the opener, not for
  // the end of the document, where the dialog's portal sits.
  it.each(['panel', 'popover'] as const)(
    'tabs out of a %s to the controls around its opener',
    async (kind) => {
      function App() {
        const [isOpen, setOpen] = useState(false);
        const dialog = (
          <Dialog aria-label="Notes" isDismissable={false}>
            <Button qa="First">First</Button>
            <Button qa="Done" onPress={() => setOpen(false)}>
              Done
            </Button>
          </Dialog>
        );

        return (
          <>
            <Button qa="Before">Before</Button>
            {kind === 'panel' ? (
              <>
                <Button qa="Opener" onPress={() => setOpen(true)}>
                  Open
                </Button>
                <DialogContainer
                  type="panel"
                  hideOnClose={hideOnClose}
                  isOpen={isOpen}
                  onDismiss={() => setOpen(false)}
                >
                  {dialog}
                </DialogContainer>
              </>
            ) : (
              <DialogTrigger
                type="popover"
                isDismissable={false}
                hideOnClose={hideOnClose}
                isOpen={isOpen}
                onOpenChange={setOpen}
              >
                <Button qa="Opener">Open</Button>
                {dialog}
              </DialogTrigger>
            )}
            <Button qa="After">After</Button>
          </>
        );
      }

      renderWithRoot(<App />);
      const opener = screen.getByTestId('Opener');

      for (let cycle = 0; cycle < 2; cycle++) {
        await openWithKeyboard(opener);
        await waitForFocusIn('Notes');

        screen.getByTestId('Done').focus();
        await browserUserEvent.tab();
        expect(screen.getByTestId('After')).toHaveFocus();

        screen.getByTestId('First').focus();
        await browserUserEvent.tab({ shift: true });
        expect(screen.getByTestId('Before')).toHaveFocus();

        screen.getByTestId('Done').focus();
        await browserUserEvent.keyboard('{Enter}');
        await waitFor(() => expect(opener).toHaveFocus());
      }
    },
  );

  // A wizard step that hands over to the next: the second dialog's opener is
  // in the first, which is closed and hidden by the time the second closes.
  it('returns focus to the opener when a dialog opened from it closes', async () => {
    function App() {
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

    renderWithRoot(<App />);
    const opener = screen.getByTestId('Opener');

    for (let cycle = 0; cycle < 2; cycle++) {
      await openWithKeyboard(opener);
      await waitForFocusIn('Step 1');

      await openWithKeyboard(screen.getByTestId('Next'));
      await waitForFocusIn('Step 2');
      // Past step 1's exit, so its content is hidden.
      await new Promise((resolve) => setTimeout(resolve, 500));

      await browserUserEvent.keyboard('{Escape}');
      await waitFor(() => expect(opener).toHaveFocus());
    }
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
