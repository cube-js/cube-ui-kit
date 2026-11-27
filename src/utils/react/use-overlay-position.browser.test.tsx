import { parseDate } from '@internationalized/date';
import { useRef } from 'react';
import { page } from 'vitest/browser';

import { Button } from '../../components/actions/Button/Button';
import { Menu } from '../../components/actions/Menu/Menu';
import { MenuTrigger } from '../../components/actions/Menu/MenuTrigger';
import { Content } from '../../components/content/Content';
import { DateRangePicker } from '../../components/fields/DatePicker/DateRangePicker';
import { Picker } from '../../components/fields/Picker/Picker';
import { Select } from '../../components/fields/Select/Select';
import { Dialog } from '../../components/overlays/Dialog/Dialog';
import { DialogTrigger } from '../../components/overlays/Dialog/DialogTrigger';
import { renderWithRoot, screen, userEvent, waitFor } from '../../test';

import { useOverlayPosition } from './use-overlay-position';

import type { CSSProperties, ReactElement } from 'react';
import type { Placement } from 'react-aria';
import type { MockInstance } from 'vitest';

/**
 * An open overlay that changes size moves to stay inside the screen.
 *
 * React Aria's `useOverlayPosition` re-places the overlay when it resizes, but
 * only if its `ResizeObserver` attached to the overlay element, and the
 * observer is attached once, when the hook first runs. Most kit triggers
 * outlive their overlay (all but the tooltip's), so the overlay was never
 * there to observe: an overlay that grew while open kept its old place, on
 * every opening. Each case below places its trigger where that old place no
 * longer fits once the overlay has grown.
 */

// Widens an overlay well past the space beside its trigger, but leaves it
// narrower than a phone's screen, so a place that fits exists.
const LONG_ITEM = 'Request a review of this dashboard';

// No case may raise a window error. Re-placing an overlay inside a
// ResizeObserver callback changes its size again, which the browser reports
// as a "ResizeObserver loop" error that consumers' error trackers collect.
// Every error is recorded: while a listener is attached, Vitest no longer
// fails the test on an uncaught one itself.
let windowErrors: string[] = [];

const recordWindowError = (event: ErrorEvent) => {
  windowErrors.push(event.message);
};

beforeEach(() => {
  windowErrors = [];
  window.addEventListener('error', recordWindowError);
});

afterEach(async () => {
  window.removeEventListener('error', recordWindowError);
  await page.viewport(1000, 800);
});

/** Waits for the browser to paint `count` frames. */
async function nextFrames(count: number) {
  for (let frame = 0; frame < count; frame++) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
}

type User = ReturnType<typeof userEvent.setup>;

function expectInsideScreen(element: Element) {
  const rect = element.getBoundingClientRect();

  expect(rect.left).toBeGreaterThanOrEqual(0);
  expect(rect.top).toBeGreaterThanOrEqual(0);
  expect(rect.right).toBeLessThanOrEqual(window.innerWidth);
  expect(rect.bottom).toBeLessThanOrEqual(window.innerHeight);
}

/** Pins its child to a spot on the screen. */
function At({
  spot,
  children,
}: {
  spot: CSSProperties;
  children: ReactElement;
}) {
  return <div style={{ position: 'absolute', ...spot }}>{children}</div>;
}

const items = (count: number) =>
  Array.from({ length: count }, (_, index) => `Item ${index + 1}`);

describe('useOverlayPosition', () => {
  /** A trigger that outlives its overlay, as most kit triggers do. */
  function Host({
    isOpen,
    overlayWidth,
  }: {
    isOpen: boolean;
    overlayWidth: number;
  }) {
    const targetRef = useRef<HTMLButtonElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const { overlayProps } = useOverlayPosition({
      targetRef,
      overlayRef,
      isOpen,
      placement: 'bottom start',
      offset: 8,
    });

    // The overlay is the trigger's sibling at the top level, where a portal
    // puts a kit overlay.
    return (
      <>
        <At spot={{ top: 8, right: 8 }}>
          <button ref={targetRef}>Open</button>
        </At>
        {isOpen ? (
          <div
            ref={overlayRef}
            data-qa="Overlay"
            style={{ ...overlayProps.style, width: overlayWidth, height: 40 }}
          />
        ) : null}
      </>
    );
  }

  /** The observers watching `element`, from the `observe` spy's calls. */
  const observersOf = (
    observe: MockInstance<ResizeObserver['observe']>,
    element: Element,
  ) =>
    observe.mock.calls.flatMap(([target], index) =>
      target === element ? [observe.mock.contexts[index]] : [],
    );

  it('re-places a growing overlay on every opening, and stops watching it once closed', async () => {
    await page.viewport(390, 800);
    const observe = vi.spyOn(ResizeObserver.prototype, 'observe');
    const disconnect = vi.spyOn(ResizeObserver.prototype, 'disconnect');
    const view = renderWithRoot(<Host isOpen={false} overlayWidth={100} />);
    // By identity: every `ResizeObserver` deep-equals every other.
    const expectDisconnected = (observers: unknown[]) => {
      for (const observer of observers) {
        expect(disconnect.mock.contexts).toContain(observer);
      }
    };

    try {
      for (let opening = 1; opening <= 3; opening++) {
        view.rerender(<Host isOpen overlayWidth={100} />);
        const overlay = screen.getByTestId('Overlay');

        // Grows once the opening has settled, so the overlay has to stay
        // observed while open rather than be measured once after opening.
        await nextFrames(2);
        view.rerender(<Host isOpen overlayWidth={300} />);

        await nextFrames(4);
        expectInsideScreen(overlay);

        const observers = observersOf(observe, overlay);

        expect(observers).not.toHaveLength(0);

        view.rerender(<Host isOpen={false} overlayWidth={300} />);

        expectDisconnected(observers);
      }

      view.rerender(<Host isOpen overlayWidth={100} />);
      const observers = observersOf(observe, screen.getByTestId('Overlay'));

      view.unmount();

      expectDisconnected(observers);
      expect(windowErrors).toEqual([]);
    } finally {
      observe.mockRestore();
      disconnect.mockRestore();
    }
  });
});

interface OverlayCase {
  name: string;
  viewport: [width: number, height: number];
  /** The UI, before (`false`) or after its overlay's content grows. */
  render: (hasGrown: boolean) => ReactElement;
  open: (user: User) => Promise<void>;
  /**
   * Grows the open overlay the way a user would. Without it, the test
   * re-renders the UI with `render(true)`.
   */
  grow?: (user: User) => Promise<void>;
  /** The element the user sees, which must stay inside the screen. */
  overlay: () => Element;
  /** Whatever else must hold once the overlay has grown. */
  expectGrown?: () => void;
}

const RANGE_START = parseDate('2026-02-02');

/**
 * A `Select` growing wider against the screen edge, which squeezed it and cut
 * the new option's label short. Mounted open, its list first renders inline,
 * until its `Portal` moves it into the portal root as a new element.
 */
function selectCase({
  isMountedOpen,
}: {
  isMountedOpen: boolean;
}): OverlayCase {
  return {
    name: isMountedOpen ? 'Select mounted open' : 'Select',
    viewport: [390, 800],
    render: (hasGrown) => (
      <At spot={{ top: 8, right: 8 }}>
        <Select
          aria-label="Colour"
          qa="Trigger"
          width="10x"
          defaultOpen={isMountedOpen}
        >
          <Select.Item key="blue">Blue</Select.Item>
          {hasGrown ? <Select.Item key="long">{LONG_ITEM}</Select.Item> : null}
        </Select>
      </At>
    ),
    open: async (user) => {
      // Mounted open, the first opening is the mount.
      if (!screen.queryByRole('listbox')) {
        await user.click(screen.getByTestId('Trigger'));
      }

      await screen.findByRole('listbox');
    },
    overlay: () => screen.getByRole('listbox'),
    expectGrown: () => {
      const label = screen
        .getByRole('option', { name: LONG_ITEM })
        .querySelector('[data-element="Label"]')!;

      expect(label.scrollWidth).toBeLessThanOrEqual(label.clientWidth);
    },
  };
}

const overlayCases: OverlayCase[] = [
  {
    // Grows wider, to the right, past the screen edge.
    name: 'MenuTrigger',
    viewport: [390, 800],
    render: (hasGrown) => (
      <At spot={{ top: 8, right: 8 }}>
        <MenuTrigger>
          <Button qa="Trigger">⋮</Button>
          <Menu aria-label="Actions">
            <Menu.Item key="edit">Edit</Menu.Item>
            <Menu.Item key="share">Share</Menu.Item>
            {hasGrown ? <Menu.Item key="review">{LONG_ITEM}</Menu.Item> : null}
          </Menu>
        </MenuTrigger>
      </At>
    ),
    open: async (user) => {
      await user.click(screen.getByTestId('Trigger'));
      await screen.findByRole('menu');
    },
    overlay: () => screen.getByRole('menu'),
  },
  {
    // Opens beside its parent menu and grows taller, past the screen bottom.
    name: 'SubMenuTrigger',
    viewport: [390, 400],
    render: (hasGrown) => (
      <At spot={{ bottom: 8, left: 8 }}>
        <MenuTrigger>
          <Button qa="Trigger">⋮</Button>
          <Menu aria-label="Actions">
            <Menu.Item key="edit">Edit</Menu.Item>
            <Menu.SubMenuTrigger key="share-menu">
              <Menu.Item key="share">Share</Menu.Item>
              <Menu aria-label="Share">
                {items(hasGrown ? 8 : 1).map((item) => (
                  <Menu.Item key={item}>{item}</Menu.Item>
                ))}
              </Menu>
            </Menu.SubMenuTrigger>
          </Menu>
        </MenuTrigger>
      </At>
    ),
    open: async (user) => {
      await user.click(screen.getByTestId('Trigger'));
      await user.click(await screen.findByRole('menuitem', { name: 'Share' }));
      await screen.findByRole('menu', { name: 'Share' });
    },
    overlay: () => screen.getByRole('menu', { name: 'Share' }),
  },
  {
    // Opens below its trigger and grows taller, past the screen bottom.
    name: 'DialogTrigger popover',
    viewport: [390, 400],
    render: (hasGrown) => (
      <At spot={{ top: 250, left: 8 }}>
        <DialogTrigger type="popover">
          <Button qa="Trigger">Open</Button>
          <Dialog aria-label="Details">
            <Content>
              <div style={{ height: hasGrown ? 200 : 20 }} />
            </Content>
          </Dialog>
        </DialogTrigger>
      </At>
    ),
    open: async (user) => {
      await user.click(screen.getByTestId('Trigger'));
      await screen.findByRole('dialog');
    },
    overlay: () => screen.getByRole('dialog'),
  },
  selectCase({ isMountedOpen: false }),
  selectCase({ isMountedOpen: true }),
  {
    // Paging from a four-week month to a six-week one grows the calendar
    // taller, past the screen bottom.
    name: 'DateRangePicker hideTrigger',
    viewport: [390, 580],
    render: () => (
      <At spot={{ top: 330, left: 8, width: 300 }}>
        <DateRangePicker
          hideTrigger
          aria-label="Range"
          defaultValue={{
            start: RANGE_START,
            end: RANGE_START.add({ days: 2 }),
          }}
        />
      </At>
    ),
    open: async (user) => {
      await user.click(screen.getAllByRole('spinbutton')[1]);
      await screen.findByTestId('CalendarPopover');
    },
    grow: async (user) => {
      // February 2026 to May 2026.
      for (let month = 0; month < 3; month++) {
        await user.click(screen.getByRole('button', { name: 'Next' }));
      }
    },
    overlay: () => screen.getByTestId('CalendarPopover'),
  },
];

describe.each(overlayCases)(
  '$name',
  ({ viewport, render, open, grow, overlay, expectGrown }) => {
    it('moves to stay inside the screen when it grows while open, on every opening', async () => {
      await page.viewport(...viewport);
      const user = userEvent.setup();
      const view = renderWithRoot(render(false));

      for (let opening = 1; opening <= 2; opening++) {
        view.rerender(render(false));
        await open(user);
        await waitFor(() => expectInsideScreen(overlay()));

        if (grow) await grow(user);
        else view.rerender(render(true));

        // A few frames, not a `waitFor`: an overlay that creeps into place a
        // step per frame must fail as surely as one that never moves.
        await nextFrames(4);
        expectInsideScreen(overlay());
        expectGrown?.();

        await closeAll(user);
      }

      expect(windowErrors).toEqual([]);
    });
  },
);

/**
 * An open overlay stays where it is, side to side, while its trigger changes
 * width.
 *
 * A picker's trigger shows its value, so picking inside the overlay resizes
 * the trigger, and React Aria re-places the overlay whenever the trigger
 * resizes. The overlay then slid sideways under the pointer, a step per pick,
 * and the next pick landed on whatever had slid under it.
 */
describe('an open overlay whose trigger changes width', () => {
  const SHORT = 'Pick';
  const LONG = 'Picked: Monday, Tuesday, Wednesday';

  function ResizingHost({
    isOpen = true,
    label,
    placement,
    spot,
    triggerHeight = 32,
    triggerWidth,
  }: {
    isOpen?: boolean;
    label: string;
    placement: Placement;
    spot: CSSProperties;
    triggerHeight?: number;
    triggerWidth?: number;
  }) {
    const targetRef = useRef<HTMLButtonElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const { overlayProps } = useOverlayPosition({
      targetRef,
      overlayRef,
      isOpen,
      placement,
      offset: 8,
    });

    return (
      <>
        <At spot={spot}>
          <button
            ref={targetRef}
            data-qa="Trigger"
            style={{
              whiteSpace: 'nowrap',
              height: triggerHeight,
              width: triggerWidth,
            }}
          >
            {label}
          </button>
        </At>
        {isOpen ? (
          <div
            ref={overlayRef}
            data-qa="Overlay"
            style={{ ...overlayProps.style, width: 200, height: 40 }}
          />
        ) : null}
      </>
    );
  }

  const rectOf = (qa: string) => screen.getByTestId(qa).getBoundingClientRect();

  // React Aria floors the overlay's vertical place, and the trigger's edges
  // fall on fractions of a pixel.
  const expectAt = (actual: number, expected: number) =>
    expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);

  beforeEach(async () => {
    await page.viewport(1000, 800);
  });

  it.each<[Placement, CSSProperties]>([
    // Anchored on the trigger's start edge, which moves as a right-aligned
    // trigger grows.
    ['bottom start', { top: 100, right: 100 }],
    // Anchored on the trigger's middle, which moves as a left-aligned trigger
    // grows.
    ['bottom', { top: 100, left: 300 }],
    ['top end', { top: 400, left: 300 }],
    // A centred trigger keeps only its middle still: both edges move.
    [
      'bottom start',
      {
        top: 100,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
      },
    ],
  ])(
    'keeps its horizontal place, placed %s, as the trigger grows and shrinks',
    async (placement, spot) => {
      const view = renderWithRoot(
        <ResizingHost label={SHORT} placement={placement} spot={spot} />,
      );

      await nextFrames(2);
      const opened = rectOf('Overlay');

      view.rerender(
        <ResizingHost label={LONG} placement={placement} spot={spot} />,
      );
      await nextFrames(4);
      expectAt(rectOf('Overlay').left, opened.left);
      expectAt(rectOf('Overlay').top, opened.top);

      view.rerender(
        <ResizingHost label={SHORT} placement={placement} spot={spot} />,
      );
      await nextFrames(4);
      expectAt(rectOf('Overlay').left, opened.left);
      expect(windowErrors).toEqual([]);
    },
  );

  it('still follows the trigger down as it grows taller', async () => {
    const spot = { top: 100, right: 100 };
    const view = renderWithRoot(
      <ResizingHost label={SHORT} placement="bottom start" spot={spot} />,
    );

    await nextFrames(2);
    const opened = rectOf('Overlay');

    view.rerender(
      <ResizingHost
        label={LONG}
        placement="bottom start"
        spot={spot}
        triggerHeight={72}
      />,
    );
    await nextFrames(4);
    expectAt(rectOf('Overlay').left, opened.left);
    expectAt(rectOf('Overlay').top, opened.top + 40);
  });

  it('still follows a trigger that moves without resizing', async () => {
    const view = renderWithRoot(
      <ResizingHost
        label={SHORT}
        placement="bottom start"
        spot={{ top: 100, left: 300 }}
      />,
    );

    await nextFrames(2);
    const opened = rectOf('Overlay');

    // A window resize can reflow the page and move the trigger; React Aria
    // re-places its overlay on one.
    view.rerender(
      <ResizingHost
        label={SHORT}
        placement="bottom start"
        spot={{ top: 160, left: 340 }}
      />,
    );
    window.dispatchEvent(new Event('resize'));
    await nextFrames(4);
    expectAt(rectOf('Overlay').left, opened.left + 40);
    expectAt(rectOf('Overlay').top, opened.top + 60);
  });

  it('carries the place it kept along as the trigger then moves without resizing', async () => {
    const view = renderWithRoot(
      <ResizingHost
        label={SHORT}
        placement="bottom start"
        spot={{ top: 100, right: 400 }}
      />,
    );

    // Clear of the screen edge, so the overlay is not held there instead.
    await nextFrames(2);
    const opened = rectOf('Overlay');

    view.rerender(
      <ResizingHost
        label={LONG}
        placement="bottom start"
        spot={{ top: 100, right: 400 }}
      />,
    );
    await nextFrames(4);
    expectAt(rectOf('Overlay').left, opened.left);

    // From where it stayed, not from the trigger's new start edge.
    view.rerender(
      <ResizingHost
        label={LONG}
        placement="bottom start"
        spot={{ top: 100, right: 430 }}
      />,
    );
    window.dispatchEvent(new Event('resize'));
    await nextFrames(4);
    expectAt(rectOf('Overlay').left, opened.left - 30);
  });

  it('follows a trigger that resizes and moves at once, as a reflow does', async () => {
    const view = renderWithRoot(
      <ResizingHost
        label={SHORT}
        placement="bottom start"
        spot={{ top: 100, left: 500 }}
      />,
    );

    await nextFrames(2);

    // Neither edge nor the middle stays where it was.
    view.rerender(
      <ResizingHost
        label={LONG}
        placement="bottom start"
        spot={{ top: 100, left: 300 }}
      />,
    );
    await nextFrames(4);
    expectAt(rectOf('Overlay').left, rectOf('Trigger').left);
  });

  it('follows a trigger that reflows in sub-pixel steps', async () => {
    const at = (step: number) => (
      <ResizingHost
        label={SHORT}
        placement="bottom start"
        spot={{ top: 100, left: 300 - step / 2 }}
        triggerWidth={100 + step * 0.75}
      />
    );
    const view = renderWithRoot(at(0));

    await nextFrames(2);

    // Each step moves every edge by a pixel or less, as a slow window drag
    // reflows a fluid field, but the steps add up to a 5px move.
    for (let step = 1; step <= 10; step++) {
      view.rerender(at(step));
      await nextFrames(2);
    }

    expectAt(rectOf('Overlay').left, rectOf('Trigger').left);
  });

  it('anchors to the trigger as it is now on the next opening', async () => {
    const spot = { top: 100, right: 100 };
    const view = renderWithRoot(
      <ResizingHost label={SHORT} placement="bottom start" spot={spot} />,
    );

    await nextFrames(2);
    view.rerender(
      <ResizingHost label={LONG} placement="bottom start" spot={spot} />,
    );
    await nextFrames(4);
    view.rerender(
      <ResizingHost
        isOpen={false}
        label={LONG}
        placement="bottom start"
        spot={spot}
      />,
    );
    view.rerender(
      <ResizingHost label={LONG} placement="bottom start" spot={spot} />,
    );
    await nextFrames(4);

    expectAt(rectOf('Overlay').left, rectOf('Trigger').left);
  });

  it('still moves an overlay placed beside its trigger out of the way as the trigger grows', async () => {
    const spot = { top: 100, left: 100 };
    const view = renderWithRoot(
      <ResizingHost label={SHORT} placement="end" spot={spot} />,
    );

    await nextFrames(2);
    view.rerender(<ResizingHost label={LONG} placement="end" spot={spot} />);
    await nextFrames(4);

    expectAt(rectOf('Overlay').left, rectOf('Trigger').right + 8);
  });

  it('keeps a multiple-selection Picker in place as picking widens its trigger', async () => {
    const user = userEvent.setup();

    renderWithRoot(
      <At spot={{ top: 100, right: 100 }}>
        <Picker
          aria-label="Days"
          qa="DaysPicker"
          selectionMode="multiple"
          placeholder="Days"
        >
          <Picker.Item key="mon">Monday</Picker.Item>
          <Picker.Item key="tue">Tuesday</Picker.Item>
          <Picker.Item key="wed">Wednesday</Picker.Item>
        </Picker>
      </At>,
    );

    const trigger = screen.getByRole('button');

    await user.click(trigger);
    const dialog = await screen.findByRole('dialog');

    // Past the opening animation, which scales the dialog.
    await waitFor(() =>
      expect(getComputedStyle(dialog).transform).toBe('none'),
    );
    const opened = dialog.getBoundingClientRect();
    const triggerWidth = trigger.getBoundingClientRect().width;

    for (const day of ['Monday', 'Tuesday', 'Wednesday']) {
      await user.click(screen.getByRole('option', { name: day }));
      await nextFrames(4);
    }

    expect(trigger.getBoundingClientRect().width).toBeGreaterThan(triggerWidth);
    expectAt(dialog.getBoundingClientRect().left, opened.left);
    expect(windowErrors).toEqual([]);
  });
});

/** Presses `Escape` until no overlay is left open (a submenu takes two). */
async function closeAll(user: User) {
  const countOpen = () =>
    ['menu', 'listbox', 'dialog'].reduce(
      (count, role) => count + screen.queryAllByRole(role).length,
      0,
    );

  while (countOpen() > 0) {
    const before = countOpen();

    await user.keyboard('{Escape}');
    // A closing overlay stays mounted while it animates out.
    await waitFor(() => expect(countOpen()).toBeLessThan(before));
  }
}
