import { render } from '../../test';

import { Text } from './Text';
import { Title } from './Title';

/**
 * `Text` dropped its `block` prop and `Title` its `inline` prop; `display` is the
 * replacement for both. These pin that it actually works, and that `ellipsis`
 * still forces block on its own — it used to share a state-map branch with the
 * `block` mod (`'ellipsis | block'`), so folding that branch back to `ellipsis`
 * alone is the part most likely to regress.
 */
describe('display prop', () => {
  const displayOf = (el: HTMLElement) => getComputedStyle(el).display;

  it('Text accepts display="block", replacing the old `block` prop', () => {
    const { getByTestId } = render(<Text display="block">hi</Text>);
    expect(displayOf(getByTestId('Text'))).toBe('block');
  });

  it('Text defaults to inline', () => {
    const { getByTestId } = render(<Text>hi</Text>);
    expect(displayOf(getByTestId('Text'))).toBe('inline');
  });

  it('Title accepts display="inline", replacing the old `inline` prop', () => {
    const { getByTestId } = render(<Title display="inline">hi</Title>);
    expect(displayOf(getByTestId('Title'))).toBe('inline');
  });

  it('Title defaults to block', () => {
    const { getByTestId } = render(<Title>hi</Title>);
    expect(displayOf(getByTestId('Title'))).toBe('block');
  });

  it('Text ellipsis still forces block', () => {
    const { getByTestId } = render(<Text ellipsis>hi</Text>);
    expect(displayOf(getByTestId('Text'))).toBe('block');
  });
});
