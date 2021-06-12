import React, { forwardRef } from 'react';
import { Base } from './Base';
import { Label } from './Label';
import { mergeProps } from '@react-aria/utils';
import { modAttrs } from '../utils/react/modAttrs';

const FIELD_STYLES = {
  display: {
    '': 'grid',
    'inside-form': 'contents',
  },
  columns: {
    '': '1fr',
    'has-sider': 'max-content 1fr',
  },
  gap: {
    '': '.5x',
    'has-sider': '1x',
  },
  items: 'baseline start',
};

const ERROR_MESSAGE_STYLES = {
  size: 'md',
  color: '#danger-text',
  fontWeight: 400,
  column: {
    '': 1,
    'has-sider': 2,
  },
};

function FieldWrapper(
  {
    labelPosition,
    label,
    insideForm,
    styles,
    isRequired,
    isDisabled,
    labelAlign,
    labelStyles,
    necessityIndicator,
    labelProps,
    errorMessage,
    errorStyles,
    Component,
    validationState,
  },
  ref,
) {
  const modProps = modAttrs({
    'has-sider': labelPosition === 'side' && label,
    'inside-form': insideForm,
  });

  if (label) {
    return (
      <Base
        qa="Field"
        ref={ref}
        {...modProps}
        styles={{
          ...FIELD_STYLES,
          ...styles,
        }}
      >
        {label && (
          <Label
            styles={labelStyles}
            labelPosition={labelPosition}
            labelAlign={labelAlign}
            isRequired={isRequired}
            isDisabled={isDisabled}
            necessityIndicator={necessityIndicator}
            validationState={validationState}
            {...labelProps}
          >
            {label}
          </Label>
        )}
        {Component}
        {errorMessage && validationState === 'invalid' && (
          <Base
            {...modProps}
            styles={{
              ...ERROR_MESSAGE_STYLES,
              ...errorStyles,
            }}
          >
            {errorMessage}
          </Base>
        )}
      </Base>
    );
  }

  return React.cloneElement(
    Component,
    mergeProps(Component.props, {
      ref,
      styles,
    }),
  );
}

const _FieldWrapper = forwardRef(FieldWrapper);
export { _FieldWrapper as FieldWrapper };
