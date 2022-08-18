import { forwardRef } from 'react';
import { useDOMRef } from '@react-spectrum/utils';
import { useProviderProps } from '../../../provider';
import { useCheckboxGroup } from '@react-aria/checkbox';
import { useCheckboxGroupState } from '@react-stately/checkbox';
import { FormContext, useFormProps } from '../Form/Form';
import { CheckboxGroupContext } from './context';
import {
  BaseProps,
  BLOCK_STYLES,
  extractStyles,
  OUTER_STYLES,
  tasty,
} from '../../../tasty';

import { FieldWrapper } from '../FieldWrapper';
import type { AriaCheckboxGroupProps } from '@react-types/checkbox';
import { FormFieldProps } from '../../../shared';
import {
  castNullableArrayValue,
  WithNullableValue,
} from '../../../utils/react/nullableValue';

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

function CheckboxGroup(props: WithNullableValue<CubeCheckboxGroupProps>, ref) {
  props = castNullableArrayValue(props);
  props = useProviderProps(props);
  props = useFormProps(props);

  let {
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
  let domRef = useDOMRef(ref);

  let styles = extractStyles(otherProps, OUTER_STYLES, WRAPPER_STYLES);
  let groupStyles = extractStyles(otherProps, BLOCK_STYLES);

  let state = useCheckboxGroupState(props);
  let { groupProps, labelProps } = useCheckboxGroup(props, state);

  let radioGroup = (
    <CheckGroupElement
      styles={groupStyles}
      mods={{
        horizontal: orientation === 'horizontal',
      }}
    >
      <FormContext.Provider
        value={{
          isDisabled,
          validationState,
        }}
      >
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
        ref: domRef,
      }}
    />
  );
}

/**
 * Checkbox groups allow users to select a single option from a list of mutually exclusive options.
 * All possible options are exposed up front for users to compare.
 */
const _CheckboxGroup = forwardRef(CheckboxGroup);

(_CheckboxGroup as any).cubeInputType = 'CheckboxGroup';

export { _CheckboxGroup as CheckboxGroup };
