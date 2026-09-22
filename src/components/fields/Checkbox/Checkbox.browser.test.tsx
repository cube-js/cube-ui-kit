import { renderWithRoot, screen } from '../../../test';
import { Text } from '../../content/Text';

import { Checkbox } from './Checkbox';
import { CheckboxGroup } from './CheckboxGroup';

const LONG_LABEL =
  'Clear the data it wrote into Quarterly Revenue Detail A1 through C6';

/**
 * `Checkbox` renders two different trees depending on whether it sits inside a
 * `CheckboxGroup`, and the standalone one used to lose two things: `styles` was
 * extracted from props and then never forwarded, and children were forced
 * through `<Text nowrap>`. `white-space: nowrap` inherits, so a standalone
 * checkbox could not have a wrapping label AND could not be told to have one
 * from the call site.
 *
 * Both are layout facts, so they need a real browser.
 */
describe('standalone Checkbox label', () => {
  it('wraps a long label instead of overflowing, like a grouped one', async () => {
    renderWithRoot(
      <div style={{ width: 300 }}>
        <Checkbox>
          <Text qa="Label">{LONG_LABEL}</Text>
        </Checkbox>
      </div>,
    );

    const label = await screen.findByTestId('Label');

    expect(getComputedStyle(label).whiteSpace).not.toBe('nowrap');
    expect(label.getBoundingClientRect().width).toBeLessThanOrEqual(300);
  });

  it('matches the grouped branch for the same label and width', async () => {
    renderWithRoot(
      <>
        <div style={{ width: 300 }}>
          <Checkbox>
            <Text qa="Standalone">{LONG_LABEL}</Text>
          </Checkbox>
        </div>
        <div style={{ width: 300 }}>
          <CheckboxGroup aria-label="Group">
            <Checkbox value="a">
              <Text qa="Grouped">{LONG_LABEL}</Text>
            </Checkbox>
          </CheckboxGroup>
        </div>
      </>,
    );

    const standalone = (
      await screen.findByTestId('Standalone')
    ).getBoundingClientRect();
    const grouped = (
      await screen.findByTestId('Grouped')
    ).getBoundingClientRect();

    expect(standalone.width).toBeCloseTo(grouped.width, 0);
    expect(standalone.height).toBeCloseTo(grouped.height, 0);
  });

  it('forwards styles to the wrapper', async () => {
    renderWithRoot(
      <div style={{ width: 300 }}>
        <Checkbox qa="Styled" styles={{ width: '100%' }}>
          <Text>Label</Text>
        </Checkbox>
      </div>,
    );

    const wrapper = await screen.findByTestId('CheckboxWrapper');

    expect(wrapper.getBoundingClientRect().width).toBeCloseTo(300, 0);
  });
});
