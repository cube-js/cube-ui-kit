// Theme dispatch table consumed by `Alert` and `Badge`.
//
// Field semantics (kept compatible with the pre-glaze layout so consuming
// components don't need a refactor):
//
//   - `fill`   — Alert background. For `special` it is also reused by Badge
//                as the badge fill (saturated brand). For the four colored
//                themes it is Alert's own tinted banner fill
//                (`#<theme>-alert-surface`, see `ALERT_COLORS` in
//                `src/tokens/palette.ts`), and Badge falls back to `color` for
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
//   - `border` — Alert border; Badge does not read it. For the four colored
//                themes it is Alert's own `#<theme>-alert-border`, paired with
//                its fill. The shared `#<theme>-surface` / `#<theme>-border`
//                stay with the Item family, which needs them quieter.
export default {
  special: {
    fill: '#primary-accent-surface',
    color: '#primary-accent-surface-text',
    border: '#primary-border',
  },
  success: {
    fill: '#success-alert-surface',
    color: '#success-accent-surface',
    border: '#success-alert-border',
  },
  danger: {
    fill: '#danger-alert-surface',
    color: '#danger-accent-surface',
    border: '#danger-alert-border',
  },
  warning: {
    fill: '#warning-alert-surface',
    color: '#warning-accent-surface',
    border: '#warning-alert-border',
  },
  note: {
    fill: '#note-alert-surface',
    color: '#note-accent-surface',
    border: '#note-alert-border',
  },
  disabled: {
    fill: '#surface-2',
    color: '#surface-text-soft-2',
    border: '#surface-text.20',
  },
} as const;
