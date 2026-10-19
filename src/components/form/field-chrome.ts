import { warn } from '../../utils/warnings';

import type { ReactNode } from 'react';

/** Empty slot values suppress content; numeric zero is still text. */
export function hasFieldContent(content: ReactNode) {
  return content != null && typeof content !== 'boolean' && content !== '';
}

/**
 * The caller's props that give a field without a `label` something to show
 * under its control or something for the wrapper to do: texts for its slots,
 * styles for the wrapper, or hiding it.
 */
const FIELD_CHROME_PROPS = [
  'description',
  'errorMessage',
  'message',
  'fieldStyles',
  'fieldProps',
  'isHidden',
] as const;

/**
 * Whether the caller of a field without a `label` passes one of
 * `FIELD_CHROME_PROPS`, so the field still needs its chrome. A form binding
 * needs it too; `useFieldProps` adds that. An explicit `isBare` overrides both
 * in `rendersFieldChrome`.
 *
 * It does not depend on what the field shows at the moment. A prop counts
 * whatever it holds — `undefined`, `null` and `''` too — because a decision
 * taken from the text would move the control in and out of the wrapper as an
 * error comes and goes, and React would remount it and drop its focus
 * mid-keystroke.
 *
 * Read the caller's own props: a form binding adds message props of its own.
 */
export function asksForFieldChrome(props: object) {
  return FIELD_CHROME_PROPS.some((key) => key in props);
}

/** Asks `wrapWithField` for the field chrome, unless the caller set `isBare`. */
export function withFieldChrome<P extends object>(props: P): P {
  return (props as { isBare?: boolean }).isBare == null
    ? { ...props, isBare: false }
    : props;
}

let hasWarnedAboutForceField = false;

/** Warn once about the obsolete opt-in: `isBare={false}` replaces it. */
export function warnAboutForceField(props: { forceField?: boolean }) {
  if (hasWarnedAboutForceField || props.forceField == null) return;

  hasWarnedAboutForceField = true;

  warn(
    'A field received `forceField`, which is deprecated. Pass `isBare={false}` to render the field chrome even with nothing to show.',
  );
}
