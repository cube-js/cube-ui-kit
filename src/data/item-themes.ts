import { Styles } from 'src/tasty';

export const VALIDATION_STYLES: Styles = {
  border: {
    invalid: '#danger-text',
    valid: '#success-text',
  } as Record<string, string>,
} as const;

// ---------- DEFAULT THEME ----------
export const DEFAULT_PRIMARY_STYLES: Styles = {
  outline: {
    '': '0 #purple-text.0',
    focused: '1bw #purple-text',
  },
  border: {
    '': '#clear',
    pressed: '#purple-text',
    focused: '#purple-text',
    '[disabled] | disabled': '#border',
  },
  fill: {
    '': '#purple',
    hovered: '#purple-text',
    pressed: '#purple',
    '[disabled] | disabled': '#dark.04',
  },
  color: {
    '': '#white',
    '[disabled] | disabled': '#dark-04',
  },
} as const;

export const DEFAULT_SECONDARY_STYLES: Styles = {
  border: {
    '': '#purple.15',
    pressed: '#purple.3',
    focused: '#purple-text',
    '[disabled] | disabled': '#border',
  },
  fill: {
    '': '#purple.10',
    hovered: '#purple.16',
    pressed: '#purple-text.10',
    '[disabled] | disabled': '#dark.04',
  },
  color: {
    '': '#purple',
    '[disabled] | disabled': '#dark-04',
  },
} as const;

export const DEFAULT_OUTLINE_STYLES: Styles = {
  border: {
    '': '#dark.12',
    focused: '#purple-text',
    '[disabled] | disabled': '#border',
    ...(VALIDATION_STYLES.border as Record<string, string>),
  },
  fill: {
    '': '#dark.0',
    hovered: '#dark.03',
    'pressed | (selected & !hovered)': '#dark.06',
    '[disabled] | disabled': '#dark.04',
  },
  color: {
    '': '#dark-02',
    hovered: '#dark-02',
    'pressed | (selected & !hovered)': '#dark',
    '[disabled] | disabled': '#dark-04',
  },
} as const;

export const DEFAULT_NEUTRAL_STYLES: Styles = {
  border: {
    '': '#clear',
    focused: '#purple-text',
    ...(VALIDATION_STYLES.border as Record<string, string>),
  },
  fill: {
    '': '#dark.0',
    hovered: '#dark.03',
    'pressed | (selected & !hovered)': '#dark.06',
  },
  color: {
    '': '#dark-02',
    hovered: '#dark-02',
    pressed: '#dark',
    '[disabled] | disabled': '#dark-04',
  },
} as const;

export const DEFAULT_CLEAR_STYLES: Styles = {
  border: {
    '': '#clear',
    pressed: '#purple-text.10',
    focused: '#purple-text',
    ...(VALIDATION_STYLES.border as Record<string, string>),
  },
  fill: {
    '': '#purple.0',
    hovered: '#purple.16',
    'pressed | (selected & !hovered)': '#purple.10',
  },
  color: {
    '': '#purple-text',
    '[disabled] | disabled': '#dark-04',
  },
} as const;

export const DEFAULT_LINK_STYLES: Styles = {
  outline: {
    '': '0 #purple-text.0',
    focused: '1bw #purple-text',
  },
  border: '0',
  fill: {
    '': '#clear',
  },
  color: {
    '': '#purple-text',
    'hovered & !pressed': '#purple',
    '[disabled] | disabled': '#dark-04',
  },
} as const;

// ---------- DANGER THEME ----------
export const DANGER_PRIMARY_STYLES: Styles = {
  outline: {
    '': '0 #danger-text.0',
    focused: '1bw #danger-text',
  },
  border: {
    '': '#clear',
    'pressed | focused': '#danger-text',
    '[disabled] | disabled': '#border',
  },
  fill: {
    '': '#danger',
    'hovered & !pressed': '#danger-text',
    '[disabled] | disabled': '#dark.04',
  },
  color: {
    '': '#white',
    '[disabled] | disabled': '#dark-04',
  },
} as const;

export const DANGER_SECONDARY_STYLES: Styles = {
  border: {
    '': '#danger.15',
    pressed: '#danger.3',
    focused: '#danger-text',
    '[disabled] | disabled': '#border',
  },
  fill: {
    '': '#danger.05',
    'hovered & !pressed': '#danger.1',
    '[disabled] | disabled': '#dark.04',
  },
  color: {
    '': '#danger',
    '[disabled] | disabled': '#dark-04',
  },
} as const;

export const DANGER_OUTLINE_STYLES: Styles = {
  border: {
    '': '#danger.15',
    pressed: '#danger.3',
    focused: '#danger-text',
    '[disabled] | disabled': '#border',
  },
  fill: {
    '': '#danger.0',
    hovered: '#danger.1',
    'pressed | (selected & !hovered)': '#danger.05',
    '[disabled] | disabled': '#dark.04',
  },
  color: {
    '': '#danger-text',
    '[disabled] | disabled': '#dark-04',
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
    '[disabled] | disabled': '#dark-04',
  },
} as const;

export const DANGER_CLEAR_STYLES: Styles = {
  border: {
    '': '#clear',
    pressed: '#danger.05',
    focused: '#danger-text',
  },
  fill: {
    '': '#danger.0',
    hovered: '#danger.1',
    'pressed | (selected & !hovered)': '#danger.05',
  },
  color: {
    '': '#danger-text',
    '[disabled] | disabled': '#dark-04',
  },
} as const;

export const DANGER_LINK_STYLES: Styles = {
  outline: {
    '': '0 #danger-text.0',
    focused: '1bw #danger-text',
  },
  border: 0,
  fill: {
    '': '#clear',
  },
  color: {
    '': '#danger-text',
    'hovered & !pressed': '#danger',
    '[disabled] | disabled': '#dark-04',
  },
} as const;

// ---------- SUCCESS THEME ----------
export const SUCCESS_PRIMARY_STYLES: Styles = {
  outline: {
    '': '0 #success-text.0',
    focused: '1bw #success-text',
  },
  border: {
    '': '#clear',
    'pressed | focused': '#success-text',
    '[disabled] | disabled': '#border',
  },
  fill: {
    '': '#success',
    'hovered & !pressed': '#success-text',
    '[disabled] | disabled': '#dark.04',
  },
  color: {
    '': '#white',
    '[disabled] | disabled': '#dark-04',
  },
} as const;

export const SUCCESS_SECONDARY_STYLES: Styles = {
  border: {
    '': '#success.15',
    pressed: '#success.3',
    focused: '#success-text',
    '[disabled] | disabled': '#border',
  },
  fill: {
    '': '#success.05',
    'hovered & !pressed': '#success.1',
    '[disabled] | disabled': '#dark.04',
  },
  color: {
    '': '#success',
    '[disabled] | disabled': '#dark-04',
  },
} as const;

export const SUCCESS_OUTLINE_STYLES: Styles = {
  border: {
    '': '#success.15',
    pressed: '#success.3',
    focused: '#success-text',
    '[disabled] | disabled': '#border',
  },
  fill: {
    '': '#success.0',
    hovered: '#success.1',
    'pressed | (selected & !hovered)': '#success.05',
    '[disabled] | disabled': '#dark.04',
  },
  color: {
    '': '#success-text',
    '[disabled] | disabled': '#dark-04',
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
    '[disabled] | disabled': '#dark-04',
  },
} as const;

export const SUCCESS_CLEAR_STYLES: Styles = {
  border: {
    '': '#clear',
    pressed: '#success.05',
    focused: '#success-text',
  },
  fill: {
    '': '#success.0',
    hovered: '#success.1',
    'pressed | (selected & !hovered)': '#success.05',
  },
  color: {
    '': '#success-text',
    '[disabled] | disabled': '#dark-04',
  },
} as const;

export const SUCCESS_LINK_STYLES: Styles = {
  outline: {
    '': '0 #success-text.0',
    focused: '1bw #success-text',
  },
  border: '0',
  fill: {
    '': '#clear',
  },
  color: {
    '': '#success-text',
    'hovered & !pressed': '#success',
    '[disabled] | disabled': '#dark-04',
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
    pressed: '#purple-03',
    '[disabled] | disabled': '#white.3',
  },
  fill: {
    '': '#purple',
    'hovered & !pressed': '#purple-text',
    '[disabled] | disabled': '#white.12',
  },
  color: {
    '': '#white',
    '[disabled] | disabled': '#white.4',
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
    '[disabled] | disabled': '#white.12',
  },
  color: {
    '': '#white',
    '[disabled] | disabled': '#white.4',
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
    '': '#white.0',
    hovered: '#white.18',
    'pressed | (selected & !hovered)': '#white.12',
    '[disabled] | disabled': '#white.12',
  },
  color: {
    '': '#white',
    '[disabled] | disabled': '#white.4',
  },
} as const;

export const SPECIAL_NEUTRAL_STYLES: Styles = {
  border: {
    '': 0,
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
    '[disabled] | disabled': '#white.4',
  },
} as const;

export const SPECIAL_CLEAR_STYLES: Styles = {
  outline: {
    focused: '1bw #white',
  },
  border: {
    '': '#clear',
    'pressed | focused': '#white',
    '[disabled] | disabled': '#white.3',
    ...(VALIDATION_STYLES.border as Record<string, string>),
  },
  fill: {
    '': '#white',
    'hovered & !pressed': '#white.94',
    '[disabled] | disabled': '#white.12',
  },
  color: {
    '': '#purple-text',
    hovered: '#purple',
    'pressed & hovered': '#purple-text',
    '[disabled] | disabled': '#white.4',
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
    '[disabled] | disabled': '#white.4',
  },
} as const;

export type ItemVariant =
  | 'default.primary'
  | 'default.secondary'
  | 'default.outline'
  | 'default.neutral'
  | 'default.clear'
  | 'default.link'
  | 'danger.primary'
  | 'danger.secondary'
  | 'danger.outline'
  | 'danger.neutral'
  | 'danger.clear'
  | 'danger.link'
  | 'success.primary'
  | 'success.secondary'
  | 'success.outline'
  | 'success.neutral'
  | 'success.clear'
  | 'success.link'
  | 'special.primary'
  | 'special.secondary'
  | 'special.outline'
  | 'special.neutral'
  | 'special.clear'
  | 'special.link';
