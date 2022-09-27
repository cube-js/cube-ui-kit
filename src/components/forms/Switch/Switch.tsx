import { useFocusableRef } from '@react-spectrum/utils';
import { forwardRef, useMemo, useRef } from 'react';
import { useSwitch } from '@react-aria/switch';
import { useHover } from '@react-aria/interactions';
import { useToggleState } from '@react-stately/toggle';
import { LoadingOutlined } from '@ant-design/icons';
import { FocusableRef } from '@react-types/shared';

import { useProviderProps } from '../../../provider';
import {
  BaseProps,
  BLOCK_STYLES,
  BlockStyleProps,
  Element,
  extractStyles,
  filterBaseProps,
  OUTER_STYLES,
  OuterStyleProps,
  Styles,
  tasty,
} from '../../../tasty';
import { useFocus } from '../../../utils/react/interactions';
import { mergeProps } from '../../../utils/react';
import { HiddenInput } from '../../HiddenInput';
import { INLINE_LABEL_STYLES, LABEL_STYLES } from '../Label';
import { FieldWrapper } from '../FieldWrapper';
import { FormFieldProps } from '../../../shared';
import {
  castNullableIsSelected,
  WithNullableSelected,
} from '../../../utils/react/nullableValue';
import { useFieldProps } from '../Form';

import type { AriaSwitchProps } from '@react-types/switch';

const SwitchWrapperElement = tasty({
  qa: 'SwitchWrapper',
  styles: {
    position: 'relative',
    margin: {
      '': 0,
      'inside-form & side-label': '1x top',
    },
  },
});

const SwitchLabelElement = tasty({
  as: 'label',
  qa: 'SwitchWrapper',
  styles: {
    position: 'relative',
    display: 'flex',
    placeItems: 'center start',
    gap: '1x',
    flow: 'row',
    preset: 'input',
    width: 'min-content',
    cursor: 'pointer',
  },
});

const SwitchElement = tasty({
  styles: {
    position: 'relative',
    display: 'grid',
    placeItems: 'center',
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
    cursor: 'pointer',
    placeSelf: {
      '': null,
      'inside-form & side-label': 'start',
    },

    Thumb: {
      position: 'absolute',
      width: '2.5x',
      height: '2.5x',
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
    FormFieldProps,
    AriaSwitchProps {
  inputStyles?: Styles;
  isLoading?: boolean;
}

/**
 * Switches allow users to turn an individual option on or off.
 * They are usually used to activate or deactivate a specific setting.
 */
export const Switch = forwardRef(function Switch(
  props: WithNullableSelected<CubeSwitchProps>,
  ref: FocusableRef,
) {
  props = castNullableIsSelected(props);
  props = useProviderProps(props);
  props = useFieldProps(props, {
    valuePropsMapper: ({ value, onChange }) => ({
      isSelected: value != null ? value : false,
      isIndeterminate: false,
      onChange: onChange,
    }),
  });

  let {
    qa,
    isDisabled = false,
    autoFocus,
    children,
    label,
    extra,
    labelProps,
    labelStyles,
    isLoading,
    insideForm,
    validationState,
    message,
    description,
    labelPosition,
    inputStyles,
    requiredMark = true,
    tooltip,
    labelSuffix,
    ...otherProps
  } = props;

  label = label || children;

  let styles = extractStyles(props, OUTER_STYLES);

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

  // eslint-disable-next-line react-hooks/rules-of-hooks
  let { inputProps } = useSwitch(props, useToggleState(props), inputRef);

  const mods = {
    'inside-form': insideForm,
    'side-label': labelPosition === 'side',
    checked: inputProps.checked,
    disabled: isDisabled,
    hovered: isHovered,
    focused: isFocused,
  };

  const switchField = (
    <SwitchWrapperElement qa={qa || 'Switch'} mods={mods}>
      <HiddenInput
        data-qa="HiddenInput"
        {...mergeProps(inputProps, focusProps)}
        ref={inputRef}
      />
      <SwitchElement mods={mods} styles={inputStyles}>
        <div data-element="Thumb" aria-hidden="true" />
      </SwitchElement>
    </SwitchWrapperElement>
  );

  if (insideForm) {
    return (
      <FieldWrapper
        {...{
          as: 'label',
          labelPosition,
          label,
          extra,
          styles,
          labelStyles,
          labelProps,
          isDisabled,
          validationState,
          message,
          description,
          requiredMark,
          tooltip,
          labelSuffix,
          Component: switchField,
          ref: domRef,
        }}
      />
    );
  }

  return (
    <SwitchLabelElement
      styles={styles}
      mods={mods}
      {...hoverProps}
      {...filterBaseProps(otherProps)}
      ref={domRef}
    >
      {switchField}
      {label && (
        <Element
          styles={labelStyles}
          mods={{
            disabled: isDisabled,
          }}
          {...filterBaseProps(labelProps)}
        >
          {label}
          {isLoading ? (
            <>
              {label ? <>&nbsp;</> : null}
              <LoadingOutlined />
            </>
          ) : null}
        </Element>
      )}
    </SwitchLabelElement>
  );
});
