import { renderWithRoot, screen } from '../../../test';
import { Text } from '../Text';

import { Item } from './Item';

/**
 * `Item`'s grid sets `gap: 0`, and `Label` drops its own left padding for ANY
 * start content — including a prefix. The `Prefix` slot only had a LEADING
 * padding, so nothing was left between a prefix glyph and the label and the two
 * rendered flush. The same glyph in the `Icon` slot looks spaced because that
 * slot is a `$size`-wide square that centres a smaller glyph, which is why two
 * sibling pickers using the same renderers disagreed visually.
 *
 * jsdom lays nothing out, so the gap is only observable in a real browser.
 */
describe('Item start-slot spacing', () => {
  function gapBetween(left: Element, right: Element) {
    return (
      right.getBoundingClientRect().left - left.getBoundingClientRect().right
    );
  }

  it('spaces a prefix glyph off the label', async () => {
    renderWithRoot(
      <Item qa="WithPrefix" prefix={<Text qa="Glyph">#</Text>}>
        <Text qa="Label">Revenue</Text>
      </Item>,
    );

    const gap = gapBetween(
      await screen.findByTestId('Glyph'),
      await screen.findByTestId('Label'),
    );

    expect(gap).toBeGreaterThan(0);
  });

  it('spaces a suffix glyph off the label', async () => {
    renderWithRoot(
      <Item qa="WithSuffix" suffix={<Text qa="Glyph">42</Text>}>
        <Text qa="Label">Revenue</Text>
      </Item>,
    );

    const gap = gapBetween(
      await screen.findByTestId('Label'),
      await screen.findByTestId('Glyph'),
    );

    expect(gap).toBeGreaterThan(0);
  });

  it('keeps the suffix gap next to a right icon, where the outer padding is dropped', async () => {
    renderWithRoot(
      <Item
        qa="SuffixAndIcon"
        suffix={<Text qa="Glyph">42</Text>}
        rightIcon={<Text>@</Text>}
      >
        <Text qa="Label">Revenue</Text>
      </Item>,
    );

    const gap = gapBetween(
      await screen.findByTestId('Label'),
      await screen.findByTestId('Glyph'),
    );

    // The trailing padding yields to the right icon's own slot, as before; the
    // leading gap to the label is a separate concern and stays.
    expect(gap).toBeGreaterThan(0);
  });

  it('keeps the suffix inside the item gutter', async () => {
    renderWithRoot(
      <Item qa="Gutter" suffix={<Text qa="Glyph">42</Text>}>
        <Text>Revenue</Text>
      </Item>,
    );

    const item = (await screen.findByTestId('Gutter')).getBoundingClientRect();
    const glyph = (await screen.findByTestId('Glyph')).getBoundingClientRect();

    // The outer gutter is unchanged by the leading gap added above.
    expect(item.right - glyph.right).toBeGreaterThan(0);
  });

  it('keeps the gap when an icon is present too', async () => {
    renderWithRoot(
      <Item qa="Both" icon={<Text>@</Text>} prefix={<Text qa="Glyph">#</Text>}>
        <Text qa="Label">Revenue</Text>
      </Item>,
    );

    const gap = gapBetween(
      await screen.findByTestId('Glyph'),
      await screen.findByTestId('Label'),
    );

    expect(gap).toBeGreaterThan(0);
  });
});
