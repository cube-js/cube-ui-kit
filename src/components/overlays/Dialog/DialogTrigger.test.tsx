import { ClearPressResponder } from '@react-aria/interactions';
import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';

import {
  fireEvent,
  renderWithRoot,
  screen,
  userEvent,
  waitFor,
} from '../../../test';
import { startScreenReader } from '../../../test/screen-reader';
import { Button } from '../../actions/Button';
import { ItemButton } from '../../actions/ItemButton/ItemButton';
import { Content } from '../../content/Content';
import { Header } from '../../content/Header';
import { Title } from '../../content/Title';

import { Dialog } from './Dialog';
import { DialogContainer } from './DialogContainer';
import { DialogTrigger } from './DialogTrigger';

vi.mock('../../../_internal/hooks/use-warn');

describe('<DialogTrigger type="popover" />', () => {
  const user = userEvent.setup({ delay: null });

  const openPopover = async (baseElement: HTMLElement) => {
    await user.click(
      baseElement.querySelector('[data-qa="Trigger"]') as HTMLElement,
    );

    return waitFor(() => {
      const dialog = baseElement.querySelector('[data-qa="Dialog"]');
      expect(dialog).toBeTruthy();
      return dialog as HTMLElement;
    });
  };

  const renderPopover = () =>
    renderWithRoot(
      <DialogTrigger type="popover">
        <Button qa="Trigger">Open</Button>
        <Dialog>
          <Button qa="Inside">Inside</Button>
        </Dialog>
      </DialogTrigger>,
    );

  it('closes on Escape right after opening', async () => {
    const { baseElement } = renderPopover();

    await openPopover(baseElement);

    // No wait: the popover has to be dismissable from the first frame, not
    // only once its enter animation has settled.
    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(baseElement.querySelector('[data-qa="Dialog"]')).toBeNull(),
    );
  });

  it('closes on Escape once the enter animation has settled', async () => {
    const { baseElement } = renderPopover();

    await openPopover(baseElement);
    await new Promise((resolve) => setTimeout(resolve, 400));

    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(baseElement.querySelector('[data-qa="Dialog"]')).toBeNull(),
    );
  });

  it('stays open when Escape is handled inside the popover', async () => {
    const { baseElement } = renderWithRoot(
      <DialogTrigger type="popover">
        <Button qa="Trigger">Open</Button>
        <Dialog>
          <div onKeyDown={(e) => e.stopPropagation()}>
            <Button qa="Inside">Inside</Button>
          </div>
        </Dialog>
      </DialogTrigger>,
    );

    await openPopover(baseElement);

    (baseElement.querySelector('[data-qa="Inside"]') as HTMLElement).focus();
    await user.keyboard('{Escape}');

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(baseElement.querySelector('[data-qa="Dialog"]')).toBeTruthy();
  });
});

// Both types are covered because they restore focus through different paths:
// modal/tray/fullscreen/panel use `DialogTriggerBase`'s own restore, while
// popovers get theirs from `Dialog`'s `<FocusScope restoreFocus>` (the manual
// one is a no-op there — see the comment on it). Only the first path had the
// unconditional-restore bug, but both must honour a hand-off.
describe.each(['popover', 'modal'] as const)(
  'DialogTrigger focus hand-off (type=%s)',
  (type) => {
    const user = userEvent.setup({ delay: null });

    // The "action opens a panel that focuses itself" cases live in
    // `DialogTrigger.browser.test.tsx`. Their verdict depends on real
    // blur/focusin ordering across the exit animation, which jsdom decides
    // differently run to run — the same spec caught the bug in `modal` on one
    // run and `popover` on the next. The synchronous case commits the close
    // before moving focus, so a still-active FocusScope cannot reclaim it.

    it('leaves focus where an action put it', async () => {
      function App() {
        const outsideRef = useRef<HTMLButtonElement>(null);
        const [isOpen, setOpen] = useState(false);

        return (
          <>
            <button ref={outsideRef} type="button" data-qa="Outside">
              Outside
            </button>
            <DialogTrigger type={type} isOpen={isOpen} onOpenChange={setOpen}>
              <Button qa="Trigger">Open</Button>
              <Dialog>
                <Button
                  qa="Act"
                  onPress={() => {
                    flushSync(() => setOpen(false));
                    outsideRef.current?.focus();
                  }}
                >
                  Hand focus off
                </Button>
              </Dialog>
            </DialogTrigger>
          </>
        );
      }

      const { getByTestId, findByTestId } = renderWithRoot(<App />);

      await user.click(getByTestId('Trigger'));
      await findByTestId('Dialog');
      await user.click(getByTestId('Act'));

      await new Promise((resolve) => setTimeout(resolve, 600));

      expect(getByTestId('Outside')).toHaveFocus();
    });

    it('never restores focus to the trigger with shouldRestoreFocus={false}', async () => {
      const { getByTestId, findByTestId } = renderWithRoot(
        <DialogTrigger type={type} shouldRestoreFocus={false}>
          <Button qa="Trigger">Open</Button>
          {(close) => (
            <Dialog>
              <Button qa="Act" onPress={close}>
                Close
              </Button>
            </Dialog>
          )}
        </DialogTrigger>,
      );

      const trigger = getByTestId('Trigger');

      await user.click(trigger);
      await findByTestId('Dialog');
      await user.click(getByTestId('Act'));

      // Past the trigger's restore and the Dialog FocusScope's unmount restore
      // — for popovers the FocusScope is the only one that would have fired.
      await new Promise((resolve) => setTimeout(resolve, 600));

      expect(trigger).not.toHaveFocus();
    });

    it('still restores focus to the trigger when the dialog just closes', async () => {
      const { getByTestId, findByTestId } = renderWithRoot(
        <DialogTrigger type={type}>
          <Button qa="Trigger">Open</Button>
          {(close) => (
            <Dialog>
              <Button qa="Act" onPress={close}>
                Close
              </Button>
            </Dialog>
          )}
        </DialogTrigger>,
      );

      const trigger = getByTestId('Trigger');

      await user.click(trigger);
      await findByTestId('Dialog');
      await user.click(getByTestId('Act'));

      await waitFor(() => expect(trigger).toHaveFocus(), { timeout: 1500 });
    });
  },
);

// A retained popover never unmounts its `FocusScope`, the popover's only
// restore, so `Dialog` restores when it reaches the end of its exit.
describe('DialogTrigger popover hideOnClose focus restore', () => {
  it('returns focus to the trigger on every Escape', async () => {
    const user = userEvent.setup();
    renderWithRoot(
      <DialogTrigger hideOnClose type="popover">
        <Button qa="Trigger">Open</Button>
        <Dialog aria-label="Retained popover">
          <input aria-label="Draft" />
        </Dialog>
      </DialogTrigger>,
    );
    const trigger = screen.getByTestId('Trigger');

    for (let cycle = 0; cycle < 2; cycle++) {
      await user.click(trigger);
      const dialog = await screen.findByRole('dialog');
      await waitFor(() =>
        expect(dialog).toContainElement(document.activeElement as HTMLElement),
      );

      await user.keyboard('{Escape}');
      await waitFor(() => expect(trigger).toHaveFocus());
    }
  });

  it('never restores focus with shouldRestoreFocus={false}', async () => {
    const user = userEvent.setup();
    renderWithRoot(
      <DialogTrigger hideOnClose type="popover" shouldRestoreFocus={false}>
        <Button qa="Trigger">Open</Button>
        <Dialog aria-label="Retained popover">
          <input aria-label="Draft" />
        </Dialog>
      </DialogTrigger>,
    );

    await user.click(screen.getByTestId('Trigger'));
    const dialog = await screen.findByRole('dialog');
    await waitFor(() =>
      expect(dialog).toContainElement(document.activeElement as HTMLElement),
    );
    await user.keyboard('{Escape}');
    // Past the exit, where a retained popover would restore.
    await new Promise((resolve) => setTimeout(resolve, 600));

    expect(screen.getByTestId('Trigger')).not.toHaveFocus();
  });
});

// A popover that is not dismissable does not trap focus, and a retained one
// moves it as one that mounts on every open does. Both ways must match.
describe.each([true, false])(
  'DialogTrigger popover hideOnClose=%s focus parity',
  (hideOnClose) => {
    function Notes({ shouldRestoreFocus }: { shouldRestoreFocus?: boolean }) {
      const [isOpen, setOpen] = useState(false);

      return (
        <>
          <Button qa="Before">Before</Button>
          <DialogTrigger
            type="popover"
            isDismissable={false}
            hideOnClose={hideOnClose}
            shouldRestoreFocus={shouldRestoreFocus}
            isOpen={isOpen}
            onOpenChange={setOpen}
          >
            <Button qa="Opener">Open</Button>
            <Dialog aria-label="Notes" isDismissable={false}>
              <Button qa="First">First</Button>
              <Button qa="Done" onPress={() => setOpen(false)}>
                Done
              </Button>
            </Dialog>
          </DialogTrigger>
          <Button qa="After">After</Button>
        </>
      );
    }

    async function openNotes(user: ReturnType<typeof userEvent.setup>) {
      screen.getByTestId('Opener').focus();
      await user.keyboard('{Enter}');
      const dialog = await screen.findByRole('dialog', { name: 'Notes' });

      await waitFor(() =>
        expect(dialog).toContainElement(document.activeElement as HTMLElement),
      );
    }

    // Beside its opener, not the end of the document, where its portal sits.
    it('tabs out to the controls around its opener', async () => {
      const user = userEvent.setup();
      renderWithRoot(<Notes />);
      const opener = screen.getByTestId('Opener');

      for (let cycle = 0; cycle < 2; cycle++) {
        await openNotes(user);

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

    // The button that opened it goes with the popover it sat in, so focus
    // goes back to that popover's trigger instead.
    it('returns focus to the popover trigger when a button in it opened it', async () => {
      const user = userEvent.setup();

      function Toolbar() {
        const [isPopoverOpen, setPopoverOpen] = useState(false);
        const [isOpen, setOpen] = useState(false);

        return (
          <>
            <DialogTrigger
              type="popover"
              isOpen={isPopoverOpen}
              onOpenChange={setPopoverOpen}
            >
              <Button qa="More">More</Button>
              <Dialog aria-label="Actions">
                <Button
                  qa="Edit"
                  onPress={() => {
                    setPopoverOpen(false);
                    setOpen(true);
                  }}
                >
                  Edit
                </Button>
              </Dialog>
            </DialogTrigger>
            <DialogContainer
              hideOnClose={hideOnClose}
              isOpen={isOpen}
              onDismiss={() => setOpen(false)}
            >
              <Dialog aria-label="Editor">
                <input aria-label="Name" />
              </Dialog>
            </DialogContainer>
          </>
        );
      }

      renderWithRoot(<Toolbar />);
      const more = screen.getByTestId('More');

      for (let cycle = 0; cycle < 2; cycle++) {
        await user.click(more);
        await user.click(await screen.findByTestId('Edit'));
        const editor = await screen.findByRole('dialog', { name: 'Editor' });

        await waitFor(() =>
          expect(editor).toContainElement(
            document.activeElement as HTMLElement,
          ),
        );

        await user.keyboard('{Escape}');
        await waitFor(() => expect(more).toHaveFocus());
      }
    });

    // `FocusScope` takes Tab over only when it restores focus.
    it('leaves Tab to the page with shouldRestoreFocus={false}', async () => {
      const user = userEvent.setup();
      renderWithRoot(<Notes shouldRestoreFocus={false} />);

      await openNotes(user);
      screen.getByTestId('Done').focus();
      await user.tab();

      expect(screen.getByTestId('After')).not.toHaveFocus();
      expect(screen.getByRole('dialog')).not.toContainElement(
        document.activeElement as HTMLElement,
      );
    });

    // Nothing follows its opener, the modal's last control: `FocusScope`
    // then goes back to the opener, which sits in another scope.
    it('tabs back to its opener when nothing in the modal follows it', async () => {
      const user = userEvent.setup();

      function Notebook() {
        const [isOpen, setOpen] = useState(false);

        return (
          <DialogTrigger
            type="popover"
            isDismissable={false}
            hideOnClose={hideOnClose}
            isOpen={isOpen}
            onOpenChange={setOpen}
          >
            <Button qa="Opener">Open</Button>
            <Dialog aria-label="Notes" isDismissable={false}>
              <Button qa="Done" onPress={() => setOpen(false)}>
                Done
              </Button>
            </Dialog>
          </DialogTrigger>
        );
      }

      renderWithRoot(
        <DialogTrigger type="modal" isDismissable={false}>
          <Button qa="Settings">Settings</Button>
          <Dialog aria-label="Settings">
            <Button qa="Inside">Inside</Button>
            <Notebook />
          </Dialog>
        </DialogTrigger>,
      );

      await user.click(screen.getByTestId('Settings'));
      await screen.findByRole('dialog', { name: 'Settings' });
      const opener = screen.getByTestId('Opener');

      for (let cycle = 0; cycle < 2; cycle++) {
        await openNotes(user);

        screen.getByTestId('Done').focus();
        await user.tab();
        expect(opener).toHaveFocus();

        screen.getByTestId('Done').focus();
        await user.keyboard('{Enter}');
        await waitFor(() => expect(opener).toHaveFocus());
      }
    });
  },
);

// CUB-4113: `shouldCloseOnInteractOutside` used to be shadowed by the
// automatic `data-popover-dismiss` handling — every Button/ItemButton outside
// the popover took the auto-dismiss branch, so the caller's predicate was
// never asked and the popover closed regardless of what it would have said.
describe('<DialogTrigger type="popover" shouldCloseOnInteractOutside />', () => {
  const user = userEvent.setup({ delay: null });

  const renderApp = (
    shouldCloseOnInteractOutside: (el: Element) => boolean,
    onGuardedPress?: () => void,
  ) =>
    renderWithRoot(
      <>
        <DialogTrigger
          type="popover"
          shouldCloseOnInteractOutside={shouldCloseOnInteractOutside}
        >
          <Button qa="Trigger">Open</Button>
          <Dialog>
            <Button qa="Inside">Inside</Button>
          </Dialog>
        </DialogTrigger>
        <Button qa="Guarded" onPress={onGuardedPress}>
          Guarded
        </Button>
        <Button qa="Plain">Plain</Button>
      </>,
    );

  const open = async (baseElement: HTMLElement) => {
    await user.click(
      baseElement.querySelector('[data-qa="Trigger"]') as HTMLElement,
    );

    return waitFor(() =>
      expect(baseElement.querySelector('[data-qa="Dialog"]')).toBeTruthy(),
    );
  };

  it('stays open when the predicate vetoes the pressed element', async () => {
    const seen: Element[] = [];
    const onGuardedPress = vi.fn();
    const { baseElement } = renderApp((el) => {
      seen.push(el);

      return !el.closest('[data-qa="Guarded"]');
    }, onGuardedPress);

    await open(baseElement);

    await user.click(
      baseElement.querySelector('[data-qa="Guarded"]') as HTMLElement,
    );

    // Past the auto-dismiss `setTimeout(0)` and the exit animation, so a close
    // that was merely scheduled has had time to land.
    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(seen.length).toBeGreaterThan(0);
    expect(baseElement.querySelector('[data-qa="Dialog"]')).toBeTruthy();
    // Vetoing must not cost the guarded control its click: `useOverlay` only
    // calls `stopPropagation()` when the predicate says to close.
    expect(onGuardedPress).toHaveBeenCalled();
  });

  it('still closes on an element the predicate allows', async () => {
    const { baseElement } = renderApp(
      (el) => !el.closest('[data-qa="Guarded"]'),
    );

    await open(baseElement);

    await user.click(
      baseElement.querySelector('[data-qa="Plain"]') as HTMLElement,
    );

    await waitFor(() =>
      expect(baseElement.querySelector('[data-qa="Dialog"]')).toBeNull(),
    );
  });

  // The predicate is asked before the `data-popover-trigger` lookup, not only
  // for presses outside every trigger. A trigger can own interactive controls —
  // `Picker` / `FilterPicker` / `Select` put a clear button and their custom
  // `actions` inside theirs — and those used to take the "our own trigger, so
  // dismiss" branch without the predicate ever being asked, which cost the
  // control its press.
  //
  // Asserted as "the predicate is consulted": whether the press then reaches
  // the control depends on the trigger also isolating it (`ClearPressResponder`
  // plus a propagation guard), which is the pickers' job and is covered by
  // their own specs.
  it('asks the predicate for a control INSIDE the trigger', async () => {
    const seen: Element[] = [];

    const { baseElement } = renderWithRoot(
      <DialogTrigger
        type="popover"
        shouldCloseOnInteractOutside={(el) => {
          seen.push(el);

          return true;
        }}
      >
        <Button qa="Trigger">
          Open
          <span data-qa="Owned">Owned</span>
        </Button>
        <Dialog>
          <Button qa="Inside">Inside</Button>
        </Dialog>
      </DialogTrigger>,
    );

    await open(baseElement);

    await user.click(
      baseElement.querySelector('[data-qa="Owned"]') as HTMLElement,
    );

    expect(seen.some((el) => el.closest('[data-qa="Owned"]'))).toBe(true);
  });
});

/**
 * A row's `actions` are rendered as a SIBLING of the row (see
 * `ItemActionsWrapper`), so a row that is itself a popover trigger owns
 * controls that live outside its own element. Both halves of "that press
 * belongs to the action, not to the trigger" are the shared run's job: it
 * clears the press context it sits in, and it marks itself so the overlay can
 * tell the trigger's own actions from a press somewhere else on the page.
 */
describe('<DialogTrigger type="popover" /> with an actions row as the trigger', () => {
  const user = userEvent.setup({ delay: null });

  const renderRowTrigger = (onAction: () => void) =>
    renderWithRoot(
      <DialogTrigger type="popover">
        <ItemButton
          qa="Trigger"
          actions={
            <ItemButton.Action qa="RowAction" onPress={onAction}>
              Reset
            </ItemButton.Action>
          }
        >
          Open
        </ItemButton>
        <Dialog>
          <Button qa="Inside">Inside</Button>
        </Dialog>
      </DialogTrigger>,
    );

  it('runs an action without opening the popover', async () => {
    const onAction = vi.fn();
    const { baseElement } = renderRowTrigger(onAction);

    await user.click(
      baseElement.querySelector('[data-qa="RowAction"]') as HTMLElement,
    );

    // Past the open animation, so a popover that was merely scheduled has had
    // time to appear.
    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(baseElement.querySelector('[data-qa="Dialog"]')).toBeNull();
  });

  it('runs an action while the popover is open, and keeps it open', async () => {
    const onAction = vi.fn();
    const { baseElement } = renderRowTrigger(onAction);

    await user.click(
      baseElement.querySelector('[data-qa="Trigger"]') as HTMLElement,
    );
    await waitFor(() =>
      expect(baseElement.querySelector('[data-qa="Dialog"]')).toBeTruthy(),
    );

    await user.click(
      baseElement.querySelector('[data-qa="RowAction"]') as HTMLElement,
    );

    // Past the auto-dismiss `setTimeout(0)` and the exit animation.
    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(baseElement.querySelector('[data-qa="Dialog"]')).toBeTruthy();
  });

  // A popover trigger is often one of the row's actions itself. The run around
  // such a trigger is not its own actions run, so the ordinary toggle has to
  // keep working inside it.
  it('closes when a trigger that LIVES in a run is pressed again', async () => {
    const { baseElement } = renderWithRoot(
      <ItemButton
        qa="Row"
        actions={
          <DialogTrigger type="popover">
            <ItemButton.Action qa="RowTrigger">More</ItemButton.Action>
            <Dialog>
              <Button qa="Inside">Inside</Button>
            </Dialog>
          </DialogTrigger>
        }
      >
        Row
      </ItemButton>,
    );

    await user.click(
      baseElement.querySelector('[data-qa="RowTrigger"]') as HTMLElement,
    );
    await waitFor(() =>
      expect(baseElement.querySelector('[data-qa="Dialog"]')).toBeTruthy(),
    );

    await user.click(
      baseElement.querySelector('[data-qa="RowTrigger"]') as HTMLElement,
    );

    await waitFor(() =>
      expect(baseElement.querySelector('[data-qa="Dialog"]')).toBeNull(),
    );
  });

  it('still dismisses on a press in ANOTHER row’s actions run', async () => {
    const { baseElement } = renderWithRoot(
      <>
        <DialogTrigger type="popover">
          <Button qa="Trigger">Open</Button>
          <Dialog>
            <Button qa="Inside">Inside</Button>
          </Dialog>
        </DialogTrigger>
        <ItemButton
          qa="OtherRow"
          actions={
            <ItemButton.Action qa="OtherAction">Reset</ItemButton.Action>
          }
        >
          Other row
        </ItemButton>
      </>,
    );

    await user.click(
      baseElement.querySelector('[data-qa="Trigger"]') as HTMLElement,
    );
    await waitFor(() =>
      expect(baseElement.querySelector('[data-qa="Dialog"]')).toBeTruthy(),
    );

    await user.click(
      baseElement.querySelector('[data-qa="OtherAction"]') as HTMLElement,
    );

    await waitFor(() =>
      expect(baseElement.querySelector('[data-qa="Dialog"]')).toBeNull(),
    );
  });
});

// `isDismissable={false}` means an outside press neither closes the popover
// nor is consumed by it. Every path that used to close it anyway is covered:
// the auto-dismiss on a `Button`, and a peer popover opening.
describe('<DialogTrigger type="popover" isDismissable={false} />', () => {
  const user = userEvent.setup({ delay: null });

  const renderApp = (onCheckboxChange = vi.fn(), onButtonPress = vi.fn()) =>
    renderWithRoot(
      <>
        <DialogTrigger type="popover" isDismissable={false}>
          <Button qa="Trigger">Open</Button>
          <Dialog>
            <Content>Persistent</Content>
          </Dialog>
        </DialogTrigger>
        <input
          type="checkbox"
          aria-label="Outside checkbox"
          onChange={onCheckboxChange}
        />
        <Button qa="OutsideButton" onPress={onButtonPress}>
          Outside
        </Button>
        <DialogTrigger type="popover">
          <Button qa="PeerTrigger">Peer</Button>
          <Dialog qa="PeerDialog">
            <Content>Peer</Content>
          </Dialog>
        </DialogTrigger>
      </>,
    );

  const open = async (baseElement: HTMLElement) => {
    await user.click(
      baseElement.querySelector('[data-qa="Trigger"]') as HTMLElement,
    );

    return waitFor(() =>
      expect(baseElement.querySelector('[data-qa="Dialog"]')).toBeTruthy(),
    );
  };

  // Past the auto-dismiss `setTimeout(0)`, the EventBus delivery and the exit
  // animation, so a close that was merely scheduled has had time to land.
  const settle = () => new Promise((resolve) => setTimeout(resolve, 500));

  it('lets an outside press reach the control and stays open', async () => {
    const onCheckboxChange = vi.fn();
    const { baseElement } = renderApp(onCheckboxChange);

    await open(baseElement);
    await user.click(screen.getByLabelText('Outside checkbox'));
    await settle();

    expect(onCheckboxChange).toHaveBeenCalledTimes(1);
    expect(baseElement.querySelector('[data-qa="Dialog"]')).toBeTruthy();
  });

  it('stays open when a Button outside it is pressed', async () => {
    const onButtonPress = vi.fn();
    const { baseElement } = renderApp(undefined, onButtonPress);

    await open(baseElement);
    await user.click(
      baseElement.querySelector('[data-qa="OutsideButton"]') as HTMLElement,
    );
    await settle();

    expect(onButtonPress).toHaveBeenCalledTimes(1);
    expect(baseElement.querySelector('[data-qa="Dialog"]')).toBeTruthy();
  });

  it('stays open when another popover opens', async () => {
    const { baseElement } = renderApp();

    await open(baseElement);
    await user.click(
      baseElement.querySelector('[data-qa="PeerTrigger"]') as HTMLElement,
    );
    await waitFor(() =>
      expect(baseElement.querySelector('[data-qa="PeerDialog"]')).toBeTruthy(),
    );
    await settle();

    expect(baseElement.querySelector('[data-qa="Dialog"]')).toBeTruthy();
  });

  // A modal or tray takes over the page: left open, the popover would sit
  // over it, hidden from screen readers, and take its focus restore.
  it.each(['modal', 'tray'] as const)(
    'closes when a %s opens from a Button outside it',
    async (type) => {
      const { baseElement } = renderWithRoot(
        <>
          <DialogTrigger type="popover" isDismissable={false}>
            <Button qa="Trigger">Open</Button>
            <Dialog>
              <Content>Persistent</Content>
            </Dialog>
          </DialogTrigger>
          <DialogTrigger type={type}>
            <Button qa="OverlayTrigger">Take over</Button>
            <Dialog qa="Overlay" aria-label="Overlay">
              <Content>Over the page</Content>
            </Dialog>
          </DialogTrigger>
        </>,
      );

      await open(baseElement);
      await user.click(
        baseElement.querySelector('[data-qa="OverlayTrigger"]') as HTMLElement,
      );

      await waitFor(() =>
        expect(baseElement.querySelector('[data-qa="Overlay"]')).toBeTruthy(),
      );
      await waitFor(() =>
        expect(baseElement.querySelector('[data-qa="Dialog"]')).toBeNull(),
      );
    },
  );

  // Closing it would unmount the modal opened from inside it.
  it('stays open when a modal opens from inside it', async () => {
    const { baseElement } = renderWithRoot(
      <DialogTrigger type="popover" isDismissable={false}>
        <Button qa="Trigger">Open</Button>
        <Dialog>
          {/* Keeps the inner Button's press from closing the popover. */}
          <Content data-popover-keep="">
            <DialogTrigger>
              <Button qa="OverlayTrigger">Details</Button>
              <Dialog qa="Overlay" aria-label="Details">
                <Content>Details</Content>
              </Dialog>
            </DialogTrigger>
          </Content>
        </Dialog>
      </DialogTrigger>,
    );

    await open(baseElement);
    await user.click(
      baseElement.querySelector('[data-qa="OverlayTrigger"]') as HTMLElement,
    );
    await waitFor(() =>
      expect(baseElement.querySelector('[data-qa="Overlay"]')).toBeTruthy(),
    );
    await settle();

    expect(baseElement.querySelector('[data-qa="Dialog"]')).toBeTruthy();
    expect(baseElement.querySelector('[data-qa="Overlay"]')).toBeTruthy();
  });

  it('still closes from an explicit action inside it', async () => {
    const { baseElement } = renderWithRoot(
      <DialogTrigger type="popover" isDismissable={false}>
        <Button qa="Trigger">Open</Button>
        {(close) => (
          <Dialog>
            <Button qa="Close" onPress={close}>
              Close
            </Button>
          </Dialog>
        )}
      </DialogTrigger>,
    );

    await open(baseElement);
    await user.click(
      baseElement.querySelector('[data-qa="Close"]') as HTMLElement,
    );

    await waitFor(() =>
      expect(baseElement.querySelector('[data-qa="Dialog"]')).toBeNull(),
    );
  });
});

// A popover anchored elsewhere through `targetRef` closes when that anchor
// scrolls away, the same as one anchored to its trigger.
describe('<DialogTrigger type="popover" targetRef /> on scroll', () => {
  const user = userEvent.setup({ delay: null });

  // `keepOpenOnScroll` is read by the popover but is not one of the typed
  // props, hence the spread.
  function App(props: { keepOpenOnScroll?: boolean }) {
    const anchorRef = useRef<HTMLDivElement>(null);

    return (
      <>
        <div data-qa="Scroller" style={{ overflow: 'auto', height: 100 }}>
          <div ref={anchorRef} style={{ height: 300 }}>
            Anchor
          </div>
        </div>
        <DialogTrigger type="popover" targetRef={anchorRef} {...props}>
          <Button qa="Trigger">Open</Button>
          <Dialog>
            <Content>Anchored</Content>
          </Dialog>
        </DialogTrigger>
      </>
    );
  }

  const openAndScroll = async (baseElement: HTMLElement) => {
    await user.click(
      baseElement.querySelector('[data-qa="Trigger"]') as HTMLElement,
    );
    await waitFor(() =>
      expect(baseElement.querySelector('[data-qa="Dialog"]')).toBeTruthy(),
    );

    fireEvent.scroll(
      baseElement.querySelector('[data-qa="Scroller"]') as HTMLElement,
    );
  };

  it('closes when the anchor scrolls', async () => {
    const { baseElement } = renderWithRoot(<App />);

    await openAndScroll(baseElement);

    await waitFor(() =>
      expect(baseElement.querySelector('[data-qa="Dialog"]')).toBeNull(),
    );
  });

  it('stays open with keepOpenOnScroll', async () => {
    const { baseElement } = renderWithRoot(<App keepOpenOnScroll />);

    await openAndScroll(baseElement);
    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(baseElement.querySelector('[data-qa="Dialog"]')).toBeTruthy();
  });
});

describe('<DialogTrigger /> with a screen reader', () => {
  it('speaks the dialog by its title, and the trigger again once it closes', async () => {
    renderWithRoot(
      <DialogTrigger>
        <Button>Rename</Button>
        <Dialog>
          <Header>
            <Title>Rename file</Title>
          </Header>
          <Content>Pick a new name</Content>
        </Dialog>
      </DialogTrigger>,
    );
    const reader = await startScreenReader();

    await reader.press('Tab');
    await reader.press('Enter');
    await waitFor(async () =>
      expect(await reader.lastSpokenPhrase()).toBe('dialog, Rename file'),
    );

    // `Dialog` asks for an `h2` title through its slot.
    expect(
      screen.getByRole('heading', { level: 2, name: 'Rename file' }),
    ).toBeInTheDocument();

    await reader.press('Escape');
    await waitFor(async () =>
      expect(await reader.lastSpokenPhrase()).toBe('button, Rename'),
    );
  });
});
