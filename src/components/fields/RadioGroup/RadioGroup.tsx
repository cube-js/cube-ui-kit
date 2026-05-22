import { useDOMRef } from '@react-spectrum/utils';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  Styles,
  tasty,
} from '@tenphi/tasty';
import { forwardRef } from 'react';
import { AriaRadioGroupProps, useFocusRing, useRadioGroup } from 'react-aria';
import { useRadioGroupState } from 'react-stately';

import { useProviderProps } from '../../../provider';
import { FieldBaseProps } from '../../../shared';
import { mergeProps } from '../../../utils/react';
import {
  castNullableStringValue,
  WithNullableValue,
} from '../../../utils/react/nullableValue';
import { extractStyles } from '../../../utils/styles';
import { CubeItemProps } from '../../content/Item/Item';
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
    ContainerStyleProps,
    FieldBaseProps {
  groupStyles?: Styles;
  orientation?: 'horizontal' | 'vertical';
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /* Whether the radio group is invalid */
  isInvalid?: boolean;
  /* Size for all radio buttons in the group */
  size?: Omit<CubeItemProps['size'], 'inline'>;
  /* Button type for all button-style radios (ignored in tabs mode). When set to 'primary', selected buttons use 'primary' and non-selected use 'outline' with isSelected appearance */
  buttonType?: CubeItemProps['type'];
  /* Visual type for all radios in the group: radio (default), button, or tabs */
  type?: 'radio' | 'button' | 'tabs';
}

const RadioGroupElement = tasty({
  qa: 'RadioGroup',
  styles: {
    display: 'flex',
    placeItems: 'stretch',
    placeContent: 'stretch',
    flow: {
      '': 'column',
      horizontal: 'row wrap',
      'horizontal & tabs': 'row',
    },
    padding: {
      '': '0',
      tabs: '.5x',
    },
    radius: true,
    fill: {
      '': '#clear',
      'tabs | disabled': '#surface-4',
    },
    width: 'max-content max-content initial',
    flexShrink: 0,
    gap: {
      '': '1x',
      button: 0,
      tabs: '.5x',
    },
    whiteSpace: 'nowrap',
    // Keyboard focus ring on the group, shown only for button/tabs layouts
    // where individual items are visually merged (button-group) or share a
    // single chrome (tabs) — the classic vertical radio list already shows
    // a per-item focus ring on the radio circle.
    outline: {
      '': '1bw #primary-text.0 / 1bw',
      'focused & (button | tabs)': '1bw #primary-text / 1bw',
    },
  },
});

function RadioGroup(props: WithNullableValue<CubeRadioGroupProps>, ref) {
  let orientation = props.orientation;

  props = castNullableStringValue(props);
  props = useProviderProps(props);
  props = useFormProps(props);
  props = useFieldProps(props, { defaultValidationTrigger: 'onChange' });

  let {
    qa,
    id,
    isDisabled,
    isRequired,
    labelPosition = 'top',
    isInvalid,
    children,
    styles,
    groupStyles,
    insideForm,
    // orientation, // ignore orientation since it came from the form context
    labelProps: baseLabelProps,
    size,
    buttonType,
    type,
    form,
    ...otherProps
  } = props;
  let domRef = useDOMRef(ref);

  styles = extractStyles(otherProps, CONTAINER_STYLES, styles);

  let state = useRadioGroupState(props);

  // Set default orientation based on type
  if (orientation == null) {
    orientation =
      type === 'button' || type === 'tabs' ? 'horizontal' : 'vertical';
  }

  let { radioGroupProps: fieldProps, labelProps } = useRadioGroup(
    { ...props, orientation },
    state,
  );

  // Keyboard-only focus ring on the group container (button/tabs layouts).
  // `within: true` tracks focus on any descendant radio. We read
  // `isFocusVisible` (not `isFocused`), which is keyboard-gated — mouse
  // clicks on a radio focus the input but leave `isFocusVisible` false.
  let { isFocusVisible: isFocusWithinVisible, focusProps: groupFocusProps } =
    useFocusRing({ within: true });

  let radioGroup = (
    <RadioGroupElement
      id={id}
      qa={qa || 'RadioGroup'}
      styles={styles}
      data-input-type="radiogroup"
      data-radio-button-group={type === 'button' ? '' : undefined}
      mods={{
        horizontal: orientation === 'horizontal',
        'inside-form': insideForm,
        'side-label': labelPosition === 'side',
        button: type === 'button',
        tabs: type === 'tabs',
        focused: isFocusWithinVisible,
      }}
      {...groupFocusProps}
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
