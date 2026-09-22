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
