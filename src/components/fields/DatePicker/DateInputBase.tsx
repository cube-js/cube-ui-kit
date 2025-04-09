import React, { cloneElement, useRef } from 'react';
import { mergeRefs } from '@react-aria/utils';
import { useFocusRing } from 'react-aria';

import {
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  Props,
  Styles,
  tasty,
} from '../../../tasty';
import {
  DEFAULT_INPUT_STYLES,
  INPUT_WRAPPER_STYLES,
} from '../TextInput/TextInputBase';
import { InvalidIcon } from '../../shared/InvalidIcon';
import { ValidIcon } from '../../shared/ValidIcon';
import { ValidationState } from '../../../shared';
import { mergeProps } from '../../../utils/react';

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
    display: 'flex',
    flow: 'row',
    placeItems: 'center start',
  },
});

interface CubeDateAtomInputProps extends ContainerStyleProps {
  isDisabled?: boolean;
  children?: React.ReactNode;
  fieldProps?: Props;
  style?: React.CSSProperties;
  disableFocusRing?: boolean;
  autoFocus?: boolean;
  styles?: Styles;
  inputStyles?: Styles;
  size?: 'small' | 'medium' | 'large' | (string & {});
  validationState?: ValidationState;
  isLoading?: boolean;
}

function DateInputBase(props: CubeDateAtomInputProps, ref) {
  let inputRef = useRef(null);
  let {
    isDisabled,
    inputStyles,
    children,
    fieldProps,
    style,
    disableFocusRing,
    autoFocus,
    validationState,
    isLoading,
    size = 'medium',
  } = props;

  let styles = extractStyles(props, CONTAINER_STYLES);

  let { focusProps, isFocused } = useFocusRing({
    isTextInput: true,
    within: true,
    autoFocus,
  });

  let isInvalid = validationState === 'invalid';
  let validationIcon = isInvalid ? InvalidIcon : ValidIcon;
  let validation = cloneElement(validationIcon);

  return (
    <DateInputWrapperElement
      styles={styles}
      data-size={size}
      mods={{
        disabled: isDisabled,
        focused: isFocused && !disableFocusRing,
        invalid: isInvalid,
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
      {validationState && !isLoading ? validation : undefined}
    </DateInputWrapperElement>
  );
}

const _DateInputBase = React.forwardRef(DateInputBase);

_DateInputBase.displayName = 'DateInputBase';

export { _DateInputBase as DateInputBase };
