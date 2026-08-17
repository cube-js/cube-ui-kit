import { useEffect, useRef, useState } from 'react';

import { renderWithRoot, userEvent, waitFor } from '../../../test';
import { Button } from '../../actions/Button';

import { Dialog } from './Dialog';
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

    // A surface opened by a dialog action: takes focus on its own container
    // with a single `focus()` from a mount effect, no retry loop.
    function Panel() {
      const ref = useRef<HTMLDivElement>(null);

      useEffect(() => {
        ref.current?.focus({ preventScroll: true });
      }, []);

      return (
        <div ref={ref} tabIndex={-1} data-qa="Panel">
          <button type="button">Close</button>
          Panel content
        </div>
      );
    }

    // `panelFirst` controls whether the panel mounts before or after the
    // trigger in tree order, which decides whether its mount effect runs
    // before or after the trigger's restore. Both orders must hand off — the
    // old unconditional restore only lost the race in one of them, which is
    // exactly what made this bug look intermittent.
    function renderCase(panelFirst: boolean) {
      function App() {
        const [isPanelOpen, setPanelOpen] = useState(false);
        const [isOpen, setOpen] = useState(false);

        const dialog = (
          <DialogTrigger type={type} isOpen={isOpen} onOpenChange={setOpen}>
            <Button qa="Trigger">Open</Button>
            <Dialog>
              <Button
                qa="Act"
                onPress={() => {
                  setOpen(false);
                  setPanelOpen(true);
                }}
              >
                Open panel
              </Button>
            </Dialog>
          </DialogTrigger>
        );

        return (
          <>
            {panelFirst && isPanelOpen ? <Panel /> : null}
            {dialog}
            {!panelFirst && isPanelOpen ? <Panel /> : null}
          </>
        );
      }

      return renderWithRoot(<App />);
    }

    // Deterministic form of the same rule: the action moves focus to an
    // element that already exists, synchronously inside its own handler, so
    // focus is provably outside the dialog by the time the trigger's restore
    // effect runs. No effect-ordering luck involved — this is the case that
    // fails on every run without the guard.
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
                    setOpen(false);
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

    it.each([true, false])(
      'leaves focus on the surface an action opens (panel first: %s)',
      async (panelFirst) => {
        const { getByTestId, findByTestId } = renderCase(panelFirst);

        await user.click(getByTestId('Trigger'));
        await findByTestId('Dialog');
        await user.click(getByTestId('Act'));

        const panel = await findByTestId('Panel');

        // Past the trigger's own restore and the Dialog FocusScope's unmount
        // restore after the ~350ms exit animation.
        await new Promise((resolve) => setTimeout(resolve, 600));

        expect(panel).toHaveFocus();
      },
    );

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
