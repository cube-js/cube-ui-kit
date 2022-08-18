import { forwardRef } from 'react';
import { useDOMRef } from '@react-spectrum/utils';
import { useProviderProps } from '../../../provider';
import { useRadioGroup } from '@react-aria/radio';
import { useRadioGroupState } from '@react-stately/radio';
import { FormContext, useFormProps } from '../Form';
import { RadioContext } from './context';
import {
  BaseProps,
  BLOCK_STYLES,
  extractStyles,
  OUTER_STYLES,
  Styles,
  tasty,
} from '../../../tasty';
import { FieldWrapper } from '../FieldWrapper';
import type { AriaRadioGroupProps } from '@react-types/radio';
import { FormFieldProps } from '../../../shared';
import {
  castNullableStringValue,
  WithNullableValue,
} from '../../../utils/react/nullableValue';

export interface CubeRadioGroupProps
  extends BaseProps,
    AriaRadioGroupProps,
    FormFieldProps {
  groupStyles?: Styles;
}

const RadioGroupElement = tasty({
  qa: 'RadioGroup',
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
    padding: {
      '': 0,
      'inside-form & side-label': '1.5x 0',
    },
  },
});

function RadioGroup(props: WithNullableValue<CubeRadioGroupProps>, ref) {
  props = castNullableStringValue(props);
  props = useProviderProps(props);
  props = useFormProps(props);

  let {
    isDisabled,
    isRequired,
    necessityIndicator,
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
    isHidden,
    styles,
    groupStyles,
    insideForm,
    labelSuffix,
    ...otherProps
  } = props;
  let domRef = useDOMRef(ref);

  styles = extractStyles(otherProps, OUTER_STYLES, styles);
  groupStyles = extractStyles(otherProps, BLOCK_STYLES, groupStyles);

  let state = useRadioGroupState(props);
  let { radioGroupProps: fieldProps, labelProps } = useRadioGroup(props, state);

  let radioGroup = (
    <RadioGroupElement
      styles={groupStyles}
      mods={{
        horizontal: orientation === 'horizontal',
        'inside-form': insideForm,
        'side-label': labelPosition === 'side',
      }}
    >
      <FormContext.Provider
        value={{
          isRequired,
          validationState,
          isDisabled,
        }}
      >
        <RadioContext.Provider value={state}>{children}</RadioContext.Provider>
      </FormContext.Provider>
    </RadioGroupElement>
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
        labelProps,
        fieldProps,
        isDisabled,
        validationState,
        message,
        description,
        requiredMark,
        tooltip,
        isHidden,
        Component: radioGroup,
        ref: domRef,
        labelSuffix,
      }}
    />
  );
}

/**
 * Radio groups allow users to select a single option from a list of mutually exclusive options.
 * All possible options are exposed up front for users to compare.
 */
const _RadioGroup = forwardRef(RadioGroup);

(_RadioGroup as any).cubeInputType = 'RadioGroup';

export { _RadioGroup as RadioGroup };
