import { warn } from '../../utils/warnings';

/** The props that give a field text to show under its control. */
const FIELD_TEXT_PROPS = ['description', 'errorMessage', 'message'] as const;

type FieldChromeProps = Partial<
  Record<(typeof FIELD_TEXT_PROPS)[number], unknown>
> & { isBare?: boolean };

/**
 * Whether a field without a `label` should still render the field chrome: it
 * is bound to a form, whose validation errors need a place under it, or its
 * caller passes a description or a message — unless it asks for the bare
 * control with `isBare`.
 *
 * Neither depends on what the field shows at the moment. A text prop counts
 * whatever it holds — `undefined`, `null` and `''` too — because a decision
 * taken from the text would move the control in and out of the wrapper as an
 * error comes and goes, and React would remount it and drop its focus
 * mid-keystroke.
 *
 * Read the caller's own props: a form binding adds message props of its own.
 */
export function asksForFieldChrome(props: FieldChromeProps, isBound = false) {
  return (
    !props.isBare && (isBound || FIELD_TEXT_PROPS.some((key) => key in props))
  );
}

let hasWarnedAboutForceField = false;

/**
 * `forceField` used to be the only way to show the texts of a field without a
 * `label`. Such a field now shows them by itself when it is bound to a form or
 * is passed one, so the prop is deprecated. It still forces the wrapper; say so
 * once.
 *
 * A migration aid; remove with `forceField`.
 */
export function warnAboutForceField(props: { forceField?: boolean }) {
  if (hasWarnedAboutForceField || props.forceField == null) return;

  hasWarnedAboutForceField = true;

  warn(
    'A field received `forceField`, which is deprecated. A field without a `label` now renders its description and messages when it is bound to a form or is passed `description`, `errorMessage` or `message`. Remove `forceField`, or pass `isBare` to render the bare control.',
  );
}
