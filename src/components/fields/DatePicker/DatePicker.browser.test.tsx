import { renderWithRoot, screen } from '../../../test';

import { DatePicker } from './DatePicker';
import { DateRangePicker } from './DateRangePicker';
import { DateRangeSeparatedPicker } from './DateRangeSeparatedPicker';

/**
 * All three date pickers declare `ContainerStyleProps` and `styles` on their
 * public types, computed `extractStyles(props, CONTAINER_STYLES)` — and then
 * dropped the result on the floor, forwarding only `wrapperStyles` to the root.
 * So `<DateRangeSeparatedPicker width="100%" />` type-checked, reviewed clean
 * and did nothing; the only way to find out was to read the dist.
 *
 * The assertion is a width, so it needs real layout.
 */
describe.each([
  ['DatePicker', DatePicker],
  ['DateRangePicker', DateRangePicker],
  ['DateRangeSeparatedPicker', DateRangeSeparatedPicker],
] as const)('<%s /> container styles', (name, Component) => {
  const Field = Component as any;

  it('applies the width style prop', async () => {
    renderWithRoot(
      <div style={{ width: 400 }}>
        <Field aria-label={name} qa="Field" width="100%" />
      </div>,
    );

    const root = await screen.findByTestId('Field');

    expect(root.getBoundingClientRect().width).toBeCloseTo(400, 0);
  });

  it('applies the styles prop', async () => {
    renderWithRoot(
      <div style={{ width: 400 }}>
        <Field aria-label={name} qa="Field" styles={{ width: '100%' }} />
      </div>,
    );

    const root = await screen.findByTestId('Field');

    expect(root.getBoundingClientRect().width).toBeCloseTo(400, 0);
  });

  it('keeps wrapperStyles winning over both', async () => {
    renderWithRoot(
      <div style={{ width: 400 }}>
        <Field
          aria-label={name}
          qa="Field"
          width="25%"
          wrapperStyles={{ width: '50%' }}
        />
      </div>,
    );

    const root = await screen.findByTestId('Field');

    expect(root.getBoundingClientRect().width).toBeCloseTo(200, 0);
  });
});
