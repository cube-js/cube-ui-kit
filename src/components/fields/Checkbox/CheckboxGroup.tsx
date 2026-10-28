import { useObjectRef } from '@react-aria/utils';
import { BaseProps, Styles, tasty } from '@tenphi/tasty';
import { forwardRef } from 'react';
import { AriaCheckboxGroupProps, useCheckboxGroup } from 'react-aria';
import { useCheckboxGroupState } from 'react-stately';

import { Provider } from '../../../provider';
import { FieldBaseProps } from '../../../shared';
import { mergeProps } from '../../../utils/react';
import {
  castNullableArrayValue,
  WithNullableValue,
} from '../../../utils/react/nullableValue';
import { FormScopeMask, useFieldProps, wrapWithField } from '../../form';
import {
  FieldLayoutStyleProps,
  splitFieldLayout,
} from '../../form/field-layout';

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
  extends
    BaseProps,
    Omit<AriaCheckboxGroupProps, 'errorMessage' | 'form' | 'name'>,
    FieldBaseProps<readonly string[] | null | undefined>,
    FieldLayoutStyleProps {
  orientation?: 'vertical' | 'horizontal';
  inputStyles?: Styles;
}

function CheckboxGroup(
  rawProps: WithNullableValue<CubeCheckboxGroupProps>,
  ref,
) {
  rawProps = castNullableArrayValue(rawProps);
  let props = useFieldProps(rawProps, {
    defaultValidationTrigger: 'onChange',
    valuePropsMapper: ({ value, onChange }) => ({
      value: value != null ? value : [],
      onChange: onChange,
    }),
  });

  let {
    id,
    isDisabled,
    isReadOnly,
    isRequired,
    necessityIndicator,
    label,
    extra,
    isInvalid,
    isValid,
    children,
    orientation = 'vertical',
    message,
    description,
    labelStyles,
    labelProps: baseLabelProps,
    labelSuffix,
    inputStyles,
    form,
  } = props;
  let domRef = useObjectRef(ref);

  // `inputStyles` styles the group too; `styles` goes over it.
  const { styles, field } = splitFieldLayout(props, {
    defaultStyles: inputStyles,
  });

  let state = useCheckboxGroupState(props);
  // React Aria hands `form` to every item's input as the id of its `<form>`,
  // so the form instance would render as `form="[object Object]"` on each.
  let { groupProps, labelProps } = useCheckboxGroup(
    { ...props, form: undefined },
    state,
  );

  // The group owns its semantics in both presentations: `isBare` omits the
  // field wrapper, so putting them there would lose its role and name.
  let radioGroup = (
    <CheckGroupElement
      ref={domRef}
      {...groupProps}
      id={id}
      styles={styles}
      mods={{
        horizontal: orientation === 'horizontal',
      }}
    >
      <FormScopeMask
        value={{
          isDisabled,
          isInvalid,
          isValid,
        }}
      >
        {/* Each checkbox is a field that reads the provider before the form
            context, so the group's own state has to reach it here to beat an
            enclosing disabled or read-only form. `<Provider>` skips
            `undefined`, so a group that sets nothing keeps the form's state. */}
        <Provider isDisabled={isDisabled} isReadOnly={isReadOnly}>
          <CheckboxGroupContext.Provider value={state}>
            {children}
          </CheckboxGroupContext.Provider>
        </Provider>
      </FormScopeMask>
    </CheckGroupElement>
  );

  return wrapWithField(radioGroup, {
    ...props,
    ...field,
    labelProps: mergeProps(baseLabelProps, labelProps),
  });
}

/**
 * Checkbox groups allow users to select any number of options from a list.
 * All possible options are exposed up front for users to compare.
 */
const _CheckboxGroup = forwardRef(CheckboxGroup);

(_CheckboxGroup as any).cubeInputType = 'CheckboxGroup';
_CheckboxGroup.displayName = 'CheckboxGroup';

export { _CheckboxGroup as CheckboxGroup };
