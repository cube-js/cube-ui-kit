import { useObjectRef } from '@react-aria/utils';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  filterBaseProps,
  Styles,
} from '@tenphi/tasty';
import {
  FormEvent,
  FormHTMLAttributes,
  forwardRef,
  ReactElement,
  ReactNode,
  Ref,
  useRef,
} from 'react';

import { useEvent } from '../../../_internal/hooks/use-event';
import { Provider, useProviderProps } from '../../../provider';
import { FormBaseProps } from '../../../shared/form';
import { timeout } from '../../../utils/promise';
import { useCombinedRefs } from '../../../utils/react/useCombinedRefs';
import { extractStyles } from '../../../utils/styles';
import { useValidationProps } from '../validation/use-validation-props';

import { isModernFormController } from './backend';
import {
  FormContext,
  FormPresentationContext,
  FormPresentationContextValue,
} from './FormContext';
import { FormElement, formPropNames } from './FormElement';
import { ModernControllerContext } from './modern/context';
import { ModernFormRoot } from './ModernFormRoot';
import { resetUnboundControls } from './reset-unbound-controls';
import { FieldTypes } from './types';
import { CubeFormData, CubeFormInstance, useForm } from './use-form';

import type { ModernFormProps } from './ModernFormRoot';

/** Separate overloads retain contextual callback typing for each backend. */
export interface FormRootComponent {
  <T extends FieldTypes = FieldTypes>(
    props: CubeFormProps<T> & { ref?: Ref<HTMLFormElement> },
  ): ReactElement;
  <T extends FieldTypes = FieldTypes>(
    props: ModernFormProps<T> & { ref?: Ref<HTMLFormElement> },
  ): ReactElement;
}

export interface CubeFormProps<T extends FieldTypes = FieldTypes>
  extends
    FormBaseProps,
    BaseProps,
    ContainerStyleProps,
    Pick<
      FormHTMLAttributes<HTMLFormElement>,
      'action' | 'autoComplete' | 'encType' | 'method' | 'target'
    > {
  /** Form name */
  name?: string;
  /** Default field values */
  defaultValues?: Partial<T>;
  /** Trigger when any value of the Field is changed */
  onValuesChange?: CubeFormInstance<T>['onValuesChange'];
  /** Trigger on form submit and success */
  onSubmit?: CubeFormInstance<T>['onSubmit'];
  /** Trigger on form submit and failed */
  onSubmitFailed?: (any?) => void | Promise<any>;
  /** Set form instance created by useForm */
  form?: CubeFormInstance<T, CubeFormData<T>>;
  /** The size of the side area with labels. Only for `labelPosition="side"` */
  labelWidth?: Styles['width'];
  orientation?: 'vertical' | 'horizontal';
}

/**
 * The legacy backend's root: the current engine under an internal name. Its
 * role is compatibility; see `legacy-contract/README.md` for what is frozen.
 */
function LegacyFormRoot<T extends FieldTypes>(
  props: CubeFormProps<T>,
  ref: Ref<HTMLFormElement>,
) {
  'use no memo';
  // Legacy form state is mutable; preserve its render-time reads until migration.

  props = useValidationProps(useProviderProps(props));
  let {
    qa,
    name,
    children,
    labelPosition,
    orientation,
    necessityIndicator,
    isDisabled,
    isReadOnly,
    isInvalid,
    isValid,
    labelStyles,
    validateTrigger,
    showValid,
    defaultValues,
    onValuesChange,
    requiredMark = true,
    form,
    labelWidth,
    onSubmit,
    onSubmitFailed,
    ...otherProps
  } = props;
  const defaultValuesRef = useRef(defaultValues);
  const firstRunRef = useRef(true);
  const isHorizontal = orientation === 'horizontal';

  if (!orientation) {
    orientation = 'vertical';
  }

  if (!labelPosition) {
    labelPosition = isHorizontal ? 'side' : 'top';
  }

  if (!labelWidth) {
    labelWidth = isHorizontal ? 'auto' : undefined;
  }

  ref = useCombinedRefs(ref);

  let onSubmitCallback;

  if ((onSubmit || onSubmitFailed) && !otherProps.action) {
    onSubmitCallback = async (e) => {
      if (e && e?.preventDefault) {
        e && e?.preventDefault && e?.preventDefault();
        e && e?.stopPropagation && e?.stopPropagation();

        if (e.nativeEvent) {
          const evt = e.nativeEvent;

          if (
            evt.submitter &&
            evt.submitter.getAttribute('type') !== 'submit'
          ) {
            return;
          }
        }
      }

      if (!form || form.isSubmitting) return;

      form.submitError = null;
      form.setSubmitting(true);

      try {
        try {
          await form.validateFields();
        } catch (e) {
          form?.setSubmitting(false);

          return;
        }

        await timeout();
        await onSubmit?.(form.getFormData());
      } catch (e) {
        await timeout();

        // errors are shown
        form.submitError = e as ReactNode;
        // transfer errors to the callback
        onSubmitFailed?.(e);

        if (e instanceof Error) {
          throw e;
        }
      } finally {
        form?.setSubmitting(false);
      }

      // output data from form directly
      // onSubmit(Object.fromEntries(new FormData(e.target).entries()));
    };
  }

  [form] = useForm<T>(form, ref && ref.current, {
    onSubmit: onSubmitCallback,
    onValuesChange,
  });

  // A native reset (`ResetButton` is `type="reset"`) reaches React Aria's
  // `useFormReset` listener on every input, which writes the value the input
  // started with through `onChange` and ignores `preventDefault`; a
  // `CheckboxGroup` even lands on `[]`. Reset the form once instead, in
  // capture, before those listeners run, as `ModernFormRoot` does, and report
  // the result to `onValuesChange`. Also with `action`: it hands only the submit
  // to the browser, and the form still owns every bound value. Controls it does
  // not own get the browser's reset from `resetUnboundControls`.
  const handleReset = useEvent((event: FormEvent<HTMLFormElement>) => {
    event.stopPropagation();
    event.preventDefault();
    resetUnboundControls(
      event.currentTarget,
      (name) => form.getFieldInstance(name) != null,
    );
    form.resetFields();
    form.onValuesChange?.(form.getFormData());
  });

  let styles = extractStyles(otherProps, CONTAINER_STYLES);

  if (labelWidth) {
    styles['$label-width'] = labelWidth;
  }

  let domRef = useObjectRef(ref);

  const presentation: FormPresentationContextValue = {
    labelPosition,
    labelStyles,
    orientation,
    necessityIndicator,
    validateTrigger,
    requiredMark,
    showValid,
    idPrefix: name,
  };

  let ctx = {
    ...presentation,
    form,
    submitError: form.submitError,
  };

  if (firstRunRef.current && form) {
    if (defaultValues) {
      form.setInitialFieldsValue(defaultValues);
      form.resetFields(undefined, true);
      firstRunRef.current = false;
    }
  }

  if (defaultValuesRef.current !== defaultValues) {
    form?.setInitialFieldsValue(defaultValues ?? {});
    defaultValuesRef.current = defaultValues;
  }

  return (
    <FormElement
      {...filterBaseProps(otherProps, { propNames: formPropNames })}
      ref={domRef}
      noValidate
      qa={qa}
      styles={styles}
      mods={{
        'has-sider': labelPosition === 'side',
        'has-split': labelPosition === 'split',
        horizontal: isHorizontal,
      }}
      onSubmit={onSubmitCallback}
      onResetCapture={handleReset}
    >
      <ModernControllerContext.Provider value={null}>
        <FormPresentationContext.Provider value={presentation}>
          <FormContext.Provider value={ctx}>
            <Provider
              insideForm={true}
              isDisabled={isDisabled}
              isReadOnly={isReadOnly}
              isInvalid={isInvalid}
              isValid={isValid}
            >
              {children}
            </Provider>
          </FormContext.Provider>
        </FormPresentationContext.Provider>
      </ModernControllerContext.Provider>
    </FormElement>
  );
}

const _LegacyFormRoot = forwardRef(LegacyFormRoot) as unknown as <
  T extends FieldTypes,
>(
  props: CubeFormProps<T> & { ref?: Ref<HTMLFormElement> },
) => ReactElement;

(_LegacyFormRoot as any).displayName = 'LegacyFormRoot';

/**
 * The `<Form>` facade. It chooses the root by the brand of the `form` prop
 * before any backend hook runs. Without an explicit modern controller it is
 * the legacy root, so existing `<Form>` and `Form.useForm()` keep their behavior.
 */
function Form<T extends FieldTypes>(
  props: CubeFormProps<T> | ModernFormProps<T>,
  ref: Ref<HTMLFormElement>,
) {
  if (isModernFormController(props.form)) {
    return <ModernFormRoot {...(props as ModernFormProps<T>)} ref={ref} />;
  }

  return <_LegacyFormRoot {...(props as CubeFormProps<T>)} ref={ref} />;
}

/**
 * Forms allow users to enter data that can be submitted while providing alignment and styling for form fields.
 */
const _Form = forwardRef(Form) as unknown as FormRootComponent;

(_Form as any).displayName = 'Form';

export { _Form as Form, _LegacyFormRoot as LegacyFormRoot };
