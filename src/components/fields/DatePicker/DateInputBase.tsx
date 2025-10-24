import { mergeRefs } from '@react-aria/utils';
import React, { cloneElement, useRef } from 'react';
import { useFocusRing } from 'react-aria';

import { ValidationState } from '../../../shared';
import {
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  Props,
  Styles,
  tasty,
} from '../../../tasty';
import { mergeProps } from '../../../utils/react';
import { InvalidIcon } from '../../shared/InvalidIcon';
import { ValidIcon } from '../../shared/ValidIcon';
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
      '[data-size="small"]': '($size-sm - 2bw)',
      '[data-size="large"]': '($size-lg - 2bw)',
    },
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
  suffix?: React.ReactNode;
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
    suffix,
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
        suffix: (validationState && !isLoading) || isLoading || !!suffix,
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
      {(validationState && !isLoading) || isLoading || suffix ? (
        <div data-element="Suffix">
          {suffix}
          {(validationState && !isLoading) || isLoading ? (
            <div data-element="State">
              {validationState && !isLoading ? validation : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </DateInputWrapperElement>
  );
}

const _DateInputBase = React.forwardRef(DateInputBase);

_DateInputBase.displayName = 'DateInputBase';

export { _DateInputBase as DateInputBase };
