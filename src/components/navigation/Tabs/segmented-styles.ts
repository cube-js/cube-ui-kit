import type { Styles } from '@tenphi/tasty';

// =============================================================================
// Segmented control look, shared by `Tabs type="radio"` and `Radio.Tabs`
// (`RadioGroup type="tabs"`). They keep their own semantics (tablist / tab vs
// radiogroup / radio) and keyboard behaviour, but render one control: a track
// with segments on it. Tabs is the reference.
//
// Every state here is keyed on the `segmented` mod. Tabs sets it on its root
// and each tab for `type="radio"`; RadioGroup and Radio set it for
// `type="tabs"`.
//
// The maps have no `''` key, so `mergeStyles(styles, FRAGMENT)` appends them
// to the component's own maps and they win for a segmented control only. A
// state the component must keep above them (Tabs' `drop-pending`) is moved
// after them with `'@inherit'`.
//
// `segmented.browser.test.tsx` renders both controls and fails when their
// computed styles part.
// =============================================================================

/**
 * The track: the pill the segments sit on. Applied to `Tabs`' Bar and to the
 * `RadioGroup` element. The segments read `$transition` from it, so hover and
 * selection move at the tab speed in both.
 */
export const SEGMENTED_TRACK_STYLES: Styles = {
  // oxlint-disable-next-line tasty/require-default-state -- extends the track's own map (see the header)
  padding: { segmented: '.5x' },
  // oxlint-disable-next-line tasty/require-default-state -- extends the track's own map (see the header)
  radius: { segmented: '1cr' },
  // oxlint-disable-next-line tasty/require-default-state -- extends the track's own map (see the header)
  fill: { segmented: '#surface-4' },
  $transition: { segmented: '$tab-transition' },
};

/**
 * The space between segments, on the element that lays them out: `Tabs`'
 * TabList, and the `RadioGroup` element itself.
 */
export const SEGMENTED_LIST_STYLES: Styles = {
  // oxlint-disable-next-line tasty/require-default-state -- extends the list's own map (see the header)
  gap: { segmented: '.5x' },
};

/**
 * One segment: a tab, or a radio button. Both are an `Item` of type `clear`,
 * sized by `RADIO_SIZE_MAP`, so `size=xsmall` is the medium control.
 *
 * The keyboard focus ring sits inside the segment, so it reads on the white
 * chip as well as on the track. A segment shows it only with both `focused`
 * and `focus-visible`.
 */
export const SEGMENTED_SEGMENT_STYLES: Styles = {
  // oxlint-disable-next-line tasty/require-default-state -- extends the segment's own map (see the header)
  radius: { segmented: true },
  // oxlint-disable-next-line tasty/require-default-state -- extends the segment's own map (see the header)
  preset: {
    segmented: 't3m',
    'segmented & size=xsmall': 't4',
  },
  // The selected label stays soft: the chip marks the selection, not the text.
  // oxlint-disable-next-line tasty/require-default-state -- extends the segment's own map (see the header)
  color: {
    segmented: '#surface-text-soft',
    'segmented & disabled': '#disabled-surface-text',
  },
  // A disabled control keeps its selected chip, so it still says which option
  // is chosen; only the label fades (CUB-3912).
  // oxlint-disable-next-line tasty/require-default-state -- extends the segment's own map (see the header)
  fill: {
    segmented: '#clear',
    'segmented & hovered': '#surface.5',
    'segmented & selected': '#surface',
  },
  // oxlint-disable-next-line tasty/require-default-state -- extends the segment's own map (see the header)
  shadow: {
    'segmented & focused & focus-visible':
      'inset 0 0 0 $ring-width #primary-accent-text',
    'segmented & selected': '$item-shadow',
    'segmented & selected & focused & focus-visible':
      '$item-shadow, inset 0 0 0 $ring-width #primary-accent-text',
  },
  // The ring is the inset shadow above, not the `clear` item's outline.
  // oxlint-disable-next-line tasty/require-default-state -- extends the segment's own map (see the header)
  outline: { segmented: 'none' },
  // oxlint-disable-next-line tasty/require-default-state -- extends the segment's own map (see the header)
  placeContent: { segmented: 'center' },
};
