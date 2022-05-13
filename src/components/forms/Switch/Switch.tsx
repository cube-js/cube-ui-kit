import { useFocusableRef } from '@react-spectrum/utils';
import { forwardRef, useRef } from 'react';
import { useSwitch } from '@react-aria/switch';
import { useHover } from '@react-aria/interactions';
import { useToggleState } from '@react-stately/toggle';
import { useProviderProps } from '../../../provider';
import {
  BaseProps,
  BLOCK_STYLES,
  BlockStyleProps,
  extractStyles,
  filterBaseProps,
  OUTER_STYLES,
  OuterStyleProps,
  Styles,
  useContextStyles,
} from '../../../tasty';
import { Base } from '../../Base';
import { useFocus } from '../../../utils/react/interactions';
import { mergeProps } from '../../../utils/react';
import { HiddenInput } from '../../HiddenInput';
import { INLINE_LABEL_STYLES, LABEL_STYLES } from '../Label';
import { LoadingOutlined } from '@ant-design/icons';
import { useFormProps } from '../Form/Form';
import { FieldWrapper } from '../FieldWrapper';
import type { AriaSwitchProps } from '@react-types/switch';
import { FormFieldProps } from '../../../shared';
import {
  castNullableIsSelected,
  WithNullableSelected,
} from '../../../utils/react/nullableValue';

const STYLES: Styles = {
  position: 'relative',
  display: 'flex',
  placeItems: 'center start',
  gap: '1x',
  flow: 'row',
  preset: 'input',
  width: 'min-content',
  cursor: 'pointer',
};

const INPUT_STYLES: Styles = {
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
};

const THUMB_STYLES: Styles = {
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
  transition: 'left',
  cursor: 'pointer',
};

export interface CubeSwitchProps
  extends BaseProps,
    OuterStyleProps,
    BlockStyleProps,
    FormFieldProps,
    AriaSwitchProps {
  thumbStyles?: Styles;
  inputStyles?: Styles;
  isLoading?: boolean;
}

function Switch(props: WithNullableSelected<CubeSwitchProps>, ref) {
  props = castNullableIsSelected(props);
  props = useProviderProps(props);
  props = useFormProps(props);

  let {
    qa,
    isDisabled = false,
    autoFocus,
    children,
    label,
    extra,
    labelProps,
    labelStyles,
    thumbStyles,
    isLoading,
    insideForm,
    validationState,
    message,
    description,
    labelPosition,
    inputStyles,
    requiredMark = true,
    tooltip,
    ...otherProps
  } = props;

  label = label || children;

  let wrapperContextStyles = useContextStyles('Switch_Wrapper', props);
  let inputContextStyles = useContextStyles('Switch', props);
  let labelContextStyles = useContextStyles('Switch_Label', props);
  let thumbContextStyles = useContextStyles('Switch_Thumb', props);

  let styles = extractStyles(props, OUTER_STYLES, {
    ...(insideForm ? {} : STYLES),
    ...wrapperContextStyles,
  });
  inputStyles = extractStyles(props, BLOCK_STYLES, {
    ...INPUT_STYLES,
    ...inputContextStyles,
    ...(insideForm && labelPosition === 'side'
      ? {
          marginTop: '-3px',
          placeSelf: 'start',
        }
      : null),
    ...inputStyles,
  });

  thumbStyles = {
    ...THUMB_STYLES,
    ...thumbContextStyles,
    ...thumbStyles,
  };

  labelStyles = {
    ...(insideForm ? LABEL_STYLES : INLINE_LABEL_STYLES),
    ...labelContextStyles,
    ...labelStyles,
  };

  let { isFocused, focusProps } = useFocus({ isDisabled }, true);
  let { hoverProps, isHovered } = useHover({ isDisabled });

  let inputRef = useRef(null);
  let domRef = useFocusableRef(ref, inputRef);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  let { inputProps } = useSwitch(props, useToggleState(props), inputRef);

  const switchField = (
    <Base qa={`${qa || 'Switch'}Wrapper`} styles={{ position: 'relative' }}>
      <HiddenInput
        data-qa={qa || 'Switch'}
        {...mergeProps(inputProps, focusProps)}
        ref={inputRef}
      />
      <Base
        mods={{
          checked: inputProps.checked,
          disabled: isDisabled,
          hovered: isHovered,
          focused: isFocused,
        }}
        styles={inputStyles}
      >
        <Base
          qa="SwitchThumb"
          styles={thumbStyles}
          aria-hidden="true"
          mods={{
            checked: inputProps.checked,
          }}
        />
      </Base>
    </Base>
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
          Component: switchField,
          ref: domRef,
        }}
      />
    );
  }

  return (
    <Base
      as="label"
      styles={styles}
      {...hoverProps}
      {...filterBaseProps(otherProps)}
      ref={domRef}
    >
      {switchField}
      {label && (
        <Base
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

(_Switch as any).cubeInputType = 'Checkbox';

export { _Switch as Switch };
