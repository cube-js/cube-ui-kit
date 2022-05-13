import { forwardRef } from 'react';
import { useDOMRef } from '@react-spectrum/utils';
import { LABEL_STYLES } from '../Label';
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
  useContextStyles,
} from '../../../tasty';
import { Base } from '../../Base';
import { FieldWrapper } from '../FieldWrapper';
import type { AriaCheckboxGroupProps } from '@react-types/checkbox';
import { FormFieldProps } from '../../../shared';
import {
  castNullableArrayValue,
  WithNullableValue,
} from '../../../utils/react/nullableValue';

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
};

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
};

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
    ...otherProps
  } = props;
  let domRef = useDOMRef(ref);

  let wrapperContextStyles = useContextStyles('CheckboxGroup_Wrapper', props);
  let groupContextStyles = useContextStyles('CheckboxGroup', props);
  let labelContextStyles = useContextStyles('CheckboxGroup_Label', props);

  let styles = extractStyles(otherProps, OUTER_STYLES, {
    ...STYLES,
    ...wrapperContextStyles,
  });
  let groupStyles = extractStyles(otherProps, BLOCK_STYLES, {
    ...GROUP_STYLES,
    ...groupContextStyles,
  });

  labelStyles = {
    ...LABEL_STYLES,
    ...labelContextStyles,
    ...labelStyles,
  };

  let state = useCheckboxGroupState(props);
  let { groupProps, labelProps } = useCheckboxGroup(props, state);

  let radioGroup = (
    <Base
      qa="CheckboxGroup"
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
        necessityLabel,
        labelProps,
        fieldProps: groupProps,
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
 * Checkbox groups allow users to select a single option from a list of mutually exclusive options.
 * All possible options are exposed up front for users to compare.
 */
const _CheckboxGroup = forwardRef(CheckboxGroup);

(_CheckboxGroup as any).cubeInputType = 'CheckboxGroup';

export { _CheckboxGroup as CheckboxGroup };
