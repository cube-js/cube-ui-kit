// Theme dispatch table consumed by `Alert` and `Badge`.
//
// Field semantics (kept compatible with the pre-glaze layout so consuming
// components don't need a refactor):
//
//   - `fill`   — Alert background. For `special` it is also reused by Badge
//                as the badge fill (saturated brand). For the four colored
//                themes it is a light tinted banner surface
//                (`#<theme>-surface`), and Badge falls back to `color` for
//                the saturated chip.
//   - `color`  — For non-`special`, non-`disabled` themes, this is the
//                **saturated brand fill** Badge renders with white text on
//                top. We use `#<theme>-accent-surface` (fixed mode) which is
//                anchored to the fixed-white `#<theme>-accent-surface-text`
//                with `contrast: [4.5, 7]`, so white-text-on-fill is
//                guaranteed WCAG AA (4.5) / AAA (7) in every scheme — the
//                same brand-pill design `special` uses. (Pre-glaze this slot
//                resolved to `#<theme>-accent-text`, which is anchored to
//                surface with mode 'auto' for "readable text on surface" —
//                wrong contrast model for a badge with white text on top.
//                The glaze migration replaced it with `#<theme>-surface-text`
//                — the deep L≈2 banner-text color — which made every colored
//                badge render near-black; this restores the proper pairing.)
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
    color: '#success-accent-surface',
    border: '#success-accent-surface.20',
  },
  danger: {
    fill: '#danger-surface',
    color: '#danger-accent-surface',
    border: '#danger-accent-surface.20',
  },
  warning: {
    fill: '#warning-surface',
    color: '#warning-accent-surface',
    border: '#warning-accent-surface.20',
  },
  note: {
    fill: '#note-surface',
    color: '#note-accent-surface',
    border: '#note-accent-surface.20',
  },
  disabled: {
    fill: '#surface-2',
    color: '#surface-text-soft-2',
    border: '#surface-text.20',
  },
} as const;
