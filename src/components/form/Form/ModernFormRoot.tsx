import { forwardRef, ReactElement, Ref } from 'react';

import { modernBackendUnavailableError } from './backend';

import type { CubeFormProps, FormRootComponent } from './Form';
import type { FieldTypes } from './types';

/**
 * The `<Form>` facade renders this root for a branded modern controller. It is
 * a boundary, not an implementation: the modern backend is not in this version,
 * so reaching it is an error rather than silent legacy behaviour (plan §9,
 * Phase 3 gate: "no modern behavior is reachable accidentally").
 */
function ModernFormRoot<T extends FieldTypes>(
  _props: CubeFormProps<T>,
  _ref: Ref<HTMLFormElement>,
): ReactElement {
  throw modernBackendUnavailableError('<Form>');
}

const _ModernFormRoot = forwardRef(
  ModernFormRoot,
) as unknown as FormRootComponent;

(_ModernFormRoot as any).displayName = 'ModernFormRoot';

export { _ModernFormRoot as ModernFormRoot };
