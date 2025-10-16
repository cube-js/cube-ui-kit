import { useDOMRef } from '@react-spectrum/utils';
import { forwardRef } from 'react';
import { AriaRadioGroupProps, useRadioGroup } from 'react-aria';
import { useRadioGroupState } from 'react-stately';

import { useProviderProps } from '../../../provider';
import { FieldBaseProps } from '../../../shared';
import {
  BaseProps,
  BLOCK_STYLES,
  BlockStyleProps,
  extractStyles,
  OUTER_STYLES,
  OuterStyleProps,
  Styles,
  tasty,
} from '../../../tasty';
import { mergeProps } from '../../../utils/react';
import {
  castNullableStringValue,
  WithNullableValue,
} from '../../../utils/react/nullableValue';
import { CubeItemBaseProps } from '../../content/ItemBase/ItemBase';
import {
  FormContext,
  useFieldProps,
  useFormProps,
  wrapWithField,
} from '../../form';

import { RadioContext } from './context';

export interface CubeRadioGroupProps
  extends BaseProps,
    Omit<AriaRadioGroupProps, 'errorMessage'>,
    BlockStyleProps,
    OuterStyleProps,
    FieldBaseProps {
  groupStyles?: Styles;
  orientation?: 'horizontal' | 'vertical';
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /* Whether the radio group is invalid */
  isInvalid?: boolean;
  /* Size for all radio buttons in the group */
  size?: Omit<CubeItemBaseProps['size'], 'inline'>;
  /* Button type for all button-style radios (ignored in tabs mode). When set to 'primary', selected buttons use 'primary' and non-selected use 'secondary' */
  buttonType?: Exclude<CubeItemBaseProps['type'], 'secondary'>;
  /* Visual type for all radios in the group: radio (default), button, or tabs */
  type?: 'radio' | 'button' | 'tabs';
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
      'horizontal & tabs': 'row',
    },
    padding: {
      '': '0',
      tabs: '.5x',
    },
    radius: '1cr',
    fill: {
      '': '#clear',
      'tabs | disabled': '#light',
    },
    width: 'max-content',
    gap: {
      '': '1x',
      tabs: '.5x',
    },
    whiteSpace: 'nowrap',
    flexGrow: {
      '': 'initial',
      tabs: 1,
    },
  },
});

function RadioGroup(props: WithNullableValue<CubeRadioGroupProps>, ref) {
  props = castNullableStringValue(props);
  props = useProviderProps(props);
  props = useFormProps(props);
  props = useFieldProps(props, { defaultValidationTrigger: 'onChange' });

  let {
    isDisabled,
    isRequired,
    labelPosition = 'top',
    isInvalid,
    children,
    orientation,
    styles,
    groupStyles,
    insideForm,
    labelProps: baseLabelProps,
    size,
    buttonType,
    type,
    form,
    ...otherProps
  } = props;
  let domRef = useDOMRef(ref);

  styles = extractStyles(otherProps, OUTER_STYLES, styles);
  groupStyles = extractStyles(otherProps, BLOCK_STYLES, groupStyles);

  let state = useRadioGroupState(props);

  // Set default orientation based on type
  if (orientation == null) {
    orientation =
      type === 'button' || type === 'tabs' ? 'horizontal' : 'vertical';
  }

  let { radioGroupProps: fieldProps, labelProps } = useRadioGroup(props, state);

  let radioGroup = (
    <RadioGroupElement
      styles={groupStyles}
      mods={{
        horizontal: orientation === 'horizontal',
        'inside-form': insideForm,
        'side-label': labelPosition === 'side',
        tabs: type === 'tabs',
      }}
    >
      <FormContext.Provider
        value={{
          isRequired,
          isInvalid,
          isDisabled,
        }}
      >
        <RadioContext.Provider
          value={{
            state,
            name: props.name,
            size,
            buttonType,
            type,
            isDisabled,
          }}
        >
          {children}
        </RadioContext.Provider>
      </FormContext.Provider>
    </RadioGroupElement>
  );

  return wrapWithField(radioGroup, domRef, {
    ...props,
    children: null,
    fieldProps,
    labelProps: mergeProps(baseLabelProps, labelProps),
    styles,
  });
}

/**
 * Radio groups allow users to select a single option from a list of mutually exclusive options.
 * All possible options are exposed up front for users to compare.
 */
const _RadioGroup = forwardRef(RadioGroup);

(_RadioGroup as any).cubeInputType = 'RadioGroup';
_RadioGroup.displayName = 'RadioGroup';

export { _RadioGroup as RadioGroup };
