import { createFocusableRef } from '@react-spectrum/utils';
import {
  cloneElement,
  forwardRef,
  ReactElement,
  ReactNode,
  RefObject,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { AriaNumberFieldProps, AriaTextFieldProps, useHover } from 'react-aria';

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
  Props,
  Styles,
  tasty,
} from '../../../tasty';
import { mergeProps, useCombinedRefs } from '../../../utils/react';
import { useFocus } from '../../../utils/react/interactions';
import { useFieldProps, useFormProps, wrapWithField } from '../../form';
import { InvalidIcon } from '../../shared/InvalidIcon';
import { ValidIcon } from '../../shared/ValidIcon';

const ADD_STYLES = {
  display: 'grid',
  placeContent: 'stretch',
  placeItems: 'center',
  gridRows: '1sf',
  flow: 'column',
  gap: 0,
  cursor: 'inherit',
  opacity: {
    '': 1,
    disabled: '$disabled-opacity',
  },
};

export const INPUT_WRAPPER_STYLES: Styles = {
  display: 'grid',
  flow: 'row',
  position: 'relative',
  gridColumns: {
    '': '1sf',
    prefix: 'max-content 1sf',
    suffix: '1sf max-content',
    'prefix & suffix': 'max-content 1sf max-content',
  },
  gridRows: '1sf',
  placeItems: 'stretch',
  fill: {
    '': '#white',
    disabled: '#dark.04',
  },
  border: {
    '': true,
    valid: '#success-text.50',
    invalid: '#danger-text.50',
    focused: '#purple-text',
    'valid & focused': '#success-text',
    'invalid & focused': '#danger-text',
    disabled: true,
  },
  preset: 't3',
  radius: true,
  cursor: 'text',
  color: {
    '': '#dark-02',
    focused: '#dark-02',
    invalid: '#danger-text',
    disabled: '#dark.30',
  },
  zIndex: {
    '': 'initial',
    focused: 1,
  },
  boxSizing: 'border-box',
  transition: 'theme',
  backgroundClip: 'content-box',
  height: {
    '': '$size $size',
    multiline: 'min $size',
  },

  $size: {
    '': '$size-md',
    'size=small': '$size-sm',
    'size=medium': '$size-md',
    'size=large': '$size-lg',
  },

  Prefix: ADD_STYLES,

  Suffix: ADD_STYLES,

  State: {
    display: 'flex',
  },

  InputIcon: {
    display: 'grid',
    placeItems: 'center',
    width: 'min $size-sm',
    color: 'inherit',
    fontSize: '$icon-size',
  },

  ValidationIcon: {
    display: 'grid',
    placeItems: 'center',
    width: {
      '': 'min $size-sm',
      suffix: 'min $size-xs',
    },
    fontSize: '$icon-size',
  },
};

const InputWrapperElement = tasty({
  qa: 'InputWrapper',
  styles: INPUT_WRAPPER_STYLES,
});

const INPUT_STYLE_PROPS_LIST = [...BLOCK_STYLES, 'resize'];

export const DEFAULT_INPUT_STYLES: Styles = {
  placeSelf: 'stretch',
  width: 'initial 100% 100%',
  color: 'inherit',
  fill: '#clear',
  border: 0,
  transition: 'theme',
  radius: true,
  padding: '$vertical-padding $right-padding $vertical-padding $left-padding',
  textAlign: 'left',
  reset: 'input',
  preset: 't3',
  flexGrow: 1,
  margin: {
    '': 0,
    multiline: '((($size-md - 1lh) / 2) - 1bw) 0',
    'multiline & size=small': '((($size-sm - 1lh) / 2) - 1bw) 0',
    'multiline & size=large': '((($size-lg - 1lh) / 2) - 1bw) 0',
  },
  resize: 'none',
  boxSizing: 'border-box',
  userSelect: 'auto',
  outline: 0,

  '$vertical-padding': 0,
  '$left-padding': {
    '': '(1x - 1bw)',
    'size=small': '(1x - 1bw)',
    'size=large': '(1.25x - 1bw)',
    'size=xlarge': '(1.5x - 1bw)',
    prefix: '0',
  },
  '$right-padding': {
    '': '(1x - 1bw)',
    'size=small': '(1x - 1bw)',
    'size=large': '(1.25x - 1bw)',
    'size=xlarge': '(1.5x - 1bw)',
    suffix: '0',
  },
};

const InputElement = tasty({ qa: 'Input', styles: DEFAULT_INPUT_STYLES });

export interface CubeTextInputBaseProps
  extends BaseProps,
    OuterStyleProps,
    BlockStyleProps,
    Omit<AriaTextFieldProps, 'validate'>,
    FieldBaseProps {
  validate?: AriaTextFieldProps['validate'] | AriaNumberFieldProps['validate'];
  /** Left input icon */
  icon?: ReactElement | null;
  /** Input decoration before the main input */
  prefix?: ReactNode;
  /** Input decoration after the main input */
  suffix?: ReactNode;
  /** Suffix position goes before or after the validation and loading statuses */
  suffixPosition?: 'before' | 'after';
  /** Whether the input is multiline */
  multiLine?: boolean;
  /** Whether the input should have autofocus */
  autoFocus?: boolean;
  /** Direct input props */
  inputProps?: Props;
  /** Direct input wrapper props */
  wrapperProps?: Props;
  /** The input ref */
  inputRef?: RefObject<HTMLInputElement | HTMLTextAreaElement>;
  /** The wrapper ref */
  wrapperRef?: RefObject<HTMLDivElement>;
  /** Whether the input has the loading status */
  isLoading?: boolean;
  /** The loading status indicator */
  loadingIndicator?: ReactNode;
  /** Style map for the input */
  inputStyles?: Styles;
  /** The number of rows for the input. Only applies to textarea. */
  rows?: number;
  /** The resize CSS property sets whether an element is resizable, and if so, in which directions. */
  resize?: Styles['resize'];
  /** The size of the input */
  size?: 'small' | 'medium' | 'large' | (string & {});
  autocomplete?: string;
}

function _TextInputBase(props: CubeTextInputBaseProps, ref) {
  props = useProviderProps(props);
  props = useFormProps(props);
  props = useFieldProps(props, {
    defaultValidationTrigger: 'onBlur',
    valuePropsMapper: ({ value, onChange }) => ({
      value:
        typeof value === 'string' || typeof value === 'number'
          ? String(value)
          : '',
      onChange,
    }),
  });

  let {
    qa,
    mods,
    validationState,
    prefix,
    isDisabled,
    multiLine,
    autoFocus,
    inputProps,
    wrapperProps,
    inputRef,
    isLoading,
    loadingIndicator,
    value,
    inputStyles = {},
    suffix,
    suffixPosition = 'before',
    wrapperRef,
    tooltip,
    rows = 1,
    size = 'medium',
    autocomplete,
    icon,
    maxLength,
    minLength,
    form,
    ...otherProps
  } = props;

  let styles = extractStyles(otherProps, OUTER_STYLES);
  let type = otherProps.type;

  inputStyles = extractStyles(otherProps, INPUT_STYLE_PROPS_LIST, inputStyles);

  let ElementType: 'textarea' | 'input' = multiLine ? 'textarea' : 'input';
  let { isFocused, focusProps } = useFocus({ isDisabled });
  let { hoverProps, isHovered } = useHover({ isDisabled });
  let domRef = useRef(null);

  inputRef = useCombinedRefs(inputRef);

  // Expose imperative interface for ref
  useImperativeHandle(ref, () => ({
    ...createFocusableRef(domRef, inputRef),
    select() {
      if (inputRef?.current) {
        inputRef.current.select();
      }
    },
    getInputElement() {
      return inputRef?.current;
    },
  }));

  let isInvalid = validationState === 'invalid';
  let validationIcon = isInvalid ? InvalidIcon : ValidIcon;
  let validation = cloneElement(validationIcon);

  // Fix safari bug: https://github.com/philipwalton/flexbugs/issues/270
  if (!inputProps?.placeholder) {
    if (!inputProps) {
      inputProps = {};
    }

    inputProps.placeholder = ' ';
  }

  if (icon) {
    icon = <div data-element="InputIcon">{icon}</div>;

    if (prefix) {
      prefix = (
        <>
          {icon}
          {prefix}
        </>
      );
    } else {
      prefix = icon;
    }
  }

  const modifiers = useMemo(
    () => ({
      invalid: isInvalid,
      valid: validationState === 'valid',
      loadable: !!loadingIndicator,
      focused: isFocused,
      hovered: isHovered,
      disabled: isDisabled,
      multiline: multiLine,
      prefix: !!prefix,
      suffix: (validationState && !isLoading) || isLoading || !!suffix,
      ...mods,
    }),
    [
      mods,
      isInvalid,
      validationState,
      loadingIndicator,
      isFocused,
      isDisabled,
      isHovered,
      multiLine,
      prefix,
      suffix,
    ],
  );

  const hasTextSecurity = multiLine && type === 'password';
  const textSecurityStyles =
    hasTextSecurity && inputProps.value?.length
      ? {
          fontFamily: 'text-security-disc',
        }
      : {};

  const textField = (
    <InputWrapperElement
      ref={wrapperRef}
      mods={modifiers}
      data-size={size}
      styles={styles}
      {...wrapperProps}
    >
      {prefix ? <div data-element="Prefix">{prefix}</div> : null}
      <InputElement
        qa={qa || 'Input'}
        as={ElementType}
        data-input-type="textinput"
        {...mergeProps(inputProps, focusProps, hoverProps)}
        ref={inputRef}
        rows={multiLine ? rows : undefined}
        mods={modifiers}
        style={textSecurityStyles}
        data-autofocus={autoFocus ? '' : undefined}
        autoFocus={autoFocus}
        data-size={size}
        autoComplete={autocomplete}
        styles={inputStyles}
        disabled={!!isDisabled}
        maxLength={maxLength}
        minLength={minLength}
      />
      {(validationState && !isLoading) || isLoading || suffix ? (
        <div data-element="Suffix">
          {suffixPosition === 'before' ? suffix : null}
          {(validationState && !isLoading) || isLoading ? (
            <div data-element="State">
              {validationState && !isLoading ? validation : null}
              {isLoading && <LoadingIcon data-element="InputIcon" />}
            </div>
          ) : null}
          {suffixPosition === 'after' ? suffix : null}
        </div>
      ) : null}
    </InputWrapperElement>
  );

  return wrapWithField(textField, domRef, {
    ...props,
    form: undefined,
  });
}

const TextInputBase = forwardRef(_TextInputBase);

export { TextInputBase };
export type { AriaTextFieldProps };
