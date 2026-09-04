import { useState } from 'react';

import { renderWithRoot, screen, userEvent } from '../../../test';

import { Dashboard } from './Dashboard';

import type { DashboardPlacement } from './types';

/**
 * Dashboard in a real browser.
 *
 * The jsdom suite mocks every rectangle, which makes it structurally unable to
 * answer the two questions here. "Is this control actually on top?" is decided
 * by paint order, and only a real engine knows paint order — `getComputedStyle`
 * reports the `z-index` a rule asked for, not the stacking context it landed
 * in, so a control trapped in a nested context still reports `6`. And "how far
 * apart are two top-level containers?" is a measured distance between boxes
 * that deliberately bleed outside their grid areas.
 *
 * Everything is laid out inside the default 414px browser viewport on purpose:
 * `elementsFromPoint` returns an empty list for a point outside the viewport,
 * which reads as "nothing is on top" and would pass a broken component.
 */

const ROW = 60;

/** Enough of a catalog for the contextual add control to mount. */
const ADD_ITEMS = [
  { id: 'tile', name: 'Tile', defaultColumns: 1, defaultRows: 1 },
] as const;

let user: ReturnType<typeof userEvent.setup>;

beforeEach(() => {
  user = userEvent.setup();
});

const center = (element: Element) => {
  const rect = element.getBoundingClientRect();

  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
};

/** Whether `element` owns the point — it, or something inside it, is on top. */
function ownsPoint(element: Element, point: { x: number; y: number }) {
  const top = document.elementFromPoint(point.x, point.y);

  return !!top && (top === element || element.contains(top));
}

/**
 * The centre of the region where two elements overlap.
 *
 * A control's *centre* sits on its node's edge by construction, which is inside
 * the gap and over nothing. Only the outer sliver reaches a neighbour, so that
 * sliver is where a layering claim has to be tested — and asserting the overlap
 * is non-empty first keeps the test from passing on an empty hit list.
 */
function overlapCentre(first: Element, second: Element) {
  const a = first.getBoundingClientRect();
  const b = second.getBoundingClientRect();
  const left = Math.max(a.left, b.left);
  const right = Math.min(a.right, b.right);
  const top = Math.max(a.top, b.top);
  const bottom = Math.min(a.bottom, b.bottom);

  expect(right).toBeGreaterThan(left);
  expect(bottom).toBeGreaterThan(top);

  return { x: (left + right) / 2, y: (top + bottom) / 2 };
}

const grip = (widget: Element) =>
  widget.querySelector('[data-dashboard-resize-handle]')!;
const actions = (widget: Element) =>
  widget.querySelector('[data-dashboard-widget-actions]')!;

/** Both controls fade in on selection; hit-test them once they are really up. */
async function chromeShown(widget: Element) {
  await vi.waitFor(() => {
    expect(Number(getComputedStyle(grip(widget)).opacity)).toBeGreaterThan(0.9);
    expect(Number(getComputedStyle(actions(widget)).opacity)).toBeGreaterThan(
      0.9,
    );
  });
}

/**
 * Two widgets side by side under a `1x` gap.
 *
 * The gap matters: both controls straddle their node's edge and reach ~14px
 * past it, so at the default 16px gap they hang in empty space and overlap
 * nothing. `8` is the other end of the Playground's supported range and the
 * configuration where the layering actually has to hold.
 */
function TwoWidgets() {
  const [placements, setPlacements] = useState<
    Record<string, DashboardPlacement>
  >({
    left: { column: 0, row: 0, columns: 6, rows: 1 },
    right: { column: 6, row: 0, columns: 6, rows: 1 },
  });

  return (
    <div style={{ width: '360px', padding: '24px' }}>
      <Dashboard
        isEditing
        rowHeight={ROW}
        gap={8}
        addItems={ADD_ITEMS}
        onAddItem={() => {}}
      >
        <Dashboard.Grid id="section" aria-label="section" rows={2}>
          {(['left', 'right'] as const).map((id) => (
            <Dashboard.Widget
              key={id}
              isCard
              isMovable
              isResizable
              qa={id}
              id={id}
              aria-label={id}
              minColumns={2}
              maxColumns={8}
              minRows={1}
              maxRows={2}
              onDeletePress={() => {}}
              onSettingsPress={() => {}}
              {...placements[id]}
              onPlacementChange={(placement) =>
                setPlacements((current) => ({ ...current, [id]: placement }))
              }
            >
              {id}
            </Dashboard.Widget>
          ))}
        </Dashboard.Grid>
      </Dashboard>
    </div>
  );
}

/** A widget flush against the right edge of a nested container. */
function NestedNeighbours() {
  return (
    <div style={{ width: '360px', padding: '24px' }}>
      <Dashboard isEditing rowHeight={ROW} gap={8}>
        <Dashboard.Grid id="section" aria-label="section" rows={1}>
          <Dashboard.Grid
            id="inner"
            aria-label="inner"
            column={0}
            row={0}
            columns={6}
            rows={1}
          >
            <Dashboard.Widget
              isCard
              isResizable
              qa="inner-widget"
              id="inner-widget"
              aria-label="inner widget"
              columns={6}
              rows={1}
              minColumns={2}
              maxColumns={6}
              minRows={1}
              maxRows={1}
              onSettingsPress={() => {}}
              onDeletePress={() => {}}
              onPlacementChange={() => {}}
            >
              inner
            </Dashboard.Widget>
          </Dashboard.Grid>
          <Dashboard.Grid
            qa="sibling"
            id="sibling"
            aria-label="sibling"
            column={6}
            row={0}
            columns={6}
            rows={1}
          >
            <Dashboard.Widget
              isCard
              qa="sibling-widget"
              id="sibling-widget"
              aria-label="sibling widget"
              columns={6}
              rows={1}
            >
              sibling
            </Dashboard.Widget>
          </Dashboard.Grid>
        </Dashboard.Grid>
      </Dashboard>
    </div>
  );
}

/**
 * Whether `element` opens a stacking context — the property that decides
 * whether a `z-index` on a descendant is measured against the Dashboard's own
 * scale or only against that element's siblings.
 */
function opensStackingContext(element: Element) {
  const style = getComputedStyle(element);
  const positioned = style.position !== 'static';

  return (
    (positioned && style.zIndex !== 'auto') ||
    style.isolation === 'isolate' ||
    style.transform !== 'none' ||
    style.filter !== 'none' ||
    Number(style.opacity) < 1 ||
    style.mixBlendMode !== 'normal' ||
    style.contain === 'paint' ||
    style.willChange.includes('transform')
  );
}

/** Every ancestor between `element` and the Dashboard root, root included. */
function ancestorsToRoot(element: Element) {
  const chain: Element[] = [];
  let current = element.parentElement;

  while (current) {
    chain.push(current);
    if (current.hasAttribute('data-dashboard-root')) break;
    current = current.parentElement;
  }

  return chain;
}

describe('Dashboard layering', () => {
  it('leaves the z-scale unbroken between the root and every control', async () => {
    renderWithRoot(<NestedNeighbours />);

    const inner = screen.getByTestId('inner-widget');
    await user.click(inner);
    await chromeShown(inner);

    for (const control of [grip(inner), actions(inner)]) {
      const chain = ancestorsToRoot(control);
      const root = chain.at(-1)!;

      // The root closes the scale off from the host app...
      expect(root.hasAttribute('data-dashboard-root')).toBe(true);
      expect(opensStackingContext(root)).toBe(true);
      // ...and nothing between it and the control may reopen one, or the
      // control's `z-index` stops being comparable with other nodes'.
      for (const ancestor of chain.slice(0, -1)) {
        expect({
          qa: ancestor.getAttribute('data-qa'),
          opens: opensStackingContext(ancestor),
        }).toEqual({ qa: ancestor.getAttribute('data-qa'), opens: false });
      }
    }
  });

  it('keeps a selected widget’s controls above the neighbour they overhang', async () => {
    renderWithRoot(<TwoWidgets />);

    const left = screen.getByTestId('left');
    const right = screen.getByTestId('right');
    await user.click(left);
    await chromeShown(left);

    expect(ownsPoint(grip(left), center(grip(left)))).toBe(true);
    expect(ownsPoint(actions(left), center(actions(left)))).toBe(true);

    // Where each control genuinely covers the neighbour, the control wins.
    expect(ownsPoint(grip(left), overlapCentre(grip(left), right))).toBe(true);
    expect(ownsPoint(actions(left), overlapCentre(actions(left), right))).toBe(
      true,
    );
  });

  it('keeps controls above the add slot in the adjacent cell', async () => {
    renderWithRoot(<TwoWidgets />);

    const left = screen.getByTestId('left');
    await user.click(left);
    await chromeShown(left);

    // Hovering a vacant cell moves the add control into it. The cell below the
    // widget is where its corner grip hangs, and the add control fills the whole
    // cell — so the two really do compete for the same pixels.
    const addSlot = screen.getByTestId('DashboardAddButton');
    await user.hover(
      document.querySelector(
        '[data-dashboard-free-cell][data-dashboard-column="5"]' +
          '[data-dashboard-row="1"]',
      )!,
    );
    await vi.waitFor(() => {
      expect(Number(getComputedStyle(addSlot).opacity)).toBeGreaterThan(0.9);
      expect(addSlot.getAttribute('data-dashboard-column')).toBe('5');
      expect(addSlot.getAttribute('data-dashboard-row')).toBe('1');
    });

    expect(ownsPoint(grip(left), overlapCentre(grip(left), addSlot))).toBe(
      true,
    );
  });

  it('keeps the moved widget’s controls on top for the whole gesture', async () => {
    renderWithRoot(<TwoWidgets />);

    const left = screen.getByTestId('left');
    await user.click(left);
    await chromeShown(left);
    const from = center(left);
    const at = (dx: number, dy: number) => ({
      clientX: from.x + dx,
      clientY: from.y + dy,
      pageX: from.x + dx,
      pageY: from.y + dy,
    });

    await user.pointer([
      { keys: '[MouseLeft>]', target: left, coords: at(0, 0) },
      { target: left, coords: at(10, 4) },
      { target: left, coords: at(24, 8) },
    ]);

    expect(getComputedStyle(left).getPropertyValue('cursor')).toBe('grabbing');
    expect(ownsPoint(grip(left), center(grip(left)))).toBe(true);
    expect(ownsPoint(actions(left), center(actions(left)))).toBe(true);

    await user.pointer({ keys: '[/MouseLeft]', target: left });
  });

  it('keeps controls above a sibling container’s content', async () => {
    renderWithRoot(<NestedNeighbours />);

    const inner = screen.getByTestId('inner-widget');
    const sibling = screen.getByTestId('sibling');
    await user.click(inner);
    await chromeShown(inner);

    // The grip hangs off the corner of a widget that is itself flush with its
    // container's edge, so it reaches into a different container's subtree —
    // the case the old per-node stacking contexts could not resolve.
    expect(ownsPoint(grip(inner), center(grip(inner)))).toBe(true);
    expect(ownsPoint(grip(inner), overlapCentre(grip(inner), sibling))).toBe(
      true,
    );
  });
});

/**
 * A short destination low on a tall page, so a scroll-sized error in the hit
 * test lands outside it rather than merely off-centre.
 */
function ScrollablePage({
  onPlacementChange,
}: {
  onPlacementChange: (...args: unknown[]) => void;
}) {
  return (
    <div style={{ width: '360px', padding: '24px', height: '2400px' }}>
      <div style={{ height: '600px' }} />
      <Dashboard isEditing rowHeight={ROW} gap={8}>
        <Dashboard.Grid id="outer" aria-label="outer" rows={1}>
          <Dashboard.Grid
            qa="left"
            id="left"
            aria-label="left"
            column={0}
            columns={6}
            rows={1}
          >
            <Dashboard.Widget
              isCard
              isMovable
              qa="metric"
              id="metric"
              aria-label="metric"
              columns={6}
              rows={1}
              onPlacementChange={onPlacementChange}
            >
              metric
            </Dashboard.Widget>
          </Dashboard.Grid>
          <Dashboard.Grid
            qa="right"
            id="right"
            aria-label="right"
            column={6}
            columns={6}
            rows={1}
          />
        </Dashboard.Grid>
      </Dashboard>
    </div>
  );
}

describe('Dashboard drag under scroll', () => {
  it('hit-tests where the pointer is after the page scrolls mid-drag', async () => {
    const onPlacementChange = vi.fn();
    renderWithRoot(<ScrollablePage onPlacementChange={onPlacementChange} />);

    const metric = screen.getByTestId('metric');
    const rightContent = document.querySelector(
      '[data-dashboard-parent-id="right"]',
    )!;
    const from = center(metric);
    const to = center(rightContent);
    const at = (point: { x: number; y: number }) => ({
      clientX: point.x,
      clientY: point.y,
      pageX: point.x + window.scrollX,
      pageY: point.y + window.scrollY,
    });

    await user.pointer([
      { keys: '[MouseLeft>]', target: metric, coords: at(from) },
      { target: metric, coords: at(to) },
    ]);
    expect(rightContent).toContainElement(
      screen.getByTestId('DashboardDropPlaceholder'),
    );

    // The pointer does not move; the page does. `useMove` reports that as
    // page-space movement, so a hit test that reconstructs the position from
    // the press point plus the deltas ends up a scroll-height away from the
    // cursor — and the frozen destination rectangles go stale with it.
    window.scrollBy(0, 220);
    await vi.waitFor(() => expect(window.scrollY).toBeGreaterThan(0));
    const shifted = { x: to.x, y: to.y - 220 };
    await user.pointer({ target: metric, coords: at(shifted) });

    expect(rightContent).toContainElement(
      screen.getByTestId('DashboardDropPlaceholder'),
    );

    await user.pointer({ keys: '[/MouseLeft]', target: metric });
    expect(onPlacementChange).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({
        phase: 'commit',
        destinationParentId: 'right',
      }),
    );
  });
});

describe('Dashboard top-level gap', () => {
  it('separates top-level container content by one 2x channel', () => {
    renderWithRoot(
      <div style={{ width: '360px', padding: '24px' }}>
        <Dashboard rowHeight={ROW} gap={16}>
          <Dashboard.Grid id="first" aria-label="first" rows={1}>
            <Dashboard.Widget id="a" aria-label="a" columns={12}>
              a
            </Dashboard.Widget>
          </Dashboard.Grid>
          <Dashboard.Grid id="second" aria-label="second" rows={1}>
            <Dashboard.Widget id="b" aria-label="b" columns={12}>
              b
            </Dashboard.Widget>
          </Dashboard.Grid>
        </Dashboard>
      </div>,
    );

    const first = document.querySelector('[data-dashboard-parent-id="first"]')!;
    const second = document.querySelector(
      '[data-dashboard-parent-id="second"]',
    )!;
    const boxes = ['first', 'second'].map((id) =>
      document
        .querySelector(`[data-dashboard-node-id="${id}"]`)!
        .getBoundingClientRect(),
    );

    // The content grids — the boxes children actually occupy — are 2x apart,
    // and that distance does not track the `gap` prop, which is 16px here.
    expect(
      Math.round(
        second.getBoundingClientRect().top -
          first.getBoundingClientRect().bottom,
      ),
    ).toBe(16);

    // 2x is twice the depth-one chrome bleed, so the two selectable boxes meet
    // exactly rather than crossing — which an 8px channel made them do.
    expect(Math.round(boxes[1].top - boxes[0].bottom)).toBe(0);
  });
});
