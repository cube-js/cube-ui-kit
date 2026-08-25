import { expect, userEvent, waitFor, within } from 'storybook/test';

/**
 * Interactions a `play` function needs to put a story into a state that only
 * exists during an interaction — an open menu, a visible tooltip.
 *
 * Chromatic runs `play` and photographs whatever it leaves behind, so a story
 * named for such a state is only testing anything if something drove it there.
 * Both recipes below have caveats that fail *silently* — the story renders, the
 * snapshot just shows the closed state — which is why they live here once
 * rather than being retyped per story.
 *
 * See [storybook.md](../../docs/rules/storybook.md#interaction-only-states-need-a-play-function).
 */

export const timeout = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Opens `target`'s context menu and waits for it.
 *
 * The leading pointer move is load-bearing: `userEvent.pointer` dispatches the
 * right-click from wherever the virtual pointer happens to be, and React Aria's
 * context-menu handler reads the event's coordinates to position the overlay.
 * Without a move first those are `0,0`, and the menu opens pinned to the corner
 * of the viewport — which snapshots as a menu floating away from its trigger.
 */
export async function openContextMenu(
  canvasElement: HTMLElement,
  target: Element,
) {
  const canvas = within(canvasElement);

  await userEvent.pointer([
    { target, coords: { clientX: 120, clientY: 120 } },
    { keys: '[MouseRight]', target },
  ]);

  await waitFor(() => expect(canvas.getByRole('menu')).toBeVisible());
}

/**
 * Hovers `target` and waits for its tooltip.
 *
 * Two independent things stop a hover fired from `play` doing anything, and
 * both fail silently:
 *
 * - **The trigger is not wired yet.** `TooltipProvider` renders its child
 *   without trigger props until a mount effect flips `rendered`. A hover that
 *   lands before that has no handler to reach and nothing replays it, hence the
 *   wait.
 * - **React Aria has no interaction modality yet.** It opens a tooltip only
 *   when the last interaction came from a pointer, which it learns from a mouse
 *   move on the document. `userEvent.hover` fires `mouseEnter` *before* its
 *   `mouseMove`, so the page's first hover is ignored — the leading `unhover`
 *   supplies that move.
 *
 * Pass `delay: 0` in the story's tooltip config as well. The default 250ms open
 * delay is real time the snapshot would otherwise wait out, and it makes any
 * retry racy.
 *
 * Only one element per story: hovering a second closes the first, and only the
 * final state is photographed.
 */
export async function openTooltip(canvasElement: HTMLElement, target: Element) {
  await timeout(250);

  await userEvent.unhover(target);
  await userEvent.hover(target);

  await waitFor(() =>
    expect(within(canvasElement).getByRole('tooltip')).toBeVisible(),
  );
}
