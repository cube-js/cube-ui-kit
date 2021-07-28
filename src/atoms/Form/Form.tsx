import { useDOMRef } from '@react-spectrum/utils';
import { Provider, useProviderProps } from '../../provider';
import { createContext, useContext, useEffect, forwardRef } from 'react';
import { Base } from '../../components/Base';
import { extractStyles } from '../../utils/styles';
import { CONTAINER_STYLES } from '../../styles/list';
import { filterBaseProps } from '../../utils/filterBaseProps';
import { useForm } from './useForm';
import { useCombinedRefs } from '../../utils/react';
import { timeout } from '../../utils/promise';

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
  'onSubmit',
  'onSubmitFailed',
]);

const DEFAULT_STYLES = {
  display: 'block',
  flow: 'column',
  gap: '2x',
};

function Form(props, ref) {
  props = useProviderProps(props);
  let {
    qa,
    name,
    children,
    labelPosition = 'top',
    isRequired,
    necessityIndicator,
    isEmphasized,
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

  ref = useCombinedRefs(ref);

  let onSubmitCallback;

  if ((onSubmit || onSubmitFailed) && !otherProps.action) {
    otherProps.onSubmit = onSubmitCallback = (e) => {
      e && e.preventDefault();

      return form.validateFields().then(
        async () => {
          await timeout();
          onSubmit && onSubmit(form.getFieldValues());
        },
        async (e) => {
          await timeout();
          if (e instanceof Error) {
            throw e;
          }
          // errors are shown
          // transfer errors to the callback
          onSubmitFailed && onSubmitFailed(e);
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

  useEffect(() => {
    if (form && defaultValues) {
      form.setInitialFieldValues(defaultValues);
      form.resetFields();
    }
  }, []);

  return (
    <Base
      as="form"
      qa="Form"
      {...filterBaseProps(otherProps, { propNames: formPropNames })}
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
          isEmphasized={isEmphasized}
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
const _Form = Object.assign(forwardRef(Form), { useForm });
export { _Form as Form };
