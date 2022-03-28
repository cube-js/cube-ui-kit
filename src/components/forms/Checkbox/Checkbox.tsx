import { useFocusableRef } from '@react-spectrum/utils';
import { forwardRef, useContext, useRef } from 'react';
import type { AriaCheckboxProps } from '@react-types/checkbox';
import { useCheckbox, useCheckboxGroupItem } from '@react-aria/checkbox';
import { useHover } from '@react-aria/interactions';
import { useToggleState } from '@react-stately/toggle';
import { useProviderProps } from '../../../provider';
import { BLOCK_STYLES, OUTER_STYLES } from '../../../styles/list';
import { extractStyles } from '../../../utils/styles';
import { Base } from '../../Base';
import { useFocus } from '../../../utils/interactions';
import { mergeProps } from '../../../utils/react';
import { filterBaseProps } from '../../../utils/filterBaseProps';
import { useContextStyles } from '../../../providers/StylesProvider';
import { INLINE_LABEL_STYLES, LABEL_STYLES } from '../Label';
import { HiddenInput } from '../../HiddenInput';
import { useFormProps } from '../Form/Form';
import { FieldWrapper } from '../FieldWrapper';
import { CheckboxGroup } from './CheckboxGroup';
import { CheckboxGroupContext } from './context';
import { BaseProps } from '../../types';
import { Styles } from '../../../styles/types';
import type { FocusableRef } from '@react-types/shared';
import { FormFieldProps } from '../../../shared';
import {
  castNullableIsSelected,
  WithNullableSelected,
} from '../../../utils/react/nullableValue';

export interface CubeCheckboxProps
  extends BaseProps,
    AriaCheckboxProps,
    FormFieldProps {}

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

const DEFAULT_STYLES: Styles = {
  position: 'relative',
  display: 'flex',
  placeItems: 'center start',
  gap: '1x',
  flow: 'row',
  preset: 'default',
  cursor: 'pointer',
} as const;

const INPUT_STYLES: Styles = {
  display: 'grid',
  placeItems: 'center',
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
} as const;

function Checkbox(
  props: WithNullableSelected<CubeCheckboxProps>,
  ref: FocusableRef,
) {
  props = castNullableIsSelected(props);

  let originalProps = props;

  props = useProviderProps(props);
  props = useFormProps(props);

  let {
    qa,
    isIndeterminate = false,
    isDisabled = false,
    insideForm,
    isRequired,
    autoFocus,
    children,
    label,
    validationState,
    labelProps,
    labelStyles,
    labelPosition,
    necessityLabel,
    necessityIndicator,
    message,
    description,
    requiredMark = true,
    tooltip,
    isHidden,
    ...otherProps
  } = props;

  label = label || children;

  // Swap hooks depending on whether this checkbox is inside a CheckboxGroup.
  // This is a bit unorthodox. Typically, hooks cannot be called in a conditional,
  // but since the checkbox won't move in and out of a group, it should be safe.
  let groupState = useContext(CheckboxGroupContext);

  let wrapperContextStyles = useContextStyles('Checkbox_Wrapper', props);
  let inputContextStyles = useContextStyles('Checkbox', props);
  let labelContextStyles = useContextStyles('Checkbox_Label', props);

  let styles: Styles = extractStyles(props, OUTER_STYLES, {
    ...(insideForm && !groupState ? {} : DEFAULT_STYLES),
    ...wrapperContextStyles,
  });
  let inputStyles = extractStyles(props, BLOCK_STYLES, {
    ...INPUT_STYLES,
    ...inputContextStyles,
  });

  labelStyles = {
    ...(insideForm && !groupState ? LABEL_STYLES : INLINE_LABEL_STYLES),
    ...labelContextStyles,
    ...labelStyles,
  };

  if (!insideForm) {
    labelStyles.fontWeight = 400;
  }

  if (insideForm && labelPosition === 'side') {
    inputStyles.marginTop = '1x';
  }

  let { isFocused, focusProps } = useFocus({ isDisabled }, true);
  let { hoverProps, isHovered } = useHover({ isDisabled });

  let inputRef = useRef(null);
  let domRef = useFocusableRef(ref, inputRef);

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
    : useCheckbox(props, useToggleState(props), inputRef);

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

  let checkboxField = (
    <Base
      qa="CheckboxContainer"
      isHidden={isHidden}
      styles={{ position: 'relative' }}
    >
      <HiddenInput
        data-qa={qa || 'Checkbox'}
        {...mergeProps(inputProps, focusProps)}
        ref={inputRef}
      />
      <Base
        qa="CheckboxIcon"
        mods={{
          checked: inputProps.checked,
          indeterminate: isIndeterminate,
          invalid: validationState === 'invalid',
          valid: validationState === 'valid',
          disabled: isDisabled,
          hovered: isHovered,
          focused: isFocused,
        }}
        styles={inputStyles}
      >
        {markIcon}
      </Base>
    </Base>
  );

  if (insideForm && !groupState) {
    return (
      <FieldWrapper
        {...{
          as: 'label',
          labelPosition,
          label,
          styles,
          isRequired,
          labelStyles,
          isHidden,
          labelProps,
          isDisabled,
          validationState,
          necessityLabel,
          necessityIndicator,
          message,
          description,
          requiredMark,
          tooltip,
          Component: checkboxField,
          ref: domRef,
        }}
      />
    );
  }

  return (
    <Base
      as="label"
      styles={styles}
      isHidden={isHidden}
      {...hoverProps}
      {...filterBaseProps(otherProps)}
      ref={domRef}
    >
      {checkboxField}
      {label && (
        <Base
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
