import { ComponentProps, useEffect, useLayoutEffect, useState } from 'react';

import { act, renderWithRoot, screen, userEvent, waitFor } from '../../../test';
import { Select } from '../Select/Select';

import { ListBox } from './ListBox';

/**
 * What the list lets out, and what it keeps (CUB-4839).
 *
 * `Escape` has to leave so a surrounding overlay can close on it, and `Tab` so
 * a surrounding Dialog can keep focus inside (CUB-5603). Nothing else may
 * follow them out: ancestors run shortcuts off plain keys, and a list that
 * leaked `Enter` into a surrounding form would submit it.
 *
 * In a browser rather than jsdom because the bug this guards is a property of
 * React Aria's real handler. `createEventHandler` keeps its propagation
 * decision for the LIFE of the handler rather than per event, so an opt-out
 * taken for `Escape` silently released every later key until the next render —
 * which only shows up when real keys are dispatched in sequence against a list
 * that does not re-render between them.
 */
describe('ListBox key propagation', () => {
  const user = userEvent.setup();

  function setup() {
    const seen: string[] = [];

    renderWithRoot(
      <div onKeyDown={(event) => seen.push(event.key)}>
        <ListBox qa="LB" aria-label="Colours">
          <ListBox.Item key="blue">Blue</ListBox.Item>
          <ListBox.Item key="red">Red</ListBox.Item>
        </ListBox>
      </div>,
    );

    const host = screen.getByTestId('LB');

    (host.querySelector('[role="listbox"]') ?? host).focus();

    return seen;
  }

  it('lets Escape out', async () => {
    const seen = setup();

    await user.keyboard('{Escape}');

    expect(seen).toContain('Escape');
  });

  it('lets Tab out', async () => {
    const seen = setup();

    await user.keyboard('{Tab}');

    expect(seen).toContain('Tab');
  });

  it('still holds a key pressed AFTER Escape', async () => {
    const seen = setup();

    await user.keyboard('{Escape}');
    await user.keyboard('z');

    expect(seen).not.toContain('z');
  });

  it('holds an ordinary key', async () => {
    const seen = setup();

    await user.keyboard('z');

    expect(seen).not.toContain('z');
  });
});

/** The bounding boxes of every element with this role. */
function rects(role: string) {
  return screen
    .queryAllByRole(role)
    .map((element) => element.getBoundingClientRect());
}

/** The space between each pair of neighbouring options, rounded. */
function gaps() {
  const options = rects('option');

  return options
    .slice(1)
    .map((option, index) => Math.round(option.top - options[index].bottom));
}

/**
 * `listGap` spaces the options however the list lays them out. In a browser
 * because a flat list is the virtualizer's arithmetic, not CSS: it positions
 * its options absolutely, so their margins space nothing and the virtualizer
 * has to add the gap itself. The other layouts are margins jsdom cannot lay out.
 */
describe('ListBox listGap', () => {
  const COLORS = ['Red', 'Green', 'Blue'];

  /** The space between the last option and the bottom of the list. */
  function spaceBelow() {
    const options = rects('option');
    const [list] = rects('listbox');

    return Math.round(list.bottom - options[options.length - 1].bottom);
  }

  type Props = Partial<ComponentProps<typeof ListBox>>;

  const layouts = {
    flat: (props: Props) => (
      <ListBox aria-label="Colors" {...props}>
        {COLORS.map((color) => (
          <ListBox.Item key={color}>{color}</ListBox.Item>
        ))}
      </ListBox>
    ),
    sectioned: (props: Props) => (
      <ListBox aria-label="Colors" {...props}>
        <ListBox.Section>
          {COLORS.map((color) => (
            <ListBox.Item key={color}>{color}</ListBox.Item>
          ))}
        </ListBox.Section>
      </ListBox>
    ),
    reorderable: (props: Props) => (
      <ListBox isReorderable aria-label="Colors" {...props}>
        {COLORS.map((color) => (
          <ListBox.Item key={color}>{color}</ListBox.Item>
        ))}
      </ListBox>
    ),
  };

  const LAYOUTS = Object.keys(layouts) as (keyof typeof layouts)[];

  it.each(LAYOUTS)('spaces a %s list by listGap', async (layout) => {
    renderWithRoot(layouts[layout]({ listGap: 6 }));

    await vi.waitFor(() => expect(gaps()).toEqual([6, 6]));
  });

  it.each(LAYOUTS)(
    'keeps a hairline between the options of a %s list by default',
    async (layout) => {
      renderWithRoot(layouts[layout]({}));

      await vi.waitFor(() => expect(gaps()).toEqual([1, 1]));
    },
  );

  it('spaces a loose option from the section after it', async () => {
    renderWithRoot(
      <ListBox aria-label="Colors" listGap={6}>
        <ListBox.Item key="red">Red</ListBox.Item>
        <ListBox.Section>
          <ListBox.Item key="green">Green</ListBox.Item>
          <ListBox.Item key="blue">Blue</ListBox.Item>
        </ListBox.Section>
      </ListBox>,
    );

    await vi.waitFor(() => expect(gaps()).toEqual([6, 6]));
  });

  it.each(LAYOUTS)(
    'keeps .5x below the last option of a %s list, which listStyles can take away',
    async (layout) => {
      const { unmount } = renderWithRoot(layouts[layout]({ listGap: 6 }));

      await vi.waitFor(() => expect(spaceBelow()).toBe(4));
      unmount();

      renderWithRoot(
        layouts[layout]({ listGap: 6, listStyles: { padding: 0 } }),
      );

      await vi.waitFor(() => expect(spaceBelow()).toBe(0));
    },
  );

  it('draws the focus ring inside the option', async () => {
    renderWithRoot(
      <ListBox aria-label="Colors" shape="plain">
        {COLORS.map((color) => (
          <ListBox.Item key={color} type="outline">
            {color}
          </ListBox.Item>
        ))}
      </ListBox>,
    );

    await userEvent.tab();
    const option = document.activeElement as HTMLElement;

    expect(option).toHaveAttribute('data-focused');
    // The ring fades in with the theme transition.
    await vi.waitFor(() => {
      expect(getComputedStyle(option).outlineWidth).toBe('1px');
    });
    expect(getComputedStyle(option).outlineOffset).toBe('-1px');
  });

  // Select renders its own list; its sections and dividers keep a hairline.
  it('spaces the options in Select sections, not the sections', async () => {
    async function measure(gap?: number) {
      const { unmount } = renderWithRoot(
        <Select aria-label="Colors" listGap={gap}>
          <Select.Section title="Warm">
            <Select.Item key="red">Red</Select.Item>
            <Select.Item key="orange">Orange</Select.Item>
          </Select.Section>
          <Select.Section title="Cool">
            <Select.Item key="blue">Blue</Select.Item>
            <Select.Item key="green">Green</Select.Item>
          </Select.Section>
        </Select>,
      );

      await userEvent.click(screen.getByRole('button'));

      const result = await vi.waitFor(() => {
        const options = rects('option');
        // Presentational inside a listbox, so found by its qa, not a role.
        const divider = screen.getByTestId('Divider').getBoundingClientRect();

        const [list] = screen.getAllByRole('listbox');

        // The popover scales while it opens.
        expect(Math.round(list.getBoundingClientRect().height)).toBe(
          list.offsetHeight,
        );

        return {
          gaps: [
            options[1].top - options[0].bottom,
            options[3].top - options[2].bottom,
          ].map(Math.round),
          aroundDivider: Math.round(divider.top - options[1].bottom),
        };
      });

      unmount();

      return result;
    }

    const byDefault = await measure();
    const spaced = await measure(8);

    expect(byDefault.gaps).toEqual([1, 1]);
    expect(spaced.gaps).toEqual([8, 8]);
    expect(spaced.aroundDivider).toBe(byDefault.aroundDivider);
  });

  describe('while dragging', () => {
    function drag(
      element: Element,
      type: string,
      data: DataTransfer,
      y: number,
    ) {
      element.dispatchEvent(
        new DragEvent(type, {
          bubbles: true,
          cancelable: true,
          dataTransfer: data,
          clientX: element.getBoundingClientRect().left + 20,
          clientY: y,
        }),
      );
    }

    /** A DataTransfer that keeps the effects React Aria sets outside a real drag. */
    function dataTransfer() {
      const data = new DataTransfer();
      const effects = { effectAllowed: 'all', dropEffect: 'none' };

      for (const name of Object.keys(effects) as (keyof typeof effects)[]) {
        Object.defineProperty(data, name, {
          get: () => effects[name],
          set: (value) => {
            effects[name] = value;
          },
        });
      }

      return data;
    }

    async function hover(list: HTMLElement, data: DataTransfer, y: number) {
      await act(async () => {
        drag(list, 'dragenter', data, y);
        drag(list, 'dragover', data, y);
      });
    }

    function indicator() {
      return document
        .querySelector('[data-drop-target] > [data-element="Indicator"]')
        ?.getBoundingClientRect();
    }

    it('centres the drop indicator in the gap, and keeps the list its height', async () => {
      renderWithRoot(
        <div style={{ width: 300 }}>
          <ListBox
            isReorderable
            aria-label="Colors"
            listGap={8}
            onReorder={() => {}}
          >
            {['Red', 'Green', 'Blue', 'Cyan'].map((color) => (
              <ListBox.Item key={color}>{color}</ListBox.Item>
            ))}
          </ListBox>
        </div>,
      );

      const list = screen.getByRole('listbox');
      const options = () =>
        Array.from(list.querySelectorAll('li[data-key]'), (option) =>
          option.getBoundingClientRect(),
        );
      const height = list.getBoundingClientRect().height;
      const data = dataTransfer();
      const red = list.querySelector('li[data-key]')!;

      await act(async () => {
        drag(red, 'dragstart', data, red.getBoundingClientRect().top + 5);
      });

      // Between Green and Blue.
      const [, green, blue, cyan] = options();

      await hover(list, data, (green.bottom + blue.top) / 2);
      await vi.waitFor(() => {
        const line = indicator()!;

        expect((line.top + line.bottom) / 2).toBeCloseTo(
          (green.bottom + blue.top) / 2,
          0,
        );
      });

      // After the last option.
      await hover(list, data, cyan.bottom - 4);
      await vi.waitFor(() => {
        expect(indicator()!.top).toBeCloseTo(options()[3].bottom - 1, 0);
      });

      expect(list.getBoundingClientRect().height).toBe(height);
    });
  });
});

describe('ListBox loose options alongside sections', () => {
  it.each([
    ['default', undefined, 1, undefined],
    ['none', '0', 0, undefined],
    ['spaced', '2x', 16, undefined],
    ['listGap', undefined, 6, 6],
  ] as const)(
    'stacks full-width loose options with %s spacing',
    async (_name, gap, spacing, listGap) => {
      renderWithRoot(
        <ListBox
          aria-label="Mixed fruit"
          width="320px"
          listStyles={{ gap }}
          listGap={listGap}
        >
          <ListBox.Item key="loose-x">Loose x</ListBox.Item>
          <ListBox.Item key="loose-y">Loose y</ListBox.Item>
          <ListBox.Section key="section" title="More fruit">
            <ListBox.Item key="pear">Pear</ListBox.Item>
            <ListBox.Item key="peach">Peach</ListBox.Item>
          </ListBox.Section>
          <ListBox.Item key="loose-a">Loose a</ListBox.Item>
          <ListBox.Item key="loose-b">Loose b</ListBox.Item>
          <ListBox.Section key="other" title="Other fruit">
            <ListBox.Item key="apple">Apple</ListBox.Item>
          </ListBox.Section>
          <ListBox.Item key="loose-c">Loose c</ListBox.Item>
          <ListBox.Item key="loose-d">Loose d</ListBox.Item>
        </ListBox>,
      );

      const pairs = [
        ['Loose x', 'Loose y'],
        ['Loose a', 'Loose b'],
        ['Loose c', 'Loose d'],
      ];
      const list = screen.getByRole('listbox');

      await waitFor(
        () => {
          const parent = list.getBoundingClientRect();

          for (const [first, second] of pairs) {
            const a = screen
              .getByRole('option', { name: first })
              .getBoundingClientRect();
            const b = screen
              .getByRole('option', { name: second })
              .getBoundingClientRect();

            expect(a.width).toBeCloseTo(parent.width, 1);
            expect(b.width).toBeCloseTo(parent.width, 1);
            expect(b.left).toBe(a.left);
            expect(b.top - a.bottom).toBeCloseTo(spacing, 1);
          }
        },
        { timeout: 1000 },
      );
    },
  );

  it('lets consumers override the loose option display and width', () => {
    renderWithRoot(
      <ListBox
        aria-label="Custom fruit"
        width="320px"
        optionStyles={{ display: 'flex', width: '140px' }}
      >
        <ListBox.Item
          key="loose"
          styles={{ display: 'inline-grid', width: '120px' }}
        >
          Loose
        </ListBox.Item>
        <ListBox.Section key="section" title="More fruit">
          <ListBox.Item key="pear">Pear</ListBox.Item>
        </ListBox.Section>
      </ListBox>,
    );

    const option = screen.getByRole('option', { name: 'Loose' });

    expect(getComputedStyle(option).display).toBe('inline-grid');
    expect(option.getBoundingClientRect().width).toBe(120);
    const inherited = screen.getByRole('option', { name: 'Pear' });
    expect(getComputedStyle(inherited).display).toBe('flex');
    expect(inherited.getBoundingClientRect().width).toBe(140);
  });
});

/**
 * A virtualized list positions its options from measured heights, and starts
 * from an estimate (32px for a medium option) for one it hasn't measured. A
 * task that ends with options at their estimates can be painted, and an option
 * taller than its estimate then overlaps the next one for a frame.
 *
 * The updates come from a timer with act() off, as a streaming parent's do:
 * act() flushes effects at once, which hides a measurement made after commit.
 * A MutationObserver reads the geometry at the end of every task that moved
 * an option, which is what the browser may paint.
 */
describe('ListBox virtualized option heights', () => {
  type Metric = { key: string; label: string };

  // Each wraps in the 180px list, so the options are taller than the estimate.
  const METRICS: Metric[] = [
    { key: 'revenue', label: 'Revenue recognised net of refunds and credits' },
    { key: 'bookings', label: 'Gross bookings before any discount is applied' },
    { key: 'arr', label: 'Annual recurring revenue across every plan' },
    { key: 'users', label: 'Monthly users who sent at least one message' },
  ];
  const PIPELINE = {
    key: 'pipeline',
    label: 'Pipeline value weighted by each stage probability',
  };
  const OTHER_METRICS: Metric[] = [
    { key: 'churn', label: 'Churn' },
    {
      key: 'expansion',
      label: 'Expansion revenue from upgrades and seat growth',
    },
    { key: 'signups', label: 'Signups' },
    {
      key: 'trials',
      label: 'Trial accounts that converted within thirty days',
    },
  ];

  // Labels wrap rather than truncate, as in Cube Cloud's question card.
  const WRAPPING = { Label: { whiteSpace: 'normal' } };

  let update: (next: (metrics: Metric[]) => Metric[]) => void = () => {};
  let commits = 0;

  function Metrics() {
    const [metrics, setMetrics] = useState(METRICS);

    useEffect(() => {
      update = setMetrics;
    });

    // Commit as slowly as a busy page does. React's scheduler then yields to
    // the browser before the passive effects, where a fast commit runs both
    // in one task.
    useLayoutEffect(() => {
      const start = performance.now();

      commits++;

      while (performance.now() - start < 8);
    });

    return (
      <div style={{ width: 180 }}>
        <ListBox aria-label="Metrics" optionStyles={WRAPPING}>
          {metrics.map((metric) => (
            <ListBox.Item key={metric.key}>{metric.label}</ListBox.Item>
          ))}
        </ListBox>
      </div>
    );
  }

  /** Resolves once three frames pass with no option moving. */
  function settled(list: Element) {
    return new Promise<void>((resolve) => {
      let quiet = 0;
      const observer = new MutationObserver(() => (quiet = 0));
      const tick = () => {
        if (++quiet === 3) {
          observer.disconnect();
          resolve();
        } else {
          requestAnimationFrame(tick);
        }
      };

      observer.observe(list, {
        attributes: true,
        childList: true,
        subtree: true,
      });
      requestAnimationFrame(tick);
    });
  }

  let actEnvironment: unknown;

  beforeEach(() => {
    actEnvironment = (globalThis as any).IS_REACT_ACT_ENVIRONMENT;
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = false;
  });

  afterEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = actEnvironment;
  });

  it('moves no option for a new array of the same options', async () => {
    renderWithRoot(<Metrics />);

    const list = screen.getByRole('listbox');

    await vi.waitFor(() => expect(gaps()).toEqual([1, 1, 1]));
    await settled(list);

    // Every write is recorded, including one undone later in the same task,
    // as dropping the measured heights would be.
    const moves: string[] = [];
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        moves.push((record.target as HTMLElement).style.transform);
      }
    });

    for (const option of screen.getAllByRole('option')) {
      observer.observe(option, { attributeFilter: ['style'] });
    }

    const before = commits;

    setTimeout(() => update((metrics) => [...metrics]));
    await vi.waitFor(() => expect(commits).toBeGreaterThan(before));
    await settled(list);
    observer.disconnect();

    expect(moves).toEqual([]);
  });

  it.each([
    [
      'a new option before the others',
      (metrics: Metric[]) => [PIPELINE, ...metrics],
    ],
    ['as many different options', () => OTHER_METRICS],
    [
      'an option growing in place',
      ([first, ...rest]: Metric[]) => [
        {
          ...first,
          label: `${first.label}, before taxes and the fees we pass on`,
        },
        ...rest,
      ],
    ],
  ])('keeps the options apart through %s', async (_, next) => {
    renderWithRoot(<Metrics />);

    const list = screen.getByRole('listbox');

    await vi.waitFor(() => expect(gaps()).toEqual([1, 1, 1]));
    await settled(list);

    // Taller than the 32px estimate plus the 1px gap, or no overlap could show.
    for (const option of screen.getAllByRole('option')) {
      expect(option.getBoundingClientRect().height).toBeGreaterThan(33);
    }

    const overlapping: number[][] = [];
    const observer = new MutationObserver(() => {
      const current = gaps();

      if (current.some((gap) => gap < 0)) overlapping.push(current);
    });

    observer.observe(list, {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
    });
    setTimeout(() => update(next));

    await vi.waitFor(() =>
      expect(
        screen.getAllByRole('option').map((option) => option.textContent),
      ).toEqual(next(METRICS).map(({ label }) => label)),
    );
    await settled(list);
    observer.disconnect();

    expect(overlapping).toEqual([]);
    expect(gaps()).toEqual(Array(next(METRICS).length - 1).fill(1));
  });
});

/**
 * A flat list renders only the options near its scroll position, so focus can
 * move to an option that is not in the document. The list has to scroll the
 * virtualizer to it, which then renders it. In a browser because jsdom has no
 * layout to scroll and its virtualizer is a mock.
 */
describe('ListBox focus outside the rendered window', () => {
  const ITEMS = Array.from({ length: 1000 }, (_, index) => ({
    key: `item-${index}`,
    label: `Item ${index}`,
  }));

  type Props = Partial<ComponentProps<typeof ListBox>>;

  function renderList(props: Props = {}) {
    renderWithRoot(
      <ListBox aria-label="Items" height="30x" items={ITEMS} {...props}>
        {(item: (typeof ITEMS)[number]) => (
          <ListBox.Item key={item.key}>{item.label}</ListBox.Item>
        )}
      </ListBox>,
    );
  }

  /** Whether the option lies wholly inside its list's scroll viewport. */
  function isInView(option: HTMLElement) {
    const scroller = option.closest('[role="listbox"]')!.parentElement!;
    const box = option.getBoundingClientRect();
    const viewport = scroller.getBoundingClientRect();

    return box.top >= viewport.top - 1 && box.bottom <= viewport.bottom + 1;
  }

  async function expectFocusedInView(name: string) {
    await waitFor(
      () => {
        const option = screen.getByRole('option', { name });

        expect(option).toHaveFocus();
        expect(isInView(option)).toBe(true);
      },
      { timeout: 3000 },
    );
  }

  it.each([
    ['{End}', 'Item 999'],
    ['{End}{Home}', 'Item 0'],
  ])('scrolls to the option %s moves focus to', async (keys, name) => {
    renderList();

    await userEvent.click(screen.getByRole('option', { name: 'Item 0' }));

    expect(screen.queryByRole('option', { name: 'Item 999' })).toBeNull();

    await userEvent.keyboard(keys);

    await expectFocusedInView(name);
  });

  it('keeps paging down past the rendered window', async () => {
    renderList();

    await userEvent.click(screen.getByRole('option', { name: 'Item 0' }));

    for (let page = 0; page < 5; page++) {
      await userEvent.keyboard('{PageDown}');
    }

    await waitFor(
      () => {
        const focused = document.activeElement as HTMLElement;

        expect(focused).toHaveAttribute('role', 'option');
        // Five pages of a list showing about seven options.
        expect(Number(focused.dataset.index)).toBeGreaterThan(20);
        expect(isInView(focused)).toBe(true);
      },
      { timeout: 3000 },
    );
  });

  it('scrolls to the selected option it focuses when it mounts', async () => {
    renderList({ autoFocus: true, defaultSelectedKey: 'item-500' });

    await expectFocusedInView('Item 500');
  });

  it('scrolls to the selected option it focuses when tabbed into', async () => {
    renderWithRoot(
      <>
        <button>Before</button>
        <ListBox
          aria-label="Items"
          height="30x"
          items={ITEMS}
          defaultSelectedKey="item-700"
        >
          {(item: (typeof ITEMS)[number]) => (
            <ListBox.Item key={item.key}>{item.label}</ListBox.Item>
          )}
        </ListBox>
      </>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Before' }));
    await userEvent.tab();

    await expectFocusedInView('Item 700');
  });
});

/**
 * A mouse press picks the option it started on (CUB-5598).
 *
 * The list selects on press up, and React Aria then picks whatever option the
 * pointer comes up over, or none. When the list moves between press and
 * release, as it does while a popover is still animating in, that is a
 * neighbour. In a browser because it depends on real option boxes.
 */
describe('ListBox press on a list that moves', () => {
  function mouse(type: string, target: Element, x: number, y: number) {
    target.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        composed: true,
        pointerId: 1,
        pointerType: 'mouse',
        isPrimary: true,
        button: 0,
        buttons: type === 'pointerdown' ? 1 : 0,
        clientX: x,
        clientY: y,
      }),
    );
  }

  function renderFruits(focusOnHover: boolean) {
    const onSelectionChange = vi.fn();

    renderWithRoot(
      <ListBox
        aria-label="Fruits"
        selectionMode="single"
        focusOnHover={focusOnHover}
        onSelectionChange={onSelectionChange}
      >
        <ListBox.Item key="apple">Apple</ListBox.Item>
        <ListBox.Item key="banana">Banana</ListBox.Item>
        <ListBox.Item key="cherry">Cherry</ListBox.Item>
      </ListBox>,
    );

    const apple = screen.getByRole('option', { name: 'Apple' });
    const box = apple.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;

    // Moves the list up by one option, so Banana sits where Apple was.
    const shiftList = () => {
      screen.getByRole('listbox').style.transform =
        `translateY(-${box.height}px)`;
    };

    return { apple, box, x, y, shiftList, onSelectionChange };
  }

  describe.each([
    ['with focusOnHover', true],
    ['without focusOnHover', false],
  ])('%s', (_name, focusOnHover) => {
    it('selects the option the press started on when the list moved', async () => {
      const { apple, x, y, shiftList, onSelectionChange } =
        renderFruits(focusOnHover);

      mouse('pointerdown', apple, x, y);
      shiftList();

      const under = document.elementFromPoint(x, y);

      expect(under?.closest('[role="option"]')).toBe(
        screen.getByRole('option', { name: 'Banana' }),
      );

      mouse('pointerup', under!, x, y);

      await waitFor(() => {
        expect(apple).toHaveAttribute('aria-selected', 'true');
      });
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(
        screen.getByRole('option', { name: 'Banana' }),
      ).not.toHaveAttribute('aria-selected', 'true');
    });

    it('selects nothing when released outside the pressed option', async () => {
      const { apple, box, x, y, onSelectionChange } =
        renderFruits(focusOnHover);
      const cherry = screen.getByRole('option', { name: 'Cherry' });

      mouse('pointerdown', apple, x, y);
      mouse('pointerup', cherry, x, y + box.height * 2);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      expect(onSelectionChange).not.toHaveBeenCalled();
    });

    it('selects nothing after Escape during the press', async () => {
      const { apple, x, y, shiftList, onSelectionChange } =
        renderFruits(focusOnHover);

      mouse('pointerdown', apple, x, y);
      shiftList();
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      );
      mouse('pointerup', document.elementFromPoint(x, y)!, x, y);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      expect(onSelectionChange).not.toHaveBeenCalled();
    });

    it('selects a still option once', async () => {
      const { apple, x, y, onSelectionChange } = renderFruits(focusOnHover);

      mouse('pointerdown', apple, x, y);
      mouse('pointerup', apple, x, y);

      await waitFor(() => {
        expect(apple).toHaveAttribute('aria-selected', 'true');
      });
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
    });
  });
});
