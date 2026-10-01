import { ComponentProps } from 'react';

import { act, renderWithRoot, screen, userEvent } from '../../../test';
import { Select } from '../Select/Select';

import { ListBox } from './ListBox';

/**
 * What the list lets out, and what it keeps (CUB-4839).
 *
 * `Escape` has to leave so a surrounding overlay can close on it. Nothing else
 * may follow it out: ancestors run shortcuts off plain keys, and a list that
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

/**
 * `listGap` spaces the options however the list lays them out. In a browser
 * because a flat list is the virtualizer's arithmetic, not CSS: it positions
 * its options absolutely, so their margins space nothing and the virtualizer
 * has to add the gap itself. The other layouts are margins jsdom cannot lay out.
 */
describe('ListBox listGap', () => {
  const COLORS = ['Red', 'Green', 'Blue'];

  function rects(role: string) {
    return screen
      .queryAllByRole(role)
      .map((element) => element.getBoundingClientRect());
  }

  function gaps() {
    const options = rects('option');

    return options
      .slice(1)
      .map((option, index) => Math.round(option.top - options[index].bottom));
  }

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
        const [divider] = rects('separator');

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
