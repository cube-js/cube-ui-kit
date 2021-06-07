import { useFocusableRef } from '@react-spectrum/utils';
import React, { forwardRef, useContext, useRef } from 'react';
import { useCheckbox, useCheckboxGroupItem } from '@react-aria/checkbox';
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
import { INLINE_LABEL_STYLES } from '../../components/Label';
import { HiddenInput } from '../../components/HiddenInput';

const CheckOutlined = () => (
  <svg width="10" height="8" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3.417 7.604l-.017.018-3.4-3.4 1.433-1.433 1.985 1.985L8.192 0l1.432 1.433-6.189 6.189-.018-.018z"
      fill="currentColor"
    />
  </svg>
);
const IndeterminateOutline = () => (
  <svg width="9" height="3" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 .044v2.001l.026.025h8.063V.044H0z" fill="#fff" />
  </svg>
);

export const CheckboxGroupContext = React.createContext(null);

const STYLES = {
  position: 'relative',
  display: 'flex',
  items: 'center start',
  gap: '1x',
  flow: 'row',
  size: 'input',
};

const INPUT_STYLES = {
  display: 'grid',
  items: 'center',
  radius: '.5r',
  fill: {
    '': '#white',
    'checked | indeterminate': '#purple-text',
    'invalid & !checked': '#white',
    'invalid & checked': '#danger-text',
    disabled: '#dark.12',
  },
  color: {
    '': '#white',
    'disabled & !checked & !indeterminate': '#clear',
  },
  border: {
    '': '#dark.30',
    invalid: '#danger-text.50',
    'disabled | ((indeterminate | checked) & !invalid)': '#clear',
  },
  width: '(2x - 2bw)',
  height: '(2x - 2bw)',
  outline: {
    '': '#purple-03.0',
    focused: '#purple-03',
  },
  transition: 'theme',
};

function Checkbox(props, ref) {
  let originalProps = props;

  props = useProviderProps(props);

  let {
    isIndeterminate = false,
    isEmphasized = false,
    isDisabled = false,
    autoFocus,
    children,
    label,
    validationState,
    labelProps,
    labelStyles,
    ...otherProps
  } = props;

  label = label || children;

  let wrapperContextStyles = useContextStyles('Checkbox_Wrapper', props);
  let inputContextStyles = useContextStyles('Checkbox', props);
  let labelContextStyles = useContextStyles('Checkbox_Label', props);

  let styles = extractStyles(props, OUTER_STYLES, {
    ...STYLES,
    ...wrapperContextStyles,
  });
  let inputStyles = extractStyles(props, BLOCK_STYLES, {
    ...INPUT_STYLES,
    ...inputContextStyles,
  });

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

  // Swap hooks depending on whether this checkbox is inside a CheckboxGroup.
  // This is a bit unorthodox. Typically, hooks cannot be called in a conditional,
  // but since the checkbox won't move in and out of a group, it should be safe.
  let groupState = useContext(CheckboxGroupContext);

  let { inputProps } = groupState
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useCheckboxGroupItem(
        {
          ...props,
          // Value is optional for standalone checkboxes, but required for CheckboxGroup items;
          // it's passed explicitly here to avoid typescript error (requires strictNullChecks disabled).
          value: props.value,
          // Only pass isRequired and validationState to react-aria if they came from
          // the props for this individual checkbox, and not from the group via context.
          isRequired: originalProps.isRequired,
          validationState: originalProps.validationState,
        },
        groupState,
        inputRef,
      )
    : // eslint-disable-next-line react-hooks/rules-of-hooks
      useCheckbox(props, useToggleState(props), inputRef);

  let markIcon = isIndeterminate ? <IndeterminateOutline /> : <CheckOutlined />;

  if (groupState) {
    for (let key of ['isSelected', 'defaultSelected', 'isEmphasized']) {
      if (originalProps[key] != null) {
        console.warn(
          `${key} is unsupported on individual <Checkbox> elements within a <CheckboxGroup>. Please apply these props to the group instead.`,
        );
      }
    }
    if (props.value == null) {
      console.warn(
        'A <Checkbox> element within a <CheckboxGroup> requires a `value` property.',
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
        data-qa="Checkbox"
        {...mergeProps(inputProps, focusProps)}
        ref={inputRef}
      />
      <Base
        {...modAttrs({
          checked: inputProps.checked,
          indeterminate: isIndeterminate,
          quite: !isEmphasized,
          invalid: validationState === 'invalid',
          valid: validationState === 'valid',
          disabled: isDisabled,
          hovered: isHovered,
          focused: isFocused,
        })}
        styles={inputStyles}
      >
        {markIcon}
      </Base>
      {label && (
        <Base
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
 * Checkboxes allow users to select multiple items from a list of individual items,
 * or to mark one individual item as selected.
 */
let _Checkbox = forwardRef(Checkbox);
export { _Checkbox as Checkbox };
