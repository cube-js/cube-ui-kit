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

let hasWarnedAboutTriggerTooltip = false;

/**
 * The trigger's tooltip on `Picker`, `FilterPicker` and `ColorPicker` was
 * `triggerTooltip`. It is `tooltip` now, as on `Select`, `Button` and `Item`,
 * since a field's own props never take the field chrome's names and `tooltip`
 * is not one of them. Returns the tooltip to render, `tooltip` first, and says
 * once when the old name is used.
 *
 * A migration aid; remove with `triggerTooltip`.
 */
export function resolveTriggerTooltip<T>(
  tooltip: T | undefined,
  triggerTooltip: T | undefined,
) {
  if (triggerTooltip !== undefined && !hasWarnedAboutTriggerTooltip) {
    hasWarnedAboutTriggerTooltip = true;

    warn(
      'A picker received `triggerTooltip`, which is deprecated. Pass the trigger tooltip as `tooltip` instead.',
    );
  }

  return tooltip ?? triggerTooltip;
}
