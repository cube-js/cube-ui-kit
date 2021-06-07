import { useFocusableRef } from '@react-spectrum/utils';
import React, { forwardRef, useContext, useRef } from 'react';
import { useSwitch } from '@react-aria/switch';
import { useHover } from '@react-aria/interactions';
import { useToggleState } from '@react-stately/toggle';
import { useProviderProps } from '../../provider';
import { BLOCK_STYLES, OUTER_STYLES } from '../../styles/list';
import { extractStyles } from '../../utils/styles';
import { Base } from '../../components/Base';
import { modAttrs } from '../../utils/react/modAttrs';
import { useFocus } from '../../utils/interactions';
import { mergeProps } from '@react-aria/utils';
import { filterBaseProps } from '../../utils/filterBaseProps';
import { useContextStyles } from '../../providers/Styles';
import { HiddenInput } from '../../components/HiddenInput';
import { INLINE_LABEL_STYLES } from '../../components/Label';

export const SwitchGroupContext = React.createContext(null);

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
  position: 'relative',
  display: 'grid',
  items: 'center',
  radius: 'round',
  fill: {
    '': '#dark.50',
    checked: '#purple',
    disabled: '#dark.12',
  },
  color: '#white',
  border: false,
  width: '5.25x 5.25x',
  height: '3x 3x',
  outline: {
    '': '#purple-03.0',
    focused: '#purple-03',
  },
  transition: 'theme',
};

const THUMB_STYLES = {
  position: 'absolute',
  width: '2.5x',
  height: '2.5x',
  radius: 'round',
  fill: 'currentColor',
  shadow: '0px 2px 4px #dark.20;',
  top: '.25x',
  left: {
    '': '.25x',
    checked: '2.5x',
  },
  transition: 'place',
};

function Switch(props, ref) {
  let originalProps = props;

  props = useProviderProps(props);

  let {
    isEmphasized = false,
    isDisabled = false,
    autoFocus,
    children,
    label,
    labelProps,
    labelStyles,
    thumbStyles,
    ...otherProps
  } = props;

  label = label || children;

  let wrapperContextStyles = useContextStyles('Switch_Wrapper', props);
  let inputContextStyles = useContextStyles('Switch', props);
  let labelContextStyles = useContextStyles('Switch_Label', props);
  let thumbContextStyles = useContextStyles('Switch_Thumb', props);

  let styles = extractStyles(props, OUTER_STYLES, {
    ...STYLES,
    ...wrapperContextStyles,
  });
  let inputStyles = extractStyles(props, BLOCK_STYLES, {
    ...INPUT_STYLES,
    ...inputContextStyles,
  });

  thumbStyles = {
    ...THUMB_STYLES,
    ...thumbContextStyles,
    ...thumbStyles,
  };

  labelStyles = {
    ...INLINE_LABEL_STYLES,
    fontWeight: 400,
    ...labelContextStyles,
    ...labelStyles,
  };

  let { isFocused, focusProps } = useFocus({ isDisabled, as: 'input' }, true);
  let { hoverProps, isHovered } = useHover({ isDisabled });

  let inputRef = useRef(null);
  let domRef = useFocusableRef(ref, inputRef);

  // Swap hooks depending on whether this checkbox is inside a SwitchGroup.
  // This is a bit unorthodox. Typically, hooks cannot be called in a conditional,
  // but since the checkbox won't move in and out of a group, it should be safe.
  let groupState = useContext(SwitchGroupContext);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  let { inputProps } = useSwitch(props, useToggleState(props), inputRef);

  if (groupState) {
    for (let key of ['isSelected', 'defaultSelected', 'isEmphasized']) {
      if (originalProps[key] != null) {
        console.warn(
          `${key} is unsupported on individual <Switch> elements within a <SwitchGroup>. Please apply these props to the group instead.`,
        );
      }
    }
    if (props.value == null) {
      console.warn(
        'A <Switch> element within a <SwitchGroup> requires a `value` property.',
      );
    }
  }

  return (
    <Base
      as="label"
      styles={styles}
      {...hoverProps}
      {...filterBaseProps(otherProps)}
      ref={domRef}
    >
      <HiddenInput
        data-qa="Switch"
        {...mergeProps(inputProps, focusProps)}
        ref={inputRef}
      />
      <Base
        {...modAttrs({
          checked: inputProps.checked,
          quite: !isEmphasized,
          disabled: isDisabled,
          hovered: isHovered,
          focused: isFocused,
        })}
        styles={inputStyles}
      >
        <Base
          qa="SwitchThumb"
          styles={thumbStyles}
          aria-hidden="true"
          {...modAttrs({
            checked: inputProps.checked,
          })}
        />
      </Base>
      {label && (
        <Base
          styles={labelStyles}
          {...modAttrs({
            quite: !isEmphasized,
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
 * Switches allow users to turn an individual option on or off.
 * They are usually used to activate or deactivate a specific setting.
 */
let _Switch = forwardRef(Switch);
export { _Switch as Switch };
