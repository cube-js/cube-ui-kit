import { CONTAINER_STYLES, filterBaseProps } from '@tenphi/tasty';
import { forwardRef, useMemo, useRef } from 'react';

import { useEvent } from '../../../_internal/hooks/use-event';
import { Provider, useProviderProps } from '../../../provider';
import { mergeRefs } from '../../../utils/react/useCombinedRefs';
import { useLayoutEffect } from '../../../utils/react/useLayoutEffect';
import { extractStyles } from '../../../utils/styles';
import { useValidationProps } from '../validation/use-validation-props';

import {
  FormContext,
  FormElement,
  FormPresentationContext,
  formPropNames,
} from './Form';
import { ModernControllerContext } from './modern/context';
import { getControllerInternals } from './modern/controller';

import type { FormEvent, ReactElement, ReactNode, Ref } from 'react';
import type { CubeFormProps, FormPresentationContextValue } from './Form';
import type { FormController } from './modern/controller';
import type { CallbackBinding, FormCallbacks } from './modern/types';

/** Modern root owns callback bindings; subscriptions stay in descendants. */
export interface ModernFormProps<T extends object = Record<string, unknown>>
  extends Omit<
    CubeFormProps<T>,
    'form' | 'defaultValues' | 'onSubmit' | 'onSubmitFailed' | 'onValuesChange'
  > {
  form: FormController<T>;
  defaultValues?: never;
  /** Runs before a controller reset; preventDefault cancels the reset, including nested controls. */
  onReset?: (event: FormEvent<HTMLFormElement>) => void;
  /** Reserved for controller reset interception. Use onReset to cancel. */
  onResetCapture?: never;
  onSubmit?: FormCallbacks<T, ReactNode>['onSubmit'];
  onSubmitFailed?: FormCallbacks<T, ReactNode>['onSubmitFailed'];
  onValuesChange?: FormCallbacks<T, ReactNode>['onValuesChange'];
  /** Payload selection for native submission, including Enter and external buttons. */
  submitValues?: 'active' | 'all';
}

const EMPTY_LEGACY_CONTEXT = {};

function ModernFormRoot<T extends object>(
  props: ModernFormProps<T>,
  ref: Ref<HTMLFormElement>,
): ReactElement {
  const resolved = useValidationProps(useProviderProps(props));
  const {
    form,
    qa,
    name,
    children,
    orientation = 'vertical',
    labelPosition: authoredLabelPosition,
    labelWidth: authoredLabelWidth,
    labelStyles,
    necessityIndicator,
    validateTrigger,
    requiredMark = true,
    showValid,
    isDisabled,
    isReadOnly,
    isInvalid,
    isValid,
    defaultValues,
    onSubmit,
    onSubmitFailed,
    onValuesChange,
    submitValues = 'active',
    ...otherProps
  } = resolved;
  const labelPosition =
    authoredLabelPosition ?? (orientation === 'horizontal' ? 'side' : 'top');
  const labelWidth =
    authoredLabelWidth ?? (orientation === 'horizontal' ? 'auto' : undefined);
  const internals = getControllerInternals(form, '<Form>');
  const { store } = internals;
  const rootRef = useRef<HTMLFormElement>(null);
  const mergedRef = useMemo(() => mergeRefs(ref, rootRef), [ref]);
  useLayoutEffect(
    () => internals.bindRootElement(rootRef.current),
    [internals],
  );
  if (defaultValues !== undefined) {
    throw new Error(
      'A modern <Form> does not accept defaultValues. Seed Form.useController() or use an explicit defaults command.',
    );
  }
  const binding = useRef<CallbackBinding<T, ReactNode> | undefined>(undefined);
  useLayoutEffect(() => {
    const token = store.bindCallbacks({});
    binding.current = token;
    return () => {
      token.release();
      if (binding.current === token) binding.current = undefined;
    };
  }, [store]);
  useLayoutEffect(() => {
    binding.current?.update({
      ...(onSubmit === undefined ? {} : { onSubmit }),
      ...(onSubmitFailed === undefined ? {} : { onSubmitFailed }),
      ...(onValuesChange === undefined ? {} : { onValuesChange }),
    });
  });
  const handleSubmit = useEvent((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    void form.submit({ include: submitValues });
  });
  const handleReset = useEvent((event: FormEvent<HTMLFormElement>) => {
    // React Aria's native reset listeners do not honor preventDefault. Handle
    // controller resets in capture, before they can write mount-time defaults.
    event.stopPropagation();
    otherProps.onReset?.(event);
    if (!event.defaultPrevented) {
      event.preventDefault();
      form.reset();
    }
  });
  const presentation = useMemo<FormPresentationContextValue>(
    () => ({
      labelPosition,
      labelStyles,
      orientation,
      necessityIndicator,
      validateTrigger,
      requiredMark,
      showValid,
      idPrefix: name,
    }),
    [
      labelPosition,
      labelStyles,
      orientation,
      necessityIndicator,
      validateTrigger,
      requiredMark,
      showValid,
      name,
    ],
  );
  const styles = extractStyles(otherProps, CONTAINER_STYLES);
  if (labelWidth) styles['$label-width'] = labelWidth;

  return (
    <FormElement
      {...filterBaseProps(otherProps, { propNames: formPropNames })}
      ref={mergedRef}
      qa={qa}
      noValidate
      styles={styles}
      mods={{
        'has-sider': labelPosition === 'side',
        'has-split': labelPosition === 'split',
        horizontal: orientation === 'horizontal',
      }}
      onSubmit={otherProps.action == null ? handleSubmit : undefined}
      onReset={otherProps.action == null ? undefined : otherProps.onReset}
      onResetCapture={otherProps.action == null ? handleReset : undefined}
    >
      <FormContext.Provider value={EMPTY_LEGACY_CONTEXT}>
        <ModernControllerContext.Provider value={form}>
          <FormPresentationContext.Provider value={presentation}>
            <Provider
              insideForm
              isDisabled={isDisabled}
              isReadOnly={isReadOnly}
              isInvalid={isInvalid}
              isValid={isValid}
            >
              {children}
            </Provider>
          </FormPresentationContext.Provider>
        </ModernControllerContext.Provider>
      </FormContext.Provider>
    </FormElement>
  );
}

const _ModernFormRoot = forwardRef(ModernFormRoot) as unknown as <
  T extends object,
>(
  props: ModernFormProps<T> & { ref?: Ref<HTMLFormElement> },
) => ReactElement;

(_ModernFormRoot as any).displayName = 'ModernFormRoot';

export { _ModernFormRoot as ModernFormRoot };
