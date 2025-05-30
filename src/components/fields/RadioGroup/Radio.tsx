import { useFocusableRef } from '@react-spectrum/utils';
import { forwardRef, useMemo, useRef } from 'react';
import { useHover, useRadio } from 'react-aria';

import { useProviderProps } from '../../../provider';
import { FieldBaseProps } from '../../../shared';
import {
  BaseProps,
  extractStyles,
  filterBaseProps,
  OUTER_STYLES,
  OuterStyleProps,
  Styles,
  tasty,
} from '../../../tasty';
import { mergeProps } from '../../../utils/react';
import { useFocus } from '../../../utils/react/interactions';
import { INLINE_LABEL_STYLES, useFieldProps, useFormProps } from '../../form';
import { HiddenInput } from '../../HiddenInput';

import { useRadioProvider } from './context';
import { RadioGroup } from './RadioGroup';

import type { AriaRadioProps } from 'react-aria';

export { AriaRadioProps };
export { useRadio };

const RadioWrapperElement = tasty({
  as: 'label',
  qa: 'RadioWrapper',
  styles: {
    position: 'relative',
    display: 'grid',
    placeItems: {
      '': 'center start',
      button: 'stretch',
    },
    gap: '1x',
    flow: 'column',
    preset: 'default',
    width: 'min-content',
    margin: {
      '': '1x right',
      button: '0',
    },
    zIndex: {
      '': 'initial',
      checked: 1,
    },
    flexGrow: 1,

    Input: {
      radius: {
        '': 'round',
        button: true,
        'button & solid': 0,
        'button & solid & :first-child': '1r 0 0 1r',
        'button & solid & :last-child': '0 1r 1r 0',
      },
      margin: {
        '': 'initial',
        'button & solid': '-1bw right',
        'button & solid & :last-child': 0,
      },
    },
  },
});

const RadioButtonElement = tasty({
  styles: {
    display: 'grid',
    flow: 'column',
    placeItems: 'center',
    gap: '.75x',
    fill: {
      '': '#white',
      hovered: '#purple-text.04',
      checked: '#white',
      disabled: '#light',
    },
    color: {
      '': '#dark.85',
      invalid: '#danger-text',
      checked: '#purple-text',
      disabled: '#dark-04',
      'disabled & checked': '#dark-02',
    },
    preset: 't3m',
    border: {
      '': '#dark-05',
      checked: '#purple',
      'invalid & checked': '#danger-text',
      disabled: '#dark-05',
      'disabled & checked': '#dark-03',
    },
    padding: '(.75x - 1bw) (1.25x - 1bw)',
    cursor: 'pointer',
    opacity: {
      '': 1,
      disabled: 0.5,
    },
    outline: {
      '': '#purple-text.0',
      focused: '1bw #purple-text',
    },
    outlineOffset: 1,
    transition: 'theme',
    whiteSpace: 'nowrap',
  },
});

const RadioNormalElement = tasty({
  styles: {
    display: 'grid',
    placeItems: 'center',
    radius: 'round',
    fill: {
      '': '#white',
      disabled: '#dark.04',
    },
    color: {
      checked: '#purple-text',
      'invalid & checked': '#danger-text',
      'disabled | !checked': '#clear',
      'disabled & checked': '#dark.12',
    },
    border: {
      '': '#dark-04',
      checked: '#purple-text',
      invalid: '#danger-text.50',
      disabled: '#dark.12',
    },
    width: '2x',
    height: '2x',
    outline: {
      '': '#purple-text.0',
      focused: '1bw #purple-text',
    },
    outlineOffset: 1,
    transition: 'theme',
    whiteSpace: 'nowrap',

    RadioCircle: {
      display: 'block',
      radius: 'round',
      width: '1x',
      height: '1x',
      fill: 'currentColor',
    },
  },
});

const RadioCircleElement = <div data-element="RadioCircle" />;

const RadioLabelElement = tasty({
  qa: 'RadioLabel',
  styles: INLINE_LABEL_STYLES,
});

export interface CubeRadioProps
  extends BaseProps,
    AriaRadioProps,
    FieldBaseProps,
    OuterStyleProps {
  inputStyles?: Styles;
  /* The visual type of the radio button */
  type?: 'button' | 'radio';
  value?: string;
}

function Radio(props: CubeRadioProps, ref) {
  props = useProviderProps(props);
  props = useFormProps(props);
  props = useFieldProps(props, { defaultValidationTrigger: 'onChange' });

  let {
    qa,
    isDisabled,
    validationState,
    children,
    label,
    autoFocus,
    labelStyles,
    labelProps,
    inputStyles,
    type = 'radio',
    'aria-label': ariaLabel,
    ...otherProps
  } = props;

  let isButton = type === 'button';

  label = label || children;

  let styles = extractStyles(otherProps, OUTER_STYLES);

  const RadioElement = isButton ? RadioButtonElement : RadioNormalElement;

  labelStyles = {
    ...INLINE_LABEL_STYLES,
    ...labelStyles,
  };

  let radioGroupProps = useRadioProvider();

  let state = radioGroupProps && radioGroupProps.state;
  let name = radioGroupProps && radioGroupProps.name;
  let isSolid = (radioGroupProps && radioGroupProps.isSolid) || false;

  if (!state) {
    throw new Error('CubeUI: The Radio button is used outside the RadioGroup.');
  }

  let { isFocused, focusProps } = useFocus({ isDisabled }, true);
  let { hoverProps, isHovered } = useHover({ isDisabled });

  let inputRef = useRef(null);
  let domRef = useFocusableRef(ref, inputRef);

  let {
    inputProps,
    isDisabled: isRadioDisabled,
    isSelected: isRadioSelected,
  } = useRadio(
    {
      name,
      ...props,
      isDisabled,
    },
    state,
    inputRef,
  );

  const mods = useMemo(
    () => ({
      checked: isRadioSelected,
      invalid: validationState === 'invalid',
      valid: validationState === 'valid',
      disabled: isRadioDisabled,
      hovered: isHovered,
      button: isButton,
      focused: isFocused,
      solid: isSolid,
    }),
    [
      isRadioSelected,
      validationState,
      isRadioDisabled,
      isHovered,
      isButton,
      isFocused,
      isSolid,
    ],
  );

  return (
    <RadioWrapperElement
      styles={styles}
      {...hoverProps}
      ref={domRef}
      mods={mods}
      data-type={type}
    >
      <HiddenInput
        data-qa={qa || 'Radio'}
        aria-label={ariaLabel}
        {...mergeProps(inputProps, focusProps)}
        ref={inputRef}
        $isButton={isButton}
      />
      <RadioElement
        data-element="Input"
        mods={mods}
        data-type={type}
        styles={inputStyles}
      >
        {!isButton ? RadioCircleElement : children}
      </RadioElement>
      {label && !isButton && (
        <RadioLabelElement
          mods={mods}
          styles={labelStyles}
          {...filterBaseProps(labelProps)}
        >
          {label}
        </RadioLabelElement>
      )}
    </RadioWrapperElement>
  );
}

function RadioButton(props: CubeRadioProps, ref) {
  const Radio = _Radio;

  return <Radio {...props} ref={ref} type="button" />;
}

/**
 * Radio buttons allow users to select a single option from a list of mutually exclusive options.
 * All possible options are exposed up front for users to compare.
 */
const _Radio = forwardRef(Radio);
/**
 * Radio buttons allow users to select a single option from a list of mutually exclusive options.
 * All possible options are exposed up front for users to compare.
 */
const _RadioButton = forwardRef(RadioButton);

const ButtonGroup = tasty(RadioGroup, {
  isSolid: true,
});

const __Radio = Object.assign(
  _Radio as typeof _Radio & {
    Group: typeof RadioGroup;
    Button: typeof _RadioButton;
    ButtonGroup: typeof ButtonGroup;
  },
  {
    Group: RadioGroup,
    Button: _RadioButton,
    ButtonGroup,
  },
);

__Radio.displayName = 'Radio';

export { __Radio as Radio };

_RadioButton.displayName = 'RadioButton';

export { _RadioButton as RadioButton };
