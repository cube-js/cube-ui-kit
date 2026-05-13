// Theme dispatch table consumed by `Alert` and `Badge`.
//
// Field semantics (kept compatible with the pre-glaze layout so consuming
// components don't need a refactor):
//
//   - `fill`   — Alert background. For `special` it is also reused by Badge
//                as the badge fill (saturated brand). For colored themes it
//                is a light tinted banner surface (`#<theme>-surface`), and
//                Badge falls back to `color` for the saturated chip.
//   - `color`  — For non-`special`, non-`disabled` themes, this is the
//                **saturated brand color** that Badge uses as its fill
//                (matching the legacy `#<theme>-text` value, which mapped to
//                `#<theme>-accent-text`). Restoring this is what fixes the
//                near-black badges that appeared after the glaze migration
//                — the migration had set this to `#<theme>-surface-text`
//                (the deep readable-text color anchored at L≈2), which is
//                correct as Alert text but wrong as a Badge fill.
//                For `disabled`, this is the soft text color used by Alert
//                as the disabled label and by Badge as the disabled chip.
//   - `border` — Subtle brand-tinted border for both Alert and Badge.
export default {
  special: {
    fill: '#primary-accent-surface',
    color: '#primary-accent-surface-text',
    border: '#primary-accent-surface-text',
  },
  success: {
    fill: '#success-surface',
    color: '#success-accent-text',
    border: '#success-accent-surface.20',
  },
  danger: {
    fill: '#danger-surface',
    color: '#danger-accent-text',
    border: '#danger-accent-surface.20',
  },
  warning: {
    fill: '#warning-surface',
    color: '#warning-accent-text',
    border: '#warning-accent-surface.20',
  },
  note: {
    fill: '#note-surface',
    color: '#note-accent-text',
    border: '#note-accent-surface.20',
  },
  disabled: {
    fill: '#surface-2',
    color: '#surface-text-soft-2',
    border: '#surface-text.20',
  },
} as const;
