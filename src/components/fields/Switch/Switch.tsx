import { useFocusableRef } from '@react-spectrum/utils';
import { forwardRef, useRef } from 'react';
import { AriaSwitchProps, useHover, useSwitch } from 'react-aria';
import { useToggleState } from 'react-stately';

import { LoadingIcon } from '../../../icons';
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
import { useFocus } from '../../../utils/react/interactions';
import {
  castNullableIsSelected,
  WithNullableSelected,
} from '../../../utils/react/nullableValue';
import { useId } from '../../../utils/react/useId';
import { Text } from '../../content/Text';
import { useFieldProps, useFormProps, wrapWithField } from '../../form';
import { HiddenInput } from '../../HiddenInput';

const SwitchWrapperElement = tasty({
  as: 'label',
  styles: {
    display: 'flex',
    position: 'relative',
    placeItems: {
      '': 'center stretch',
      'side-label': 'baseline stretch',
    },
    gap: '1x',
    width: 'max max-content',
    color: '#dark-02',
  },
});

const SwitchElement = tasty({
  qa: 'Switch',
  styles: {
    boxSizing: 'border-box',
    position: 'relative',
    verticalAlign: 'baseline',
    placeSelf: 'center',
    radius: 'round',
    fill: {
      '': '#white',
      checked: '#purple',
      disabled: '#border',
    },
    color: {
      '': '#dark-03',
      checked: '#white',
    },
    border: {
      '': '#dark-05',
      checked: '#purple-text',
      disabled: '#dark-05',
    },
    width: {
      '': '5x 5x',
      '[data-size="medium"]': '4x 4x',
      '[data-size="small"]': '3x 3x',
    },
    height: {
      '': '3x 3x',
      '[data-size="medium"]': '2.5x 2.5x',
      '[data-size="small"]': '2x 2x',
    },
    outline: {
      '': '#purple-text.0',
      focused: '1bw #purple-text',
    },
    outlineOffset: 1,
    transition: 'theme',
    cursor: 'pointer',
    shadow: {
      '': '0 0 0 0 #clear',
      invalid: '0 0 0 1bw #white, 0 0 0 2bw #danger',
    },

    Thumb: {
      position: 'absolute',
      width: {
        '': '2x 2x',
        '[data-size="medium"]': '1.5x 1.5x',
        '[data-size="small"]': '1.25x 1.25x',
      },
      height: {
        '': '2x 2x',
        '[data-size="medium"]': '1.5x 1.5x',
        '[data-size="small"]': '1.25x 1.25x',
      },
      radius: 'round',
      fill: {
        '': 'currentColor',
        disabled: '#white.7',
      },
      top: {
        '': '.375x',
        '[data-size="medium"]': '.375x',
        '[data-size="small"]': '.25x',
      },
      left: {
        '': '.375x',
        '[data-size="medium"]': '.375x',
        '[data-size="small"]': '.25x',
        checked: '2.25x',
        'checked & [data-size="medium"]': '1.75x',
        'checked & [data-size="small"]': '1.25x',
      },
      transition: 'left, theme',
      cursor: 'pointer',
    },
  },
});

export interface CubeSwitchProps
  extends BaseProps,
    OuterStyleProps,
    BlockStyleProps,
    FieldBaseProps,
    AriaSwitchProps {
  inputStyles?: Styles;
  fieldStyles?: Styles;
  isLoading?: boolean;
  size?: 'large' | 'medium' | 'small';
}

function Switch(props: WithNullableSelected<CubeSwitchProps>, ref) {
  props = castNullableIsSelected(props);
  props = useProviderProps(props);
  props = useFormProps(props);
  props = useFieldProps(props, {
    defaultValidationTrigger: 'onChange',
    valuePropsMapper: ({ value, onChange }) => ({
      isSelected: value != null ? value : false,
      isIndeterminate: false,
      onChange: onChange,
    }),
  });

  let {
    qa,
    isDisabled = false,
    children,
    label,
    labelStyles,
    insideForm,
    isLoading,
    labelPosition,
    inputStyles,
    fieldStyles,
    validationState,
    size = 'medium',
  } = props;

  const id = useId(props.id);

  let styles = extractStyles(props, OUTER_STYLES);

  inputStyles = extractStyles(props, BLOCK_STYLES, inputStyles);

  let { isFocused, focusProps } = useFocus({ isDisabled }, true);
  let { hoverProps, isHovered } = useHover({ isDisabled });

  let inputRef = useRef(null);
  let domRef = useFocusableRef(ref, inputRef);

  let { inputProps } = useSwitch(props, useToggleState(props), inputRef);

  const mods = {
    checked: inputProps.checked,
    disabled: isDisabled,
    hovered: isHovered,
    focused: isFocused,
    invalid: validationState === 'invalid',
    valid: validationState === 'valid',
    'inside-form': insideForm,
    'side-label': labelPosition === 'side',
  };

  const switchField = (
    <SwitchWrapperElement
      qa={qa || 'SwitchWrapper'}
      mods={mods}
      data-size={size}
      styles={styles}
      {...hoverProps}
    >
      <HiddenInput
        data-qa="HiddenInput"
        {...mergeProps(inputProps, focusProps)}
        ref={inputRef}
        id={id}
      />
      <SwitchElement
        qa="Switch"
        mods={mods}
        data-size={size}
        styles={inputStyles}
      >
        <div data-element="Thumb" aria-hidden="true" />
      </SwitchElement>
      {children ? <Text nowrap>{children}</Text> : null}
      {isLoading ? (
        <>
          {label ? <>&nbsp;</> : null}
          <LoadingIcon />
        </>
      ) : null}
    </SwitchWrapperElement>
  );

  return wrapWithField(switchField, domRef, {
    ...props,
    id,
    labelProps: {
      ...props.labelProps,
      for: id,
    },
    children: null,
    labelStyles,
    inputStyles,
    styles: fieldStyles,
  });
}

/**
 * Switches allow users to turn an individual option on or off.
 * They are usually used to activate or deactivate a specific setting.
 */
let _Switch = forwardRef(Switch);

(_Switch as any).cubeInputType = 'Checkbox';
_Switch.displayName = 'Switch';

export { _Switch as Switch };
export type { AriaSwitchProps };
export { useSwitch };
