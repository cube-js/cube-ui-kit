import { forwardRef, useRef } from 'react';
import { useFocusableRef } from '@react-spectrum/utils';
import { useSwitch, useHover, AriaSwitchProps } from 'react-aria';
import { useToggleState } from 'react-stately';

import { useProviderProps } from '../../../provider';
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
import { useFocus } from '../../../utils/react/interactions';
import { mergeProps } from '../../../utils/react';
import { HiddenInput } from '../../HiddenInput';
import { Text } from '../../content/Text';
import { FieldBaseProps } from '../../../shared';
import {
  castNullableIsSelected,
  WithNullableSelected,
} from '../../../utils/react/nullableValue';
import { useFieldProps, useFormProps, wrapWithField } from '../../form';
import { LoadingIcon } from '../../../icons';

const SwitchWrapperElement = tasty({
  as: 'label',
  qa: 'SwitchWrapper',
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
    position: 'relative',
    verticalAlign: 'baseline',
    placeSelf: 'center',
    radius: 'round',
    fill: {
      '': '#dark.50',
      checked: '#purple',
      disabled: '#dark.12',
    },
    color: '#white',
    border: false,
    width: {
      '': '5.25x 5.25x',
      '[data-size="small"]': '3.5x 3.5x',
    },
    height: {
      '': '3x 3x',
      '[data-size="small"]': '2x 2x',
    },
    outline: {
      '': '#purple-03.0',
      focused: '#purple-03',
    },
    transition: 'theme',
    cursor: 'pointer',
    shadow: {
      '': '0 0 0 0 #clear',
      invalid: '0 0 0 1bw #white, 0 0 0 1ow #danger',
    },

    Thumb: {
      position: 'absolute',
      width: {
        '': '2.5x 2.5x',
        '[data-size="small"]': '1.5x 1.5x',
      },
      height: {
        '': '2.5x 2.5x',
        '[data-size="small"]': '1.5x 1.5x',
      },
      radius: 'round',
      fill: {
        '': 'currentColor',
        disabled: '#white.5',
      },
      shadow: '0px 2px 4px #dark.20;',
      top: '.25x',
      left: {
        '': '.25x',
        checked: '2.5x',
        'checked & [data-size="small"]': '1.75x',
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
  isLoading?: boolean;
  size?: 'large' | 'small';
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
    validationState,
    size = 'large',
  } = props;

  let styles = extractStyles(props, OUTER_STYLES);

  inputStyles = extractStyles(props, BLOCK_STYLES, inputStyles);

  let { isFocused, focusProps } = useFocus({ isDisabled }, true);
  let { hoverProps, isHovered } = useHover({ isDisabled });

  let inputRef = useRef(null);
  let domRef = useFocusableRef(ref, inputRef);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  let { inputProps } = useSwitch(
    {
      ...props,
      ...(typeof label === 'string' && label.trim()
        ? { 'aria-label': label }
        : {}),
    },
    useToggleState(props),
    inputRef,
  );

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
    <SwitchWrapperElement mods={mods} data-size={size} {...hoverProps}>
      <HiddenInput
        data-qa="HiddenInput"
        {...mergeProps(inputProps, focusProps)}
        ref={inputRef}
      />
      <SwitchElement
        qa={qa || 'Switch'}
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
    children: null,
    labelStyles,
    inputStyles,
    styles,
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
