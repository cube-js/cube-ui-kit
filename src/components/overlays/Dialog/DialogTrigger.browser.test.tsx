import { FocusableRefValue } from '@react-types/shared';
import { useEffect, useRef, useState } from 'react';

import { renderWithRoot, screen, userEvent, waitFor } from '../../../test';
import { Button } from '../../actions/Button';
import { Picker } from '../../fields/Picker';
import { Select } from '../../fields/Select';

import { Dialog } from './Dialog';
import { DialogTrigger } from './DialogTrigger';

/**
 * The focus hand-off from a closing dialog, in a real browser (CUB-3962).
 *
 * The panel-order cases live here rather than in jsdom because that is where
 * jsdom is least trustworthy about them: whether the opened surface's mount
 * effect runs before or after the trigger's restore is decided by real
 * blur/focusin ordering across a real exit animation, and in jsdom the verdict
 * flipped run to run — the same spec caught the bug in `modal` on one run and
 * `popover` on the next. A test that only sometimes detects the regression is
 * worse than no test, so these moved.
 *
 * Both types are covered because they restore through different paths:
 * modal/tray/fullscreen/panel use `DialogTriggerBase`'s own restore, while
 * popovers use `Dialog`'s `FocusScope` (the manual one is a no-op there).
 */

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

describe.each(['popover', 'modal'] as const)(
  'DialogTrigger focus hand-off (type=%s)',
  (type) => {
    function App({ panelFirst }: { panelFirst: boolean }) {
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

    it.each([true, false])(
      'leaves focus on the surface an action opens (panel first: %s)',
      async (panelFirst) => {
        const user = userEvent.setup();

        renderWithRoot(<App panelFirst={panelFirst} />);

        await user.click(screen.getByTestId('Trigger'));
        await screen.findByTestId('Dialog');
        await user.click(screen.getByTestId('Act'));

        const panel = await screen.findByTestId('Panel');

        // Past the trigger's restore and the Dialog FocusScope's unmount
        // restore after the exit animation.
        await new Promise((resolve) => setTimeout(resolve, 600));

        expect(panel).toHaveFocus();
      },
    );

    it('never restores focus to the trigger with shouldRestoreFocus={false}', async () => {
      const user = userEvent.setup();

      renderWithRoot(
        <DialogTrigger type={type} shouldRestoreFocus={false}>
          <Button qa="Trigger">Open</Button>
          {(close: () => void) => (
            <Dialog>
              <Button qa="Act" onPress={close}>
                Close
              </Button>
            </Dialog>
          )}
        </DialogTrigger>,
      );

      await user.click(screen.getByTestId('Trigger'));
      await screen.findByTestId('Dialog');
      await user.click(screen.getByTestId('Act'));

      await new Promise((resolve) => setTimeout(resolve, 600));

      expect(screen.getByTestId('Trigger')).not.toHaveFocus();
    });
  },
);

/**
 * `shouldCloseOnInteractOutside`, in a real browser (CUB-4113).
 *
 * Deliberately a Cube `Button` rather than a plain `<button>`: the prop was
 * shadowed by the automatic `data-popover-dismiss` handling, which only
 * `Button` / `ItemButton` carry, so a plain button never reproduced the bug.
 *
 * In a browser rather than jsdom because the predicate's shape depends on real
 * pointer behaviour: React Aria passes the element the pointer landed on, which
 * for a `Button` is the label inside it, not the `<button>`. jsdom delivers a
 * pointer event straight to the node a test aimed at, so an identity check can
 * pass there and still be wrong in a browser — which is how the matching
 * Storybook story was originally written.
 *
 * Mirrors `Overlays/Dialog / Do Not Close On Click At Particular Element`.
 */
describe('DialogTrigger popover shouldCloseOnInteractOutside', () => {
  const user = userEvent.setup();

  it('keeps the popover open for the guarded element and still presses it', async () => {
    function App() {
      const guardedRef = useRef<FocusableRefValue<HTMLButtonElement>>(null);
      const [pressed, setPressed] = useState(false);

      return (
        <>
          <DialogTrigger
            type="popover"
            shouldCloseOnInteractOutside={(el) =>
              !guardedRef.current?.UNSAFE_getDOMNode()?.contains(el)
            }
          >
            <Button qa="Trigger">Open</Button>
            <Dialog>
              <Button qa="Inside">Inside</Button>
            </Dialog>
          </DialogTrigger>
          <Button
            ref={guardedRef}
            qa="Guarded"
            onPress={() => setPressed(true)}
          >
            {pressed ? 'It works!' : 'Click me!'}
          </Button>
        </>
      );
    }

    renderWithRoot(<App />);

    await user.click(screen.getByTestId('Trigger'));
    await screen.findByTestId('Dialog');

    await user.click(screen.getByText('Click me!'));

    // Settle past the auto-dismiss `setTimeout(0)` and the exit animation, so a
    // close that was only scheduled has had time to land.
    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(screen.getByTestId('Dialog')).toBeInTheDocument();
    expect(screen.getByTestId('Guarded')).toHaveTextContent('It works!');
  });

  it('closes on an outside element the predicate allows', async () => {
    renderWithRoot(
      <>
        <DialogTrigger
          type="popover"
          shouldCloseOnInteractOutside={(el) =>
            !el.closest('[data-qa="Guarded"]')
          }
        >
          <Button qa="Trigger">Open</Button>
          <Dialog>
            <Button qa="Inside">Inside</Button>
          </Dialog>
        </DialogTrigger>
        <Button qa="Plain">Plain</Button>
      </>,
    );

    await user.click(screen.getByTestId('Trigger'));
    await screen.findByTestId('Dialog');

    await user.click(screen.getByTestId('Plain'));

    await waitFor(() =>
      expect(screen.queryByTestId('Dialog')).not.toBeInTheDocument(),
    );
  });
});

/**
 * A closing popup must not swallow the Dialog's `Escape` (CUB-4839).
 *
 * `useOverlay` stops propagation for every `Escape` it sees BEFORE checking
 * whether this overlay is the topmost one allowed to act on it, and our
 * overlays stay mounted through their exit transition. A popup that has just
 * closed therefore used to eat the next `Escape` and do nothing with it, so the
 * Dialog around it stayed open. See `useOverlayEscapeGuard`.
 *
 * In a browser rather than jsdom because the window only exists in real time:
 * jsdom neither runs the exit transition nor keeps focus where the user left
 * it, so the swallow is simply not reachable there.
 *
 * Three swallows had to go for the first case below to pass: the closed
 * popup's own `useOverlay`, focus left on a detaching option, and the
 * trigger's tooltip claiming the key from a document-level listener. Each one
 * alone is enough to keep the Dialog open, so this file guards all three
 * together.
 */
describe('Escape and a closing popup inside a Dialog (CUB-4839)', () => {
  const user = userEvent.setup();

  function SelectApp() {
    return (
      <DialogTrigger type="modal">
        <Button qa="Trigger">Open</Button>
        <Dialog>
          <Select qa="Sel" aria-label="Colour" width="300px">
            <Select.Item key="blue">Blue</Select.Item>
            <Select.Item key="red">Red</Select.Item>
          </Select>
        </Dialog>
      </DialogTrigger>
    );
  }

  function PickerApp() {
    return (
      <DialogTrigger type="modal">
        <Button qa="Trigger">Open</Button>
        <Dialog>
          <Picker qa="Pick" aria-label="Colour" width="300px">
            <Picker.Item key="blue">Blue</Picker.Item>
            <Picker.Item key="red">Red</Picker.Item>
          </Picker>
        </Dialog>
      </DialogTrigger>
    );
  }

  async function openDialog(app: React.ReactElement) {
    renderWithRoot(app);
    await user.click(screen.getByTestId('Trigger'));
    await screen.findByTestId('Dialog');
  }

  it('closes the Dialog on ONE Escape right after a keyboard pick', async () => {
    await openDialog(<SelectApp />);

    screen.getByTestId('Sel').focus();
    await user.keyboard('{Enter}');
    await screen.findByRole('listbox');
    await user.keyboard('{ArrowDown}{Enter}');

    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(screen.queryByTestId('Dialog')).not.toBeInTheDocument(),
    );
  });

  it('closes the Dialog on ONE Escape right after a mouse pick', async () => {
    await openDialog(<SelectApp />);

    await user.click(screen.getByTestId('Sel'));
    await screen.findByRole('listbox');
    await user.click(screen.getAllByRole('option')[0]);

    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(screen.queryByTestId('Dialog')).not.toBeInTheDocument(),
    );
  });

  it('closes the Dialog on ONE Escape right after a Picker pick', async () => {
    await openDialog(<PickerApp />);

    screen.getByTestId('Pick').focus();
    await user.keyboard('{Enter}');
    await screen.findByRole('listbox');
    await user.keyboard('{ArrowDown}{Enter}');

    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(screen.queryByTestId('Dialog')).not.toBeInTheDocument(),
    );
  });

  it('closes the Dialog on Escape with no prior interaction', async () => {
    await openDialog(<SelectApp />);

    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(screen.queryByTestId('Dialog')).not.toBeInTheDocument(),
    );
  });

  // The regression itself: the inner popover is mid-exit when the second
  // Escape arrives, and used to eat it.
  it('closes the Dialog on the Escape after a nested popover was dismissed', async () => {
    renderWithRoot(
      <DialogTrigger type="modal">
        <Button qa="Trigger">Open</Button>
        <Dialog>
          <DialogTrigger type="popover">
            <Button qa="Inner">Inner</Button>
            <Dialog qa="InnerDialog">
              <Button qa="InnerBtn">Act</Button>
            </Dialog>
          </DialogTrigger>
        </Dialog>
      </DialogTrigger>,
    );
    await user.click(screen.getByTestId('Trigger'));
    await screen.findByTestId('Dialog');

    screen.getByTestId('Inner').focus();
    await user.keyboard('{Enter}');
    await screen.findByTestId('InnerDialog');

    await user.keyboard('{Escape}');
    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(screen.queryByTestId('Dialog')).not.toBeInTheDocument(),
    );
  });

  // The other half of the contract. An Escape the popup CAN act on belongs to
  // it alone: letting the key keep travelling, so a CLOSED popup stops eating
  // it, must not turn one press into two closes.
  it('closes only the Select list while the list is open', async () => {
    await openDialog(<SelectApp />);

    screen.getByTestId('Sel').focus();
    await user.keyboard('{Enter}');
    await screen.findByRole('listbox');

    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument(),
    );
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(screen.getByTestId('Dialog')).toBeInTheDocument();
  });

  it('closes only the Picker popover while it is open', async () => {
    await openDialog(<PickerApp />);

    screen.getByTestId('Pick').focus();
    await user.keyboard('{Enter}');
    await screen.findByRole('listbox');

    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument(),
    );
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(screen.getByTestId('Dialog')).toBeInTheDocument();
  });
});
