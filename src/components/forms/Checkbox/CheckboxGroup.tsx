import { forwardRef } from 'react';
import { useCheckboxGroup } from '@react-aria/checkbox';
import { useCheckboxGroupState } from '@react-stately/checkbox';

import { useProviderProps } from '../../../provider';
import { FormContext, useFieldProps } from '../Form';
import {
  BaseProps,
  BLOCK_STYLES,
  extractStyles,
  OUTER_STYLES,
  tasty,
} from '../../../tasty';
import { FieldWrapper } from '../FieldWrapper';
import { FormFieldProps } from '../../../shared';
import {
  castNullableArrayValue,
  WithNullableValue,
} from '../../../utils/react/nullableValue';

import { CheckboxGroupContext } from './context';

import type { AriaCheckboxGroupProps } from '@react-types/checkbox';

const WRAPPER_STYLES = {
  display: 'grid',
  gridColumns: {
    '': '1fr',
    'has-sider': 'max-content 1fr',
  },
  gap: {
    '': '0',
    'has-sider': '1x',
  },
  placeItems: 'baseline start',
};

const CheckGroupElement = tasty({
  qa: 'CheckboxGroup',
  styles: {
    display: 'flex',
    placeItems: 'start',
    placeContent: 'start',
    flow: {
      '': 'column',
      horizontal: 'row wrap',
    },
    gap: {
      '': '1x',
      horizontal: '1x 2x',
    },
    padding: '(1x - 1bw) 0',
  },
});

export interface CubeCheckboxGroupProps
  extends BaseProps,
    AriaCheckboxGroupProps,
    FormFieldProps {
  orientation?: 'vertical' | 'horizontal';
}

/**
 * Checkbox groups allow users to select a single option from a list of mutually exclusive options.
 * All possible options are exposed up front for users to compare.
 */
export const CheckboxGroup = forwardRef(function CheckboxGroup(
  props: WithNullableValue<CubeCheckboxGroupProps>,
  ref,
) {
  props = castNullableArrayValue(props);
  props = useProviderProps(props);
  props = useFieldProps(props, {
    defaultValidationTrigger: 'onChange',
    valuePropsMapper: ({ value, onChange }) => ({
      value: value != null ? value : [],
      onChange: onChange,
    }),
  });

  const {
    isDisabled,
    isRequired,
    necessityIndicator,
    necessityLabel,
    label,
    extra,
    labelPosition = 'top',
    validationState,
    children,
    orientation = 'vertical',
    message,
    description,
    labelStyles,
    requiredMark = true,
    tooltip,
    labelSuffix,
    ...otherProps
  } = props;

  const styles = extractStyles(otherProps, OUTER_STYLES, WRAPPER_STYLES);
  const groupStyles = extractStyles(otherProps, BLOCK_STYLES);

  const state = useCheckboxGroupState(props);
  const { groupProps, labelProps } = useCheckboxGroup(props, state);

  const radioGroup = (
    <CheckGroupElement
      styles={groupStyles}
      mods={{ horizontal: orientation === 'horizontal' }}
    >
      <FormContext.Provider value={{ isDisabled, validationState }}>
        <CheckboxGroupContext.Provider value={state}>
          {children}
        </CheckboxGroupContext.Provider>
      </FormContext.Provider>
    </CheckGroupElement>
  );

  return (
    <FieldWrapper
      {...{
        labelPosition,
        label,
        extra,
        styles,
        isRequired,
        labelStyles,
        necessityIndicator,
        necessityLabel,
        labelProps,
        fieldProps: groupProps,
        isDisabled,
        validationState,
        message,
        description,
        requiredMark,
        tooltip,
        labelSuffix,
        Component: radioGroup,
        ref,
      }}
    />
  );
});

/**
 * @legacy should be removed with legacy <Field />
 */
Object.defineProperty(CheckboxGroup, 'cubeInputType', {
  enumerable: false,
  configurable: false,
  writable: false,
  value: 'CheckboxGroup',
});
