import { mergeRefs } from '@react-aria/utils';
import {
  CONTAINER_STYLES,
  ContainerStyleProps,
  Props,
  Styles,
  tasty,
} from '@tenphi/tasty';
import React, { useRef } from 'react';
import { useFocusRing } from 'react-aria';

import { mergeProps } from '../../../utils/react';
import { extractStyles } from '../../../utils/styles';
import {
  getValidationMods,
  hasValidationIndicator,
  ValidationIndicator,
} from '../../form';
import {
  DEFAULT_INPUT_STYLES,
  INPUT_WRAPPER_STYLES,
} from '../TextInput/TextInputBase';

const DateInputWrapperElement = tasty({
  qa: 'DateInputWrapper',
  role: 'presentation',
  styles: {
    ...INPUT_WRAPPER_STYLES,
    display: 'flex',
  },
});

const DateInputElement = tasty({
  role: 'presentation',
  styles: {
    ...DEFAULT_INPUT_STYLES,
    height: {
      '': '($size-md - 2bw)',
      'size=small': '($size-sm - 2bw)',
      'size=large': '($size-lg - 2bw)',
    },
    display: 'flex',
    flow: 'row',
    placeItems: 'center start',
  },
});

interface CubeDateAtomInputProps extends ContainerStyleProps {
  qa?: string;
  inputType?: string;
  isDisabled?: boolean;
  children?: React.ReactNode;
  fieldProps?: Props;
  style?: React.CSSProperties;
  disableFocusRing?: boolean;
  autoFocus?: boolean;
  styles?: Styles;
  inputStyles?: Styles;
  size?: 'small' | 'medium' | 'large' | (string & {});
  isInvalid?: boolean;
  isValid?: boolean;
  isLoading?: boolean;
  suffix?: React.ReactNode;
}

function DateInputBase(props: CubeDateAtomInputProps, ref) {
  let inputRef = useRef(null);
  let {
    qa,
    inputType,
    isDisabled,
    inputStyles,
    children,
    fieldProps,
    style,
    disableFocusRing,
    autoFocus,
    isInvalid,
    isValid,
    isLoading,
    size = 'medium',
    suffix,
  } = props;

  let styles = extractStyles(props, CONTAINER_STYLES);

  let { focusProps, isFocused } = useFocusRing({
    isTextInput: true,
    within: true,
    autoFocus,
  });

  const showValidationIndicator = hasValidationIndicator({
    isInvalid,
    isValid,
    isLoading,
  });

  return (
    <DateInputWrapperElement
      qa={qa || 'DateTimeInput'}
      styles={styles}
      data-size={size}
      data-input-type={inputType ? inputType : 'datetimeinput'}
      mods={{
        disabled: isDisabled,
        focused: isFocused && !disableFocusRing,
        ...getValidationMods({ isInvalid, isValid }),
        suffix: showValidationIndicator || !!suffix,
      }}
      {...mergeProps(fieldProps ?? {}, focusProps)}
      style={style}
    >
      <div data-element="Contents" role="presentation">
        <DateInputElement
          ref={mergeRefs(ref, inputRef)}
          data-size={size}
          role="presentation"
          styles={inputStyles}
        >
          {children}
        </DateInputElement>
      </div>
      {showValidationIndicator || suffix ? (
        <div data-element="Suffix">
          <ValidationIndicator
            isInvalid={isInvalid}
            isValid={isValid}
            isLoading={isLoading}
          />
          {suffix}
        </div>
      ) : null}
    </DateInputWrapperElement>
  );
}

const _DateInputBase = React.forwardRef(DateInputBase);

_DateInputBase.displayName = 'DateInputBase';

export { _DateInputBase as DateInputBase };
