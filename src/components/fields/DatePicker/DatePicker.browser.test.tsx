import { cleanup, renderWithRoot, screen, within } from '../../../test';

import { DatePicker } from './DatePicker';
import { DateRangePicker } from './DateRangePicker';
import { DateRangeSeparatedPicker } from './DateRangeSeparatedPicker';
import { parseAbsoluteDate } from './parseDate';

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

const RANGE = {
  start: parseAbsoluteDate(new Date('2020-09-10')),
  end: parseAbsoluteDate(new Date('2021-04-01')),
};

function rect(element: Element) {
  return element.getBoundingClientRect();
}

function expectInside(inner: Element, outer: Element) {
  const box = rect(outer);
  const { left, top, right, bottom } = rect(inner);

  expect(left).toBeGreaterThanOrEqual(box.left - 0.5);
  expect(top).toBeGreaterThanOrEqual(box.top - 0.5);
  expect(right).toBeLessThanOrEqual(box.right + 0.5);
  expect(bottom).toBeLessThanOrEqual(box.bottom + 0.5);
}

/**
 * A range laid out on one row ran out of any container narrower than that
 * row: the inputs keep their width, and nothing else gave. Too narrow for one
 * row, the end date now wraps under the start date, and the dash stays at the
 * end of the first row.
 */
describe('<DateRangeSeparatedPicker /> in a narrow container', () => {
  function renderPicker(width: number, props: Record<string, unknown> = {}) {
    renderWithRoot(
      <div style={{ width }}>
        <DateRangeSeparatedPicker
          isBare
          aria-label="Range"
          qa="Range"
          defaultValue={RANGE}
          {...props}
        />
      </div>,
    );

    const picker = screen.getByTestId('Range');
    const [start, end] = screen.getAllByTestId('DateTimeInput');

    return { picker, start, end, dash: screen.getByTestId('DateRangeDash') };
  }

  it('keeps one row when there is room for it', () => {
    const { picker, start, end, dash } = renderPicker(400);

    expect(rect(end).top).toBeCloseTo(rect(start).top, 0);
    expect(rect(dash).left).toBeCloseTo(rect(start).right, 0);
    expect(rect(end).left).toBeCloseTo(rect(dash).right, 0);
    expect(rect(picker).height).toBeCloseTo(rect(start).height, 0);
  });

  it('wraps the end box under the start box', () => {
    const { picker, start, end, dash } = renderPicker(200);

    expect(rect(picker).width).toBeCloseTo(200, 0);
    expect(rect(end).top).toBeGreaterThan(rect(start).bottom);
    expect(rect(end).left).toBeCloseTo(rect(start).left, 0);
    expect(rect(end).width).toBeCloseTo(rect(start).width, 0);
    // The dash ends the first row.
    expect(rect(dash).left).toBeCloseTo(rect(start).right, 0);
    expect(rect(dash).bottom).toBeLessThanOrEqual(rect(start).bottom);

    for (const element of [
      start,
      end,
      dash,
      ...screen.getAllByRole('button'),
    ]) {
      expectInside(element, picker);
    }
  });

  it('is never narrower than its widest row', () => {
    const { picker, start, end, dash } = renderPicker(100);

    expect(rect(picker).width).toBeCloseTo(
      rect(dash).right - rect(start).left,
      0,
    );

    for (const element of [start, end, dash]) expectInside(element, picker);
  });

  // Cloud's dashboard filter stretches the picker and spreads its boxes.
  it.each([
    [320, 'one row'],
    [250, 'two rows'],
  ])('spreads a stretched picker at %ipx on %s', (width) => {
    const { picker, start, end, dash } = renderPicker(width, {
      wrapperStyles: { width: '100%', placeContent: 'space-between' },
    });

    expect(rect(start).left).toBeCloseTo(rect(picker).left, 0);
    expect(rect(dash).left).toBeCloseTo(rect(start).right, 0);

    if (rect(end).top > rect(start).top) {
      // Each row sits at the start, rather than the dash at the far edge.
      expect(rect(end).left).toBeCloseTo(rect(picker).left, 0);
    } else {
      expect(rect(end).right).toBeCloseTo(rect(picker).right, 0);
    }

    expect(rect(end).top > rect(start).top).toBe(width < 281);
  });
});

describe('<DateRangePicker /> in a narrow container', () => {
  function renderPicker(width: number, size = 'medium') {
    renderWithRoot(
      <div style={{ width }}>
        <DateRangePicker
          isBare
          aria-label="Range"
          qa="Range"
          size={size}
          defaultValue={RANGE}
        />
      </div>,
    );

    const box = screen.getByTestId('Range');
    // The date fields themselves, without the dash beside the start date.
    const start = screen.getByTestId('DateRangeStart').firstElementChild!;
    const end = screen.getByTestId('DateRangeEnd').firstElementChild!;

    return {
      box,
      start,
      end,
      dash: screen.getByTestId('DateRangeDash'),
      button: within(box).getByRole('button'),
    };
  }

  it.each(['small', 'medium', 'large'])(
    'grows a %s box by one row for the end date',
    (size) => {
      const oneRow = renderPicker(400, size);
      const oneRowHeight = rect(oneRow.box).height;

      expect(rect(oneRow.end).top).toBeCloseTo(rect(oneRow.start).top, 0);

      cleanup();

      const { box, start, end, dash, button } = renderPicker(180, size);
      const rowHeight = oneRowHeight - 2;

      expect(rect(box).width).toBeCloseTo(180, 0);
      expect(rect(box).height).toBeCloseTo(oneRowHeight + rowHeight, 0);
      expect(rect(end).top).toBeGreaterThanOrEqual(rect(start).bottom);
      expect(rect(end).left).toBeCloseTo(rect(start).left, 0);
      // The dash ends the first row, and the button stays on it.
      expect(rect(dash).left).toBeCloseTo(rect(start).right, 0);
      expect(rect(button).bottom).toBeLessThanOrEqual(
        rect(box).top + oneRowHeight,
      );

      for (const element of [start, end, dash, button]) {
        expectInside(element, box);
      }
    },
  );

  it('is never narrower than its widest row', () => {
    const { box, start, end, dash, button } = renderPicker(100);

    expect(rect(box).width).toBeGreaterThan(100);

    for (const element of [start, end, dash, button]) {
      expectInside(element, box);
    }
  });
});
