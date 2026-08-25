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
 * Waits for an overlay of `role` to be on screen, anywhere in the document.
 *
 * Two details, both of which produce a *failing* `play` rather than a silent
 * one — and a thrown `play` fails the entire Chromatic build:
 *
 * - **Scope.** Overlays portal out of `canvasElement`, so the `within(canvas)`
 *   queries a story normally uses cannot see them. Some components portal
 *   inside the canvas and some do not, which makes this the difference between
 *   a story that works and one that throws for no visible reason.
 * - **Visibility takes a frame.** Overlays mount hidden and are revealed by a
 *   transition, so asserting visibility once — even after `findByRole` has
 *   resolved — catches the hidden frame. The assertion has to be inside
 *   `waitFor`, not after it.
 */
export async function waitForOverlay(role: string) {
  const doc = within(document.body);

  await waitFor(() => expect(doc.getAllByRole(role)[0]).toBeVisible());

  return doc.getAllByRole(role)[0];
}

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
  await userEvent.pointer([
    { target, coords: { clientX: 120, clientY: 120 } },
    { keys: '[MouseRight]', target },
  ]);

  await waitForOverlay('menu');
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
 *
 * Not every tooltip opens from a synthetic hover. A real mouse opens all of
 * them, but `userEvent` reliably opens only the auto-on-overflow ones; a
 * tooltip configured with an explicit `title` stays closed, deterministically.
 * If this throws for a story, that is what you are hitting — do not paper over
 * it with a longer wait.
 */
export async function openTooltip(target: Element) {
  await timeout(250);

  await userEvent.unhover(target);
  await userEvent.hover(target);

  await waitForOverlay('tooltip');
}
