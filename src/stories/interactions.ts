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
 * right-click from wherever the virtual pointer happens to be, and
 * `use-context-menu` positions the overlay from the event's coordinates. Without
 * a move first those are `0,0` and the menu opens pinned to the corner of the
 * viewport.
 *
 * The coordinates have to come from the target's own box, not a constant — a
 * fixed point anchors every menu to the same place regardless of which row was
 * opened, so the snapshot shows a menu floating away from its trigger and would
 * not catch a real positioning regression. Aim just inside the leading edge,
 * vertically centred, which is where a pointer lands on a row.
 */
export async function openContextMenu(
  canvasElement: HTMLElement,
  target: Element,
) {
  const rect = target.getBoundingClientRect();
  const coords = {
    clientX: Math.round(rect.left + Math.min(rect.width / 2, 40)),
    clientY: Math.round(rect.top + rect.height / 2),
  };

  await userEvent.pointer([
    { target, coords },
    { keys: '[MouseRight]', target, coords },
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
 *   without trigger props until a mount effect flips `rendered`, and an
 *   auto-on-overflow label does not even ask for a provider until it has
 *   measured itself, which happens off the commit path. A hover that lands
 *   before any of that has no handler to reach, and the browser does not replay
 *   it — so this replays the hover itself rather than guessing a delay long
 *   enough to cover however many commits the component needed.
 * - **React Aria has no interaction modality yet.** It opens a tooltip only
 *   when the last interaction came from a pointer, which it learns from a mouse
 *   move on the document. `userEvent.hover` fires `mouseEnter` *before* its
 *   `mouseMove`, so the page's first hover is ignored — the leading `unhover`
 *   supplies that move.
 *
 * Pass `delay: 0` in the story's tooltip config as well. The default 250ms open
 * delay is real time the snapshot would otherwise wait out, and it makes each
 * retry below that much slower.
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
export async function openTooltip(target: Element | (() => Element)) {
  const doc = within(document.body);
  const tooltip = () => doc.queryAllByRole('tooltip')[0];

  /**
   * Resolved per attempt, never captured once.
   *
   * Turning an auto-tooltip verdict on mounts `TooltipProvider`, which remounts
   * the label underneath it — so the node a caller looked up before calling
   * this is detached by the time the retry runs. Hovering a detached node
   * dispatches events nothing is listening to: it does not throw, the tooltip
   * never opens, and every further attempt hovers the same dead node. That is
   * the exact race this helper exists to survive, so it has to re-query.
   */
  const resolve = () => (typeof target === 'function' ? target() : target);

  // Replay the hover, but leave the pointer in place between attempts.
  //
  // A single hover is only as good as the guess in front of it: nothing
  // replays a hover that lands before the trigger is wired, and an
  // auto-on-overflow label does not ask for a provider until it has measured
  // itself, which happens off the commit path.
  //
  // Retrying inside `waitFor` does NOT work, and the failure is silent: its
  // retry period is shorter than `TooltipTrigger`'s 250ms open delay, so every
  // retry unhovers and cancels the timer that the previous one started, and the
  // tooltip can never appear. Each attempt therefore hovers ONCE and then waits
  // out the delay several times over before deciding the hover was wasted.
  const ATTEMPTS = 3;
  const PER_ATTEMPT_MS = 1500;

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    const element = resolve();

    // A caller that handed over a node rather than a lookup cannot re-resolve
    // it. Say so, rather than hovering a corpse for four and a half seconds and
    // reporting "expected null to be visible".
    if (!element.isConnected) {
      throw new Error(
        'openTooltip: the target is detached from the document. Mounting a ' +
          'tooltip provider remounts its label, so pass a lookup — ' +
          'openTooltip(() => canvas.getByTestId(…)) — not the element.',
      );
    }

    // The leading unhover supplies the mouse move React Aria needs to set its
    // interaction modality — `userEvent.hover` fires `mouseEnter` before
    // `mouseMove`, so an un-preceded first hover is ignored.
    await userEvent.unhover(element);
    await userEvent.hover(element);

    if (attempt === ATTEMPTS) break;

    try {
      await waitFor(() => expect(tooltip()).toBeVisible(), {
        timeout: PER_ATTEMPT_MS,
      });

      return tooltip();
    } catch {
      // Trigger was probably not wired when the hover landed. Try again.
    }
  }

  // Let the last attempt report the real assertion failure.
  await waitForOverlay('tooltip');

  return tooltip();
}
