import { forwardRef } from 'react';
import { useDOMRef } from '@react-spectrum/utils';
import { LABEL_STYLES } from '../../components/Label';
import { useProviderProps } from '../../provider';
import { useCheckboxGroup } from '@react-aria/checkbox';
import { useCheckboxGroupState } from '@react-stately/checkbox';
import { FormContext, useFormProps } from '../Form/Form';
import { CheckboxGroupContext } from './context';
import { extractStyles } from '../../utils/styles';
import { BLOCK_STYLES, OUTER_STYLES } from '../../styles/list';
import { Base } from '../../components/Base';
import { useContextStyles } from '../../providers/Styles';
import { FieldWrapper } from '../../components/FieldWrapper';
import { BaseProps } from '../../components/types';
import { AriaCheckboxGroupProps } from '@react-types/checkbox';
import { FormFieldProps } from '../../shared';

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
};

export interface CubeCheckboxGroupProps
  extends BaseProps,
    AriaCheckboxGroupProps,
    FormFieldProps {
  orientation?: 'vertical' | 'horizontal';
}

function CheckboxGroup(props: CubeCheckboxGroupProps, ref) {
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
    insideForm,
    orientation = 'vertical',
    message,
    labelStyles,
    requiredMark = true,
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
        insideForm,
        styles,
        isRequired,
        labelStyles,
        necessityIndicator,
        labelProps,
        fieldProps: groupProps,
        isDisabled,
        validationState,
        message,
        requiredMark,
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
const _CheckboxGroup = Object.assign(forwardRef(CheckboxGroup), {
  cubeInputType: 'CheckboxGroup',
});
export { _CheckboxGroup as CheckboxGroup };
