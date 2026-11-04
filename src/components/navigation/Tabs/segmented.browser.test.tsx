import { tasty } from '@tenphi/tasty';
import { userEvent } from 'vitest/browser';

import { BarChartIcon } from '../../../icons/BarChartIcon';
import { renderWithRoot, screen } from '../../../test';
import { Radio } from '../../fields/RadioGroup/Radio';

import { Tab, Tabs } from './Tabs';

/**
 * `Tabs type="radio"` and `Radio.Tabs` are one segmented control with two
 * semantics: a tablist for switching views, a radio group for a form value.
 * Both take their look from `segmented-styles.ts`, and these specs render them
 * side by side and fail as soon as a computed style parts. Tabs is the
 * reference, so a difference is a bug in whichever one moved.
 *
 * Only the look is compared. Segment widths are layout and differ on purpose:
 * tabs share the track equally, radio buttons size to their labels.
 */

type Look = Record<string, string | string[]>;

/** Box shadows, without the zero-size ones nobody can see. */
function visibleShadows(value: string) {
  if (value === 'none') return [];

  return value
    .split(/,(?![^(]*\))/)
    .map((shadow) => shadow.trim())
    .filter((shadow) => !/ 0px 0px 0px 0px( inset)?$/.test(shadow));
}

/** An outline, or `none` when nothing of it shows. */
function visibleOutline(style: CSSStyleDeclaration) {
  // Zero alpha only: `rgba(…, 0)` or `color(… / 0)`, not `rgb(…, 0)`.
  let isTransparent = /^rgba\(.*,\s*0\)$|\/\s*0\)$/.test(style.outlineColor);

  if (style.outlineStyle === 'none' || isTransparent) return 'none';

  return `${style.outlineWidth} ${style.outlineColor}`;
}

function segmentLook(segment: HTMLElement): Look {
  let style = getComputedStyle(segment);
  let label = segment.querySelector<HTMLElement>('[data-element="Label"]');
  let icon = segment.querySelector<HTMLElement>('[data-element="Icon"]');
  let labelStyle = label ? getComputedStyle(label) : null;
  let iconStyle = icon ? getComputedStyle(icon) : null;

  return {
    fill: style.backgroundColor,
    color: style.color,
    radius: style.borderRadius,
    font: `${style.fontSize} / ${style.lineHeight} ${style.fontWeight}`,
    height: `${segment.getBoundingClientRect().height}`,
    shadow: visibleShadows(style.boxShadow),
    outline: visibleOutline(style),
    transition: style.transitionDuration,
    labelColor: labelStyle?.color ?? 'none',
    labelFont: labelStyle
      ? `${labelStyle.fontSize} / ${labelStyle.lineHeight}`
      : 'none',
    labelPadding: labelStyle
      ? `${labelStyle.paddingLeft} ${labelStyle.paddingRight}`
      : 'none',
    iconColor: iconStyle?.color ?? 'none',
    iconSize: icon
      ? `${icon.getBoundingClientRect().width}x${icon.getBoundingClientRect().height}`
      : 'none',
  };
}

function trackLook(track: HTMLElement, list: HTMLElement): Look {
  let style = getComputedStyle(track);

  return {
    fill: style.backgroundColor,
    radius: style.borderRadius,
    padding: style.padding,
    outline: visibleOutline(style),
    shadow: visibleShadows(style.boxShadow),
    gap: getComputedStyle(list).columnGap,
  };
}

/** Lets hover and selection transitions finish before anything is read. */
async function settle() {
  await Promise.all(
    document.getAnimations().map((animation) => animation.finished),
  );
}

interface Controls {
  tabs: HTMLElement[];
  radios: HTMLElement[];
  tabsTrack: () => Look;
  radioTrack: () => Look;
}

function renderBoth({
  size,
  isDisabled = false,
}: {
  size: 'medium' | 'large';
  isDisabled?: boolean;
}): Controls {
  renderWithRoot(
    <>
      {/* Where keyboard tests start, so an earlier click leaves no trace. */}
      <button type="button">Before</button>
      <Tabs
        type="radio"
        size={size}
        qa="SegmentedTabs"
        label="View"
        defaultActiveKey="workbook"
      >
        <Tab
          key="workbook"
          icon={<BarChartIcon />}
          title="Workbook"
          isDisabled={isDisabled}
        />
        <Tab key="dashboard" title="Dashboard" isDisabled={isDisabled} />
        <Tab key="report" title="Report" isDisabled />
        <Tab
          key="chart"
          icon={<BarChartIcon />}
          aria-label="Chart"
          isDisabled={isDisabled}
        />
      </Tabs>
      <Radio.Tabs
        size={size}
        qa="SegmentedRadios"
        aria-label="View"
        defaultValue="workbook"
        isBare
        isDisabled={isDisabled}
      >
        <Radio.Button value="workbook" icon={<BarChartIcon />}>
          Workbook
        </Radio.Button>
        <Radio.Button value="dashboard">Dashboard</Radio.Button>
        <Radio.Button isDisabled value="report">
          Report
        </Radio.Button>
        <Radio.Button
          value="chart"
          icon={<BarChartIcon />}
          aria-label="Chart"
        />
      </Radio.Tabs>
    </>,
  );

  let tabsRoot = screen.getByTestId('SegmentedTabs');
  let radioGroup = screen.getByRole('radiogroup');

  return {
    tabs: screen.getAllByRole('tab'),
    radios: screen.getAllByTestId('RadioButton'),
    tabsTrack: () =>
      trackLook(
        tabsRoot.querySelector<HTMLElement>('[data-element="Bar"]')!,
        tabsRoot.querySelector<HTMLElement>('[data-element="TabList"]')!,
      ),
    radioTrack: () => trackLook(radioGroup, radioGroup),
  };
}

const SCHEMES = ['light', 'dark'] as const;
const SIZES = ['medium', 'large'] as const;
const CASES = SCHEMES.flatMap((scheme) =>
  SIZES.map((size) => ({ scheme, size })),
);

describe.each(CASES)(
  'Segmented controls look the same ($scheme, size $size)',
  ({ scheme, size }) => {
    // React Aria ignores a hover until a pointer move has set the
    // interaction modality, so move the pointer once before any hover.
    beforeAll(async () => {
      await userEvent.hover(document.body);
    });

    beforeEach(() => {
      document.documentElement.setAttribute('data-scheme', scheme);
    });

    afterEach(() => {
      document.documentElement.removeAttribute('data-scheme');
    });

    it('at rest: track, selected, idle and disabled segments', async () => {
      let { tabs, radios, tabsTrack, radioTrack } = renderBoth({ size });

      await settle();

      expect(radioTrack()).toEqual(tabsTrack());

      for (let index = 0; index < tabs.length; index++) {
        expect(segmentLook(radios[index])).toEqual(segmentLook(tabs[index]));
      }
    });

    it('on hover over an idle segment', async () => {
      let { tabs, radios } = renderBoth({ size });

      await userEvent.hover(tabs[1]);
      await settle();
      let tabLook = segmentLook(tabs[1]);

      await userEvent.hover(radios[1]);
      await settle();

      expect(tabLook.fill).not.toBe(segmentLook(tabs[0]).fill);
      expect(segmentLook(radios[1])).toEqual(tabLook);
    });

    it('on hover over the selected segment', async () => {
      let { tabs, radios } = renderBoth({ size });

      await userEvent.hover(tabs[0]);
      await settle();
      let tabLook = segmentLook(tabs[0]);

      await userEvent.hover(radios[0]);
      await settle();

      expect(segmentLook(radios[0])).toEqual(tabLook);
    });

    // The ring belongs to the segment, inside it, in both. `Radio.Tabs` used
    // to ring the whole group instead.
    it('with keyboard focus on the selected segment', async () => {
      let { tabs, radios, tabsTrack, radioTrack } = renderBoth({ size });

      screen.getByRole('button', { name: 'Before' }).focus();
      await userEvent.tab();
      await settle();
      expect(document.activeElement).toBe(tabs[0]);
      let tabLook = segmentLook(tabs[0]);
      let tabTrackLook = tabsTrack();

      await userEvent.tab();
      await settle();
      expect(radios[0].contains(document.activeElement)).toBe(true);

      expect(tabLook.shadow).toHaveLength(2);
      expect(segmentLook(radios[0])).toEqual(tabLook);
      expect(radioTrack()).toEqual(tabTrackLook);
    });

    it('with pointer focus, which shows no ring', async () => {
      let { tabs, radios } = renderBoth({ size });

      await userEvent.click(tabs[1]);
      await userEvent.click(radios[1]);
      await userEvent.unhover(radios[1]);
      await settle();

      expect(radios[1].contains(document.activeElement)).toBe(true);
      expect(segmentLook(radios[1])).toEqual(segmentLook(tabs[1]));
      expect(segmentLook(radios[1]).shadow).toHaveLength(1);
    });

    // A disabled control keeps its selected chip; only the labels fade.
    it('when the whole control is disabled', async () => {
      let { tabs, radios, tabsTrack, radioTrack } = renderBoth({
        size,
        isDisabled: true,
      });

      await settle();

      expect(radioTrack()).toEqual(tabsTrack());

      for (let index = 0; index < tabs.length; index++) {
        expect(segmentLook(radios[index])).toEqual(segmentLook(tabs[index]));
      }

      expect(segmentLook(radios[0]).fill).not.toBe(segmentLook(radios[1]).fill);
    });
  },
);

// What only `Radio.Tabs` has: a validated group tints its idle labels, as the
// `danger` and `success` themes did, and keeps the selected label neutral.
const DangerSoft = tasty({ styles: { color: '#danger-accent-text-soft' } });
const SuccessSoft = tasty({ styles: { color: '#success-accent-text-soft' } });

describe.each(SCHEMES)('Radio.Tabs validation (%s)', (scheme) => {
  beforeEach(() => {
    document.documentElement.setAttribute('data-scheme', scheme);
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-scheme');
  });

  it.each([
    { state: 'invalid', isInvalid: true, isValid: false },
    { state: 'valid', isInvalid: false, isValid: true },
  ])('tints idle labels when $state', async ({ isInvalid, isValid }) => {
    renderWithRoot(
      <>
        <DangerSoft qa="DangerSoft">Danger</DangerSoft>
        <SuccessSoft qa="SuccessSoft">Success</SuccessSoft>
        <Tabs type="radio" label="View" defaultActiveKey="workbook">
          <Tab key="workbook" title="Workbook" />
          <Tab key="dashboard" title="Dashboard" />
          <Tab key="report" title="Report" isDisabled />
        </Tabs>
        <Radio.Tabs
          aria-label="View"
          defaultValue="workbook"
          isBare
          isInvalid={isInvalid}
          isValid={isValid}
        >
          <Radio.Button value="workbook">Workbook</Radio.Button>
          <Radio.Button value="dashboard">Dashboard</Radio.Button>
          <Radio.Button isDisabled value="report">
            Report
          </Radio.Button>
        </Radio.Tabs>
      </>,
    );

    await settle();

    let tabs = screen.getAllByRole('tab');
    let radios = screen.getAllByTestId('RadioButton');
    let tint = getComputedStyle(
      screen.getByTestId(isInvalid ? 'DangerSoft' : 'SuccessSoft'),
    ).color;

    expect(tint).not.toBe(segmentLook(tabs[1]).color);
    expect(segmentLook(radios[1]).color).toBe(tint);
    expect(segmentLook(radios[0]).color).toBe(segmentLook(tabs[0]).color);
    expect(segmentLook(radios[2]).color).toBe(segmentLook(tabs[2]).color);
  });
});
