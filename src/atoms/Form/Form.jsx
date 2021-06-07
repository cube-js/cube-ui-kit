import { useDOMRef } from '@react-spectrum/utils';
import { Provider, useProviderProps } from '../../provider';
import React, { useContext } from 'react';
import { Base } from '../../components/Base';
import { extractStyles } from '../../utils/styles.js';
import { CONTAINER_STYLES } from '../../styles/list';
import { filterBaseProps } from '../../utils/filterBaseProps';

let FormContext = React.createContext({});

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
]);

const DEFAULT_STYLES = {
  display: 'grid',
  columns: {
    '': '1fr',
    'has-sider': `@sider-size 1fr`,
  },
  gap: {
    '': '.5x',
    'has-sider': '2x 1x',
  },
  '--sider-size': 'max-content',
};

function Form(props, ref) {
  props = useProviderProps(props);
  let {
    qa,
    children,
    labelPosition = 'top',
    labelAlign = 'start',
    isRequired,
    necessityIndicator,
    isQuiet,
    isEmphasized,
    isDisabled,
    isReadOnly,
    validationState,
    ...otherProps
  } = props;
  let styles;

  styles = extractStyles(otherProps, CONTAINER_STYLES, DEFAULT_STYLES);

  let domRef = useDOMRef(ref);

  let ctx = {
    labelPosition,
    labelAlign,
    necessityIndicator,
  };

  if (otherProps.onSubmit && !otherProps.action) {
    const onSubmit = otherProps.onSubmit;

    otherProps.onSubmit = (e) => {
      e.preventDefault();

      onSubmit(Object.fromEntries(new FormData(e.target).entries()));
    };
  }

  return (
    <Base
      as="form"
      qa="Form"
      {...filterBaseProps(otherProps, { propNames: formPropNames })}
      styles={styles}
      ref={domRef}
      data-is-has-sider={labelPosition === 'side' ? '' : null}
    >
      <FormContext.Provider value={ctx}>
        <Provider
          insideForm={true}
          isQuiet={isQuiet}
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
const _Form = React.forwardRef(Form);
export { _Form as Form };
