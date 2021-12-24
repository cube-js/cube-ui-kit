import { useDOMRef } from '@react-spectrum/utils';
import { Provider, useProviderProps } from '../../../provider';
import {
  createContext,
  useContext,
  useRef,
  forwardRef,
  FormHTMLAttributes, useEffect,
} from 'react';
import { Base } from '../../Base';
import { extractStyles } from '../../../utils/styles';
import { CONTAINER_STYLES } from '../../../styles/list';
import { filterBaseProps } from '../../../utils/filterBaseProps';
import { CubeFormInstance, useForm, CubeFormData } from './useForm';
import { useCombinedRefs } from '../../../utils/react';
import { timeout } from '../../../utils/promise';
import { BaseProps, ContainerStyleProps } from '../../types';
import { FormBaseProps } from '../../../shared';

export const FormContext = createContext({});

export function useFormProps(props) {
  const ctx = useContext(FormContext);

  return { ...ctx, ...props };
}

const formPropNames = new Set([
  'action',
  'autoComplete',
  'encType',
  'method',
  'target',
]);

const DEFAULT_STYLES = {
  display: 'block',
  flow: 'column',
  gap: '2x',
  '@label-width': '25x',
};

export interface CubeFormProps
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
  defaultValues?: { [key: string]: any };
  /** Trigger when any value of Field changed */
  onValuesChange?: (data: CubeFormData) => void | Promise<void>;
  /** Trigger when form submit and success */
  onSubmit?: (data: CubeFormData) => void | Promise<void>;
  /** Trigger when form submit and failed */
  onSubmitFailed?: (any?) => void | Promise<any>;
  /** Set form instance created by useForm */
  form?: CubeFormInstance;
}

function Form(props: CubeFormProps, ref) {
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
    onSubmit,
    onSubmitFailed,
    ...otherProps
  } = props;
  let styles;

  const firstRunRef = useRef(true);

  ref = useCombinedRefs(ref);

  let onSubmitCallback;

  if ((onSubmit || onSubmitFailed) && !otherProps.action) {
    onSubmitCallback = (e) => {
      if (e && e?.preventDefault) {
        e && e?.preventDefault && e?.preventDefault();
        e && e?.stopPropagation && e?.stopPropagation();

        if (e.nativeEvent) {
          const evt = e.nativeEvent;

          if (
            evt.submitter
            && evt.submitter.getAttribute('type') !== 'submit'
          ) {
            return;
          }
        }
      }

      return form?.validateFields().then(
        async() => {
          await timeout();

          if (form && !form.isSubmitting) {
            try {
              form.setSubmitting(true);
              await onSubmit?.(form.getFormData());
            } finally {
              form.setSubmitting(false);
            }
          }
        },
        async(e) => {
          await timeout();
          if (e instanceof Error) {
            throw e;
          }
          // errors are shown
          // transfer errors to the callback
          onSubmitFailed?.(e);
        },
      );

      // output data from form directly
      // onSubmit(Object.fromEntries(new FormData(e.target).entries()));
    };
  }

  [form] = useForm(form, ref && ref.current, {
    onSubmit: onSubmitCallback,
    onValuesChange,
  });

  styles = extractStyles(otherProps, CONTAINER_STYLES, DEFAULT_STYLES);

  let domRef = useDOMRef(ref);

  let ctx = {
    labelPosition,
    labelStyles,
    necessityIndicator,
    validateTrigger,
    requiredMark,
    form,
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
    <Base
      as="form"
      qa="Form"
      {...filterBaseProps(otherProps, { propNames: formPropNames })}
      onSubmit={onSubmitCallback}
      noValidate
      styles={styles}
      ref={domRef}
      mods={{
        'has-sider': labelPosition === 'side',
      }}
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
    </Base>
  );
}

/**
 * Forms allow users to enter data that can be submitted while providing alignment and styling for form fields.
 */
const _Form = forwardRef(Form);
export { _Form as Form };
