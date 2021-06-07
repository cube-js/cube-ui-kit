import { useFocusableRef } from '@react-spectrum/utils';
import React, { forwardRef, useRef } from 'react';
import { useHover } from '@react-aria/interactions';
import { useRadio } from '@react-aria/radio';
import { useRadioProvider } from './context';
import { extractStyles } from '../../utils/styles';
import { useContextStyles } from '../../providers/Styles';
import { BLOCK_STYLES, OUTER_STYLES } from '../../styles/list';
import { Base } from '../../components/Base';
import { modAttrs } from '../../utils/react/modAttrs';
import { filterBaseProps } from '../../utils/filterBaseProps';
import { useFocus } from '../../utils/interactions';
import { mergeProps } from '@react-aria/utils';
import { useProviderProps } from '../../provider';
import { INLINE_LABEL_STYLES } from '../../components/Label';
import { HiddenInput } from '../../components/HiddenInput';
import { RadioGroup } from './RadioGroup';

const STYLES = {
  position: 'relative',
  display: 'flex',
  items: 'center start',
  gap: '1x',
  flow: 'row',
  size: 'input',
  width: 'min-content',
};

const INPUT_STYLES = {
  display: 'grid',
  items: 'center',
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
  width: '(2x - 2bw)',
  height: '(2x - 2bw)',
  outline: {
    '': '#purple-03.0',
    focused: '#purple-03',
  },
  transition: 'theme',
};

const CIRCLE_STYLES = {
  radius: 'round',
  width: '1x',
  height: '1x',
  fill: 'currentColor',
  transition: 'theme',
};

function Radio(props, ref) {
  props = useProviderProps(props);

  let {
    isEmphasized,
    isDisabled,
    validationState,
    children,
    label,
    autoFocus,
    labelStyles,
    labelProps,
    ...otherProps
  } = props;

  label = label || children;

  let wrapperContextStyles = useContextStyles('Radio_Wrapper', props);
  let inputContextStyles = useContextStyles('Radio', props);
  let labelContextStyles = useContextStyles('Radio_Label', props);

  let styles = extractStyles(otherProps, OUTER_STYLES, {
    ...STYLES,
    ...wrapperContextStyles,
  });
  let inputStyles = extractStyles(otherProps, BLOCK_STYLES, {
    ...INPUT_STYLES,
    ...inputContextStyles,
  });

  labelStyles = {
    ...INLINE_LABEL_STYLES,
    fontWeight: 400,
    ...labelContextStyles,
    ...labelStyles,
  };

  let radioGroupProps = useRadioProvider();
  let { state } = radioGroupProps;

  let { isFocused, focusProps } = useFocus({ isDisabled, as: 'input' }, true);
  let { hoverProps, isHovered } = useHover({ isDisabled });

  let inputRef = useRef(null);
  let domRef = useFocusableRef(ref, inputRef);

  let { inputProps } = useRadio(
    {
      ...props,
      ...radioGroupProps,
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
      {...modAttrs({
        quite: !isEmphasized,
        disabled: isDisabled,
        invalid: validationState === 'invalid',
        hovered: isHovered,
      })}
    >
      <HiddenInput
        data-qa="Checkbox"
        {...mergeProps(inputProps, focusProps)}
        ref={inputRef}
      />
      <Base
        {...modAttrs({
          checked: inputProps.checked,
          quite: !isEmphasized,
          invalid: validationState === 'invalid',
          valid: validationState === 'valid',
          disabled: isDisabled,
          hovered: isHovered,
          focused: isFocused,
        })}
        styles={inputStyles}
      >
        <Base
          styles={CIRCLE_STYLES}
          {...modAttrs({
            checked: inputProps.checked,
            invalid: validationState === 'invalid',
            valid: validationState === 'valid',
          })}
        />
      </Base>
      {label && (
        <Base
          qa="RadioLabel"
          styles={labelStyles}
          {...modAttrs({
            quite: !isEmphasized,
            invalid: validationState === 'invalid',
            valid: validationState === 'valid',
            disabled: isDisabled,
          })}
          {...filterBaseProps(labelProps)}
        >
          {label}
        </Base>
      )}
    </Base>
  );
}

/**
 * Radio buttons allow users to select a single option from a list of mutually exclusive options.
 * All possible options are exposed up front for users to compare.
 */
const _Radio = forwardRef(Radio);
_Radio.Group = RadioGroup;
export { _Radio as Radio };
