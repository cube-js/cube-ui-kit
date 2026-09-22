import { renderWithRoot, screen } from '../../../test';
import { Text } from '../Text';

import { Item } from './Item';

/**
 * `Item`'s grid sets `gap: 0`, and `Label` drops its own inline padding for ANY
 * start or end content. So a `prefix` / `suffix` sits flush against the label,
 * while the same glyph in the `icon` slot looks spaced — that slot is a
 * `$size`-wide square which centres a smaller glyph.
 *
 * Flush is right for most content, because a prefix or suffix is usually a box
 * that carries its own presence: a checkbox in a `Tree` node, a kbd chip, a
 * badge. It is wrong for a BARE GLYPH, which is what CUB-4616 reports. Rather
 * than pick one and break the other, the spacing is a token the call site sets.
 *
 * jsdom lays nothing out, so this is only observable in a real browser.
 */
describe('Item start/end slot spacing', () => {
  function gapBetween(left: Element, right: Element) {
    return (
      right.getBoundingClientRect().left - left.getBoundingClientRect().right
    );
  }

  it('leaves no prefix gap by default', async () => {
    renderWithRoot(
      <Item qa="Default" prefix={<Text qa="Glyph">#</Text>}>
        <Text qa="Label">Revenue</Text>
      </Item>,
    );

    const gap = gapBetween(
      await screen.findByTestId('Glyph'),
      await screen.findByTestId('Label'),
    );

    expect(gap).toBe(0);
  });

  it('applies $prefix-gap when the call site sets it', async () => {
    renderWithRoot(
      <Item
        qa="Opted"
        styles={{ '$prefix-gap': '1x' }}
        prefix={<Text qa="Glyph">#</Text>}
      >
        <Text qa="Label">Revenue</Text>
      </Item>,
    );

    const gap = gapBetween(
      await screen.findByTestId('Glyph'),
      await screen.findByTestId('Label'),
    );

    expect(gap).toBeGreaterThan(0);
  });

  it('applies $prefix-gap next to an icon too, where the leading padding is dropped', async () => {
    renderWithRoot(
      <Item
        qa="WithIcon"
        styles={{ '$prefix-gap': '1x' }}
        icon={<Text>@</Text>}
        prefix={<Text qa="Glyph">#</Text>}
      >
        <Text qa="Label">Revenue</Text>
      </Item>,
    );

    const gap = gapBetween(
      await screen.findByTestId('Glyph'),
      await screen.findByTestId('Label'),
    );

    expect(gap).toBeGreaterThan(0);
  });

  it('leaves no suffix gap by default', async () => {
    renderWithRoot(
      <Item qa="DefaultSuffix" suffix={<Text qa="Glyph">42</Text>}>
        <Text qa="Label">Revenue</Text>
      </Item>,
    );

    const gap = gapBetween(
      await screen.findByTestId('Label'),
      await screen.findByTestId('Glyph'),
    );

    expect(gap).toBe(0);
  });

  it('applies $suffix-gap when the call site sets it', async () => {
    renderWithRoot(
      <Item
        qa="OptedSuffix"
        styles={{ '$suffix-gap': '1x' }}
        suffix={<Text qa="Glyph">42</Text>}
      >
        <Text qa="Label">Revenue</Text>
      </Item>,
    );

    const gap = gapBetween(
      await screen.findByTestId('Label'),
      await screen.findByTestId('Glyph'),
    );

    expect(gap).toBeGreaterThan(0);
  });

  it('keeps the outer gutters the tokens must not disturb', async () => {
    renderWithRoot(
      <Item
        qa="Gutters"
        styles={{ '$prefix-gap': '1x', '$suffix-gap': '1x' }}
        prefix={<Text qa="Pfx">#</Text>}
        suffix={<Text qa="Sfx">42</Text>}
      >
        <Text>Revenue</Text>
      </Item>,
    );

    const item = (await screen.findByTestId('Gutters')).getBoundingClientRect();
    const prefix = (await screen.findByTestId('Pfx')).getBoundingClientRect();
    const suffix = (await screen.findByTestId('Sfx')).getBoundingClientRect();

    expect(prefix.left - item.left).toBeGreaterThan(0);
    expect(item.right - suffix.right).toBeGreaterThan(0);
  });
});
