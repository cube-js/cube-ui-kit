import { renderWithRoot, screen, userEvent } from '../../../test';
import { Button } from '../../actions/Button/Button';

import { FilterPicker } from './FilterPicker';

/**
 * The empty row renders `emptyLabel`, a `ReactNode`, as an `Item` label, which
 * is one line with an ellipsis. A long message was cut, and an action in it
 * landed outside the popover, out of reach. The empty row's label wraps now.
 *
 * In a browser because the assertions are about layout.
 */
const MESSAGE =
  'Die Mitglieder dieser Gruppe konnten nicht geladen werden, bitte versuche es später noch einmal.';

const MODES = [
  ['list', { items: [] }],
  ['tree', { treeData: [] }],
] as const;

function rect(element: Element) {
  return element.getBoundingClientRect();
}

async function open(emptyLabel: React.ReactNode, props: object) {
  renderWithRoot(
    <FilterPicker
      aria-label="Groups"
      placeholder="Pick"
      width="30x"
      emptyLabel={emptyLabel}
      {...props}
    />,
  );

  await userEvent.click(screen.getByRole('button', { name: /groups/i }));

  return screen.findByRole('dialog');
}

describe.each(MODES)('<FilterPicker /> %s mode empty state', (_, props) => {
  it('wraps a long message to the popover width', async () => {
    const popover = await open(MESSAGE, props);
    const label = (await screen.findByText(MESSAGE)).closest(
      '[data-element="Label"]',
    )!;

    expect(getComputedStyle(label).whiteSpace).toBe('normal');
    // Nothing is cut: the label's content fits its box.
    expect(label.scrollWidth).toBeLessThanOrEqual(label.clientWidth);
    expect(rect(label).right).toBeLessThanOrEqual(rect(popover).right);
  });

  it('keeps an action in the message inside the popover', async () => {
    const popover = await open(
      <>
        {MESSAGE} <Button type="link">Erneut versuchen</Button>
      </>,
      props,
    );
    // By text: ListBox reads the empty row as the list's description, so it
    // hides the row itself from the accessibility tree.
    const retry = (await screen.findByText('Erneut versuchen')).closest(
      'button',
    )!;

    expect(rect(retry).left).toBeGreaterThanOrEqual(rect(popover).left);
    expect(rect(retry).right).toBeLessThanOrEqual(rect(popover).right);
  });

  it('keeps a short default on one row', async () => {
    await open(undefined, props);
    const label = (await screen.findByText('No items')).closest(
      '[data-element="Label"]',
    )!;
    const lineHeight = parseFloat(getComputedStyle(label).lineHeight);

    expect(label.getBoundingClientRect().height).toBeLessThan(lineHeight * 2);
  });
});
