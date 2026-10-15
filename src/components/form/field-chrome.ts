/** The props that give a field text to show under its control. */
const FIELD_TEXT_PROPS = ['description', 'errorMessage', 'message'] as const;

type FieldChromeProps = Partial<
  Record<(typeof FIELD_TEXT_PROPS)[number], unknown>
> & { forceField?: boolean };

/**
 * Whether a field without a `label` should still render the field chrome
 * (`forceField`): its caller passes a description or a message and leaves
 * `forceField` unset. The prop decides, whatever it holds — `undefined`,
 * `null` and `''` too — because a decision taken from the text would move the
 * control in and out of the wrapper as an error comes and goes, and React
 * would remount it and drop its focus mid-keystroke.
 *
 * Read the caller's own props: a form binding adds message props of its own.
 */
export function asksForFieldChrome(props: FieldChromeProps) {
  return (
    props.forceField == null && FIELD_TEXT_PROPS.some((key) => key in props)
  );
}
