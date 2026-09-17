import { CONTAINER_STYLES, filterBaseProps } from '@tenphi/tasty';
import { forwardRef, useMemo } from 'react';

import { Provider, useProviderProps } from '../../../provider';
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

import type { FormEvent, ReactElement, Ref } from 'react';
import type { CubeFormProps, FormPresentationContextValue } from './Form';
import type { FormController } from './modern/controller';

/** Phase 5 root: presentation and subscriptions; callbacks arrive in phase 7. */
export interface ModernFormProps<T extends object = Record<string, unknown>>
  extends Omit<
    CubeFormProps<T>,
    'form' | 'defaultValues' | 'onSubmit' | 'onSubmitFailed' | 'onValuesChange'
  > {
  form: FormController<T>;
  defaultValues?: never;
  onSubmit?: never;
  onSubmitFailed?: never;
  onValuesChange?: never;
}

const EMPTY_LEGACY_CONTEXT = {};

function preventUnimplementedSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  event.stopPropagation();
}

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
    labelPosition = orientation === 'horizontal' ? 'side' : 'top',
    labelWidth = orientation === 'horizontal' ? 'auto' : undefined,
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
    ...otherProps
  } = resolved;
  getControllerInternals(form, '<Form>');
  if (defaultValues !== undefined) {
    throw new Error(
      'A modern <Form> does not accept defaultValues. Seed Form.useController() or use an explicit defaults command.',
    );
  }
  if (onSubmit || onSubmitFailed || onValuesChange) {
    throw new Error(
      'Modern <Form> callback bindings are not available yet. Use the controller creation options for onValuesChange; submission arrives in a later phase.',
    );
  }
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
      ref={ref}
      qa={qa}
      noValidate
      styles={styles}
      mods={{
        'has-sider': labelPosition === 'side',
        'has-split': labelPosition === 'split',
        horizontal: orientation === 'horizontal',
      }}
      onSubmit={
        otherProps.action == null ? preventUnimplementedSubmit : undefined
      }
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
