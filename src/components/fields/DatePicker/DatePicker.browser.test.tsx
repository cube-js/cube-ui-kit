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

  it.each([false, true])(
    'applies the width style prop with isBare=%s',
    async (isBare) => {
      renderWithRoot(
        <div style={{ width: 400 }}>
          <Field
            isBare={isBare}
            aria-label={name}
            qa="DateControl"
            width="100%"
          />
        </div>,
      );

      const root = await screen.findByTestId('DateControl');

      expect(root.getBoundingClientRect().width).toBeCloseTo(400, 0);
    },
  );

  it.each([false, true])(
    'applies the styles prop with isBare=%s',
    async (isBare) => {
      renderWithRoot(
        <div style={{ width: 400 }}>
          <Field
            isBare={isBare}
            aria-label={name}
            qa="DateControl"
            styles={{ width: '100%' }}
          />
        </div>,
      );

      const root = await screen.findByTestId('DateControl');

      expect(root.getBoundingClientRect().width).toBeCloseTo(400, 0);
    },
  );

  it('lets a style prop override the styles prop on a bare picker', async () => {
    // `extractStyles` folds `styles` in first and lets the individual style
    // props override it. Re-applying `styles` on top of the extracted object
    // inverts that and makes these three disagree with every other component.
    renderWithRoot(
      <div style={{ width: 400 }}>
        <Field
          isBare
          aria-label={name}
          qa="DateControl"
          width="100%"
          styles={{ width: '50%' }}
        />
      </div>,
    );

    const root = await screen.findByTestId('DateControl');

    expect(root.getBoundingClientRect().width).toBeCloseTo(400, 0);
  });

  it('keeps wrapperStyles winning over both on a bare picker', async () => {
    renderWithRoot(
      <div style={{ width: 400 }}>
        <Field
          isBare
          aria-label={name}
          qa="DateControl"
          width="25%"
          wrapperStyles={{ width: '50%' }}
        />
      </div>,
    );

    const root = await screen.findByTestId('DateControl');

    expect(root.getBoundingClientRect().width).toBeCloseTo(200, 0);
  });

  it.each([
    ['styles', { styles: { width: '50%' } }],
    ['wrapperStyles', { wrapperStyles: { width: '50%' } }],
  ])(
    'sizes the field with a style prop and the picker with %s',
    async (_, inputStyles) => {
      // In a field the style prop sizes the field; `styles` and
      // `wrapperStyles` still size the picker, now inside that field.
      renderWithRoot(
        <div style={{ width: 400 }}>
          <Field
            isBare={false}
            aria-label={name}
            qa="DateControl"
            width="100%"
            {...inputStyles}
          />
        </div>,
      );

      const root = await screen.findByTestId('DateControl');
      const field = root.closest('[data-qa="Field"]') as HTMLElement;

      expect(field.getBoundingClientRect().width).toBeCloseTo(400, 0);
      expect(root.getBoundingClientRect().width).toBeCloseTo(200, 0);
    },
  );
});
