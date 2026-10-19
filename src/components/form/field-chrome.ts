import { warn } from '../../utils/warnings';

import type { ReactNode } from 'react';

/** Empty slot values suppress content; numeric zero is still text. */
export function hasFieldContent(content: ReactNode) {
  return content != null && typeof content !== 'boolean' && content !== '';
}

/**
 * The caller's props that give a field without a `label` something to show
 * under its control or to style: texts for its slots, styles for the wrapper,
 * or a `validate` whose errors the field shows.
 */
const FIELD_CHROME_PROPS = [
  'description',
  'errorMessage',
  'message',
  'fieldStyles',
  'fieldProps',
  'validate',
] as const;

/**
 * Whether a field without a `label` still needs the field chrome: it is bound
 * to a form, whose validation errors need a place under it, or its caller
 * passes one of `FIELD_CHROME_PROPS`. An explicit `isBare` overrides this in
 * `rendersFieldChrome`.
 *
 * Neither depends on what the field shows at the moment. A prop counts
 * whatever it holds — `undefined`, `null` and `''` too — because a decision
 * taken from the text would move the control in and out of the wrapper as an
 * error comes and goes, and React would remount it and drop its focus
 * mid-keystroke.
 *
 * Read the caller's own props: a form binding adds message props of its own.
 */
export function asksForFieldChrome(props: object, isBound = false) {
  return isBound || FIELD_CHROME_PROPS.some((key) => key in props);
}

let hasWarnedAboutForceField = false;

/** Warn once about the obsolete opt-in: `isBare={false}` replaces it. */
export function warnAboutForceField(props: { forceField?: boolean }) {
  if (hasWarnedAboutForceField || props.forceField == null) return;

  hasWarnedAboutForceField = true;

  warn(
    'A field received `forceField`, which is deprecated. A field renders its chrome when it has a label, is bound to a form, or is passed a description, message, field styles or `validate`. Pass `isBare={false}` to render the chrome anyway, or `isBare` to render only the control.',
  );
}
