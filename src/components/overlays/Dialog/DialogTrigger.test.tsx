import { useRef, useState } from 'react';

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

    // The "action opens a panel that focuses itself" cases live in
    // `DialogTrigger.browser.test.tsx`. Their verdict depends on real
    // blur/focusin ordering across the exit animation, which jsdom decides
    // differently run to run — the same spec caught the bug in `modal` on one
    // run and `popover` on the next. What stays here is deterministic in
    // jsdom: focus moved synchronously inside the action's own handler.

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
});
