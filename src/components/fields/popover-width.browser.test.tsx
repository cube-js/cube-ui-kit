import { page } from 'vitest/browser';

import { renderWithRoot, screen, userEvent, waitFor } from '../../test';
import { Text } from '../content/Text';

import { ComboBox } from './ComboBox/ComboBox';
import { FilterPicker } from './FilterPicker/FilterPicker';
import { Picker } from './Picker/Picker';

/**
 * A picker's popover sizes to its options (`popover-width.ts`). A flat list is
 * virtualized, and its options used to be placed absolutely, so they gave the
 * popover no width: it sat at its `30x` floor and cut long labels and block
 * descriptions. On a phone the `50vw` cap was under that floor too.
 *
 * In a browser because the assertions are about layout.
 */

// Other specs in this project assume the default 414x896.
afterEach(async () => {
  await page.viewport(414, 896);
});

const HINT = 'Each deployment’s account time zone';
const LONG = 'A much longer option label that needs the room';

/** Many short options, then a long one far below the fold. */
const ITEMS = [
  ...Array.from({ length: 100 }, (_, i) => ({
    key: `k${i}`,
    label: `Item ${i}`,
  })),
  { key: 'long', label: LONG },
];

function rect(element: Element) {
  return element.getBoundingClientRect();
}

/** Whether an element's text is cut: its content is wider than its box. */
function isCut(element: Element) {
  return element.scrollWidth > element.clientWidth;
}

function labelOf(text: string) {
  return screen.getByText(text).closest('[data-element="Label"]')!;
}

async function openFilterPicker(props: object) {
  renderWithRoot(
    <FilterPicker aria-label="Time zone" placeholder="Pick" {...props} />,
  );
  await userEvent.click(screen.getByRole('button', { name: /time zone/i }));

  return screen.findByRole('dialog');
}

// The cap: the viewport less a margin on a phone, half of it on a wide screen.
describe.each([
  [390, 664, 374],
  [1280, 800, 640],
])('picker popover at %i px', (width, height, cap) => {
  it('stops at its cap, inside the viewport', async () => {
    await page.viewport(width, height);

    renderWithRoot(
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 16 }}>
        <FilterPicker aria-label="Time zone" placeholder="Pick">
          <FilterPicker.Item key="long">{LONG.repeat(4)}</FilterPicker.Item>
        </FilterPicker>
      </div>,
    );
    await userEvent.click(screen.getByRole('button', { name: /time zone/i }));
    const popover = await screen.findByRole('dialog');

    expect(getComputedStyle(popover).maxWidth).toBe(`${cap}px`);
    await waitFor(() =>
      expect(rect(popover).width).toBeGreaterThanOrEqual(cap),
    );
    expect(rect(popover).left).toBeGreaterThanOrEqual(0);
    expect(rect(popover).right).toBeLessThanOrEqual(window.innerWidth);
  });

  it('shows a long label and a block description in full, inside the viewport', async () => {
    await page.viewport(width, height);

    // At the right edge, where a wide popover has to move left to fit.
    renderWithRoot(
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 16 }}>
        <FilterPicker aria-label="Time zone" placeholder="Pick">
          {[
            <FilterPicker.Item
              key="default"
              description={HINT}
              descriptionPlacement="block"
            >
              Deployment default
            </FilterPicker.Item>,
            ...Array.from({ length: 60 }, (_, i) => (
              <FilterPicker.Item
                key={`z${i}`}
                suffix={<Text preset="t4">GMT+05:30</Text>}
              >
                {`America/Argentina/Rio_Gallegos_${i}`}
              </FilterPicker.Item>
            )),
          ]}
        </FilterPicker>
      </div>,
    );
    await userEvent.click(screen.getByRole('button', { name: /time zone/i }));
    const popover = await screen.findByRole('dialog');

    await waitFor(() => {
      expect(
        isCut(screen.getByText(HINT).closest('[data-element="Description"]')!),
      ).toBe(false);
      expect(isCut(labelOf('America/Argentina/Rio_Gallegos_0'))).toBe(false);
    });
    expect(rect(popover).left).toBeGreaterThanOrEqual(0);
    expect(rect(popover).right).toBeLessThanOrEqual(window.innerWidth);
  });
});

describe('picker popover width', () => {
  beforeEach(async () => {
    await page.viewport(1280, 800);
  });

  it('counts a long option far below the fold, and holds the width while scrolling and filtering', async () => {
    const popover = await openFilterPicker({
      items: ITEMS,
      children: (item: (typeof ITEMS)[number]) => (
        <FilterPicker.Item key={item.key}>{item.label}</FilterPicker.Item>
      ),
    });

    await waitFor(() => expect(isCut(labelOf(LONG))).toBe(false));
    const openWidth = rect(popover).width;
    const list = screen.getByRole('listbox');
    const scrollElement = list.parentElement!;

    scrollElement.scrollTop = scrollElement.scrollHeight;
    await waitFor(() => expect(screen.getByText('Item 99')).toBeVisible());
    expect(rect(popover).width).toBe(openWidth);

    scrollElement.scrollTop = 0;
    await waitFor(() => expect(screen.getByText('Item 0')).toBeVisible());
    expect(rect(popover).width).toBe(openWidth);

    // Only short options match.
    await userEvent.keyboard('Item 1');
    await waitFor(() => expect(screen.queryByText(LONG)).toBeNull());
    expect(rect(popover).width).toBe(openWidth);
  });

  it('holds the width of a reorderable list when a search starts', async () => {
    const popover = await openFilterPicker({
      isReorderable: true,
      items: ITEMS,
      children: (item: (typeof ITEMS)[number]) => (
        <FilterPicker.Item key={item.key}>{item.label}</FilterPicker.Item>
      ),
    });

    await waitFor(() => expect(isCut(labelOf(LONG))).toBe(false));
    const openWidth = rect(popover).width;

    // Searching, the list is no longer reorderable, and only short options
    // match.
    await userEvent.keyboard('Item 1');
    await waitFor(() => expect(screen.queryByText(LONG)).toBeNull());
    expect(rect(popover).width).toBe(openWidth);
  });

  it('holds the width of a list with sections while filtering', async () => {
    const popover = await openFilterPicker({
      children: [
        <FilterPicker.Section key="short" title="Short">
          <FilterPicker.Item key="a">Item 1</FilterPicker.Item>
        </FilterPicker.Section>,
        <FilterPicker.Section key="long" title="Long">
          <FilterPicker.Item key="b">{LONG}</FilterPicker.Item>
        </FilterPicker.Section>,
      ],
    });

    await waitFor(() => expect(isCut(labelOf(LONG))).toBe(false));
    const openWidth = rect(popover).width;

    await userEvent.keyboard('Item 1');
    await waitFor(() => expect(screen.queryByText(LONG)).toBeNull());
    expect(rect(popover).width).toBe(openWidth);
  });

  it('counts a long row far below the fold in tree mode, and holds the width while searching', async () => {
    const popover = await openFilterPicker({
      treeData: ITEMS.map((item) => ({ key: item.key, title: item.label })),
    });

    await waitFor(() => expect(isCut(labelOf(LONG))).toBe(false));
    const openWidth = rect(popover).width;

    // Nothing matches, so the empty label replaces the tree.
    await userEvent.keyboard('zzz');
    await waitFor(() => expect(screen.queryByRole('treegrid')).toBeNull());
    expect(rect(popover).width).toBe(openWidth);

    // Only short rows match.
    await userEvent.keyboard('{Backspace}{Backspace}{Backspace}Item 1');
    await waitFor(() => expect(screen.getByRole('treegrid')).toBeVisible());
    expect(rect(popover).width).toBe(openWidth);
  });

  it('counts a long option far below the fold in Picker', async () => {
    renderWithRoot(
      <Picker aria-label="Pick" placeholder="Pick" items={ITEMS}>
        {(item) => <Picker.Item key={item.key}>{item.label}</Picker.Item>}
      </Picker>,
    );
    await userEvent.click(screen.getByRole('button', { name: /pick/i }));
    await screen.findByRole('dialog');

    await waitFor(() => expect(isCut(labelOf(LONG))).toBe(false));
  });

  it('counts a long option far below the fold in ComboBox', async () => {
    renderWithRoot(
      <ComboBox aria-label="Pick" width="20x" items={ITEMS}>
        {(item) => <ComboBox.Item key={item.key}>{item.label}</ComboBox.Item>}
      </ComboBox>,
    );
    await userEvent.click(screen.getByRole('button'));
    await screen.findByRole('listbox');

    await waitFor(() => expect(isCut(labelOf(LONG))).toBe(false));
  });
});
