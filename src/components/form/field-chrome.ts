import { warn } from '../../utils/warnings';

import type { ReactNode } from 'react';
import type { FieldBaseProps } from '../../shared/form';

/** Empty slot values suppress content; numeric zero is still text. */
export function hasFieldContent(content: ReactNode) {
  return content != null && typeof content !== 'boolean' && content !== '';
}

/**
 * The field chrome's own props. `wrapWithField` reads them off an input's
 * props by name, for the label, its badge and suffix, the texts and the
 * wrapper, so an input never takes one of these names for a prop of its own:
 * the chrome would render it too. The input's own version takes its part's
 * prefix (`triggerDescription`, `inputStyles`) or a name the chrome does not
 * own (`tooltip`, the control's tooltip).
 */
export const RESERVED_FIELD_PROPS = [
  'label',
  'labelPosition',
  'labelStyles',
  'labelProps',
  'labelRef',
  'labelSuffix',
  'labelTooltip',
  'extra',
  'description',
  'message',
  'errorMessage',
  'messageStyles',
  'necessityIndicator',
  'requiredMark',
  'isOptional',
  'isBare',
  'forceField',
  'isHidden',
  'fieldProps',
  'fieldStyles',
] as const satisfies readonly (keyof FieldBaseProps)[];

/**
 * The props both the chrome and its control read, by design: the control
 * behaves by them, the chrome shows them, and `id` ties the texts to the
 * control.
 */
export const SHARED_FIELD_PROPS = [
  'id',
  'isDisabled',
  'isRequired',
  'isInvalid',
  'isValid',
] as const satisfies readonly (keyof FieldBaseProps)[];

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
  return { ...props, isBare: (props as { isBare?: boolean }).isBare ?? false };
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
