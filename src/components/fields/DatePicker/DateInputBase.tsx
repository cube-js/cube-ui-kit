import { mergeRefs } from '@react-aria/utils';
import {
  CONTAINER_STYLES,
  ContainerStyleProps,
  mergeStyles,
  Styles,
  tasty,
} from '@tenphi/tasty';
import React, { useRef } from 'react';
import { useFocusRing } from 'react-aria';

import { mergeProps } from '../../../utils/react/mergeProps';
import { extractStyles } from '../../../utils/styles';
import { getValidationMods } from '../../form/validation/resolve-validation-props';
import {
  hasValidationIndicator,
  ValidationIndicator,
} from '../../form/validation/ValidationIndicator';
import {
  DEFAULT_INPUT_STYLES,
  INPUT_WRAPPER_STYLES,
} from '../TextInput/TextInputBase';

import type { Props } from '../../../props';

const DateInputWrapperElement = tasty({
  qa: 'DateInputWrapper',
  role: 'presentation',
  // The input wrapper's grid, so the segments take the free space and the
  // suffix sits at the right edge. Their column is `1fr`, not `1sf`: date
  // segments can't shrink, so the box is never narrower than its content.
  styles: mergeStyles(INPUT_WRAPPER_STYLES, {
    gridColumns: { '': '1fr', suffix: '1fr max-content' },
  }),
});

const DateInputElement = tasty({
  role: 'presentation',
  styles: mergeStyles(DEFAULT_INPUT_STYLES, {
    height: {
      '': '($size-md - 2bw)',
      'size=small': '($size-sm - 2bw)',
      'size=large': '($size-lg - 2bw)',
    },
    display: 'flex',
    flow: 'row',
    placeItems: 'center start',
  }),
});

interface CubeDateAtomInputProps extends ContainerStyleProps {
  qa?: string;
  inputType?: string;
  isDisabled?: boolean;
  isReadOnly?: boolean;
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
  /** The input box, the picker's own element. */
  wrapperRef?: React.Ref<HTMLDivElement>;
}

function DateInputBase(props: CubeDateAtomInputProps, ref) {
  let inputRef = useRef(null);
  let {
    qa,
    inputType,
    isDisabled,
    isReadOnly,
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
    wrapperRef,
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
      ref={wrapperRef}
      qa={qa || 'DateTimeInput'}
      styles={styles}
      data-size={size}
      data-input-type={inputType ? inputType : 'datetimeinput'}
      mods={{
        disabled: isDisabled,
        readonly: !!isReadOnly,
        focused: isFocused && !disableFocusRing,
        ...getValidationMods({ isInvalid, isValid }),
        suffix: showValidationIndicator || !!suffix,
      }}
      {...mergeProps(fieldProps ?? {}, focusProps)}
      // For a dialog kept mounted while closed, which focuses the field's
      // first segment on every open, as `Button` marks itself.
      {...(autoFocus ? { 'data-autofocus': '' } : undefined)}
      // oxlint-disable-next-line tasty/no-style-prop -- forwards the consumer's public `style` prop
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
