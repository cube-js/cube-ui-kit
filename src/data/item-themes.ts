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
  // base — or, when selected, the brand-tinted `accent-disabled-surface` one, so
  // a disabled segmented control still shows which option is active (CUB-3912).
  // Every `selected & disabled` entry in this file exists for that reason.
  fill: {
    '': '#surface-2 #surface-text.0',
    hovered: '#surface-2 #surface-text.03',
    pressed: '#surface-2 #surface-text.09',
    selected: '#surface-2 #primary-accent-surface.09',
    'selected & (hovered | focused)': '#surface-2 #primary-accent-surface.12',
    'selected & pressed': '#surface-2 #primary-accent-surface.18',
    disabled: '#surface-2 #disabled-surface',
    'selected & disabled': '#surface-2 #primary-accent-disabled-surface',
  },
  color: {
    '': '#surface-text-soft',
    hovered: '#surface-text-soft',
    pressed: '#surface-text',
    selected: '#primary-accent-text-soft',
    'selected & hovered': '#primary-accent-text',
    disabled: '#disabled-surface-text',
    'selected & disabled': '#primary-accent-disabled-surface-text',
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
    'selected & disabled': '#surface-3 #primary-accent-disabled-surface',
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
    'selected & disabled': '#primary-accent-disabled-surface',
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
    'selected & disabled': '#primary-accent-disabled-surface-text',
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
    'selected & disabled': '#surface-2 #danger-accent-disabled-surface',
  },
  color: {
    '': '#danger-accent-text-soft',
    selected: '#danger-accent-text',
    disabled: '#disabled-surface-text',
    'selected & disabled': '#danger-accent-disabled-surface-text',
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
    'selected & disabled': '#surface-3 #danger-accent-disabled-surface',
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
    'selected & disabled': '#danger-accent-disabled-surface',
  },
  color: {
    '': '#danger-accent-text-soft',
    selected: '#danger-accent-text',
    disabled: '#disabled-surface-text',
    'selected & disabled': '#danger-accent-disabled-surface-text',
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
    'selected & disabled': '#surface-2 #success-accent-disabled-surface',
  },
  color: {
    '': '#success-accent-text-soft',
    selected: '#success-accent-text',
    disabled: '#disabled-surface-text',
    'selected & disabled': '#success-accent-disabled-surface-text',
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
    'selected & disabled': '#surface-3 #success-accent-disabled-surface',
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
    'selected & disabled': '#success-accent-disabled-surface',
  },
  color: {
    '': '#success-accent-text-soft',
    selected: '#success-accent-text',
    disabled: '#disabled-surface-text',
    'selected & disabled': '#success-accent-disabled-surface-text',
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
    'selected & disabled': '#surface-2 #warning-accent-disabled-surface',
  },
  color: {
    '': '#warning-accent-text-soft',
    selected: '#warning-accent-text',
    disabled: '#disabled-surface-text',
    'selected & disabled': '#warning-accent-disabled-surface-text',
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
    'selected & disabled': '#surface-3 #warning-accent-disabled-surface',
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
    'selected & disabled': '#warning-accent-disabled-surface',
  },
  color: {
    '': '#warning-accent-text-soft',
    selected: '#warning-accent-text',
    disabled: '#disabled-surface-text',
    'selected & disabled': '#warning-accent-disabled-surface-text',
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
    'selected & disabled': '#surface-2 #note-accent-disabled-surface',
  },
  color: {
    '': '#note-accent-text-soft',
    selected: '#note-accent-text',
    disabled: '#disabled-surface-text',
    'selected & disabled': '#note-accent-disabled-surface-text',
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
    'selected & disabled': '#surface-3 #note-accent-disabled-surface',
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
    'selected & disabled': '#note-accent-disabled-surface',
  },
  color: {
    '': '#note-accent-text-soft',
    selected: '#note-accent-text',
    disabled: '#disabled-surface-text',
    'selected & disabled': '#note-accent-disabled-surface-text',
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
    'selected & disabled': '#special-surface #white.09',
  },
  // Mirrors the colored-theme soft→opaque pattern (`*-accent-text-soft` →
  // `*-accent-text`) using white-alpha steps: default is slightly muted so
  // that selected reads as the more prominent state.
  color: {
    '': '#white.8',
    selected: '#white',
    disabled: '#white.4',
    'selected & disabled': '#white.55',
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
  // a slightly different alpha (.16) that's visually similar but a distinct
  // value string. The default `''` and `disabled` may share `#white.0`
  // because Tasty keeps the TRUE/default entry separate from non-defaults
  // during merging.
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
    'selected & disabled': '#white.16',
  },
  // Non-selected mirrors the colored-theme soft→opaque pattern with
  // white-alpha steps. Selected keeps its inverted look — dark accent-text
  // on a white pill — so the soft/opaque transition only applies to the
  // non-selected variant.
  color: {
    '': '#white.8',
    selected: '#special-accent-text',
    disabled: '#white.4',
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
    disabled: '#white.4',
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
    disabled: '#white.4',
  },
} as const;

// ---------- CURRENT TYPE ----------
// Every color is derived from the *inherited* text color (`#current` →
// `currentcolor`), so the element adopts whatever color its context paints
// with: a colored Alert, a dark banner, an image overlay, a chart tooltip. That
// makes the type theme-agnostic — a single style object registered under
// `default.current`, with the host component forcing the theme to `default`.
//
// `color: '#current'` compiles to `color: currentcolor`, which CSS resolves as
// `color: inherit` — so the label stays fully opaque and, crucially, the
// element's own `currentcolor` (used by `fill`/`border` below) is the INHERITED
// color rather than a faded one. The alpha steps are then mixed off that same
// color, which is why the whole ramp tracks the context automatically.
//
// There are two flavours, mirroring the two shapes the neutral types take:
// `CURRENT_ITEM_STYLES` follows `*_ITEM_STYLES` (borderless, invisible at rest,
// for list rows) and `CURRENT_BUTTON_STYLES` follows the standalone button types
// (a resting chip with a border). Both keep the monotonic-contrast pattern of
// their neutral counterparts: default < hover < pressed, and the same again one
// level up when selected.
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

// The alpha ramp for the item flavour, held in custom properties rather than
// written inline in `fill`. Two reasons:
//
// 1. Unlike the brand tokens, `#current` alphas do NOT adapt to the color
//    scheme: a 4% tint of a dark label on a light surface reads far stronger
//    than a 4% tint of a light label on a dark one, so one ramp cannot serve
//    both. Each step therefore carries a per-surface value — the base entry for
//    the light scheme, `@dark` for the dark scheme, and `theme=special` for the
//    special theme's dark-purple surface. Special is *static* (identical in
//    light, dark and HC by design — see the SPECIAL section above), so it needs
//    a single ramp rather than a light/dark pair. `theme=special` resolves
//    against the element's own `data-theme`, which `ItemAction` sets from the
//    surrounding `ItemActionProvider`.
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
// them. Every other type marks selection with a brand *hue* — an accent-tinted
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
    'theme=special': '#current.08',
  },
  '$current-press': {
    '': '#current.06',
    '@dark': '#current.11',
    'theme=special': '#current.12',
  },
  '$current-selected': {
    '': '#current.18',
    '@dark': '#current.16',
    'theme=special': '#current.17',
  },
  '$current-selected-hover': {
    '': '#current.24',
    '@dark': '#current.19',
    'theme=special': '#current.21',
  },
  '$current-selected-press': {
    '': '#current.3',
    '@dark': '#current.22',
    'theme=special': '#current.24',
  },
} as const;

// Item flavour — the `current` counterpart of `*_ITEM_STYLES`: no border,
// nothing painted at rest, the fill appearing only on interaction. Used for
// list rows (`Item`, `ItemButton`) and, as the default type, the actions inside
// them — where a resting chip on every row would read as noise. Like the other
// `*_ITEM_STYLES` it leaves the focus ring to the base styles (the collection
// that owns the row indicates focus), and only steps the fill. `ItemAction`
// adds a ring of its own on top, since a focusable action is not a list row.
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
    // Only fade when this element is disabled ON ITS OWN. `#current` is the
    // color it inherits, and a disabled host has already faded that color to
    // `#disabled-surface-text` — so fading again multiplies the two and the label
    // washes out (an action inside a disabled row measured `.4` of an already
    // muted token, roughly `rgb(224,225,228)` on white, against the row's own
    // `rgb(178,181,205)`). Inheriting the host's faded color unchanged is both
    // correct and what the neutral types did. `ItemAction` sets
    // `inherit-disabled` when its disabled state came from the surrounding
    // `ItemActionProvider` rather than its own prop; nothing else sets the mod, so
    // `Item` keeps fading itself as before.
    'disabled & !inherit-disabled': '#current.4',
  },
} as const;

// Button flavour — a standalone control, so it carries its own weight: a
// resting `#current.03` chip inside a `#current.08` border. `.03` is enough to
// separate the button from a flat background without reading as a filled
// surface, while leaving room for four distinguishable steps above it.
// Disabled `fill`/`border` are pre-multiplied (`.06`/`.12` → an effective
// `.024`/`.048`) so the chip stays a muted version of itself instead of
// vanishing.
export const CURRENT_BUTTON_STYLES: Styles = {
  // The focus ring is the one color NOT taken from `#current`: every type in
  // this file uses `#primary-accent-text` (the special theme swapping in its
  // fixed-mode counterpart), so the focus indicator stays the same wherever it
  // appears.
  outline: {
    '': '0 #primary-accent-text.0',
    focused: '1bw #primary-accent-text',
  },
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
    disabled: '#current.4',
  },
} as const;

// ---------- CARD TYPE STYLES ----------
// Card type only supports: default, success, danger, note themes

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
  // The `current` type derives every color from the inherited `currentcolor`,
  // so it has no per-theme flavours — see `CURRENT_ITEM_STYLES`.
  | 'default.current'
  | 'default.primary'
  | 'default.outline'
  | 'default.outline-2'
  | 'default.clear'
  | 'default.link'
  | 'default.item'
  | 'default.card'
  | 'danger.primary'
  | 'danger.outline'
  | 'danger.outline-2'
  | 'danger.clear'
  | 'danger.link'
  | 'danger.item'
  | 'danger.card'
  | 'success.primary'
  | 'success.outline'
  | 'success.outline-2'
  | 'success.clear'
  | 'success.link'
  | 'success.item'
  | 'success.card'
  | 'warning.primary'
  | 'warning.outline'
  | 'warning.outline-2'
  | 'warning.clear'
  | 'warning.link'
  | 'warning.item'
  | 'warning.card'
  | 'note.primary'
  | 'note.outline'
  | 'note.outline-2'
  | 'note.clear'
  | 'note.link'
  | 'note.item'
  | 'note.card'
  | 'special.primary'
  | 'special.outline'
  | 'special.clear'
  | 'special.link'
  | 'special.item';

// The single `theme.type` → styles map. Exported so `Item` and the projections
// below cannot drift apart: `ITEM_RESTING_COLOR_VARIANTS` is derived from this
// object rather than restating the palette.
export const ITEM_VARIANTS: Record<ItemVariant, Styles> = {
  // Inherited-color type — theme-agnostic, see `CURRENT_ITEM_STYLES`
  'default.current': CURRENT_ITEM_STYLES,
  // Default theme
  'default.primary': DEFAULT_PRIMARY_STYLES,
  'default.outline': DEFAULT_OUTLINE_STYLES,
  'default.outline-2': DEFAULT_OUTLINE_2_STYLES,
  'default.clear': DEFAULT_CLEAR_STYLES,
  'default.link': DEFAULT_LINK_STYLES,
  'default.item': DEFAULT_ITEM_STYLES,
  'default.card': DEFAULT_CARD_STYLES,
  // Danger theme
  'danger.primary': DANGER_PRIMARY_STYLES,
  'danger.outline': DANGER_OUTLINE_STYLES,
  'danger.outline-2': DANGER_OUTLINE_2_STYLES,
  'danger.clear': DANGER_CLEAR_STYLES,
  'danger.link': DANGER_LINK_STYLES,
  'danger.item': DANGER_ITEM_STYLES,
  'danger.card': DANGER_CARD_STYLES,
  // Success theme
  'success.primary': SUCCESS_PRIMARY_STYLES,
  'success.outline': SUCCESS_OUTLINE_STYLES,
  'success.outline-2': SUCCESS_OUTLINE_2_STYLES,
  'success.clear': SUCCESS_CLEAR_STYLES,
  'success.link': SUCCESS_LINK_STYLES,
  'success.item': SUCCESS_ITEM_STYLES,
  'success.card': SUCCESS_CARD_STYLES,
  // Warning theme
  'warning.primary': WARNING_PRIMARY_STYLES,
  'warning.outline': WARNING_OUTLINE_STYLES,
  'warning.outline-2': WARNING_OUTLINE_2_STYLES,
  'warning.clear': WARNING_CLEAR_STYLES,
  'warning.link': WARNING_LINK_STYLES,
  'warning.item': WARNING_ITEM_STYLES,
  'warning.card': WARNING_CARD_STYLES,
  // Note theme
  'note.primary': NOTE_PRIMARY_STYLES,
  'note.outline': NOTE_OUTLINE_STYLES,
  'note.outline-2': NOTE_OUTLINE_2_STYLES,
  'note.clear': NOTE_CLEAR_STYLES,
  'note.link': NOTE_LINK_STYLES,
  'note.item': NOTE_ITEM_STYLES,
  'note.card': NOTE_CARD_STYLES,
  // Special theme
  'special.primary': SPECIAL_PRIMARY_STYLES,
  'special.outline': SPECIAL_OUTLINE_STYLES,
  'special.clear': SPECIAL_CLEAR_STYLES,
  'special.link': SPECIAL_LINK_STYLES,
  'special.item': SPECIAL_ITEM_STYLES,
};

// Resolve a `theme` + `type` pair to the variant key that actually exists in
// `ITEM_VARIANTS`. Three of the combinations users can write have no entry of
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

  // `header` reuses the `item` visuals, and both `header` and `current` are
  // theme-agnostic — `current` paints from the inherited `currentcolor`.
  const variantType = effectiveType === 'header' ? 'item' : effectiveType;
  const variantTheme =
    effectiveType === 'header' || effectiveType === 'current'
      ? 'default'
      : theme;

  return `${variantTheme}.${variantType}` as ItemVariant;
}

// Each variant reduced to the label colors an actions wrapper has to reproduce.
//
// The `current` type paints from `currentcolor`, which only reaches an action
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
      // Only a plain `disabled` key is usable. `default.current` states it as
      // `disabled & !inherit-disabled`, which is deliberately not matched here:
      // that variant paints from `currentcolor` and has no fixed color to hand
      // down, so the wrapper leaves its resting value in place.
      const disabled = map.disabled;

      return [
        variant,
        { color: disabled ? { '': map[''], disabled } : map[''] },
      ];
    }),
  ) as Record<ItemVariant, Styles>;
