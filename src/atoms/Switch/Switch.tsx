import { useFocusableRef } from '@react-spectrum/utils';
import { forwardRef, useRef } from 'react';
import { useSwitch } from '@react-aria/switch';
import { useHover } from '@react-aria/interactions';
import { useToggleState } from '@react-stately/toggle';
import { useProviderProps } from '../../provider';
import { BLOCK_STYLES, OUTER_STYLES } from '../../styles/list';
import { extractStyles } from '../../utils/styles';
import { Base } from '../../components/Base';
import { useFocus } from '../../utils/interactions';
import { mergeProps } from '@react-aria/utils';
import { filterBaseProps } from '../../utils/filterBaseProps';
import { useContextStyles } from '../../providers/Styles';
import { HiddenInput } from '../../components/HiddenInput';
import { INLINE_LABEL_STYLES, LABEL_STYLES } from '../../components/Label';
import { LoadingOutlined } from '@ant-design/icons';
import { useFormProps } from '../Form/Form';
import { FieldWrapper } from '../../components/FieldWrapper';
import { NuStyles } from '../../styles/types';
import {
  BaseProps,
  BlockStyleProps,
  OuterStyleProps,
} from '../../components/types';
import { AriaSwitchProps } from '@react-types/switch';
import { FormFieldProps } from '../../shared';

const STYLES: NuStyles = {
  position: 'relative',
  display: 'flex',
  placeItems: 'center start',
  gap: '1x',
  flow: 'row',
  size: 'input',
  width: 'min-content',
};

const INPUT_STYLES: NuStyles = {
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
};

const THUMB_STYLES: NuStyles = {
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
};

export interface CubeSwitchProps
  extends BaseProps,
    OuterStyleProps,
    BlockStyleProps,
    FormFieldProps,
    AriaSwitchProps {
  thumbStyles?: NuStyles;
  inputStyles?: NuStyles;
  isLoading?: boolean;
}

function Switch(props: CubeSwitchProps, ref) {
  props = useProviderProps(props);
  props = useFormProps(props);

  let {
    isDisabled = false,
    autoFocus,
    children,
    label,
    labelProps,
    labelStyles,
    thumbStyles,
    isLoading,
    insideForm,
    validationState,
    message,
    labelPosition,
    inputStyles,
    requiredMark = true,
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
    <Base styles={{ position: 'relative' }}>
      <HiddenInput
        data-qa="Switch"
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
          insideForm,
          styles,
          labelStyles,
          labelProps,
          isDisabled,
          validationState,
          message,
          requiredMark,
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
export { _Switch as Switch };
