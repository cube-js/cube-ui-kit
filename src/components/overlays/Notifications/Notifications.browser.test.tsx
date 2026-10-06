import { page } from 'vitest/browser';

import { renderWithRoot, screen, userEvent, waitFor } from '../../../test';
import { Button } from '../../actions/Button';
import { ItemAction } from '../../actions/ItemAction';
import { Dialog } from '../Dialog/Dialog';
import { DialogTrigger } from '../Dialog/DialogTrigger';
import { useToast } from '../Toast/useToast';

import { NotificationAction } from './NotificationAction';
import { useNotifications } from './use-notifications';

/**
 * A press on a toast or notification must not close the Dialog it shows over.
 *
 * Both are portaled outside the Dialog, so React Aria counted a press on one
 * as a press outside it: the Dialog closed and the action never ran. React
 * Aria's own toast region is a top layer for this reason.
 *
 * In a browser rather than jsdom because outside-press detection there runs on
 * real pointer events.
 */
describe('Toasts and notifications over a Dialog', () => {
  const user = userEvent.setup();

  function Shows({ onPress }: { onPress: () => void }) {
    const toast = useToast();
    const { notify } = useNotifications();

    return (
      <>
        <Button
          qa="ShowToast"
          onPress={() =>
            toast({
              title: 'Saved',
              actions: <ItemAction onPress={onPress}>Undo</ItemAction>,
            })
          }
        >
          Toast
        </Button>
        <Button
          qa="ShowNotification"
          onPress={() =>
            notify({
              title: 'Deployed',
              actions: (
                <NotificationAction onPress={onPress}>View</NotificationAction>
              ),
            })
          }
        >
          Notify
        </Button>
      </>
    );
  }

  async function pressActionOverDialog(showQa: string, action: string) {
    const onPress = vi.fn();

    renderWithRoot(
      <DialogTrigger type="modal">
        <Button qa="Trigger">Open</Button>
        <Dialog>
          <Shows onPress={onPress} />
        </Dialog>
      </DialogTrigger>,
    );
    await user.click(screen.getByTestId('Trigger'));
    await screen.findByTestId('Dialog');

    await user.click(screen.getByTestId(showQa));
    await user.click(await screen.findByRole('button', { name: action }));
    await new Promise((resolve) => setTimeout(resolve, 500));

    return onPress;
  }

  it('runs a toast action and keeps the Dialog open', async () => {
    const onPress = await pressActionOverDialog('ShowToast', 'Undo');

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('Dialog')).toBeInTheDocument();
  });

  it('runs a notification action and keeps the Dialog open', async () => {
    const onPress = await pressActionOverDialog('ShowNotification', 'View');

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('Dialog')).toBeInTheDocument();
  });
});

/**
 * The toast and notification wrapper is sized to its content and capped at
 * `min(100vw - 4x, 50x)`. It used to floor at `max-content` too, and a CSS
 * minimum beats the maximum, so with an unwrapped label a long toast ran past
 * the cap and off both edges of a narrow pane.
 *
 * In a browser because jsdom lays nothing out.
 */
describe('Toast and notification width', () => {
  const user = userEvent.setup();
  const CAP = 400; // 50x
  const LONG =
    'The workbook was saved, but two of its sheets still refer to a data source that no longer exists.';
  // One word wider than the cap: it has to break, not be clipped.
  const URL =
    'Exported to https://example.com/workspaces/acme/reports/quarterly-revenue-breakdown-by-region-2026-q3.csv';

  afterEach(async () => {
    // Other specs in this project assume the default 414x896.
    await page.viewport(414, 896);
  });

  function Shows({
    title,
    description,
  }: {
    title: string;
    description?: string;
  }) {
    const toast = useToast();
    const { notify } = useNotifications();

    return (
      <>
        <Button
          qa="ShowToast"
          onPress={() => toast({ title, description, duration: null })}
        >
          Toast
        </Button>
        <Button qa="ShowNotification" onPress={() => notify({ title })}>
          Notify
        </Button>
      </>
    );
  }

  async function show(
    kind: 'Toast' | 'Notification',
    title: string,
    description?: string,
  ) {
    renderWithRoot(<Shows title={title} description={description} />);
    await user.click(screen.getByTestId(`Show${kind}`));

    const item = await screen.findByTestId(kind);

    await waitFor(() => {
      expect(item.getBoundingClientRect().width).toBeGreaterThan(0);
    });

    return item;
  }

  function expectNothingCutOff(item: HTMLElement) {
    for (const name of ['Label', 'Description']) {
      const element = item.querySelector<HTMLElement>(
        `[data-element="${name}"]`,
      );

      if (element) {
        expect(element.scrollWidth, name).toBeLessThanOrEqual(
          element.clientWidth,
        );
      }
    }
  }

  it.each([
    ['Toast', 300],
    ['Toast', 1280],
    ['Notification', 300],
    ['Notification', 1280],
  ] as const)('keeps a long %s inside a %ipx viewport', async (kind, width) => {
    await page.viewport(width, 800);

    const item = await show(kind, LONG);
    const rect = item.getBoundingClientRect();

    expect(rect.left).toBeGreaterThanOrEqual(0);
    expect(rect.right).toBeLessThanOrEqual(width);
    expect(rect.width).toBeLessThanOrEqual(CAP);

    // A toast's label wraps, so none of the message is cut off. A
    // notification keeps its one-line title with an ellipsis.
    if (kind === 'Toast') {
      expectNothingCutOff(item);
    }
  });

  it.each([300, 1280])(
    'breaks a word wider than a toast in a %ipx viewport',
    async (width) => {
      await page.viewport(width, 800);

      const item = await show('Toast', URL, URL);
      const rect = item.getBoundingClientRect();

      expect(rect.left).toBeGreaterThanOrEqual(0);
      expect(rect.right).toBeLessThanOrEqual(width);
      expectNothingCutOff(item);
    },
  );

  it('restacks toasts when a resize wraps one of them', async () => {
    await page.viewport(1280, 800);

    function ShowsTwo() {
      const toast = useToast();

      return (
        <Button
          qa="ShowTwo"
          onPress={() => {
            toast({ title: LONG, duration: null });
            toast({ title: 'Saved', duration: null });
          }}
        >
          Show
        </Button>
      );
    }

    renderWithRoot(<ShowsTwo />);
    await user.click(screen.getByTestId('ShowTwo'));

    const edges = () =>
      screen
        .getAllByTestId('Toast')
        .map((toast) => toast.getBoundingClientRect())
        .sort((a, b) => a.top - b.top);

    const settle = () => new Promise((resolve) => setTimeout(resolve, 600));

    await waitFor(() => {
      expect(edges()).toHaveLength(2);
    });
    // Fixed waits, not `waitFor`: a render still pending from showing the
    // toasts would restack them after the resize and hide a missing fix.
    await settle();
    await page.viewport(300, 800);
    await settle();

    const [upper, lower] = edges();

    expect(lower.top).toBeGreaterThanOrEqual(upper.bottom);
  });

  it('sizes a short toast to its content', async () => {
    await page.viewport(1280, 800);

    const item = await show('Toast', 'Saved');

    expect(item.getBoundingClientRect().width).toBeLessThan(CAP / 2);
  });
});
