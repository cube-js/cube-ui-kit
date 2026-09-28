import { useFieldProps } from '@cube-dev/ui-kit';

import type {
  CubeFormInstance,
  FieldBaseProps,
  FormController,
} from '@cube-dev/ui-kit';

/**
 * Consumer-facing type fixture, compiled against `dist/` by
 * `pnpm test:types:consumer`. `useFieldProps` strips `field`, `dependsOn`,
 * `deps` and a modern controller before it returns (CUB-5085), so a custom
 * control must not be able to read them off the result.
 */
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;

function assertType<T extends true>(): T | void {}

interface Values {
  rows: string[];
}

interface ModernControlProps extends FieldBaseProps<string[]> {
  form: FormController<Values>;
}

export function ModernControl(input: ModernControlProps) {
  const props = useFieldProps(input);

  assertType<Equal<typeof props.form, undefined>>();
  // @ts-expect-error the controller is stripped: take it from the input props
  props.form.setValue('rows', [], { source: 'user' });
  input.form.setValue('rows', [], { source: 'user' });

  let reassigned = input;
  // @ts-expect-error the result no longer carries the required controller
  reassigned = useFieldProps(reassigned);

  return reassigned;
}

// The props type of a reusable wrapper is often a type parameter.
export function GenericModernControl<Props extends OptionalModernControlProps>(
  input: Props,
) {
  const props = useFieldProps(input);

  // @ts-expect-error the controller is stripped for a generic props type too
  props.form?.setValue('rows', [], { source: 'user' });

  return props;
}

interface OptionalModernControlProps extends FieldBaseProps<string[]> {
  form?: FormController<Values>;
}

export function OptionalModernControl(input: OptionalModernControlProps) {
  const resolved = useFieldProps(input);

  assertType<Equal<typeof resolved.form, undefined>>();

  // The common `props = useFieldProps(props)` shape keeps compiling.
  let props = input;
  props = useFieldProps(props);

  return props;
}

// `useFieldProps` cannot infer a legacy instance's field types, so a typed
// `CubeFormInstance<Values>` is not accepted here, before or after CUB-5085.
interface LegacyControlProps extends FieldBaseProps<string[]> {
  form?: CubeFormInstance<any>;
}

export function LegacyControl(input: LegacyControlProps) {
  const props = useFieldProps(input);

  // A legacy instance survives the hook.
  assertType<Equal<typeof props.form, CubeFormInstance<any> | undefined>>();
  props.form?.setFieldValue('rows', []);

  return props;
}

interface EitherControlProps extends FieldBaseProps<string[]> {
  form?: CubeFormInstance<any> | FormController<Values>;
}

export function EitherControl(input: EitherControlProps) {
  const props = useFieldProps(input);

  assertType<Equal<typeof props.form, CubeFormInstance<any> | undefined>>();

  return props;
}

export function StrippedBindingInputs(
  input: FieldBaseProps<string> & { value?: string },
) {
  const props = useFieldProps(input);

  // @ts-expect-error the typed descriptor never reaches the control
  props.field;
  // @ts-expect-error external validator inputs never reach the control
  props.deps;
  // @ts-expect-error declared dependencies never reach the control
  props.dependsOn;
  assertType<Equal<typeof props.name, string | undefined>>();
  assertType<Equal<typeof props.value, string | undefined>>();

  return props;
}
