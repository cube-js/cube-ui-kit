import { forwardRef } from 'react';
import { Base } from './Base';
import { Label } from './Label';
import { modAttrs } from '../utils/react/modAttrs';

const FIELD_STYLES = {
  display: 'grid',
  columns: {
    '': '1fr',
    'has-sider': 'auto 1fr',
  },
  gap: {
    '': '1x',
    'has-sider': '@(column-gap, 1x)',
  },
  items: 'baseline stretch',
};

const MESSAGE_STYLES = {
  size: 'md',
  color: {
    '': '#dark.75',
    invalid: '#danger-text',
    valid: '#success-text',
    disabled: '#dark.40',
  },
  fontWeight: 400,
  textAlign: 'left',
  column: {
    '': 1,
    'has-sider': 2,
  },
  userSelect: 'none',
};

function FieldWrapper(
  {
    as,
    labelPosition,
    label,
    insideForm,
    styles,
    isRequired,
    isDisabled,
    labelStyles,
    necessityIndicator,
    labelProps,
    fieldProps,
    message,
    messageStyles,
    Component,
    validationState,
    requiredMark = true,
  },
  ref,
) {
  const modProps = modAttrs({
    'has-sider': labelPosition === 'side' && label,
    'inside-form': insideForm,
    invalid: validationState === 'invalid',
    valid: validationState === 'valid',
  });

  return (
    <Base
      as={as || 'div'}
      qa="Field"
      ref={ref}
      {...modProps}
      styles={{
        ...FIELD_STYLES,
        ...styles,
      }}
      {...fieldProps}
    >
      {label && (
        <Label
          as={as === 'label' ? 'div' : 'label'}
          styles={labelStyles}
          labelPosition={labelPosition}
          isRequired={requiredMark ? isRequired : false}
          isDisabled={isDisabled}
          necessityIndicator={necessityIndicator}
          validationState={validationState}
          {...labelProps}
        >
          {label}
        </Label>
      )}
      {Component}
      {message && !isDisabled && (
        <Base
          {...modProps}
          styles={{
            ...MESSAGE_STYLES,
            ...messageStyles,
          }}
          role={validationState === 'invalid' ? 'alert' : null}
        >
          {message}
        </Base>
      )}
    </Base>
  );

  // return React.cloneElement(
  //   Component,
  //   mergeProps(Component.props, {
  //     ref,
  //     styles,
  //   }),
  // );
}

const _FieldWrapper = forwardRef(FieldWrapper);
export { _FieldWrapper as FieldWrapper };
