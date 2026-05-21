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
    '': '#white.2',
    pressed: '#primary-accent-text',
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
  // below AA. The fixed brand keeps cr=6.52 light / 5.95 dark at α.10,
  // 6.19 / 5.41 at α.16.
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
  // base.
  fill: {
    '': '#surface-2 #surface-text.0',
    hovered: '#surface-2 #surface-text.03',
    pressed: '#surface-2 #surface-text.09',
    selected: '#surface-2 #primary-accent-surface.09',
    'selected & (hovered | focused)': '#surface-2 #primary-accent-surface.12',
    'selected & pressed': '#surface-2 #primary-accent-surface.18',
    disabled: '#surface-2 #disabled-surface',
  },
  color: {
    '': '#surface-text-soft',
    hovered: '#surface-text-soft',
    pressed: '#surface-text',
    selected: '#primary-accent-text',
    disabled: '#disabled-surface-text',
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
  },
  color: {
    '': '#surface-text-soft',
    hovered: '#surface-text-soft',
    'pressed & !selected': '#surface-text',
    selected: '#primary-accent-text',
    disabled: '#disabled-surface-text',
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
  // Default sits at the *softer* AA-floor variant (`#primary-accent-text-soft`,
  // mode 'auto', cr=4.5) and intensifies on hover to the AAA-ish
  // `#primary-accent-text` (cr=6.4). Critically, the soft variant is also
  // adaptive — using the fixed brand `#primary-accent-surface` instead would
  // collapse to cr≈3 against the dark surface and break AA.
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
  },
  color: {
    '': '#danger-accent-text-soft',
    selected: '#danger-accent-text',
    disabled: '#disabled-surface-text',
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
  },
  color: {
    '': '#danger-accent-text-soft',
    selected: '#danger-accent-text',
    disabled: '#disabled-surface-text',
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
  },
  color: {
    '': '#success-accent-text-soft',
    selected: '#success-accent-text',
    disabled: '#disabled-surface-text',
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
  },
  color: {
    '': '#success-accent-text-soft',
    selected: '#success-accent-text',
    disabled: '#disabled-surface-text',
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
  },
  color: {
    '': '#warning-accent-text-soft',
    selected: '#warning-accent-text',
    disabled: '#disabled-surface-text',
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
  },
  color: {
    '': '#warning-accent-text-soft',
    selected: '#warning-accent-text',
    disabled: '#disabled-surface-text',
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
  },
  color: {
    '': '#note-accent-text-soft',
    selected: '#note-accent-text',
    disabled: '#disabled-surface-text',
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
  },
  color: {
    '': '#note-accent-text-soft',
    selected: '#note-accent-text',
    disabled: '#disabled-surface-text',
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
    '': '#white.2',
    pressed: '#white.4',
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
    '': '#white.3',
    selected: '#white.4',
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
  },
  // Mirrors the colored-theme soft→opaque pattern (`*-accent-text-soft` →
  // `*-accent-text`) using white-alpha steps: default is slightly muted so
  // that selected reads as the more prominent state.
  color: {
    '': '#white.8',
    selected: '#white',
    disabled: '#white.4',
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
