import { useFocusableRef } from '@react-spectrum/utils';
import { IconCheck, IconMinus } from '@tabler/icons-react';
import { forwardRef, useContext, useMemo, useRef } from 'react';
import {
  AriaCheckboxProps,
  useCheckbox,
  useCheckboxGroupItem,
  useHover,
} from 'react-aria';
import { useToggleState } from 'react-stately';

import { Icon } from '../../../icons/index';
import { useProviderProps } from '../../../provider';
import { FieldBaseProps } from '../../../shared';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  Element,
  extractStyles,
  filterBaseProps,
  Styles,
  tasty,
} from '../../../tasty';
import { mergeProps } from '../../../utils/react';
import { useFocus } from '../../../utils/react/interactions';
import {
  castNullableIsSelected,
  WithNullableSelected,
} from '../../../utils/react/nullableValue';
import { Text } from '../../content/Text';
import {
  INLINE_LABEL_STYLES,
  LABEL_STYLES,
  useFieldProps,
  useFormProps,
  wrapWithField,
} from '../../form';
import { HiddenInput } from '../../HiddenInput';

import { CheckboxGroup } from './CheckboxGroup';
import { CheckboxGroupContext } from './context';

import type { FocusableRef } from '@react-types/shared';

export interface CubeCheckboxProps
  extends BaseProps,
    ContainerStyleProps,
    AriaCheckboxProps,
    FieldBaseProps {
  inputStyles?: Styles;
  isIndeterminate?: boolean;
  value?: string;
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
    cursor: '$pointer',
    width: 'max max-content',
    color: '#dark-02',
  },
});

const CheckboxElement = tasty({
  qa: 'Checkbox',
  styles: {
    display: 'grid',
    placeItems: 'center',
    radius: '.5r',
    fill: {
      '': '#white',
      'checked | indeterminate': '#purple',
      'invalid & !checked': '#white',
      'invalid & checked': '#danger',
      disabled: '#dark.12',
    },
    color: {
      '': '#white',
      'disabled & !checked & !indeterminate': '#clear',
    },
    border: {
      '': '#dark.30',
      invalid: '#danger',
      'disabled | ((indeterminate | checked) & !invalid)': '#clear',
    },
    width: '(2x - 2bw)',
    height: '(2x - 2bw)',
    outline: {
      '': '#purple-text.0',
      focused: '1bw #purple-text',
    },
    outlineOffset: 1,
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
    form,
    ...otherProps
  } = props;

  let styles: Styles = extractStyles(props, CONTAINER_STYLES);

  labelStyles = useMemo(
    () => ({
      ...(!groupState ? LABEL_STYLES : INLINE_LABEL_STYLES),
      ...labelStyles,
    }),
    [groupState, labelStyles],
  );

  let { isFocused, focusProps } = useFocus({ isDisabled }, true);
  let { hoverProps, isHovered } = useHover({ isDisabled });

  let inputRef = useRef(null);
  let domRef = useFocusableRef(ref, inputRef);

  const toggleState = useToggleState(props);

  let { inputProps } = groupState
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
      )
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

  let markIcon = isIndeterminate ? (
    <Icon size={12} stroke={3}>
      <IconMinus />
    </Icon>
  ) : (
    <Icon size={12} stroke={3}>
      <IconCheck />
    </Icon>
  );

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

  const checkbox = (
    <>
      <HiddenInput
        qa={qa || 'Checkbox'}
        data-input-type="checkbox"
        {...mergeProps(inputProps, focusProps)}
        ref={inputRef}
      />
      <CheckboxElement mods={mods} styles={inputStyles}>
        {markIcon}
      </CheckboxElement>
    </>
  );

  const checkboxField = (
    <CheckboxWrapperElement isHidden={isHidden} mods={mods}>
      {checkbox}
      {children && <Text nowrap>{children}</Text>}
    </CheckboxWrapperElement>
  );

  if (!groupState) {
    return wrapWithField(checkboxField, domRef, {
      ...props,
      children: null,
      inputStyles,
    });
  }

  return (
    <CheckboxWrapperElement
      styles={styles}
      isHidden={isHidden}
      {...hoverProps}
      {...filterBaseProps(otherProps)}
      ref={domRef}
    >
      {checkbox}
      {label ?? children ? (
        <Element
          styles={labelStyles}
          mods={{
            invalid: validationState === 'invalid',
            valid: validationState === 'valid',
            disabled: isDisabled,
          }}
          {...filterBaseProps(labelProps)}
        >
          {label ?? children}
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

__Checkbox.displayName = 'Checkbox';

export { __Checkbox as Checkbox };
export type { AriaCheckboxProps };
export { useCheckbox };
