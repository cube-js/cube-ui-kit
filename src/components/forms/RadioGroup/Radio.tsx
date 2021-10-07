import { useFocusableRef } from '@react-spectrum/utils';
import { forwardRef, useRef } from 'react';
import { useHover } from '@react-aria/interactions';
import { useRadio } from '@react-aria/radio';
import { useRadioProvider } from './context';
import { extractStyles } from '../../../utils/styles';
import { useContextStyles } from '../../../providers/StylesProvider';
import { BLOCK_STYLES, OUTER_STYLES } from '../../../styles/list';
import { Base } from '../../Base';
import { filterBaseProps } from '../../../utils/filterBaseProps';
import { useFocus } from '../../../utils/interactions';
import { mergeProps } from '@react-aria/utils';
import { useProviderProps } from '../../../provider';
import { INLINE_LABEL_STYLES } from '../Label';
import { HiddenInput } from '../../HiddenInput';
import { RadioGroup } from './RadioGroup';
import { useFormProps } from '../Form/Form';
import { Styles } from '../../../styles/types';
import { BaseProps } from '../../types';
import { AriaRadioProps } from '@react-types/radio';
import { FormFieldProps } from '../../../shared';

const STYLES: Styles = {
  position: 'relative',
  display: 'grid',
  placeItems: 'center start',
  gap: '1x',
  flow: 'column',
  preset: 'default',
  width: 'min-content',
};

const BUTTON_STYLES: Styles = {
  radius: true,
  fill: {
    '': '#white',
    hovered: '#purple-text.04',
    disabled: '#dark.04',
  },
  color: {
    '': '#dark.85',
    invalid: '#danger-text',
    disabled: '#dark.40',
  },
  fontWeight: 500,
  preset: 'default',
  border: {
    '': true,
    checked: '#purple-text',
    'invalid & checked': '#danger-text',
    'disabled & checked': '#dark.40',
    disabled: '#border',
  },
  padding: '(1x - 1bw) (1.5x - 1bw)',
  cursor: 'pointer',
  opacity: {
    '': 1,
    disabled: 0.5,
  },
  outline: {
    '': '#purple-03.0',
    focused: '#purple-03',
  },
};

const INPUT_STYLES: Styles = {
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
    '': '#dark.30',
    checked: '#purple-text',
    invalid: '#danger-text.50',
    disabled: '#dark.12',
  },
  width: '2x',
  height: '2x',
  outline: {
    '': '#purple-03.0',
    focused: '#purple-03',
  },
  transition: 'theme',
};

const CIRCLE_STYLES: Styles = {
  radius: 'round',
  width: '1x',
  height: '1x',
  fill: 'currentColor',
  transition: 'theme',
};

export interface CubeRadioProps
  extends BaseProps,
    AriaRadioProps,
    FormFieldProps {
  inputStyles?: Styles;
  /* The visual type of the radio button */
  type?: 'button' | 'radio';
}

function Radio(props: CubeRadioProps, ref) {
  props = useProviderProps(props);
  props = useFormProps(props);

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
    type,
    'aria-label': ariaLabel,
    ...otherProps
  } = props;

  let isButton = type === 'button';

  label = label || children;

  let styles = extractStyles(otherProps, OUTER_STYLES, {
    ...STYLES,
    ...useContextStyles('Radio_Wrapper', props),
  });

  inputStyles = extractStyles(otherProps, BLOCK_STYLES, {
    ...(isButton ? BUTTON_STYLES : INPUT_STYLES),
    ...useContextStyles(isButton ? 'RadioButton' : 'Radio', props),
    ...inputStyles,
  });

  labelStyles = {
    ...INLINE_LABEL_STYLES,
    fontWeight: 400,
    ...useContextStyles('Radio_Label', props),
    ...labelStyles,
  };

  let state = useRadioProvider();

  if (!state) {
    throw new Error('CubeUI: The Radio button is used outside the RadioGroup.');
  }

  let { isFocused, focusProps } = useFocus({ isDisabled }, true);
  let { hoverProps, isHovered } = useHover({ isDisabled });

  let inputRef = useRef(null);
  let domRef = useFocusableRef(ref, inputRef);

  let { inputProps } = useRadio(
    {
      ...props,
      isDisabled,
    },
    state,
    inputRef,
  );

  return (
    <Base
      as="label"
      styles={styles}
      {...hoverProps}
      ref={domRef}
      mods={{
        disabled: isDisabled,
        invalid: validationState === 'invalid',
        hovered: isHovered,
        button: isButton,
      }}
    >
      <HiddenInput
        data-qa={qa || 'Radio'}
        aria-label={ariaLabel}
        {...mergeProps(inputProps, focusProps)}
        isButton={isButton}
        ref={inputRef}
      />
      <Base
        mods={{
          checked: inputProps.checked,
          invalid: validationState === 'invalid',
          valid: validationState === 'valid',
          disabled: isDisabled,
          hovered: isHovered,
          focused: isFocused,
        }}
        styles={inputStyles}
      >
        {!isButton ? (
          <Base
            styles={CIRCLE_STYLES}
            mods={{
              checked: inputProps.checked,
              invalid: validationState === 'invalid',
              valid: validationState === 'valid',
            }}
          />
        ) : (
          children
        )}
      </Base>
      {label && !isButton && (
        <Base
          qa="RadioLabel"
          styles={labelStyles}
          mods={{
            invalid: validationState === 'invalid',
            valid: validationState === 'valid',
            disabled: isDisabled,
          }}
          {...filterBaseProps(labelProps)}
        >
          {label}
        </Base>
      )}
    </Base>
  );
}

function RadioButton(props: CubeRadioProps, ref) {
  const Radio = _Radio;

  return <Radio {...props} type="button" ref={ref} />;
}

/**
 * Radio buttons allow users to select a single option from a list of mutually exclusive options.
 * All possible options are exposed up front for users to compare.
 */
const _Radio = Object.assign(forwardRef(Radio), {
  Group: RadioGroup,
  Button: forwardRef(RadioButton),
});
export { _Radio as Radio };
export { RadioButton };
