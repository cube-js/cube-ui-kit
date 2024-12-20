import { useFocusableRef } from '@react-spectrum/utils';
import { forwardRef, useContext, useMemo, useRef } from 'react';
import {
  useCheckbox,
  useCheckboxGroupItem,
  useHover,
  AriaCheckboxProps,
} from 'react-aria';
import { useToggleState } from 'react-stately';

import { useProviderProps } from '../../../provider';
import {
  BaseProps,
  BLOCK_STYLES,
  Element,
  extractStyles,
  filterBaseProps,
  OUTER_STYLES,
  Styles,
  tasty,
} from '../../../tasty';
import { useFocus } from '../../../utils/react/interactions';
import { mergeProps } from '../../../utils/react';
import { HiddenInput } from '../../HiddenInput';
import {
  useFieldProps,
  useFormProps,
  INLINE_LABEL_STYLES,
  LABEL_STYLES,
} from '../../form';
import { FieldBaseProps } from '../../../shared';
import {
  castNullableIsSelected,
  WithNullableSelected,
} from '../../../utils/react/nullableValue';
import { Text } from '../../content/Text';
import { wrapWithField } from '../../form';

import { CheckboxGroup } from './CheckboxGroup';
import { CheckboxGroupContext } from './context';

import type { FocusableRef } from '@react-types/shared';

export interface CubeCheckboxProps
  extends BaseProps,
    AriaCheckboxProps,
    FieldBaseProps {
  inputStyles?: Styles;
  isIndeterminate?: boolean;
  value?: string;
}

function CheckOutlined() {
  return (
    <svg width="10" height="8" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3.417 7.604l-.017.018-3.4-3.4 1.433-1.433 1.985 1.985L8.192 0l1.432 1.433-6.189 6.189-.018-.018z"
        fill="currentColor"
      />
    </svg>
  );
}
function IndeterminateOutline() {
  return (
    <svg width="8" height="2" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 .044v2.001l.026.025h8.063V.044H0z" fill="#fff" />
    </svg>
  );
}

const CheckboxWrapperElement = tasty({
  as: 'label',
  qa: 'CheckboxWrapper',
  styles: {
    position: 'relative',
    display: 'flex',
    placeItems: 'center start',
    placeContent: 'baseline',
    gap: '1x',
    flow: 'row',
    preset: 'default',
    cursor: 'pointer',
    width: 'max max-content',
  },
});

const CheckboxElement = tasty({
  qa: 'Checkbox',
  styles: {
    display: 'grid',
    placeItems: 'center',
    radius: '.25x',
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
  },
});

function Checkbox(
  props: WithNullableSelected<CubeCheckboxProps>,
  ref: FocusableRef,
) {
  // Swap hooks depending on whether this checkbox is inside a CheckboxGroup.
  // This is a bit unorthodox. Typically, hooks cannot be called in a conditional,
  // but since the checkbox won't move in and out of a group, it should be safe.
  let groupState = useContext(CheckboxGroupContext);

  props = castNullableIsSelected(props);

  let originalProps = props;

  props = useProviderProps(props);
  props = useFormProps(props);
  props = useFieldProps(props, {
    defaultValidationTrigger: 'onChange',
    valuePropsMapper: ({ value, onChange }) => ({
      isSelected: value ?? false,
      isIndeterminate: false,
      onChange: onChange,
    }),
    unsafe__isDisabled: !!groupState,
  });

  let {
    qa,
    isIndeterminate = false,
    isDisabled = false,
    insideForm,
    isRequired,
    children,
    label,
    validationState,
    labelProps,
    labelStyles,
    labelPosition,
    inputStyles,
    isHidden,
    ...otherProps
  } = props;

  let styles: Styles = extractStyles(props, OUTER_STYLES);

  inputStyles = extractStyles(props, BLOCK_STYLES, inputStyles);

  labelStyles = useMemo(
    () => ({
      ...(insideForm ? LABEL_STYLES : INLINE_LABEL_STYLES),
      ...labelStyles,
    }),
    [insideForm, labelStyles],
  );

  let { isFocused, focusProps } = useFocus({ isDisabled }, true);
  let { hoverProps, isHovered } = useHover({ isDisabled });

  let inputRef = useRef(null);
  let domRef = useFocusableRef(ref, inputRef);

  const toggleState = useToggleState(props);

  let { inputProps } = groupState // eslint-disable-next-line react-hooks/rules-of-hooks
    ? useCheckboxGroupItem(
        {
          ...props,
          // Value is optional for standalone checkboxes, but required for CheckboxGroup items;
          // it's passed explicitly here to avoid typescript error (requires strictNullChecks disabled).
          value: props.value || '',
          // Only pass isRequired and validationState to react-aria if they came from
          // the props for this individual checkbox, and not from the group via context.
          isRequired: originalProps.isRequired,
          validationState: originalProps.validationState,
        },
        groupState,
        inputRef,
      ) // eslint-disable-next-line react-hooks/rules-of-hooks
    : useCheckbox(
        {
          ...props,
          ...(typeof label === 'string' && label.trim()
            ? { 'aria-label': label }
            : {}),
        },
        toggleState,
        inputRef,
      );

  let markIcon = isIndeterminate ? <IndeterminateOutline /> : <CheckOutlined />;

  if (groupState) {
    for (let key of ['isSelected', 'defaultSelected', 'isEmphasized']) {
      if (originalProps[key] != null) {
        console.warn(
          `CubeUIKit: ${key} is unsupported on individual <Checkbox> elements within a <CheckboxGroup>. Please apply these props to the group instead.`,
        );
      }
    }
    if (props.value == null) {
      console.warn(
        'CubeUIKit: A <Checkbox> element within a <CheckboxGroup> requires a `value` property.',
      );
    }
  }

  const mods = {
    checked: inputProps.checked,
    indeterminate: isIndeterminate,
    invalid: validationState === 'invalid',
    valid: validationState === 'valid',
    disabled: isDisabled,
    hovered: isHovered,
    focused: isFocused,
    'side-label': labelPosition === 'side',
    'inside-form': insideForm,
  };

  const checkboxField = (
    <CheckboxWrapperElement
      isHidden={isHidden}
      mods={mods}
      styles={{ position: 'relative' }}
    >
      <HiddenInput
        data-qa="HiddenInput"
        {...mergeProps(inputProps, focusProps)}
        ref={inputRef}
      />
      <CheckboxElement qa={qa || 'Checkbox'} mods={mods} styles={inputStyles}>
        {markIcon}
      </CheckboxElement>
      {children && <Text nowrap>{children}</Text>}
    </CheckboxWrapperElement>
  );

  if (insideForm && !groupState) {
    return wrapWithField(checkboxField, domRef, {
      ...props,
      children: null,
      labelStyles,
      inputStyles,
      styles,
    });
  }

  return (
    <CheckboxWrapperElement
      as="label"
      styles={styles}
      isHidden={isHidden}
      {...hoverProps}
      {...filterBaseProps(otherProps)}
      ref={domRef}
    >
      {checkboxField}
      {label ? (
        <Element
          styles={labelStyles}
          mods={{
            invalid: validationState === 'invalid',
            valid: validationState === 'valid',
            disabled: isDisabled,
          }}
          {...filterBaseProps(labelProps)}
        >
          {label}
        </Element>
      ) : null}
    </CheckboxWrapperElement>
  );
}

/**
 * Checkboxes allow users to select multiple items from a list of individual items,
 * or to mark one individual item as selected.
 */
let _Checkbox = forwardRef(Checkbox);

(_Checkbox as any).cubeInputType = 'Checkbox';
let __Checkbox = Object.assign(
  _Checkbox as typeof _Checkbox & { Group: typeof CheckboxGroup },
  { Group: CheckboxGroup },
);

export { __Checkbox as Checkbox };
export type { AriaCheckboxProps };
export { useCheckbox };
