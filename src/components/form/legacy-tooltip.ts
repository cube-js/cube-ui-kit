import { warn } from '../../utils/warnings';

let hasWarnedAboutLegacyTooltip = false;

/**
 * `tooltip` used to be the field-level prop for the label's info badge. It is
 * `labelTooltip` now, and TypeScript flags every old call site — but not a JS
 * caller, an `as any`, or an untyped spread. Those would lose the badge
 * without a word, so say it once.
 *
 * Called by `wrapWithField` once it knows a label renders (without one the old
 * prop did nothing either), and by the legacy `Field` and `FieldWrapper`,
 * which a caller can reach without going through `wrapWithField`.
 *
 * A migration aid; remove once consumers are off `tooltip`.
 */
export function warnAboutLegacyTooltip(props: object) {
  if (hasWarnedAboutLegacyTooltip) return;

  const { tooltip } = props as { tooltip?: unknown };

  if (tooltip == null || tooltip === false) return;

  hasWarnedAboutLegacyTooltip = true;

  warn(
    'A field received `tooltip`, which no longer renders the info badge next to its label. Pass the badge content as `labelTooltip` instead.',
  );
}
