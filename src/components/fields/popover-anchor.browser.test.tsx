import { ReactElement, RefObject, useRef } from 'react';

import { renderWithRoot, screen, userEvent, waitFor } from '../../test';

import { Picker } from './Picker/Picker';
import { Select } from './Select/Select';

/**
 * `targetRef` redirects the popover's anchor away from the trigger, so sibling
 * controls of different widths can line their popovers up with one shared
 * container (CUB-4672).
 *
 * This has to run in a real browser. The whole assertion is where a box LANDS,
 * and jsdom has no layout: every `getBoundingClientRect()` there is `0 × 0` at
 * the origin, so a build that ignored `targetRef` entirely would pass a jsdom
 * spec that looked exactly like this one.
 *
 * The fixture is the shape the ticket describes — a narrow control indented
 * inside a wide row. `start` alignment against the ROW puts the popover at the
 * row's left edge; against the TRIGGER it would sit at the indent instead. The
 * two differ by `ANCHOR_INDENT`, which is far enough apart that a few pixels of
 * sub-pixel rounding cannot make one look like the other.
 */

const ANCHOR_INDENT = 120;

function Row({
  children,
}: {
  children: (ref: RefObject<HTMLDivElement>) => ReactElement;
}) {
  const anchorRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={anchorRef}
      data-qa="AnchorRow"
      style={{ width: 400, padding: 0, position: 'relative' }}
    >
      <div style={{ marginLeft: ANCHOR_INDENT, width: 160 }}>
        {children(anchorRef)}
      </div>
    </div>
  );
}

const items = [
  <Picker.Item key="1">Blue</Picker.Item>,
  <Picker.Item key="2">Red</Picker.Item>,
];

const selectItems = [
  <Select.Item key="1">Blue</Select.Item>,
  <Select.Item key="2">Red</Select.Item>,
];

function rowLeft() {
  return screen.getByTestId('AnchorRow').getBoundingClientRect().left;
}

/**
 * The list's own left edge. It sits inside the positioned popover, so it moves
 * with the anchor — and reading it directly avoids walking up to "the overlay"
 * through a selector that would have to guess at two different DOM shapes
 * (`Select` renders its own popup, `Picker` goes through `Dialog`).
 */
function listLeft(listbox: HTMLElement) {
  return listbox.getBoundingClientRect().left;
}

describe('popover anchor (targetRef)', () => {
  // `Select` positions through `useOverlayPosition` directly.
  it('anchors a Select popover to the outer row rather than the trigger', async () => {
    renderWithRoot(
      <Row>
        {(anchorRef) => (
          <Select
            aria-label="select"
            targetRef={anchorRef}
            placement="bottom start"
          >
            {selectItems}
          </Select>
        )}
      </Row>,
    );

    await userEvent.click(screen.getByRole('button'));

    const listbox = await screen.findByRole('listbox');

    await waitFor(() => {
      // Anchored to the row, the popover starts at the row's left edge — a full
      // ANCHOR_INDENT to the LEFT of the trigger it belongs to.
      expect(listLeft(listbox)).toBeLessThan(rowLeft() + ANCHOR_INDENT / 2);
    });
  });

  // `Picker` positions through `DialogTrigger`, a different code path.
  it('anchors a Picker popover to the outer row rather than the trigger', async () => {
    renderWithRoot(
      <Row>
        {(anchorRef) => (
          <Picker
            aria-label="picker"
            defaultSelectedKey="1"
            targetRef={anchorRef}
            placement="bottom start"
          >
            {items}
          </Picker>
        )}
      </Row>,
    );

    await userEvent.click(screen.getByTestId('PickerTrigger'));

    const listbox = await screen.findByRole('listbox');

    await waitFor(() => {
      expect(listLeft(listbox)).toBeLessThan(rowLeft() + ANCHOR_INDENT / 2);
    });
  });

  // The default must not move: every existing caller passes no `targetRef` and
  // expects the popover on its own trigger.
  it('still anchors to the trigger when no targetRef is given', async () => {
    renderWithRoot(
      <Row>
        {() => (
          <Picker aria-label="picker" defaultSelectedKey="1">
            {items}
          </Picker>
        )}
      </Row>,
    );

    await userEvent.click(screen.getByTestId('PickerTrigger'));

    const listbox = await screen.findByRole('listbox');

    await waitFor(() => {
      // Still out at the indent, where the trigger is.
      expect(listLeft(listbox)).toBeGreaterThan(rowLeft() + ANCHOR_INDENT / 2);
    });
  });

  /**
   * `DialogTrigger` stops attaching its OWN ref to the trigger child once
   * `targetRef` is set (`ref: targetRef ? undefined : triggerRef`). The trigger
   * has to keep working anyway — `Picker` puts its own ref on that element and
   * uses it to hand focus back when the list closes, and a clobbered ref would
   * leave focus on a detached option with no visible owner.
   */
  it('still returns focus to the trigger when anchored elsewhere', async () => {
    renderWithRoot(
      <Row>
        {(anchorRef) => (
          <Picker
            aria-label="picker"
            defaultSelectedKey="1"
            targetRef={anchorRef}
            placement="bottom start"
          >
            {items}
          </Picker>
        )}
      </Row>,
    );

    const trigger = screen.getByTestId('PickerTrigger');

    await userEvent.click(trigger);
    await screen.findByRole('listbox');

    await userEvent.keyboard('{Escape}');

    await waitFor(() =>
      expect(trigger.contains(document.activeElement)).toBe(true),
    );
  });
});
