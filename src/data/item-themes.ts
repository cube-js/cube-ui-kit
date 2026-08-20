import type { Styles } from '@tenphi/tasty';

export const VALIDATION_STYLES: Styles = {
  border: {
    invalid: '#danger-accent-text',
    valid: '#success-accent-text',
  } as Record<string, string>,
} as const;

// Base styles shared between ItemAction and ItemBadge
export const ITEM_ACTION_BASE_STYLES: Styles = {
  display: 'inline-grid',
  flow: 'column',
  placeItems: 'center',
  placeContent: 'center',
  gap: 0,
  position: 'relative',
  margin: {
    '': '0 1bw 0 1bw',
    ':last-child & !:first-child': '0 $side-padding 0 0',
    '!:last-child & :first-child': '0 0 0 $side-padding',
    ':last-child & :first-child': '0 $side-padding',
    context: '0',
  },
  padding: 0,
  radius: '(1r - 1bw)',
  transition: 'theme',
  flexShrink: 0,
  textDecoration: 'none',
  boxSizing: 'border-box',
  whiteSpace: 'nowrap',
  border: 0,
  height: '$action-size',
  width: {
    '': '$action-size',
    'has-label': 'auto',
  },
  placeSelf: 'center',

  // Side padding for the action buttons
  '$side-padding': '(($size - $action-size - 2bw) / 2)',
  // Size using custom property
  '$action-size':
    'min(max((2x + 2bw), (($size, $size-md) - 1x - 2bw)), (3x - 2bw))',

  // Icon styles
  Icon: {
    $: '>',
    display: 'grid',
    placeItems: 'center',
    height: '($action-size - 2bw) ($action-size - 2bw)',
    width: '($action-size - 2bw) ($action-size - 2bw)',
    opacity: {
      '': 1,
      'checkmark & selected': 1,
      'checkmark & !selected': 0,
      'checkmark & !selected & hovered': 0.4,
    },
  },
} as const;

// ---------- DEFAULT THEME ----------
export const DEFAULT_PRIMARY_STYLES: Styles = {
  outline: {
    '': '0 #primary-accent-text.0',
    focused: '1bw #primary-accent-text',
  },
  border: {
    '': '#primary-accent-surface-border',
    pressed: '#primary-accent-surface-border',
    disabled: 'transparent',
  },
  // All states share the same `#surface` base layer (opaque). Only the
  // *overlay* varies between brand color, hover shade, and disabled chip.
  // Keeping the layer shape identical (always two layers, same base, same
  // gradient overlay slot) lets `background-color`, `background-image` and
  // `--tasty-second-fill-color` all interpolate smoothly during the CSS
  // transition — without it, the gradient overlay would snap on/off and the
  // bg-color would briefly show through (the "surface flash" on form submit).
  //
  // The brand ramp `accent-surface` → `-2` → `-3` gives a monotonically
  // increasing contrast against `#surface` (cr ≈ 4.5 → 4.8 → 5.2 in light,
  // similar in dark), so hover and pressed read visibly *darker* than the
  // default state in both schemes. Disabled uses the brand-tinted,
  // scheme-symmetric chip (`accent-disabled-surface` cr ≈ 1.4 vs surface)
  // so the muted state stays identifiable as a brand color.
  fill: {
    '': '#surface #primary-accent-surface',
    hovered: '#surface #primary-accent-surface-2',
    pressed: '#surface #primary-accent-surface-3',
    disabled: '#surface #primary-accent-disabled-surface',
  },
  color: {
    '': '#white',
    disabled: '#primary-accent-disabled-surface-text',
  },
} as const;

export const DEFAULT_OUTLINE_STYLES: Styles = {
  // Non-selected = old OUTLINE: neutral border + surface fill.
  // Selected (= old SECONDARY): brand-tinted fill + brand border.
  // Selected BORDER uses the OPAQUE `#primary-border` token (the neutral
  // `border` ramp re-resolved at `saturation: 0.5` per primary-theme — see
  // `TINTED_SURFACE_OVERRIDE` in `palette.ts`). It replaces an alpha-blended
  // brand-text border so adjacent borders in grouped layouts (e.g.
  // `RadioGroup type="button"`) don't double up at their overlap into a
  // darker stripe. Selected FILL anchors to the *fixed* `#primary-accent-surface`
  // brand: anchoring to the adaptive `#primary-accent-text` would drift the
  // bg toward the text lightness in dark mode and collapse label↔bg contrast
  // below AA. Selected label mirrors LINK: soft `#primary-accent-text-soft` at
  // rest, intensifying to `#primary-accent-text` on hover. Both are solved in
  // `palette.ts` for AA against the BASE selected fill (`accent-selected-fill`).
  outline: {
    '': '0 #primary-accent-text.0',
    focused: '1bw #primary-accent-text',
  },
  border: {
    '': true,
    selected: '#primary-border',
    disabled: '#border',
    ...(VALIDATION_STYLES.border as Record<string, string>),
  },
  // Every state uses a two-layer fill: `#surface-2` (opaque base) + a tint
  // overlay. Keeping the layer shape identical across non-selected, selected
  // and disabled states lets the tint, base color, and gradient slot all
  // interpolate smoothly during the CSS transition. Selected states paint the
  // brand tint on top of `#surface-2` (slightly darker base than a
  // body-composited single-layer `#primary-accent-surface.X` would be, but
  // visually almost identical and free of the overlay-snap flash on click).
  // Disabled paints the neutral `#disabled-surface` chip on top of the same
  // base. When SELECTED it keeps the enabled selected chip instead and fades
  // only the LABEL, to `#accent-disabled-text` — so a disabled segmented
  // control still shows which option is active (CUB-3912) without the chip
  // changing weight at all. Every `selected & disabled` entry in this file
  // exists for that reason.
  //
  // Fading the label alone is what keeps the state honest. The chip is the
  // thing that says "this one is on", and a disabled control has no business
  // saying that more loudly than a live one — which is exactly what happened
  // while the state borrowed `accent-disabled-surface`: the mid-tone pill a
  // PRIMARY button steps DOWN to is a step UP from a 9% tint, and its
  // `tone: 'max'` label resolved to literal white in light mode. Building the
  // chip from the neutral disabled tone at brand chroma fixed the weight but
  // read over-saturated next to the enabled selected chips it sits beside.
  //
  // The `.08` is `selected`'s own `.09` minus a hair, and the difference is
  // deliberately imperceptible: the two entries must not serialize to the SAME
  // string. Tasty's `mergeEntriesByValue` pass coalesces equal values into one
  // OR-entry at the group's max priority, so a literal reuse of `.09` would
  // merge `selected` into `selected & disabled` and then negate against
  // `selected & (hovered | focused)` — the "selected-hover stays dark" bug that
  // `SPECIAL_CLEAR_STYLES` documents at length, which escapes it the same way.
  fill: {
    '': '#surface-2 #surface-text.0',
    hovered: '#surface-2 #surface-text.03',
    pressed: '#surface-2 #surface-text.09',
    selected: '#surface-2 #primary-accent-surface.09',
    'selected & (hovered | focused)': '#surface-2 #primary-accent-surface.12',
    'selected & pressed': '#surface-2 #primary-accent-surface.18',
    disabled: '#surface-2 #disabled-surface',
    'selected & disabled': '#surface-2 #primary-accent-surface.08',
  },
  color: {
    '': '#surface-text-soft',
    hovered: '#surface-text-soft',
    pressed: '#surface-text',
    selected: '#primary-accent-text-soft',
    'selected & hovered': '#primary-accent-text',
    disabled: '#disabled-surface-text',
    'selected & disabled': '#primary-accent-disabled-text',
  },
} as const;

// Identical to DEFAULT_OUTLINE_STYLES but uses `#surface-3` as the fill base,
// designed to sit on `#surface-2` containers without blending in.
export const DEFAULT_OUTLINE_2_STYLES: Styles = {
  ...DEFAULT_OUTLINE_STYLES,
  fill: {
    '': '#surface-3 #surface-text.0',
    hovered: '#surface-3 #surface-text.03',
    pressed: '#surface-3 #surface-text.09',
    selected: '#surface-3 #primary-accent-surface.09',
    'selected & (hovered | focused)': '#surface-3 #primary-accent-surface.12',
    'selected & pressed': '#surface-3 #primary-accent-surface.15',
    disabled: '#surface-3 #disabled-surface',
    'selected & disabled': '#surface-3 #primary-accent-surface.08',
  },
} as const;

export const DEFAULT_CLEAR_STYLES: Styles = {
  // Non-selected = old NEUTRAL: transparent / dark-tinted neutral look.
  // Selected = old CLEAR: brand-tinted overlay over the surface.
  outline: {
    '': '0 #primary-accent-text.0',
    focused: '1bw #primary-accent-text',
  },
  border: {
    '': 'transparent',
    ...(VALIDATION_STYLES.border as Record<string, string>),
  },
  fill: {
    '': '#surface-text.0',
    'hovered | focused': '#surface-text.04',
    pressed: '#surface-text.06',
    selected: '#primary-accent-surface.09',
    'selected & (hovered | focused)': '#primary-accent-surface.12',
    'selected & pressed': '#primary-accent-surface.18',
    disabled: 'transparent',
    'selected & disabled': '#primary-accent-surface.08',
  },
  // Selected label mirrors LINK: soft at rest, `#primary-accent-text` on
  // hover. See DEFAULT_OUTLINE_STYLES.
  color: {
    '': '#surface-text-soft',
    hovered: '#surface-text-soft',
    'pressed & !selected': '#surface-text',
    selected: '#primary-accent-text-soft',
    'selected & hovered': '#primary-accent-text',
    disabled: '#disabled-surface-text',
    'selected & disabled': '#primary-accent-disabled-text',
  },
} as const;

export const DEFAULT_ITEM_STYLES: Styles = {
  border: 'transparent',
  fill: {
    '': '#surface-text.0',
    'hovered | focused': '#surface-text.04',
    pressed: '#surface-text.06',
    selected: '#surface-text.09',
    'selected & (hovered | focused)': '#surface-text.12',
    'selected & pressed': '#surface-text.15',
    disabled: 'transparent',
  },
  color: {
    '': '#surface-text-soft',
    hovered: '#surface-text-soft',
    selected: '#surface-text',
    disabled: '#disabled-surface-text',
  },
} as const;

export const DEFAULT_LINK_STYLES: Styles = {
  // Default sits at `#primary-accent-text-soft` and intensifies on hover to the
  // stronger `#primary-accent-text`. Both are solved in `palette.ts` for AA
  // against `accent-selected-fill` (the BASE selected Item fill), so they also
  // clear AA on plain surfaces; both are adaptive across light/dark/HC.
  outline: {
    '': '0 #primary-accent-text.0',
    focused: '1bw #primary-accent-text',
  },
  border: '0',
  fill: {
    '': 'transparent',
  },
  color: {
    '': '#primary-accent-text-soft',
    'hovered & !pressed': '#primary-accent-text',
    disabled: '#disabled-surface-text',
  },
} as const;

// ---------- DANGER THEME ----------
export const DANGER_PRIMARY_STYLES: Styles = {
  outline: {
    '': '0 #primary-accent-text.0',
    focused: '1bw #primary-accent-text',
  },
  border: {
    '': '#white.2',
    pressed: '#danger-accent-text',
    disabled: 'transparent',
  },
  // See `DEFAULT_PRIMARY_STYLES.fill` for the layer-shape + ramp rationale.
  fill: {
    '': '#surface #danger-accent-surface',
    hovered: '#surface #danger-accent-surface-2',
    pressed: '#surface #danger-accent-surface-3',
    disabled: '#surface #danger-accent-disabled-surface',
  },
  color: {
    '': '#white',
    disabled: '#danger-accent-disabled-surface-text',
  },
} as const;

export const DANGER_OUTLINE_STYLES: Styles = {
  // Non-selected = old DANGER OUTLINE; selected = old DANGER SECONDARY.
  // Border uses the OPAQUE `#danger-border` token (the neutral `border` ramp
  // re-resolved at `saturation: 0.5` per danger-theme — see
  // `TINTED_SURFACE_OVERRIDE` in `palette.ts`). It replaces an alpha-blended
  // brand-text border so adjacent borders in grouped layouts don't double up
  // at their overlap into a darker stripe.
  outline: {
    '': '0 #primary-accent-text.0',
    focused: '1bw #primary-accent-text',
  },
  border: {
    '': '#danger-border',
    disabled: '#border',
  },
  fill: {
    '': '#surface-2 #danger-accent-surface.0',
    hovered: '#surface-2 #danger-accent-surface.03',
    pressed: '#surface-2 #danger-accent-surface.09',
    selected: '#surface-2 #danger-accent-surface.09',
    'selected & (hovered | focused)': '#surface-2 #danger-accent-surface.12',
    'selected & pressed': '#surface-2 #danger-accent-surface.18',
    disabled: '#surface-2 #disabled-surface',
    'selected & disabled': '#surface-2 #danger-accent-surface.08',
  },
  color: {
    '': '#danger-accent-text-soft',
    selected: '#danger-accent-text',
    disabled: '#disabled-surface-text',
    'selected & disabled': '#danger-accent-disabled-text',
  },
} as const;

export const DANGER_OUTLINE_2_STYLES: Styles = {
  ...DANGER_OUTLINE_STYLES,
  fill: {
    '': '#surface-3 #danger-accent-surface.0',
    hovered: '#surface-3 #danger-accent-surface.03',
    pressed: '#surface-3 #danger-accent-surface.09',
    selected: '#surface-3 #danger-accent-surface.09',
    'selected & (hovered | focused)': '#surface-3 #danger-accent-surface.12',
    'selected & pressed': '#surface-3 #danger-accent-surface.18',
    disabled: '#surface-3 #disabled-surface',
    'selected & disabled': '#surface-3 #danger-accent-surface.08',
  },
} as const;

export const DANGER_CLEAR_STYLES: Styles = {
  // Non-selected = old DANGER NEUTRAL: dark-tinted overlay; pressed switches
  // text to `#danger-accent-text` (matches old neutral).
  // Selected = old DANGER CLEAR: danger-text-tinted overlay.
  outline: {
    '': '0 #primary-accent-text.0',
    focused: '1bw #primary-accent-text',
  },
  border: {
    '': 'transparent',
  },
  fill: {
    '': '#surface-text.0',
    'hovered | focused': '#surface-text.04',
    pressed: '#surface-text.06',
    selected: '#danger-accent-text.09',
    'selected & (hovered | focused)': '#danger-accent-text.12',
    'selected & pressed': '#danger-accent-text.18',
    disabled: 'transparent',
    'selected & disabled': '#danger-accent-text.08',
  },
  color: {
    '': '#danger-accent-text-soft',
    selected: '#danger-accent-text',
    disabled: '#disabled-surface-text',
    'selected & disabled': '#danger-accent-disabled-text',
  },
} as const;

export const DANGER_LINK_STYLES: Styles = {
  // See DEFAULT_LINK_STYLES for the soft→strong rationale.
  outline: {
    '': '0 #primary-accent-text.0',
    focused: '1bw #primary-accent-text',
  },
  border: 0,
  fill: {
    '': 'transparent',
  },
  color: {
    '': '#danger-accent-text-soft',
    'hovered & !pressed': '#danger-accent-text',
    disabled: '#disabled-surface-text',
  },
} as const;

export const DANGER_ITEM_STYLES: Styles = {
  border: 'transparent',
  fill: {
    '': '#danger-accent-text.0',
    'hovered | focused': '#danger-accent-text.03',
    selected: '#danger-accent-text.09',
    'selected & (hovered | focused)': '#danger-accent-text.12',
    pressed: '#danger-accent-text.09',
    disabled: 'transparent',
  },
  color: {
    '': '#danger-accent-text',
    hovered: '#danger-accent-text',
    pressed: '#danger-accent-text',
    disabled: '#danger-accent-text.4',
  },
} as const;

// ---------- SUCCESS THEME ----------
export const SUCCESS_PRIMARY_STYLES: Styles = {
  outline: {
    '': '0 #primary-accent-text.0',
    focused: '1bw #primary-accent-text',
  },
  border: {
    '': '#white.2',
    pressed: '#success-accent-text',
    disabled: 'transparent',
  },
  // See `DEFAULT_PRIMARY_STYLES.fill` for the layer-shape + ramp rationale.
  fill: {
    '': '#surface #success-accent-surface',
    hovered: '#surface #success-accent-surface-2',
    pressed: '#surface #success-accent-surface-3',
    disabled: '#surface #success-accent-disabled-surface',
  },
  color: {
    '': '#white',
    disabled: '#success-accent-disabled-surface-text',
  },
} as const;

export const SUCCESS_OUTLINE_STYLES: Styles = {
  // Non-selected = old SUCCESS OUTLINE; selected = old SUCCESS SECONDARY.
  // See DANGER_OUTLINE_STYLES for the border-anchor rationale.
  outline: {
    '': '0 #primary-accent-text.0',
    focused: '1bw #primary-accent-text',
  },
  border: {
    '': '#success-border',
    disabled: '#border',
  },
  fill: {
    '': '#surface-2 #success-accent-surface.0',
    hovered: '#surface-2 #success-accent-surface.03',
    pressed: '#surface-2 #success-accent-surface.09',
    selected: '#surface-2 #success-accent-surface.09',
    'selected & (hovered | focused)': '#surface-2 #success-accent-surface.12',
    'selected & pressed': '#surface-2 #success-accent-surface.18',
    disabled: '#surface-2 #disabled-surface',
    'selected & disabled': '#surface-2 #success-accent-surface.08',
  },
  color: {
    '': '#success-accent-text-soft',
    selected: '#success-accent-text',
    disabled: '#disabled-surface-text',
    'selected & disabled': '#success-accent-disabled-text',
  },
} as const;

export const SUCCESS_OUTLINE_2_STYLES: Styles = {
  ...SUCCESS_OUTLINE_STYLES,
  fill: {
    '': '#surface-3 #success-accent-surface.0',
    hovered: '#surface-3 #success-accent-surface.03',
    pressed: '#surface-3 #success-accent-surface.09',
    selected: '#surface-3 #success-accent-surface.09',
    'selected & (hovered | focused)': '#surface-3 #success-accent-surface.12',
    'selected & pressed': '#surface-3 #success-accent-surface.18',
    disabled: '#surface-3 #disabled-surface',
    'selected & disabled': '#surface-3 #success-accent-surface.08',
  },
} as const;

export const SUCCESS_CLEAR_STYLES: Styles = {
  // Non-selected = old SUCCESS NEUTRAL; selected = old SUCCESS CLEAR.
  outline: {
    '': '0 #primary-accent-text.0',
    focused: '1bw #primary-accent-text',
  },
  border: {
    '': 'transparent',
  },
  fill: {
    '': '#surface-text.0',
    'hovered | focused': '#surface-text.04',
    pressed: '#surface-text.06',
    selected: '#success-accent-text.09',
    'selected & (hovered | focused)': '#success-accent-text.12',
    'selected & pressed': '#success-accent-text.18',
    disabled: 'transparent',
    'selected & disabled': '#success-accent-text.08',
  },
  color: {
    '': '#success-accent-text-soft',
    selected: '#success-accent-text',
    disabled: '#disabled-surface-text',
    'selected & disabled': '#success-accent-disabled-text',
  },
} as const;

export const SUCCESS_LINK_STYLES: Styles = {
  // See DEFAULT_LINK_STYLES for the soft→strong rationale.
  outline: {
    '': '0 #primary-accent-text.0',
    focused: '1bw #primary-accent-text',
  },
  border: 0,
  fill: {
    '': 'transparent',
  },
  color: {
    '': '#success-accent-text-soft',
    'hovered & !pressed': '#success-accent-text',
    disabled: '#disabled-surface-text',
  },
} as const;

export const SUCCESS_ITEM_STYLES: Styles = {
  border: 'transparent',
  fill: {
    '': '#success-accent-text.0',
    'hovered | focused': '#success-accent-text.03',
    selected: '#success-accent-text.09',
    'selected & (hovered | focused)': '#success-accent-text.12',
    pressed: '#success-accent-text.09',
    disabled: 'transparent',
  },
  color: {
    '': '#success-accent-text',
    hovered: '#success-accent-text',
    pressed: '#success-accent-text',
    disabled: '#success-accent-text.4',
  },
} as const;

// ---------- WARNING THEME ----------
export const WARNING_PRIMARY_STYLES: Styles = {
  outline: {
    '': '0 #primary-accent-text.0',
    focused: '1bw #primary-accent-text',
  },
  border: {
    '': '#white.2',
    pressed: '#warning-accent-text',
    disabled: 'transparent',
  },
  // See `DEFAULT_PRIMARY_STYLES.fill` for the layer-shape + ramp rationale.
  fill: {
    '': '#surface #warning-accent-surface',
    hovered: '#surface #warning-accent-surface-2',
    pressed: '#surface #warning-accent-surface-3',
    disabled: '#surface #warning-accent-disabled-surface',
  },
  color: {
    '': '#white',
    disabled: '#warning-accent-disabled-surface-text',
  },
} as const;

export const WARNING_OUTLINE_STYLES: Styles = {
  // Non-selected = old WARNING OUTLINE; selected = old WARNING SECONDARY.
  // See DANGER_OUTLINE_STYLES for the border-anchor rationale.
  outline: {
    '': '0 #primary-accent-text.0',
    focused: '1bw #primary-accent-text',
  },
  border: {
    '': '#warning-border',
    disabled: '#border',
  },
  fill: {
    '': '#surface-2 #warning-accent-surface.0',
    hovered: '#surface-2 #warning-accent-surface.03',
    pressed: '#surface-2 #warning-accent-surface.09',
    selected: '#surface-2 #warning-accent-surface.09',
    'selected & (hovered | focused)': '#surface-2 #warning-accent-surface.12',
    'selected & pressed': '#surface-2 #warning-accent-surface.18',
    disabled: '#surface-2 #disabled-surface',
    'selected & disabled': '#surface-2 #warning-accent-surface.08',
  },
  color: {
    '': '#warning-accent-text-soft',
    selected: '#warning-accent-text',
    disabled: '#disabled-surface-text',
    'selected & disabled': '#warning-accent-disabled-text',
  },
} as const;

export const WARNING_OUTLINE_2_STYLES: Styles = {
  ...WARNING_OUTLINE_STYLES,
  fill: {
    '': '#surface-3 #warning-accent-surface.0',
    hovered: '#surface-3 #warning-accent-surface.03',
    pressed: '#surface-3 #warning-accent-surface.09',
    selected: '#surface-3 #warning-accent-surface.09',
    'selected & (hovered | focused)': '#surface-3 #warning-accent-surface.12',
    'selected & pressed': '#surface-3 #warning-accent-surface.18',
    disabled: '#surface-3 #disabled-surface',
    'selected & disabled': '#surface-3 #warning-accent-surface.08',
  },
} as const;

export const WARNING_CLEAR_STYLES: Styles = {
  // Non-selected = old WARNING NEUTRAL; selected = old WARNING CLEAR.
  outline: {
    '': '0 #primary-accent-text.0',
    focused: '1bw #primary-accent-text',
  },
  border: {
    '': 'transparent',
  },
  fill: {
    '': '#surface-text.0',
    'hovered | focused': '#surface-text.04',
    pressed: '#surface-text.06',
    selected: '#warning-accent-text.09',
    'selected & (hovered | focused)': '#warning-accent-text.12',
    'selected & pressed': '#warning-accent-text.18',
    disabled: 'transparent',
    'selected & disabled': '#warning-accent-text.08',
  },
  color: {
    '': '#warning-accent-text-soft',
    selected: '#warning-accent-text',
    disabled: '#disabled-surface-text',
    'selected & disabled': '#warning-accent-disabled-text',
  },
} as const;

export const WARNING_LINK_STYLES: Styles = {
  // See DEFAULT_LINK_STYLES for the soft→strong rationale.
  outline: {
    '': '0 #primary-accent-text.0',
    focused: '1bw #primary-accent-text',
  },
  border: 0,
  fill: {
    '': 'transparent',
  },
  color: {
    '': '#warning-accent-text-soft',
    'hovered & !pressed': '#warning-accent-text',
    disabled: '#disabled-surface-text',
  },
} as const;

export const WARNING_ITEM_STYLES: Styles = {
  border: 'transparent',
  fill: {
    '': '#warning-accent-text.0',
    'hovered | focused': '#warning-accent-text.03',
    selected: '#warning-accent-text.09',
    'selected & (hovered | focused)': '#warning-accent-text.12',
    pressed: '#warning-accent-text.09',
    disabled: 'transparent',
  },
  color: {
    '': '#warning-accent-text',
    hovered: '#warning-accent-text',
    pressed: '#warning-accent-text',
    disabled: '#warning-accent-text.4',
  },
} as const;

// ---------- NOTE THEME ----------
export const NOTE_PRIMARY_STYLES: Styles = {
  outline: {
    '': '0 #primary-accent-text.0',
    focused: '1bw #primary-accent-text',
  },
  border: {
    '': '#white.2',
    pressed: '#note-accent-text',
    disabled: 'transparent',
  },
  // See `DEFAULT_PRIMARY_STYLES.fill` for the layer-shape + ramp rationale.
  fill: {
    '': '#surface #note-accent-surface',
    hovered: '#surface #note-accent-surface-2',
    pressed: '#surface #note-accent-surface-3',
    disabled: '#surface #note-accent-disabled-surface',
  },
  color: {
    '': '#white',
    disabled: '#note-accent-disabled-surface-text',
  },
} as const;

export const NOTE_OUTLINE_STYLES: Styles = {
  // Non-selected = old NOTE OUTLINE; selected = old NOTE SECONDARY.
  // See DANGER_OUTLINE_STYLES for the border-anchor rationale.
  outline: {
    '': '0 #primary-accent-text.0',
    focused: '1bw #primary-accent-text',
  },
  border: {
    '': '#note-border',
    disabled: '#border',
  },
  fill: {
    '': '#surface-2 #note-accent-surface.0',
    hovered: '#surface-2 #note-accent-surface.03',
    pressed: '#surface-2 #note-accent-surface.09',
    selected: '#surface-2 #note-accent-surface.09',
    'selected & (hovered | focused)': '#surface-2 #note-accent-surface.12',
    'selected & pressed': '#surface-2 #note-accent-surface.18',
    disabled: '#surface-2 #disabled-surface',
    'selected & disabled': '#surface-2 #note-accent-surface.08',
  },
  color: {
    '': '#note-accent-text-soft',
    selected: '#note-accent-text',
    disabled: '#disabled-surface-text',
    'selected & disabled': '#note-accent-disabled-text',
  },
} as const;

export const NOTE_OUTLINE_2_STYLES: Styles = {
  ...NOTE_OUTLINE_STYLES,
  fill: {
    '': '#surface-3 #note-accent-surface.0',
    hovered: '#surface-3 #note-accent-surface.03',
    pressed: '#surface-3 #note-accent-surface.09',
    selected: '#surface-3 #note-accent-surface.09',
    'selected & (hovered | focused)': '#surface-3 #note-accent-surface.12',
    'selected & pressed': '#surface-3 #note-accent-surface.18',
    disabled: '#surface-3 #disabled-surface',
    'selected & disabled': '#surface-3 #note-accent-surface.08',
  },
} as const;

export const NOTE_CLEAR_STYLES: Styles = {
  // Non-selected = old NOTE NEUTRAL; selected = old NOTE CLEAR.
  outline: {
    '': '0 #primary-accent-text.0',
    focused: '1bw #primary-accent-text',
  },
  border: {
    '': 'transparent',
  },
  fill: {
    '': '#surface-text.0',
    'hovered | focused': '#surface-text.04',
    pressed: '#surface-text.06',
    selected: '#note-accent-text.09',
    'selected & (hovered | focused)': '#note-accent-text.12',
    'selected & pressed': '#note-accent-text.18',
    disabled: 'transparent',
    'selected & disabled': '#note-accent-text.08',
  },
  color: {
    '': '#note-accent-text-soft',
    selected: '#note-accent-text',
    disabled: '#disabled-surface-text',
    'selected & disabled': '#note-accent-disabled-text',
  },
} as const;

export const NOTE_LINK_STYLES: Styles = {
  // See DEFAULT_LINK_STYLES for the soft→strong rationale.
  outline: {
    '': '0 #primary-accent-text.0',
    focused: '1bw #primary-accent-text',
  },
  border: 0,
  fill: {
    '': 'transparent',
  },
  color: {
    '': '#note-accent-text-soft',
    'hovered & !pressed': '#note-accent-text',
    disabled: '#disabled-surface-text',
  },
} as const;

export const NOTE_ITEM_STYLES: Styles = {
  border: 'transparent',
  fill: {
    '': '#note-accent-text.0',
    'hovered | focused': '#note-accent-text.03',
    selected: '#note-accent-text.09',
    'selected & (hovered | focused)': '#note-accent-text.12',
    pressed: '#note-accent-text.09',
    disabled: 'transparent',
  },
  color: {
    '': '#note-accent-text',
    hovered: '#note-accent-text',
    pressed: '#note-accent-text',
    disabled: '#note-accent-text.4',
  },
} as const;

// ---------- SPECIAL THEME ----------
// Every color here resolves to a fixed-mode value (built-in `#white`, the
// standalone `#special-*` theme in `src/tokens/palette.ts`, or `transparent`).
// `mode: 'fixed'` makes the resolved OKHSL identical in light, dark, and
// high-contrast, so the special theme renders the same regardless of scheme.
// The only intentionally adaptive colors are `VALIDATION_STYLES.border`
// (`#danger-accent-text` / `#success-accent-text`) — validation state is allowed to follow
// the active scheme.
export const SPECIAL_PRIMARY_STYLES: Styles = {
  // Focus ring uses `#special-accent-text` — a fixed-mode dark-purple that
  // stays identical across light/dark/HC, matching the special theme's
  // "intentionally non-inverting" identity. Picked over `#primary-accent-text`
  // (the cross-theme default) which is `mode: 'auto'` and would shift in dark.
  outline: {
    '': '0 #special-accent-text.0',
    focused: '1bw #special-accent-text',
  },
  border: {
    '': '#special-accent-surface-border',
    pressed: '#special-accent-surface-border',
    disabled: 'transparent',
  },
  // See `DEFAULT_PRIMARY_STYLES.fill` for the layer-shape + ramp rationale.
  // The base layer is `#white` (matching the rest of the special theme's
  // anchor) instead of `#surface`, but the same monotonic `-1`/`-2`/`-3`
  // ramp gives the brand fill a visibly darker hover and pressed state.
  fill: {
    '': '#white #special-accent-surface',
    hovered: '#white #special-accent-surface-2',
    pressed: '#white #special-accent-surface-3',
    disabled: '#white #special-accent-disabled-surface',
  },
  color: {
    '': '#white',
    disabled: '#special-accent-disabled-surface-text',
  },
} as const;

export const SPECIAL_OUTLINE_STYLES: Styles = {
  // Non-selected = old SPECIAL OUTLINE; selected = old SPECIAL SECONDARY.
  // Special is anchored on `#special-surface` (a fixed dark-purple base), so
  // contrast is added by *whitening* the overlay rather than darkening it.
  // The same default → hover → pressed monotonic-contrast pattern as the
  // light themes is preserved, just with white-alpha steps that are tuned
  // to read against the dark base.
  //
  // IMPORTANT: every alpha step within a single state-map must be a unique
  // value string. Tasty's `mergeEntriesByValue` pass coalesces entries that
  // share a serialized value into a single OR-condition entry whose priority
  // is the *max* of the merged group. If `hovered` and `disabled` were both
  // `#white.12`, the merged entry would sit at the higher priority and
  // negate against the `selected & (hovered | focused)` rule below, making
  // the latter resolve to FALSE for `selected & hovered`. Keeping every
  // alpha distinct sidesteps the collision.
  //
  // Focus ring uses the fixed-mode `#special-accent-text` so the indicator
  // stays scheme-invariant alongside the rest of the special theme — see
  // `SPECIAL_PRIMARY_STYLES.outline` for the full rationale.
  outline: {
    '': '0 #special-accent-text.0',
    focused: '1bw #special-accent-text',
  },
  border: {
    '': '#white.15',
    selected: '#white.2',
    ...(VALIDATION_STYLES.border as Record<string, string>),
  },
  fill: {
    '': '#special-surface #white.0',
    hovered: '#special-surface #white.06',
    pressed: '#special-surface #white.12',
    selected: '#special-surface #white.18',
    'selected & (hovered | focused)': '#special-surface #white.24',
    'selected & pressed': '#special-surface #white.3',
    disabled: '#special-surface #white.04',
    // Stays in the white-alpha register: the base here is a fixed dark tone.
    // Like the colored themes, a disabled SELECTED control keeps the chip it
    // has when enabled and fades only the label — `.17` rather than a literal
    // reuse of `selected`'s `.18` so the two do not serialize identically and
    // trip `mergeEntriesByValue`, exactly as `SPECIAL_CLEAR_STYLES` documents.
    'selected & disabled': '#special-surface #white.17',
  },
  // Mirrors the colored-theme soft→opaque pattern (`*-accent-text-soft` →
  // `*-accent-text`) using white-alpha steps: default is slightly muted so
  // that selected reads as the more prominent state.
  //
  // Both disabled labels are solved for cr ≈ 2.0 against the chip they sit on
  // — the house figure for a disabled label, which `disabled-surface-text`
  // hits against `surface` and which this theme's own `primary` disabled pair
  // hits at 1.73. They used to measure 3.24 and 4.21: not only too legible for
  // a dead control, but INVERTED, since the selected one out-read the plain
  // one. The two alphas differ because they resolve against different chips
  // (`.04` and `.17`), which lands them on the same contrast rather than the
  // same opacity.
  color: {
    '': '#white.8',
    selected: '#white',
    disabled: '#white.23',
    'selected & disabled': '#white.28',
  },
} as const;

export const SPECIAL_CLEAR_STYLES: Styles = {
  // Non-selected = old SPECIAL NEUTRAL: transparent / white-tinted overlay
  // on the dark base.
  // Selected INVERTS the surface — the fill flips to a solid white pill with
  // dark accent-text on top. To express "increasing contrast on press" in
  // this inverted layout we go the *other* direction: pure white at rest →
  // slightly tinted on hover → more tinted on press, i.e. progressively
  // letting the dark base bleed through. This keeps the monotonic-contrast
  // pattern semantically (hover < pressed) while preserving the inversion.
  //
  // IMPORTANT: every alpha step within a single state-map must be a unique
  // value string. Tasty's `mergeEntriesByValue` pass coalesces entries that
  // share a serialized value into a single OR-condition entry whose priority
  // is the *max* of the merged group, which then negates against lower-
  // priority rules. If `'hovered | focused'` and `'selected & disabled'`
  // both used `#white.12`, the merged entry would sit at priority 7 and
  // negate against `'selected & (hovered | focused)'` (priority 4), making
  // it resolve to FALSE for `selected & hovered` — which is exactly the
  // "selected-hover stays dark" bug. `'selected & disabled'` therefore uses
  // `#white.98` rather than a literal reuse of `selected`'s `#white`: the 2%
  // of dark base bleeding through is invisible, and the string is distinct.
  // The default `''` and `disabled` may share `#white.0` because Tasty keeps
  // the TRUE/default entry separate from non-defaults during merging.
  //
  // Disabling a SELECTED control keeps the inverted pill and fades only the
  // label, the same rule the rest of this file follows — the chip is what says
  // "this one is on". Here that means fading the DARK label toward the pill
  // rather than a white one toward the base, so the disabled label is
  // `#special-accent-text` at `.45`: cr 1.95 against the pill, the same figure
  // the white-alpha variants are solved for.
  //
  // Focus ring uses the fixed-mode `#special-accent-text` so the indicator
  // stays scheme-invariant alongside the rest of the special theme — see
  // `SPECIAL_PRIMARY_STYLES.outline` for the full rationale.
  outline: {
    '': '0 #special-accent-text.0',
    focused: '1bw #special-accent-text',
  },
  border: {
    '': 'transparent',
    ...(VALIDATION_STYLES.border as Record<string, string>),
  },
  fill: {
    '': '#white.0',
    'hovered | focused': '#white.12',
    pressed: '#white.18',
    selected: '#white',
    'selected & (hovered | focused)': '#white.94',
    'selected & pressed': '#white.88',
    disabled: '#white.0',
    'selected & disabled': '#white.98',
  },
  // Non-selected mirrors the colored-theme soft→opaque pattern with
  // white-alpha steps. Selected keeps its inverted look — dark accent-text
  // on a white pill — so the soft/opaque transition only applies to the
  // non-selected variant.
  color: {
    '': '#white.8',
    selected: '#special-accent-text',
    // Solved for cr ≈ 2.0 against what each one sits on — the bare surface, and
    // the inverted white pill. See `SPECIAL_OUTLINE_STYLES.color`.
    disabled: '#white.23',
    'selected & disabled': '#special-accent-text.45',
  },
} as const;

export const SPECIAL_LINK_STYLES: Styles = {
  // See `SPECIAL_PRIMARY_STYLES.outline` for why we use the fixed-mode
  // `#special-accent-text` here instead of the cross-theme `#primary-accent-text`.
  outline: {
    '': '0 #special-accent-text.0',
    focused: '1bw #special-accent-text',
  },
  border: '0',
  fill: {
    '': 'transparent',
  },
  color: {
    '': '#white',
    'hovered & !pressed': '#white.9',
    disabled: '#white.23',
  },
} as const;

export const SPECIAL_ITEM_STYLES: Styles = {
  border: 'transparent',
  fill: {
    '': '#white.0',
    hovered: '#white.12',
    'pressed | (selected & !hovered)': '#white.18',
  },
  color: {
    '': '#white',
    disabled: '#white.23',
  },
} as const;

// ---------- CURRENT THEME ----------
// Every color is derived from the *inherited* text color (`#current` →
// `currentcolor`), so the element adopts whatever color its context paints
// with: a colored Alert, a dark banner, an image overlay, a chart tooltip.
//
// That makes it a THEME rather than a type. The other themes each pick a brand
// ramp and let `type` decide the shape (filled, outlined, borderless, textual);
// `current` picks the inherited color and lets `type` decide the same shapes.
// Every type therefore has a flavour here, and the `theme` axis is what a host
// component switches — `type` keeps meaning what it means everywhere else.
//
// `color: '#current'` compiles to `color: currentcolor`, which CSS resolves as
// `color: inherit` — so the label stays fully opaque and, crucially, the
// element's own `currentcolor` (used by `fill`/`border` below) is the INHERITED
// color rather than a faded one. The alpha steps are then mixed off that same
// color, which is why the whole ramp tracks the context automatically.
//
// IMPORTANT: every alpha step within one state-map must be a unique value
// string — Tasty's `mergeEntriesByValue` pass coalesces equal values into one
// OR-entry at the group's max priority, which then negates against
// lower-priority rules. So no two steps in one map may share an alpha. See
// `SPECIAL_OUTLINE_STYLES` for the full explanation.
//
// A note on `disabled`: fading the label also fades the element's own
// `currentcolor`, so every other alpha is multiplied by .4 on that state.
// Disabled `fill`/`border` are therefore written PRE-MULTIPLIED where they need
// to stay visible.
//
// A note on what a single color cannot do: `primary` in every other theme is an
// opaque brand fill under a `#white` label. There is no second color here to
// punch the label out with — the inherited one is the only thing on hand, and
// the surface behind it is unknown — so `current.primary` escalates on alpha
// instead: the same construction as `outline`, at the strongest step the
// contrast budget below allows. It reads as filled, not as inverted.

// The alpha ramp for the item flavour, held in custom properties rather than
// written inline in `fill`. Two reasons:
//
// 1. Unlike the brand tokens, `#current` alphas do NOT adapt to the color
//    scheme: a 4% tint of a dark label on a light surface reads far stronger
//    than a 4% tint of a light label on a dark one, so one ramp cannot serve
//    both. Each step therefore carries a per-surface value — the base entry for
//    the light scheme, `@dark` for the dark scheme, and `surface=special` for
//    the special theme's dark-purple surface. Special is *static* (identical in
//    light, dark and HC by design — see the SPECIAL section above), so it needs
//    a single ramp rather than a light/dark pair. `surface=special` resolves
//    against `data-surface`, which `ItemAction` and `ItemBadge` set from the
//    surrounding `ItemActionProvider`: it names the surface the element is
//    painted ON, which is a different question from its own `theme` now that
//    `current` occupies that axis.
// 2. Writing three ramps straight into one `fill` map would put ~18 alpha
//    values in a single state-map, and Tasty's `mergeEntriesByValue` pass
//    coalesces any two equal value strings into one OR-entry at the group's max
//    priority, which then negates against lower-priority rules. Giving each
//    step its own 3-entry map keeps every value string unique by construction —
//    the constraint that `SPECIAL_OUTLINE_STYLES` documents the hard way.
//
// The special steps run higher than the light ones because they resolve against
// a `#white.8` label: an authored `.15` nets roughly the `.12` that
// `SPECIAL_CLEAR_STYLES` uses on the same base.
//
// SELECTED steps jump well clear of the interaction steps rather than continuing
// them. Every other theme marks selection with a brand *hue* — an accent-tinted
// fill under an accent label — and `current` has exactly one color to work with,
// so it cannot. Alpha is the only channel left, and a step that merely continued
// the hover/press ramp (the original `.04 → .06 → .09`) read as a slightly dirty
// background rather than an "on" state. Selection is a persistent state, not a
// transient one, so it earns the bigger jump; hover and press stay subtle so an
// unselected row full of actions does not look busy.
// Only the LIGHT ramp can spend freely. There the chip is a pale tint and the
// label stays opaque and dark, so contrast barely moves (.30 still measures
// 5.66:1). On a dark surface the same construction inverts: the chip is a light
// tint climbing toward an equally light label, so it swallows it. Both dark
// surfaces hit the AA floor (4.5:1) for their label at exactly `.24` — measured,
// not guessed — which is the ceiling every dark step below is written under, and
// why `selected` there is a smaller jump than in light. `SPECIAL_CLEAR_STYLES`
// escaped the same ceiling by INVERTING selected to a white pill with dark text;
// a single inherited color cannot do that.
const CURRENT_ITEM_RAMP: Styles = {
  '$current-hover': {
    '': '#current.04',
    '@dark': '#current.07',
    'surface=special': '#current.08',
  },
  '$current-press': {
    '': '#current.06',
    '@dark': '#current.11',
    'surface=special': '#current.12',
  },
  '$current-selected': {
    '': '#current.18',
    '@dark': '#current.16',
    'surface=special': '#current.17',
  },
  '$current-selected-hover': {
    '': '#current.24',
    '@dark': '#current.19',
    'surface=special': '#current.21',
  },
  '$current-selected-press': {
    '': '#current.3',
    '@dark': '#current.22',
    'surface=special': '#current.24',
  },
} as const;

// The focus ring is the one color NOT taken from `#current`: every theme in this
// file uses `#primary-accent-text` (the special theme swapping in its fixed-mode
// counterpart), so the focus indicator stays the same wherever it appears.
const CURRENT_FOCUS_RING: Styles = {
  outline: {
    '': '0 #primary-accent-text.0',
    focused: '1bw #primary-accent-text',
  },
} as const;

// Item flavour — the `current` counterpart of `*_ITEM_STYLES`: no border,
// nothing painted at rest, the fill appearing only on interaction. Used for
// list rows (`Item`, `ItemButton`), where a resting chip on every row would read
// as noise. Like the other `*_ITEM_STYLES` it leaves the focus ring to the base
// styles (the collection that owns the row indicates focus), and only steps the
// fill.
export const CURRENT_ITEM_STYLES: Styles = {
  ...CURRENT_ITEM_RAMP,
  border: 'transparent',
  fill: {
    '': '#current.0',
    'hovered | focused': 'var(--current-hover)',
    pressed: 'var(--current-press)',
    selected: 'var(--current-selected)',
    'selected & (hovered | focused)': 'var(--current-selected-hover)',
    'selected & pressed': 'var(--current-selected-press)',
    disabled: 'transparent',
  },
  color: {
    '': '#current',
    // Fade exactly once per subtree, and only where nothing above has faded
    // already. `#current` is the color this element INHERITS, so a second `.4`
    // multiplies against the first and the label washes out — an action inside a
    // disabled row measured `.4` of an already muted token, roughly
    // `rgb(224,225,228)` on white, against the row's own `rgb(178,181,205)`.
    //
    // Two mods say "someone above already did it", and both are set by exactly
    // one caller:
    //
    //   `inherit-disabled`  `ItemAction`, when its disabled state came from the
    //                       surrounding `ItemActionProvider` rather than its own
    //                       prop — the host row already faded the color it paints
    //                       from.
    //   `inside-wrapper`    `ItemButton`, on the row it renders inside
    //                       `ActionsWrapper`. The wrapper reproduces this same
    //                       disabled color (see `ITEM_RESTING_COLOR_VARIANTS`) so
    //                       that actions rendered as SIBLINGS of the row inherit
    //                       a faded `currentcolor` too; the row is a descendant
    //                       of that wrapper, so it is already faded when it
    //                       arrives here.
    //
    // Neither mod is set on a standalone `Item` or on `Button`, so both keep
    // fading themselves exactly as before. Every `current` flavour states the
    // gate identically — a flavour that spelled it `disabled` alone would fade a
    // second time in both of those nestings.
    'disabled & !inherit-disabled & !inside-wrapper': '#current.4',
  },
} as const;

// Clear flavour — the item ramp on a focusable control. `*_CLEAR_STYLES` and
// `*_ITEM_STYLES` differ by exactly this in every other theme too: same
// borderless shape, same interaction fill, plus the ring a standalone control
// needs. It is the default flavour for `ItemAction` and `ItemBadge`.
export const CURRENT_CLEAR_STYLES: Styles = {
  ...CURRENT_ITEM_STYLES,
  ...CURRENT_FOCUS_RING,
  fill: {
    ...(CURRENT_ITEM_STYLES.fill as Record<string, string>),
    // The one entry `clear` adds to the item ramp, and the same split the
    // colored themes make: `*_ITEM_STYLES` let a disabled row fall back to a
    // bare `transparent`, while `*_CLEAR_STYLES` keep a chip so a disabled
    // segmented control still shows which option is active. Without it a
    // disabled selected `clear` rendered nothing at all — the state was
    // indistinguishable from an unselected one.
    //
    // `.18` is `CURRENT_OUTLINE_STYLES`' own disabled selected chip, so the two
    // differ by exactly the border, and it is authored high for the same reason
    // documented there: the disabled label dims `currentcolor` to `.4`, and
    // this alpha resolves against it, rendering as ~`.07`.
    'selected & disabled': '#current.18',
  },
} as const;

// Outline flavour — a standalone control, so it carries its own weight: a
// resting `#current.03` chip inside a `#current.08` border. `.03` is enough to
// separate the button from a flat background without reading as a filled
// surface, while leaving room for four distinguishable steps above it.
// Disabled `fill`/`border` are pre-multiplied (`.06`/`.12` → an effective
// `.024`/`.048`) so the chip stays a muted version of itself instead of
// vanishing.
export const CURRENT_OUTLINE_STYLES: Styles = {
  ...CURRENT_FOCUS_RING,
  border: {
    '': '#current.08',
    'hovered | focused': '#current.15',
    pressed: '#current.25',
    selected: '#current.3',
    'selected & pressed': '#current.4',
    disabled: '#current.12',
    'selected & disabled': '#current.35',
  },
  fill: {
    '': '#current.03',
    'hovered | focused': '#current.07',
    pressed: '#current.1',
    selected: '#current.12',
    'selected & (hovered | focused)': '#current.16',
    'selected & pressed': '#current.2',
    disabled: '#current.06',
    // Alpha step rather than a brand token — `current` inherits `currentcolor`.
    // Authored high because the disabled label already dims `currentcolor` to
    // `.4`, and these alphas resolve against it: `.18` renders as ~.07.
    'selected & disabled': '#current.18',
  },
  color: {
    '': '#current',
    // See `CURRENT_ITEM_STYLES.color` for why this is gated rather than a bare
    // `disabled`: both mods mark a color that something above already faded.
    'disabled & !inherit-disabled & !inside-wrapper': '#current.4',
  },
} as const;

// Outline-2 flavour — `outline` for a container that is already painting
// something. In the brand themes the difference is the opaque base (`#surface-3`
// instead of `#surface-2`); `current` has no opaque base to swap, since every
// step is a translucent tint over whatever is behind it. The same intent —
// "stay legible one rung further up the surface ladder" — is therefore carried
// by a heavier tint at every step: roughly double `outline`'s resting chip, so
// the control still separates from a tinted or busy container.
export const CURRENT_OUTLINE_2_STYLES: Styles = {
  ...CURRENT_FOCUS_RING,
  border: {
    '': '#current.14',
    'hovered | focused': '#current.22',
    pressed: '#current.3',
    selected: '#current.36',
    'selected & pressed': '#current.45',
    disabled: '#current.2',
    'selected & disabled': '#current.5',
  },
  fill: {
    '': '#current.06',
    'hovered | focused': '#current.11',
    pressed: '#current.15',
    selected: '#current.17',
    'selected & (hovered | focused)': '#current.21',
    // `.24` is the measured AA ceiling for a full-strength label on a dark
    // surface (see the ramp comment above) — the top step stops there rather
    // than continuing the interval.
    'selected & pressed': '#current.24',
    disabled: '#current.1',
    'selected & disabled': '#current.26',
  },
  color: {
    '': '#current',
    // See `CURRENT_ITEM_STYLES.color` for why this is gated rather than a bare
    // `disabled`: both mods mark a color that something above already faded.
    'disabled & !inherit-disabled & !inside-wrapper': '#current.4',
  },
} as const;

// Primary flavour — the high-emphasis control, and the only `current` flavour
// that INVERTS: the fill is the inherited color at full opacity and the label
// is punched out of it with `#surface`, exactly as every other
// theme's `primary` paints `#white` on an opaque brand fill.
//
// The states are the second fill layer. There is no lighter or darker sibling
// of an arbitrary inherited color to step to — the brand ramps walk
// `accent-surface` → `-2` → `-3` — so hover and pressed lay a translucent
// `#black` over the same base instead, which darkens in both schemes and so
// keeps the same monotonic direction the brand primaries have.
//
// The label CANNOT go through `color`. `#current` compiles to the literal
// `currentcolor`, which in `fill` resolves against the element's OWN `color`,
// so setting `color: '#surface'` would make the fill resolve to the
// label color and paint a white pill with a white label. Tasty's `--current-color`
// is no escape either: the `color` handler rewrites it on the same element.
// `-webkit-text-fill-color` paints the glyphs without touching `color`, so
// `currentcolor` keeps meaning the INHERITED color for `fill` and `border`.
// Icons are SVG painted with `fill="currentColor"`, which that property does not
// reach, so they take the label color through the `Icon` sub-element.
export const CURRENT_PRIMARY_STYLES: Styles = {
  ...CURRENT_FOCUS_RING,
  // Every other `primary` rims its fill with a lighter sibling
  // (`accent-surface-border` over `accent-surface`, cr 1.48 against it in both
  // schemes). An arbitrary inherited color has no such sibling, so the rim comes
  // from the same token the label does — the one color guaranteed to sit on the
  // opposite side of the fill in either scheme. `.25` measures cr 1.82 in light
  // and 1.55 in dark against the fill: the brand rim's presence, a shade more so
  // in light, where `current` has no other edge cue.
  //
  // Disabled swaps to the neutral text color, and has to. The chip there is a
  // `.4` tint sitting close to the page, so a `#surface` rim washes into the
  // page rather than defining the chip; `#surface-text` goes the other way and
  // holds cr ~1.5 against the chip AND 2.8–3.7 against the page. It is also
  // immune to the `.4` fade below, which `#current` is not — a `#current` rim on
  // a disabled chip resolves to the fill's own color and disappears.
  border: {
    '': '#surface.25',
    disabled: '#surface-text.2',
  },
  fill: {
    '': '#current',
    'hovered | focused': '#current #black.08',
    pressed: '#current #black.16',
  },
  // Disabled is expressed HERE and nowhere else, and that is the whole trick.
  // `fill` and `border` resolve `currentcolor` against this element's own
  // `color`, so fading it once fades the chip with it: their default entries
  // still read `#current`, which under `disabled` is already the `.4` color,
  // and the chip lands at exactly `.4`. Writing `.4` in all three would apply
  // the fade twice and land it at `.16` — the pre-multiply trap the other
  // `current` ramps document at length.
  //
  // It has to fade rather than stay put, because descendants read it too: an
  // action inside a disabled row suppresses its OWN fade on the grounds that
  // the host already muted the color it paints from (see
  // `CURRENT_ITEM_STYLES.color`), so a host that stayed at full strength would
  // hand it a live color next to a dead chip.
  color: {
    '': '#current',
    // See `CURRENT_ITEM_STYLES.color` for why this is gated rather than a bare
    // `disabled`: both mods mark a color that something above already faded.
    'disabled & !inherit-disabled & !inside-wrapper': '#current.4',
  },
  '-webkit-text-fill-color': {
    '': '#surface',
    disabled: '#surface.5',
  },
  // Every icon-bearing slot, not just the leading one. `-webkit-text-fill-color`
  // paints glyphs and inherits into the text slots for free, but icons are SVG
  // stroked with `currentColor`, which it does not reach — so an un-recolored
  // slot would keep the inherited color and vanish into the fill it matches.
  ...Object.fromEntries(
    ['Icon', 'RightIcon', 'Prefix', 'Suffix'].map((slot) => [
      slot,
      {
        color: {
          '': '#surface',
          disabled: '#surface.5',
        },
      },
    ]),
  ),
} as const;

// Link flavour — no chip at all, only the label. The brand themes intensify from
// `accent-text-soft` at rest to `accent-text` on hover; with one color to work
// with, "soft" is that color at `.8` and "strong" is it at full opacity.
export const CURRENT_LINK_STYLES: Styles = {
  ...CURRENT_FOCUS_RING,
  border: 0,
  fill: {
    '': 'transparent',
  },
  color: {
    '': '#current.8',
    'hovered & !pressed': '#current',
    // See `CURRENT_ITEM_STYLES.color`.
    'disabled & !inherit-disabled & !inside-wrapper': '#current.4',
  },
} as const;

// Card flavour — the `current` counterpart of `*_CARD_STYLES`: a static,
// non-interactive panel. The label stays at full opacity so the tint and border
// resolve against the inherited color rather than a faded one.
export const CURRENT_CARD_STYLES: Styles = {
  border: '#current.2',
  fill: '#current.05',
  color: '#current',
} as const;

// ---------- INVERT TYPE ----------
// The page and its text, swapped. The fill is the theme's `accent-text` — the
// color that is normally PAINTED on the page — and the label is `#surface`, the
// page itself. That makes the control sit on the opposite side of the page in
// either scheme, which is what "invert" means and what separates it from
// `primary`: `primary` pins a fixed `#white` label on a brand SURFACE, so it
// reads the same weight in light and dark; `invert` follows the scheme.
//
//         page      fill (accent-text)   label (#surface)
//   light L 1.00    L 0.47  (dark)       L 1.00  (white)
//   dark  L 0.24    L 0.76  (light)      L 0.24  (near-black)
//
// The label is `#surface` and NOT `#surface-text`, which is the trap this pairing
// invites: `surface-text` is the color painted ON the page, so it sits on the
// SAME side of the fill as `accent-text` does and the two collapse — measured
// cr 2.60 in light and 1.91 in dark, against 6.96 / 7.52 for `#surface`.
//
// Hover and pressed darken through a second fill layer rather than stepping to a
// darker sibling, because `accent-text` has none: its `-soft` counterpart is
// LIGHTER. A `#black` overlay darkens in both schemes, so the monotonic
// default → hover → pressed direction survives the scheme flip. Every entry
// keeps the same two-layer shape so the overlay interpolates instead of snapping
// — see `DEFAULT_PRIMARY_STYLES.fill`.
//
// Disabled hands over to the brand-tinted pair `primary` already uses, so the
// two filled types mute identically and the alphas stay calibrated in one place.
// It rides on THIS type's base layer (`accent-text`) rather than `primary`'s
// (`#surface`), which changes nothing at rest — `accent-disabled-surface` is an
// opaque glaze tone, so it hides whatever is under it — but keeps the base
// constant across all four states. Swapping the base on `disabled` alone would
// animate `background-color` from the fill color to the page while the overlay
// is still part-transparent, which is the surface flash `DEFAULT_PRIMARY_STYLES`
// keeps its own base pinned to avoid.
//
// Written through a factory rather than seven near-identical objects on purpose.
// The only thing that varies is the theme prefix, and hand-copying that is
// exactly how `selected & disabled` ended up on the wrong token for four themes
// earlier in this PR.
const invertStyles = (accent: string): Styles => ({
  outline: {
    '': '0 #primary-accent-text.0',
    focused: '1bw #primary-accent-text',
  },
  // No lighter sibling of `accent-text` exists to rim with, so the rim is the
  // label token at low alpha — guaranteed to sit opposite the fill in either
  // scheme. cr ~1.8 in light and ~1.6 in dark against the fill, against the 1.48
  // that `accent-surface-border` measures on `primary`.
  border: {
    '': '#surface.25',
    disabled: 'transparent',
  },
  fill: {
    '': `#${accent}-accent-text #black.0`,
    hovered: `#${accent}-accent-text #black.08`,
    pressed: `#${accent}-accent-text #black.16`,
    disabled: `#${accent}-accent-text #${accent}-accent-disabled-surface`,
  },
  color: {
    '': '#surface',
    disabled: `#${accent}-accent-disabled-surface-text`,
  },
});

export const DEFAULT_INVERT_STYLES: Styles = invertStyles('primary');
export const DANGER_INVERT_STYLES: Styles = invertStyles('danger');
export const SUCCESS_INVERT_STYLES: Styles = invertStyles('success');
export const WARNING_INVERT_STYLES: Styles = invertStyles('warning');
export const NOTE_INVERT_STYLES: Styles = invertStyles('note');

// The special theme inverts against its OWN surface rather than the page: that
// surface is a fixed dark purple, so the inverted control is a white pill with
// the theme's dark accent on it — the same figure `SPECIAL_CLEAR_STYLES` strikes
// when selected. Both tokens are fixed-mode, so this stays scheme-invariant like
// the rest of the theme, where a `#surface` label would not.
//
// The fill base is `#white` in every state, disabled included — the same pin
// `SPECIAL_PRIMARY_STYLES` holds, and for the same reason. See the note on the
// factory above.
export const SPECIAL_INVERT_STYLES: Styles = {
  outline: {
    '': '0 #special-accent-text.0',
    focused: '1bw #special-accent-text',
  },
  border: {
    '': '#white.25',
    disabled: 'transparent',
  },
  fill: {
    '': '#white #black.0',
    hovered: '#white #black.08',
    pressed: '#white #black.16',
    disabled: '#white #special-accent-disabled-surface',
  },
  color: {
    '': '#special-accent-text',
    disabled: '#special-accent-disabled-surface-text',
  },
} as const;

// The `current` theme is the one special case, because it has no `accent-text`
// to fill with — it has exactly one color, the one it inherits. So `invert` here
// is literally `CURRENT_PRIMARY_STYLES` with its two colors swapped:
//
//              fill          label
//   primary    #current      #surface   — paint the color, punch the page out of it
//   invert     #surface      #current   — paint the page, write the color on it
//
// That is the same swap `special` makes between its own two filled types (a
// brand surface under `#white`, against a white pill under the dark accent), so
// the pairing reads the same way on every theme even though the tokens differ.
//
// Swapping the colors also removes the machinery `primary` needs. There,
// `#current` is BOTH the fill and the value `currentcolor` resolves against, so
// the label has to be painted with `-webkit-text-fill-color` to keep `color`
// free — and every icon slot has to be recolored by hand, because SVG stroked
// with `currentColor` does not see that property. Here the fill is `#surface`,
// an absolute token that never consults `color`, so `color` is just the label
// and icons inherit it for free. That is also what makes the `--current-accent`
// hook below possible: with `color` free, a container can redirect it.
export const CURRENT_INVERT_STYLES: Styles = {
  ...CURRENT_FOCUS_RING,
  // The rim is the inherited color at `primary`'s own `.25`, and it needs no
  // disabled entry: `#current` resolves against this element's `color`, which
  // the fade below already moved, so the rim fades with the label. That is the
  // pre-multiply trap the rest of this section documents, used deliberately —
  // it is only a trap when a value is faded twice on purpose.
  border: '#current.25',
  // The overlay tints TOWARDS the inherited color rather than darkening with
  // `#black` the way the brand `invert` ramps do. On a white page that reads as
  // a darkening and on a dark one as a lightening, so the step is visible in
  // both schemes — where a fixed `#black` over a near-black `#surface` would
  // barely move. Same two-layer shape in every state so the overlay
  // interpolates; see `DEFAULT_PRIMARY_STYLES.fill`.
  fill: {
    '': '#surface #current.0',
    'hovered | focused': '#surface #current.08',
    pressed: '#surface #current.16',
    // Half-strength page color lets the container show through, so a dead
    // control stops reading as a solid chip. The label and rim fade with the
    // color below.
    disabled: '#surface.5 #current.0',
  },
  // The one place a container can intervene. `--current-accent` names a color a
  // container OFFERS to the `current` theme, for the case the theme cannot solve
  // on its own: this flavour writes its label on a `#surface` pill, so it breaks
  // wherever the inherited color IS `#surface`. A `Banner` is exactly that — it
  // labels itself `#white` in both schemes, and `#surface` is white in light, so
  // an unaided `current.invert` inside one measures cr 1.00.
  //
  // Unset it and the fallback is `currentcolor`, which is what `#current`
  // compiled to before, so nothing outside such a container changes.
  //
  // The contract for a container that sets it: OWN THAT COLOR IN EVERY STATE,
  // the disabled one included. The fade below is gated on `!inherit-disabled`
  // because something above is expected to have faded the color this element
  // paints from — automatic when that color is inherited, but an offered accent
  // is not inherited, so the offer has to carry its own muted entry. A
  // container that offers only a live accent leaves a full-strength label on a
  // dead chip. See `BANNER_ACTION_ACCENT`, which pairs each entry with a `.4`
  // counterpart, and the test that pins the pairing.
  //
  // Only `color` reads it, and everything else follows for free: `#current`
  // compiles to `currentcolor`, which in `border` and `fill` resolves against
  // this element's OWN `color` — so the rim and the hover/pressed overlays all
  // re-aim at the offered accent without naming it twice. Deliberately NOT read
  // by the other `current` flavours: they paint their chip ON the container
  // rather than on a pill, so the inherited color is already the right one and
  // an offered accent would only lower their contrast — a `#danger-accent-text`
  // dismiss icon on a danger banner measures 1.53, against the 4.62 `#white` gets.
  //
  // The disabled entry spells the mix out rather than writing `#current.4`,
  // which would compile to `color-mix(… currentcolor …)` — and `currentcolor`
  // inside the `color` property means the INHERITED value, so it would fade the
  // container's color instead of the accent.
  color: {
    '': 'var(--current-accent, currentcolor)',
    // See `CURRENT_ITEM_STYLES.color` for why this is gated rather than a bare
    // `disabled`: both mods mark a color that something above already faded.
    'disabled & !inherit-disabled & !inside-wrapper':
      'color-mix(in oklab, var(--current-accent, currentcolor) 40%, transparent)',
  },
} as const;

// ---------- CARD TYPE STYLES ----------
// Card type only supports: default, success, danger, note themes (plus the
// `current` theme — see `CURRENT_CARD_STYLES` above)

export const DEFAULT_CARD_STYLES: Styles = {
  border: '#surface-text.20',
  fill: '#surface-3',
  color: '#surface-text-soft',
} as const;

export const SUCCESS_CARD_STYLES: Styles = {
  border: '#success-accent-surface.20',
  fill: '#success-surface',
  color: '#success-accent-text',
} as const;

export const DANGER_CARD_STYLES: Styles = {
  border: '#danger-accent-surface.20',
  fill: '#danger-surface',
  color: '#danger-accent-text',
} as const;

export const WARNING_CARD_STYLES: Styles = {
  border: '#warning-accent-surface.20',
  fill: '#warning-surface',
  color: '#warning-accent-text',
} as const;

export const NOTE_CARD_STYLES: Styles = {
  border: '#note-accent-surface.20',
  fill: '#note-surface',
  color: '#note-accent-text',
} as const;

export type ItemVariant =
  // Inherited-color theme — every flavour mixes its colors from `currentcolor`
  // instead of a brand ramp. See the CURRENT THEME section.
  | 'current.item'
  | 'current.invert'
  | 'current.primary'
  | 'current.outline'
  | 'current.outline-2'
  | 'current.clear'
  | 'current.link'
  | 'current.card'
  | 'default.invert'
  | 'default.primary'
  | 'default.outline'
  | 'default.outline-2'
  | 'default.clear'
  | 'default.link'
  | 'default.item'
  | 'default.card'
  | 'danger.invert'
  | 'danger.primary'
  | 'danger.outline'
  | 'danger.outline-2'
  | 'danger.clear'
  | 'danger.link'
  | 'danger.item'
  | 'danger.card'
  | 'success.invert'
  | 'success.primary'
  | 'success.outline'
  | 'success.outline-2'
  | 'success.clear'
  | 'success.link'
  | 'success.item'
  | 'success.card'
  | 'warning.invert'
  | 'warning.primary'
  | 'warning.outline'
  | 'warning.outline-2'
  | 'warning.clear'
  | 'warning.link'
  | 'warning.item'
  | 'warning.card'
  | 'note.invert'
  | 'note.primary'
  | 'note.outline'
  | 'note.outline-2'
  | 'note.clear'
  | 'note.link'
  | 'note.item'
  | 'note.card'
  | 'special.invert'
  | 'special.primary'
  | 'special.outline'
  | 'special.clear'
  | 'special.link'
  | 'special.item';

// The single `theme.type` → styles map. Exported so `Item` and the projections
// below cannot drift apart: `ITEM_RESTING_COLOR_VARIANTS` is derived from this
// object rather than restating the palette.
export const ITEM_VARIANTS: Record<ItemVariant, Styles> = {
  // Current theme — colors mixed from the inherited `currentcolor`
  'current.item': CURRENT_ITEM_STYLES,
  'current.primary': CURRENT_PRIMARY_STYLES,
  'current.invert': CURRENT_INVERT_STYLES,
  'current.outline': CURRENT_OUTLINE_STYLES,
  'current.outline-2': CURRENT_OUTLINE_2_STYLES,
  'current.clear': CURRENT_CLEAR_STYLES,
  'current.link': CURRENT_LINK_STYLES,
  'current.card': CURRENT_CARD_STYLES,
  // Default theme
  'default.primary': DEFAULT_PRIMARY_STYLES,
  'default.invert': DEFAULT_INVERT_STYLES,
  'default.outline': DEFAULT_OUTLINE_STYLES,
  'default.outline-2': DEFAULT_OUTLINE_2_STYLES,
  'default.clear': DEFAULT_CLEAR_STYLES,
  'default.link': DEFAULT_LINK_STYLES,
  'default.item': DEFAULT_ITEM_STYLES,
  'default.card': DEFAULT_CARD_STYLES,
  // Danger theme
  'danger.primary': DANGER_PRIMARY_STYLES,
  'danger.invert': DANGER_INVERT_STYLES,
  'danger.outline': DANGER_OUTLINE_STYLES,
  'danger.outline-2': DANGER_OUTLINE_2_STYLES,
  'danger.clear': DANGER_CLEAR_STYLES,
  'danger.link': DANGER_LINK_STYLES,
  'danger.item': DANGER_ITEM_STYLES,
  'danger.card': DANGER_CARD_STYLES,
  // Success theme
  'success.primary': SUCCESS_PRIMARY_STYLES,
  'success.invert': SUCCESS_INVERT_STYLES,
  'success.outline': SUCCESS_OUTLINE_STYLES,
  'success.outline-2': SUCCESS_OUTLINE_2_STYLES,
  'success.clear': SUCCESS_CLEAR_STYLES,
  'success.link': SUCCESS_LINK_STYLES,
  'success.item': SUCCESS_ITEM_STYLES,
  'success.card': SUCCESS_CARD_STYLES,
  // Warning theme
  'warning.primary': WARNING_PRIMARY_STYLES,
  'warning.invert': WARNING_INVERT_STYLES,
  'warning.outline': WARNING_OUTLINE_STYLES,
  'warning.outline-2': WARNING_OUTLINE_2_STYLES,
  'warning.clear': WARNING_CLEAR_STYLES,
  'warning.link': WARNING_LINK_STYLES,
  'warning.item': WARNING_ITEM_STYLES,
  'warning.card': WARNING_CARD_STYLES,
  // Note theme
  'note.primary': NOTE_PRIMARY_STYLES,
  'note.invert': NOTE_INVERT_STYLES,
  'note.outline': NOTE_OUTLINE_STYLES,
  'note.outline-2': NOTE_OUTLINE_2_STYLES,
  'note.clear': NOTE_CLEAR_STYLES,
  'note.link': NOTE_LINK_STYLES,
  'note.item': NOTE_ITEM_STYLES,
  'note.card': NOTE_CARD_STYLES,
  // Special theme
  'special.primary': SPECIAL_PRIMARY_STYLES,
  'special.invert': SPECIAL_INVERT_STYLES,
  'special.outline': SPECIAL_OUTLINE_STYLES,
  'special.clear': SPECIAL_CLEAR_STYLES,
  'special.link': SPECIAL_LINK_STYLES,
  'special.item': SPECIAL_ITEM_STYLES,
};

// Resolve a `theme` + `type` pair to the variant key that actually exists in
// `ITEM_VARIANTS`. Two of the combinations users can write have no entry of
// their own and are folded onto one that does.
//
// Shared rather than inlined because more than one component has to arrive at
// the same answer: `Item` renders the row, and `ItemButton` repeats the lookup on
// the wrapper that carries the row color to actions rendered outside it. Those
// two drifted the moment they were written separately — the `special` fallback
// below was missed, which silently resolved to a nonexistent
// `special.outline-2`, left the wrapper with no color, and handed sibling actions
// the page's `currentcolor` on a dark surface.
export function resolveItemVariant(
  theme: string | undefined,
  type: string | undefined,
): ItemVariant {
  // The `special` theme has no `outline-2` variant (it paints over
  // `#special-surface`, not `#surface-2`/`#surface-3`); fall back to `outline`
  // so the item still renders.
  const effectiveType =
    theme === 'special' && type === 'outline-2' ? 'outline' : type;

  // `header` reuses the `item` visuals and is theme-agnostic.
  const variantType = effectiveType === 'header' ? 'item' : effectiveType;
  const variantTheme = effectiveType === 'header' ? 'default' : theme;

  return `${variantTheme}.${variantType}` as ItemVariant;
}

// Each variant reduced to the label colors an actions wrapper has to reproduce.
//
// The `current` theme paints from `currentcolor`, which only reaches an action
// that is a DOM *descendant* of the row. `Item` renders its actions inside the
// row element, so they inherit the row color for free — but `ItemButton` renders
// them as a sibling of the button (deliberately, so the actions stay reachable
// and are not nested inside a `<button>`), where `currentcolor` would inherit
// from the page instead. Painting these colors on that wrapper restores the link.
//
// Resting AND disabled, and the second one is not optional. `ItemAction`
// suppresses its own `.4` fade when the disabled state was inherited from the
// host, on the grounds that the host has already faded the color it paints from —
// which is only true if the wrapper actually reproduces the host's *disabled*
// color. With resting alone, a disabled `ItemButton` rendered full-strength
// actions next to its own faded label.
//
// The other states are still skipped: the wrapper is not the interactive element,
// so it never carries `hovered` / `pressed` / `selected` and those entries could
// never match there. `disabled` is different only because `ItemButton` passes it
// down explicitly.
export const ITEM_RESTING_COLOR_VARIANTS: Record<ItemVariant, Styles> =
  Object.fromEntries(
    Object.entries(ITEM_VARIANTS).map(([variant, styles]) => {
      const color = styles.color;

      if (!color || typeof color !== 'object') {
        return [variant, { color }];
      }

      const map = color as Record<string, string>;
      // The `current` flavours state their fade as
      // `disabled & !inherit-disabled & !inside-wrapper` rather than a bare
      // `disabled`, and the wrapper wants exactly that value under a plain
      // `disabled`. It is entitled to it: the two negated mods mark "something
      // above already faded this", and the wrapper is the top of the subtree —
      // `ItemButton` gives it only `disabled`, never either mod. Reading just
      // `map.disabled` left those variants with no disabled color to hand down,
      // which is the failure the comment above describes: the row faded itself
      // and its sibling actions, which suppress their own fade under
      // `inherit-disabled`, stayed at full strength beside it.
      const disabled =
        map.disabled ?? map['disabled & !inherit-disabled & !inside-wrapper'];

      return [
        variant,
        { color: disabled ? { '': map[''], disabled } : map[''] },
      ];
    }),
  ) as Record<ItemVariant, Styles>;
