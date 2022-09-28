import { useDOMRef } from '@react-spectrum/utils';
import {
  createContext,
  FormHTMLAttributes,
  forwardRef,
  ReactNode,
  useContext,
  useEffect,
  useRef,
} from 'react';
import { DOMRef } from '@react-types/shared';

import { Provider, useProviderProps } from '../../../provider';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  filterBaseProps,
  Styles,
  tasty,
} from '../../../tasty';
import { useCombinedRefs } from '../../../utils/react';
import { timeout } from '../../../utils/promise';
import { FormBaseProps } from '../../../shared';

import { CubeFormData, CubeFormInstance, useForm } from './useForm';
import { FieldTypes } from './types';

export const FormContext = createContext({});

const FormElement = tasty({
  as: 'form',
  qa: 'Form',
  styles: {
    display: 'block',
    flow: 'column',
    gap: '2x',
    '@label-width': '25x',
  },
});

export function useFormProps<Props>(
  props: Props,
): Props & { form: CubeFormInstance<any> } {
  const ctx = useContext(FormContext);

  return { ...(ctx as any), ...props };
}

const formPropNames = new Set([
  'action',
  'autoComplete',
  'encType',
  'method',
  'target',
]);

export interface CubeFormProps<T extends FieldTypes = FieldTypes>
  extends FormBaseProps,
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
}

function Form<T extends FieldTypes>(
  props: CubeFormProps<T>,
  ref: DOMRef<HTMLFormElement>,
) {
  props = useProviderProps(props);

  let {
    qa,
    name,
    children,
    labelPosition = 'top',
    isRequired,
    necessityIndicator,
    isDisabled,
    isReadOnly,
    validationState,
    labelStyles,
    validateTrigger,
    defaultValues,
    onValuesChange,
    requiredMark = true,
    form,
    labelWidth,
    onSubmit,
    onSubmitFailed,
    ...otherProps
  } = props;
  const firstRunRef = useRef(true);

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

  [form] = useForm<T>(form, ref?.current, {
    onSubmit: onSubmitCallback,
    onValuesChange,
  });

  let styles = extractStyles(otherProps, CONTAINER_STYLES);

  if (labelWidth) {
    styles['@label-width'] = labelWidth;
  }

  let domRef = useDOMRef(ref);

  let ctx = {
    labelPosition,
    labelStyles,
    necessityIndicator,
    validateTrigger,
    requiredMark,
    form,
    submitError: form.submitError,
    idPrefix: name,
  };

  if (firstRunRef.current && form) {
    if (defaultValues) {
      form.setInitialFieldsValue(defaultValues);
      form.resetFields(undefined, true);
      firstRunRef.current = false;
    }
  }

  useEffect(() => {
    if (defaultValues) {
      form?.setInitialFieldsValue(defaultValues);
    }
  }, [defaultValues]);

  return (
    <FormElement
      {...filterBaseProps(otherProps, { propNames: formPropNames })}
      ref={domRef}
      noValidate
      styles={styles}
      mods={{ 'has-sider': labelPosition === 'side' }}
      onSubmit={onSubmitCallback}
    >
      <FormContext.Provider value={ctx}>
        <Provider
          insideForm={true}
          isDisabled={isDisabled}
          isReadOnly={isReadOnly}
          isRequired={isRequired}
          validationState={validationState}
        >
          {children}
        </Provider>
      </FormContext.Provider>
    </FormElement>
  );
}

/**
 * Forms allow users to enter data that can be submitted while providing alignment and styling for form fields.
 */
const _Form = forwardRef(Form) as <T extends FieldTypes>(
  props: CubeFormProps<T> & { ref?: DOMRef<HTMLFormElement> },
) => JSX.Element;

export { _Form as Form };
