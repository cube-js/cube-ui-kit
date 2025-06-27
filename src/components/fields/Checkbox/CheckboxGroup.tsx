import { useDOMRef } from '@react-spectrum/utils';
import { forwardRef } from 'react';
import { AriaCheckboxGroupProps, useCheckboxGroup } from 'react-aria';
import { useCheckboxGroupState } from 'react-stately';

import { useProviderProps } from '../../../provider';
import { FieldBaseProps } from '../../../shared';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  Styles,
  tasty,
} from '../../../tasty';
import { mergeProps } from '../../../utils/react';
import {
  castNullableArrayValue,
  WithNullableValue,
} from '../../../utils/react/nullableValue';
import {
  FormContext,
  useFieldProps,
  useFormProps,
  wrapWithField,
} from '../../form';

import { CheckboxGroupContext } from './context';

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
  },
});

export interface CubeCheckboxGroupProps
  extends BaseProps,
    Omit<AriaCheckboxGroupProps, 'errorMessage'>,
    FieldBaseProps,
    ContainerStyleProps {
  orientation?: 'vertical' | 'horizontal';
  inputStyles?: Styles;
}

function CheckboxGroup(props: WithNullableValue<CubeCheckboxGroupProps>, ref) {
  props = castNullableArrayValue(props);
  props = useProviderProps(props);
  props = useFormProps(props);
  props = useFieldProps(props, {
    defaultValidationTrigger: 'onChange',
    valuePropsMapper: ({ value, onChange }) => ({
      value: value != null ? value : [],
      onChange: onChange,
    }),
  });

  let {
    isDisabled,
    isRequired,
    necessityIndicator,
    necessityLabel,
    label,
    extra,
    validationState,
    children,
    orientation = 'vertical',
    message,
    description,
    labelStyles,
    tooltip,
    labelProps: baseLabelProps,
    labelSuffix,
    inputStyles,
    ...otherProps
  } = props;
  let domRef = useDOMRef(ref);

  let styles = extractStyles(otherProps, CONTAINER_STYLES);

  let state = useCheckboxGroupState(props);
  let { groupProps, labelProps } = useCheckboxGroup(props, state);

  let radioGroup = (
    <CheckGroupElement
      styles={inputStyles}
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

  return wrapWithField(radioGroup, domRef, {
    ...props,
    children: null,
    fieldProps: groupProps,
    labelProps: mergeProps(baseLabelProps, labelProps),
    styles,
  });
}

/**
 * Checkbox groups allow users to select a single option from a list of mutually exclusive options.
 * All possible options are exposed up front for users to compare.
 */
const _CheckboxGroup = forwardRef(CheckboxGroup);

(_CheckboxGroup as any).cubeInputType = 'CheckboxGroup';
_CheckboxGroup.displayName = 'CheckboxGroup';

export { _CheckboxGroup as CheckboxGroup };
