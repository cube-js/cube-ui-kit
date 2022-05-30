import { forwardRef } from 'react';
import { useDOMRef } from '@react-spectrum/utils';
import { LABEL_STYLES } from '../Label';
import { useProviderProps } from '../../../provider';
import { useRadioGroup } from '@react-aria/radio';
import { useRadioGroupState } from '@react-stately/radio';
import { FormContext, useFormProps } from '../Form/Form';
import { RadioContext } from './context';
import {
  BaseProps,
  BLOCK_STYLES,
  extractStyles,
  OUTER_STYLES,
  Styles,
} from '../../../tasty';
import { Base } from '../../Base';
import { FieldWrapper } from '../FieldWrapper';
import type { AriaRadioGroupProps } from '@react-types/radio';
import { FormFieldProps } from '../../../shared';
import {
  castNullableStringValue,
  WithNullableValue,
} from '../../../utils/react/nullableValue';
import { useContextStyles } from '../../../providers/StyleProvider';

export interface CubeRadioGroupProps
  extends BaseProps,
    AriaRadioGroupProps,
    FormFieldProps {
  groupStyles?: Styles;
}

const GROUP_STYLES = {
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
} as Styles;

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
    ...otherProps
  } = props;
  let domRef = useDOMRef(ref);

  let wrapperContextStyles = useContextStyles('RadioGroup_Wrapper', props);
  let groupContextStyles = useContextStyles('RadioGroup', props);
  let labelContextStyles = useContextStyles('RadioGroup_Label', props);

  styles = extractStyles(otherProps, OUTER_STYLES, {
    ...wrapperContextStyles,
    ...styles,
  });
  groupStyles = extractStyles(otherProps, BLOCK_STYLES, {
    ...GROUP_STYLES,
    ...groupContextStyles,
    ...groupStyles,
  });

  labelStyles = {
    ...LABEL_STYLES,
    ...labelContextStyles,
    ...labelStyles,
  };

  let state = useRadioGroupState(props);
  let { radioGroupProps: fieldProps, labelProps } = useRadioGroup(props, state);

  let radioGroup = (
    <Base
      qa="RadioGroup"
      styles={groupStyles}
      mods={{
        horizontal: orientation === 'horizontal',
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
    </Base>
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
