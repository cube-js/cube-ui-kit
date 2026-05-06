import type { Styles } from '@tenphi/tasty';

export const VALIDATION_STYLES: Styles = {
  border: {
    invalid: '#danger-text',
    valid: '#success-text',
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
      'checkbox & selected': 1,
      'checkbox & !selected': 0,
      'checkbox & !selected & hovered': 0.4,
    },
  },
} as const;

// ---------- DEFAULT THEME ----------
export const DEFAULT_PRIMARY_STYLES: Styles = {
  outline: {
    '': '0 #primary-text.0',
    focused: '1bw #primary-text',
  },
  border: {
    '': '#white.2',
    'pressed | focused': '#primary-text',
    disabled: '#clear',
  },
  fill: {
    '': '#surface #primary',
    // `#primary-hover` (= fixed-mode `accent-surface-hover`, ~7–9 OKHSL pts
    // darker than `#primary`) keeps hover *darker than default in BOTH light
    // and dark schemes. Was `#primary-text`, which became `mode: 'auto'`
    // after the accent-text refactor and inverts direction in dark mode
    // (lighter than default), breaking the hover affordance.
    hovered: '#surface #primary-hover',
    pressed: '#surface #primary',
    // The disabled chip + text use the new scheme-symmetric `#disabled-bg`
    // and `#disabled-text` Glaze tokens so the disabled look is identical in
    // light and dark schemes (chip cr ≈ 1.4, text cr ≈ 1.4 vs chip in BOTH).
    // The previous `#surface #primary-disabled` (= `#disabled` chip) +
    // fixed `#white` text gave cr=1.6 / 6.5 text-on-chip across schemes —
    // dark mode stopped looking disabled because the bright `#white` text
    // popped against the more-contrasty dark chip.
    disabled: '#disabled-bg',
  },
  color: {
    '': '#white',
    disabled: '#disabled-text',
  },
} as const;

export const DEFAULT_SECONDARY_STYLES: Styles = {
  // BORDER anchors to the *adaptive* `#primary-text` (mode 'auto') so the
  // outline stays visible in BOTH schemes (CR ≈ 1.55–1.82 vs surface in dark
  // vs ~1.13 with the fixed brand). FILL must NOT use `#primary-text` though:
  // in dark mode the overlay drifts the bg toward the same lightness as the
  // text, collapsing label↔bg contrast below AA (cr=4.42@α.10 → 3.04@α.22).
  // Anchoring the fill to the *fixed* `#primary` brand keeps the bg darker
  // than the bright dark-mode text and restores AA: cr=6.52 light / 5.95 dark
  // at α.10, 6.19 / 5.41 at α.16. Pressed fill is intentionally absent — the
  // darker `pressed` border is the visible press signal (matches BEFORE), so
  // pressed-only falls back to default fill and pressed-hovered falls back to
  // hovered fill.
  border: {
    '': '#primary-text.15',
    pressed: '#primary-text.3',
    focused: '#primary-text',
    disabled: '#border',
  },
  fill: {
    '': '#primary.10',
    'hovered & !pressed': '#primary.16',
    disabled: '#disabled-bg',
  },
  color: {
    '': '#primary-text',
    disabled: '#disabled-text',
  },
} as const;

export const DEFAULT_OUTLINE_STYLES: Styles = {
  border: {
    '': true,
    focused: '#primary-text',
    disabled: true,
    ...(VALIDATION_STYLES.border as Record<string, string>),
  },
  fill: {
    '': '#surface #dark.0',
    hovered: '#surface #dark.03',
    selected: '#surface #dark.09',
    'selected & hovered': '#surface #dark.12',
    pressed: '#surface #dark.09',
    disabled: '#disabled-bg',
  },
  color: {
    '': '#dark-02',
    hovered: '#dark-02',
    'pressed | (selected & !hovered)': '#dark',
    disabled: '#disabled-text',
  },
} as const;

export const DEFAULT_NEUTRAL_STYLES: Styles = {
  border: {
    '': '#clear',
    focused: '#primary-text',
    ...(VALIDATION_STYLES.border as Record<string, string>),
  },
  fill: {
    '': '#dark.0',
    hovered: '#dark.03',
    selected: '#dark.09',
    'selected & hovered': '#dark.12',
    pressed: '#dark.09',
    disabled: '#clear',
  },
  color: {
    '': '#dark-02',
    hovered: '#dark-02',
    pressed: '#dark',
    disabled: '#disabled-text',
  },
} as const;

export const DEFAULT_CLEAR_STYLES: Styles = {
  border: {
    '': '#clear',
    pressed: '#primary-text.10',
    focused: '#primary-text',
    ...(VALIDATION_STYLES.border as Record<string, string>),
  },
  fill: {
    '': '#primary.0',
    hovered: '#primary.16',
    'pressed | (selected & !hovered)': '#primary.10',
  },
  color: {
    '': '#primary-text',
    disabled: '#disabled-text',
  },
} as const;

export const DEFAULT_LINK_STYLES: Styles = {
  // Default sits at the *softer* AA-floor variant (`#primary-text-soft`,
  // mode 'auto', cr=4.5) and intensifies on hover to the AAA-ish
  // `#primary-text` (cr=6.4). Critically, the soft variant is also
  // adaptive — using the fixed brand `#primary` instead would collapse to
  // cr≈3 against the dark surface and break AA.
  outline: {
    '': '0 #primary-text.0',
    focused: '1bw #primary-text',
  },
  border: '0',
  fill: {
    '': '#clear',
  },
  color: {
    '': '#primary-text-soft',
    'hovered & !pressed': '#primary-text',
    disabled: '#disabled-text',
  },
} as const;

export const DEFAULT_ITEM_STYLES: Styles = {
  border: '#clear',
  fill: {
    '': '#dark.0',
    'hovered | focused': '#dark.03',
    selected: '#dark.09',
    'selected & (hovered | focused)': '#dark.12',
    pressed: '#dark.09',
    disabled: '#clear',
  },
  color: {
    '': '#dark-02',
    hovered: '#dark-02',
    pressed: '#dark',
    disabled: '#disabled-text',
  },
} as const;

// ---------- DANGER THEME ----------
export const DANGER_PRIMARY_STYLES: Styles = {
  outline: {
    '': '0 #danger-text.0',
    focused: '1bw #danger-text',
  },
  border: {
    '': '#white.2',
    'pressed | focused': '#danger-text',
    disabled: '#clear',
  },
  fill: {
    '': '#surface #danger',
    hovered: '#surface #danger-hover',
    pressed: '#surface #danger',
    // See `DEFAULT_PRIMARY_STYLES.fill.disabled` for the rationale —
    // `#disabled-bg` + `#disabled-text` keep the disabled chip identical
    // across schemes, replacing the old `#danger-desaturated.6` chip + fixed
    // `#white.6` text combo (which inverted contrast in dark mode).
    disabled: '#disabled-bg',
  },
  color: {
    '': '#white',
    disabled: '#disabled-text',
  },
} as const;

export const DANGER_SECONDARY_STYLES: Styles = {
  // Fill anchors to the *fixed* `#danger` brand (not adaptive `#danger-text`)
  // so the overlay stays darker than the bright dark-mode label text and AA
  // contrast holds. Border keeps `#danger-text` for visibility in both schemes.
  border: {
    '': '#danger-text.15',
    pressed: '#danger-text.3',
    focused: '#danger-text',
    disabled: '#border',
  },
  fill: {
    '': '#danger.05',
    'hovered & !pressed': '#danger.1',
    disabled: '#disabled-bg',
  },
  color: {
    '': '#danger-text',
    disabled: '#disabled-text',
  },
} as const;

export const DANGER_OUTLINE_STYLES: Styles = {
  // Border anchors to the *adaptive* `#danger-text` (mode 'auto') so the
  // outline stays visible on dark surfaces. The fixed `#danger` brand at
  // .15/.3 alpha composites near-invisibly in dark mode (cr≈1.27–1.55 vs
  // the dark surface) because the brand color and the dark surface have
  // similar lightness; `#danger-text` brightens in dark mode and pushes the
  // composite up to cr≈1.90–2.88. Same rationale as `DANGER_SECONDARY_STYLES.border`.
  border: {
    '': '#danger-text.15',
    pressed: '#danger-text.3',
    focused: '#danger-text',
    disabled: '#border',
  },
  fill: {
    '': '#surface #danger.0',
    hovered: '#surface #danger.1',
    'pressed | (selected & !hovered)': '#surface #danger.05',
    disabled: '#disabled-bg',
  },
  color: {
    '': '#danger-text',
    disabled: '#disabled-text',
  },
} as const;

export const DANGER_NEUTRAL_STYLES: Styles = {
  border: {
    '': '#clear',
    focused: '#danger-text',
  },
  fill: {
    '': '#dark.0',
    hovered: '#dark.04',
    'pressed | (selected & !hovered)': '#dark.05',
  },
  color: {
    '': '#dark-02',
    'pressed | (selected & !hovered)': '#danger-text',
    disabled: '#disabled-text',
  },
} as const;

export const DANGER_CLEAR_STYLES: Styles = {
  border: {
    '': '#clear',
    pressed: '#danger.05',
    focused: '#danger-text',
  },
  fill: {
    '': '#danger-text.0',
    hovered: '#danger-text.03',
    selected: '#danger-text.09',
    'selected & hovered': '#danger-text.12',
    pressed: '#danger-text.09',
    disabled: '#clear',
  },
  color: {
    '': '#danger-text',
    hovered: '#danger-text',
    pressed: '#danger-text',
    disabled: '#danger-text.4',
  },
} as const;

export const DANGER_LINK_STYLES: Styles = {
  // See DEFAULT_LINK_STYLES for the soft→strong rationale.
  outline: {
    '': '0 #danger-text.0',
    focused: '1bw #danger-text',
  },
  border: 0,
  fill: {
    '': '#clear',
  },
  color: {
    '': '#danger-text-soft',
    'hovered & !pressed': '#danger-text',
    disabled: '#disabled-text',
  },
} as const;

export const DANGER_ITEM_STYLES: Styles = {
  border: '#clear',
  fill: {
    '': '#danger-text.0',
    'hovered | focused': '#danger-text.03',
    selected: '#danger-text.09',
    'selected & (hovered | focused)': '#danger-text.12',
    pressed: '#danger-text.09',
    disabled: '#clear',
  },
  color: {
    '': '#danger-text',
    hovered: '#danger-text',
    pressed: '#danger-text',
    disabled: '#danger-text.4',
  },
} as const;

// ---------- SUCCESS THEME ----------
export const SUCCESS_PRIMARY_STYLES: Styles = {
  outline: {
    '': '0 #success-text.0',
    focused: '1bw #success-text',
  },
  border: {
    '': '#white.2',
    'pressed | focused': '#success-text',
    disabled: '#clear',
  },
  fill: {
    '': '#surface #success',
    hovered: '#surface #success-hover',
    pressed: '#surface #success',
    // See `DEFAULT_PRIMARY_STYLES.fill.disabled` for rationale.
    disabled: '#disabled-bg',
  },
  color: {
    '': '#white',
    disabled: '#disabled-text',
  },
} as const;

export const SUCCESS_SECONDARY_STYLES: Styles = {
  // See DANGER_SECONDARY_STYLES for the fill-anchor rationale (`#X` not
  // `#X-text` so dark-mode label↔bg contrast stays AA).
  border: {
    '': '#success-text.15',
    pressed: '#success-text.3',
    focused: '#success-text',
    disabled: '#border',
  },
  fill: {
    '': '#success.05',
    'hovered & !pressed': '#success.1',
    disabled: '#disabled-bg',
  },
  color: {
    '': '#success-text',
    disabled: '#disabled-text',
  },
} as const;

export const SUCCESS_OUTLINE_STYLES: Styles = {
  // See DANGER_OUTLINE_STYLES for the border-anchor rationale.
  border: {
    '': '#success-text.15',
    pressed: '#success-text.3',
    focused: '#success-text',
    disabled: '#border',
  },
  fill: {
    '': '#surface #success.0',
    hovered: '#surface #success.1',
    'pressed | (selected & !hovered)': '#surface #success.05',
    disabled: '#disabled-bg',
  },
  color: {
    '': '#success-text',
    disabled: '#disabled-text',
  },
} as const;

export const SUCCESS_NEUTRAL_STYLES: Styles = {
  border: {
    '': '#clear',
    focused: '#success-text',
  },
  fill: {
    '': '#dark.0',
    hovered: '#dark.04',
    'pressed | (selected & !hovered)': '#dark.05',
  },
  color: {
    '': '#dark-02',
    'pressed | (selected & !hovered)': '#success-text',
    disabled: '#disabled-text',
  },
} as const;

export const SUCCESS_CLEAR_STYLES: Styles = {
  border: {
    '': '#clear',
    pressed: '#success.05',
    focused: '#success-text',
  },
  fill: {
    '': '#success-text.0',
    hovered: '#success-text.03',
    selected: '#success-text.09',
    'selected & hovered': '#success-text.12',
    pressed: '#success-text.09',
    disabled: '#clear',
  },
  color: {
    '': '#success-text',
    hovered: '#success-text',
    pressed: '#success-text',
    disabled: '#success-text.4',
  },
} as const;

export const SUCCESS_LINK_STYLES: Styles = {
  // See DEFAULT_LINK_STYLES for the soft→strong rationale.
  outline: {
    '': '0 #success-text.0',
    focused: '1bw #success-text',
  },
  border: 0,
  fill: {
    '': '#clear',
  },
  color: {
    '': '#success-text-soft',
    'hovered & !pressed': '#success-text',
    disabled: '#disabled-text',
  },
} as const;

export const SUCCESS_ITEM_STYLES: Styles = {
  border: '#clear',
  fill: {
    '': '#success-text.0',
    'hovered | focused': '#success-text.03',
    selected: '#success-text.09',
    'selected & (hovered | focused)': '#success-text.12',
    pressed: '#success-text.09',
    disabled: '#clear',
  },
  color: {
    '': '#success-text',
    hovered: '#success-text',
    pressed: '#success-text',
    disabled: '#success-text.4',
  },
} as const;

// ---------- WARNING THEME ----------
export const WARNING_PRIMARY_STYLES: Styles = {
  outline: {
    '': '0 #warning-text.0',
    focused: '1bw #warning-text',
  },
  border: {
    '': '#white.2',
    'pressed | focused': '#warning-text',
    disabled: '#clear',
  },
  fill: {
    '': '#surface #warning',
    hovered: '#surface #warning-hover',
    pressed: '#surface #warning',
    // See `DEFAULT_PRIMARY_STYLES.fill.disabled` for rationale.
    disabled: '#disabled-bg',
  },
  color: {
    '': '#white',
    disabled: '#disabled-text',
  },
} as const;

export const WARNING_SECONDARY_STYLES: Styles = {
  // See DANGER_SECONDARY_STYLES for the fill-anchor rationale.
  border: {
    '': '#warning-text.15',
    pressed: '#warning-text.3',
    focused: '#warning-text',
    disabled: '#border',
  },
  fill: {
    '': '#warning.05',
    'hovered & !pressed': '#warning.1',
    disabled: '#disabled-bg',
  },
  color: {
    '': '#warning-text',
    disabled: '#disabled-text',
  },
} as const;

export const WARNING_OUTLINE_STYLES: Styles = {
  // See DANGER_OUTLINE_STYLES for the border-anchor rationale.
  border: {
    '': '#warning-text.15',
    pressed: '#warning-text.3',
    focused: '#warning-text',
    disabled: '#border',
  },
  fill: {
    '': '#surface #warning.0',
    hovered: '#surface #warning.1',
    'pressed | (selected & !hovered)': '#surface #warning.05',
    disabled: '#disabled-bg',
  },
  color: {
    '': '#warning-text',
    disabled: '#disabled-text',
  },
} as const;

export const WARNING_NEUTRAL_STYLES: Styles = {
  border: {
    '': '#clear',
    focused: '#warning-text',
  },
  fill: {
    '': '#dark.0',
    hovered: '#dark.04',
    'pressed | (selected & !hovered)': '#dark.05',
  },
  color: {
    '': '#dark-02',
    'pressed | (selected & !hovered)': '#warning-text',
    disabled: '#disabled-text',
  },
} as const;

export const WARNING_CLEAR_STYLES: Styles = {
  border: {
    '': '#clear',
    pressed: '#warning.05',
    focused: '#warning-text',
  },
  fill: {
    '': '#warning-text.0',
    hovered: '#warning-text.03',
    selected: '#warning-text.09',
    'selected & hovered': '#warning-text.12',
    pressed: '#warning-text.09',
    disabled: '#clear',
  },
  color: {
    '': '#warning-text',
    hovered: '#warning-text',
    pressed: '#warning-text',
    disabled: '#warning-text.4',
  },
} as const;

export const WARNING_LINK_STYLES: Styles = {
  // See DEFAULT_LINK_STYLES for the soft→strong rationale.
  outline: {
    '': '0 #warning-text.0',
    focused: '1bw #warning-text',
  },
  border: 0,
  fill: {
    '': '#clear',
  },
  color: {
    '': '#warning-text-soft',
    'hovered & !pressed': '#warning-text',
    disabled: '#disabled-text',
  },
} as const;

export const WARNING_ITEM_STYLES: Styles = {
  border: '#clear',
  fill: {
    '': '#warning-text.0',
    'hovered | focused': '#warning-text.03',
    selected: '#warning-text.09',
    'selected & (hovered | focused)': '#warning-text.12',
    pressed: '#warning-text.09',
    disabled: '#clear',
  },
  color: {
    '': '#warning-text',
    hovered: '#warning-text',
    pressed: '#warning-text',
    disabled: '#warning-text.4',
  },
} as const;

// ---------- NOTE THEME ----------
export const NOTE_PRIMARY_STYLES: Styles = {
  outline: {
    '': '0 #note-text.0',
    focused: '1bw #note-text',
  },
  border: {
    '': '#white.2',
    'pressed | focused': '#note-text',
    disabled: '#clear',
  },
  fill: {
    '': '#surface #note',
    hovered: '#surface #note-hover',
    pressed: '#surface #note',
    // See `DEFAULT_PRIMARY_STYLES.fill.disabled` for rationale.
    disabled: '#disabled-bg',
  },
  color: {
    '': '#white',
    disabled: '#disabled-text',
  },
} as const;

export const NOTE_SECONDARY_STYLES: Styles = {
  // See DANGER_SECONDARY_STYLES for the fill-anchor rationale.
  border: {
    '': '#note-text.15',
    pressed: '#note-text.3',
    focused: '#note-text',
    disabled: '#border',
  },
  fill: {
    '': '#note.05',
    'hovered & !pressed': '#note.1',
    disabled: '#disabled-bg',
  },
  color: {
    '': '#note-text',
    disabled: '#disabled-text',
  },
} as const;

export const NOTE_OUTLINE_STYLES: Styles = {
  // See DANGER_OUTLINE_STYLES for the border-anchor rationale.
  border: {
    '': '#note-text.15',
    pressed: '#note-text.3',
    focused: '#note-text',
    disabled: '#border',
  },
  fill: {
    '': '#surface #note.0',
    hovered: '#surface #note.1',
    'pressed | (selected & !hovered)': '#surface #note.05',
    disabled: '#disabled-bg',
  },
  color: {
    '': '#note-text',
    disabled: '#disabled-text',
  },
} as const;

export const NOTE_NEUTRAL_STYLES: Styles = {
  border: {
    '': '#clear',
    focused: '#note-text',
  },
  fill: {
    '': '#dark.0',
    hovered: '#dark.04',
    'pressed | (selected & !hovered)': '#dark.05',
  },
  color: {
    '': '#dark-02',
    'pressed | (selected & !hovered)': '#note-text',
    disabled: '#disabled-text',
  },
} as const;

export const NOTE_CLEAR_STYLES: Styles = {
  border: {
    '': '#clear',
    pressed: '#note.05',
    focused: '#note-text',
  },
  fill: {
    '': '#note-text.0',
    hovered: '#note-text.03',
    selected: '#note-text.09',
    'selected & hovered': '#note-text.12',
    pressed: '#note-text.09',
    disabled: '#clear',
  },
  color: {
    '': '#note-text',
    hovered: '#note-text',
    pressed: '#note-text',
    disabled: '#note-text.4',
  },
} as const;

export const NOTE_LINK_STYLES: Styles = {
  // See DEFAULT_LINK_STYLES for the soft→strong rationale.
  outline: {
    '': '0 #note-text.0',
    focused: '1bw #note-text',
  },
  border: 0,
  fill: {
    '': '#clear',
  },
  color: {
    '': '#note-text-soft',
    'hovered & !pressed': '#note-text',
    disabled: '#disabled-text',
  },
} as const;

export const NOTE_ITEM_STYLES: Styles = {
  border: '#clear',
  fill: {
    '': '#note-text.0',
    'hovered | focused': '#note-text.03',
    selected: '#note-text.09',
    'selected & (hovered | focused)': '#note-text.12',
    pressed: '#note-text.09',
    disabled: '#clear',
  },
  color: {
    '': '#note-text',
    hovered: '#note-text',
    pressed: '#note-text',
    disabled: '#note-text.4',
  },
} as const;

// ---------- SPECIAL THEME ----------
export const SPECIAL_PRIMARY_STYLES: Styles = {
  outline: {
    '': '0 #white.0',
    focused: '1bw #white',
  },
  border: {
    '': '#clear',
    'pressed | focused': '#purple-text',
    disabled: '#clear',
  },
  fill: {
    '': '#white #primary',
    hovered: '#white #primary-hover',
    pressed: '#white #primary',
    disabled: '#primary-disabled.5',
  },
  color: {
    '': '#white',
    disabled: '#white.4',
  },
} as const;

export const SPECIAL_SECONDARY_STYLES: Styles = {
  border: {
    '': '#white.3',
    pressed: '#white.4',
    focused: '#white',
  },
  fill: {
    '': '#white.12',
    'hovered & !pressed': '#white.18',
    disabled: '#white.12',
  },
  color: {
    '': '#white',
    disabled: '#white.4',
  },
} as const;

export const SPECIAL_OUTLINE_STYLES: Styles = {
  border: {
    '': '#white.3',
    pressed: '#white.12',
    focused: '#white',
    ...(VALIDATION_STYLES.border as Record<string, string>),
  },
  fill: {
    '': '#dark #white.0',
    hovered: '#dark #white.18',
    'pressed | (selected & !hovered)': '#dark #white.12',
    disabled: '#dark #white.12',
  },
  color: {
    '': '#white',
    disabled: '#white.4',
  },
} as const;

export const SPECIAL_NEUTRAL_STYLES: Styles = {
  border: {
    '': '#clear',
    focused: '#white',
    ...(VALIDATION_STYLES.border as Record<string, string>),
  },
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

export const SPECIAL_CLEAR_STYLES: Styles = {
  outline: {
    focused: '1bw #white',
  },
  border: {
    '': '#clear',
    'pressed | focused': '#white',
    disabled: '#white.3',
    ...(VALIDATION_STYLES.border as Record<string, string>),
  },
  fill: {
    '': '#white',
    'hovered & !pressed': '#white.94',
    disabled: '#white.12',
  },
  color: {
    '': '#primary-text',
    hovered: '#primary',
    'pressed & hovered': '#primary-text',
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
    '': '#clear',
  },
  color: {
    '': '#white',
    'hovered & !pressed': '#white.9',
    disabled: '#white.4',
  },
} as const;

export const SPECIAL_ITEM_STYLES: Styles = {
  border: '#clear',
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
  border: '#dark.20',
  fill: '#light',
  color: '#dark-02',
} as const;

export const SUCCESS_CARD_STYLES: Styles = {
  border: '#success.20',
  fill: '#success-bg',
  color: '#success-text',
} as const;

export const DANGER_CARD_STYLES: Styles = {
  border: '#danger.20',
  fill: '#danger-bg',
  color: '#danger-text',
} as const;

export const WARNING_CARD_STYLES: Styles = {
  border: '#warning.20',
  fill: '#warning-bg',
  color: '#warning-text',
} as const;

export const NOTE_CARD_STYLES: Styles = {
  border: '#note.20',
  fill: '#note-bg',
  color: '#note-text',
} as const;

export type ItemVariant =
  | 'default.primary'
  | 'default.secondary'
  | 'default.outline'
  | 'default.neutral'
  | 'default.clear'
  | 'default.link'
  | 'default.item'
  | 'default.card'
  | 'danger.primary'
  | 'danger.secondary'
  | 'danger.outline'
  | 'danger.neutral'
  | 'danger.clear'
  | 'danger.link'
  | 'danger.item'
  | 'danger.card'
  | 'success.primary'
  | 'success.secondary'
  | 'success.outline'
  | 'success.neutral'
  | 'success.clear'
  | 'success.link'
  | 'success.item'
  | 'success.card'
  | 'warning.primary'
  | 'warning.secondary'
  | 'warning.outline'
  | 'warning.neutral'
  | 'warning.clear'
  | 'warning.link'
  | 'warning.item'
  | 'warning.card'
  | 'note.primary'
  | 'note.secondary'
  | 'note.outline'
  | 'note.neutral'
  | 'note.clear'
  | 'note.link'
  | 'note.item'
  | 'note.card'
  | 'special.primary'
  | 'special.secondary'
  | 'special.outline'
  | 'special.neutral'
  | 'special.clear'
  | 'special.link'
  | 'special.item';
