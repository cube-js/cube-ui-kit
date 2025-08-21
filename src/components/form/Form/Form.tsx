import { useDOMRef } from '@react-spectrum/utils';
import { DOMRef } from '@react-types/shared';
import {
  createContext,
  FormHTMLAttributes,
  forwardRef,
  ReactElement,
  ReactNode,
  useContext,
  useRef,
} from 'react';

import { Provider, useProviderProps } from '../../../provider';
import { FormBaseProps } from '../../../shared/index';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  filterBaseProps,
  Styles,
  tasty,
} from '../../../tasty/index';
import { timeout } from '../../../utils/promise';
import { useCombinedRefs } from '../../../utils/react/index';

import { FieldTypes } from './types';
import { CubeFormData, CubeFormInstance, useForm } from './use-form';

export const FormContext = createContext({});

const FormElement = tasty({
  as: 'form',
  qa: 'Form',
  styles: {
    display: {
      '': 'block',
      horizontal: 'flex',
    },
    flow: {
      '': 'column',
      horizontal: 'row',
    },
    placeItems: {
      '': 'initial',
      horizontal: 'center',
    },
    gap: '2x',
    '$label-width': '25x',
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
  orientation?: 'vertical' | 'horizontal';
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
    labelPosition,
    orientation,
    isRequired,
    necessityIndicator,
    isDisabled,
    isReadOnly,
    validationState,
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

  let styles = extractStyles(otherProps, CONTAINER_STYLES);

  if (labelWidth) {
    styles['$label-width'] = labelWidth;
  }

  let domRef = useDOMRef(ref as any);

  let ctx = {
    labelPosition,
    labelStyles,
    orientation,
    necessityIndicator,
    validateTrigger,
    requiredMark,
    showValid,
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

  if (defaultValuesRef.current !== defaultValues) {
    form?.setInitialFieldsValue(defaultValues ?? {});
    defaultValuesRef.current = defaultValues;
  }

  return (
    <FormElement
      {...filterBaseProps(otherProps, { propNames: formPropNames })}
      ref={domRef}
      noValidate
      styles={styles}
      mods={{ 'has-sider': labelPosition === 'side', horizontal: isHorizontal }}
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
const _Form = forwardRef(Form) as unknown as <T extends FieldTypes>(
  props: CubeFormProps<T> & { ref?: DOMRef<HTMLFormElement> },
) => ReactElement;

(_Form as any).displayName = 'Form';

export { _Form as Form };
