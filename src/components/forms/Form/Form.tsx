import { useDOMRef } from '@react-spectrum/utils';
import { Provider, useProviderProps } from '../../../provider';
import {
  createContext,
  FormHTMLAttributes,
  forwardRef,
  useContext,
  useEffect,
  useRef,
} from 'react';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  filterBaseProps,
  Styles,
  tasty,
} from '../../../tasty';
import { CubeFormData, CubeFormInstance, useForm } from './useForm';
import { useCombinedRefs } from '../../../utils/react';
import { timeout } from '../../../utils/promise';
import { FormBaseProps } from '../../../shared';
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

export interface CubeFormProps<T extends FieldTypes>
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
  onValuesChange?: (data: CubeFormData<T>) => void | Promise<void>;
  /** Trigger when form submit and success */
  onSubmit?: (data: CubeFormData<T>) => void | Promise<void>;
  /** Trigger when form submit and failed */
  onSubmitFailed?: (any?) => void | Promise<any>;
  /** Set form instance created by useForm */
  form?: CubeFormInstance<T>;
  /** The size of the side area with labels. Only for `labelPosition="side"` */
  labelWidth?: Styles['width'];
}

function Form<T extends FieldTypes>(props: CubeFormProps<T>, ref) {
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
    onSubmitCallback = (e) => {
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

      return form?.validateFields().then(
        async () => {
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
        async (e) => {
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
    </FormElement>
  );
}

/**
 * Forms allow users to enter data that can be submitted while providing alignment and styling for form fields.
 */
const _Form = forwardRef(Form);
export { _Form as Form };
