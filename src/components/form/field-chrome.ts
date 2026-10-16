import { warn } from '../../utils/warnings';

let hasWarnedAboutForceField = false;

/** Warn once about the obsolete opt-in: field chrome is now the default. */
export function warnAboutForceField(props: { forceField?: boolean }) {
  if (hasWarnedAboutForceField || props.forceField == null) return;

  hasWarnedAboutForceField = true;

  warn(
    'A field received `forceField`, which is deprecated. Fields render chrome by default. Remove `forceField`, or pass `isBare` to render only the control.',
  );
}
