import { forwardRef } from 'react';
import { useDOMRef } from '@react-spectrum/utils';
import { LABEL_STYLES } from '../Label';
import { useProviderProps } from '../../../provider';
import { useRadioGroup } from '@react-aria/radio';
import { useRadioGroupState } from '@react-stately/radio';
import { FormContext, useFormProps } from '../Form/Form';
import { RadioContext } from './context';
import { extractStyles } from '../../../utils/styles';
import { BLOCK_STYLES, OUTER_STYLES } from '../../../styles/list';
import { Base } from '../../Base';
import { useContextStyles } from '../../../providers/StylesProvider';
import { FieldWrapper } from '../FieldWrapper';
import { Styles } from '../../../styles/types';
import { BaseProps } from '../../types';
import { AriaRadioGroupProps } from '@react-types/radio';
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

const STYLES = {
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
} as Styles;

const GROUP_STYLES = {
  display: 'grid',
  flow: {
    '': 'row',
    horizontal: 'column',
  },
  gap: {
    '': '1x',
    horizontal: '2x',
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
    labelPosition = 'top',
    validationState,
    children,
    orientation = 'vertical',
    message,
    description,
    labelStyles,
    requiredMark = true,
    tooltip,
    styles,
    groupStyles,
    ...otherProps
  } = props;
  let domRef = useDOMRef(ref);

  let wrapperContextStyles = useContextStyles('RadioGroup_Wrapper', props);
  let groupContextStyles = useContextStyles('RadioGroup', props);
  let labelContextStyles = useContextStyles('RadioGroup_Label', props);

  styles = extractStyles(otherProps, OUTER_STYLES, {
    ...STYLES,
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
const _RadioGroup = Object.assign(forwardRef(RadioGroup), {
  cubeInputType: 'RadioGroup',
});
export { _RadioGroup as RadioGroup };
