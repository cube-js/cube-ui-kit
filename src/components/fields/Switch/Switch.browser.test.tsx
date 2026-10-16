import { renderWithRoot, screen } from '../../../test';
import { Text } from '../../content/Text';

import { Switch } from './Switch';

const LONG_LABEL =
  'Clear the data it wrote into Quarterly Revenue Detail A1 through C6';

/**
 * Children used to go through `<Text nowrap>`, and `white-space: nowrap`
 * inherits: no label could wrap, so a long one ran out of its container. A
 * layout fact, so it needs a real browser.
 */
describe('Switch label', () => {
  it.each([
    ['string', LONG_LABEL],
    ['custom node', <Text key="label">{LONG_LABEL}</Text>],
  ])('wraps a long %s label instead of overflowing', async (_, label) => {
    renderWithRoot(
      <div style={{ width: 300 }}>
        <Switch>{label}</Switch>
      </div>,
    );

    const wrapper = await screen.findByTestId('SwitchWrapper');

    expect(wrapper.getBoundingClientRect().width).toBeLessThanOrEqual(300);
    expect(wrapper.getBoundingClientRect().height).toBeGreaterThan(30);
  });
});
