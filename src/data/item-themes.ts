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
    'pressed | focused': '#primary-accent-text',
    disabled: 'transparent',
  },
  // All states share the same `#surface` base layer (opaque). Only the
  // *overlay* varies between brand color, hover shade, and disabled chip.
  // Keeping the layer shape identical (always two layers, same base, same
  // gradient overlay slot) lets `background-color`, `background-image` and
  // `--tasty-second-fill-color` all interpolate smoothly during the CSS
  // transition — without it, the gradient overlay would snap on/off and the
  // bg-color would briefly show through (the "surface flash" on form submit).
  fill: {
    '': '#surface #primary-accent-surface',
    // `#primary-accent-surface-hover` is a fixed-mode shade ~7–9 OKHSL pts
    // darker than `#primary-accent-surface`, so hover stays visibly *darker*
    // than default in BOTH light and dark schemes. Anchoring to the *fixed*
    // brand surface (rather than the adaptive `#primary-accent-text`) avoids
    // an inverted hover affordance in dark mode.
    hovered: '#surface #primary-accent-surface-hover',
    pressed: '#surface #primary-accent-surface',
    // Brand-tinted, scheme-symmetric disabled pair from the accent system
    // (`#primary-accent-disabled-surface` chip cr ≈ 1.4 vs surface, label
    // `#primary-accent-disabled-surface-text` cr ≈ 2.8–3.2 vs surface) so
    // the disabled state looks identical in light and dark while still
    // reading as a *muted brand* color.
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
  border: {
    '': true,
    selected: '#primary-border',
    focused: '#primary-accent-text',
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
  border: {
    '': 'transparent',
    'selected & pressed': '#primary-accent-text.10',
    focused: '#primary-accent-text',
    ...(VALIDATION_STYLES.border as Record<string, string>),
  },
  fill: {
    '': '#surface-text.0',
    'hovered | focused': '#surface-text.04',
    pressed: '#surface-text.06',
    selected: '#primary-accent-surface.0',
    'selected & (hovered | focused)': '#primary-accent-surface.09',
    'selected & pressed': '#primary-accent-surface.12',
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
    '': '0 #danger-accent-text.0',
    focused: '1bw #danger-accent-text',
  },
  border: {
    '': '#white.2',
    'pressed | focused': '#danger-accent-text',
    disabled: 'transparent',
  },
  fill: {
    '': '#surface #danger-accent-surface',
    hovered: '#surface #danger-accent-surface-hover',
    pressed: '#surface #danger-accent-surface',
    // See `DEFAULT_PRIMARY_STYLES.fill.disabled` for the rationale —
    // `#danger-accent-disabled-surface` + `#danger-accent-disabled-surface-text`
    // keep the disabled chip identical across schemes and brand-tinted with
    // the danger hue.
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
  border: {
    '': '#danger-border',
    focused: '#danger-accent-text',
    disabled: '#border',
  },
  fill: {
    '': '#surface-2 #danger-accent-surface.0',
    hovered: '#surface-2 #danger-accent-surface.1',
    pressed: '#surface-2 #danger-accent-surface.05',
    selected: '#surface-2 #danger-accent-surface.05',
    'selected & hovered & !pressed': '#surface-2 #danger-accent-surface.1',
    disabled: '#surface-2 #disabled-surface',
  },
  color: {
    '': '#danger-accent-text',
    disabled: '#disabled-surface-text',
  },
} as const;

export const DANGER_OUTLINE_2_STYLES: Styles = {
  ...DANGER_OUTLINE_STYLES,
  fill: {
    '': '#surface-3 #danger-accent-surface.0',
    hovered: '#surface-3 #danger-accent-surface.1',
    pressed: '#surface-3 #danger-accent-surface.05',
    selected: '#surface-3 #danger-accent-surface.05',
    'selected & hovered & !pressed': '#surface-3 #danger-accent-surface.1',
    disabled: '#surface-3 #disabled-surface',
  },
} as const;

export const DANGER_CLEAR_STYLES: Styles = {
  // Non-selected = old DANGER NEUTRAL: dark-tinted overlay; pressed switches
  // text to `#danger-accent-text` (matches old neutral).
  // Selected = old DANGER CLEAR: danger-text-tinted overlay.
  border: {
    '': 'transparent',
    'selected & pressed': '#danger-accent-surface.05',
    focused: '#danger-accent-text',
  },
  fill: {
    '': '#surface-text.0',
    hovered: '#surface-text.04',
    pressed: '#surface-text.05',
    selected: '#danger-accent-text.0',
    'selected & hovered': '#danger-accent-text.03',
    'selected & pressed': '#danger-accent-text.09',
    disabled: 'transparent',
  },
  color: {
    '': '#surface-text-soft',
    pressed: '#danger-accent-text',
    selected: '#danger-accent-text',
    disabled: '#disabled-surface-text',
  },
} as const;

export const DANGER_LINK_STYLES: Styles = {
  // See DEFAULT_LINK_STYLES for the soft→strong rationale.
  outline: {
    '': '0 #danger-accent-text.0',
    focused: '1bw #danger-accent-text',
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
    '': '0 #success-accent-text.0',
    focused: '1bw #success-accent-text',
  },
  border: {
    '': '#white.2',
    'pressed | focused': '#success-accent-text',
    disabled: 'transparent',
  },
  fill: {
    '': '#surface #success-accent-surface',
    hovered: '#surface #success-accent-surface-hover',
    pressed: '#surface #success-accent-surface',
    // See `DEFAULT_PRIMARY_STYLES.fill.disabled` for rationale (brand-tinted,
    // scheme-symmetric chip + higher-contrast disabled label).
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
  border: {
    '': '#success-border',
    focused: '#success-accent-text',
    disabled: '#border',
  },
  fill: {
    '': '#surface-2 #success-accent-surface.0',
    hovered: '#surface-2 #success-accent-surface.1',
    pressed: '#surface-2 #success-accent-surface.05',
    selected: '#surface-2 #success-accent-surface.05',
    'selected & hovered & !pressed': '#surface-2 #success-accent-surface.1',
    disabled: '#surface-2 #disabled-surface',
  },
  color: {
    '': '#success-accent-text',
    disabled: '#disabled-surface-text',
  },
} as const;

export const SUCCESS_OUTLINE_2_STYLES: Styles = {
  ...SUCCESS_OUTLINE_STYLES,
  fill: {
    '': '#surface-3 #success-accent-surface.0',
    hovered: '#surface-3 #success-accent-surface.1',
    pressed: '#surface-3 #success-accent-surface.05',
    selected: '#surface-3 #success-accent-surface.05',
    'selected & hovered & !pressed': '#surface-3 #success-accent-surface.1',
    disabled: '#surface-3 #disabled-surface',
  },
} as const;

export const SUCCESS_CLEAR_STYLES: Styles = {
  // Non-selected = old SUCCESS NEUTRAL; selected = old SUCCESS CLEAR.
  border: {
    '': 'transparent',
    'selected & pressed': '#success-accent-surface.05',
    focused: '#success-accent-text',
  },
  fill: {
    '': '#surface-text.0',
    hovered: '#surface-text.04',
    pressed: '#surface-text.05',
    selected: '#success-accent-text.0',
    'selected & hovered': '#success-accent-text.03',
    'selected & pressed': '#success-accent-text.09',
    disabled: 'transparent',
  },
  color: {
    '': '#surface-text-soft',
    pressed: '#success-accent-text',
    selected: '#success-accent-text',
    disabled: '#disabled-surface-text',
  },
} as const;

export const SUCCESS_LINK_STYLES: Styles = {
  // See DEFAULT_LINK_STYLES for the soft→strong rationale.
  outline: {
    '': '0 #success-accent-text.0',
    focused: '1bw #success-accent-text',
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
    '': '0 #warning-accent-text.0',
    focused: '1bw #warning-accent-text',
  },
  border: {
    '': '#white.2',
    'pressed | focused': '#warning-accent-text',
    disabled: 'transparent',
  },
  fill: {
    '': '#surface #warning-accent-surface',
    hovered: '#surface #warning-accent-surface-hover',
    pressed: '#surface #warning-accent-surface',
    // See `DEFAULT_PRIMARY_STYLES.fill.disabled` for rationale (brand-tinted,
    // scheme-symmetric chip + higher-contrast disabled label).
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
  border: {
    '': '#warning-border',
    focused: '#warning-accent-text',
    disabled: '#border',
  },
  fill: {
    '': '#surface-2 #warning-accent-surface.0',
    hovered: '#surface-2 #warning-accent-surface.1',
    pressed: '#surface-2 #warning-accent-surface.05',
    selected: '#surface-2 #warning-accent-surface.05',
    'selected & hovered & !pressed': '#surface-2 #warning-accent-surface.1',
    disabled: '#surface-2 #disabled-surface',
  },
  color: {
    '': '#warning-accent-text',
    disabled: '#disabled-surface-text',
  },
} as const;

export const WARNING_OUTLINE_2_STYLES: Styles = {
  ...WARNING_OUTLINE_STYLES,
  fill: {
    '': '#surface-3 #warning-accent-surface.0',
    hovered: '#surface-3 #warning-accent-surface.1',
    pressed: '#surface-3 #warning-accent-surface.05',
    selected: '#surface-3 #warning-accent-surface.05',
    'selected & hovered & !pressed': '#surface-3 #warning-accent-surface.1',
    disabled: '#surface-3 #disabled-surface',
  },
} as const;

export const WARNING_CLEAR_STYLES: Styles = {
  // Non-selected = old WARNING NEUTRAL; selected = old WARNING CLEAR.
  border: {
    '': 'transparent',
    'selected & pressed': '#warning-accent-surface.05',
    focused: '#warning-accent-text',
  },
  fill: {
    '': '#surface-text.0',
    hovered: '#surface-text.04',
    pressed: '#surface-text.05',
    selected: '#warning-accent-text.0',
    'selected & hovered': '#warning-accent-text.03',
    'selected & pressed': '#warning-accent-text.09',
    disabled: 'transparent',
  },
  color: {
    '': '#surface-text-soft',
    pressed: '#warning-accent-text',
    selected: '#warning-accent-text',
    disabled: '#disabled-surface-text',
  },
} as const;

export const WARNING_LINK_STYLES: Styles = {
  // See DEFAULT_LINK_STYLES for the soft→strong rationale.
  outline: {
    '': '0 #warning-accent-text.0',
    focused: '1bw #warning-accent-text',
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
    '': '0 #note-accent-text.0',
    focused: '1bw #note-accent-text',
  },
  border: {
    '': '#white.2',
    'pressed | focused': '#note-accent-text',
    disabled: 'transparent',
  },
  fill: {
    '': '#surface #note-accent-surface',
    hovered: '#surface #note-accent-surface-hover',
    pressed: '#surface #note-accent-surface',
    // See `DEFAULT_PRIMARY_STYLES.fill.disabled` for rationale (brand-tinted,
    // scheme-symmetric chip + higher-contrast disabled label).
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
  border: {
    '': '#note-border',
    focused: '#note-accent-text',
    disabled: '#border',
  },
  fill: {
    '': '#surface-2 #note-accent-surface.0',
    hovered: '#surface-2 #note-accent-surface.1',
    pressed: '#surface-2 #note-accent-surface.05',
    selected: '#surface-2 #note-accent-surface.05',
    'selected & hovered & !pressed': '#surface-2 #note-accent-surface.1',
    disabled: '#surface-2 #disabled-surface',
  },
  color: {
    '': '#note-accent-text',
    disabled: '#disabled-surface-text',
  },
} as const;

export const NOTE_OUTLINE_2_STYLES: Styles = {
  ...NOTE_OUTLINE_STYLES,
  fill: {
    '': '#surface-3 #note-accent-surface.0',
    hovered: '#surface-3 #note-accent-surface.1',
    pressed: '#surface-3 #note-accent-surface.05',
    selected: '#surface-3 #note-accent-surface.05',
    'selected & hovered & !pressed': '#surface-3 #note-accent-surface.1',
    disabled: '#surface-3 #disabled-surface',
  },
} as const;

export const NOTE_CLEAR_STYLES: Styles = {
  // Non-selected = old NOTE NEUTRAL; selected = old NOTE CLEAR.
  border: {
    '': 'transparent',
    'selected & pressed': '#note-accent-surface.05',
    focused: '#note-accent-text',
  },
  fill: {
    '': '#surface-text.0',
    hovered: '#surface-text.04',
    pressed: '#surface-text.05',
    selected: '#note-accent-text.0',
    'selected & hovered': '#note-accent-text.03',
    'selected & pressed': '#note-accent-text.09',
    disabled: 'transparent',
  },
  color: {
    '': '#surface-text-soft',
    pressed: '#note-accent-text',
    selected: '#note-accent-text',
    disabled: '#disabled-surface-text',
  },
} as const;

export const NOTE_LINK_STYLES: Styles = {
  // See DEFAULT_LINK_STYLES for the soft→strong rationale.
  outline: {
    '': '0 #note-accent-text.0',
    focused: '1bw #note-accent-text',
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
  outline: {
    '': '0 #white.0',
    focused: '1bw #white',
  },
  border: {
    '': '#white.2',
    'pressed | focused': '#white.4',
    disabled: 'transparent',
  },
  fill: {
    '': '#white #special-accent-fill',
    hovered: '#white #special-accent-fill-hover',
    pressed: '#white #special-accent-fill',
    disabled: '#white #special-accent-disabled-surface',
  },
  color: {
    '': '#white',
    disabled: '#special-accent-disabled-surface-text',
  },
} as const;

export const SPECIAL_OUTLINE_STYLES: Styles = {
  // Non-selected = old SPECIAL OUTLINE; selected = old SPECIAL SECONDARY.
  border: {
    '': '#white.3',
    pressed: '#white.12',
    'selected & pressed': '#white.4',
    focused: '#white',
    ...(VALIDATION_STYLES.border as Record<string, string>),
  },
  fill: {
    '': '#special-surface #white.0',
    hovered: '#special-surface #white.18',
    pressed: '#special-surface #white.12',
    selected: '#special-surface #white.12',
    'selected & hovered & !pressed': '#special-surface #white.18',
    disabled: '#special-surface #white.12',
  },
  color: {
    '': '#white',
    disabled: '#white.4',
  },
} as const;

export const SPECIAL_CLEAR_STYLES: Styles = {
  // Non-selected = old SPECIAL NEUTRAL: transparent / dark-tinted.
  // Selected = old SPECIAL CLEAR: solid white fill with dark accent text.
  outline: {
    'selected & focused': '1bw #white',
  },
  border: {
    '': 'transparent',
    focused: '#white',
    'selected & pressed': '#white',
    'selected & disabled': '#white.3',
    ...(VALIDATION_STYLES.border as Record<string, string>),
  },
  fill: {
    '': '#white.0',
    hovered: '#white.12',
    pressed: '#white.18',
    selected: '#white',
    'selected & hovered & !pressed': '#white.94',
    disabled: '#white.0',
    'selected & disabled': '#white.12',
  },
  color: {
    '': '#white',
    selected: '#special-accent-text',
    'selected & hovered': '#special-accent-fill',
    'selected & hovered & pressed': '#special-accent-text',
    disabled: '#white.4',
  },
} as const;

export const SPECIAL_LINK_STYLES: Styles = {
  outline: {
    '': '0 #white.0',
    focused: '1bw #white',
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
